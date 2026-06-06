const { buildWatchDiscoveryBusInputEnvelopeProof } = require('./watchDiscoveryBusInputEnvelopeService');

const ACTION = 'discovery.intake_consumer_stub_candidates_proof';

function buildDiscoveryIntakeConsumerStubCandidateProof(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const busProof = buildWatchDiscoveryBusInputEnvelopeProof(db, {
    ...input,
    now
  }, context);
  const candidateRefs = stubCandidateRefsFor(busProof.bus_input_envelope);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Discovery intake consumer stub candidate proof',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    fixture_only_source: true,
    renderer_eligible: false,
    provider_movement: false,
    watch_execution: false,
    dispatch_runner_invoked: false,
    dispatch_runner_invocations: 0,
    collectors_called: false,
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
    hydration_writes: 0,
    metadata_writes: 0,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    watch_mutations: 0,
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    broad_provider_queue_created: false,
    durable_watch_result_created: false,
    relationship_tags_written: 0,
    fourth_lane_opened: false,
    candidate_refs_emitted: candidateRefs.length,
    candidate_refs: candidateRefs,
    candidate_output_status: candidateRefs.length ? 'emitted_stub_candidate_refs' : 'blocked_no_candidate_refs',
    candidate_output_reason: candidateRefs.length ? 'accepted_discovery_bus_input' : busProof.bus_input_reason,
    invalid_stored_scope_blocks_before_candidates: busProof.bus_input_reason === 'watch_scope_authority_invalid'
      && candidateRefs.length === 0,
    source_bus_input_proof: summarizeBusProof(busProof),
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && busProof.table_mutation_proof?.unchanged === true
    },
    accepted_model: {
      discovery_intake_consumer_role: 'candidate_ref_stub_output',
      stub_candidate_refs_are_durable_discovery_refs: false,
      stub_candidate_refs_are_evidence: false,
      source_lane: 'watch',
      shared_candidate_intake_shape: true,
      watch_only_intake_model: false,
      durable_discovery_ref_write_surface: 'unopened',
      evidence_write_surface: 'unopened',
      provider_movement: false,
      invalid_stored_scope_blocks_before_candidates: true
    },
    boundary: [
      'Discovery intake consumer stub output is pre-persistence candidate shape only.',
      'Stub candidate refs are not durable Discovery refs and not Evidence/EVEidence.',
      'No providers, collectors, dispatch runners, discovered_killmail_refs writes, Evidence/EVEidence, Hydration, API logs, schema, UI, enforcement, support artifacts, durable Watch results, relationship tags, or fourth-lane behavior are opened.',
      'The shape is intentionally shared candidate intake, not Watch-only intake machinery.'
    ]
  };
}

function stubCandidateRefsFor(envelope) {
  if (!envelope) {
    return [];
  }
  if (envelope.source_kind === 'system_radius') {
    const acceptedSystemIds = Array.isArray(envelope.accepted_system_ids)
      ? envelope.accepted_system_ids
      : [];
    const firstSystemId = acceptedSystemIds[0] ?? null;
    const secondSystemId = acceptedSystemIds[1] ?? firstSystemId;
    return [
      systemCandidate(envelope, 500340001, 'hs342_system_stub_hash_001', firstSystemId, 0),
      systemCandidate(envelope, 500340002, 'hs342_system_stub_hash_002', secondSystemId, 1)
    ].filter((candidate) => candidate.candidate_system_id !== null);
  }

  return [
    actorCandidate(envelope, 400340001, 'hs342_actor_stub_hash_001'),
    actorCandidate(envelope, 400340002, 'hs342_actor_stub_hash_002')
  ];
}

function actorCandidate(envelope, killmailId, killmailHash) {
  return {
    killmail_id: killmailId,
    killmail_hash: killmailHash,
    provider: 'zkill_stub',
    source_lane: envelope.source_lane,
    source_kind: envelope.source_kind,
    scope_key: envelope.scope_key,
    watch_id: envelope.watch_id,
    task_context: envelope.task_context,
    lookback_seconds: envelope.lookback_seconds,
    caps: envelope.caps,
    candidate_only: true,
    stub_only: true,
    durable_ref_written: false,
    evidence_created: false,
    provider_movement: false,
    entity_type: envelope.entity_type || null,
    entity_id: envelope.entity_id ?? null,
    entity_name: envelope.entity_name || null,
    provenance: {
      source_action: ACTION,
      intake_action: envelope.provenance?.source_action || null,
      selected_command: envelope.provenance?.selected_command || null,
      source_scope_key: envelope.scope_key,
      stub_source: 'local_fixture_candidate'
    }
  };
}

function systemCandidate(envelope, killmailId, killmailHash, candidateSystemId, offset) {
  return {
    killmail_id: killmailId,
    killmail_hash: killmailHash,
    provider: 'zkill_stub',
    source_lane: envelope.source_lane,
    source_kind: envelope.source_kind,
    scope_key: envelope.scope_key,
    watch_id: envelope.watch_id,
    task_context: envelope.task_context,
    lookback_seconds: envelope.lookback_seconds,
    caps: envelope.caps,
    candidate_only: true,
    stub_only: true,
    durable_ref_written: false,
    evidence_created: false,
    provider_movement: false,
    accepted_system_ids: [...(envelope.accepted_system_ids || [])],
    candidate_system_id: candidateSystemId,
    accepted_scope_source: envelope.accepted_scope_source || null,
    center_system_id: envelope.center_system_id ?? null,
    radius_jumps: envelope.radius_jumps ?? null,
    center_radius_role: envelope.center_radius_role || 'provenance_and_management',
    center_radius_used_as_authority: envelope.center_radius_used_as_authority === true,
    provenance: {
      source_action: ACTION,
      intake_action: envelope.provenance?.source_action || null,
      selected_command: envelope.provenance?.selected_command || null,
      source_scope_key: envelope.scope_key,
      accepted_scope_provenance: envelope.accepted_scope_provenance || null,
      stub_source: 'local_fixture_candidate',
      stub_offset: offset
    }
  };
}

function summarizeBusProof(busProof) {
  return {
    action: busProof.action,
    read_only: busProof.read_only === true,
    bus_input_envelope_emitted: busProof.bus_input_envelope_emitted === true,
    bus_input_status: busProof.bus_input_status || null,
    bus_input_reason: busProof.bus_input_reason || null,
    source_task_proof: busProof.source_task_proof || null,
    provider_movement: busProof.provider_movement === true,
    watch_execution: busProof.watch_execution === true,
    discovery_refs_written: busProof.discovery_refs_written === true,
    evidence_written: busProof.evidence_written === true
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
  buildDiscoveryIntakeConsumerStubCandidateProof
};
