const { buildWatchTaskCreationFixtureProof } = require('./watchTaskCreationFixtureProofService');

const ACTION = 'watch.discovery_bus_input_envelope_proof';

function buildWatchDiscoveryBusInputEnvelopeProof(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const taskProof = buildWatchTaskCreationFixtureProof(db, {
    ...input,
    now
  }, context);
  const envelope = discoveryBusInputFor(taskProof);
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only Watch Discovery bus input envelope proof',
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
    discovery_refs_written: false,
    discovery_refs_mutated: 0,
    discovery_ref_writes: 0,
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
    bus_input_envelope_emitted: Boolean(envelope),
    bus_input_envelope: envelope,
    bus_input_status: envelope ? 'emitted_candidate_intake_intent' : 'blocked_no_bus_input',
    bus_input_reason: envelope ? 'accepted_watch_task_intent' : taskProof.boundary_reason,
    invalid_stored_scope_blocks_before_bus_input: taskProof.boundary_reason === 'watch_scope_authority_invalid'
      && envelope === null,
    candidate_only: envelope?.candidate_only === true,
    source_task_proof: summarizeTaskProof(taskProof),
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && taskProof.table_mutation_proof?.unchanged === true
    },
    accepted_model: {
      discovery_bus_input_role: 'acquisition_intent',
      discovery_bus_input_is_discovery_refs: false,
      discovery_bus_input_is_evidence: false,
      source_lane: 'watch',
      shared_candidate_intake_shape: true,
      watch_only_bus_model: false,
      system_radius_scope_source: 'stored_included_system_ids',
      center_radius_role: 'provenance_and_management',
      center_radius_used_as_authority: false,
      invalid_stored_scope_blocks_before_bus_input: true
    },
    boundary: [
      'Discovery bus input envelope is acquisition intent only.',
      'It is not Discovery refs and not Evidence/EVEidence.',
      'No providers, collectors, dispatch runners, refs, Evidence/EVEidence, Hydration, API logs, schema, UI, enforcement, support artifacts, durable Watch results, relationship tags, or fourth-lane behavior are opened.',
      'The shape is intentionally shared candidate intake, not Watch-only bus machinery.'
    ]
  };
}

function discoveryBusInputFor(taskProof) {
  const taskEnvelope = taskProof.would_task_envelope;
  const fixtureTask = taskProof.fixture_task;
  if (!taskEnvelope || !fixtureTask || taskProof.task_shape_preserved !== true) {
    return null;
  }
  const payload = taskEnvelope.selected_payload_shape || {};
  const sourceKind = sourceKindFor(taskEnvelope.source_watch?.watch_type);
  const common = {
    source_lane: 'watch',
    source_kind: sourceKind,
    scope_key: taskEnvelope.scopeKey,
    watch_id: taskEnvelope.source_watch?.watch_id ?? null,
    task_type: fixtureTask.type,
    task_classification: fixtureTask.classification,
    task_context: {
      fixture_task_id: fixtureTask.task_id,
      fixture_task_status: fixtureTask.status,
      fixture_only: true,
      persisted_in_default_runner: false,
      handler_attached: false,
      handler_invoked: false,
      task_shape_preserved: taskProof.task_shape_preserved === true
    },
    candidate_only: true,
    discovery_refs_written: false,
    evidence_created: false,
    provider_movement: false,
    watch_execution: false,
    lookback_seconds: payload.lookback_seconds ?? null,
    caps: capsFor(sourceKind, payload),
    provenance: {
      source_action: taskProof.action,
      boundary_status: taskProof.boundary_status,
      boundary_reason: taskProof.boundary_reason,
      selected_watch: taskEnvelope.source_watch,
      selected_command: taskEnvelope.selected_command
    }
  };

  if (sourceKind === 'actor') {
    return {
      ...common,
      entity_type: payload.entity_type || null,
      entity_id: payload.entity_id ?? null,
      entity_name: payload.entity_name || null
    };
  }

  if (sourceKind === 'system_radius') {
    return {
      ...common,
      accepted_system_ids: [...(payload.accepted_system_ids || [])],
      accepted_scope_source: payload.accepted_scope_source || null,
      center_system_id: payload.center_system_id ?? null,
      radius_jumps: payload.radius_jumps ?? null,
      center_radius_role: taskEnvelope.selected_payload_authority?.center_radius_role || 'provenance_and_management',
      center_radius_used_as_authority: taskEnvelope.selected_payload_authority?.center_radius_used_as_authority === true,
      accepted_scope_provenance: payload.accepted_scope_provenance || null
    };
  }

  return common;
}

function sourceKindFor(watchType) {
  if (watchType === 'system_radius') {
    return 'system_radius';
  }
  return 'actor';
}

function capsFor(sourceKind, payload) {
  if (sourceKind === 'system_radius') {
    return {
      max_systems: payload.max_systems ?? null,
      max_refs_per_system: payload.max_refs_per_system ?? null,
      max_expansions: payload.max_expansions ?? null
    };
  }
  return {
    max_refs: payload.max_refs ?? null,
    max_expansions: payload.max_expansions ?? null
  };
}

function summarizeTaskProof(taskProof) {
  return {
    action: taskProof.action,
    fixture_only: taskProof.fixture_only === true,
    fixture_task_created: taskProof.fixture_task_created === true,
    fixture_task_creation_method: taskProof.fixture_task_creation_method || null,
    task_shape_preserved: taskProof.task_shape_preserved === true,
    boundary_status: taskProof.boundary_status || null,
    boundary_reason: taskProof.boundary_reason || null,
    task_runner_methods_called: [...(taskProof.task_runner_methods_called || [])],
    provider_movement: taskProof.provider_movement === true,
    watch_execution: taskProof.watch_execution === true,
    discovery_refs_mutated: taskProof.discovery_refs_mutated || 0,
    evidence_written: taskProof.evidence_written === true
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
  buildWatchDiscoveryBusInputEnvelopeProof
};
