const { buildWatchExecutorTickDryRunPreview } = require('./watchExecutorTickDryRunService');

const ACTION = 'watch.discovery_pickup_packet_proof.preview';

function buildWatchDiscoveryPickupPacketProof(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const tickPreview = buildWatchExecutorTickDryRunPreview(db, {
    ...input,
    now
  }, context);
  const packets = pickupPacketsFor(tickPreview);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Watch Discovery pickup packet proof',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    provider_movement: false,
    watch_execution: false,
    watch_dispatches: 0,
    dispatch_runner_invoked: false,
    dispatch_runner_invocations: 0,
    collectors_called: false,
    task_runner_methods_called: [],
    tasks_created: 0,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
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
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    broad_provider_queue_created: false,
    durable_watch_result_created: false,
    relationship_tags_written: 0,
    fourth_lane_opened: false,
    pickup_packets_emitted: packets.length,
    pickup_packets: packets,
    pickup_status: packets.length ? 'emitted_discovery_pickup_packets' : 'blocked_no_pickup_packets',
    pickup_reason: packets.length ? 'selected_due_watch' : tickPreview.decision.reason,
    selected_watch: tickPreview.selected_watch || null,
    selected_due_watch_count: tickPreview.selected_watch ? 1 : 0,
    source_tick_preview: summarizeTickPreview(tickPreview),
    accepted_model: {
      watch_role: 'scheduler_and_scope_authority_source',
      discovery_role: 'acquisition_utility',
      due_watch_emits_pickup_intent: true,
      watch_acquires_candidates_itself: false,
      pickup_packets_are_durable_discovery_refs: false,
      pickup_packets_are_evidence: false,
      pickup_packets_are_hydration: false,
      pickup_packets_are_observation: false,
      shared_discovery_pickup_shape: true,
      watch_only_discovery_machinery: false,
      system_radius_scope_source: 'stored_accepted_included_system_ids',
      one_accepted_system_id_becomes_one_pickup_packet: true,
      center_radius_role: 'provenance_and_explanation',
      center_radius_used_as_execution_authority: false
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && tickPreview.table_mutation_proof?.unchanged === true
    },
    source_actions: [
      'watch.executor_tick_dry_run.preview',
      'watch.runtime_packet_plan.preview',
      'watch.schedule'
    ],
    boundary: [
      'Watch is a scheduler and scope-authority source; Discovery is the acquisition utility.',
      'A due Watch emits Discovery pickup intent only; it does not acquire candidates itself.',
      'System/radius pickup packets fan out stored accepted included_system_ids one packet per accepted system.',
      'No Watch execution, dispatch runners, collectors, providers, tasks, discovered_killmail_refs writes, Evidence/EVEidence, Hydration, Observation, API logs, schema, UI, enforcement, support artifacts, durable Watch results, relationship tags, or fourth-lane behavior are opened.'
    ]
  };
}

function pickupPacketsFor(tickPreview) {
  if (tickPreview.decision?.status !== 'would_dispatch') {
    return [];
  }
  const watch = tickPreview.selected_watch;
  const payload = tickPreview.would_be_payload || {};
  if (watch?.watch_type === 'system_radius') {
    const acceptedSystemIds = Array.isArray(payload.acceptedSystemIds)
      ? payload.acceptedSystemIds.map((value) => Number(value)).filter(Number.isFinite)
      : [];
    return acceptedSystemIds.map((systemId, index) => ({
      ...commonPacket(tickPreview, 'system_radius'),
      packet_index: index,
      packet_count: acceptedSystemIds.length,
      provider_target_posture: {
        provider: 'zkill',
        target_kind: 'solar_system',
        target_id: systemId,
        provider_calls: 0,
        live_api_calls: 0,
        acquisition_not_started: true
      },
      accepted_system_ids: [...acceptedSystemIds],
      candidate_system_id: systemId,
      accepted_scope_source: payload.acceptedScopeSource || null,
      accepted_scope_provenance: payload.acceptedScopeProvenance || null,
      center_system_id: payload.centerSystemId ?? null,
      radius_jumps: payload.radiusJumps ?? null,
      center_radius_role: 'provenance_and_explanation',
      center_radius_used_as_execution_authority: false
    }));
  }

  if (watch?.watch_type === 'actor') {
    return [{
      ...commonPacket(tickPreview, 'actor'),
      packet_index: 0,
      packet_count: 1,
      provider_target_posture: {
        provider: 'zkill',
        target_kind: payload.entityType || null,
        target_id: payload.entityId ?? null,
        provider_calls: 0,
        live_api_calls: 0,
        acquisition_not_started: true
      },
      entity_type: payload.entityType || null,
      entity_id: payload.entityId ?? null,
      entity_name: payload.entityName || null
    }];
  }

  return [];
}

function commonPacket(tickPreview, sourceKind) {
  const payload = tickPreview.would_be_payload || {};
  const watch = tickPreview.selected_watch || {};
  return {
    source_lane: 'watch',
    source_kind: sourceKind,
    scope_key: watch.scope_key || null,
    watch_id: watch.watch_id ?? null,
    selected_command: tickPreview.would_be_command || null,
    candidate_only: true,
    pickup_intent_only: true,
    durable_ref_written: false,
    evidence_created: false,
    hydration_created: false,
    observation_created: false,
    provider_movement: false,
    watch_execution: false,
    lookback_seconds: payload.lookbackSeconds ?? null,
    caps: capsFor(sourceKind, payload),
    provenance: {
      source_action: ACTION,
      tick_preview_action: tickPreview.action,
      selected_watch: watch,
      selected_scope_authority: tickPreview.selected_scope_authority || null,
      packet_plan_source_action: tickPreview.packet_plan_source_action || null
    }
  };
}

function capsFor(sourceKind, payload) {
  if (sourceKind === 'system_radius') {
    return {
      max_systems: payload.maxSystems ?? null,
      max_refs_per_system: payload.maxRefsPerSystem ?? null,
      max_expansions: payload.maxExpansions ?? null
    };
  }
  return {
    max_refs: payload.maxRefs ?? null,
    max_expansions: payload.maxExpansions ?? null
  };
}

function summarizeTickPreview(tickPreview) {
  return {
    action: tickPreview.action,
    read_only: tickPreview.read_only === true,
    decision: tickPreview.decision || null,
    selected_watch: tickPreview.selected_watch || null,
    would_be_command: tickPreview.would_be_command || null,
    would_be_payload_shape: tickPreview.would_be_payload_shape || null,
    provider_calls: tickPreview.provider_calls || 0,
    live_api_calls: tickPreview.live_api_calls || 0,
    watch_dispatches: tickPreview.watch_dispatches || 0,
    tasks_created: tickPreview.tasks_created || 0,
    discovery_refs_mutated: tickPreview.discovery_refs_mutated || 0,
    evidence_writes: tickPreview.evidence_writes || 0,
    table_mutation_unchanged: tickPreview.table_mutation_proof?.unchanged === true
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

module.exports = {
  buildWatchDiscoveryPickupPacketProof
};
