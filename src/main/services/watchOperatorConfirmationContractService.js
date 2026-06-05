const { buildSystemRadiusAuthoringPreflight } = require('./systemRadiusAuthoringPreflightService');

const ACTION = 'watch.operator_confirmation_contract.preview';
const PREFLIGHT_ACTION = 'watch.system_radius_authoring_preflight.preview';
const TARGET_COMMAND = 'watch.create';

function buildWatchOperatorConfirmationContractPreview(db, input = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const preflightInput = input.preflightInput || input.preflight_input || input;
  const preflight = input.preflight || buildSystemRadiusAuthoringPreflight(db, preflightInput);
  const interaction = normalizeInteraction(input);
  const candidate = visibleCandidateFromPreflight(preflight);
  const contractState = contractStateFor({ preflight, interaction, candidate });
  const acceptedPayload = contractState.state === 'confirmed_accepted_scope_payload'
    ? acceptedWatchCreatePayload({ preflight, candidate, input })
    : null;
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Watch operator confirmation/listen-hook contract preview',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    watch_dispatches: 0,
    watch_rows_written: 0,
    would_write_watch_row: false,
    tasks_created: 0,
    discovery_ref_mutations: 0,
    discovery_refs_mutated: 0,
    evidence_writes: 0,
    evidence_rows_written: 0,
    hydration_writes: 0,
    metadata_writes: 0,
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    popup_modal_behavior: false,
    final_copy_design: false,
    source_preflight_action: PREFLIGHT_ACTION,
    source_preflight_status: preflight.status || 'unknown',
    source_preflight_result_shape: sourcePreflightShape(preflight),
    visible_operator_payload_before_acceptance: candidate.visible_payload,
    listen_hook_confirmation_boundary: confirmationBoundary(interaction, contractState),
    expected_states: expectedStates(contractState),
    acceptance_rules: acceptanceRules(),
    contract_state: contractState.state,
    confirmation_ready: contractState.confirmation_ready,
    confirmation_pending_operator_intent: contractState.confirmation_pending_operator_intent,
    accepted_payload_ready_for_watch_create: Boolean(acceptedPayload),
    accepted_payload_shape: acceptedPayload,
    accepted_payload_preserves_exact_included_system_ids: acceptedPayload
      ? sameArray(acceptedPayload.included_system_ids, candidate.included_system_ids)
      : false,
    center_radius_role_after_acceptance: 'provenance_explanation_management',
    accepted_included_ids_role_after_acceptance: 'stored_scope_authority',
    renderer_forgery_posture: {
      renderer_provided_included_ids_authoritative: false,
      renderer_claims_may_replace_preflight_ids: false,
      accepted_ids_source: 'server_local_preflight_result_after_explicit_confirmation',
      local_validation_required_before_watch_create: true,
      validation_basis: [
        PREFLIGHT_ACTION,
        'local_topology_lookup_tables',
        'watch.create accepted-scope validation'
      ],
      forged_ids_rejected_by_contract: true
    },
    interaction_agnostic: {
      exact_ui_affordance_parked: true,
      allowed_future_confirming_acts: [
        'typed_command',
        'keyboard_action',
        'mouse_action',
        'light_check',
        'hold_press',
        'terminal_initialize_action'
      ],
      this_preview_implements_renderer_behavior: false
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    },
    boundary: [
      'Read-only operator confirmation/listen-hook contract preview only; it does not implement renderer UI or popup/modal behavior.',
      'Preflight result visibility, focus, hover, highlight, keyboard navigation, and successful local topology lookup are not acceptance.',
      'Only an explicit renderer/listen-hook confirming act may produce accepted scope for watch.create.',
      'Accepted payload must preserve exact included_system_ids from local preflight; renderer-forged included IDs are not authority.',
      'Center/radius remain provenance/explanation/management after acceptance; accepted included IDs are stored-scope authority.',
      'No Watch execution, tasks, providers, Watch rows, Discovery refs, Evidence/EVEidence, Hydration, schema, support artifacts, enforcement, result identity, relationship tags, source-term renames, protected-word JSON, or fourth-lane behavior is opened.'
    ]
  };
}

function sourcePreflightShape(preflight) {
  return {
    action: preflight.action || PREFLIGHT_ACTION,
    status: preflight.status || 'unknown',
    acceptable_for_watch_authoring: preflight.acceptable_for_watch_authoring === true,
    selected_center_system: preflight.selected_center_system || null,
    requested_scope: preflight.requested_scope || null,
    operator_facing_readout_present: Boolean(preflight.operator_facing_readout),
    included_system_count: preflight.included_system_count || 0,
    direct_neighbor_count: preflight.direct_neighbor_count || 0,
    direct_neighbor_count_role: preflight.direct_neighbor_count_role || null,
    included_system_ids_for_acceptance: Array.isArray(preflight.included_system_ids_for_acceptance)
      ? preflight.included_system_ids_for_acceptance.map(Number)
      : [],
    guardrails: preflight.guardrails || [],
    issues: preflight.issues || [],
    topology_status: preflight.topology_posture || null
  };
}

function visibleCandidateFromPreflight(preflight) {
  const acceptedIds = Array.isArray(preflight.included_system_ids_for_acceptance)
    ? preflight.included_system_ids_for_acceptance.map(Number)
    : [];
  const visiblePayload = {
    center_system: preflight.selected_center_system
      ? {
          solar_system_id: preflight.selected_center_system.solar_system_id,
          solar_system_name: preflight.selected_center_system.solar_system_name
        }
      : null,
    radius_jumps: preflight.requested_scope?.radius_jumps ?? null,
    included_systems: preflight.operator_facing_readout?.included_systems || [],
    included_system_ids: acceptedIds,
    cap_status: capStatus(preflight),
    blocked_status: blockedStatus(preflight),
    local_topology_status: localTopologyStatus(preflight),
    visible_is_acceptance: false,
    storable_included_system_ids_if_confirmed: acceptedIds
  };
  return {
    visible_payload: visiblePayload,
    included_system_ids: acceptedIds
  };
}

function normalizeInteraction(input) {
  const explicit = input.explicitConfirmation === true ||
    input.explicit_confirmation === true ||
    input.confirmed === true ||
    input.confirmationAct === 'explicit_operator_confirm' ||
    input.confirmation_act === 'explicit_operator_confirm';
  return {
    explicit_confirmation: explicit,
    visible: input.preflightVisible === true || input.preflight_visible === true || input.visible === true,
    focus: input.focus === true || input.focused === true,
    hover: input.hover === true || input.hovered === true,
    highlight: input.highlight === true || input.highlighted === true,
    keyboard_navigation: input.keyboardNavigation === true || input.keyboard_navigation === true,
    local_topology_lookup_success: input.localTopologyLookupSuccess === true || input.local_topology_lookup_success === true,
    confirmation_act: explicit ? 'explicit_operator_confirm' : null
  };
}

function contractStateFor({ preflight, interaction, candidate }) {
  const confirmable = preflight.status === 'acceptable' &&
    preflight.acceptable_for_watch_authoring === true &&
    candidate.included_system_ids.length > 0;
  const passiveSignals = passiveSignalNames(interaction);
  if (!confirmable) {
    return {
      state: 'blocked_not_confirmable',
      confirmation_ready: false,
      confirmation_pending_operator_intent: false,
      explicit_confirmation_required: true,
      blocked_reasons: blockedReasons(preflight, candidate),
      passive_signals_seen: passiveSignals,
      passive_signals_are_acceptance: false
    };
  }
  if (interaction.explicit_confirmation) {
    return {
      state: 'confirmed_accepted_scope_payload',
      confirmation_ready: true,
      confirmation_pending_operator_intent: false,
      explicit_confirmation_required: true,
      explicit_confirmation_seen: true,
      blocked_reasons: [],
      passive_signals_seen: passiveSignals,
      passive_signals_are_acceptance: false
    };
  }
  return {
    state: passiveSignals.includes('preflight_visible')
      ? 'preflight_visible_not_accepted'
      : 'confirmation_ready',
    confirmation_ready: true,
    confirmation_pending_operator_intent: true,
    explicit_confirmation_required: true,
    explicit_confirmation_seen: false,
    blocked_reasons: [],
    passive_signals_seen: passiveSignals,
    passive_signals_are_acceptance: false
  };
}

function acceptedWatchCreatePayload({ preflight, candidate, input }) {
  const center = preflight.selected_center_system || {};
  const radiusJumps = preflight.requested_scope?.radius_jumps ?? null;
  return {
    command: TARGET_COMMAND,
    watchType: 'system_radius',
    centerSystemId: center.solar_system_id ?? null,
    centerSystemName: center.solar_system_name ?? null,
    radiusJumps,
    included_system_ids: candidate.included_system_ids,
    accepted_preflight_action: PREFLIGHT_ACTION,
    accepted_preflight_status: preflight.status || 'unknown',
    included_system_ids_source: 'explicit_operator_confirmed_preflight_included_system_ids',
    accepted_scope_source: 'operator_confirmation_listen_hook',
    stored_scope_authority: {
      source: 'accepted_preflight_included_system_ids',
      included_system_ids: candidate.included_system_ids,
      center_radius_role: 'provenance_explanation_management',
      accepted_included_ids_role: 'stored_scope_authority',
      topology_recomputed_for_payload: false
    },
    provenance: {
      center_system_id: center.solar_system_id ?? null,
      center_system_name: center.solar_system_name ?? null,
      radius_jumps: radiusJumps,
      source_preflight_action: PREFLIGHT_ACTION,
      confirmation_boundary_action: ACTION
    },
    settings: normalizeOptionalSettings(input),
    payload_directly_executable_after_confirmation: true,
    would_recompute_topology_from_center_radius: false,
    renderer_forged_ids_authoritative: false
  };
}

function confirmationBoundary(interaction, contractState) {
  return {
    list_visible_is_acceptance: false,
    focus_is_acceptance: false,
    hover_is_acceptance: false,
    highlight_is_acceptance: false,
    keyboard_navigation_is_acceptance: false,
    successful_local_topology_lookup_is_acceptance: false,
    explicit_operator_confirmation_required: true,
    explicit_operator_confirmation_seen: interaction.explicit_confirmation,
    confirmation_act: interaction.confirmation_act,
    current_state: contractState.state,
    confirmation_listen_hook_role: 'interaction_agnostic_future_boundary',
    renderer_behavior_implemented: false
  };
}

function expectedStates(active) {
  return [
    {
      state: 'preflight_visible_not_accepted',
      produces_accepted_scope: false,
      active: active.state === 'preflight_visible_not_accepted'
    },
    {
      state: 'confirmation_ready',
      produces_accepted_scope: false,
      active: active.state === 'confirmation_ready'
    },
    {
      state: 'confirmation_pending_operator_intent',
      produces_accepted_scope: false,
      active: active.confirmation_pending_operator_intent === true
    },
    {
      state: 'confirmed_accepted_scope_payload',
      produces_accepted_scope: true,
      active: active.state === 'confirmed_accepted_scope_payload'
    },
    {
      state: 'blocked_not_confirmable',
      produces_accepted_scope: false,
      active: active.state === 'blocked_not_confirmable'
    }
  ];
}

function acceptanceRules() {
  return {
    preflight_can_prepare_candidate_scope: true,
    confirmation_can_accept_candidate_scope: true,
    watch_create_may_receive_accepted_scope_only_after_confirmation: true,
    future_accepted_payload_must_not_recompute_topology_from_center_radius: true,
    renderer_forged_ids_are_not_authority: true,
    server_local_validation_posture_required: true,
    ui_affordance_parked: true
  };
}

function normalizeOptionalSettings(input) {
  return {
    lookback_hours: optionalNumber(input.lookbackHours ?? input.lookback_hours),
    max_systems: optionalNumber(input.maxSystems ?? input.max_systems),
    max_refs: optionalNumber(input.maxRefs ?? input.max_refs),
    max_killmails: optionalNumber(input.maxKillmails ?? input.max_killmails),
    poll_interval_minutes: optionalNumber(input.pollIntervalMinutes ?? input.poll_interval_minutes),
    active: typeof input.active === 'boolean' ? input.active : null,
    notes: typeof input.notes === 'string' ? input.notes : null
  };
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function capStatus(preflight) {
  if (preflight.status === 'capped_scope_not_acceptable_without_adjustment') {
    return 'capped_not_confirmable';
  }
  return preflight.guardrails?.length ? 'guardrails_present' : 'not_capped';
}

function blockedStatus(preflight) {
  return preflight.acceptable_for_watch_authoring === true ? 'not_blocked' : 'blocked_not_confirmable';
}

function localTopologyStatus(preflight) {
  const posture = preflight.topology_posture || {};
  if (posture.local_topology_tables_present && posture.local_topology_edges_present) {
    return 'local_topology_lookup_available';
  }
  return 'local_topology_lookup_missing_or_incomplete';
}

function passiveSignalNames(interaction) {
  const signals = [];
  if (interaction.visible) signals.push('preflight_visible');
  if (interaction.focus) signals.push('focus');
  if (interaction.hover) signals.push('hover');
  if (interaction.highlight) signals.push('highlight');
  if (interaction.keyboard_navigation) signals.push('keyboard_navigation');
  if (interaction.local_topology_lookup_success) signals.push('local_topology_lookup_success');
  return signals;
}

function blockedReasons(preflight, candidate) {
  const reasons = [];
  if (preflight.status !== 'acceptable') {
    reasons.push(`preflight_status_${preflight.status || 'unknown'}`);
  }
  if (preflight.acceptable_for_watch_authoring !== true) {
    reasons.push('preflight_not_acceptable_for_watch_authoring');
  }
  if (!candidate.included_system_ids.length) {
    reasons.push('missing_accepted_included_system_ids');
  }
  return reasons;
}

function sameArray(left = [], right = []) {
  return stableJson(left) === stableJson(right);
}

function stateSnapshot(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    entities: count(db, 'entities'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildWatchOperatorConfirmationContractPreview
};
