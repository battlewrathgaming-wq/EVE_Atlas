const { buildDiscoveryProviderRoutePacketPreview } = require('./discoveryProviderRoutePacketPreviewService');

const ACTION = 'discovery.pickup_execution_boundary.preview';

function buildDiscoveryPickupExecutionBoundaryPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const suppliedRoutePreview = input.providerRoutePacketPreview || input.provider_route_packet_preview;
  const usesTrustedSuppliedRoutePreview = suppliedRoutePreview
    && typeof suppliedRoutePreview === 'object'
    && context.trusted === true
    && context.source !== 'renderer';
  const routePreview = usesTrustedSuppliedRoutePreview
    ? trustedRoutePreview(suppliedRoutePreview, externalIoState)
    : buildDiscoveryProviderRoutePacketPreview(db, { ...input, externalIoState }, context);
  const routePackets = Array.isArray(routePreview.provider_route_packet_previews)
    ? routePreview.provider_route_packet_previews
    : [];
  const boundaryPackets = routePackets.map(executionBoundaryForPacket);
  const excludedRows = Array.isArray(routePreview.excluded_rows)
    ? routePreview.excluded_rows.map(executionBoundaryExclusionFor)
    : [];
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Discovery pickup execution boundary preview from provider-route packet previews',
    boundary_preview_only: true,
    contract_only: true,
    preview_only: true,
    read_only: true,
    read_only_to_operator_corpus: true,
    mutates_state: false,
    renderer_eligible: true,
    hs489_route_packet_preview_basis: true,
    product_schema_used: true,
    product_schema_updated: false,
    schema_changes: 0,
    operator_corpus_mutated: false,
    system_radius_only: true,
    actor_watch_migration: false,
    pickup_execution_started: false,
    discovery_pickup_execution: false,
    production_pickup_execution: false,
    boundary_preview_is_dispatcher: false,
    boundary_preview_is_queue: false,
    boundary_preview_is_lease: false,
    boundary_preview_is_provider_worker: false,
    executable_provider_packets_created: 0,
    provider_packets: 0,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    pickup_units_created: 0,
    pickup_units_leased: 0,
    leases_created: 0,
    queue_items_created: 0,
    durable_discovery_task_rows_written: 0,
    dispatcher_started: false,
    dispatch_runner_invoked: false,
    dispatcher_queue_lease_behavior: false,
    lease_queue_dispatcher_behavior: false,
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
      external_io_is_required_before_provider_execution: true,
      external_io_open_is_not_execution_authority: true,
      external_io_on_starts_pickup: false,
      external_io_on_dispatches_provider_packets: false,
      external_io_on_creates_catch_up_flood: false,
      provider_calls: 0,
      zkill_calls: 0,
      esi_calls: 0
    },
    input_authority: {
      provider_route_preview_from_hs489_path: !usesTrustedSuppliedRoutePreview,
      trusted_supplied_route_preview_used: usesTrustedSuppliedRoutePreview,
      renderer_supplied_route_preview_authoritative: false
    },
    execution_boundary_requirements: {
      external_io_open_required: true,
      future_dispatcher_ownership_required: true,
      future_lease_claim_semantics_required: true,
      future_provider_pacing_required: true,
      future_zkill_candidate_ref_write_handling_required: true,
      candidate_ref_write_handling_is_not_opened: true,
      provider_execution_is_not_opened: true
    },
    summary: {
      source_route_packet_preview_count: routePackets.length,
      pickup_execution_boundary_packet_count: boundaryPackets.length,
      not_executed_packet_count: boundaryPackets.filter((packet) => packet.execution_status === 'not_executed').length,
      one_accepted_system_id_maps_to_one_boundary_packet: true,
      requires_external_io_open_count: boundaryPackets.filter((packet) => packet.requires_external_io_open === true).length,
      requires_future_dispatcher_ownership_count: boundaryPackets.filter((packet) => packet.requires_future_dispatcher_ownership === true).length,
      requires_future_lease_claim_semantics_count: boundaryPackets.filter((packet) => packet.requires_future_lease_claim_semantics === true).length,
      requires_future_provider_pacing_count: boundaryPackets.filter((packet) => packet.requires_future_provider_pacing === true).length,
      requires_future_zkill_candidate_ref_write_handling_count: boundaryPackets.filter((packet) => packet.requires_future_zkill_candidate_ref_write_handling === true).length,
      excluded_row_count: excludedRows.length,
      held_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'held_by_external_io').length,
      rejected_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'rejected_before_pickup_consumption').length,
      not_input_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'not_pickup_input').length,
      provider_calls: 0,
      live_api_calls: 0,
      zkill_calls: 0,
      esi_calls: 0,
      executable_provider_packets_created: 0,
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
    pickup_execution_boundary_packets: boundaryPackets,
    excluded_rows: excludedRows,
    source_route_preview_summary: routePreview.summary || null,
    source_route_policy_preview: routePreview.zkill_route_policy_preview || null,
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
      input_language: 'hs489_provider_route_packet_previews',
      route_packets_remain_preview_only: true,
      one_accepted_included_system_id_yields_one_boundary_packet: true,
      boundary_packets_are_not_executable_provider_packets: true,
      boundary_packets_are_not_pickup_units: true,
      boundary_packets_are_not_leases_or_queue_items: true,
      boundary_packets_are_not_candidate_refs_or_discovery_refs: true,
      boundary_packets_are_not_evidence_expansion: true,
      boundary_packets_are_not_hydration: true,
      center_radius_remains_provenance_only: true,
      held_rows_do_not_enter_executable_posture: true,
      rejected_rows_do_not_enter_executable_posture: true,
      not_input_rows_do_not_enter_executable_posture: true,
      provider_execution_started_by_this_preview: false,
      schema_accepted_by_this_preview: false,
      runtime_behavior_changed_by_this_preview: false
    },
    boundary: [
      'Read-only Discovery pickup execution boundary preview from HS489 provider-route packet previews.',
      'Each route packet remains not executed and non-dispatchable; the preview only names future prerequisites before provider movement.',
      'Future prerequisites include External I/O open, dispatcher ownership, lease/claim semantics, provider pacing, and candidate-ref write handling.',
      'Held, rejected, not-input, actor, non-open, and malformed/missing-scope rows remain exclusions and do not enter executable packet posture.',
      'No Discovery pickup execution, leases, queues, dispatcher runtime, provider calls, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema, enforcement, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_update_src_main_db_schema_sql',
      'does_not_start_discovery_pickup_or_create_executable_provider_packets',
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

function executionBoundaryForPacket(packet = {}) {
  return {
    execution_boundary_status: 'execution_boundary_preview_not_executed',
    execution_status: 'not_executed',
    preview_only: true,
    executable_now: false,
    executable_provider_packet: false,
    dispatchable_now: false,
    lease_claimed: false,
    provider_call_started: false,
    packet_shape_for_later: packet.packet_shape_for_later || 'zkill_candidate_acquisition_only',
    not_evidence_expansion: packet.not_evidence_expansion === true,
    not_hydration: packet.not_hydration === true,
    provider: packet.provider || 'zkillboard',
    provider_family: packet.provider_family || 'zkill',
    provider_route_family: packet.provider_route_family || null,
    route_intent: packet.route_intent || null,
    packet_identity: packet.packet_identity || null,
    bucket_item_id: packet.bucket_item_id || null,
    watch_run_id: packet.watch_run_id || null,
    watch_type: packet.watch_type || null,
    watch_id: packet.watch_id ?? null,
    source_kind: packet.source_kind || null,
    bucket_status: packet.bucket_status || null,
    system_id: packet.system_id ?? null,
    accepted_scope: packet.accepted_scope || null,
    accepted_scope_execution_authority: packet.accepted_scope_execution_authority || null,
    accepted_included_system_ids: Array.isArray(packet.accepted_included_system_ids)
      ? [...packet.accepted_included_system_ids]
      : [],
    center_radius_provenance: {
      ...(packet.center_radius_provenance || {}),
      center_radius_is_provenance_only: true,
      center_radius_used_as_execution_authority: false
    },
    window: packet.window || null,
    route_window: packet.route_window || null,
    caps: packet.caps || null,
    provenance: {
      ...(packet.provenance || {}),
      execution_boundary_source_action: ACTION
    },
    source_selection_basis: packet.source_selection_basis || null,
    zkill_route: packet.zkill_route || null,
    provider_policy_preview: packet.provider_policy_preview || null,
    requires_external_io_open: true,
    requires_future_dispatcher_ownership: true,
    requires_future_lease_claim_semantics: true,
    requires_future_provider_pacing: true,
    requires_future_zkill_candidate_ref_write_handling: true,
    candidate_ref_write_handling_status: 'future_required_not_opened',
    future_provider_movement_status: 'not_opened_by_boundary_preview',
    side_effects: zeroSideEffects()
  };
}

function executionBoundaryExclusionFor(row = {}) {
  return {
    execution_boundary_status: 'excluded_from_pickup_execution_boundary',
    reason: row.reason || 'not_selected_for_provider_route_packet_preview',
    exclusion_family: row.exclusion_family || 'not_selected',
    rejection_family: row.rejection_family || null,
    source_pickup_readout_status: row.source_pickup_readout_status || null,
    selection_contract_status: row.selection_contract_status || null,
    source_provider_route_packet_status: row.provider_route_packet_status || null,
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
    enters_executable_packet_posture: false,
    pickup_execution_boundary_packet_count: 0,
    executable_provider_packet: false,
    dispatchable_now: false,
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

function trustedRoutePreview(routePreview, externalIoState) {
  return {
    ...routePreview,
    external_io_posture: {
      ...(routePreview.external_io_posture || {}),
      state: externalIoState
    }
  };
}

function zeroSideEffects() {
  return {
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    executable_provider_packets_created: 0,
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
  buildDiscoveryPickupExecutionBoundaryPreview
};
