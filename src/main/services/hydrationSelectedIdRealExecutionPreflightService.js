const { buildHydrationPickupContractPreview } = require('./hydrationPickupContractService');
const { buildHydrationRequestPosturePreview } = require('./hydrationRequestPostureService');

const SUPPORTED_PROVIDER_ID_TYPES = Object.freeze(['character', 'corporation', 'alliance']);

function buildHydrationSelectedIdRealExecutionPreflight(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const requestFacts = requestFactsFor(input);
  const requestPosture = buildHydrationRequestPosturePreview(db, requestFacts, context);
  const pickupContract = buildHydrationPickupContractPreview(db, requestFacts, context);
  const after = stateSnapshot(db);
  const selectedType = requestPosture.request?.id_type || requestFacts.id_type || null;
  const selectedValue = requestPosture.request?.id_value ?? requestFacts.id_value ?? null;
  const classification = classifyPreflight(requestPosture, pickupContract);
  const supportedType = SUPPORTED_PROVIDER_ID_TYPES.includes(selectedType);
  const localBasis = requestPosture.posture_row?.local_basis || [];
  const localLabel = requestPosture.posture_row?.local_label || null;

  return {
    action: 'metadata.hydration_selected_id_real_execution_preflight.preview',
    classification: 'read-only selected-ID real Hydration execution preflight',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    real_operator_hydration_execution: false,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_live_calls: 0,
    hydration_writes: 0,
    metadata_run_writes: 0,
    api_request_log_writes: 0,
    entity_writes: 0,
    entity_upserts: 0,
    activity_event_label_patches: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    watch_mutations: 0,
    marked_mutations: 0,
    assessment_memory_mutations: 0,
    pickup_persistence: false,
    request_persistence: false,
    bucket_persistence: false,
    bucket_persisted: false,
    dispatcher_created: false,
    dispatcher_active: false,
    worker_created: false,
    lease_persistence: false,
    retry_persistence: false,
    queue_dispatches: 0,
    storage_config_writes: 0,
    external_io_config_writes: 0,
    support_artifacts_created: 0,
    schema_changes: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    selected_id: {
      id_type: selectedType,
      id_value: selectedValue,
      supported_provider_hydration_type: supportedType,
      unsupported_reason: supportedType ? null : 'selected_id_type_not_supported_for_provider_backed_hydration'
    },
    preflight_state: classification.state,
    reason_codes: classification.reason_codes,
    next_safe_action: classification.next_safe_action,
    local_first: {
      short_circuit_to_local_readability: Boolean(localLabel),
      local_label: localLabel,
      local_label_basis: requestPosture.posture_row?.local_label_basis || null,
      local_basis_exists: localBasis.length > 0,
      local_basis: localBasis,
      local_basis_required_for_provider_backed_hydration: true
    },
    request_posture: compactRequestPosture(requestPosture),
    pickup_contract: compactPickupContract(pickupContract),
    external_io: compactExternalIo(requestPosture),
    live_provider_gate: compactLiveGate(requestPosture),
    storage_write_posture: compactStorageWrite(requestPosture),
    command_authority: {
      future_command_required: true,
      confirmation_required_before_real_execution: true,
      command_authority_satisfied_now: false,
      renderer_supplied_authority_is_ignored: true,
      pickup_contract_is_authorization: false,
      fixture_proof_is_live_execution_authority: false
    },
    expected_write_path: {
      writes_authorized_now: false,
      write_path_only_after_provider_response_and_policy_success: true,
      tables: [
        {
          table: 'metadata_runs',
          purpose: 'selected-ID Hydration attempt provenance',
          expected_now_writes: 0
        },
        {
          table: 'api_request_logs',
          purpose: 'optional sanitized ESI metadata/provider provenance',
          expected_now_writes: 0
        },
        {
          table: 'entities',
          purpose: 'selected entity readability label cache',
          expected_now_writes: 0
        },
        {
          table: 'activity_events',
          purpose: 'matching readability label columns only',
          expected_now_writes: 0
        }
      ],
      forbidden_write_classes: [
        'Evidence/EVEidence',
        'Discovery refs',
        'raw killmail payloads',
        'numeric activity facts',
        'Watch',
        'Marked',
        'Assessment Memory',
        'Bucket/Dispatcher state'
      ]
    },
    execution_revalidation_checklist: [
      'confirm explicit operator act for one selected unresolved ID',
      'normalize selected ID and verify provider-backed Hydration-supported type',
      'rebuild local-first request posture from trusted local DB state',
      'short-circuit to local readability if a label is now available',
      'require Atlas local basis before provider-backed Hydration',
      're-read External I/O posture',
      're-read live/provider gate without recording blocked attempts',
      're-read storage write posture for Hydration readability repair',
      'require future command authority and confirmation',
      'only then may a future separately accepted execution command contact a provider'
    ],
    post_provider_write_checklist: [
      'validate provider response ID matches selected ID',
      'validate provider response category matches selected ID type',
      'validate provider label is non-empty, bounded, and safe',
      'recheck local state before writes to avoid stale duplicate repair',
      'write Hydration/readability provenance transactionally',
      'finalize metadata_runs with outcome and counts',
      'write sanitized api_request_logs only if policy allows',
      'upsert selected entities row only',
      'patch only matching activity_events readability label columns',
      'preserve raw Evidence/EVEidence payloads and numeric IDs as facts'
    ],
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    evidence_boundary: {
      hydration_outputs_readability_repair: true,
      discovery_outputs_possible_leads: true,
      evidence_expansion_outputs_evidence: true,
      ids_are_facts: true,
      labels_are_readability: true,
      creates_evidence: false,
      provider_needed_labels_are_evidence_work: false,
      fourth_lane_reopened: false
    },
    boundary: [
      'Read-only selected-ID real execution preflight only; no provider calls, Hydration writes, metadata_runs, api_request_logs, entity writes, activity_event patches, Bucket persistence, Dispatcher, schema, enforcement, or UI.',
      'It composes current local-first posture, pickup contract, External I/O, live/provider gate, storage write posture, supported selected-ID type, expected write path, and revalidation checklists.',
      'Preflight readiness is explanation for a future explicitly accepted execution command; it is not provider-call authorization.',
      'Future execution must rebuild these facts again from trusted local state immediately before external contact.',
      'HS268 fixture proof remains fixture-only and is not live execution authority.'
    ]
  };
}

function requestFactsFor(input = {}) {
  const request = input.request_facts || input.requestFacts || input.request || input;
  return {
    ...request,
    id_type: normalizeIdType(request.id_type || request.idType || request.type),
    id_value: normalizeIdValue(request.id_value ?? request.idValue ?? request.id),
    operator_act: request.operator_act ?? request.operatorAct,
    source_surface: request.source_surface || request.sourceSurface || 'selected-id-real-execution-preflight',
    source_context: request.source_context || request.sourceContext || null,
    basis_anchor: request.basis_anchor || request.basisAnchor || null,
    basis_layer: request.basis_layer || request.basisLayer || null,
    externalIo: request.externalIo || request.external_io || { state: request.externalIoState || request.external_io_state || 'off' }
  };
}

function classifyPreflight(requestPosture = {}, pickupContract = {}) {
  const requestState = requestPosture.request_posture_state || 'unknown';
  const labelState = requestPosture.posture_row?.label_state || null;
  const providerPosture = requestPosture.posture_row?.provider_posture || null;
  const pickupCandidate = pickupContract.pickup_contract?.pickup_candidate === true;
  const liveAllowed = requestPosture.live_provider_gate?.allowed === true;
  const storageBlocked = requestPosture.storage_write_posture?.future_hydration_writes_blocked === true;
  const externalHeld = requestPosture.external_io?.held_by_external_io === true;
  const supported = SUPPORTED_PROVIDER_ID_TYPES.includes(requestPosture.request?.id_type);

  if (requestState === 'not_a_request') {
    return state('not_a_request', ['not_a_request', 'operator_act_required'], 'wait_for_explicit_operator_request');
  }
  if (requestState === 'invalid') {
    return state('invalid', ['invalid', 'unsupported_or_malformed_selected_id'], 'reject_selected_id_without_provider_or_write');
  }
  if (requestState === 'insufficient_basis') {
    return state('insufficient_basis', ['insufficient_basis', 'missing_atlas_local_basis'], 'require_atlas_local_basis_before_hydration_request');
  }
  if (requestState === 'already_local') {
    return state('already_local', ['already_local', 'short_circuit_to_local_readability'], 'use_local_readability_label');
  }
  if (requestState === 'local_lookup_available') {
    return state('local_lookup_available', ['local_lookup_available', 'provider_not_needed'], 'use_or_repair_local_lookup_without_provider');
  }
  if (!supported) {
    return state('invalid', ['invalid', 'unsupported_or_malformed_selected_id'], 'reject_selected_id_without_provider_or_write');
  }
  if (externalHeld || (requestState === 'held' && providerPosture === 'held_by_external_io')) {
    return state('held', ['held', 'held_by_external_io', 'held_is_not_failure'], 'hold_until_external_io_enabled_then_recheck_normal_gates');
  }
  if (storageBlocked) {
    return state('blocked', ['blocked', 'blocked_by_storage_write_posture'], 'do_not_dispatch_fix_storage_write_posture_first');
  }
  if (labelState === 'provider_needed' && (!liveAllowed || providerPosture !== 'released_to_normal_gates_only')) {
    return state('provider_needed_but_not_live_ready', ['provider_needed', 'live_or_provider_gate_not_ready'], 'do_not_call_provider_recheck_live_gate_and_command_authority');
  }
  if (pickupCandidate && requestState === 'provider_needed' && providerPosture === 'released_to_normal_gates_only') {
    return state('provider_needed_live_preflight_ready', ['provider_needed', 'released_to_normal_gates_only', 'preflight_only_not_authorization'], 'future_explicit_execution_command_must_revalidate_before_provider_contact');
  }
  if (requestState === 'blocked') {
    return state('blocked', ['blocked', 'blocking_gate_present'], 'do_not_dispatch_fix_blocking_gate_first');
  }
  if (requestState === 'held') {
    return state('held', ['held', providerPosture || 'held_by_gate'], 'wait_then_recheck_normal_gates');
  }
  return state('provider_needed_but_not_live_ready', ['provider_needed', `request_posture_state:${requestState}`], 'do_not_call_provider_recheck_all_gates');
}

function state(name, reasonCodes, nextSafeAction) {
  return {
    state: name,
    reason_codes: [...new Set(reasonCodes.filter(Boolean))],
    next_safe_action: nextSafeAction
  };
}

function compactRequestPosture(posture = {}) {
  return {
    action: posture.action || null,
    request_posture_id: posture.request_posture_id || null,
    request_posture_state: posture.request_posture_state || null,
    label_state: posture.posture_row?.label_state || null,
    provider_needed: posture.posture_row?.provider_needed === true,
    provider_posture: posture.posture_row?.provider_posture || null,
    pickup_eligible: posture.posture_row?.pickup_eligible === true,
    next_safe_action: posture.posture_row?.next_safe_action || null,
    reason_codes: posture.posture_row?.reason_codes || [],
    request_posture_is_execution_authority: false
  };
}

function compactPickupContract(contract = {}) {
  return {
    action: contract.action || null,
    pickup_candidate: contract.pickup_contract?.pickup_candidate === true,
    state: contract.pickup_contract?.state || null,
    non_durable: contract.pickup_contract?.non_durable === true,
    persisted: contract.pickup_contract?.persisted === true,
    future_execution_input_hints_only: contract.future_execution_contract?.input_is_hints_only === true,
    revalidation_required_before_execution: contract.pickup_contract?.revalidation_required_before_execution === true,
    provider_call_authorized: contract.pickup_contract?.provider_call_authorized === true,
    hydration_write_authorized: contract.pickup_contract?.hydration_write_authorized === true,
    renderer_input_authority: contract.pickup_contract?.renderer_input_authority || null,
    pickup_is_execution_authority: false
  };
}

function compactExternalIo(posture = {}) {
  return {
    state: posture.external_io?.state || null,
    provider_backed_hydration_posture: posture.external_io?.provider_backed_hydration_posture || null,
    held_by_external_io: posture.external_io?.held_by_external_io === true,
    held_is_failure: false,
    external_io_on_is_authorization: false
  };
}

function compactLiveGate(posture = {}) {
  return {
    action: posture.live_provider_gate?.action || 'metadata.hydration',
    allowed: posture.live_provider_gate?.allowed === true,
    state: posture.live_provider_gate?.state || null,
    blockers: posture.live_provider_gate?.blockers || [],
    record_blocked_attempts: false,
    allowed_is_execution_authority: false
  };
}

function compactStorageWrite(posture = {}) {
  return {
    storage_state: posture.storage_write_posture?.storage_state || null,
    budget_state: posture.storage_write_posture?.budget_state || null,
    future_hydration_write_posture: posture.storage_write_posture?.future_hydration_write_posture || null,
    future_hydration_writes_blocked: posture.storage_write_posture?.future_hydration_writes_blocked === true,
    enforcement_active: false,
    storage_ready_is_execution_authority: false
  };
}

function stateSnapshot(db) {
  return {
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
  };
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

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildHydrationSelectedIdRealExecutionPreflight
};
