const { buildWatchExecutorTickDryRunPreview } = require('./watchExecutorTickDryRunService');
const { buildWatchPacketDryRunDispatchParityPreview } = require('./watchPacketDryRunDispatchParityService');
const { buildWatchDiscoveryPickupPacketProof } = require('./watchDiscoveryPickupPacketProofService');
const { buildDiscoveryPickupConsumerFixtureProof } = require('./discoveryPickupConsumerFixtureService');
const { buildDiscoveryReceiptProjectionFixturePreview } = require('./discoveryReceiptProjectionFixtureService');

const ACTION = 'watch.discovery_acquisition_split_fixture.preview';

function buildWatchDiscoveryAcquisitionSplitFixturePreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const baseInput = {
    ...input,
    now
  };
  const held = input.requestPosture === 'held_by_external_io' || input.externalIoState === 'off';
  const tickPreview = buildWatchExecutorTickDryRunPreview(db, baseInput, context);
  const parityPreview = buildWatchPacketDryRunDispatchParityPreview(db, baseInput, context);
  const pickupProof = buildWatchDiscoveryPickupPacketProof(db, baseInput, context);
  const consumerProof = held
    ? heldConsumerProof(pickupProof)
    : buildDiscoveryPickupConsumerFixtureProof(db, baseInput, context);
  const receiptProof = buildDiscoveryReceiptProjectionFixturePreview(db, {
    ...baseInput,
    projection: 'watch_summary',
    requestPosture: held ? 'held_by_external_io' : input.requestPosture,
    selectedWatch: held ? pickupProof.selected_watch : input.selectedWatch
  }, context);
  const acquisitionRequest = discoveryAcquisitionRequestFor({
    now,
    held,
    holdReason: input.holdReason || (held ? 'external_io_disabled_before_acquisition' : null),
    tickPreview,
    parityPreview,
    pickupProof
  });
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Watch-to-Discovery acquisition split fixture bridge',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    fixture_only: true,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    watch_execution: false,
    watch_dispatches: 0,
    dispatch_runner_invoked: false,
    dispatch_runner_invocations: 0,
    collectors_called: false,
    collect_actor_watch_invoked: false,
    collect_system_radius_watch_invoked: false,
    mixed_collectors_invoked: false,
    task_runner_methods_called: [],
    tasks_created: 0,
    queue_created: false,
    dispatcher_created: false,
    leases_created: 0,
    watch_mutations: 0,
    watch_rows_mutated: 0,
    discovery_refs_written: false,
    durable_discovery_refs_written: false,
    discovered_killmail_refs_written: 0,
    discovery_refs_mutated: 0,
    evidence_written: false,
    evidence_created: false,
    evidence_writes: 0,
    evidence_rows_written: 0,
    esi_evidence_expansion_run: false,
    hydration_writes: 0,
    hydration_created: false,
    metadata_writes: 0,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    fetch_run_writes: 0,
    schema_changes: 0,
    durable_task_packet_schema_created: false,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    source_watch: tickPreview.selected_watch || pickupProof.selected_watch || null,
    source_kind: sourceKindFor(tickPreview.selected_watch || pickupProof.selected_watch),
    current_dispatch_payload_basis: dispatchPayloadBasisFor(tickPreview, parityPreview),
    discovery_acquisition_request: acquisitionRequest,
    pickup_packet_count: held ? 0 : pickupProof.pickup_packets_emitted || 0,
    packet_targets: held ? [] : packetTargetsFor(pickupProof.pickup_packets || []),
    fixture_provider_outcome_summary: fixtureProviderOutcomeSummaryFor(receiptProof.canonical_receipt_basis),
    canonical_discovery_receipt_basis: receiptProof.canonical_receipt_basis,
    watch_summary_projection: receiptProof.projection,
    mixed_collector_non_invocation_proof: {
      collectActorWatch_entered: false,
      collectSystemRadiusWatch_entered: false,
      dispatch_runner_invoked: false,
      dispatch_runner_invocations: 0,
      task_runner_methods_called: [],
      source_actions_used: [
        tickPreview.action,
        parityPreview.action,
        pickupProof.action,
        consumerProof.action || 'held_before_fixture_consumer',
        receiptProof.action
      ],
      excluded_runtime_paths: [
        'collectActorWatch',
        'collectSystemRadiusWatch',
        'WatchSessionExecutor.tick',
        'TaskRunner.runDetachedTask'
      ]
    },
    source_previews: {
      executor_tick_dry_run: summarizeTick(tickPreview),
      packet_dry_run_dispatch_parity: summarizeParity(parityPreview),
      pickup_packet_proof: summarizePickup(pickupProof),
      pickup_consumer_fixture: summarizeConsumer(consumerProof),
      receipt_projection_fixture: summarizeReceipt(receiptProof)
    },
    accepted_model: {
      watch_role: 'scheduler_and_scope_authority_source',
      discovery_role: 'caller_agnostic_acquisition_utility',
      dispatch_payload_feeds_discovery_acquisition_request: true,
      watch_dispatch_payload_is_not_collector_execution: true,
      current_mixed_collectors_bypassed: true,
      system_radius_scope_source: 'stored_accepted_included_system_ids',
      center_radius_role: 'provenance_and_explanation',
      center_radius_used_as_execution_authority: false,
      candidate_refs_are_possible_leads: true,
      candidate_refs_are_durable_discovery_refs: false,
      candidate_refs_are_evidence: false,
      evidence_expansion_run: false,
      receipt_projection_requested: 'watch_summary',
      held_by_external_io_request_level_only: true
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && tickPreview.table_mutation_proof?.unchanged === true
        && parityPreview.table_mutation_proof?.unchanged === true
        && pickupProof.table_mutation_proof?.unchanged === true
        && consumerProof.table_mutation_proof?.unchanged === true
        && receiptProof.table_mutation_proof?.unchanged === true
    },
    boundary_flags: {
      providers_called: false,
      live_api_called: false,
      mixed_collectors_invoked: false,
      live_watch_dispatch_invoked: false,
      task_created: false,
      watch_mutated: false,
      discovery_refs_written: false,
      evidence_written: false,
      esi_evidence_expansion_run: false,
      hydration_written: false,
      api_logs_or_warnings_written: false,
      fetch_runs_written: false,
      schema_changed: false,
      queue_dispatcher_or_lease_created: false,
      support_artifact_created: false,
      ui_changed: false,
      runtime_enforcement_or_command_blocking_active: false,
      protected_words_updated: false
    },
    boundary: [
      'Watch dispatch payload is treated as source intent and scope authority input, not collector execution.',
      'Discovery owns the acquisition request, pickup packet fanout, fixture provider outcome language, and canonical receipt basis.',
      'The bridge uses dispatch payload parity only to prove current payload compatibility; dispatch runners are never invoked.',
      'Candidate refs remain possible leads, not durable Discovery refs, Evidence/EVEidence, Hydration, Observation, Assessment, or task memory.',
      'No providers, live/API calls, mixed collectors, Watch execution, tasks, DB writes, schema, dispatcher, support artifacts, UI, enforcement, or command blocking are opened.'
    ]
  };
}

function discoveryAcquisitionRequestFor({ now, held, holdReason, tickPreview, parityPreview, pickupProof }) {
  const selectedWatch = tickPreview.selected_watch || pickupProof.selected_watch || null;
  const payload = tickPreview.would_be_payload || null;
  const selectedParity = selectedParityRow(parityPreview);
  const packets = pickupProof.pickup_packets || [];
  return {
    request_id: `fixture_discovery_acquisition_${safe(selectedWatch?.watch_type || 'watch')}_${safe(selectedWatch?.scope_key || 'none')}_${Date.parse(now) || 0}`,
    owner: 'Discovery',
    fixture_only: true,
    source_intent_family: 'watch',
    source_watch: selectedWatch,
    source_kind: sourceKindFor(selectedWatch),
    source_dispatch_command: tickPreview.would_be_command || selectedParity?.dispatch_for_command || null,
    source_dispatch_payload: payload,
    dispatch_payload_basis: {
      dry_run_payload_shape: tickPreview.would_be_payload_shape || null,
      dispatch_for_payload_shape: selectedParity?.dispatch_for_payload_shape || null,
      payload_parity: selectedParity?.payload_parity || null,
      command_parity: selectedParity?.command_parity || null,
      runner_present_but_not_invoked: selectedParity?.dispatch_for?.runner_present_but_not_invoked === true,
      dispatch_runner_invoked: false
    },
    request_posture: held ? 'held_by_external_io' : 'fixture_acquisition_ready',
    hold_reason: holdReason,
    held_before_acquisition: held,
    provider_path: 'zkill_fixture',
    provider_calls: 0,
    live_api_calls: 0,
    packet_targets: held ? [] : packetTargetsFor(packets),
    packet_count: held ? 0 : packets.length,
    packet_outcomes_emitted: false,
    accepted_scope_basis: acceptedScopeBasisFor(selectedWatch, payload, packets),
    requested_window: {
      lookback_seconds: payload?.lookbackSeconds ?? null,
      basis: payload ? 'watch_dispatch_payload' : 'no_dispatch_payload'
    }
  };
}

function dispatchPayloadBasisFor(tickPreview, parityPreview) {
  const selected = selectedParityRow(parityPreview);
  return {
    source_action: 'watchExecutor.dispatchFor',
    selected_watch: tickPreview.selected_watch || null,
    would_be_command: tickPreview.would_be_command || null,
    would_be_payload: tickPreview.would_be_payload || null,
    tick_dry_run_payload_shape: tickPreview.would_be_payload_shape || null,
    dispatch_for_command: selected?.dispatch_for_command || null,
    dispatch_for_payload_shape: selected?.dispatch_for_payload_shape || null,
    command_parity: selected?.command_parity || null,
    payload_parity: selected?.payload_parity || null,
    dispatch_for_status: selected?.dispatch_for?.status || null,
    dispatch_runner_present_but_not_invoked: selected?.dispatch_for?.runner_present_but_not_invoked === true,
    dispatch_runner_invoked: false,
    mixed_collectors_invoked: false
  };
}

function acceptedScopeBasisFor(selectedWatch, payload, packets) {
  if (selectedWatch?.watch_type === 'system_radius') {
    const acceptedSystemIds = Array.isArray(payload?.acceptedSystemIds)
      ? [...payload.acceptedSystemIds]
      : packets.flatMap((packet) => Number.isFinite(Number(packet.candidate_system_id)) ? [Number(packet.candidate_system_id)] : []);
    return {
      basis_kind: 'stored_accepted_included_system_ids',
      accepted_scope_source: payload?.acceptedScopeSource || 'stored_watch_scope',
      accepted_system_ids: acceptedSystemIds,
      center_system_id: payload?.centerSystemId ?? null,
      radius_jumps: payload?.radiusJumps ?? null,
      center_radius_role: 'provenance_and_explanation',
      center_radius_used_as_execution_authority: false
    };
  }
  if (selectedWatch?.watch_type === 'actor') {
    return {
      basis_kind: 'actor_watch_dispatch_payload',
      entity_type: payload?.entityType || null,
      entity_id: payload?.entityId ?? null,
      entity_name: payload?.entityName || null
    };
  }
  return {
    basis_kind: 'no_selected_dispatch_payload'
  };
}

function fixtureProviderOutcomeSummaryFor(receipt = {}) {
  return {
    provider_path: receipt.provider_path || 'zkill_fixture',
    request_posture: receipt.request_posture || null,
    held_before_acquisition: receipt.held_before_acquisition === true,
    accepted_packet_count: receipt.accepted_packet_count || 0,
    attempted_packet_count: receipt.attempted_packet_count || 0,
    completed_packet_count: receipt.completed_packet_count || 0,
    packet_outcomes_emitted: receipt.packet_outcomes_emitted === true,
    packet_outcome_counts: receipt.packet_outcome_counts || {},
    ref_count: receipt.ref_count || 0,
    deferred_count: receipt.deferred_count || 0,
    retryable_count: receipt.retryable_count || 0,
    failed_terminal_count: receipt.failed_terminal_count || 0,
    cap_basis: receipt.cap_basis || null,
    no_packet_outcome_for_held_by_external_io: !Object.prototype.hasOwnProperty.call(receipt.packet_outcome_counts || {}, 'held_by_external_io')
  };
}

function packetTargetsFor(packets) {
  return packets.map((packet) => ({
    packet_index: packet.packet_index,
    packet_count: packet.packet_count,
    source_kind: packet.source_kind,
    scope_key: packet.scope_key,
    candidate_system_id: packet.candidate_system_id ?? null,
    provider_target: packet.provider_target_posture || null,
    lookback_seconds: packet.lookback_seconds ?? null,
    caps: packet.caps || null,
    accepted_system_ids: Array.isArray(packet.accepted_system_ids) ? [...packet.accepted_system_ids] : undefined,
    center_radius_used_as_execution_authority: packet.center_radius_used_as_execution_authority === true
  }));
}

function heldConsumerProof(pickupProof) {
  return {
    action: 'held_before_fixture_consumer',
    candidate_refs: [],
    candidate_refs_emitted: 0,
    pickup_packets_consumed: 0,
    consumer_status: 'held_before_acquisition',
    source_pickup_proof: summarizePickup(pickupProof),
    table_mutation_proof: {
      unchanged: true
    }
  };
}

function selectedParityRow(parityPreview) {
  return (parityPreview.parity_rows || []).find((row) => row.selected_by_dry_run) || null;
}

function sourceKindFor(watch = null) {
  if (watch?.watch_type === 'system_radius') {
    return 'watch_system_radius';
  }
  if (watch?.watch_type === 'actor') {
    return 'watch_actor';
  }
  return 'unknown';
}

function summarizeTick(tickPreview) {
  return {
    action: tickPreview.action,
    read_only: tickPreview.read_only === true,
    decision: tickPreview.decision || null,
    selected_watch: tickPreview.selected_watch || null,
    would_be_command: tickPreview.would_be_command || null,
    would_be_payload_shape: tickPreview.would_be_payload_shape || null,
    provider_calls: tickPreview.provider_calls || 0,
    live_api_calls: tickPreview.live_api_calls || 0,
    tasks_created: tickPreview.tasks_created || 0,
    table_mutation_unchanged: tickPreview.table_mutation_proof?.unchanged === true
  };
}

function summarizeParity(parityPreview) {
  const selected = selectedParityRow(parityPreview);
  return {
    action: parityPreview.action,
    read_only: parityPreview.read_only === true,
    summary: parityPreview.summary || null,
    selected_payload_parity: selected?.payload_parity || null,
    selected_command_parity: selected?.command_parity || null,
    dispatch_runner_invocations: parityPreview.dispatch_runner_invocations || 0,
    dispatch_for_invokes_runner: parityPreview.dispatch_for_invokes_runner === true,
    table_mutation_unchanged: parityPreview.table_mutation_proof?.unchanged === true
  };
}

function summarizePickup(pickupProof) {
  return {
    action: pickupProof.action,
    read_only: pickupProof.read_only === true,
    pickup_status: pickupProof.pickup_status || null,
    pickup_reason: pickupProof.pickup_reason || null,
    pickup_packets_emitted: pickupProof.pickup_packets_emitted || 0,
    provider_calls: pickupProof.provider_calls || 0,
    live_api_calls: pickupProof.live_api_calls || 0,
    collectors_called: pickupProof.collectors_called === true,
    table_mutation_unchanged: pickupProof.table_mutation_proof?.unchanged === true
  };
}

function summarizeConsumer(consumerProof) {
  return {
    action: consumerProof.action,
    read_only: consumerProof.read_only === true,
    consumer_status: consumerProof.consumer_status || null,
    pickup_packets_consumed: consumerProof.pickup_packets_consumed || 0,
    candidate_refs_emitted: consumerProof.candidate_refs_emitted || 0,
    table_mutation_unchanged: consumerProof.table_mutation_proof?.unchanged === true
  };
}

function summarizeReceipt(receiptProof) {
  return {
    action: receiptProof.action,
    read_only: receiptProof.read_only === true,
    projection_name: receiptProof.projection?.projection_name || null,
    request_posture: receiptProof.canonical_receipt_basis?.request_posture || null,
    accepted_packet_count: receiptProof.canonical_receipt_basis?.accepted_packet_count || 0,
    attempted_packet_count: receiptProof.canonical_receipt_basis?.attempted_packet_count || 0,
    packet_outcome_counts: receiptProof.canonical_receipt_basis?.packet_outcome_counts || {},
    table_mutation_unchanged: receiptProof.table_mutation_proof?.unchanged === true
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

function safe(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'unknown';
}

module.exports = {
  buildWatchDiscoveryAcquisitionSplitFixturePreview
};
