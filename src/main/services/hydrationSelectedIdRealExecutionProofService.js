const { EvidenceRepository } = require('../db/evidenceRepository');
const { HttpClient } = require('../api/httpClient');
const { EsiClient } = require('../api/esiClient');
const { applyResolvedNames } = require('../metadata/reportHydrator');
const { enterLiveProviderAttempt } = require('./liveApiGateService');
const { buildHydrationPickupContractPreview } = require('./hydrationPickupContractService');

const TARGET = Object.freeze({
  id_type: 'character',
  id_value: 92418041
});
const LABEL_MAX_LENGTH = 120;

async function buildHydrationSelectedIdRealExecutionProof(db, input = {}, context = {}) {
  const validation = validateTrustedContext(context);
  const requestFacts = requestFactsFor(input);
  const before = stateSnapshot(db);
  if (!validation.valid) {
    return proofResult({
      validation,
      requestFacts,
      before,
      after: before,
      pickupContract: null,
      liveAttempt: null,
      providerValidation: null,
      metadataRun: null,
      writeResult: null,
      outcome: 'blocked_trusted_context',
      providerCalls: 0
    });
  }

  const inputValidation = validateSelectedId(requestFacts);
  if (!inputValidation.valid) {
    return proofResult({
      validation: inputValidation,
      requestFacts,
      before,
      after: before,
      pickupContract: null,
      liveAttempt: null,
      providerValidation: null,
      metadataRun: null,
      writeResult: null,
      outcome: 'blocked_selected_id',
      providerCalls: 0
    });
  }

  const pickupContract = buildHydrationPickupContractPreview(db, requestFacts, context);
  const localShortCircuit = localLabelState(db, requestFacts);
  if (localShortCircuit.local_label) {
    return proofResult({
      validation,
      requestFacts,
      before,
      after: stateSnapshot(db),
      pickupContract,
      liveAttempt: null,
      providerValidation: {
        valid: false,
        status: 'local_label_short_circuit',
        issues: ['local_label_available_before_provider_contact'],
        local_label: localShortCircuit.local_label,
        local_label_basis: localShortCircuit.local_label_basis
      },
      metadataRun: null,
      writeResult: null,
      outcome: 'local_label_short_circuit',
      providerCalls: 0
    });
  }

  const pickupValidation = validatePickupContract(pickupContract);
  if (!pickupValidation.valid) {
    return proofResult({
      validation: pickupValidation,
      requestFacts,
      before,
      after: stateSnapshot(db),
      pickupContract,
      liveAttempt: null,
      providerValidation: pickupValidation,
      metadataRun: null,
      writeResult: null,
      outcome: pickupValidation.status,
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
    return proofResult({
      validation: {
        valid: false,
        status: 'live_provider_gate_blocked',
        issues: [error.code || 'live_provider_gate_blocked'],
        details: error.details || null
      },
      requestFacts,
      before,
      after: stateSnapshot(db),
      pickupContract,
      liveAttempt: error.details || null,
      providerValidation: null,
      metadataRun: null,
      writeResult: null,
      outcome: 'live_provider_gate_blocked',
      providerCalls: 0
    });
  }

  const repository = new EvidenceRepository(db);
  const run = repository.createMetadataRun({
    trigger: 'trusted_proof',
    runType: 'selected_id_real_hydration_execution_proof',
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
    if (!providerValidation.valid) {
      const apiCounts = apiCountsForRun(db, run.run_id);
      repository.finalizeMetadataRun(run.run_id, {
        candidates_considered: 1,
        ids_discovered: 1,
        requested_from_esi: 1,
        resolved: 0,
        unresolved: 1,
        entities_upserted: 0,
        activity_events_patched: 0,
        api_calls_esi: apiCounts.esi
      }, 'failed', null, providerValidation.issues.join('; '));
      return proofResult({
        validation,
        requestFacts,
        before,
        after: stateSnapshot(db),
        pickupContract,
        liveAttempt,
        providerValidation,
        metadataRun: metadataRun(db, run.run_id),
        writeResult: null,
        outcome: 'provider_response_rejected',
        providerCalls: callCounter.count,
        providerCallLog: callCounter.calls
      });
    }

    const writeResult = applyResolvedNames(db, [providerValidation.normalized]);
    const apiCounts = apiCountsForRun(db, run.run_id);
    repository.finalizeMetadataRun(run.run_id, {
      candidates_considered: 1,
      ids_discovered: 1,
      already_known: 0,
      requested_from_esi: 1,
      resolved: 1,
      unresolved: 0,
      entities_upserted: writeResult.entitiesUpserted,
      types_upserted: 0,
      activity_events_patched: writeResult.activityEventsPatched,
      api_calls_esi: apiCounts.esi
    }, 'success', 'selected-ID real Hydration proof completed');

    return proofResult({
      validation,
      requestFacts,
      before,
      after: stateSnapshot(db),
      pickupContract,
      liveAttempt,
      providerValidation,
      metadataRun: metadataRun(db, run.run_id),
      writeResult,
      outcome: 'success',
      providerCalls: callCounter.count,
      providerCallLog: callCounter.calls
    });
  } catch (error) {
    const apiCounts = apiCountsForRun(db, run.run_id);
    repository.finalizeMetadataRun(run.run_id, {
      candidates_considered: 1,
      ids_discovered: 1,
      requested_from_esi: callCounter.count > 0 ? 1 : 0,
      resolved: 0,
      unresolved: 1,
      entities_upserted: 0,
      activity_events_patched: 0,
      api_calls_esi: apiCounts.esi
    }, 'failed', null, error.message);
    return proofResult({
      validation: {
        valid: false,
        status: 'provider_error',
        issues: [error.code || error.message]
      },
      requestFacts,
      before,
      after: stateSnapshot(db),
      pickupContract,
      liveAttempt,
      providerValidation: null,
      metadataRun: metadataRun(db, run.run_id),
      writeResult: null,
      outcome: 'provider_error',
      providerCalls: callCounter.count,
      providerCallLog: callCounter.calls
    });
  }
}

function validateTrustedContext(context = {}) {
  const issues = [];
  if (context.source === 'renderer') {
    issues.push('renderer_not_allowed_to_invoke_selected_id_real_hydration_execution_proof');
  }
  if (context.allowHydrationSelectedIdRealExecutionProof !== true) {
    issues.push('trusted_selected_id_real_hydration_execution_context_required');
  }
  if (context.controlledTempAtlasStore !== true) {
    issues.push('controlled_temp_atlas_store_required');
  }
  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'trusted_selected_id_real_hydration_execution_context_valid' : uniqueIssues[0],
    issues: uniqueIssues
  };
}

function validateSelectedId(requestFacts) {
  const issues = [];
  if (requestFacts.id_type !== TARGET.id_type) {
    issues.push('first_real_proof_supports_character_only');
  }
  if (requestFacts.id_value !== TARGET.id_value) {
    issues.push('selected_id_must_match_human_provided_controlled_target');
  }
  if (!Number.isSafeInteger(requestFacts.id_value) || requestFacts.id_value <= 0) {
    issues.push('invalid_selected_id');
  }
  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'selected_id_valid' : uniqueIssues[0],
    issues: uniqueIssues
  };
}

function validatePickupContract(contract = {}) {
  const postureState = contract.request_posture?.request_posture_state || null;
  const providerPosture = contract.request_posture?.provider_posture || null;
  const reasonCodes = contract.request_posture?.reason_codes || [];
  const issues = [];
  if (postureState !== 'provider_needed') {
    issues.push(`request_posture_not_provider_needed:${postureState || 'unknown'}`);
  }
  if (providerPosture !== 'released_to_normal_gates_only') {
    issues.push(`provider_posture_not_released:${providerPosture || 'unknown'}`);
  }
  if (contract.pickup_contract?.pickup_candidate !== true) {
    issues.push('pickup_contract_not_candidate');
  }
  const uniqueIssues = [...new Set(issues)];
  const status = pickupRejectionStatus({ postureState, providerPosture, reasonCodes, fallback: uniqueIssues[0] });
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'pickup_revalidated_for_real_provider_attempt' : status,
    issues: uniqueIssues,
    posture_state: postureState,
    provider_posture: providerPosture
  };
}

function pickupRejectionStatus({ postureState, providerPosture, reasonCodes, fallback }) {
  if (providerPosture === 'held_by_external_io' || reasonCodes.includes('held_by_external_io')) {
    return 'external_io_held';
  }
  if (reasonCodes.some((code) => String(code).includes('blocked_by_storage_write_posture'))) {
    return 'storage_write_blocked';
  }
  if (reasonCodes.includes('LIVE_API_DISABLED') || reasonCodes.includes('USER_AGENT_MISSING') || reasonCodes.some((code) => String(code).includes('live_gate'))) {
    return 'live_provider_gate_blocked';
  }
  if (postureState === 'blocked') {
    return 'provider_or_storage_gate_blocked';
  }
  return fallback || 'pickup_contract_not_candidate';
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
  if (!name) {
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

function proofResult({
  validation,
  requestFacts,
  before,
  after,
  pickupContract,
  liveAttempt,
  providerValidation,
  metadataRun,
  writeResult,
  outcome,
  providerCalls,
  providerCallLog = []
}) {
  return {
    action: 'metadata.hydration_selected_id_real_execution_proof',
    classification: 'trusted non-renderer selected-ID real Hydration execution proof',
    generated_at: new Date().toISOString(),
    read_only: false,
    mutates_state: outcome === 'success' || outcome === 'provider_response_rejected' || outcome === 'provider_error',
    renderer_eligible: false,
    trusted_context_only: true,
    controlled_temp_store_only: true,
    real_operator_corpus_mutated: false,
    selected_id: {
      id_type: requestFacts.id_type,
      id_value: requestFacts.id_value
    },
    outcome,
    validation_result: validation,
    pickup_contract_summary: pickupContract ? {
      pickup_candidate: pickupContract.pickup_contract?.pickup_candidate === true,
      request_posture_state: pickupContract.request_posture?.request_posture_state || null,
      provider_posture: pickupContract.request_posture?.provider_posture || null,
      execution_input_hints_only: pickupContract.future_execution_contract?.input_is_hints_only === true,
      pickup_is_authorization: false
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
    write_summary: writeResult ? {
      metadata_run_writes: before.counts.metadata_runs + 1 === after.counts.metadata_runs ? 1 : 0,
      api_request_log_writes: after.counts.api_request_logs - before.counts.api_request_logs,
      entities_upserted: writeResult.entitiesUpserted,
      activity_event_label_patches: writeResult.activityEventsPatched,
      types_upserted: writeResult.typesUpserted
    } : {
      metadata_run_writes: after.counts.metadata_runs - before.counts.metadata_runs,
      api_request_log_writes: after.counts.api_request_logs - before.counts.api_request_logs,
      entities_upserted: 0,
      activity_event_label_patches: 0,
      types_upserted: 0
    },
    before,
    after,
    invariants: invariants(before, after, writeResult),
    evidence_boundary: {
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
      'Trusted non-renderer selected-ID real Hydration execution proof only.',
      'Uses a controlled temp/test Atlas store and never mutates the real operator corpus.',
      'Calls only ESI /universe/names for exactly one selected ID after local-first posture, pickup, External I/O, live/provider, and storage/write revalidation.',
      'Writes only Hydration/readability rows: metadata_runs, sanitized api_request_logs when provider contact occurs, selected entities row, and matching activity_events label columns.',
      'Does not mutate Evidence/EVEidence, Discovery refs, raw killmail payloads, numeric activity facts, Watch, Marked, Assessment Memory, storage config, External I/O config, Bucket/Dispatcher state, schema, runtime enforcement, support artifacts, UI, or the parked fourth lane.'
    ]
  };
}

function requestFactsFor(input = {}) {
  const request = input.request_facts || input.requestFacts || input.request || input;
  return {
    ...request,
    id_type: normalizeIdType(request.id_type || request.idType || request.type || 'character'),
    id_value: normalizeIdValue(request.id_value ?? request.idValue ?? request.id ?? TARGET.id_value),
    operator_act: request.operator_act ?? request.operatorAct ?? true,
    source_surface: request.source_surface || request.sourceSurface || 'trusted-selected-id-real-hydration-execution-proof',
    source_context: request.source_context || request.sourceContext || null,
    basis_anchor: request.basis_anchor || request.basisAnchor || null,
    basis_layer: request.basis_layer || request.basisLayer || 'activity_events',
    externalIo: request.externalIo || request.external_io || { state: request.externalIoState || request.external_io_state || 'on' }
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

function invariants(before, after, writeResult) {
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
      before.counts.data_quality_warnings === after.counts.data_quality_warnings &&
      (!writeResult || before.counts.entities + 1 === after.counts.entities)
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
  const normalized = normalizeIdType(value);
  return normalized;
}

function normalizeIdType(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/-/g, '_');
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
  buildHydrationSelectedIdRealExecutionProof
};
