const fs = require('node:fs');
const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { HttpClient } = require('../src/main/api/httpClient');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');
const { buildAppReadiness } = require('../src/main/services/appReadinessService');
const { buildOperatorDebugTracePack, writeOperatorDebugTracePack } = require('../src/main/support/operatorDebugTracePack');
const { TaskRunner, TASK_CLASSIFICATIONS, TASK_STATES } = require('../src/main/services/taskRunner');
const { WatchSessionExecutor } = require('../src/main/watchlist/watchExecutor');
const { addWatchlistEntity } = require('../src/main/watchlist/watchlistRepository');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previous = captureEnv();
  const root = path.join(auraTempRoot(), 'app-restart-recovery');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
  process.env.AURA_ATLAS_TEST_TMP = root;
  process.env.AURA_ATLAS_CACHE_DIR = path.join(root, 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = path.join(root, 'sde');
  delete process.env.AURA_ATLAS_LIVE_API;

  const dbPath = path.join(root, 'restart-recovery.sqlite');
  const db = openDatabase(dbPath);
  migrate(db);

  try {
    await new SdeTopologyImporter(db).importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
      buildNumber: 'fixture-build',
      sourceUrl: 'fixtures/sde-jsonl'
    });
    seedReviewableState(db);

    await verifyRunningAndCancelledTaskReinitialization(db);
    await verifyFailedServiceWorkReviewableAfterReinitialization(db, dbPath, root);
    await verifyWatchExecutorDoesNotResumeAfterReinitialization(db);
    verifyPassiveRecoverySurfaces(db, dbPath, root);

    console.log('app restart recovery verified');
  } finally {
    closeDatabase(db);
    restoreEnv(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function verifyRunningAndCancelledTaskReinitialization(db) {
  const before = persistedCounts(db);
  const runnerBeforeRestart = new TaskRunner({ historyLimit: 20 });
  const running = runnerBeforeRestart.runDetachedTask({
    type: 'manual.expansion.restart-running-fixture',
    classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
    scopeKey: 'manual_actor:character:90000002'
  }, async ({ signal, progress }) => {
    progress({ stage: 'http', message: 'fixture running task before simulated restart' });
    const client = new HttpClient({
      signal,
      timeoutMs: 5000,
      fetchImpl: neverFetch
    });
    await client.json('esi', 'https://example.invalid/restart-running');
  });
  assert(running.status === TASK_STATES.RUNNING, 'pre-restart running task should start');

  const blocked = await runnerBeforeRestart.runTask({
    type: 'manual.expansion.locked-before-restart',
    classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
    scopeKey: 'manual_actor:character:90000002'
  }, async () => ({ status: TASK_STATES.SUCCEEDED }));
  assert(blocked.status === TASK_STATES.FAILED && blocked.error?.code === 'TASK_LOCKED', 'same-scope work should be locked before restart');

  const runnerAfterRestart = new TaskRunner({ historyLimit: 20 });
  assert(runnerAfterRestart.listTasks({ limit: 5 }).length === 0, 'fresh task runner should not claim persisted in-memory task history');
  const rerun = await runnerAfterRestart.runTask({
    type: 'manual.expansion.after-running-restart',
    classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
    scopeKey: 'manual_actor:character:90000002'
  }, async ({ progress }) => {
    progress({ stage: 'restart-check', message: 'fresh runner lock state after restart' });
    return { status: TASK_STATES.SUCCEEDED, data: { recovered: 'volatile task state cleared; persisted DB unchanged' } };
  });
  assert(rerun.status === TASK_STATES.SUCCEEDED, 'fresh task runner should not inherit stale running lock');
  assertSame(persistedCounts(db), before, 'fresh runner check should not mutate persisted evidence state');

  runnerBeforeRestart.cancelTask(running.task_id, 'cleanup after simulated restart');
  const cancelled = await waitForTask(runnerBeforeRestart, running.task_id);
  assert(cancelled.status === TASK_STATES.CANCELLED, 'pre-restart running task should be cancellable during harness cleanup');

  const cancelledRunner = new TaskRunner({ historyLimit: 20 });
  const cancellable = cancelledRunner.runDetachedTask({
    type: 'metadata.hydration.restart-cancel-fixture',
    classification: TASK_CLASSIFICATIONS.METADATA_ONLY,
    scopeKey: 'report:actor:90000002'
  }, async ({ signal }) => {
    const client = new HttpClient({
      signal,
      timeoutMs: 5000,
      fetchImpl: neverFetch
    });
    await client.json('esi', 'https://example.invalid/restart-cancel');
  });
  cancelledRunner.cancelTask(cancellable.task_id, 'fixture cancellation before restart');
  const cancelledTask = await waitForTask(cancelledRunner, cancellable.task_id);
  assert(cancelledTask.status === TASK_STATES.CANCELLED, 'cancelled task should finish cancelled before simulated restart');

  const runnerAfterCancellationRestart = new TaskRunner({ historyLimit: 20 });
  assert(runnerAfterCancellationRestart.listTasks({ limit: 5 }).length === 0, 'cancelled in-memory task history should not be presented as persisted after restart');
  const metadataRerun = await runnerAfterCancellationRestart.runTask({
    type: 'metadata.hydration.after-cancel-restart',
    classification: TASK_CLASSIFICATIONS.METADATA_ONLY,
    scopeKey: 'report:actor:90000002'
  }, async () => ({ status: TASK_STATES.SUCCEEDED, data: { resolved: 0 } }));
  assert(metadataRerun.status === TASK_STATES.SUCCEEDED, 'fresh runner should not inherit stale cancelled metadata lock');
  assertSame(persistedCounts(db), before, 'cancel/restart check should not mutate persisted evidence state');
}

async function verifyFailedServiceWorkReviewableAfterReinitialization(db, dbPath, root) {
  const before = persistedCounts(db);
  const repository = new FailingRepository(db);
  const failed = await withEnv({ AURA_ATLAS_LIVE_API: '1' }, () => invokeServiceCommand('manual.expansion', {
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000002',
    maxExpansions: 1,
    scopeKey: 'manual_actor:character:90000002',
    trigger: 'fixture_restart_failure'
  }, {
    db,
    databasePath: dbPath,
    asTask: true,
    repository,
    esiClient: loggingEsiClient(db, repository)
  }));
  assert(failed.status === TASK_STATES.FAILED, 'failed service work should fail visibly before restart');
  assert(String(failed.error?.message || '').includes('fixture restart persistence interruption'), 'failed service task should preserve failure message');
  assert(count(db, 'killmails') === before.killmails, 'failed service work should not persist partial killmail evidence');
  assert(count(db, 'activity_events') === before.activity_events, 'failed service work should not persist partial activity events');
  assert(queueStatus(db, 910001) === 'pending', 'failed service work should leave queued ref pending for review/retry');
  const failedRun = latestFetchRun(db);
  assert(failedRun.status === 'failed', 'failed service work should leave failed fetch run');
  assert(failedRun.api_calls_esi === 1, 'failed service work should leave scoped API count');
  assert(latestApiLog(db).run_id === failedRun.run_id, 'failed service work should leave scoped API log');

  const freshRunner = new TaskRunner({ historyLimit: 20 });
  const trace = buildOperatorDebugTracePack(db, {
    databasePath: dbPath,
    taskRunner: freshRunner
  });
  assert(trace.task_history.length === 0, 'fresh support trace should be honest that in-memory task history is not persisted');
  assert(trace.fetch_runs.some((run) => run.run_id === failedRun.run_id && run.status === 'failed'), 'fresh support trace should include failed persisted fetch run');
  assert(trace.api_request_logs.some((log) => log.run_id === failedRun.run_id && log.provider === 'esi'), 'fresh support trace should include persisted API log');
  assert(trace.queue_status.latest_refs.some((ref) => ref.killmail_id === 910001 && ref.status === 'pending'), 'fresh support trace should include reviewable queue ref');

  const written = writeOperatorDebugTracePack(db, {
    databasePath: dbPath,
    outputDir: path.join(root, 'trace-after-failure-restart'),
    taskRunner: freshRunner
  });
  assert(fs.existsSync(written.output_path), 'fresh support trace should write reviewable artifact after restart');
  const traceText = fs.readFileSync(written.output_path, 'utf8');
  assert(!traceText.includes('"raw_esi_payload":{'), 'restart trace should not dump raw ESI payload objects');
  assert(!traceText.includes('"raw_esi_payload":"'), 'restart trace should not dump raw ESI payload strings');
  assertSame({
    ...before,
    fetch_runs: before.fetch_runs + 1,
    api_request_logs: before.api_request_logs + 1
  }, persistedCounts(db), 'support trace after failed service work should not add hidden evidence or assessment state');
}

async function verifyWatchExecutorDoesNotResumeAfterReinitialization(db) {
  const before = persistedCounts(db);
  const oldRunner = new TaskRunner({ historyLimit: 20 });
  const oldExecutor = new WatchSessionExecutor({ taskRunner: oldRunner, pollIntervalMs: 0 });
  const armed = await oldExecutor.arm(db, {
    liveApiEnabled: false,
    startInterval: false
  });
  assert(armed.session_armed === true, 'old executor should be armed before simulated restart');
  assert(armed.tick.status === 'blocked' && armed.tick.reason === 'live_api_disabled', 'old armed executor should be blocked by live gate');
  assert(oldRunner.listTasks({ limit: 5 }).length === 0, 'live-gate blocked watch arm should not create collection tasks');

  const freshExecutor = new WatchSessionExecutor({ taskRunner: new TaskRunner({ historyLimit: 20 }), pollIntervalMs: 0 });
  const freshStatus = freshExecutor.status(db);
  assert(freshStatus.session_armed === false, 'fresh watch executor should start disarmed after restart');
  assert(freshStatus.active_task_id === null, 'fresh watch executor should not inherit active task ID');
  assert(freshStatus.last_blocked_reason === 'session_not_armed', 'fresh watch executor should report session gate honestly');
  assert(freshStatus.schedule.due.length === 0, 'fresh disarmed status should not present due watches as runnable');
  const freshTick = await freshExecutor.tick(db, { liveApiEnabled: true, startInterval: false }, {
    zkillClient: throwingZkillClient(),
    esiClient: throwingEsiClient()
  });
  assert(freshTick.status === 'blocked' && freshTick.reason === 'session_not_armed', 'fresh tick should not dispatch collection until explicitly armed');
  assertSame(before, persistedCounts(db), 'watch reinitialization should not call APIs or mutate persisted state');
}

function verifyPassiveRecoverySurfaces(db, dbPath, root) {
  const before = persistedCounts(db);
  const readiness = buildAppReadiness(db, {
    databasePath: dbPath,
    mode: 'restart-recovery'
  });
  assert(readiness.live_api.state === 'disabled', 'restart readiness should preserve closed live API gate');
  assert(readiness.lookup_counts.killmails === before.killmails, 'restart readiness should report persisted killmail count');
  assert(readiness.lookup_counts.activity_events === before.activity_events, 'restart readiness should report persisted activity count');

  const freshTrace = writeOperatorDebugTracePack(db, {
    databasePath: dbPath,
    outputDir: path.join(root, 'passive-trace'),
    taskRunner: new TaskRunner({ historyLimit: 20 })
  });
  const traceText = fs.readFileSync(freshTrace.output_path, 'utf8');
  assert(traceText.includes('This trace pack reads local SQLite tables and in-memory task history only.'), 'trace should state volatile/persisted boundary');
  assert(!traceText.includes('"raw_esi_payload":{'), 'passive trace should not dump raw ESI payload objects');
  assert(!traceText.includes('"raw_esi_payload":"'), 'passive trace should not dump raw ESI payload strings');
  assertSame(before, persistedCounts(db), 'readiness and trace after restart should not mutate persisted state');
}

class FailingRepository extends EvidenceRepository {
  upsertActivityEvent(event) {
    if (event.killmail_id === 910001 && event.event_key.includes(':character:')) {
      throw new Error('fixture restart persistence interruption');
    }
    return super.upsertActivityEvent(event);
  }
}

function seedReviewableState(db) {
  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    runId: 'run_restart_seed',
    trigger: 'fixture_seed',
    watchType: 'manual_expand',
    watchId: 'restart-seed'
  });
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{ raw: expandedKillmail(910000, 'restart_seed_hash_910000'), hash: 'restart_seed_hash_910000' }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'restart-seed',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'fixture',
      id: 910000
    }
  });
  const result = repository.persistEvidencePackage(pkg);
  repository.insertWarning(run.run_id, {
    killmail_id: 910000,
    warning_type: 'RESTART_RECOVERY_FIXTURE',
    message: 'Restart recovery fixture warning remains reviewable after reinitialization.'
  });
  repository.finalizeFetchRun(run.run_id, {
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten
  }, 'success');
  repository.upsertDiscoveredKillmailRefs([{
    killmail_id: 910001,
    hash: 'restart_queue_hash_910001',
    discovered_at: '2026-05-23T20:00:00Z'
  }], {
    runId: 'run_restart_seed',
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000002',
    sourceActorType: 'character',
    sourceActorId: 90000002,
    sourceScope: 'character:90000002'
  });
  addWatchlistEntity(db, {
    entityType: 'character',
    entityId: 90000002,
    entityName: 'Restart Scout',
    lookbackDays: 7,
    maxKillmailsPerRun: 1,
    pollIntervalMinutes: 60,
    isActive: true,
    notes: 'Restart recovery fixture'
  });
}

function loggingEsiClient(db, repository) {
  return {
    async expandKillmail(killmailId, hash) {
      const run = latestRunningFetchRun(db);
      repository.insertApiRequestLog({
        run_id: run?.run_id || null,
        run_type: 'collection',
        provider: 'esi',
        endpoint: `fixture://esi/restart/${killmailId}/${hash}`,
        method: 'GET',
        status_code: 200,
        duration_ms: 1,
        cache_status: 'miss'
      });
      return expandedKillmail(killmailId, hash);
    }
  };
}

function expandedKillmail(killmailId, hash) {
  const clone = JSON.parse(JSON.stringify(fixtureKillmail));
  clone.killmail_id = killmailId;
  clone.killmail_time = `2026-05-23T20:${String(killmailId % 60).padStart(2, '0')}:00Z`;
  clone.solar_system_id = 30000001;
  clone.victim.character_id = 90000001;
  clone.victim.corporation_id = 98000001;
  clone.victim.alliance_id = 99000001;
  clone.attackers = (clone.attackers || []).slice(0, 2).map((attacker, index) => ({
    ...attacker,
    character_id: 90000002 + index,
    corporation_id: 98000002,
    alliance_id: 99000002,
    final_blow: index === 0
  }));
  clone.__fixture_hash = hash;
  return clone;
}

function persistedCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    data_quality_warnings: count(db, 'data_quality_warnings')
  };
}

function latestFetchRun(db) {
  return db.prepare(`
    SELECT *
    FROM fetch_runs
    ORDER BY rowid DESC
    LIMIT 1
  `).get();
}

function latestRunningFetchRun(db) {
  return db.prepare(`
    SELECT *
    FROM fetch_runs
    WHERE status = 'running'
    ORDER BY rowid DESC
    LIMIT 1
  `).get();
}

function latestApiLog(db) {
  return db.prepare(`
    SELECT *
    FROM api_request_logs
    ORDER BY rowid DESC
    LIMIT 1
  `).get();
}

function queueStatus(db, killmailId) {
  return db.prepare(`
    SELECT status
    FROM discovered_killmail_refs
    WHERE killmail_id = ?
  `).get(killmailId)?.status;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function neverFetch(_endpoint, options = {}) {
  return new Promise((_resolve, reject) => {
    if (options.signal?.aborted) {
      reject(abortError());
      return;
    }
    options.signal?.addEventListener('abort', () => reject(abortError()), { once: true });
  });
}

function abortError() {
  const error = new Error('aborted');
  error.name = 'AbortError';
  return error;
}

async function waitForTask(runner, taskId) {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    const task = runner.getTask(taskId);
    if (task && ![TASK_STATES.RUNNING, TASK_STATES.QUEUED].includes(task.status)) {
      return task;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for task ${taskId}`);
}

function throwingZkillClient() {
  return {
    async discoverRefs() {
      throw new Error('restart recovery should not call zKill');
    }
  };
}

function throwingEsiClient() {
  return {
    async expandKillmail() {
      throw new Error('restart recovery should not call ESI');
    }
  };
}

async function withEnv(values, callback) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === null) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function captureEnv() {
  return {
    AURA_ATLAS_TEST_TMP: process.env.AURA_ATLAS_TEST_TMP,
    AURA_ATLAS_CACHE_DIR: process.env.AURA_ATLAS_CACHE_DIR,
    AURA_ATLAS_SDE_CACHE_DIR: process.env.AURA_ATLAS_SDE_CACHE_DIR,
    AURA_ATLAS_LIVE_API: process.env.AURA_ATLAS_LIVE_API
  };
}

function restoreEnv(previous) {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
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
