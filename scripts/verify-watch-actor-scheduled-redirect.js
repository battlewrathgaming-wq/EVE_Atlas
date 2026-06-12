const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { TaskRunner } = require('../src/main/services/taskRunner');
const {
  WatchSessionExecutor,
  dispatchFor,
  runScheduledActorWatch
} = require('../src/main/watchlist/watchExecutor');
const { buildWatchScheduleStatus } = require('../src/main/watchlist/watchScheduler');
const { actorWatchCompatibilitySummaryFieldParity } = require('../src/main/discovery/actorWatchCompatibilitySummary');

async function main() {
  verifySourceBoundaries();
  await verifyScheduledSuccess();
  await verifyScheduledFailure();
  console.log('scheduled actor Watch redirect verified');
}

async function verifyScheduledSuccess() {
  const previousLiveApi = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const taskRunner = new TaskRunner({ historyLimit: 20 });
    const executor = new WatchSessionExecutor({ taskRunner, pollIntervalMs: 0 });
    executor.sessionArmed = true;
    const watchId = seedActorWatch(db, {
      entityId: 90044601,
      entityName: 'HS446 Scheduled Actor',
      maxKillmailsPerRun: 1
    });
    const schedule = buildWatchScheduleStatus(db, {
      sessionArmed: true,
      liveApiEnabled: true,
      now: '2026-06-12T00:00:00.000Z'
    });
    const watch = schedule.due.find((entry) => entry.watch_type === 'actor' && entry.watch_id === watchId);
    const dispatch = dispatchFor(watch);
    assert(dispatch.command === 'actor.watch', 'scheduled actor Watch should still dispatch actor.watch command');
    assert(dispatch.runner === runScheduledActorWatch, 'scheduled actor Watch should use boundary-owned scheduled runner');

    const fetchImpl = createSuccessFetch();
    const dispatched = await executor.tick(db, {
      liveApiEnabled: true,
      startInterval: false
    }, {
      fetchImpl,
      maxAttempts: 1,
      timeoutMs: 50
    });
    assert(dispatched.status === 'dispatched', 'due scheduled actor Watch should dispatch');
    assert(dispatched.task.classification === 'evidence-creating', 'scheduled actor Watch task should remain evidence-creating');

    const completed = await waitForTask(taskRunner, dispatched.task.task_id);
    assert(completed.status === 'succeeded', 'scheduled actor Watch task should succeed');
    assert(completed.result.watch.watch_id === watchId, 'task result should include selected watch');
    assert(completed.result.collection.persisted_killmails === 1, 'task result should place summary under data.collection');
    const parity = actorWatchCompatibilitySummaryFieldParity(completed.result.collection);
    assert(parity.matches === true, 'scheduled actor Watch collection should preserve compatibility field parity');
    assert(parity.actual.length === 22, 'scheduled actor Watch collection should expose 22 fields');

    const watchAfterRun = db.prepare(`
      SELECT last_success_at, last_error_at, next_poll_at
      FROM watchlist_entities
      WHERE watch_id = ?
    `).get(watchId);
    assert(Boolean(watchAfterRun.last_success_at), 'success should update last_success_at');
    assert(watchAfterRun.last_error_at === null, 'success should clear last_error_at');
    assert(Boolean(watchAfterRun.next_poll_at), 'success should set next_poll_at');

    const logs = db.prepare(`
      SELECT provider, status_code, retry_count, rate_limited, error_message
      FROM api_request_logs
      ORDER BY provider
    `).all();
    assert(logs.length === 2, 'success should log zKill and ESI through HttpClient');
    assert(logs.some((row) => row.provider === 'zkill' && row.status_code === 200), 'success should log zKill 200');
    assert(logs.some((row) => row.provider === 'esi' && row.status_code === 200), 'success should log ESI 200');
    assert(fetchImpl.invocations().zkill === 1, 'success verifier should use fake zKill fetch once');
    assert(fetchImpl.invocations().esi === 1, 'success verifier should use fake ESI fetch once');
  } finally {
    restoreLiveApi(previousLiveApi);
    closeDatabase(db);
  }
}

async function verifyScheduledFailure() {
  const previousLiveApi = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const taskRunner = new TaskRunner({ historyLimit: 20 });
    const executor = new WatchSessionExecutor({ taskRunner, pollIntervalMs: 0 });
    executor.sessionArmed = true;
    const watchId = seedActorWatch(db, {
      entityId: 90044602,
      entityName: 'HS446 Scheduled Failure',
      maxKillmailsPerRun: 1
    });

    const fetchImpl = createTimeoutFetch();
    const dispatched = await executor.tick(db, {
      liveApiEnabled: true,
      startInterval: false
    }, {
      fetchImpl,
      maxAttempts: 1,
      timeoutMs: 50
    });
    assert(dispatched.status === 'dispatched', 'failure case should dispatch due actor Watch');
    const completed = await waitForTask(taskRunner, dispatched.task.task_id);
    assert(completed.status === 'failed', 'timeout-style failure should fail the task');
    assert(completed.error.code === 'HTTP_TIMEOUT', 'timeout-style failure should preserve HTTP_TIMEOUT code');

    const watchAfterRun = db.prepare(`
      SELECT last_success_at, last_error_at, backoff_until, next_poll_at
      FROM watchlist_entities
      WHERE watch_id = ?
    `).get(watchId);
    assert(watchAfterRun.last_success_at === null, 'failure should not set last_success_at');
    assert(Boolean(watchAfterRun.last_error_at), 'failure should update last_error_at');
    assert(Boolean(watchAfterRun.backoff_until), 'failure should set backoff_until');
    assert(watchAfterRun.next_poll_at === watchAfterRun.backoff_until, 'failure should set next_poll_at to backoff_until');

    const logs = db.prepare(`
      SELECT provider, status_code, error_message
      FROM api_request_logs
      ORDER BY requested_at
    `).all();
    assert(logs.some((row) => row.provider === 'zkill' && row.status_code === 200), 'failure should log zKill success before ESI timeout');
    assert(logs.some((row) => row.provider === 'esi' && row.status_code === null && row.error_message), 'failure should log ESI timeout through HttpClient');
    assert(fetchImpl.invocations().zkill === 1, 'failure verifier should use fake zKill fetch once');
    assert(fetchImpl.invocations().esi === 1, 'failure verifier should use fake ESI fetch once');
  } finally {
    restoreLiveApi(previousLiveApi);
    closeDatabase(db);
  }
}

function verifySourceBoundaries() {
  const watchExecutor = read('src/main/watchlist/watchExecutor.js');
  assert(!/require\(.*actorWatchCollector/.test(watchExecutor), 'watchExecutor should not import actorWatchCollector');
  assert(!/runner: collectActorWatch/.test(watchExecutor), 'scheduled actor Watch should no longer use collectActorWatch runner');
  assert(/runner: runScheduledActorWatch/.test(watchExecutor), 'scheduled actor Watch should use runScheduledActorWatch runner');
  assert(/runner: collectSystemRadiusWatch/.test(watchExecutor), 'system/radius Watch should still use collectSystemRadiusWatch');

  const directService = read('src/main/services/mutatingActionService.js');
  assert(/runActorWatchDirectBody\(input, \{ \.\.\.dependencies, db \}\)/.test(directService), 'direct actor.watch should remain HS440 direct body');
  assert(!/collectActorWatch\(input, \{ \.\.\.dependencies, db \}\)/.test(directService), 'direct actor.watch should not call collectActorWatch');

  const directBody = read('src/main/discovery/actorWatchDirectBody.js');
  assert(!/require\(.*actorWatchCollector/.test(directBody), 'direct body should not import actorWatchCollector');
  assert(!/collectActorWatch\(/.test(directBody), 'direct body should not call collectActorWatch');

  const actorCollector = read('src/main/workers/actorWatchCollector.js');
  assert(/function collectActorWatch/.test(actorCollector), 'collectActorWatch should remain available for now');
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
    input.maxKillmailsPerRun || 1,
    1,
    60,
    input.nextPollAt || null
  );
  return result.lastInsertRowid;
}

function createSuccessFetch() {
  const state = { zkill: 0, esi: 0 };
  const fetchImpl = async (endpoint) => {
    if (endpoint.includes('zkillboard.com')) {
      state.zkill += 1;
      return response(200, [{
        killmail_id: 4460001,
        killmail_time: '2026-06-12T00:00:00Z',
        solar_system_id: 30003597,
        zkb: { hash: 'hs446hash001' },
        victim: { character_id: 90044601 },
        attackers: []
      }]);
    }
    if (endpoint.includes('esi.evetech.net')) {
      state.esi += 1;
      return response(200, rawKillmail(4460001, 90044601));
    }
    throw new Error(`Unexpected fixture endpoint: ${endpoint}`);
  };
  fetchImpl.invocations = () => ({ ...state });
  return fetchImpl;
}

function createTimeoutFetch() {
  const state = { zkill: 0, esi: 0 };
  const fetchImpl = async (endpoint) => {
    if (endpoint.includes('zkillboard.com')) {
      state.zkill += 1;
      return response(200, [{
        killmail_id: 4460002,
        killmail_time: '2026-06-12T00:00:00Z',
        solar_system_id: 30003597,
        zkb: { hash: 'hs446hash002' },
        victim: { character_id: 90044602 },
        attackers: []
      }]);
    }
    if (endpoint.includes('esi.evetech.net')) {
      state.esi += 1;
      const error = new Error('HTTP request timed out');
      error.code = 'HTTP_TIMEOUT';
      error.name = 'TimeoutError';
      error.nonRetryable = true;
      throw error;
    }
    throw new Error(`Unexpected fixture endpoint: ${endpoint}`);
  };
  fetchImpl.invocations = () => ({ ...state });
  return fetchImpl;
}

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    async text() {
      return JSON.stringify(body);
    }
  };
}

function rawKillmail(killmailId, actorId) {
  return {
    killmail_id: killmailId,
    killmail_time: '2026-06-12T00:00:00Z',
    solar_system_id: 30003597,
    victim: {
      character_id: actorId,
      character_name: 'HS446 Scheduled Victim',
      corporation_id: 98044601,
      corporation_name: 'HS446 Victim Corp',
      alliance_id: 99044601,
      alliance_name: 'HS446 Victim Alliance',
      ship_type_id: 587,
      ship_type_name: 'Rifter'
    },
    attackers: [{
      character_id: 90044699,
      character_name: 'HS446 Scheduled Attacker',
      corporation_id: 98044602,
      corporation_name: 'HS446 Attackers',
      alliance_id: 99044602,
      alliance_name: 'HS446 Attack Alliance',
      ship_type_id: 603,
      ship_type_name: 'Merlin',
      weapon_type_id: 2488,
      damage_done: 1200,
      final_blow: true
    }]
  };
}

async function waitForTask(taskRunner, taskId) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const task = taskRunner.getTask(taskId);
    if (task && !['queued', 'running'].includes(task.status)) {
      return task;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for task ${taskId}`);
}

function restoreLiveApi(previousLiveApi) {
  if (previousLiveApi === undefined) {
    delete process.env.AURA_ATLAS_LIVE_API;
  } else {
    process.env.AURA_ATLAS_LIVE_API = previousLiveApi;
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
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
