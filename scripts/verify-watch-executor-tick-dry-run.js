const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const NOW = '2026-06-06T12:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    verifyRegistrationAndCoverage();
    await verifyCase('disarmed session blocks', seedActorOnly, {
      sessionArmed: false,
      liveApiEnabled: true
    }, (preview) => {
      assertDecision(preview, 'blocked', 'session_not_armed');
      assert(preview.selected_watch === null, 'disarmed preview should not select a Watch');
    });
    await verifyCase('active task blocks before selection', seedActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      activeTaskId: 'task-1',
      activeTaskPresent: true
    }, (preview) => {
      assertDecision(preview, 'blocked', 'active_task');
      assert(preview.selected_watch === null, 'active task preview should not select a Watch');
    });
    await verifyCase('live gate disabled blocks', seedActorOnly, {
      sessionArmed: true,
      liveApiEnabled: false
    }, (preview) => {
      assertDecision(preview, 'blocked', 'live_api_disabled');
      assert(preview.schedule_summary.due_count === 0, 'disabled live gate should block scheduler due list');
    });
    await verifyCase('no due Watches idles', seedWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (preview) => {
      assertDecision(preview, 'idle', 'no_due_watches');
      assert(preview.decision.waiting_is_failure === false, 'waiting should not be failure');
      assert(preview.schedule_summary.due_count === 0, 'waiting fixture should have no due rows');
    });
    await verifyCase('invalid stored scope blocks before task shape', seedInvalidSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (preview) => {
      assertDecision(preview, 'blocked', 'watch_scope_authority_invalid');
      assert(preview.selected_watch.watch_type === 'system_radius', 'invalid fixture should select the system/radius Watch');
      assert(preview.would_be_command === null, 'invalid stored scope should not produce a command');
      assert(preview.would_be_payload === null, 'invalid stored scope should not produce a payload');
      assertSame(preview.selected_invalid_scope_diagnostic.diagnostic_parseable_system_ids, [30003597], 'parseable subset should remain diagnostic-only');
      assert(preview.selected_invalid_scope_diagnostic.execution_authority === false, 'diagnostic subset should not be execution authority');
    });
    await verifyCase('due actor would dispatch', seedActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (preview) => {
      assertDecision(preview, 'would_dispatch', 'would_dispatch');
      assert(preview.selected_watch.watch_type === 'actor', 'actor fixture should select actor Watch');
      assert(preview.would_be_command === 'actor.watch', 'actor dry-run should name actor.watch');
      assert(preview.would_be_payload.entityId === 90000001, 'actor payload should preserve selected entity');
      assert(preview.tasks_created === 0, 'actor dry-run should not create task');
    });
    await verifyCase('due system/radius would dispatch stored accepted IDs', seedSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (preview) => {
      assertDecision(preview, 'would_dispatch', 'would_dispatch');
      assert(preview.selected_watch.watch_type === 'system_radius', 'system fixture should select system/radius Watch');
      assert(preview.would_be_command === 'system.radius.watch', 'system dry-run should name system.radius.watch');
      assertSame(preview.would_be_payload.acceptedSystemIds, ACCEPTED_IDS, 'system payload should use stored accepted included_system_ids');
      assert(preview.would_be_payload.acceptedScopeSource === 'stored_watch_scope', 'system payload should use stored scope source');
      assert(preview.accepted_model.center_radius_used_as_authority === false, 'center/radius should not be execution authority');
    });
    await verifyCase('multiple due selects one stable candidate', seedMultipleDue, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (preview) => {
      assertDecision(preview, 'would_dispatch', 'would_dispatch');
      assert(preview.schedule_summary.due_count === 3, 'fixture should have three due Watches');
      assert(preview.schedule_summary.selected_count === 1, 'dry-run should select at most one Watch');
      assert(preview.selected_watch.watch_type === 'actor', 'stable ordering should prefer actor over system/radius when times tie');
      assert(preview.selected_watch.watch_id === 2, 'stable ordering should prefer lowest actor watch_id');
    });

    console.log(JSON.stringify({
      status: 'Watch executor tick dry-run preview verified',
      command: 'watch.executor_tick_dry_run.preview',
      cases: [
        'session_not_armed',
        'active_task',
        'live_api_disabled',
        'no_due_watches',
        'watch_scope_authority_invalid',
        'actor_would_dispatch',
        'system_radius_would_dispatch',
        'multiple_due_stable_selection'
      ],
      sample: await sampleOutput()
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Watch executor tick dry-run preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.executor_tick_dry_run.preview');
  assert(command, 'Watch executor tick dry-run command should be registered');
  assert(command.classification === 'read-only', 'Watch executor tick dry-run should be read-only');
  assert(command.effects.includes('read-only'), 'Watch executor tick dry-run should declare read-only effect');
  assert(command.renderer_allowed === true, 'Watch executor tick dry-run should be renderer eligible as read-only preview');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.executor_tick_dry_run.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'tick dry-run should be local DB inspection');
  assert(row?.runtime_context === 'watch_executor_tick_dry_run_readout', 'tick dry-run should be classified as readout');
  assert(row?.external_io_dependency === 'none', 'tick dry-run should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'tick dry-run should remain non-enforcing proof');
}

async function verifyCase(label, seed, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seed(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('watch.executor_tick_dry_run.preview', {
      now: NOW,
      ...input
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);
    verifier(preview);
    verifyReadOnlyBoundary(preview, label);
    assertSame(after, before, `${label} should not mutate persistent tables`);
    assert(preview.table_mutation_proof.unchanged === true, `${label} should include unchanged table proof`);
  } finally {
    closeDatabase(db);
  }
}

async function sampleOutput() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedSystemOnly(db);
    const preview = await invokeServiceCommand('watch.executor_tick_dry_run.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true
    }, { db });
    return {
      decision: preview.decision,
      selected_watch: preview.selected_watch,
      would_be_command: preview.would_be_command,
      would_be_payload_shape: preview.would_be_payload_shape,
      table_mutation_proof: preview.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyReadOnlyBoundary(preview, label) {
  assert(preview.action === 'watch.executor_tick_dry_run.preview', `${label} action should be named`);
  assert(preview.read_only === true, `${label} preview should declare read-only`);
  assert(preview.mutates_state === false, `${label} preview should not mutate state`);
  assert(preview.tick_called === false, `${label} preview should not call tick`);
  assert(preview.executor_state_mutated === false, `${label} preview should not mutate executor state`);
  assert(preview.watch_dispatches === 0, `${label} preview should not dispatch Watch execution`);
  assert(preview.watch_execution_armed === false, `${label} preview should not arm Watch execution`);
  assert(preview.tasks_created === 0, `${label} preview should not create tasks`);
  assert(preview.would_create_task === false, `${label} preview should not claim task creation`);
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
  assert(preview.dry_run_is_authorization === false, `${label} dry-run should not be authorization`);
}

function assertDecision(preview, status, reason) {
  assert(preview.decision.status === status, `expected decision status ${status}, got ${preview.decision.status}`);
  assert(preview.decision.reason === reason, `expected decision reason ${reason}, got ${preview.decision.reason}`);
  assert(preview.decision.reason_codes.includes(reason), `expected reason code ${reason}`);
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
  seedActorWatch(db, { watchId: 1, nextPollAt: '2026-06-06T13:00:00.000Z' });
  seedSystemWatch(db, {
    watchId: 1,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    backoffUntil: '2026-06-06T12:30:00.000Z'
  });
  seedSystemWatch(db, {
    watchId: 2,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    isActive: 0
  });
}

function seedMultipleDue(db) {
  seedSystemWatch(db, { watchId: 1, includedSystemIds: JSON.stringify(ACCEPTED_IDS) });
  seedActorWatch(db, { watchId: 3, entityId: 90000003 });
  seedActorWatch(db, { watchId: 2, entityId: 90000002 });
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
    input.entityName || 'Dry Run Pilot',
    14,
    input.maxKillmailsPerRun || 5,
    input.isActive ?? 1,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS332 tick dry-run fixture'
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
    'HS332 tick dry-run fixture'
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
