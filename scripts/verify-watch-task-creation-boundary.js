const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const NOW = '2026-06-06T16:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    verifyRegistrationAndCoverage();
    await verifyCase('due actor task envelope', seedActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyActorEnvelope);
    await verifyCase('due system/radius task envelope', seedSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifySystemEnvelope);
    await verifyCase('invalid stored scope blocks task envelope', seedInvalidSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyInvalidScope);
    await verifyCase('disarmed blocks task envelope', seedActorOnly, {
      sessionArmed: false,
      liveApiEnabled: true
    }, (preview) => verifyNoEnvelope(preview, 'blocked_no_task_envelope', 'session_not_armed'));
    await verifyCase('active task blocks task envelope', seedActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      activeTaskId: 'task-1',
      activeTaskPresent: true
    }, (preview) => verifyNoEnvelope(preview, 'blocked_no_task_envelope', 'active_task'));
    await verifyCase('live provider gate blocks task envelope', seedActorOnly, {
      sessionArmed: true,
      liveApiEnabled: false
    }, (preview) => verifyNoEnvelope(preview, 'blocked_no_task_envelope', 'live_api_disabled'));
    await verifyCase('no due idles without task envelope', seedWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (preview) => verifyNoEnvelope(preview, 'idle_no_task_envelope', 'no_due_watches'));
    await verifyCase('inactive not-due backoff skipped without task envelope', seedWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyWaitingRows);

    console.log(JSON.stringify({
      status: 'Watch task creation boundary preview verified',
      command: 'watch.task_creation_boundary.preview',
      cases: [
        'due_actor_task_envelope',
        'due_system_radius_task_envelope',
        'invalid_stored_scope_no_task_envelope',
        'disarmed_no_task_envelope',
        'active_task_no_task_envelope',
        'live_gate_no_task_envelope',
        'no_due_no_task_envelope',
        'inactive_not_due_backoff_no_task_envelope'
      ],
      sample_actor_envelope: await sample(seedActorOnly),
      sample_system_radius_envelope: await sample(seedSystemOnly),
      sample_invalid_scope: await sample(seedInvalidSystemOnly)
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Watch task creation boundary preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.task_creation_boundary.preview');
  assert(command, 'Watch task creation boundary command should be registered');
  assert(command.classification === 'read-only', 'Watch task creation boundary command should be read-only');
  assert(command.effects.includes('read-only'), 'Watch task creation boundary command should declare read-only effect');
  assert(command.renderer_allowed === true, 'Watch task creation boundary should be renderer eligible as read-only preview');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.task_creation_boundary.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'task boundary command should be local DB inspection');
  assert(row?.runtime_context === 'watch_task_creation_boundary_readout', 'task boundary command should be classified as readout');
  assert(row?.external_io_dependency === 'none', 'task boundary command should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'task boundary command should remain non-enforcing proof');
}

async function verifyCase(label, seed, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seed(db);
    const taskRunner = taskRunnerSentinel();
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('watch.task_creation_boundary.preview', {
      now: NOW,
      ...input
    }, {
      db,
      taskRunner,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);
    verifier(preview);
    verifyReadOnlyBoundary(preview, label);
    assertSame(after, before, `${label} should not mutate persistent tables`);
    assert(preview.table_mutation_proof.unchanged === true, `${label} should include unchanged table proof`);
    assertSame(taskRunner.calls, [], `${label} should not touch TaskRunner methods`);
  } finally {
    closeDatabase(db);
  }
}

async function sample(seed) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seed(db);
    const preview = await invokeServiceCommand('watch.task_creation_boundary.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true
    }, { db, taskRunner: taskRunnerSentinel() });
    return {
      task_envelope_status: preview.task_envelope_status,
      task_envelope_reason: preview.task_envelope_reason,
      selected_watch: preview.selected_watch,
      would_task_envelope: preview.would_task_envelope,
      task_runner_methods_called: preview.task_runner_methods_called,
      task_runner_untouched: preview.task_runner_untouched,
      table_mutation_proof: preview.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyActorEnvelope(preview) {
  assert(preview.task_envelope_status === 'would_task_envelope_available', 'actor should expose a would-task envelope');
  assert(preview.task_envelope_reason === 'selected_watch_payload_parity_matches', 'actor envelope should be based on parity match');
  assert(preview.task_envelope_matches_selected_payload === true, 'actor envelope should match selected payload');
  const envelope = preview.would_task_envelope;
  assert(envelope.type === 'watch.executor.actor.watch', 'actor task type should match executor type');
  assert(envelope.classification === 'evidence-creating', 'actor task classification should be evidence-creating');
  assert(envelope.scopeKey === 'actor:character:90000001', 'actor task scopeKey should match selected Watch scope');
  assert(envelope.selected_command === 'actor.watch', 'actor selected command should match');
  assert(envelope.selected_payload_shape.entity_type === 'character', 'actor entity type should match');
  assert(envelope.selected_payload_shape.entity_id === 90000001, 'actor entity ID should match');
  assert(envelope.selected_payload_shape.lookback_seconds === 14 * 86400, 'actor lookback should match');
  assert(envelope.selected_payload_shape.max_refs === 5, 'actor max refs should match');
  assert(envelope.selected_payload_shape.max_expansions === 5, 'actor max expansions should match');
  assert(envelope.plain_data_only === true, 'actor envelope should be plain data only');
  assert(envelope.would_create_task === false, 'actor envelope should not claim task creation');
}

function verifySystemEnvelope(preview) {
  assert(preview.task_envelope_status === 'would_task_envelope_available', 'system should expose a would-task envelope');
  assert(preview.task_envelope_matches_selected_payload === true, 'system envelope should match selected payload');
  const envelope = preview.would_task_envelope;
  assert(envelope.type === 'watch.executor.system.radius.watch', 'system task type should match executor type');
  assert(envelope.classification === 'evidence-creating', 'system task classification should be evidence-creating');
  assert(envelope.scopeKey === 'system:30003597:radius:1', 'system task scopeKey should match selected Watch scope');
  assert(envelope.selected_command === 'system.radius.watch', 'system selected command should match');
  assertSame(envelope.selected_payload_shape.accepted_system_ids, ACCEPTED_IDS, 'system payload should preserve stored accepted IDs');
  assert(envelope.selected_payload_shape.accepted_scope_source === 'stored_watch_scope', 'system payload should preserve stored scope source');
  assert(envelope.selected_payload_shape.center_system_id === 30003597, 'system center should match');
  assert(envelope.selected_payload_shape.radius_jumps === 1, 'system radius should match');
  assert(envelope.selected_payload_shape.max_systems === ACCEPTED_IDS.length, 'system max systems should match accepted IDs');
  assert(envelope.selected_payload_shape.max_refs_per_system === 2, 'system max refs per system should match');
  assert(envelope.selected_payload_shape.max_expansions === 6, 'system max expansions should match');
  assert(envelope.selected_payload_authority.uses_stored_included_system_ids === true, 'system envelope should disclose stored accepted IDs');
  assert(envelope.selected_payload_authority.center_radius_role === 'provenance_and_management', 'center/radius should be provenance');
  assert(envelope.selected_payload_authority.center_radius_used_as_authority === false, 'center/radius should not be authority');
}

function verifyInvalidScope(preview) {
  verifyNoEnvelope(preview, 'blocked_no_task_envelope', 'watch_scope_authority_invalid');
  assert(preview.selected_parity.invalid_scope_parity === 'matches_blocked_before_task_creation', 'invalid scope should block before task shape');
  assert(preview.selected_parity.dispatch_for.error_code === 'watch_scope_authority_invalid', 'dispatchFor should block invalid scope');
}

function verifyWaitingRows(preview) {
  verifyNoEnvelope(preview, 'idle_no_task_envelope', 'no_due_watches');
  for (const row of preview.parity_rows) {
    assert(row.selected_by_dry_run === false, 'waiting rows should not be selected');
    assert(row.comparison_status === 'skipped_waiting_or_blocked', 'waiting rows should be skipped or blocked');
    assert(row.would_create_task === false, 'waiting rows should not imply task creation');
  }
}

function verifyNoEnvelope(preview, status, reason) {
  assert(preview.task_envelope_status === status, `expected task envelope status ${status}, got ${preview.task_envelope_status}`);
  assert(preview.task_envelope_reason === reason, `expected task envelope reason ${reason}, got ${preview.task_envelope_reason}`);
  assert(preview.would_task_envelope === null, 'blocked/idle state should not emit task envelope');
  assert(preview.task_envelope_matches_selected_payload === false, 'blocked/idle state should not match a task envelope');
}

function verifyReadOnlyBoundary(preview, label) {
  assert(preview.action === 'watch.task_creation_boundary.preview', `${label} action should be named`);
  assert(preview.read_only === true, `${label} preview should declare read-only`);
  assert(preview.mutates_state === false, `${label} preview should not mutate state`);
  assert(preview.watch_dispatches === 0, `${label} preview should not dispatch Watch execution`);
  assert(preview.watch_execution_armed === false, `${label} preview should not arm Watch execution`);
  assert(preview.tasks_created === 0, `${label} preview should not create tasks`);
  assert(preview.would_create_task === false, `${label} preview should not claim task creation`);
  assert(preview.task_creation_authorized === false, `${label} preview should not authorize task creation`);
  assert(preview.task_runner_untouched === true, `${label} preview should not touch TaskRunner`);
  assert(Array.isArray(preview.task_runner_methods_called) && preview.task_runner_methods_called.length === 0, `${label} preview should report no TaskRunner methods`);
  assert(preview.dispatch_runner_invocations === 0, `${label} preview should not invoke dispatch runners`);
  assert(preview.provider_calls === 0, `${label} preview should not call providers`);
  assert(preview.live_api_calls === 0, `${label} preview should not make live/API calls`);
  assert(preview.evidence_writes === 0, `${label} preview should not write Evidence/EVEidence`);
  assert(preview.discovery_refs_mutated === 0, `${label} preview should not mutate Discovery refs`);
  assert(preview.hydration_writes === 0, `${label} preview should not write Hydration output`);
  assert(preview.metadata_writes === 0, `${label} preview should not write metadata`);
  assert(preview.api_request_log_writes === 0, `${label} preview should not write API logs`);
  assert(preview.watch_mutations === 0, `${label} preview should not mutate Watch rows`);
  assert(preview.schema_changes === 0, `${label} preview should not change schema`);
  assert(preview.support_artifacts_created === 0, `${label} preview should not create support artifacts`);
  assert(preview.runtime_enforcement_active === false, `${label} preview should not activate enforcement`);
  assert(preview.command_blocking_active === false, `${label} preview should not activate command blocking`);
  assert(preview.ui_work === false, `${label} preview should not do UI work`);
}

function taskRunnerSentinel() {
  const calls = [];
  const record = (name) => {
    calls.push(name);
    throw new Error(`TaskRunner method should not be called: ${name}`);
  };
  return {
    calls,
    runTask: () => record('runTask'),
    runDetachedTask: () => record('runDetachedTask'),
    prepareTask: () => record('prepareTask'),
    createTask: () => record('createTask'),
    listTasks: () => []
  };
}

function seedActorOnly(db) {
  seedActorWatch(db, { watchId: 1 });
}

function seedSystemOnly(db) {
  seedSystemWatch(db, { watchId: 1, includedSystemIds: JSON.stringify(ACCEPTED_IDS) });
}

function seedInvalidSystemOnly(db) {
  seedSystemWatch(db, { watchId: 1, includedSystemIds: '[30003597,"bad"]' });
}

function seedWaitingOnly(db) {
  seedActorWatch(db, { watchId: 1, nextPollAt: '2026-06-06T17:00:00.000Z' });
  seedSystemWatch(db, {
    watchId: 1,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    backoffUntil: '2026-06-06T16:30:00.000Z'
  });
  seedSystemWatch(db, {
    watchId: 2,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    isActive: 0
  });
}

function seedActorWatch(db, input = {}) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.watchId,
    input.entityType || 'character',
    input.entityId || 90000001,
    input.entityName || 'Task Boundary Pilot',
    14,
    input.maxKillmailsPerRun || 5,
    input.isActive ?? 1,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS336 task boundary fixture'
  );
}

function seedSystemWatch(db, input = {}) {
  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.watchId,
    30003597,
    'Hare',
    1,
    input.includedSystemIds,
    '[]',
    24,
    35,
    input.maxKillmailsPerRun || 6,
    input.isActive ?? 1,
    45,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS336 task boundary fixture'
  );
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    metadata_runs: count(db, 'metadata_runs'),
    ingestion_audits: count(db, 'ingestion_audits'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
