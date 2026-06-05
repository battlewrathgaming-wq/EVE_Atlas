const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { TaskRunner } = require('../src/main/services/taskRunner');
const {
  WatchSessionExecutor,
  dispatchFor,
  selectDueWatch
} = require('../src/main/watchlist/watchExecutor');
const { buildWatchScheduleStatus } = require('../src/main/watchlist/watchScheduler');

async function main() {
  const previousLiveApi = process.env.AURA_ATLAS_LIVE_API;
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    const taskRunner = new TaskRunner({ historyLimit: 20 });
    const executor = new WatchSessionExecutor({ taskRunner, pollIntervalMs: 0 });
    const dueWatchId = seedActorWatch(db, {
      entityId: 90000001,
      entityName: 'Executor Test Pilot',
      maxKillmailsPerRun: 2
    });
    const laterWatchId = seedActorWatch(db, {
      entityId: 90000002,
      entityName: 'Later Test Pilot',
      maxKillmailsPerRun: 2,
      nextPollAt: '2999-01-01T00:00:00.000Z'
    });

    const disarmed = executor.status(db);
    assert(disarmed.session_armed === false, 'executor should start disarmed');
    assert(disarmed.schedule.due.length === 0, 'disarmed session should not mark watches due');

    const blockedDisarmed = await executor.tick(db);
    assert(blockedDisarmed.status === 'blocked', 'disarmed tick should be blocked');
    assert(blockedDisarmed.reason === 'session_not_armed', 'disarmed tick should explain session gate');

    const schedule = buildWatchScheduleStatus(db, {
      sessionArmed: true,
      liveApiEnabled: true,
      now: '2026-05-22T00:00:00.000Z'
    });
    assert(schedule.due.length === 1, 'only one seeded watch should be due');
    assert(selectDueWatch(schedule.due).watch_id === dueWatchId, 'due selector should pick the due watch');
    assert(dispatchFor(selectDueWatch(schedule.due)).command === 'actor.watch', 'actor watch should dispatch actor collector');

    const blockedLive = await executor.arm(db, {
      liveApiEnabled: false,
      startInterval: false
    });
    assert(blockedLive.session_armed === true, 'arm should set volatile session state');
    assert(blockedLive.tick.status === 'blocked', 'arm without live API should not dispatch');
    assert(blockedLive.tick.reason === 'live_api_disabled', 'live API gate should block dispatch');
    assert(taskRunner.listTasks().length === 0, 'blocked arm should not create tasks');

    process.env.AURA_ATLAS_LIVE_API = '1';
    const dispatched = await executor.tick(db, {
      liveApiEnabled: true,
      startInterval: false
    }, {
      zkillClient: fakeZKillClient(),
      esiClient: fakeEsiClient()
    });
    assert(dispatched.status === 'dispatched', 'armed live tick should dispatch one due watch');
    assert(dispatched.task.classification === 'evidence-creating', 'watch task should be evidence-creating');

    const completedTask = await waitForTask(taskRunner, dispatched.task.task_id);
    assert(completedTask.status === 'succeeded', 'empty actor watch should complete successfully');
    assert(completedTask.result.watch.watch_id === dueWatchId, 'task result should include selected watch');

    const watchAfterRun = db.prepare(`
      SELECT last_success_at, last_error_at, next_poll_at
      FROM watchlist_entities
      WHERE watch_id = ?
    `).get(dueWatchId);
    assert(Boolean(watchAfterRun.last_success_at), 'successful task should record watch success');
    assert(watchAfterRun.last_error_at === null, 'successful task should clear last error');
    assert(Boolean(watchAfterRun.next_poll_at), 'successful task should schedule next poll');

    const statusAfterCompletion = executor.status(db);
    assert(statusAfterCompletion.active_task_id === null, 'status should clear completed active task IDs');

    const noDue = await executor.tick(db, {
      liveApiEnabled: true,
      startInterval: false
    }, {
      zkillClient: fakeZKillClient(),
      esiClient: fakeEsiClient()
    });
    assert(noDue.status === 'idle', 'second tick should be idle when no watches are due');
    assert(noDue.reason === 'no_due_watches', 'idle tick should explain that no watches are due');

    const disarmedAgain = executor.disarm(db, { reason: 'verification' });
    assert(disarmedAgain.session_armed === false, 'disarm should clear volatile session state');
    assert(disarmedAgain.last_blocked_reason === 'verification', 'disarm should record reason');

    const laterWatch = db.prepare('SELECT last_success_at FROM watchlist_entities WHERE watch_id = ?').get(laterWatchId);
    assert(laterWatch.last_success_at === null, 'not-due watch should not be dispatched');
  } finally {
    if (previousLiveApi === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = previousLiveApi;
    }
    closeDatabase(db);
  }

  await verifySystemRadiusWatchScopeDispatch();
  console.log('watch session executor verified');
}

async function verifySystemRadiusWatchScopeDispatch() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const validWatchId = seedSystemWatch(db, {
      centerSystemId: 30000101,
      centerSystemName: 'ATLAS-A',
      includedSystemIds: '[30000101,30000103]',
      excludedSystemIds: '[30000102]'
    });
    const malformedWatchId = seedSystemWatch(db, {
      centerSystemId: 30000102,
      centerSystemName: 'ATLAS-B',
      includedSystemIds: 'not-json',
      excludedSystemIds: '[]',
      nextPollAt: '2999-01-01T00:00:00.000Z'
    });

    const schedule = buildWatchScheduleStatus(db, {
      sessionArmed: true,
      liveApiEnabled: true,
      now: '2026-06-05T00:00:00.000Z'
    });
    const validWatch = schedule.due.find((watch) => watch.watch_type === 'system_radius' && watch.watch_id === validWatchId);
    const dispatch = dispatchFor(validWatch);
    assert(dispatch.command === 'system.radius.watch', 'system/radius watch should dispatch system collector');
    assertSame(dispatch.payload.acceptedSystemIds, [30000101, 30000103], 'dispatch should carry stored accepted system IDs');
    assert(dispatch.payload.acceptedScopeSource === 'stored_watch_scope', 'dispatch should identify stored Watch scope authority');
    assert(dispatch.payload.centerSystemId === 30000101, 'dispatch should preserve center as provenance');
    assert(dispatch.payload.radiusJumps === 1, 'dispatch should preserve radius as provenance');
    assert(dispatch.payload.maxSystems === 2, 'dispatch should not re-cap accepted stored systems');

    const malformedSchedule = buildWatchScheduleStatus(db, {
      sessionArmed: true,
      liveApiEnabled: true,
      now: '3000-01-01T00:00:00.000Z'
    });
    const malformedWatch = malformedSchedule.due.find((watch) => watch.watch_type === 'system_radius' && watch.watch_id === malformedWatchId);
    let malformedError = null;
    try {
      dispatchFor(malformedWatch);
    } catch (error) {
      malformedError = error;
    }
    assert(malformedError?.code === 'watch_scope_authority_invalid', 'malformed stored scope should fail before dispatch payload');

    db.prepare('DELETE FROM system_watches WHERE watch_id = ?').run(validWatchId);
    db.prepare('UPDATE system_watches SET next_poll_at = NULL WHERE watch_id = ?').run(malformedWatchId);
    const taskRunner = new TaskRunner({ historyLimit: 10 });
    const executor = new WatchSessionExecutor({ taskRunner, pollIntervalMs: 0 });
    executor.sessionArmed = true;
    const blocked = await executor.tick(db, {
      liveApiEnabled: true,
      startInterval: false
    });
    assert(blocked.status === 'blocked', 'invalid stored scope should block Watch tick');
    assert(blocked.reason === 'watch_scope_authority_invalid', 'blocked tick should explain invalid stored scope');
    assert(taskRunner.listTasks().length === 0, 'invalid stored scope should block before task creation');
  } finally {
    closeDatabase(db);
  }
}

function seedActorWatch(db, input = {}) {
  const result = db.prepare(`
    INSERT INTO watchlist_entities (
      entity_type, entity_id, entity_name, lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes, next_poll_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'character',
    input.entityId,
    input.entityName,
    7,
    input.maxKillmailsPerRun || 2,
    1,
    60,
    input.nextPollAt || null
  );
  return result.lastInsertRowid;
}

function seedSystemWatch(db, input = {}) {
  const result = db.prepare(`
    INSERT INTO system_watches (
      center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes, next_poll_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.centerSystemId,
    input.centerSystemName,
    1,
    input.includedSystemIds,
    input.excludedSystemIds,
    24,
    35,
    10,
    1,
    60,
    input.nextPollAt || null
  );
  return result.lastInsertRowid;
}

function fakeZKillClient() {
  return {
    async discoverRefs() {
      return [];
    }
  };
}

function fakeEsiClient() {
  return {
    async getKillmail() {
      throw new Error('ESI should not be called when zKill returns no refs');
    }
  };
}

async function waitForTask(taskRunner, taskId) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const task = taskRunner.getTask(taskId);
    if (task && !['queued', 'running'].includes(task.status)) {
      return task;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for task ${taskId}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSame(actual, expected, message) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(`${message}: expected ${expectedText}, got ${actualText}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
