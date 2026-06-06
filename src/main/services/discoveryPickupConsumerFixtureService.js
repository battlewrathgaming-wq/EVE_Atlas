const { buildWatchDiscoveryPickupPacketProof } = require('./watchDiscoveryPickupPacketProofService');

const ACTION = 'discovery.pickup_consumer_fixture.preview';

function buildDiscoveryPickupConsumerFixtureProof(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const pickupProof = buildWatchDiscoveryPickupPacketProof(db, {
    ...input,
    now
  }, context);
  const candidateRefs = fixtureCandidatesFor(pickupProof.pickup_packets || []);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Discovery pickup consumer fixture proof',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    fixture_only: true,
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
    pickup_packets_consumed: pickupProof.pickup_packets_emitted || 0,
    candidate_refs_emitted: candidateRefs.length,
    candidate_refs: candidateRefs,
    consumer_status: candidateRefs.length ? 'emitted_fixture_candidate_refs' : 'blocked_no_candidate_refs',
    consumer_reason: candidateRefs.length ? 'pickup_packets_consumed' : pickupProof.pickup_reason,
    selected_watch: pickupProof.selected_watch || null,
    source_pickup_proof: summarizePickupProof(pickupProof),
    accepted_model: {
      watch_role: 'scheduler_and_scope_authority_source',
      discovery_role: 'acquisition_utility',
      watch_emits_pickup_intent: true,
      discovery_consumes_pickup_packets: true,
      watch_acquires_candidates_itself: false,
      candidate_refs_are_plain_fixture_data: true,
      candidate_refs_are_durable_discovery_refs: false,
      candidate_refs_are_evidence: false,
      candidate_refs_are_hydration: false,
      candidate_refs_are_observation: false,
      shared_discovery_pickup_consumer_shape: true,
      watch_only_discovery_machinery: false,
      system_radius_scope_source: 'pickup_packet_candidate_system_id_from_stored_accepted_scope',
      center_radius_used_as_execution_authority: false,
      topology_recomputed: false
    },
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && pickupProof.table_mutation_proof?.unchanged === true
    },
    source_actions: [
      'watch.discovery_pickup_packet_proof.preview',
      'watch.executor_tick_dry_run.preview',
      'watch.runtime_packet_plan.preview',
      'watch.schedule'
    ],
    boundary: [
      'Watch emits Discovery pickup intent; Discovery consumes pickup packets.',
      'Fixture candidate refs are provider-return-like plain data only.',
      'Candidate refs are not durable Discovery refs, Evidence/EVEidence, Hydration, or Observation.',
      'No Watch execution, dispatch runners, collectors, providers, tasks, discovered_killmail_refs writes, Evidence/EVEidence, Hydration, Observation, API logs, schema, UI, enforcement, support artifacts, durable Watch results, relationship tags, or fourth-lane behavior are opened.'
    ]
  };
}

function fixtureCandidatesFor(pickupPackets) {
  const candidates = [];
  for (const packet of pickupPackets) {
    if (packet.source_kind === 'system_radius') {
      candidates.push(systemCandidate(packet, 500349000 + packet.packet_index + 1, `hs349_system_stub_hash_${String(packet.packet_index + 1).padStart(3, '0')}`));
    } else if (packet.source_kind === 'actor') {
      candidates.push(actorCandidate(packet, 400349001, 'hs349_actor_stub_hash_001'));
      candidates.push(actorCandidate(packet, 400349002, 'hs349_actor_stub_hash_002'));
    }
  }
  return candidates;
}

function actorCandidate(packet, killmailId, killmailHash) {
  return {
    killmail_id: killmailId,
    killmail_hash: killmailHash,
    provider: 'zkill_fixture',
    provider_return_like: true,
    source_lane: packet.source_lane,
    source_kind: packet.source_kind,
    scope_key: packet.scope_key,
    watch_id: packet.watch_id,
    pickup_packet_index: packet.packet_index,
    pickup_packet_count: packet.packet_count,
    candidate_only: true,
    fixture_only: true,
    durable_ref_written: false,
    evidence_created: false,
    hydration_created: false,
    observation_created: false,
    provider_movement: false,
    lookback_seconds: packet.lookback_seconds,
    caps: packet.caps,
    provider_target_posture: packet.provider_target_posture,
    entity_type: packet.entity_type || null,
    entity_id: packet.entity_id ?? null,
    entity_name: packet.entity_name || null,
    provenance: provenanceFor(packet)
  };
}

function systemCandidate(packet, killmailId, killmailHash) {
  return {
    killmail_id: killmailId,
    killmail_hash: killmailHash,
    provider: 'zkill_fixture',
    provider_return_like: true,
    source_lane: packet.source_lane,
    source_kind: packet.source_kind,
    scope_key: packet.scope_key,
    watch_id: packet.watch_id,
    pickup_packet_index: packet.packet_index,
    pickup_packet_count: packet.packet_count,
    candidate_system_id: packet.candidate_system_id,
    accepted_system_ids: [...(packet.accepted_system_ids || [])],
    accepted_scope_source: packet.accepted_scope_source || null,
    accepted_scope_provenance: packet.accepted_scope_provenance || null,
    center_system_id: packet.center_system_id ?? null,
    radius_jumps: packet.radius_jumps ?? null,
    center_radius_role: packet.center_radius_role || 'provenance_and_explanation',
    center_radius_used_as_execution_authority: packet.center_radius_used_as_execution_authority === true,
    topology_recomputed: false,
    candidate_only: true,
    fixture_only: true,
    durable_ref_written: false,
    evidence_created: false,
    hydration_created: false,
    observation_created: false,
    provider_movement: false,
    lookback_seconds: packet.lookback_seconds,
    caps: packet.caps,
    provider_target_posture: packet.provider_target_posture,
    provenance: provenanceFor(packet)
  };
}

function provenanceFor(packet) {
  return {
    source_action: ACTION,
    pickup_action: packet.provenance?.source_action || null,
    selected_command: packet.selected_command || null,
    pickup_scope_key: packet.scope_key,
    pickup_packet_index: packet.packet_index,
    pickup_packet_count: packet.packet_count,
    provider_target_posture: packet.provider_target_posture,
    source_pickup_provenance: packet.provenance || null
  };
}

function summarizePickupProof(pickupProof) {
  return {
    action: pickupProof.action,
    read_only: pickupProof.read_only === true,
    pickup_status: pickupProof.pickup_status || null,
    pickup_reason: pickupProof.pickup_reason || null,
    pickup_packets_emitted: pickupProof.pickup_packets_emitted || 0,
    selected_watch: pickupProof.selected_watch || null,
    provider_calls: pickupProof.provider_calls || 0,
    live_api_calls: pickupProof.live_api_calls || 0,
    watch_dispatches: pickupProof.watch_dispatches || 0,
    tasks_created: pickupProof.tasks_created || 0,
    discovery_refs_mutated: pickupProof.discovery_refs_mutated || 0,
    evidence_writes: pickupProof.evidence_writes || 0,
    table_mutation_unchanged: pickupProof.table_mutation_proof?.unchanged === true
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
  buildDiscoveryPickupConsumerFixtureProof
};
