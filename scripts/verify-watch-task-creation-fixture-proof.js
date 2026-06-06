const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildWatchTaskCreationFixtureProof } = require('../src/main/services/watchTaskCreationFixtureProofService');

const NOW = '2026-06-06T18:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('due actor fixture task', seedActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyActorFixtureTask);
    await verifyCase('due system/radius fixture task', seedSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifySystemFixtureTask);
    await verifyCase('invalid stored scope blocks fixture task', seedInvalidSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (proof) => verifyNoFixtureTask(proof, 'blocked_no_task_envelope', 'watch_scope_authority_invalid'));
    await verifyCase('disarmed blocks fixture task', seedActorOnly, {
      sessionArmed: false,
      liveApiEnabled: true
    }, (proof) => verifyNoFixtureTask(proof, 'blocked_no_task_envelope', 'session_not_armed'));
    await verifyCase('active task blocks fixture task', seedActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      activeTaskId: 'task-1',
      activeTaskPresent: true
    }, (proof) => verifyNoFixtureTask(proof, 'blocked_no_task_envelope', 'active_task'));
    await verifyCase('live gate blocks fixture task', seedActorOnly, {
      sessionArmed: true,
      liveApiEnabled: false
    }, (proof) => verifyNoFixtureTask(proof, 'blocked_no_task_envelope', 'live_api_disabled'));
    await verifyCase('no due idles without fixture task', seedWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, (proof) => verifyNoFixtureTask(proof, 'idle_no_task_envelope', 'no_due_watches'));
    await verifyCase('inactive not-due backoff no fixture task', seedWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyWaitingRows);

    console.log(JSON.stringify({
      status: 'Watch no-provider task creation fixture proof verified',
      helper: 'buildWatchTaskCreationFixtureProof',
      cases: [
        'due_actor_fixture_task',
        'due_system_radius_fixture_task',
        'invalid_stored_scope_no_fixture_task',
        'disarmed_no_fixture_task',
        'active_task_no_fixture_task',
        'live_gate_no_fixture_task',
        'no_due_no_fixture_task',
        'inactive_not_due_backoff_no_fixture_task'
      ],
      sample_actor_fixture_task: await sample(seedActorOnly),
      sample_system_radius_fixture_task: await sample(seedSystemOnly),
      sample_invalid_scope: await sample(seedInvalidSystemOnly)
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Watch no-provider task creation fixture proof verified');
}

async function verifyCase(label, seed, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seed(db);
    const before = sideEffectCounts(db);
    const proof = buildWatchTaskCreationFixtureProof(db, {
      now: NOW,
      ...input
    });
    const after = sideEffectCounts(db);
    verifier(proof);
    verifyNoProviderBoundary(proof, label);
    assertSame(after, before, `${label} should not mutate persistent tables`);
    assert(proof.table_mutation_proof.unchanged === true, `${label} should include unchanged table proof`);
  } finally {
    closeDatabase(db);
  }
}

async function sample(seed) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seed(db);
    const proof = buildWatchTaskCreationFixtureProof(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true
    });
    return {
      boundary_status: proof.boundary_status,
      boundary_reason: proof.boundary_reason,
      selected_watch: proof.selected_watch,
      fixture_task_created: proof.fixture_task_created,
      fixture_task_creation_method: proof.fixture_task_creation_method,
      fixture_task: proof.fixture_task,
      would_task_envelope: proof.would_task_envelope,
      task_shape_preserved: proof.task_shape_preserved,
      task_runner_methods_called: proof.task_runner_methods_called,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyActorFixtureTask(proof) {
  assert(proof.fixture_only === true, 'actor proof should be fixture-only');
  assert(proof.fixture_task_created === true, 'actor fixture task should be created');
  assert(proof.fixture_task_creation_method === 'TaskRunner.createTask', 'actor should use createTask only');
  assertSame(proof.task_runner_methods_called, ['TaskRunner.createTask'], 'actor should call only createTask');
  assert(proof.task_shape_preserved === true, 'actor task shape should be preserved');
  assert(proof.payload_meaning_preserved === true, 'actor payload meaning should be preserved');
  assert(proof.fixture_task.type === 'watch.executor.actor.watch', 'actor fixture task type should match');
  assert(proof.fixture_task.classification === 'evidence-creating', 'actor fixture task classification should match');
  assert(proof.fixture_task.scope_key === 'actor:character:90000001', 'actor fixture task scope key should match');
  assert(proof.fixture_task.status === 'queued', 'actor fixture task should be queued only');
  assert(proof.fixture_task.handler_invoked === false, 'actor fixture task handler should not be invoked');
  assert(proof.would_task_envelope.selected_payload_shape.entity_type === 'character', 'actor payload entity type should match');
  assert(proof.would_task_envelope.selected_payload_shape.entity_id === 90000001, 'actor payload entity ID should match');
}

function verifySystemFixtureTask(proof) {
  assert(proof.fixture_only === true, 'system proof should be fixture-only');
  assert(proof.fixture_task_created === true, 'system fixture task should be created');
  assertSame(proof.task_runner_methods_called, ['TaskRunner.createTask'], 'system should call only createTask');
  assert(proof.task_shape_preserved === true, 'system task shape should be preserved');
  assert(proof.payload_meaning_preserved === true, 'system payload meaning should be preserved');
  assert(proof.fixture_task.type === 'watch.executor.system.radius.watch', 'system fixture task type should match');
  assert(proof.fixture_task.classification === 'evidence-creating', 'system fixture task classification should match');
  assert(proof.fixture_task.scope_key === 'system:30003597:radius:1', 'system fixture task scope key should match');
  assertSame(proof.would_task_envelope.selected_payload_shape.accepted_system_ids, ACCEPTED_IDS, 'system payload should preserve stored accepted IDs');
  assert(proof.would_task_envelope.selected_payload_authority.uses_stored_included_system_ids === true, 'system should disclose stored accepted IDs');
  assert(proof.would_task_envelope.selected_payload_authority.center_radius_role === 'provenance_and_management', 'center/radius should be provenance');
  assert(proof.would_task_envelope.selected_payload_authority.center_radius_used_as_authority === false, 'center/radius should not be authority');
}

function verifyNoFixtureTask(proof, status, reason) {
  assert(proof.fixture_task_created === false, 'blocked/idle state should not create fixture task');
  assert(proof.fixture_task === null, 'blocked/idle state should not emit fixture task');
  assert(proof.would_task_envelope === null, 'blocked/idle state should not emit task envelope');
  assert(proof.boundary_status === status, `expected boundary status ${status}, got ${proof.boundary_status}`);
  assert(proof.boundary_reason === reason, `expected boundary reason ${reason}, got ${proof.boundary_reason}`);
  assertSame(proof.task_runner_methods_called, [], 'blocked/idle state should not call TaskRunner methods');
}

function verifyWaitingRows(proof) {
  verifyNoFixtureTask(proof, 'idle_no_task_envelope', 'no_due_watches');
  for (const row of proof.parity_rows) {
    assert(row.selected_by_dry_run === false, 'waiting rows should not be selected');
    assert(row.comparison_status === 'skipped_waiting_or_blocked', 'waiting rows should be skipped/blocked');
  }
}

function verifyNoProviderBoundary(proof, label) {
  assert(proof.fixture_only === true, `${label} should be fixture-only`);
  assert(proof.non_production === true, `${label} should be non-production`);
  assert(proof.renderer_eligible === false, `${label} should not be renderer eligible`);
  assert(proof.provider_movement === false, `${label} should not move providers`);
  assert(proof.watch_execution === false, `${label} should not execute Watch`);
  assert(proof.dispatch_runner_invoked === false, `${label} should not invoke dispatch runner`);
  assert(proof.dispatch_runner_invocations === 0, `${label} should not invoke dispatch runners`);
  assert(proof.collectors_called === false, `${label} should not call collectors`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not make live/API calls`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.evidence_written === false, `${label} should not write Evidence/EVEidence`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence/EVEidence rows`);
  assert(proof.discovery_refs_mutated === 0, `${label} should not mutate Discovery refs`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration output`);
  assert(proof.metadata_writes === 0, `${label} should not write metadata`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.data_quality_warning_writes === 0, `${label} should not write warnings`);
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.support_artifacts_created === 0, `${label} should not create support artifacts`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.ui_work === false, `${label} should not do UI work`);
  assert(proof.real_runtime_task_persistence === false, `${label} should not persist real runtime tasks`);
  assert(proof.default_task_runner_used === false, `${label} should not use default TaskRunner`);
  assert(proof.task_creation_authorized === false, `${label} should not authorize task creation`);
  assert(proof.product_authorization === false, `${label} should not be product authorization`);
  assertSame(proof.forbidden_task_runner_methods_called, [], `${label} should not call forbidden TaskRunner methods`);
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
  seedActorWatch(db, { watchId: 1, nextPollAt: '2026-06-06T19:00:00.000Z' });
  seedSystemWatch(db, {
    watchId: 1,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    backoffUntil: '2026-06-06T18:30:00.000Z'
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
    input.entityName || 'Fixture Task Pilot',
    14,
    input.maxKillmailsPerRun || 5,
    input.isActive ?? 1,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS338 fixture task proof'
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
    'HS338 fixture task proof'
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
