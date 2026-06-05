const { EvidenceRepository } = require('../db/evidenceRepository');
const { applyResolvedNames } = require('../metadata/reportHydrator');
const { buildHydrationPickupContractPreview } = require('./hydrationPickupContractService');

const PROVIDER_ID_TYPES = Object.freeze(['character', 'corporation', 'alliance']);
const REJECTED_POSTURE_STATES = Object.freeze([
  'not_a_request',
  'invalid',
  'insufficient_basis',
  'already_local',
  'local_lookup_available',
  'held',
  'blocked'
]);
const LABEL_MAX_LENGTH = 120;

function buildHydrationSelectedIdExecutionFixtureProof(db, input = {}, context = {}) {
  const validation = validateFixtureContext(context);
  const forgedPayloadIgnored = hasForgedExecutionAuthority(input);
  if (!validation.valid) {
    return proofResult({
      validation,
      forgedPayloadIgnored,
      before: null,
      after: null,
      pickupContract: null,
      providerValidation: null,
      run: null,
      writeResult: null,
      outcome: 'blocked_fixture_context'
    });
  }

  const before = stateSnapshot(db);
  const requestFacts = requestFactsFor(input);
  const pickupContract = buildHydrationPickupContractPreview(db, requestFacts, {
    ...context,
    externalIoState: requestFacts.externalIo.state
  });
  if (pickupContract.request_posture?.request_posture_state === 'already_local') {
    return finalizeRejectedRun({
      db,
      validation,
      forgedPayloadIgnored,
      before,
      pickupContract,
      providerValidation: {
        valid: false,
        status: 'local_label_short_circuit',
        issues: ['local_label_available_before_fixture_provider_execution']
      },
      outcome: 'local_label_short_circuit'
    });
  }
  const revalidation = validateRebuiltPickup(pickupContract);
  if (!revalidation.valid) {
    return finalizeRejectedRun({
      db,
      validation,
      forgedPayloadIgnored,
      before,
      pickupContract,
      providerValidation: revalidation,
      outcome: 'revalidation_rejected'
    });
  }

  const localShortCircuit = localLabelState(db, requestFacts);
  if (localShortCircuit.local_label) {
    return finalizeRejectedRun({
      db,
      validation,
      forgedPayloadIgnored,
      before,
      pickupContract,
      providerValidation: {
        valid: false,
        status: 'local_label_short_circuit',
        issues: ['local_label_available_before_fixture_provider_execution'],
        local_label: localShortCircuit.local_label,
        local_label_basis: localShortCircuit.local_label_basis
      },
      outcome: 'local_label_short_circuit'
    });
  }

  const providerValidation = validateFixtureProviderResponse(input.fixtureProviderResponse || input.fixture_provider_response, requestFacts);
  if (!providerValidation.valid) {
    return finalizeRejectedRun({
      db,
      validation,
      forgedPayloadIgnored,
      before,
      pickupContract,
      providerValidation,
      outcome: 'provider_response_rejected',
      attemptedProvider: shouldLogFixtureProviderAttempt(input)
    });
  }

  return executeFixtureWrite({
    db,
    input,
    validation,
    forgedPayloadIgnored,
    before,
    pickupContract,
    providerValidation,
    requestFacts
  });
}

function executeFixtureWrite({
  db,
  input,
  validation,
  forgedPayloadIgnored,
  before,
  pickupContract,
  providerValidation,
  requestFacts
}) {
  const repository = new EvidenceRepository(db);
  const run = repository.createMetadataRun({
    trigger: 'fixture_test',
    runType: 'selected_id_execution_fixture_proof',
    targetType: requestFacts.id_type,
    targetId: String(requestFacts.id_value)
  });
  let writeResult = null;

  try {
    if (shouldLogFixtureProviderAttempt(input)) {
      insertFixtureApiLog(repository, run.run_id, input.fixtureProviderAttempt || input.fixture_provider_attempt || {});
    }
    writeResult = applyResolvedNames(db, [{
      id: requestFacts.id_value,
      category: requestFacts.id_type,
      name: providerValidation.normalized.name
    }]);
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
      api_calls_esi: shouldLogFixtureProviderAttempt(input) ? 1 : 0
    }, 'success', 'fixture provider result injected; no live provider call');
  } catch (error) {
    repository.finalizeMetadataRun(run.run_id, {
      candidates_considered: 1,
      ids_discovered: 1,
      requested_from_esi: shouldLogFixtureProviderAttempt(input) ? 1 : 0,
      resolved: 0,
      unresolved: 1,
      entities_upserted: 0,
      activity_events_patched: 0,
      api_calls_esi: shouldLogFixtureProviderAttempt(input) ? 1 : 0
    }, 'failed', null, error.message);
    throw error;
  }

  const after = stateSnapshot(db);
  return proofResult({
    validation,
    forgedPayloadIgnored,
    before,
    after,
    pickupContract,
    providerValidation,
    run: metadataRun(db, run.run_id),
    writeResult,
    outcome: 'success'
  });
}

function finalizeRejectedRun({
  db,
  validation,
  forgedPayloadIgnored,
  before,
  pickupContract,
  providerValidation,
  outcome,
  attemptedProvider = false
}) {
  const repository = new EvidenceRepository(db);
  const request = pickupContract?.pickup_contract?.future_execution_input_hints || pickupContract?.request_posture || {};
  const run = repository.createMetadataRun({
    trigger: 'fixture_test',
    runType: 'selected_id_execution_fixture_proof',
    targetType: request.id_type || 'unknown',
    targetId: String(request.id_value || 'unknown')
  });
  if (attemptedProvider) {
    insertFixtureApiLog(repository, run.run_id, {});
  }
  repository.finalizeMetadataRun(run.run_id, {
    candidates_considered: 1,
    ids_discovered: 1,
    already_known: outcome === 'local_label_short_circuit' ? 1 : 0,
    requested_from_esi: attemptedProvider ? 1 : 0,
    resolved: 0,
    unresolved: outcome === 'local_label_short_circuit' ? 0 : 1,
    entities_upserted: 0,
    types_upserted: 0,
    activity_events_patched: 0,
    api_calls_esi: attemptedProvider ? 1 : 0
  }, outcome === 'provider_response_rejected' ? 'failed' : 'partial', providerValidation.status, providerValidation.issues?.join('; ') || null);
  const after = stateSnapshot(db);
  return proofResult({
    validation,
    forgedPayloadIgnored,
    before,
    after,
    pickupContract,
    providerValidation,
    run: metadataRun(db, run.run_id),
    writeResult: null,
    outcome
  });
}

function validateFixtureContext(context = {}) {
  const issues = [];
  if (context.source === 'renderer') {
    issues.push('renderer_not_allowed_to_invoke_selected_id_execution_fixture');
  }
  if (context.allowHydrationSelectedIdExecutionFixtureProof !== true) {
    issues.push('trusted_selected_id_execution_fixture_context_required');
  }
  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'selected_id_execution_fixture_valid' : uniqueIssues[0],
    issues: uniqueIssues,
    fixture_offline_only: true
  };
}

function requestFactsFor(input = {}) {
  const request = input.request_facts || input.requestFacts || input.request || input;
  return {
    ...request,
    id_type: normalizeIdType(request.id_type || request.idType || request.type),
    id_value: normalizeIdValue(request.id_value ?? request.idValue ?? request.id),
    operator_act: request.operator_act ?? request.operatorAct ?? true,
    source_surface: request.source_surface || request.sourceSurface || 'fixture-selected-id-execution',
    source_context: request.source_context || request.sourceContext || null,
    basis_anchor: request.basis_anchor || request.basisAnchor || null,
    basis_layer: request.basis_layer || request.basisLayer || null,
    externalIo: request.externalIo || request.external_io || { state: request.externalIoState || request.external_io_state || 'on' }
  };
}

function validateRebuiltPickup(contract = {}) {
  const postureState = contract.request_posture?.request_posture_state || null;
  const providerPosture = contract.request_posture?.provider_posture || null;
  const idType = contract.pickup_contract?.future_execution_input_hints?.id_type || null;
  const idValue = Number(contract.pickup_contract?.future_execution_input_hints?.id_value);
  const issues = [];
  if (!PROVIDER_ID_TYPES.includes(idType)) {
    issues.push('unsupported_provider_hydration_id_type');
  }
  if (!Number.isSafeInteger(idValue) || idValue <= 0) {
    issues.push('invalid_selected_id');
  }
  if (REJECTED_POSTURE_STATES.includes(postureState)) {
    issues.push(`rejected_request_posture:${postureState}`);
  }
  if (postureState !== 'provider_needed') {
    issues.push('rebuilt_posture_not_provider_needed');
  }
  if (providerPosture !== 'released_to_normal_gates_only') {
    issues.push('provider_posture_not_released_to_normal_gates');
  }
  if (contract.pickup_contract?.pickup_candidate !== true) {
    issues.push('pickup_contract_not_candidate');
  }
  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'revalidated_for_fixture_provider_response' : uniqueIssues[0],
    issues: uniqueIssues,
    posture_state: postureState,
    provider_posture: providerPosture
  };
}

function validateFixtureProviderResponse(response, requestFacts) {
  const issues = [];
  const id = normalizeIdValue(response?.id ?? response?.entity_id ?? response?.entityId);
  const category = normalizeIdType(response?.category || response?.entity_type || response?.entityType);
  const name = safeLabel(response?.name || response?.entity_name || response?.label);
  if (!response || typeof response !== 'object') {
    issues.push('fixture_provider_response_missing');
  }
  if (id !== requestFacts.id_value) {
    issues.push('fixture_provider_response_id_mismatch');
  }
  if (category !== requestFacts.id_type) {
    issues.push('fixture_provider_response_category_mismatch');
  }
  if (!PROVIDER_ID_TYPES.includes(category)) {
    issues.push('fixture_provider_response_unsupported_category');
  }
  if (!name) {
    issues.push('fixture_provider_response_label_missing_or_unsafe');
  }
  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'fixture_provider_response_valid' : uniqueIssues[0],
    issues: uniqueIssues,
    normalized: uniqueIssues.length === 0 ? { id, category, name } : null
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

function insertFixtureApiLog(repository, runId, attempt = {}) {
  repository.insertApiRequestLog({
    request_id: attempt.request_id,
    run_id: runId,
    run_type: 'metadata',
    provider: 'esi',
    endpoint: attempt.endpoint || 'fixture://esi/universe/names',
    method: 'POST',
    status_code: attempt.status_code || 200,
    duration_ms: attempt.duration_ms || 1,
    cache_status: 'fixture',
    retry_count: 0,
    rate_limited: 0,
    error_message: attempt.error_message || null,
    requested_at: attempt.requested_at
  });
}

function proofResult({
  validation,
  forgedPayloadIgnored,
  before,
  after,
  pickupContract,
  providerValidation,
  run,
  writeResult,
  outcome
}) {
  return {
    action: 'metadata.hydration_selected_id_execution_fixture_proof',
    classification: 'fixture-only selected-ID Hydration execution proof',
    generated_at: new Date().toISOString(),
    read_only: false,
    mutates_state: validation.valid === true,
    fixture_offline_only: true,
    renderer_eligible: false,
    real_operator_hydration: false,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_live_calls: 0,
    fixture_provider_results_only: true,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    queue_dispatches: 0,
    pickup_persistence: false,
    request_persistence: false,
    lease_persistence: false,
    retry_persistence: false,
    dispatcher_created: false,
    worker_created: false,
    watch_state_mutations: 0,
    marked_mutations: 0,
    assessment_memory_mutations: 0,
    storage_config_writes: 0,
    external_io_config_writes: 0,
    support_artifacts_created: 0,
    schema_changes: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    fourth_lane_reopened: false,
    validation_result: validation,
    forged_payload_authority_ignored: forgedPayloadIgnored,
    execution_revalidation: providerValidation,
    pickup_contract_summary: pickupContract ? {
      action: pickupContract.action,
      pickup_candidate: pickupContract.pickup_contract?.pickup_candidate === true,
      request_posture_state: pickupContract.request_posture?.request_posture_state || null,
      provider_posture: pickupContract.request_posture?.provider_posture || null,
      execution_input_hints_only: pickupContract.future_execution_contract?.input_is_hints_only === true
    } : null,
    outcome,
    write_summary: writeResult ? {
      metadata_run_writes: 1,
      api_request_log_writes: after.counts.api_request_logs - before.counts.api_request_logs,
      entities_upserted: writeResult.entitiesUpserted,
      activity_event_label_patches: writeResult.activityEventsPatched,
      types_upserted: writeResult.typesUpserted
    } : {
      metadata_run_writes: run ? 1 : 0,
      api_request_log_writes: before && after ? after.counts.api_request_logs - before.counts.api_request_logs : 0,
      entities_upserted: 0,
      activity_event_label_patches: 0,
      types_upserted: 0
    },
    metadata_run: run ? metadataRunSummary(run) : null,
    before,
    after,
    invariants: invariants(before, after, writeResult),
    evidence_boundary: {
      hydration_outputs_readability_repair: true,
      discovery_outputs_possible_leads: true,
      evidence_expansion_outputs_evidence: true,
      numeric_ids_remain_facts: true,
      raw_killmail_payloads_mutated: false,
      creates_evidence: false,
      discovery_refs_are_evidence: false,
      provider_needed_labels_are_evidence_work: false
    },
    boundary: [
      'Fixture-only selected-ID Hydration execution proof; it uses injected provider results and makes no live/API/provider calls.',
      'It rebuilds request posture and pickup contract from trusted local state before fixture response validation.',
      'It writes Hydration/readability provenance only: metadata_runs, optional sanitized api_request_logs, selected entity label, and matching activity_events label columns.',
      'It does not mutate Evidence/EVEidence, raw killmail payloads, numeric activity facts, Discovery refs, Watch, Marked, Assessment Memory, queues, schema, storage config, External I/O config, support artifacts, runtime enforcement, renderer UI, or the parked fourth lane.'
    ]
  };
}

function invariants(before, after, writeResult) {
  if (!before || !after) {
    return null;
  }
  return {
    numeric_activity_event_ids_unchanged: stableJson(before.activity_event_ids) === stableJson(after.activity_event_ids),
    raw_killmail_payloads_unchanged: stableJson(before.killmails) === stableJson(after.killmails),
    discovered_refs_unchanged: stableJson(before.discovered_refs) === stableJson(after.discovered_refs),
    fetch_runs_unchanged: stableJson(before.fetch_runs) === stableJson(after.fetch_runs),
    watch_rows_unchanged: stableJson(before.watch_rows) === stableJson(after.watch_rows),
    assessment_rows_unchanged: stableJson(before.assessment_rows) === stableJson(after.assessment_rows),
    only_expected_tables_changed: (
      before.counts.metadata_runs + 1 === after.counts.metadata_runs &&
      before.counts.killmails === after.counts.killmails &&
      before.counts.discovered_killmail_refs === after.counts.discovered_killmail_refs &&
      before.counts.fetch_runs === after.counts.fetch_runs &&
      before.counts.watchlist_entities === after.counts.watchlist_entities &&
      before.counts.system_watches === after.counts.system_watches &&
      before.counts.assessment_artifacts === after.counts.assessment_artifacts &&
      (writeResult ? before.counts.entities + 1 === after.counts.entities : before.counts.entities === after.counts.entities)
    )
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
      assessment_artifacts: count(db, 'assessment_artifacts')
    },
    killmails: db.prepare('SELECT killmail_id, killmail_hash, killmail_time, solar_system_id, raw_esi_payload, raw_payload_checksum FROM killmails ORDER BY killmail_id').all(),
    activity_event_ids: db.prepare('SELECT event_key, killmail_id, role, entity_type, entity_id, character_id, corporation_id, alliance_id, ship_type_id, weapon_type_id, solar_system_id, final_blow, damage_done, killmail_time FROM activity_events ORDER BY event_key').all(),
    activity_event_labels: db.prepare('SELECT event_key, entity_name, character_name, corporation_name, alliance_name FROM activity_events ORDER BY event_key').all(),
    discovered_refs: db.prepare('SELECT * FROM discovered_killmail_refs ORDER BY killmail_id, killmail_hash, discovered_by_type, discovered_by_id').all(),
    fetch_runs: db.prepare('SELECT * FROM fetch_runs ORDER BY run_id').all(),
    api_request_logs: db.prepare('SELECT * FROM api_request_logs ORDER BY request_id').all(),
    entities: db.prepare('SELECT * FROM entities ORDER BY entity_type, entity_id').all(),
    watch_rows: {
      actor: db.prepare('SELECT * FROM watchlist_entities ORDER BY watch_id').all(),
      system: db.prepare('SELECT * FROM system_watches ORDER BY watch_id').all()
    },
    assessment_rows: db.prepare('SELECT * FROM assessment_artifacts ORDER BY artifact_id').all()
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
    ids_discovered: run.ids_discovered,
    requested_from_esi: run.requested_from_esi,
    resolved: run.resolved,
    unresolved: run.unresolved,
    entities_upserted: run.entities_upserted,
    activity_events_patched: run.activity_events_patched,
    api_calls_esi: run.api_calls_esi
  };
}

function shouldLogFixtureProviderAttempt(input = {}) {
  return input.logFixtureProviderAttempt === true || input.log_fixture_provider_attempt === true;
}

function hasForgedExecutionAuthority(input = {}) {
  return Boolean(input.pickup_contract || input.pickupContract || input.request_posture || input.requestPosture || input.provider_authority || input.providerAuthority || input.rendererAuthority);
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
  buildHydrationSelectedIdExecutionFixtureProof
};
