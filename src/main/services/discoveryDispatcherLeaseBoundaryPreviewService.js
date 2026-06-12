const { buildDiscoveryPickupExecutionBoundaryPreview } = require('./discoveryPickupExecutionBoundaryPreviewService');

const ACTION = 'discovery.dispatcher_lease_boundary.preview';

function buildDiscoveryDispatcherLeaseBoundaryPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const externalIoState = normalizeExternalIoState(input.externalIoState || input.external_io_state || 'off');
  const suppliedBoundaryPreview = input.pickupExecutionBoundaryPreview || input.pickup_execution_boundary_preview;
  const usesTrustedSuppliedBoundaryPreview = suppliedBoundaryPreview
    && typeof suppliedBoundaryPreview === 'object'
    && context.trusted === true
    && context.source !== 'renderer';
  const boundaryPreview = usesTrustedSuppliedBoundaryPreview
    ? trustedBoundaryPreview(suppliedBoundaryPreview, externalIoState)
    : buildDiscoveryPickupExecutionBoundaryPreview(db, { ...input, externalIoState }, context);
  const boundaryPackets = Array.isArray(boundaryPreview.pickup_execution_boundary_packets)
    ? boundaryPreview.pickup_execution_boundary_packets
    : [];
  const leaseCandidates = externalIoState === 'on'
    ? boundaryPackets.map(leaseCandidateForPacket)
    : [];
  const excludedRows = Array.isArray(boundaryPreview.excluded_rows)
    ? boundaryPreview.excluded_rows.map(leaseBoundaryExclusionFor)
    : [];
  const heldBoundaryPackets = externalIoState === 'on'
    ? []
    : boundaryPackets.map((packet) => leaseBoundaryExclusionForPacket(packet, 'external_io_closed_before_lease_candidacy'));
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Discovery dispatcher lease boundary preview from pickup execution boundary packets',
    lease_boundary_preview_only: true,
    contract_only: true,
    preview_only: true,
    read_only: true,
    read_only_to_operator_corpus: true,
    mutates_state: false,
    renderer_eligible: true,
    hs491_pickup_execution_boundary_basis: true,
    product_schema_used: true,
    product_schema_updated: false,
    schema_changes: 0,
    operator_corpus_mutated: false,
    system_radius_only: true,
    actor_watch_migration: false,
    dispatcher_runtime_started: false,
    dispatcher_loop_started: false,
    dispatcher_started: false,
    dispatcher_queue_lease_behavior: false,
    queue_runtime_created: false,
    durable_queue_rows_written: 0,
    queue_items_created: 0,
    durable_lease_rows_written: 0,
    leases_created: 0,
    lease_claims_created: 0,
    lease_claimed: false,
    pickup_execution_started: false,
    discovery_pickup_execution: false,
    executable_provider_packets_created: 0,
    provider_packets: 0,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
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
      external_io_closed_holds_before_lease_candidacy: externalIoState !== 'on',
      external_io_open_is_required_before_lease_candidacy: true,
      external_io_open_is_not_lease_authority: true,
      external_io_on_starts_dispatcher: false,
      external_io_on_claims_leases: false,
      external_io_on_dispatches_provider_packets: false,
      external_io_on_creates_catch_up_flood: false,
      provider_calls: 0,
      zkill_calls: 0,
      esi_calls: 0
    },
    input_authority: {
      pickup_execution_boundary_from_hs491_path: !usesTrustedSuppliedBoundaryPreview,
      trusted_supplied_boundary_preview_used: usesTrustedSuppliedBoundaryPreview,
      renderer_supplied_boundary_preview_authoritative: false
    },
    lease_boundary_requirements: {
      external_io_open_required_before_lease_candidacy: true,
      future_dispatcher_owner_required: true,
      future_lease_identity_required: true,
      future_lease_expiry_required: true,
      future_retry_after_or_provider_eligibility_required: true,
      future_provider_pacing_required: true,
      future_expired_or_abandoned_lease_recovery_required: true,
      provider_execution_is_not_opened: true,
      durable_lease_storage_is_not_opened: true
    },
    summary: {
      source_pickup_execution_boundary_packet_count: boundaryPackets.length,
      lease_candidate_count: leaseCandidates.length,
      not_leased_candidate_count: leaseCandidates.filter((candidate) => candidate.lease_status === 'not_leased').length,
      one_accepted_system_id_maps_to_one_lease_candidate: externalIoState === 'on',
      external_io_hold_before_lease_candidacy: externalIoState !== 'on',
      excluded_row_count: excludedRows.length + heldBoundaryPackets.length,
      held_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'held_by_external_io').length + heldBoundaryPackets.length,
      rejected_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'rejected_before_pickup_consumption').length,
      not_input_excluded_count: excludedRows.filter((row) => row.exclusion_family === 'not_pickup_input').length,
      future_lease_owner_required_count: leaseCandidates.filter((candidate) => candidate.future_lease_owner_required === true).length,
      future_lease_expires_at_required_count: leaseCandidates.filter((candidate) => candidate.future_lease_expires_at_required === true).length,
      future_retry_after_basis_count: leaseCandidates.filter((candidate) => Boolean(candidate.future_retry_after_basis)).length,
      future_provider_pacing_basis_count: leaseCandidates.filter((candidate) => Boolean(candidate.future_provider_pacing_basis)).length,
      future_expired_lease_recovery_basis_count: leaseCandidates.filter((candidate) => Boolean(candidate.future_expired_lease_recovery_basis)).length,
      provider_calls: 0,
      live_api_calls: 0,
      zkill_calls: 0,
      esi_calls: 0,
      executable_provider_packets_created: 0,
      dispatcher_runtime_started: false,
      queue_items_created: 0,
      leases_created: 0,
      lease_claims_created: 0,
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
    dispatcher_lease_boundary_candidates: leaseCandidates,
    excluded_rows: [...excludedRows, ...heldBoundaryPackets],
    source_boundary_preview_summary: boundaryPreview.summary || null,
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
      lease_rows_mutated: false,
      queue_rows_mutated: false,
      product_tables_mutated: false
    },
    accepted_model: {
      input_language: 'hs491_pickup_execution_boundary_packets',
      boundary_packets_remain_not_executed: true,
      one_accepted_included_system_id_yields_one_lease_candidate_when_external_io_open: true,
      lease_candidates_are_not_leases: true,
      lease_candidates_are_not_queue_items: true,
      lease_candidates_are_not_executable_provider_packets: true,
      lease_candidates_are_not_candidate_refs_or_discovery_refs: true,
      lease_candidates_are_not_evidence_expansion: true,
      lease_candidates_are_not_hydration: true,
      center_radius_remains_provenance_only: true,
      external_io_closed_rows_do_not_enter_lease_candidacy: true,
      rejected_rows_do_not_enter_lease_candidacy: true,
      not_input_rows_do_not_enter_lease_candidacy: true,
      dispatcher_started_by_this_preview: false,
      provider_execution_started_by_this_preview: false,
      schema_accepted_by_this_preview: false,
      runtime_behavior_changed_by_this_preview: false
    },
    boundary: [
      'Read-only Discovery dispatcher/lease boundary preview from HS491 pickup execution boundary packets.',
      'Eligible boundary packets become future lease candidates only; no lease row exists, no lease is claimed, and no dispatcher loop starts.',
      'Future lease facts include identity basis, owner requirement, expiry requirement, retry/provider eligibility basis, provider pacing basis, and expired/abandoned lease recovery basis.',
      'External I/O closed remains a hold before lease candidacy.',
      'No dispatcher runtime, queue runtime, durable leases, lease claims, provider calls, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema, enforcement, or UI behavior is opened.'
    ],
    does_not_do: [
      'does_not_update_src_main_db_schema_sql',
      'does_not_start_dispatcher_or_worker_loop',
      'does_not_create_durable_queues_leases_or_lease_claims',
      'does_not_start_discovery_pickup_or_create_executable_provider_packets',
      'does_not_call_zkill_or_esi',
      'does_not_emit_or_write_candidate_refs_discovery_refs_evidence_eveidence_hydration_observation_or_api_logs',
      'does_not_mutate_watch_bucket_status_or_receipts',
      'does_not_mutate_watch_rows_or_cadence',
      'does_not_migrate_actor_watch',
      'does_not_implement_runtime_enforcement_or_ui'
    ]
  };
}

function leaseCandidateForPacket(packet = {}) {
  const futureLeaseIdentity = futureLeaseIdentityFor(packet);
  return {
    lease_boundary_status: 'lease_candidate_preview_not_leased',
    lease_candidate: true,
    lease_status: 'not_leased',
    preview_only: true,
    executable_now: false,
    dispatchable_now: false,
    lease_row_exists: false,
    lease_claimed: false,
    lease_claim_created: false,
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
      dispatcher_lease_boundary_source_action: ACTION
    },
    source_selection_basis: packet.source_selection_basis || null,
    zkill_route: packet.zkill_route || null,
    provider_policy_preview: packet.provider_policy_preview || null,
    future_lease_identity: futureLeaseIdentity,
    future_lease_owner_required: true,
    future_lease_owner_basis: 'future_dispatcher_worker_identity_required_before_claim',
    future_lease_expires_at_required: true,
    future_lease_expiry_basis: 'future_claim_must_expire_to_make_abandoned_work_recoverable',
    future_retry_after_basis: retryAfterBasisFor(packet),
    future_provider_pacing_basis: providerPacingBasisFor(packet),
    future_expired_lease_recovery_basis: 'expired_or_abandoned_future_lease_returns_to_candidate_pool_without_watch_or_bucket_mutation',
    future_lease_claim_status: 'future_required_not_opened',
    future_dispatcher_status: 'future_required_not_started',
    future_queue_status: 'future_required_not_created',
    future_provider_movement_status: 'not_opened_by_lease_boundary_preview',
    side_effects: zeroSideEffects()
  };
}

function leaseBoundaryExclusionFor(row = {}) {
  return {
    lease_boundary_status: 'excluded_from_dispatcher_lease_boundary',
    lease_candidate: false,
    reason: row.reason || 'not_selected_for_pickup_execution_boundary',
    exclusion_family: row.exclusion_family || 'not_selected',
    rejection_family: row.rejection_family || null,
    source_pickup_readout_status: row.source_pickup_readout_status || null,
    selection_contract_status: row.selection_contract_status || null,
    source_provider_route_packet_status: row.source_provider_route_packet_status || null,
    source_execution_boundary_status: row.execution_boundary_status || null,
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
    enters_lease_candidacy: false,
    lease_candidate_count: 0,
    lease_row_exists: false,
    lease_claimed: false,
    executable_provider_packet: false,
    dispatchable_now: false,
    starts_dispatcher: false,
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

function leaseBoundaryExclusionForPacket(packet = {}, reason) {
  return {
    lease_boundary_status: 'excluded_from_dispatcher_lease_boundary',
    lease_candidate: false,
    reason,
    exclusion_family: 'held_by_external_io',
    source_execution_boundary_status: packet.execution_boundary_status || null,
    packet_identity: packet.packet_identity || null,
    bucket_item_id: packet.bucket_item_id || null,
    watch_run_id: packet.watch_run_id || null,
    watch_type: packet.watch_type || null,
    watch_id: packet.watch_id ?? null,
    source_kind: packet.source_kind || null,
    system_id: packet.system_id ?? null,
    accepted_scope: packet.accepted_scope || null,
    enters_lease_candidacy: false,
    lease_candidate_count: 0,
    lease_row_exists: false,
    lease_claimed: false,
    executable_provider_packet: false,
    dispatchable_now: false,
    starts_dispatcher: false,
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

function futureLeaseIdentityFor(packet = {}) {
  const basis = {
    packet_identity: packet.packet_identity || null,
    bucket_item_id: packet.bucket_item_id || null,
    watch_run_id: packet.watch_run_id || null,
    provider_route_family: packet.provider_route_family || null,
    system_id: packet.system_id ?? null
  };
  return {
    status: 'future_identity_basis_only_not_persisted',
    basis_fields: Object.keys(basis),
    basis,
    lease_key_preview: [
      'lease',
      basis.provider_route_family || 'provider_route',
      basis.packet_identity || basis.bucket_item_id || 'unknown_packet',
      basis.system_id ?? 'unknown_system'
    ].join(':'),
    persisted: false
  };
}

function retryAfterBasisFor(packet = {}) {
  const route = packet.zkill_route || {};
  return {
    status: 'future_provider_eligibility_basis_only',
    source: 'provider_timing_or_previous_attempt_policy_required_before_dispatch',
    route_family: packet.provider_route_family || null,
    path_template: route.path_template || null,
    system_id: packet.system_id ?? null,
    persisted: false
  };
}

function providerPacingBasisFor(packet = {}) {
  return {
    status: 'future_provider_pacing_basis_only',
    provider: packet.provider || 'zkillboard',
    route_family: packet.provider_route_family || null,
    candidate_ref_write_handling_required_first: packet.requires_future_zkill_candidate_ref_write_handling === true,
    catch_up_flood_allowed: false,
    persisted: false
  };
}

function trustedBoundaryPreview(boundaryPreview, externalIoState) {
  return {
    ...boundaryPreview,
    external_io_posture: {
      ...(boundaryPreview.external_io_posture || {}),
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
    dispatcher_runtime_started: false,
    queue_items_created: 0,
    durable_queue_rows_written: 0,
    leases_created: 0,
    durable_lease_rows_written: 0,
    lease_claims_created: 0,
    lease_claimed: false,
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
  buildDiscoveryDispatcherLeaseBoundaryPreview
};
