const { buildComposedGatePolicyPreview } = require('./composedGatePolicyService');
const { buildGateStackReadout } = require('./gateStackReadoutService');
const { buildHydrationBacklogPreview } = require('./hydrationBacklogPreviewService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');

const LANE_ORDER = Object.freeze([
  'view_local_record',
  'watch_background',
  'target_report_scoped',
  'corpus_hygiene_low_priority',
  'local_sde_lookup_gaps'
]);

function buildHydrationExecutionPolicyPreview(db, input = {}, context = {}) {
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const backlog = buildHydrationBacklogPreview(db, {
    ...input,
    externalIoState
  }, context);
  const storageSetup = buildStorageSetupGateReadout({}, {
    ...context,
    allowStorageSetupGateFixtureInput: false
  });
  const gateStack = buildGateStackReadout(db, {
    externalIoState,
    actions: ['metadata.hydration', 'metadata.status', 'report.view']
  }, context);
  const composedPolicy = buildComposedGatePolicyPreview(db, {
    externalIoState
  }, context);
  const metadataHydrationStack = gateStack.gate_stacks.find((entry) => entry.action === 'metadata.hydration') || null;
  const hydrationComposedRow = composedPolicy.rows.find((entry) => entry.id === 'hydration_write') || null;
  const localSde = localSdeReadiness(db);
  const lanes = buildPolicyLanes({
    backlog,
    storageSetup,
    metadataHydrationStack,
    hydrationComposedRow,
    localSde
  });

  return {
    action: 'metadata.hydration_execution_policy.preview',
    classification: 'read-only hydration execution policy preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    hydration_writes: 0,
    entity_label_writes: 0,
    activity_event_label_patches: 0,
    metadata_run_writes: 0,
    persisted_queue: false,
    schema_changes: false,
    ui_work: false,
    enforcement_active: false,
    runtime_authorization_active: false,
    eligibility_is_authorization: false,
    evidence_boundary: {
      hydration_repairs: 'names, labels, and readability metadata for already-stored IDs',
      evidence_facts: 'numeric IDs, provider-complete killmail payloads, and local Evidence/EVEidence rows remain facts',
      creates_evidence: false,
      replaces_ids_as_facts: false,
      discovery_refs_are_evidence: false,
      missing_labels_are_report_failure: false,
      provider_needed_labels_are_evidence_work: false
    },
    gates: {
      storage: storageGateSummary(storageSetup),
      external_io: externalIoSummary(metadataHydrationStack, externalIoState),
      live_provider: liveProviderSummary(metadataHydrationStack),
      cadence: cadenceSummary(metadataHydrationStack),
      composed_policy: composedHydrationSummary(hydrationComposedRow),
      command_authority: commandAuthoritySummary(hydrationComposedRow),
      local_sde: localSde
    },
    summary: summarizePolicy({ lanes, backlog }),
    lanes,
    backlog_context: {
      action: backlog.action,
      provider_needed_entity_label_candidates: backlog.summary.provider_needed_entity_label_candidates,
      local_known_label_candidates: backlog.summary.local_known_label_candidates,
      local_sde_gap_candidates: backlog.summary.local_sde_gap_candidates,
      persisted_backlog: backlog.persisted_backlog,
      hydration_writes: backlog.hydration_writes,
      provider_calls: backlog.provider_calls
    },
    priority_policy: {
      view_local_record_not_starved_by_background: true,
      watch_background_waiting_is_failure: false,
      corpus_hygiene_can_defer: true,
      no_catch_up_flood_on_external_io_reenable: true
    },
    boundary: [
      'Read-only Hydration execution policy preview only; it does not call providers or move work.',
      'It does not write entities, metadata_runs, activity_events labels, Evidence/EVEidence, Discovery refs, queues, or schema.',
      'Hydration repairs readability only; numeric IDs remain facts and missing labels are not report failure.',
      'Provider-needed labels are future Hydration work, not Evidence/EVEidence work.',
      'Eligible policy states are not runtime authorization and do not bypass storage, External I/O, live/provider, cadence, or confirmation gates.'
    ]
  };
}

function buildPolicyLanes({ backlog, storageSetup, metadataHydrationStack, hydrationComposedRow, localSde }) {
  const backlogLanes = new Map((backlog.lanes || []).map((entry) => [entry.lane_id, entry]));
  const entityCandidates = backlog.candidates?.entity_labels?.representatives || [];
  const sdeGaps = backlog.candidates?.local_sde_gaps?.representatives || [];
  const localSdeLane = {
    lane_id: 'local_sde_lookup_gaps',
    label: 'local SDE/type/geography lookup gaps',
    candidate_count: sdeGaps.length,
    provider_needed_count: 0,
    locally_known_count: sdeGaps.filter((entry) => entry.label_state === 'known_local_sde_label').length,
    local_sde_gap_count: sdeGaps.filter((entry) => entry.label_state === 'local_sde_gap').length,
    representatives: sdeGaps,
    waiting_is_failure: false,
    persisted_queue: false,
    meaning: 'Static type/geography labels should come from local SDE lookup material, not ESI Evidence expansion.'
  };
  const lanesById = new Map([...backlogLanes, ['local_sde_lookup_gaps', localSdeLane]]);

  return LANE_ORDER.map((laneId) => {
    const lane = lanesById.get(laneId) || emptyLane(laneId);
    const candidates = laneId === 'local_sde_lookup_gaps'
      ? sdeGaps
      : representativeCandidatesForLane(lane, entityCandidates, sdeGaps);
    const candidateGroups = summarizeCandidateGroups(candidates);
    const policy = lanePolicy({
      lane,
      laneId,
      candidateGroups,
      storageSetup,
      metadataHydrationStack,
      hydrationComposedRow,
      localSde
    });

    return {
      lane_id: laneId,
      label: lane.label,
      policy_state: policy.state,
      reason_codes: policy.reason_codes,
      candidate_count: lane.candidate_count,
      candidate_groups: candidateGroups,
      gates: policy.gates,
      representatives: candidates.slice(0, 8),
      waiting_is_failure: false,
      persisted_queue: false,
      creates_evidence: false,
      replaces_ids_as_facts: false,
      missing_labels_are_report_failure: false,
      priority: priorityForLane(laneId),
      execution_notes: policy.notes
    };
  });
}

function lanePolicy({ lane, laneId, candidateGroups, storageSetup, metadataHydrationStack, hydrationComposedRow, localSde }) {
  const gates = {
    storage: storageGateSummary(storageSetup),
    external_io: externalIoSummary(metadataHydrationStack),
    live_provider: liveProviderSummary(metadataHydrationStack),
    cadence: cadenceSummary(metadataHydrationStack),
    composed_policy: composedHydrationSummary(hydrationComposedRow),
    local_sde: localSde
  };
  const notes = [];
  const reasonCodes = [];

  if (lane.candidate_count === 0) {
    return {
      state: 'not_applicable',
      reason_codes: ['no_representative_candidates'],
      gates,
      notes: ['No representative candidates in this lane from the local backlog preview.']
    };
  }

  if (laneId === 'local_sde_lookup_gaps' || candidateGroups.local_sde_gap > 0) {
    if (candidateGroups.local_sde_gap > 0) {
      reasonCodes.push('local_sde_lookup_gap');
      notes.push('Static type/geography gaps should be repaired by local SDE import/readiness, not ESI label hydration.');
    }
    if (laneId === 'local_sde_lookup_gaps') {
      return {
        state: localSde.ready ? 'eligible_local' : 'local_lookup_gap',
        reason_codes: reasonCodes.concat(localSde.ready ? ['local_sde_ready'] : ['local_sde_incomplete']),
        gates,
        notes
      };
    }
  }

  if (candidateGroups.provider_needed > 0) {
    if (gates.storage.state === 'block') {
      return policy('blocked_by_storage', ['storage_blocks_hydration_writes', ...reasonCodes], gates, notes);
    }
    if (gates.external_io.state === 'hold') {
      return policy('held_by_external_io', ['external_io_off_holds_provider_hydration', ...reasonCodes], gates, notes);
    }
    if (gates.live_provider.state === 'block') {
      return policy('eligible_provider_if_gates_pass', ['provider_labels_need_live_gate_before_execution', ...reasonCodes], gates, notes);
    }
    if (laneId === 'corpus_hygiene_low_priority') {
      return policy('deferred_by_priority', ['corpus_hygiene_low_priority_deferred', ...reasonCodes], gates, notes);
    }
    return policy('eligible_provider_if_gates_pass', ['provider_needed_labels_require_all_gates', ...reasonCodes], gates, notes);
  }

  if (candidateGroups.known_local > 0) {
    if (gates.storage.state === 'block') {
      return policy('blocked_by_storage', ['storage_blocks_local_label_patches', ...reasonCodes], gates, notes);
    }
    if (laneId === 'corpus_hygiene_low_priority') {
      return policy('deferred_by_priority', ['local_known_corpus_hygiene_deferred', ...reasonCodes], gates, notes);
    }
    return policy('eligible_local', ['known_local_labels_can_patch_readability_without_provider', ...reasonCodes], gates, notes);
  }

  return policy('not_applicable', ['no_executable_hydration_group'], gates, notes);
}

function policy(state, reasonCodes, gates, notes) {
  return {
    state,
    reason_codes: reasonCodes,
    gates,
    notes
  };
}

function storageGateSummary(storageSetup = {}) {
  const action = storageSetup.action_class_matrix?.actions?.fast_view_metadata_hydration || {};
  const posture = action.posture || 'unknown';
  const state = ['block', 'block_writes'].includes(posture)
    ? 'block'
    : ['conditional', 'active_view_only', 'defer_by_default'].includes(posture)
      ? 'conditional'
      : 'pass';
  return {
    state,
    storage_state: storageSetup.action_class_matrix?.storage_state || null,
    budget_state: storageSetup.budget?.state || null,
    dry_run_posture_input_only: posture,
    would_allow_is_authorization: false,
    reason: state === 'block' ? 'storage_or_budget_blocks_future_hydration_writes' : 'storage_input_allows_or_conditions_future_hydration'
  };
}

function externalIoSummary(stack = {}, requestedState = null) {
  const gate = stack?.gates?.external_io || {};
  const state = gate.state === 'held_by_external_io'
    ? 'hold'
    : ['external_io_released_to_normal_gates', 'released_to_normal_gates'].includes(gate.state)
      ? 'pass'
      : 'unknown';
  return {
    state,
    requested_readout_state: requestedState || gate.requested_readout_state || null,
    posture: gate.state || null,
    held_is_failure: false,
    catch_up_flood_on_reenable: false
  };
}

function liveProviderSummary(stack = {}) {
  const gate = stack?.gates?.external_api || {};
  if (!gate.mode) {
    return {
      state: 'unknown',
      reason: 'live_gate_context_missing'
    };
  }
  return {
    state: gate.allowed === true ? 'pass' : 'block',
    mode: gate.mode,
    live_gate_state: gate.state,
    blockers: (gate.blockers || []).map((entry) => entry.code || entry.message),
    estimated_api_calls: gate.estimated_api_calls || null
  };
}

function cadenceSummary(stack = {}) {
  const requestControl = stack?.gates?.external_api?.request_control || null;
  if (!requestControl) {
    return {
      state: 'unknown',
      reason: 'cadence_request_control_missing'
    };
  }
  if (requestControl.lockout_active) {
    return {
      state: 'block',
      reason: 'provider_lockout_active'
    };
  }
  if (requestControl.cooldown_active) {
    return {
      state: 'hold',
      reason: 'provider_cooldown_active'
    };
  }
  return {
    state: 'pass',
    reason: 'cadence_input_pass',
    persistence: requestControl.persistence || null
  };
}

function composedHydrationSummary(row = {}) {
  return {
    state: row?.composed_state || 'unknown',
    command: row?.command || 'metadata.hydration',
    dry_run_decision_input_only: row?.effects_classification_basis?.dry_run_decision_input_only || null,
    would_allow_is_authorization: false,
    reason_codes: row?.reason_codes || []
  };
}

function commandAuthoritySummary(row = {}) {
  const gate = row?.gates?.confirmation_ux || {};
  return {
    renderer_allowed: row?.effects_classification_basis ? true : null,
    confirmation_state: gate.state || null,
    confirmation_reason: gate.reason || null,
    confirmation_token_is_secret: false
  };
}

function localSdeReadiness(db) {
  const counts = {
    regions: count(db, 'regions'),
    constellations: count(db, 'constellations'),
    solar_systems: count(db, 'solar_systems'),
    system_adjacency: count(db, 'system_adjacency'),
    type_metadata: count(db, 'type_metadata')
  };
  const topologyReady = counts.regions > 0 && counts.constellations > 0 && counts.solar_systems > 0 && counts.system_adjacency > 0;
  const inventoryReady = counts.type_metadata > 0;
  return {
    state: topologyReady && inventoryReady ? 'pass' : 'conditional',
    topology_ready: topologyReady,
    inventory_ready: inventoryReady,
    ready: topologyReady && inventoryReady,
    counts,
    provider_needed: false,
    meaning: 'Local SDE/type/geography lookup readiness is local metadata posture, not Evidence/EVEidence or ESI hydration.'
  };
}

function representativeCandidatesForLane(lane, entityCandidates, sdeGaps) {
  const ids = new Set((lane.representatives || []).map(candidateKey));
  const candidates = [...entityCandidates, ...sdeGaps].filter((entry) => ids.has(candidateKey(entry)));
  return candidates.length ? candidates : (lane.representatives || []);
}

function summarizeCandidateGroups(candidates) {
  return {
    provider_needed: candidates.filter((entry) => entry.provider_needed === true).length,
    known_local: candidates.filter((entry) => entry.label_state === 'known_local_label' || entry.label_state === 'known_local_sde_label').length,
    local_sde_gap: candidates.filter((entry) => entry.label_state === 'local_sde_gap').length,
    total: candidates.length
  };
}

function summarizePolicy({ lanes, backlog }) {
  return {
    total_lanes: lanes.length,
    by_policy_state: lanes.reduce((counts, lane) => {
      counts[lane.policy_state] = (counts[lane.policy_state] || 0) + 1;
      return counts;
    }, {}),
    provider_needed_entity_label_candidates: backlog.summary.provider_needed_entity_label_candidates,
    local_known_label_candidates: backlog.summary.local_known_label_candidates,
    local_sde_gap_candidates: backlog.summary.local_sde_gap_candidates,
    persisted_queue: false,
    provider_calls: 0,
    hydration_writes: 0,
    missing_labels_are_report_failure: false,
    hydration_creates_evidence: false
  };
}

function priorityForLane(laneId) {
  if (laneId === 'view_local_record') {
    return 'point_of_need_not_starved';
  }
  if (laneId === 'target_report_scoped') {
    return 'scoped_operator_relevance';
  }
  if (laneId === 'watch_background') {
    return 'patient_background';
  }
  if (laneId === 'local_sde_lookup_gaps') {
    return 'local_lookup_readiness';
  }
  return 'deferred_low_priority';
}

function emptyLane(laneId) {
  return {
    lane_id: laneId,
    label: laneId,
    candidate_count: 0,
    provider_needed_count: 0,
    locally_known_count: 0,
    local_sde_gap_count: 0,
    representatives: []
  };
}

function candidateKey(entry = {}) {
  return `${entry.entity_type || entry.lookup_type || 'unknown'}:${entry.entity_id || entry.id}`;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function normalizeExternalIoState(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['on', 'enabled', 'allow', 'allowed'].includes(normalized) ? 'on' : 'off';
}

module.exports = {
  buildHydrationExecutionPolicyPreview
};
