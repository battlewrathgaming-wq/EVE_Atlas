const { buildDiscoveryPickupSelectionContract } = require('./discoveryPickupSelectionContractService');

const ACTION = 'discovery.provider_route_packet.preview';
const ZKILL_PAST_SECONDS_MAX = 604800;
const ZKILL_PAST_SECONDS_STEP = 3600;

function buildDiscoveryProviderRoutePacketPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const suppliedCandidates = input.discoveryPickupSelectionCandidates || input.discovery_pickup_selection_candidates;
  const usesTrustedSuppliedCandidates = Array.isArray(suppliedCandidates)
    && context.trusted === true
    && context.source !== 'renderer';
  const selection = usesTrustedSuppliedCandidates
    ? trustedSelectionFromCandidates(suppliedCandidates, externalIoState)
    : buildDiscoveryPickupSelectionContract(db, { ...input, externalIoState }, context);
  const selectedCandidates = Array.isArray(selection.selection_candidates) ? selection.selection_candidates : [];
  const sourceExcludedRows = Array.isArray(selection.excluded_rows) ? selection.excluded_rows : [];
  const routePackets = selectedCandidates.flatMap(routePacketsForCandidate);
  const candidatePacketCounts = selectedCandidates.map((candidate) => {
    const systemIds = includedSystemIdsFor(candidate);
    return {
      packet_count_status: systemIds.length ? 'route_packets_previewed' : 'no_packets_invalid_or_empty_accepted_scope',
      bucket_item_id: candidate.bucket_item_id || null,
      watch_run_id: candidate.watch_run_id || null,
      watch_type: candidate.watch_type || null,
      watch_id: candidate.watch_id ?? null,
      source_kind: candidate.source_kind || null,
      accepted_included_system_count: systemIds.length,
      route_packet_preview_count: systemIds.length,
      creates_provider_packets: false,
      provider_calls: 0,
      candidate_refs_written: 0
    };
  });
  const selectedWithoutPackets = candidatePacketCounts
    .filter((entry) => entry.route_packet_preview_count === 0)
    .map((entry) => ({
      provider_route_packet_status: 'excluded_from_provider_route_packet_preview',
      reason: 'selected_candidate_has_no_accepted_included_system_ids',
      bucket_item_id: entry.bucket_item_id,
      watch_run_id: entry.watch_run_id,
      watch_type: entry.watch_type,
      watch_id: entry.watch_id,
      source_kind: entry.source_kind,
      provider_route_packet_preview_count: 0,
      creates_provider_packets: false,
      provider_calls: 0,
      candidate_refs_written: 0
    }));
  const excludedRows = sourceExcludedRows.map(providerRouteExclusionFor);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Discovery provider route packet preview from selected pickup candidates',
    contract_only: true,
    preview_only: true,
    read_only: true,
    read_only_to_operator_corpus: true,
    mutates_state: false,
    renderer_eligible: true,
    product_bucket_selection_basis: true,
    product_schema_used: true,
    product_schema_updated: false,
    schema_changes: 0,
    operator_corpus_mutated: false,
    system_radius_only: true,
    actor_watch_migration: false,
    provider_route_packet_shape_only: true,
    provider_route_packets_are_preview_only: true,
    provider_route_packets_execute: false,
    provider_route_packets_persisted: false,
    provider_route_url_persisted: false,
    route_packets_for_later_zkill_candidate_acquisition_only: true,
    route_packets_are_not_evidence_expansion: true,
    route_packets_are_not_hydration: true,
    center_radius_execution_authority: false,
    center_radius_provenance_only: true,
    production_pickup_execution: false,
    provider_packets: 0,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    discovery_pickup_started: false,
    discovery_pickup_packets_created: 0,
    pickup_packets_created: 0,
    pickup_units_created: 0,
    pickup_units_leased: 0,
    leases_created: 0,
    queue_items_created: 0,
    durable_discovery_task_rows_written: 0,
    dispatcher_started: false,
    dispatch_runner_invoked: false,
    dispatcher_queue_lease_behavior: false,
    lease_queue_dispatcher_behavior: false,
    provider_packets_created: 0,
    provider_packets_dispatched: 0,
    candidate_refs_emitted: 0,
    candidate_refs_written: 0,
    durable_discovery_refs_written: false,
    discovery_refs_written: false,
    discovered_killmail_refs_written: 0,
    discovery_refs_mutated: 0,
    evidence_created: false,
    evidence_written: false,
    evidence_rows_written: 0,
    evidence_writes: 0,
    hydration_created: false,
    hydration_writes: 0,
    metadata_writes: 0,
    observation_created: false,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    watch_mutations: 0,
    watch_rows_mutated: 0,
    cadence_mutations: 0,
    receipt_mutations: 0,
    watch_bucket_status_mutations: 0,
    watch_executor_tick_called: false,
    task_runner_methods_called: [],
    collectors_called: false,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    external_io_posture: {
      state: externalIoState,
      external_io_is_provider_movement_gate: true,
      external_io_on_starts_pickup: false,
      external_io_on_dispatches_provider_packets: false,
      external_io_on_creates_catch_up_flood: false,
      provider_calls: 0,
      zkill_calls: 0,
      esi_calls: 0
    },
    input_authority: {
      selected_candidates_from_selection_contract: !usesTrustedSuppliedCandidates,
      trusted_supplied_candidates_used: usesTrustedSuppliedCandidates,
      renderer_supplied_candidates_authoritative: false
    },
    zkill_route_policy_preview: {
      provider: 'zkillboard',
      acquisition_lane: 'zkill_candidate_acquisition',
      route_shape: 'kills_system_past_seconds',
      structured_route_only: true,
      arbitrary_modifier_grammar_allowed: false,
      trailing_slash_required: true,
      max_results_per_request: 1000,
      past_seconds_max: ZKILL_PAST_SECONDS_MAX,
      past_seconds_multiple_of: ZKILL_PAST_SECONDS_STEP,
      user_agent_required: true,
      gzip_supported: true,
      local_cache_expected: true,
      provider_spacing_required_before_execution: true,
      execution_opened_by_this_preview: false
    },
    summary: {
      selected_candidate_count: selectedCandidates.length,
      provider_route_packet_preview_count: routePackets.length,
      packet_preview_count: routePackets.length,
      packet_count_by_candidate: candidatePacketCounts,
      selected_candidates_without_packets_count: selectedWithoutPackets.length,
      excluded_row_count: excludedRows.length + selectedWithoutPackets.length,
      source_selection_excluded_row_count: excludedRows.length,
      held_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'held_by_external_io').length,
      rejected_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'rejected_before_pickup_consumption').length,
      not_input_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'not_pickup_input').length,
      actor_excluded_count: excludedRows.filter((row) => row.reason === 'actor_watch_bucket_rows_are_parked_for_pickup_readout').length,
      non_open_excluded_count: excludedRows.filter((row) => row.reason === 'bucket_status_is_not_open').length,
      malformed_or_missing_scope_excluded_count: excludedRows.filter((row) => row.rejection_family === 'invalid_or_missing_accepted_scope').length,
      overlapping_watch_scopes_remain_independent: independentPacketOverlapCount(routePackets),
      provider_calls: 0,
      live_api_calls: 0,
      zkill_calls: 0,
      esi_calls: 0,
      pickup_units_created: 0,
      leases_created: 0,
      queue_items_created: 0,
      dispatcher_runtime_started: false,
      candidate_refs_written: 0,
      discovery_refs_written: false,
      evidence_eveidence_writes: 0,
      hydration_writes: 0,
      observation_created: false,
      watch_cadence_mutations: 0,
      receipt_mutations: 0,
      watch_bucket_status_mutations: 0,
      schema_changes: 0
    },
    provider_route_packet_previews: routePackets,
    selected_candidate_packet_counts: candidatePacketCounts,
    excluded_rows: [
      ...excludedRows,
      ...selectedWithoutPackets
    ],
    source_selection_summary: selection.summary || null,
    boundary_table_check: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after),
      watch_bucket_items_mutated: false,
      fetch_runs_mutated: false,
      discovered_killmail_refs_mutated: false,
      killmails_mutated: false,
      activity_events_mutated: false,
      api_request_logs_mutated: false,
      data_quality_warnings_mutated: false,
      metadata_runs_mutated: false,
      watch_cadence_rows_mutated: false,
      receipt_rows_mutated: false,
      product_tables_mutated: false
    },
    accepted_model: {
      input_language: 'discovery_pickup_selection_candidates',
      selected_candidates_are_source_basis: true,
      one_accepted_included_system_id_yields_one_route_packet_preview: true,
      route_packet_preview_is_not_provider_packet_creation: true,
      route_packet_preview_is_not_pickup_unit_or_lease: true,
      route_packet_preview_is_not_candidate_ref_or_discovery_ref: true,
      route_packet_preview_is_not_evidence_expansion: true,
      route_packet_preview_is_not_hydration: true,
      center_radius_is_provenance_only_not_execution_authority: true,
      held_rows_do_not_create_route_packets: true,
      rejected_rows_do_not_create_route_packets: true,
      not_pickup_input_rows_do_not_create_route_packets: true,
      overlapping_watch_intents_remain_independent_route_packet_previews: true,
      provider_execution_started_by_this_preview: false,
      schema_accepted_by_this_preview: false,
      runtime_behavior_changed_by_this_preview: false
    },
    boundary: [
      'Read-only Discovery provider-route packet preview from selected product Watch bucket pickup candidates.',
      'Each accepted included system ID becomes one inert zKill route packet preview for later candidate acquisition only.',
      'Center/radius is preserved as provenance/explanation only; stored included_system_ids remain execution-scope authority.',
      'Held, rejected, not-input, actor, non-open, and malformed/missing-scope rows remain exclusions and do not create route packets.',
      'No Discovery pickup execution, leases, queues, dispatcher runtime, provider calls, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema, enforcement, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_update_src_main_db_schema_sql',
      'does_not_start_discovery_pickup_or_dispatch_provider_packets',
      'does_not_create_pickup_units_leases_queue_items_dispatcher_or_durable_discovery_tasks',
      'does_not_call_zkill_or_esi',
      'does_not_emit_or_write_candidate_refs_discovery_refs_evidence_eveidence_hydration_observation_or_api_logs',
      'does_not_mutate_watch_bucket_status_or_receipts',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_migrate_actor_watch',
      'does_not_implement_runtime_enforcement_or_ui'
    ]
  };
}

function routePacketsForCandidate(candidate = {}) {
  return includedSystemIdsFor(candidate).map((systemId, index) => {
    const acceptedScope = candidate.accepted_scope || {};
    const routeWindow = routeWindowFor(candidate.window);
    return {
      provider_route_packet_status: 'preview_only_non_executing',
      preview_only: true,
      executes_provider_call: false,
      dispatchable_now: false,
      persisted: false,
      packet_shape_for_later: 'zkill_candidate_acquisition_only',
      not_evidence_expansion: true,
      not_hydration: true,
      provider: 'zkillboard',
      provider_family: 'zkill',
      provider_route_family: 'zkill_system_killmails',
      route_intent: 'candidate_lead_acquisition',
      packet_identity: `preview-zkill-system:${candidate.watch_run_id || 'unknown-run'}:${systemId}`,
      packet_index_within_candidate: index,
      bucket_item_id: candidate.bucket_item_id || null,
      watch_run_id: candidate.watch_run_id || null,
      watch_type: candidate.watch_type || null,
      watch_id: candidate.watch_id ?? null,
      source_kind: candidate.source_kind || null,
      bucket_status: candidate.bucket_status || null,
      system_id: systemId,
      accepted_scope: acceptedScope,
      accepted_scope_execution_authority: acceptedScope.execution_authority || 'stored_included_system_ids',
      accepted_included_system_ids: [...includedSystemIdsFor(candidate)],
      center_radius_provenance: {
        center_system_id: acceptedScope.center_system_id ?? null,
        center_system_name: acceptedScope.center_system_name || null,
        radius_jumps: acceptedScope.radius_jumps ?? null,
        center_radius_is_provenance_only: true,
        center_radius_used_as_execution_authority: false
      },
      window: candidate.window || null,
      route_window: routeWindow,
      caps: candidate.caps || null,
      provenance: {
        ...(candidate.provenance || {}),
        source_selection_basis: candidate.selection_contract_status || null,
        provider_route_preview_source_action: ACTION
      },
      source_selection_basis: {
        selection_contract_status: candidate.selection_contract_status || null,
        discovery_pickup_input_candidate: candidate.discovery_pickup_input_candidate === true,
        bucket_status: candidate.bucket_status || null,
        provider_posture_basis: candidate.provider_posture_basis || null
      },
      zkill_route: {
        route_shape: 'kills_system_past_seconds',
        method: 'GET',
        path_template: '/api/kills/systemID/{system_id}/pastSeconds/{past_seconds}/',
        path_parameters: {
          system_id: systemId,
          past_seconds: routeWindow.past_seconds
        },
        trailing_slash_required: true,
        structured_route_only: true,
        arbitrary_modifier_grammar_allowed: false,
        max_results: 1000
      },
      provider_policy_preview: {
        user_agent_required: true,
        gzip_supported: true,
        local_cache_expected: true,
        provider_spacing_required: true,
        provider_calls: 0,
        zkill_calls: 0,
        esi_calls: 0
      },
      side_effects: zeroSideEffects()
    };
  });
}

function providerRouteExclusionFor(row = {}) {
  return {
    provider_route_packet_status: 'excluded_from_provider_route_packet_preview',
    reason: row.reason || 'not_selected_by_discovery_pickup_selection_contract',
    exclusion_family: row.exclusion_family || 'not_selected',
    rejection_family: row.rejection_family || null,
    source_pickup_readout_status: row.source_pickup_readout_status || null,
    selection_contract_status: row.selection_contract_status || null,
    bucket_item_id: row.bucket_item_id || null,
    watch_run_id: row.watch_run_id || null,
    watch_type: row.watch_type || null,
    watch_id: row.watch_id ?? null,
    source_kind: row.source_kind || null,
    bucket_status: row.bucket_status || null,
    accepted_scope: row.accepted_scope || null,
    scope_posture: row.scope_posture || null,
    window: row.window || null,
    caps: row.caps || null,
    provenance: row.provenance || null,
    provider_route_packet_preview_count: 0,
    creates_route_packet_preview: false,
    creates_provider_packet: false,
    starts_discovery_pickup: false,
    provider_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    candidate_refs_written: 0,
    discovery_refs_written: false,
    evidence_eveidence_written: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutated: false,
    bucket_status_mutated: false,
    receipt_mutated: false
  };
}

function includedSystemIdsFor(candidate = {}) {
  const fromScopePosture = candidate.scope_posture?.included_system_ids;
  const fromAcceptedScope = candidate.accepted_scope?.included_system_ids;
  const ids = Array.isArray(fromScopePosture) ? fromScopePosture : fromAcceptedScope;
  return [...new Set((Array.isArray(ids) ? ids : []).map(Number).filter(Number.isFinite))];
}

function routeWindowFor(window = {}) {
  const requested = Number(window?.lookback_seconds);
  const bounded = Number.isFinite(requested) && requested > 0
    ? Math.min(ZKILL_PAST_SECONDS_MAX, Math.ceil(requested / ZKILL_PAST_SECONDS_STEP) * ZKILL_PAST_SECONDS_STEP)
    : ZKILL_PAST_SECONDS_STEP;
  return {
    lookback_seconds: Number.isFinite(requested) && requested > 0 ? requested : null,
    past_seconds: bounded,
    past_seconds_rounded_to_provider_step: bounded,
    past_seconds_step_seconds: ZKILL_PAST_SECONDS_STEP,
    past_seconds_max_seconds: ZKILL_PAST_SECONDS_MAX
  };
}

function independentPacketOverlapCount(routePackets = []) {
  const systems = new Map();
  for (const packet of routePackets) {
    const key = packet.system_id;
    const existing = systems.get(key) || new Set();
    existing.add(packet.watch_run_id);
    systems.set(key, existing);
  }
  return [...systems.values()].filter((watchRuns) => watchRuns.size > 1).length;
}

function trustedSelectionFromCandidates(candidates, externalIoState) {
  return {
    action: 'trusted_supplied_discovery_pickup_selection_candidates',
    external_io_posture: {
      state: externalIoState
    },
    selection_candidates: candidates,
    excluded_rows: [],
    summary: {
      selected_candidate_count: candidates.length,
      excluded_row_count: 0
    }
  };
}

function zeroSideEffects() {
  return {
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    pickup_units_created: 0,
    leases_created: 0,
    queue_items_created: 0,
    dispatcher_runtime_started: false,
    candidate_refs_written: 0,
    discovery_refs_written: false,
    evidence_eveidence_writes: 0,
    hydration_writes: 0,
    observation_created: false,
    watch_cadence_mutations: 0,
    bucket_status_mutations: 0,
    receipt_mutations: 0,
    schema_changes: 0
  };
}

function stateSnapshot(db) {
  return {
    watch_bucket_items: count(db, 'watch_bucket_items'),
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

function normalizeExternalIoState(state) {
  return state === 'on' ? 'on' : 'off';
}

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildDiscoveryProviderRoutePacketPreview
};
