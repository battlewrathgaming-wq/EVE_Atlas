const { TaskRunner } = require('./taskRunner');
const { buildWatchTaskCreationBoundaryPreview } = require('./watchTaskCreationBoundaryService');

const ACTION = 'watch.task_creation_fixture_proof';

function buildWatchTaskCreationFixtureProof(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const boundary = buildWatchTaskCreationBoundaryPreview(db, {
    ...input,
    now
  }, context);
  const methodCalls = [];
  const fixtureTask = boundary.would_task_envelope
    ? createFixtureTask(boundary.would_task_envelope, methodCalls)
    : null;
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'fixture-only Watch task creation proof',
    generated_at: now,
    fixture_only: true,
    non_production: true,
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
    evidence_written: false,
    evidence_rows_written: 0,
    evidence_writes: 0,
    discovery_refs_mutated: 0,
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
    real_runtime_task_persistence: false,
    default_task_runner_used: false,
    task_creation_authorized: false,
    product_authorization: false,
    fixture_task_created: Boolean(fixtureTask),
    fixture_task_creation_method: fixtureTask ? 'TaskRunner.createTask' : null,
    task_runner_methods_called: methodCalls,
    forbidden_task_runner_methods_called: methodCalls.filter((name) => (
      ['TaskRunner.runTask', 'TaskRunner.runDetachedTask', 'TaskRunner.prepareTask'].includes(name)
    )),
    boundary_status: boundary.task_envelope_status,
    boundary_reason: boundary.task_envelope_reason,
    selected_watch: boundary.selected_watch,
    would_task_envelope: boundary.would_task_envelope,
    fixture_task: fixtureTask,
    task_shape_preserved: fixtureTask
      ? taskShapePreserved(boundary.would_task_envelope, fixtureTask)
      : false,
    payload_meaning_preserved: fixtureTask
      ? boundary.task_envelope_matches_selected_payload === true
      : false,
    selected_parity: boundary.selected_parity,
    parity_rows: boundary.parity_rows,
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && boundary.table_mutation_proof?.unchanged === true
    },
    source_actions: [
      boundary.action,
      'fixture TaskRunner.createTask'
    ],
    accepted_model: {
      fixture_task_creation_only: true,
      real_runtime_task_persistence: false,
      actor_task_type: 'watch.executor.actor.watch',
      system_radius_task_type: 'watch.executor.system.radius.watch',
      task_classification: 'evidence-creating',
      system_radius_scope_source: 'stored_included_system_ids',
      center_radius_role: 'provenance_and_management',
      center_radius_used_as_authority: false,
      invalid_stored_scope_blocks_before_task_creation: true,
      fixture_is_product_authorization: false,
      fixture_is_live_watch_readiness: false
    },
    boundary: [
      'Fixture-only Watch task creation proof.',
      'Uses a disposable TaskRunner instance and TaskRunner.createTask only.',
      'Does not call runTask, runDetachedTask, prepareTask, dispatch runners, collectors, providers, or live/API paths.',
      'Does not persist runtime tasks in the operator corpus or mutate durable Atlas tables.',
      'This proof is not product authorization and not live Watch readiness.'
    ]
  };
}

function createFixtureTask(envelope, methodCalls) {
  const fixtureRunner = new TaskRunner();
  methodCalls.push('TaskRunner.createTask');
  const task = fixtureRunner.createTask({
    type: envelope.type,
    classification: envelope.classification,
    scopeKey: envelope.scopeKey
  });
  return {
    task_id: task.task_id,
    type: task.type,
    classification: task.classification,
    scope_key: task.scope_key,
    status: task.status,
    queued_at: task.queued_at,
    started_at: task.started_at,
    finished_at: task.finished_at,
    progress_count: task.progress.length,
    warning_count: task.warnings.length,
    result: task.result,
    error: task.error,
    fixture_only: true,
    persisted_in_default_runner: false,
    handler_attached: false,
    handler_invoked: false
  };
}

function taskShapePreserved(envelope, task) {
  return envelope.type === task.type
    && envelope.classification === task.classification
    && envelope.scopeKey === task.scope_key;
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
  buildWatchTaskCreationFixtureProof
};
