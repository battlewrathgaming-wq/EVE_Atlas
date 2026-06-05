const { actionGate } = require('./liveApiGateService');
const { buildExternalIoStateConfigReadback } = require('./externalIoStateService');
const { buildHydrationPickupContractPreview } = require('./hydrationPickupContractService');
const { buildHydrationRequestPosturePreview } = require('./hydrationRequestPostureService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');

const PROVIDER_ID_TYPES = Object.freeze(['character', 'corporation', 'alliance']);
const LOCAL_LOOKUP_TYPES = Object.freeze(['inventory_type', 'solar_system']);
const HS276_TARGET = Object.freeze({ id_type: 'character', id_value: 92418041 });

function buildSelectedIdReadabilityRepairProductPreflight(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const selectedId = normalizeSelectedId(input);
  const sanitizedInput = sanitizedRequestInput(input, selectedId);
  const productContext = sanitizedContext(context);
  const requestPosture = buildHydrationRequestPosturePreview(db, sanitizedInput, productContext);
  const pickupContract = buildHydrationPickupContractPreview(db, sanitizedInput, productContext);
  const externalIo = buildExternalIoStateConfigReadback({}, productContext);
  const storageGate = buildStorageSetupGateReadout({}, productContext);
  const liveGate = liveProviderGate(selectedId, sanitizedInput, productContext);
  const localBasis = localBasisReadout(db, selectedId);
  const proofScaffolding = proofScaffoldingReadout(input, context);
  const classification = classifyProductPreflight({
    selectedId,
    requestPosture,
    localBasis,
    externalIo,
    storageGate,
    liveGate
  });
  const after = stateSnapshot(db);

  return {
    action: 'metadata.selected_id_readability_repair.product_preflight',
    classification: 'read-only selected-ID product readability repair authority/preflight',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    explanation_only: true,
    product_execution_started: false,
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
    storage_config_writes: 0,
    external_io_config_writes: 0,
    support_artifacts_created: 0,
    schema_changes: 0,
    bucket_persistence: false,
    dispatcher_created: false,
    worker_created: false,
    lease_persistence: false,
    retry_persistence: false,
    persisted_queue: false,
    queue_dispatches: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    selected_id: selectedId,
    fixed_hs276_id_special: false,
    hs276_target_match: selectedId.id_type === HS276_TARGET.id_type && selectedId.id_value === HS276_TARGET.id_value,
    product_preflight_state: classification.state,
    reason_codes: classification.reason_codes,
    next_safe_action: classification.next_safe_action,
    proof_scaffolding: proofScaffolding,
    renderer_payload_authority: rendererPayloadAuthority(input, context),
    local_authority: localBasis,
    local_first: {
      local_label_short_circuit: Boolean(localBasis.local_label),
      local_label: localBasis.local_label,
      local_label_basis: localBasis.local_label_basis,
      provider_contact_needed: classification.provider_contact_needed,
      atlas_local_basis_required: true,
      strong_basis_authorizes_first_product_preflight: localBasis.strong_basis_exists,
      parked_basis_authorizes_first_product_preflight: false
    },
    local_lookup_posture: localLookupPosture(selectedId, requestPosture, localBasis),
    external_io: {
      action: externalIo.action || 'external_io.state_config_readback',
      state: externalIo.state || 'off',
      provider_backed_posture: externalIo.provider_backed_posture || null,
      held_by_external_io: externalIo.provider_backed_posture === 'held_by_external_io',
      held_is_failure: false,
      external_io_on_is_authorization: false,
      renderer_payload_ignored: externalIo.renderer_payload_ignored === true
    },
    live_provider_gate: {
      action: 'metadata.hydration',
      allowed: liveGate.allowed === true,
      state: liveGate.state || null,
      blockers: liveGate.blockers || [],
      record_blocked_attempts: false,
      accepted_attempt_recorded: false,
      allowed_is_execution_authority: false
    },
    storage_write_posture: storageWritePosture(storageGate),
    command_authority: {
      future_execution_command: 'metadata.selected_id_readability_repair.execute',
      future_run_type: 'selected_id_readability_repair',
      confirmation_token: 'confirm:metadata.hydration',
      confirmation_required_before_real_execution: true,
      command_authority_satisfied_now: false,
      renderer_preflight_can_explain: true,
      renderer_preflight_can_execute: false,
      request_posture_is_authority: false,
      pickup_contract_is_authority: false,
      hs276_proof_command_is_product_authority: false
    },
    request_posture: compactRequestPosture(requestPosture),
    pickup_contract: compactPickupContract(pickupContract),
    future_execution_contract: {
      command_candidate: 'metadata.selected_id_readability_repair.execute',
      run_type_candidate: 'selected_id_readability_repair',
      bucket_dispatcher_required_now: false,
      execution_must_revalidate_from_trusted_state: true,
      provider_endpoint_candidate: '/universe/names',
      provider_call_authorized_now: false,
      writes_authorized_now: false
    },
    expected_allowed_writes_for_later_execution: [
      { table: 'metadata_runs', purpose: 'selected-ID readability repair attempt provenance' },
      { table: 'api_request_logs', purpose: 'sanitized ESI names request log only if provider contact occurs' },
      { table: 'entities', purpose: 'selected character/corporation/alliance label cache only' },
      { table: 'activity_events', purpose: 'matching readability label columns only' }
    ],
    forbidden_mutations_for_later_execution: [
      'killmails',
      'raw ESI killmail payloads',
      'numeric activity_events facts',
      'discovered_killmail_refs',
      'fetch_runs',
      'ingestion_audits',
      'data_quality_warnings',
      'Watch rows',
      'Marked rows',
      'Assessment Memory',
      'storage config',
      'External I/O config',
      'schema',
      'Bucket/Dispatcher/worker/lease/retry/queue state',
      'support artifacts',
      'renderer UI state',
      'runtime enforcement/command blocking'
    ],
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    evidence_boundary: {
      evidence_to_observation_to_hydration_to_assessment: true,
      hydration_outputs_readability_repair: true,
      discovery_outputs_possible_leads: true,
      evidence_expansion_outputs_evidence: true,
      ids_are_facts: true,
      labels_are_readability: true,
      creates_evidence: false,
      discovery_refs_are_evidence: false,
      fourth_lane_reopened: false
    },
    boundary: [
      'Read-only selected-ID product readability repair preflight only; it does not call providers or write rows.',
      'Renderer payloads can request explanation but cannot forge labels, local basis, storage, External I/O, live gate, confirmation, or command authority.',
      'HS276 proof/test scaffolding is disclosed as non-authority and is not inherited as product behavior.',
      'Product execution remains unopened and would require a separate accepted command/runway.',
      'Bucket/Dispatcher/worker/lease/retry/queue machinery is not required for this selected-ID product preflight.'
    ]
  };
}

function normalizeSelectedId(input = {}) {
  const request = input.request_facts || input.requestFacts || input.request || input;
  const idType = normalizeIdType(request.id_type || request.idType || request.type);
  const idValue = normalizeIdValue(request.id_value ?? request.idValue ?? request.id);
  const reasonCodes = [];
  if (!idType) {
    reasonCodes.push('missing_selected_id_type');
  } else if (![...PROVIDER_ID_TYPES, ...LOCAL_LOOKUP_TYPES].includes(idType)) {
    reasonCodes.push('unsupported_selected_id_type');
  }
  if (!Number.isSafeInteger(idValue) || idValue <= 0) {
    reasonCodes.push('invalid_selected_id_value');
  }
  return {
    id_type: idType,
    id_value: idValue,
    normalized: reasonCodes.length === 0,
    provider_hydration_supported: PROVIDER_ID_TYPES.includes(idType),
    local_lookup_type: LOCAL_LOOKUP_TYPES.includes(idType),
    malformed_or_unsupported: reasonCodes.length > 0 || !PROVIDER_ID_TYPES.includes(idType),
    reason_codes: reasonCodes
  };
}

function sanitizedRequestInput(input, selectedId) {
  return {
    idType: selectedId.id_type,
    idValue: selectedId.id_value,
    operatorAct: input.operator_act ?? input.operatorAct,
    interaction: input.interaction || input.event_type || input.eventType || null,
    sourceSurface: input.source_surface || input.sourceSurface || 'selected-id-product-readability-repair-preflight',
    sourceContext: input.source_context || input.sourceContext || null,
    basisAnchor: input.basis_anchor || input.basisAnchor || null,
    basisLayer: input.basis_layer || input.basisLayer || null
  };
}

function sanitizedContext(context = {}) {
  const copy = { ...context };
  delete copy.allowHydrationSelectedIdRealExecutionProof;
  delete copy.controlledTempAtlasStore;
  return copy;
}

function localBasisReadout(db, selectedId) {
  const empty = {
    state: 'invalid',
    strong_basis_exists: false,
    parked_or_conditional_basis_exists: false,
    local_label: null,
    local_label_basis: null,
    basis: [],
    strong_basis: [],
    parked_basis: [],
    conditional_basis: [],
    basis_policy: 'Evidence/EVEidence activity appearance or existing unlabeled entities row required for first product preflight'
  };
  if (!db || !selectedId.normalized) {
    return empty;
  }
  if (selectedId.local_lookup_type) {
    return {
      ...empty,
      state: 'local_lookup_not_esi_hydration',
      local_label: localLookupLabel(db, selectedId),
      local_label_basis: selectedId.id_type === 'inventory_type' ? 'type_metadata.type_name' : 'solar_systems.solar_system_name',
      basis: localLookupLabel(db, selectedId) ? [selectedId.id_type === 'inventory_type' ? 'type_metadata' : 'solar_systems'] : [],
      basis_policy: 'Static/local lookup IDs use local SDE/topology readiness, not ESI names Hydration'
    };
  }

  const basis = [];
  const strongBasis = [];
  const parkedBasis = [];
  const labels = localEntityLabel(db, selectedId);
  const activityCount = activityBasisCount(db, selectedId);
  const entityRow = db.prepare('SELECT entity_name FROM entities WHERE entity_type = ? AND entity_id = ?')
    .get(selectedId.id_type, selectedId.id_value);
  const watchCount = db.prepare('SELECT COUNT(*) AS count FROM watchlist_entities WHERE entity_type = ? AND entity_id = ?')
    .get(selectedId.id_type, selectedId.id_value).count;
  const assessmentCount = db.prepare('SELECT COUNT(*) AS count FROM assessment_artifacts WHERE entity_type = ? AND entity_id = ?')
    .get(selectedId.id_type, selectedId.id_value).count;
  const discoveryCount = discoveryBasisCount(db, selectedId);

  if (activityCount > 0) {
    const row = { kind: 'activity_events', authority: 'strong', appearances: activityCount, meaning: 'Evidence/EVEidence-derived activity appearance' };
    basis.push(row);
    strongBasis.push(row);
  }
  if (entityRow && !nonEmpty(entityRow.entity_name)) {
    const row = { kind: 'entities', authority: 'strong', appearances: 1, meaning: 'Existing local entity row missing a readability label' };
    basis.push(row);
    strongBasis.push(row);
  } else if (entityRow) {
    basis.push({ kind: 'entities', authority: 'local_label_short_circuit', appearances: 1, meaning: 'Existing local entity label should short-circuit provider contact' });
  }
  if (watchCount > 0) {
    const row = { kind: 'watchlist_entities', authority: 'parked', appearances: watchCount, meaning: 'Watch attention/acquisition intent, not standalone provider Hydration authority' };
    basis.push(row);
    parkedBasis.push(row);
  }
  if (assessmentCount > 0) {
    const row = { kind: 'assessment_artifacts', authority: 'parked', appearances: assessmentCount, meaning: 'Assessment Memory is deliberate judgment, not standalone provider Hydration authority' };
    basis.push(row);
    parkedBasis.push(row);
  }
  if (discoveryCount > 0) {
    const row = { kind: 'discovered_killmail_refs', authority: 'parked', appearances: discoveryCount, meaning: 'Discovery is possible leads/provenance, not Evidence/EVEidence' };
    basis.push(row);
    parkedBasis.push(row);
  }

  return {
    state: basisState({ strongBasis, parkedBasis, labels }),
    strong_basis_exists: strongBasis.length > 0,
    parked_or_conditional_basis_exists: parkedBasis.length > 0,
    local_label: labels.local_label,
    local_label_basis: labels.local_label_basis,
    basis,
    strong_basis: strongBasis,
    parked_basis: parkedBasis,
    conditional_basis: parkedBasis,
    basis_policy: 'Evidence/EVEidence activity appearance or existing unlabeled entities row required for first product preflight'
  };
}

function basisState({ strongBasis, parkedBasis, labels }) {
  if (labels.local_label) {
    return 'local_label_short_circuit';
  }
  if (strongBasis.length > 0) {
    return 'strong_product_basis';
  }
  if (parkedBasis.length > 0) {
    return 'parked_or_conditional_basis_only';
  }
  return 'missing_local_basis';
}

function classifyProductPreflight({ selectedId, localBasis, externalIo, storageGate, liveGate }) {
  if (!selectedId.normalized || !selectedId.provider_hydration_supported) {
    return state('invalid_selected_id', [...selectedId.reason_codes, 'selected_id_not_supported_for_esi_names_hydration'], 'reject_without_provider_or_write', false);
  }
  if (localBasis.local_label) {
    return state('local_label_short_circuit', ['local_label_available', 'provider_not_needed'], 'use_local_readability_label_without_provider', false);
  }
  if (!localBasis.strong_basis_exists) {
    if (localBasis.parked_or_conditional_basis_exists) {
      return state('conditional_basis_only', ['parked_or_conditional_basis_only', 'not_first_product_authority'], 'require_evidence_activity_or_unlabeled_entity_basis_before_provider_hydration', false);
    }
    return state('missing_local_basis', ['missing_atlas_local_basis'], 'require_atlas_local_basis_before_provider_hydration', false);
  }
  const storage = storageWritePosture(storageGate);
  if (storage.future_hydration_writes_blocked) {
    return state('blocked_by_storage_write_posture', ['blocked_by_storage_write_posture', storage.future_hydration_write_posture || 'storage_blocked'], 'fix_storage_write_posture_before_provider_contact', false);
  }
  if (externalIo.provider_backed_posture === 'held_by_external_io' || externalIo.state !== 'on') {
    return state('held_by_external_io', ['held_by_external_io', 'held_is_not_failure'], 'hold_until_external_io_enabled_then_recheck_normal_gates', false);
  }
  if (liveGate.allowed !== true) {
    return state('blocked_by_live_provider_gate', ['live_or_provider_gate_not_ready', ...(liveGate.blockers || []).map((entry) => entry.code || 'live_gate_blocked')], 'do_not_call_provider_recheck_live_gate_and_command_authority', false);
  }
  return state('provider_needed_product_preflight_ready', ['provider_needed', 'strong_local_basis', 'preflight_only_not_authorization'], 'future_execution_command_must_revalidate_before_provider_contact', true);
}

function state(name, reasonCodes, nextSafeAction, providerContactNeeded) {
  return {
    state: name,
    reason_codes: [...new Set(reasonCodes.filter(Boolean))],
    next_safe_action: nextSafeAction,
    provider_contact_needed: providerContactNeeded
  };
}

function proofScaffoldingReadout(input = {}, context = {}) {
  const supplied = [];
  if (input.allowHydrationSelectedIdRealExecutionProof === true || context.allowHydrationSelectedIdRealExecutionProof === true) {
    supplied.push('allowHydrationSelectedIdRealExecutionProof');
  }
  if (input.controlledTempAtlasStore === true || context.controlledTempAtlasStore === true) {
    supplied.push('controlledTempAtlasStore');
  }
  return {
    supplied_proof_flags: supplied,
    proof_flags_authoritative: false,
    controlled_temp_store_is_product_storage_authority: false,
    hs276_fixed_id_is_product_default: false,
    hs276_proof_command_is_product_authority: false,
    status: supplied.length ? 'proof_scaffolding_supplied_ignored_as_non_authority' : 'no_proof_scaffolding_supplied'
  };
}

function rendererPayloadAuthority(input = {}, context = {}) {
  const forbiddenKeys = [
    'localLabel',
    'local_label',
    'localBasis',
    'local_basis',
    'storagePreflight',
    'storage_preflight',
    'storageAuthority',
    'storage_authority',
    'externalIo',
    'external_io',
    'externalIoState',
    'external_io_state',
    'liveGate',
    'live_gate',
    'confirmation',
    'confirmationToken',
    'commandAuthority',
    'command_authority'
  ];
  return {
    source: context.source || 'trusted-main',
    renderer_payload_authoritative: false,
    forged_authority_keys_ignored: context.source === 'renderer'
      ? forbiddenKeys.filter((key) => Object.prototype.hasOwnProperty.call(input, key))
      : [],
    storage_claims_authoritative: false,
    external_io_claims_authoritative: false,
    live_gate_claims_authoritative: false,
    local_label_claims_authoritative: false,
    local_basis_claims_authoritative: false,
    confirmation_claims_authoritative: false
  };
}

function liveProviderGate(selectedId, input, context) {
  if (!selectedId.provider_hydration_supported || !selectedId.normalized || input.operatorAct !== true) {
    return {
      action: 'metadata.hydration',
      allowed: false,
      state: 'not_applicable',
      blockers: [],
      request_control: null
    };
  }
  return actionGate('metadata.hydration', {
    idsToRequest: 1,
    targetType: selectedId.id_type,
    targetId: selectedId.id_value
  }, {
    now: context.now,
    taskRunner: context.taskRunner,
    recordBlockedAttempt: false
  });
}

function storageWritePosture(storageGate = {}) {
  const decision = storageGate.action_class_matrix?.actions?.fast_view_metadata_hydration || null;
  const posture = decision?.posture || null;
  return {
    storage_state: storageGate.action_class_matrix?.storage_state || null,
    budget_state: storageGate.budget?.state || null,
    future_hydration_write_posture: posture,
    future_hydration_writes_blocked: ['block', 'block_writes'].includes(posture),
    source_action: 'storage.setup_gate_readout',
    renderer_payload_ignored: storageGate.source?.renderer_payload_storage_facts_ignored === true,
    enforcement_active: false,
    storage_ready_is_execution_authority: false
  };
}

function compactRequestPosture(posture = {}) {
  return {
    action: posture.action || null,
    request_posture_state: posture.request_posture_state || null,
    label_state: posture.posture_row?.label_state || null,
    provider_needed: posture.posture_row?.provider_needed === true,
    provider_posture: posture.posture_row?.provider_posture || null,
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
    provider_call_authorized: contract.pickup_contract?.provider_call_authorized === true,
    hydration_write_authorized: contract.pickup_contract?.hydration_write_authorized === true,
    pickup_is_execution_authority: false
  };
}

function localLookupPosture(selectedId, requestPosture, localBasis) {
  return {
    local_lookup_type: selectedId.local_lookup_type,
    provider_names_endpoint_should_be_used: selectedId.local_lookup_type ? false : selectedId.provider_hydration_supported,
    state: selectedId.local_lookup_type ? 'local_sde_static_lookup_not_esi_hydration' : 'provider_backed_readability_type',
    local_label: localBasis.local_label,
    request_posture_state: requestPosture.request_posture_state || null
  };
}

function localEntityLabel(db, selectedId) {
  const entity = db.prepare('SELECT entity_name, last_enriched_at, last_seen_at FROM entities WHERE entity_type = ? AND entity_id = ?')
    .get(selectedId.id_type, selectedId.id_value);
  if (nonEmpty(entity?.entity_name)) {
    return {
      local_label: entity.entity_name.trim(),
      local_label_basis: 'entities.entity_name',
      last_resolved_at: entity.last_enriched_at || entity.last_seen_at || null
    };
  }
  const nameColumn = `${selectedId.id_type}_name`;
  const idColumn = idColumnFor(selectedId.id_type);
  const event = db.prepare(`
    SELECT ${nameColumn} AS entity_name, ingested_at
    FROM activity_events
    WHERE ${idColumn} = ? AND ${nameColumn} IS NOT NULL AND TRIM(${nameColumn}) != ''
    ORDER BY ingested_at DESC
    LIMIT 1
  `).get(selectedId.id_value);
  if (nonEmpty(event?.entity_name)) {
    return {
      local_label: event.entity_name.trim(),
      local_label_basis: `activity_events.${nameColumn}`,
      last_resolved_at: event.ingested_at || null
    };
  }
  return { local_label: null, local_label_basis: null, last_resolved_at: null };
}

function activityBasisCount(db, selectedId) {
  const idColumn = idColumnFor(selectedId.id_type);
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events
    WHERE (entity_type = ? AND entity_id = ?) OR ${idColumn} = ?
  `).get(selectedId.id_type, selectedId.id_value, selectedId.id_value).count;
}

function discoveryBasisCount(db, selectedId) {
  const rows = db.prepare('SELECT discovered_by_type, discovered_by_id FROM discovered_killmail_refs').all();
  const needleA = `${selectedId.id_type}:${selectedId.id_value}`;
  const needleB = String(selectedId.id_value);
  return rows.filter((row) => (
    String(row.discovered_by_type || '').includes(selectedId.id_type) &&
    (String(row.discovered_by_id || '') === needleA || String(row.discovered_by_id || '') === needleB)
  )).length;
}

function localLookupLabel(db, selectedId) {
  if (selectedId.id_type === 'inventory_type') {
    return nonEmpty(db.prepare('SELECT type_name FROM type_metadata WHERE type_id = ?').get(selectedId.id_value)?.type_name);
  }
  if (selectedId.id_type === 'solar_system') {
    return nonEmpty(db.prepare('SELECT solar_system_name FROM solar_systems WHERE solar_system_id = ?').get(selectedId.id_value)?.solar_system_name);
  }
  return null;
}

function idColumnFor(idType) {
  if (idType === 'character') {
    return 'character_id';
  }
  if (idType === 'corporation') {
    return 'corporation_id';
  }
  return 'alliance_id';
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

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function nonEmpty(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || null;
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildSelectedIdReadabilityRepairProductPreflight
};
