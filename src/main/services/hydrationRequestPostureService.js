const crypto = require('node:crypto');
const { actionGate } = require('./liveApiGateService');
const { buildExternalIoStateConfigReadback } = require('./externalIoStateService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');

const ENTITY_ID_TYPES = Object.freeze(['character', 'corporation', 'alliance']);
const LOCAL_LOOKUP_TYPES = Object.freeze(['inventory_type', 'solar_system']);
const NON_REQUEST_INTERACTIONS = Object.freeze(['focus', 'hover', 'navigation', 'report_load', 'report-load']);

function buildHydrationRequestPosturePreview(db, input = {}, context = {}) {
  const request = normalizeRequest(input);
  const base = basePreview(request);
  const externalIo = externalIoReadout(input, context);
  const storageGate = buildStorageSetupGateReadout(input, context);
  const storageDecision = storageGate.action_class_matrix?.actions?.fast_view_metadata_hydration || null;
  const liveGate = liveGateReadout(request, context);

  if (!request.explicit_request) {
    return withPosture(base, {
      request,
      externalIo,
      storageGate,
      storageDecision,
      liveGate,
      state: 'not_a_request',
      labelState: 'not_requested',
      reasonCodes: ['not_a_request', request.non_request_reason || 'operator_act_required']
    });
  }

  if (!request.valid) {
    return withPosture(base, {
      request,
      externalIo,
      storageGate,
      storageDecision,
      liveGate,
      state: 'invalid',
      labelState: 'invalid_or_unsupported_id',
      reasonCodes: request.reason_codes
    });
  }

  const localState = localReadout(db, request);
  if (localState.local_label) {
    return withPosture(base, {
      request,
      externalIo,
      storageGate,
      storageDecision,
      liveGate,
      state: request.id_type === 'inventory_type' || request.id_type === 'solar_system' ? 'local_lookup_available' : 'already_local',
      labelState: request.id_type === 'inventory_type' || request.id_type === 'solar_system' ? 'local_lookup_available' : 'already_local',
      localState,
      reasonCodes: [
        request.id_type === 'inventory_type' || request.id_type === 'solar_system' ? 'local_lookup_available' : 'already_local',
        localState.local_label_basis
      ].filter(Boolean)
    });
  }

  if (LOCAL_LOOKUP_TYPES.includes(request.id_type)) {
    return withPosture(base, {
      request,
      externalIo,
      storageGate,
      storageDecision,
      liveGate,
      state: 'local_lookup_available',
      labelState: 'local_sde_gap',
      localState,
      reasonCodes: ['local_lookup_available', 'local_sde_gap', 'provider_not_needed']
    });
  }

  if (!localState.has_local_basis) {
    return withPosture(base, {
      request,
      externalIo,
      storageGate,
      storageDecision,
      liveGate,
      state: 'insufficient_basis',
      labelState: 'insufficient_local_basis',
      localState,
      reasonCodes: ['insufficient_basis', 'missing_atlas_local_basis']
    });
  }

  const providerDecision = providerPosture({ externalIo, storageDecision, liveGate });
  return withPosture(base, {
    request,
    externalIo,
    storageGate,
    storageDecision,
    liveGate,
    state: providerDecision.state,
    labelState: 'provider_needed',
    localState,
    providerPosture: providerDecision.providerPosture,
    reasonCodes: providerDecision.reasonCodes
  });
}

function basePreview(request) {
  return {
    action: 'metadata.hydration_request_posture.preview',
    classification: 'read-only selected-ID Hydration request posture preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    hydration_writes: 0,
    metadata_run_writes: 0,
    entity_writes: 0,
    activity_event_label_patches: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    watch_mutations: 0,
    assessment_memory_mutations: 0,
    marked_mutations: 0,
    support_artifacts_created: 0,
    persisted_queue: false,
    persisted_queue_created: false,
    queue_dispatches: 0,
    pickup_created: false,
    execution_started: false,
    schema_changes: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    storage_config_writes: 0,
    external_io_config_writes: 0,
    ui_work: false,
    request_posture_id: request.request_posture_id,
    request: request.public_request
  };
}

function withPosture(base, options) {
  const localState = options.localState || emptyLocalState(options.request);
  const providerPostureValue = options.providerPosture || (options.labelState === 'provider_needed' ? 'blocked' : 'not_provider_needed');
  const reasonCodes = [...new Set((options.reasonCodes || []).filter(Boolean))];
  const pickupEligible = options.state === 'provider_needed';
  const providerNeeded = options.labelState === 'provider_needed';

  return {
    ...base,
    request_posture_state: options.state,
    posture_row: {
      request_posture_id: base.request_posture_id,
      request_posture_state: options.state,
      label_state: options.labelState,
      local_label: localState.local_label,
      local_label_basis: localState.local_label_basis,
      last_resolved_at: localState.last_resolved_at,
      local_basis: localState.local_basis,
      provider_needed: providerNeeded,
      provider_posture: providerPostureValue,
      pickup_eligible: pickupEligible,
      next_safe_action: nextSafeAction(options.state, providerPostureValue, options.labelState),
      gates: gates(options.externalIo, options.storageGate, options.storageDecision, options.liveGate),
      reason_codes: reasonCodes
    },
    summary: {
      selected_id: {
        id_type: options.request.id_type,
        id_value: options.request.id_value
      },
      request_posture_state: options.state,
      label_state: options.labelState,
      provider_needed: providerNeeded,
      provider_posture: providerPostureValue,
      pickup_eligible: pickupEligible,
      next_safe_action: nextSafeAction(options.state, providerPostureValue, options.labelState),
      reason_codes: reasonCodes
    },
    external_io: {
      state: options.externalIo.state,
      provider_backed_hydration_posture: options.externalIo.provider_backed_posture,
      held_by_external_io: options.externalIo.provider_backed_posture === 'held_by_external_io',
      held_is_failure: false,
      external_io_on_is_authorization: false
    },
    storage_write_posture: {
      storage_state: options.storageGate.action_class_matrix?.storage_state || null,
      budget_state: options.storageGate.budget?.state || null,
      future_hydration_write_posture: options.storageDecision?.posture || null,
      future_hydration_writes_blocked: storageBlocksProviderWrite(options.storageDecision),
      enforcement_active: false
    },
    live_provider_gate: {
      action: options.liveGate.action,
      allowed: options.liveGate.allowed === true,
      state: options.liveGate.state,
      blockers: options.liveGate.blockers || [],
      request_control: options.liveGate.request_control || null,
      record_blocked_attempts: false
    },
    evidence_boundary: {
      ids_are_facts: true,
      labels_are_readability: true,
      hydration_creates_evidence: false,
      provider_needed_labels_are_evidence_work: false,
      discovery_as_possible_leads_only: true,
      assessment_memory_mutated: false
    },
    boundary: [
      'Read-only request posture preview only; it does not create pickup work, queues, dispatcher packets, or execution.',
      'It does not call providers, write Hydration output, write metadata_runs, upsert entities, patch activity_event labels, or create Evidence/EVEidence.',
      'Focus, hover, navigation, and report-load are not Hydration requests without an explicit operator act.',
      'External I/O on is only a posture input and is not provider-call authorization.',
      'Local SDE/static lookup gaps stay local readiness work, not ESI Hydration.'
    ]
  };
}

function normalizeRequest(input = {}) {
  const rawInteraction = String(input.interaction || input.event_type || input.eventType || '').trim().toLowerCase();
  const operatorAct = input.operator_act === true || input.operatorAct === true;
  const idType = normalizeIdType(input.id_type || input.idType || input.type);
  const idValue = normalizeIdValue(input.id_value ?? input.idValue ?? input.id);
  const reasonCodes = [];
  if (!operatorAct || NON_REQUEST_INTERACTIONS.includes(rawInteraction)) {
    return requestObject({
      idType,
      idValue,
      operatorAct,
      input,
      interaction: rawInteraction || null,
      valid: true,
      explicitRequest: false,
      reasonCodes,
      nonRequestReason: NON_REQUEST_INTERACTIONS.includes(rawInteraction) ? `${rawInteraction}_is_not_request` : 'operator_act_required'
    });
  }
  if (!idType || (!ENTITY_ID_TYPES.includes(idType) && !LOCAL_LOOKUP_TYPES.includes(idType))) {
    reasonCodes.push('invalid_or_unsupported_id_type');
  }
  if (!Number.isSafeInteger(idValue) || idValue <= 0) {
    reasonCodes.push('invalid_or_unsupported_id_value');
  }
  return requestObject({
    idType,
    idValue,
    operatorAct,
    input,
    interaction: rawInteraction || null,
    valid: reasonCodes.length === 0,
    explicitRequest: true,
    reasonCodes: reasonCodes.length ? reasonCodes : ['explicit_operator_request']
  });
}

function requestObject({
  idType,
  idValue,
  operatorAct,
  input,
  interaction,
  valid,
  explicitRequest,
  reasonCodes,
  nonRequestReason
}) {
  const sourceSurface = input.source_surface || input.sourceSurface || 'unspecified';
  const sourceContext = input.source_context || input.sourceContext || null;
  const basisAnchor = input.basis_anchor || input.basisAnchor || null;
  const digest = shortDigest({ idType, idValue, sourceSurface, sourceContext, basisAnchor });
  const requestPostureId = `hydration_request:${idType || 'unknown'}:${idValue || 'unknown'}:${digest}`;
  return {
    id_type: idType,
    id_value: idValue,
    operator_act: operatorAct,
    interaction,
    explicit_request: explicitRequest,
    valid,
    reason_codes: reasonCodes,
    non_request_reason: nonRequestReason,
    source_surface: sourceSurface,
    source_context: sourceContext,
    basis_anchor: basisAnchor,
    request_posture_id: requestPostureId,
    public_request: {
      id_type: idType,
      id_value: idValue,
      operator_act: operatorAct,
      interaction,
      explicit_request: explicitRequest,
      source_surface: sourceSurface,
      source_context: sourceContext,
      basis_anchor: basisAnchor,
      basis_layer: input.basis_layer || input.basisLayer || null
    }
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

function localReadout(db, request) {
  if (!db || !request.valid) {
    return emptyLocalState(request);
  }
  if (request.id_type === 'inventory_type') {
    const row = db.prepare('SELECT type_name, last_fetched FROM type_metadata WHERE type_id = ?').get(request.id_value);
    return {
      has_local_basis: Boolean(row),
      local_label: nonEmpty(row?.type_name),
      local_label_basis: row?.type_name ? 'type_metadata.type_name' : null,
      last_resolved_at: row?.last_fetched || null,
      local_basis: row ? ['type_metadata'] : []
    };
  }
  if (request.id_type === 'solar_system') {
    const row = db.prepare('SELECT solar_system_name FROM solar_systems WHERE solar_system_id = ?').get(request.id_value);
    return {
      has_local_basis: Boolean(row),
      local_label: nonEmpty(row?.solar_system_name),
      local_label_basis: row?.solar_system_name ? 'solar_systems.solar_system_name' : null,
      last_resolved_at: null,
      local_basis: row ? ['solar_systems'] : []
    };
  }

  const labels = entityLabels(db, request);
  const basis = entityBasis(db, request);
  return {
    has_local_basis: basis.length > 0 || Boolean(labels.local_label),
    local_label: labels.local_label,
    local_label_basis: labels.local_label_basis,
    last_resolved_at: labels.last_resolved_at,
    local_basis: [...new Set([...basis, ...labels.local_basis])]
  };
}

function entityLabels(db, request) {
  const labels = [];
  const entity = db.prepare(`
    SELECT entity_name, last_enriched_at, last_seen_at
    FROM entities
    WHERE entity_type = ? AND entity_id = ?
  `).get(request.id_type, request.id_value);
  if (nonEmpty(entity?.entity_name)) {
    labels.push({
      local_label: entity.entity_name,
      local_label_basis: 'entities.entity_name',
      last_resolved_at: entity.last_enriched_at || entity.last_seen_at || null,
      local_basis: ['entities']
    });
  }
  const eventColumn = `${request.id_type}_name`;
  const idColumn = request.id_type === 'character' ? 'character_id' : request.id_type === 'corporation' ? 'corporation_id' : 'alliance_id';
  const event = db.prepare(`
    SELECT ${eventColumn} AS entity_name, ingested_at
    FROM activity_events
    WHERE ${idColumn} = ? AND ${eventColumn} IS NOT NULL AND TRIM(${eventColumn}) != ''
    ORDER BY ingested_at DESC
    LIMIT 1
  `).get(request.id_value);
  if (nonEmpty(event?.entity_name)) {
    labels.push({
      local_label: event.entity_name,
      local_label_basis: `activity_events.${eventColumn}`,
      last_resolved_at: event.ingested_at || null,
      local_basis: ['activity_events']
    });
  }
  const watch = db.prepare(`
    SELECT entity_name
    FROM watchlist_entities
    WHERE entity_type = ? AND entity_id = ? AND TRIM(entity_name) != ''
    LIMIT 1
  `).get(request.id_type, request.id_value);
  if (nonEmpty(watch?.entity_name)) {
    labels.push({
      local_label: watch.entity_name,
      local_label_basis: 'watchlist_entities.entity_name',
      last_resolved_at: null,
      local_basis: ['watchlist_entities']
    });
  }
  return labels[0] || {
    local_label: null,
    local_label_basis: null,
    last_resolved_at: null,
    local_basis: []
  };
}

function entityBasis(db, request) {
  const basis = [];
  const idColumn = request.id_type === 'character' ? 'character_id' : request.id_type === 'corporation' ? 'corporation_id' : 'alliance_id';
  const activity = db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events
    WHERE (entity_type = ? AND entity_id = ?) OR ${idColumn} = ?
  `).get(request.id_type, request.id_value, request.id_value);
  if (activity.count > 0) {
    basis.push('activity_events');
  }
  const entity = db.prepare('SELECT COUNT(*) AS count FROM entities WHERE entity_type = ? AND entity_id = ?').get(request.id_type, request.id_value);
  if (entity.count > 0) {
    basis.push('entities');
  }
  const watch = db.prepare('SELECT COUNT(*) AS count FROM watchlist_entities WHERE entity_type = ? AND entity_id = ?').get(request.id_type, request.id_value);
  if (watch.count > 0) {
    basis.push('watchlist_entities');
  }
  const assessment = db.prepare('SELECT COUNT(*) AS count FROM assessment_artifacts WHERE entity_type = ? AND entity_id = ?').get(request.id_type, request.id_value);
  if (assessment.count > 0) {
    basis.push('assessment_artifacts');
  }
  return basis;
}

function emptyLocalState() {
  return {
    has_local_basis: false,
    local_label: null,
    local_label_basis: null,
    last_resolved_at: null,
    local_basis: []
  };
}

function externalIoReadout(input, context) {
  const readout = buildExternalIoStateConfigReadback(input.external_io || input.externalIo || {}, context);
  return {
    state: readout.state || 'off',
    provider_backed_posture: readout.provider_backed_posture || (readout.state === 'on' ? 'released_to_normal_gates_only' : 'held_by_external_io')
  };
}

function liveGateReadout(request, context) {
  if (!request.valid || !request.explicit_request || !ENTITY_ID_TYPES.includes(request.id_type)) {
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
    targetType: request.id_type,
    targetId: request.id_value
  }, {
    now: context.now,
    taskRunner: context.taskRunner,
    recordBlockedAttempt: false
  });
}

function providerPosture({ externalIo, storageDecision, liveGate }) {
  if (storageBlocksProviderWrite(storageDecision)) {
    return {
      state: 'blocked',
      providerPosture: 'blocked',
      reasonCodes: ['provider_needed', 'blocked_by_storage_write_posture', `storage_posture:${storageDecision?.posture || 'unknown'}`]
    };
  }
  if (externalIo.provider_backed_posture === 'held_by_external_io' || externalIo.state !== 'on') {
    return {
      state: 'held',
      providerPosture: 'held_by_external_io',
      reasonCodes: ['provider_needed', 'held_by_external_io', 'held_is_not_failure']
    };
  }
  if (liveGate.request_control?.cooldown_active || liveGate.request_control?.lockout_active) {
    return {
      state: 'held',
      providerPosture: 'held_by_cadence',
      reasonCodes: ['provider_needed', 'held_by_cadence']
    };
  }
  if (liveGate.allowed !== true) {
    return {
      state: 'blocked',
      providerPosture: 'blocked',
      reasonCodes: ['provider_needed', ...(liveGate.blockers || []).map((entry) => entry.code || 'live_gate_blocked')]
    };
  }
  return {
    state: 'provider_needed',
    providerPosture: 'released_to_normal_gates_only',
    reasonCodes: ['provider_needed', 'released_to_normal_gates_only', 'not_authorized_execution']
  };
}

function storageBlocksProviderWrite(storageDecision) {
  const posture = storageDecision?.posture || null;
  return ['block', 'block_writes'].includes(posture);
}

function gates(externalIo, storageGate, storageDecision, liveGate) {
  return {
    local_lookup: {
      available: true,
      provider_required: false
    },
    external_io: {
      state: externalIo.state,
      provider_backed_posture: externalIo.provider_backed_posture,
      held_by_external_io: externalIo.provider_backed_posture === 'held_by_external_io'
    },
    storage_write: {
      storage_state: storageGate.action_class_matrix?.storage_state || null,
      posture: storageDecision?.posture || null,
      future_hydration_writes_blocked: storageBlocksProviderWrite(storageDecision),
      enforcement_active: false
    },
    live_provider: {
      allowed: liveGate.allowed === true,
      state: liveGate.state,
      blockers: liveGate.blockers || [],
      record_blocked_attempts: false
    }
  };
}

function nextSafeAction(state, providerPosture, labelState) {
  if (state === 'not_a_request') {
    return 'wait_for_explicit_operator_request';
  }
  if (state === 'invalid') {
    return 'reject_selected_id_without_provider_or_write';
  }
  if (state === 'insufficient_basis') {
    return 'require_atlas_local_basis_before_hydration_request';
  }
  if (labelState === 'local_sde_gap') {
    return 'repair_local_sde_lookup_or_continue_without_provider';
  }
  if (state === 'already_local' || state === 'local_lookup_available') {
    return 'use_local_readability_label';
  }
  if (providerPosture === 'held_by_external_io') {
    return 'hold_until_external_io_enabled_then_recheck_normal_gates';
  }
  if (providerPosture === 'held_by_cadence') {
    return 'wait_for_provider_cadence_then_recheck';
  }
  if (state === 'blocked') {
    return 'do_not_dispatch_fix_blocking_gate_first';
  }
  return 'eligible_for_future_hydration_pickup_only_after_normal_gates_and_confirmation';
}

function shortDigest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12);
}

function nonEmpty(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || null;
}

module.exports = {
  buildHydrationRequestPosturePreview
};
