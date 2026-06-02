const { buildHydrationAttentionLensPreview } = require('./hydrationAttentionLensService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');

function buildHydrationAttentionRuntimePosturePreview(db, input = {}, context = {}) {
  const lens = buildHydrationAttentionLensPreview(db, input);
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || context.externalIoState || 'off');
  const storageSetup = buildStorageSetupGateReadout({}, {
    ...context,
    allowStorageSetupGateFixtureInput: false
  });
  const selected = lens.selected_candidates || [];
  const deferred = lens.deferred_candidates || [];
  const allItems = [...selected, ...deferred];
  const groups = postureGroups({ selected, deferred, externalIoState });
  const storagePosture = storageRuntimePosture(storageSetup);

  return {
    action: 'metadata.hydration_attention_runtime.preview',
    classification: 'read-only Hydration attention runtime posture preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    hydration_writes: 0,
    entity_writes: 0,
    activity_event_label_patches: 0,
    metadata_run_writes: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    watch_mutations: 0,
    assessment_memory_mutations: 0,
    marked_mutations: 0,
    support_artifacts_created: 0,
    persisted_queue: false,
    schema_changes: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    input_lens_summary: {
      action: lens.action,
      lens_type: lens.lens_input?.lens_type || 'unknown',
      report_target: lens.lens_input?.report_target || null,
      explicit_candidate_keys: lens.lens_input?.explicit_candidate_keys || [],
      explicit_ids: lens.lens_input?.explicit_ids || [],
      source_candidate_count: lens.summary?.source_candidate_count || 0,
      selected_candidate_count: selected.length,
      deferred_candidate_count: deferred.length,
      persisted_queue: false,
      provider_authorization: false
    },
    runtime_posture: {
      posture_scope: postureScopeFor(lens.lens_input, allItems),
      external_io: externalIoRuntimePosture(externalIoState, groups.provider_needed_labels.count),
      storage_setup: storagePosture,
      summary: {
        raw_visible_for_now: groups.raw_visible_for_now.count,
        known_local_labels: groups.known_local_labels.count,
        provider_needed_labels: groups.provider_needed_labels.count,
        local_sde_lookup_gaps: groups.local_sde_lookup_gaps.count,
        deferred_candidates: groups.deferred_candidates.count,
        selected_attention_authorizes_provider_calls: false,
        eligibility_authorizes_provider_calls: false,
        local_readability_need_authorizes_provider_calls: false,
        provider_needed_labels_are_failure: false,
        unhydrated_ids_are_report_failure: false,
        future_hydration_writes_blocked_by_storage: storagePosture.future_hydration_writes_blocked,
        local_readout_blocked_by_storage: false
      },
      groups,
      not_computable: notComputable(lens, storagePosture)
    },
    boundary_statements: {
      ids_are_facts: true,
      labels_are_readability: true,
      provider_needed_labels_are_evidence_work: false,
      missing_labels_are_report_failure: false,
      selected_attention_is_provider_authorization: false,
      eligibility_is_provider_authorization: false,
      local_readability_need_is_provider_authorization: false,
      local_sde_gaps_are_provider_hydration: false,
      watch_background_starves_view_local_record: false,
      persisted_hydration_queue_created: false
    },
    boundary: [
      'Raw IDs remain truthful local facts; labels are readability applied over those facts.',
      'Provider-needed labels are future Hydration/readability work, not Evidence/EVEidence work and not ESI Evidence Expansion.',
      'Unhydrated IDs and local SDE gaps are not report failure.',
      'Selected attention, eligibility, and local readability need do not authorize provider calls.',
      'Storage/setup posture may block future Hydration writes while this local readout remains available.',
      'Watch/background and corpus-hygiene candidates remain deferred behind view/local-record attention.'
    ]
  };
}

function postureGroups({ selected, deferred, externalIoState }) {
  const selectedItems = selected.map((entry) => runtimeItem(entry, {
    selection: 'selected_attention',
    externalIoState
  }));
  const deferredItems = deferred.map((entry) => runtimeItem(entry, {
    selection: 'deferred',
    externalIoState
  }));
  const all = [...selectedItems, ...deferredItems];

  return {
    raw_visible_for_now: group(
      all.filter((entry) => entry.runtime_state === 'raw_visible_for_now'),
      'ID should remain visible/raw for now; unresolved readability is not failure.',
      ['raw_id_remains_truthful', 'no_provider_authorization']
    ),
    known_local_labels: group(
      all.filter((entry) => entry.runtime_state === 'known_local_label'),
      'Readable local label already exists or is locally stale but visible.',
      ['local_label_available', 'label_is_readability']
    ),
    provider_needed_labels: group(
      all.filter((entry) => entry.runtime_state === 'provider_needed_label'),
      'Entity label may need future provider-backed Hydration under External I/O, storage, live/provider, cadence, and confirmation gates.',
      ['provider_needed_label', externalIoState === 'off' ? 'held_by_external_io' : 'released_to_normal_gates_only']
    ),
    local_sde_lookup_gaps: group(
      all.filter((entry) => entry.runtime_state === 'local_sde_lookup_gap'),
      'Static type/geography readability gap belongs to local SDE lookup readiness, not provider-backed ESI Hydration.',
      ['local_sde_lookup_gap', 'not_provider_hydration']
    ),
    deferred_candidates: group(
      all.filter((entry) => entry.selection === 'deferred'),
      'Candidate is visible but deferred because it is outside the current lens, Watch/background, corpus hygiene, or capped selection.',
      ['deferred_visible_unresolved']
    )
  };
}

function runtimeItem(candidate, { selection, externalIoState }) {
  const runtimeState = runtimeStateFor(candidate, selection);
  return {
    dedupe_key: candidate.dedupe_key,
    candidate_kind: candidate.candidate_kind,
    entity_type: candidate.entity_type || null,
    entity_id: candidate.entity_id || null,
    lookup_type: candidate.lookup_type || null,
    lookup_id: candidate.lookup_id || null,
    selection,
    runtime_state: runtimeState,
    posture_scope: postureScopeForCandidate(candidate),
    label_state: candidate.label_state || null,
    local_label: candidate.local_label || null,
    provider_needed: candidate.provider_needed === true,
    provider_posture: providerPostureFor(candidate, externalIoState),
    future_write_posture: candidate.provider_needed === true || runtimeState === 'known_local_label'
      ? 'future_hydration_write_requires_storage_and_execution_gates'
      : 'no_provider_hydration_write',
    deferred_reason: candidate.deferred_reason || null,
    reason_codes: reasonCodesFor(candidate, runtimeState, selection, externalIoState),
    lanes: candidate.lanes || [],
    source_anchors: candidate.source_anchors || [],
    source_basis: candidate.source_basis || [],
    killmail_count: candidate.killmail_count || 0,
    appearance_count: candidate.appearance_count || 0,
    ids_are_facts: true,
    labels_are_readability: true,
    provider_call_authorized: false,
    creates_evidence: false
  };
}

function runtimeStateFor(candidate, selection) {
  if (candidate.label_state === 'local_sde_gap') {
    return 'local_sde_lookup_gap';
  }
  if (candidate.label_state === 'known_local_label' || candidate.label_state === 'stale_local_label') {
    return 'known_local_label';
  }
  if (candidate.provider_needed === true) {
    return selection === 'deferred' ? 'raw_visible_for_now' : 'provider_needed_label';
  }
  return 'raw_visible_for_now';
}

function providerPostureFor(candidate, externalIoState) {
  if (candidate.provider_needed !== true) {
    return {
      state: 'not_provider_needed',
      held_is_failure: false,
      provider_call_authorized: false
    };
  }
  return {
    state: externalIoState === 'off' ? 'held_by_external_io' : 'released_to_normal_gates_only',
    held_is_failure: false,
    external_io_on_is_authorization: false,
    provider_call_authorized: false,
    no_catch_up_flood: true
  };
}

function reasonCodesFor(candidate, runtimeState, selection, externalIoState) {
  const codes = [];
  if (selection === 'selected_attention') {
    codes.push('selected_attention_readability_landmark');
  } else {
    codes.push(candidate.deferred_reason || 'deferred_visible_unresolved');
  }
  if ((candidate.lanes || []).includes('view_local_record')) {
    codes.push('view_local_record_attention');
  }
  if ((candidate.lanes || []).includes('target_report_scoped')) {
    codes.push('target_report_scoped_attention');
  }
  if ((candidate.lanes || []).includes('watch_background')) {
    codes.push('watch_background_patient');
  }
  if ((candidate.lanes || []).includes('corpus_hygiene_low_priority')) {
    codes.push('corpus_hygiene_deferred');
  }
  if (runtimeState === 'provider_needed_label') {
    codes.push(externalIoState === 'off' ? 'provider_label_held_by_external_io' : 'provider_label_released_to_normal_gates_only');
  }
  if (runtimeState === 'known_local_label') {
    codes.push('known_local_label_readability');
  }
  if (runtimeState === 'local_sde_lookup_gap') {
    codes.push('local_sde_gap_not_provider_hydration');
  }
  if (runtimeState === 'raw_visible_for_now') {
    codes.push('raw_id_remains_visible_truthful');
  }
  codes.push('provider_call_not_authorized');
  return [...new Set(codes)];
}

function group(items, meaning, defaultReasonCodes) {
  return {
    count: items.length,
    meaning,
    reason_codes: defaultReasonCodes,
    representatives: items.slice(0, 8)
  };
}

function externalIoRuntimePosture(externalIoState, providerNeededCount) {
  return {
    requested_readout_state: externalIoState,
    provider_needed_count: providerNeededCount,
    provider_backed_hydration_posture: externalIoState === 'off' ? 'held_by_external_io' : 'released_to_normal_gates_only',
    held_is_failure: false,
    external_io_on_is_authorization: false,
    selected_attention_is_authorization: false,
    local_readability_need_is_authorization: false,
    provider_calls: 0,
    no_catch_up_flood: true
  };
}

function storageRuntimePosture(storageSetup = {}) {
  const action = storageSetup.action_class_matrix?.actions?.fast_view_metadata_hydration || {};
  const posture = action.posture || 'unknown';
  const blocked = ['block', 'block_writes'].includes(posture);
  return {
    action: storageSetup.action || 'storage.setup_gate_readout',
    storage_state: storageSetup.action_class_matrix?.storage_state || storageSetup.storage?.state || null,
    budget_state: storageSetup.budget?.state || null,
    fast_view_metadata_hydration_posture: posture,
    future_hydration_writes_blocked: blocked,
    local_readout_available: true,
    local_readout_blocked_by_storage: false,
    storage_gate_is_authorization: false,
    reason: blocked
      ? 'storage_setup_can_block_future_hydration_writes_without_blocking_readout'
      : 'storage_setup_does_not_block_this_read_only_readout'
  };
}

function postureScopeFor(lensInput = {}, items = []) {
  const lensType = lensInput?.lens_type || 'unknown';
  if (lensType === 'explicit_ids') {
    return 'explicit-ID';
  }
  if (lensType === 'target_report_scope') {
    return 'target/report-scoped';
  }
  if (items.some((entry) => (entry.lanes || []).includes('watch_background'))) {
    return 'view/local-record_with_watch/background_deferred';
  }
  if (items.every((entry) => (entry.lanes || []).includes('corpus_hygiene_low_priority'))) {
    return 'corpus hygiene';
  }
  return 'view/local-record';
}

function postureScopeForCandidate(candidate = {}) {
  const lanes = candidate.lanes || [];
  if (candidate.attention_basis?.includes('explicit_lens_id')) {
    return 'explicit-ID';
  }
  if (lanes.includes('target_report_scoped')) {
    return 'target/report-scoped';
  }
  if (lanes.includes('watch_background') && !lanes.includes('target_report_scoped')) {
    return 'Watch/background';
  }
  if (lanes.includes('corpus_hygiene_low_priority') && lanes.length === 1) {
    return 'corpus hygiene';
  }
  return 'view/local-record';
}

function notComputable(lens, storagePosture) {
  const gaps = [];
  if (!lens.source_preview || lens.source_preview.candidate_count === 0) {
    gaps.push({
      fact: 'representative_hydration_candidates',
      reason: 'no_current_local_rows_in_preview',
      guessed: false
    });
  }
  if (!storagePosture.storage_state) {
    gaps.push({
      fact: 'storage_setup_state',
      reason: 'storage_setup_readout_did_not_emit_storage_state',
      guessed: false
    });
  }
  return gaps;
}

function normalizeExternalIoState(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['on', 'enabled', 'allow', 'allowed'].includes(normalized) ? 'on' : 'off';
}

module.exports = {
  buildHydrationAttentionRuntimePosturePreview
};
