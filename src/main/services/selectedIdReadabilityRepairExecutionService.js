const { EvidenceRepository } = require('../db/evidenceRepository');
const { HttpClient } = require('../api/httpClient');
const { EsiClient } = require('../api/esiClient');
const { applyResolvedNames } = require('../metadata/reportHydrator');
const { enterLiveProviderAttempt } = require('./liveApiGateService');
const { buildSelectedIdReadabilityRepairProductPreflight } = require('./selectedIdReadabilityRepairProductPreflightService');

const PROVIDER_ID_TYPES = Object.freeze(['character', 'corporation', 'alliance']);
const LABEL_MAX_LENGTH = 120;
const RUN_TYPE = 'selected_id_readability_repair';

async function runSelectedIdReadabilityRepairExecution(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const requestFacts = requestFactsFor(input);
  const trustValidation = validateTrustedContext(context);
  if (!trustValidation.valid) {
    return executionResult({
      validation: trustValidation,
      requestFacts,
      preflight: null,
      liveAttempt: null,
      providerValidation: null,
      metadataRun: null,
      writeResult: null,
      outcome: 'blocked_trusted_context',
      before,
      after: before,
      providerCalls: 0
    });
  }

  const requestValidation = validateRequestFacts(requestFacts);
  if (!requestValidation.valid) {
    return executionResult({
      validation: requestValidation,
      requestFacts,
      preflight: null,
      liveAttempt: null,
      providerValidation: null,
      metadataRun: null,
      writeResult: null,
      outcome: requestValidation.status,
      before,
      after: stateSnapshot(db),
      providerCalls: 0
    });
  }

  const preflight = buildSelectedIdReadabilityRepairProductPreflight(db, requestFacts, context);
  const preflightValidation = validatePreflight(preflight);
  if (!preflightValidation.valid) {
    return executionResult({
      validation: preflightValidation,
      requestFacts,
      preflight,
      liveAttempt: null,
      providerValidation: null,
      metadataRun: null,
      writeResult: null,
      outcome: preflightValidation.status,
      before,
      after: stateSnapshot(db),
      providerCalls: 0
    });
  }

  const localLabel = localLabelState(db, requestFacts);
  if (localLabel.local_label) {
    return executionResult({
      validation: {
        valid: true,
        status: 'already_readable',
        issues: [],
        local_label: localLabel.local_label,
        local_label_basis: localLabel.local_label_basis
      },
      requestFacts,
      preflight,
      liveAttempt: null,
      providerValidation: null,
      metadataRun: null,
      writeResult: null,
      outcome: 'already_readable',
      before,
      after: stateSnapshot(db),
      providerCalls: 0
    });
  }

  let liveAttempt = null;
  try {
    liveAttempt = enterLiveProviderAttempt('metadata.hydration', {
      idsToRequest: 1,
      targetType: requestFacts.id_type,
      targetId: requestFacts.id_value
    }, context);
  } catch (error) {
    return executionResult({
      validation: {
        valid: false,
        status: gateOutcome(error),
        issues: [error.code || 'live_provider_gate_blocked'],
        details: error.details || null
      },
      requestFacts,
      preflight,
      liveAttempt: error.details || null,
      providerValidation: null,
      metadataRun: null,
      writeResult: null,
      outcome: gateOutcome(error),
      before,
      after: stateSnapshot(db),
      providerCalls: 0
    });
  }

  const repository = new EvidenceRepository(db);
  const run = repository.createMetadataRun({
    trigger: 'resolve',
    runType: RUN_TYPE,
    targetType: requestFacts.id_type,
    targetId: String(requestFacts.id_value)
  });
  const callCounter = context.providerCallCounter || { count: 0, calls: [] };
  const httpClient = context.httpClient || new HttpClient({
    repository,
    runId: run.run_id,
    runType: 'metadata',
    signal: context.signal,
    timeoutMs: context.timeoutMs || 15000,
    maxAttempts: context.maxAttempts || 1,
    fetchImpl: countedFetch(context.fetchImpl || fetch, callCounter)
  });
  httpClient.repository = httpClient.repository || repository;
  httpClient.runId = httpClient.runId || run.run_id;
  httpClient.runType = httpClient.runType || 'metadata';
  const esiClient = context.esiClient || new EsiClient(httpClient);

  try {
    const response = await esiClient.resolveNames([requestFacts.id_value]);
    const providerValidation = validateProviderResponse(response, requestFacts);
    if (providerValidation.status === 'provider_response_selected_id_missing') {
      finalizeRun(db, repository, run.run_id, {
        status: 'partial',
        requestedFromEsi: 1,
        resolved: 0,
        unresolved: 1,
        error: null,
        warning: 'selected ID unresolved by ESI /universe/names'
      });
      return executionResult({
        validation: { valid: true, status: 'provider_unresolved_partial', issues: ['provider_response_selected_id_missing'] },
        requestFacts,
        preflight,
        liveAttempt,
        providerValidation,
        metadataRun: metadataRun(db, run.run_id),
        writeResult: null,
        outcome: 'partial_unresolved',
        before,
        after: stateSnapshot(db),
        providerCalls: callCounter.count,
        providerCallLog: callCounter.calls
      });
    }
    if (!providerValidation.valid) {
      finalizeRun(db, repository, run.run_id, {
        status: 'failed',
        requestedFromEsi: 1,
        resolved: 0,
        unresolved: 1,
        error: providerValidation.issues.join('; ')
      });
      return executionResult({
        validation: providerValidation,
        requestFacts,
        preflight,
        liveAttempt,
        providerValidation,
        metadataRun: metadataRun(db, run.run_id),
        writeResult: null,
        outcome: 'provider_response_rejected',
        before,
        after: stateSnapshot(db),
        providerCalls: callCounter.count,
        providerCallLog: callCounter.calls
      });
    }

    const recheck = localLabelState(db, requestFacts);
    if (recheck.local_label) {
      finalizeRun(db, repository, run.run_id, {
        status: 'success',
        requestedFromEsi: 1,
        resolved: 1,
        unresolved: 0,
        warning: 'selected ID became locally readable before write; no label overwrite performed'
      });
      return executionResult({
        validation: {
          valid: true,
          status: 'race_resolved_already_readable',
          issues: [],
          local_label: recheck.local_label,
          local_label_basis: recheck.local_label_basis
        },
        requestFacts,
        preflight,
        liveAttempt,
        providerValidation,
        metadataRun: metadataRun(db, run.run_id),
        writeResult: { entitiesUpserted: 0, activityEventsPatched: 0, typesUpserted: 0 },
        outcome: 'race_resolved_already_readable',
        before,
        after: stateSnapshot(db),
        providerCalls: callCounter.count,
        providerCallLog: callCounter.calls
      });
    }

    const writeResult = applyResolvedNames(db, [providerValidation.normalized]);
    finalizeRun(db, repository, run.run_id, {
      status: 'success',
      requestedFromEsi: 1,
      resolved: 1,
      unresolved: 0,
      entitiesUpserted: writeResult.entitiesUpserted,
      activityEventsPatched: writeResult.activityEventsPatched,
      warning: 'selected-ID Resolve readability repair completed'
    });
    return executionResult({
      validation: { valid: true, status: 'success', issues: [] },
      requestFacts,
      preflight,
      liveAttempt,
      providerValidation,
      metadataRun: metadataRun(db, run.run_id),
      writeResult,
      outcome: 'success',
      before,
      after: stateSnapshot(db),
      providerCalls: callCounter.count,
      providerCallLog: callCounter.calls
    });
  } catch (error) {
    finalizeRun(db, repository, run.run_id, {
      status: 'failed',
      requestedFromEsi: callCounter.count > 0 ? 1 : 0,
      resolved: 0,
      unresolved: 1,
      error: error.message
    });
    return executionResult({
      validation: {
        valid: false,
        status: 'provider_error',
        issues: [error.code || error.message]
      },
      requestFacts,
      preflight,
      liveAttempt,
      providerValidation: null,
      metadataRun: metadataRun(db, run.run_id),
      writeResult: null,
      outcome: 'provider_error',
      before,
      after: stateSnapshot(db),
      providerCalls: callCounter.count,
      providerCallLog: callCounter.calls
    });
  }
}

function validateTrustedContext(context = {}) {
  const issues = [];
  if (context.source === 'renderer') {
    issues.push('renderer_not_allowed_to_invoke_selected_id_readability_repair_execute');
  }
  if (context.allowHydrationSelectedIdRealExecutionProof === true || context.controlledTempAtlasStore === true) {
    issues.push('hs276_proof_scaffolding_not_product_authority');
  }
  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'trusted_non_renderer_context_valid' : uniqueIssues[0],
    issues: uniqueIssues
  };
}

function validateRequestFacts(requestFacts) {
  const issues = [];
  if (requestFacts.operator_act !== true || requestFacts.resolve_intent !== true) {
    issues.push('resolve_operator_act_required');
  }
  if (!PROVIDER_ID_TYPES.includes(requestFacts.id_type)) {
    issues.push('selected_id_not_supported_for_esi_names_hydration');
  }
  if (!Number.isSafeInteger(requestFacts.id_value) || requestFacts.id_value <= 0) {
    issues.push('invalid_selected_id_value');
  }
  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'selected_id_resolve_request_valid' : uniqueIssues[0],
    issues: uniqueIssues
  };
}

function validatePreflight(preflight = {}) {
  const state = preflight.product_preflight_state;
  if (state === 'provider_needed_product_preflight_ready') {
    return { valid: true, status: 'product_preflight_ready', issues: [] };
  }
  return {
    valid: false,
    status: preflightOutcome(state),
    issues: preflight.reason_codes || [],
    preflight_state: state
  };
}

function preflightOutcome(state) {
  if (state === 'local_label_short_circuit') {
    return 'already_readable';
  }
  if (state === 'held_by_external_io') {
    return 'held_by_external_io';
  }
  if (state === 'blocked_by_live_provider_gate') {
    return 'live_provider_gate_blocked';
  }
  if (state === 'blocked_by_storage_write_posture') {
    return 'storage_write_blocked';
  }
  if (state === 'conditional_basis_only') {
    return 'non_authorizing_basis';
  }
  if (state === 'missing_local_basis') {
    return 'missing_local_basis';
  }
  if (state === 'invalid_selected_id') {
    return 'invalid_selected_id';
  }
  return state || 'product_preflight_not_ready';
}

function gateOutcome(error) {
  const code = error?.code || '';
  if (code.includes('COOLDOWN') || code.includes('LOCKOUT')) {
    return 'held_by_provider_cadence';
  }
  return 'live_provider_gate_blocked';
}

function validateProviderResponse(response, requestFacts) {
  const rows = Array.isArray(response) ? response : [];
  const match = rows.find((row) => Number(row?.id) === requestFacts.id_value) || null;
  const issues = [];
  if (!Array.isArray(response)) {
    issues.push('provider_response_not_array');
  }
  if (rows.length > 1) {
    issues.push('provider_response_multiple_rows');
  }
  if (!match) {
    issues.push('provider_response_selected_id_missing');
  }
  const category = normalizeCategory(match?.category);
  const name = safeLabel(match?.name);
  if (match && category !== requestFacts.id_type) {
    issues.push('provider_response_category_mismatch');
  }
  if (match && !name) {
    issues.push('provider_response_label_missing_or_unsafe');
  }
  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'provider_response_valid' : uniqueIssues[0],
    issues: uniqueIssues,
    normalized: uniqueIssues.length === 0 ? {
      id: requestFacts.id_value,
      category,
      name
    } : null,
    raw_row_count: rows.length
  };
}

function finalizeRun(db, repository, runId, options = {}) {
  const apiCounts = apiCountsForRun(db, runId);
  repository.finalizeMetadataRun(runId, {
    candidates_considered: 1,
    ids_discovered: 1,
    requested_from_esi: options.requestedFromEsi || 0,
    resolved: options.resolved || 0,
    unresolved: options.unresolved || 0,
    entities_upserted: options.entitiesUpserted || 0,
    types_upserted: 0,
    activity_events_patched: options.activityEventsPatched || 0,
    api_calls_esi: apiCounts.esi
  }, options.status, options.warning || null, options.error || null);
}

function executionResult({
  validation,
  requestFacts,
  preflight,
  liveAttempt,
  providerValidation,
  metadataRun,
  writeResult,
  outcome,
  before,
  after,
  providerCalls,
  providerCallLog = []
}) {
  return {
    action: 'metadata.selected_id_readability_repair.execute',
    user_facing_act: 'Resolve',
    classification: 'trusted non-renderer selected-ID readability repair execution',
    generated_at: new Date().toISOString(),
    read_only: false,
    mutates_state: Boolean(metadataRun),
    renderer_eligible: false,
    trusted_non_renderer_only: true,
    product_execution: true,
    run_type: RUN_TYPE,
    selected_id: {
      id_type: requestFacts.id_type,
      id_value: requestFacts.id_value
    },
    outcome,
    validation_result: validation,
    preflight_summary: preflight ? {
      product_preflight_state: preflight.product_preflight_state,
      strong_basis_exists: preflight.local_authority?.strong_basis_exists === true,
      parked_basis_authorizes: preflight.local_first?.parked_basis_authorizes_first_product_preflight === true,
      hs276_target_match: preflight.hs276_target_match === true,
      fixed_hs276_id_special: preflight.fixed_hs276_id_special === true
    } : null,
    live_provider_attempt: liveAttempt ? {
      action: liveAttempt.action || 'metadata.hydration',
      allowed: liveAttempt.allowed === true,
      state: liveAttempt.state || null,
      providers: liveAttempt.providers || [],
      estimated_api_calls: liveAttempt.estimated_api_calls || null,
      request_control: liveAttempt.request_control || null,
      accepted_attempt_recorded: liveAttempt.allowed === true
    } : null,
    provider_calls: providerCalls || 0,
    live_api_calls: providerCalls || 0,
    zkill_calls: 0,
    esi_live_calls: providerCalls || 0,
    provider_call_log: providerCallLog,
    provider_validation: providerValidation,
    metadata_run: metadataRun ? metadataRunSummary(metadataRun) : null,
    write_summary: {
      metadata_run_writes: after.counts.metadata_runs - before.counts.metadata_runs,
      api_request_log_writes: after.counts.api_request_logs - before.counts.api_request_logs,
      entities_upserted: writeResult?.entitiesUpserted || 0,
      activity_event_label_patches: writeResult?.activityEventsPatched || 0,
      types_upserted: writeResult?.typesUpserted || 0
    },
    before,
    after,
    invariants: invariants(before, after),
    evidence_boundary: {
      resolve_outputs_readability_repair: true,
      hydration_outputs_readability_repair: true,
      discovery_outputs_possible_leads: true,
      evidence_expansion_outputs_evidence: true,
      ids_are_facts: true,
      labels_are_readability: true,
      creates_evidence: false,
      discovery_refs_are_evidence: false,
      fourth_lane_reopened: false
    },
    forbidden_mutations: {
      evidence_writes: 0,
      discovery_ref_mutations: 0,
      watch_mutations: 0,
      marked_mutations: 0,
      assessment_memory_mutations: 0,
      storage_config_writes: 0,
      external_io_config_writes: 0,
      bucket_persistence: false,
      dispatcher_created: false,
      worker_created: false,
      lease_persistence: false,
      retry_persistence: false,
      queue_dispatches: 0,
      support_artifacts_created: 0,
      schema_changes: 0,
      runtime_enforcement_active: false,
      command_blocking_active: false,
      ui_work: false
    },
    boundary: [
      'Trusted non-renderer selected-ID Resolve execution only.',
      'Resolve repairs readability for one selected unresolved local ID; it does not create Evidence/EVEidence.',
      'Local label short-circuit returns quietly with no provider call, write, or audit row.',
      'Provider contact occurs only after local-first product preflight, storage, External I/O, live/provider, cadence, and command authority gates.',
      'Allowed writes are metadata_runs, sanitized api_request_logs on provider contact, selected entities row, and matching activity_events readability label columns only.'
    ]
  };
}

function requestFactsFor(input = {}) {
  const request = input.request_facts || input.requestFacts || input.request || input;
  const intent = String(request.intent || request.action || request.user_facing_act || request.userFacingAct || '').trim().toLowerCase();
  return {
    id_type: normalizeIdType(request.id_type || request.idType || request.type),
    id_value: normalizeIdValue(request.id_value ?? request.idValue ?? request.id),
    operator_act: request.operator_act ?? request.operatorAct,
    resolve_intent: request.resolve === true || intent === 'resolve',
    source_surface: request.source_surface || request.sourceSurface || 'trusted-selected-id-resolve',
    source_context: request.source_context || request.sourceContext || null,
    basis_anchor: request.basis_anchor || request.basisAnchor || null,
    basis_layer: request.basis_layer || request.basisLayer || null
  };
}

function localLabelState(db, requestFacts) {
  const entity = db.prepare('SELECT entity_name FROM entities WHERE entity_type = ? AND entity_id = ? AND entity_name IS NOT NULL AND TRIM(entity_name) != ?')
    .get(requestFacts.id_type, requestFacts.id_value, '');
  if (entity?.entity_name) {
    return { local_label: entity.entity_name, local_label_basis: 'entities.entity_name' };
  }
  const column = `${requestFacts.id_type}_name`;
  const idColumn = requestFacts.id_type === 'character' ? 'character_id' : requestFacts.id_type === 'corporation' ? 'corporation_id' : 'alliance_id';
  const event = db.prepare(`SELECT ${column} AS label FROM activity_events WHERE ${idColumn} = ? AND ${column} IS NOT NULL AND TRIM(${column}) != '' LIMIT 1`)
    .get(requestFacts.id_value);
  return event?.label ? { local_label: event.label, local_label_basis: `activity_events.${column}` } : { local_label: null, local_label_basis: null };
}

function countedFetch(fetchImpl, counter) {
  return async (endpoint, options = {}) => {
    counter.count += 1;
    counter.calls.push({
      endpoint,
      method: options.method || 'GET',
      body: options.body || null
    });
    return fetchImpl(endpoint, options);
  };
}

function stateSnapshot(db) {
  return {
    counts: {
      killmails: count(db, 'killmails'),
      activity_events: count(db, 'activity_events'),
      discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
      fetch_runs: count(db, 'fetch_runs'),
      api_request_logs: count(db, 'api_request_logs'),
      metadata_runs: count(db, 'metadata_runs'),
      entities: count(db, 'entities'),
      watchlist_entities: count(db, 'watchlist_entities'),
      system_watches: count(db, 'system_watches'),
      assessment_artifacts: count(db, 'assessment_artifacts'),
      ingestion_audits: count(db, 'ingestion_audits'),
      data_quality_warnings: count(db, 'data_quality_warnings')
    },
    killmails: db.prepare('SELECT killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload, raw_payload_checksum FROM killmails ORDER BY killmail_id').all(),
    activity_event_ids: db.prepare('SELECT event_key, killmail_id, role, entity_type, entity_id, character_id, corporation_id, alliance_id, ship_type_id, weapon_type_id, solar_system_id, final_blow, damage_done, killmail_time FROM activity_events ORDER BY event_key').all(),
    activity_event_labels: db.prepare('SELECT event_key, entity_name, character_name, corporation_name, alliance_name FROM activity_events ORDER BY event_key').all(),
    discovered_refs: db.prepare('SELECT * FROM discovered_killmail_refs ORDER BY killmail_id, killmail_hash, discovered_by_type, discovered_by_id').all(),
    fetch_runs: db.prepare('SELECT * FROM fetch_runs ORDER BY run_id').all(),
    ingestion_audits: db.prepare('SELECT * FROM ingestion_audits ORDER BY run_id, killmail_id').all(),
    data_quality_warnings: db.prepare('SELECT * FROM data_quality_warnings ORDER BY warning_id').all(),
    watch_rows: {
      actor: db.prepare('SELECT * FROM watchlist_entities ORDER BY watch_id').all(),
      system: db.prepare('SELECT * FROM system_watches ORDER BY watch_id').all()
    },
    assessment_rows: db.prepare('SELECT * FROM assessment_artifacts ORDER BY artifact_id').all()
  };
}

function invariants(before, after) {
  return {
    raw_killmail_payloads_unchanged: stableJson(before.killmails) === stableJson(after.killmails),
    numeric_activity_event_ids_unchanged: stableJson(before.activity_event_ids) === stableJson(after.activity_event_ids),
    discovered_refs_unchanged: stableJson(before.discovered_refs) === stableJson(after.discovered_refs),
    fetch_runs_unchanged: stableJson(before.fetch_runs) === stableJson(after.fetch_runs),
    ingestion_audits_unchanged: stableJson(before.ingestion_audits) === stableJson(after.ingestion_audits),
    data_quality_warnings_unchanged: stableJson(before.data_quality_warnings) === stableJson(after.data_quality_warnings),
    watch_rows_unchanged: stableJson(before.watch_rows) === stableJson(after.watch_rows),
    assessment_rows_unchanged: stableJson(before.assessment_rows) === stableJson(after.assessment_rows),
    only_allowed_tables_changed: (
      before.counts.killmails === after.counts.killmails &&
      before.counts.discovered_killmail_refs === after.counts.discovered_killmail_refs &&
      before.counts.fetch_runs === after.counts.fetch_runs &&
      before.counts.watchlist_entities === after.counts.watchlist_entities &&
      before.counts.system_watches === after.counts.system_watches &&
      before.counts.assessment_artifacts === after.counts.assessment_artifacts &&
      before.counts.ingestion_audits === after.counts.ingestion_audits &&
      before.counts.data_quality_warnings === after.counts.data_quality_warnings
    )
  };
}

function metadataRun(db, runId) {
  return db.prepare('SELECT * FROM metadata_runs WHERE run_id = ?').get(runId);
}

function metadataRunSummary(run) {
  return {
    run_id: run.run_id,
    run_type: run.run_type,
    target_type: run.target_type,
    target_id: run.target_id,
    status: run.status,
    requested_from_esi: run.requested_from_esi,
    resolved: run.resolved,
    unresolved: run.unresolved,
    entities_upserted: run.entities_upserted,
    activity_events_patched: run.activity_events_patched,
    api_calls_esi: run.api_calls_esi
  };
}

function apiCountsForRun(db, runId) {
  const row = db.prepare('SELECT COUNT(*) AS count FROM api_request_logs WHERE run_id = ? AND provider = ?').get(runId, 'esi');
  return { esi: row?.count || 0 };
}

function normalizeCategory(value) {
  return normalizeIdType(value);
}

function normalizeIdType(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/-/g, '_');
  if (['type', 'ship_type', 'item_type', 'inventory'].includes(normalized)) {
    return 'inventory_type';
  }
  if (['system', 'solar-system'].includes(normalized)) {
    return 'solar_system';
  }
  return normalized || null;
}

function normalizeIdValue(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function safeLabel(value) {
  const label = String(value || '').trim();
  if (!label || label.length > LABEL_MAX_LENGTH) {
    return null;
  }
  if (/[\u0000-\u001F\u007F]/.test(label)) {
    return null;
  }
  return label;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  runSelectedIdReadabilityRepairExecution
};
