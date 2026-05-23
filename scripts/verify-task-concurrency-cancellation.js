const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { HttpClient } = require('../src/main/api/httpClient');
const {
  invokeServiceCommand
} = require('../src/main/services/serviceRegistry');
const {
  TaskRunner,
  TASK_CLASSIFICATIONS,
  TASK_STATES
} = require('../src/main/services/taskRunner');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  await verifyLockReleaseAfterCancellation();
  await verifyFailureRerunAndOverlapMatrix();
  await verifyServiceDiagnosticsRemainReviewable();
  console.log('task concurrency and cancellation pressure verified');
}

async function verifyLockReleaseAfterCancellation() {
  const runner = new TaskRunner({ historyLimit: 50 });
  const db = openDatabase(':memory:');
  migrate(db);
  const before = evidenceCounts(db);

  try {
    const task = runner.runDetachedTask({
      type: 'manual.expansion.http-fixture',
      classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      scopeKey: 'manual_actor:character:90000002'
    }, async ({ signal, progress }) => {
      progress({ stage: 'http', message: 'waiting on cancellable fixture HTTP' });
      const client = new HttpClient({
        signal,
        timeoutMs: 5000,
        fetchImpl: neverFetch
      });
      await client.json('esi', 'https://example.invalid/cancelled-expansion');
      return { status: TASK_STATES.SUCCEEDED, data: { expanded: 1 } };
    });
    assert(task.status === TASK_STATES.RUNNING, 'cancellable evidence task should start running');

    const locked = await runner.runTask({
      type: 'manual.expansion.same-scope',
      classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      scopeKey: 'manual_actor:character:90000002'
    }, async () => ({ status: TASK_STATES.SUCCEEDED }));
    assertLocked(locked, 'overlap during cancellable evidence task should be lock-blocked');

    runner.cancelTask(task.task_id, 'fixture cancellation pressure');
    const cancelled = await waitForTask(runner, task.task_id);
    assert(cancelled.status === TASK_STATES.CANCELLED, 'HTTP-bound task should finish cancelled');
    assert(cancelled.cancel_requested_at, 'cancelled task should record cancel request timestamp');
    assert(cancelled.cancel_reason === 'fixture cancellation pressure', 'cancelled task should record reason');
    assert(cancelled.error.code === 'TASK_CANCELLED', 'cancelled task should expose TASK_CANCELLED');
    assert(cancelled.progress.some((entry) => entry.stage === 'http'), 'cancelled task should preserve progress diagnostics');

    const rerun = await runner.runTask({
      type: 'manual.expansion.rerun-after-cancel',
      classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      scopeKey: 'manual_actor:character:90000002'
    }, async ({ progress }) => {
      progress({ stage: 'rerun', message: 'lock released after cancellation' });
      return { status: TASK_STATES.SUCCEEDED, data: { expanded: 0, evidence_effect: 'none' } };
    });
    assert(rerun.status === TASK_STATES.SUCCEEDED, 'same-scope rerun should succeed after cancellation releases lock');
    assertSame(evidenceCounts(db), before, 'cancellation pressure should not mutate evidence tables');
  } finally {
    closeDatabase(db);
  }
}

async function verifyFailureRerunAndOverlapMatrix() {
  const runner = new TaskRunner({ historyLimit: 80 });
  const db = openDatabase(':memory:');
  migrate(db);
  seedReviewableRows(db);
  const before = evidenceCounts(db);

  try {
    let releaseEvidence;
    const evidenceTaskPromise = runner.runTask({
      type: 'manual.expansion.long-running',
      classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      scopeKey: 'manual_actor:character:90000003'
    }, ({ progress, warn }) => new Promise((resolve) => {
      progress({ stage: 'select', message: 'selected queued refs' });
      warn({ code: 'PARTIAL_SAMPLE', message: 'fixture pressure sample is intentionally partial' });
      releaseEvidence = () => resolve({ status: TASK_STATES.SUCCEEDED, data: { expanded: 0 } });
    }));

    const readDuringEvidence = await runner.runTask({
      type: 'report.actor.read-during-evidence',
      classification: TASK_CLASSIFICATIONS.READ_ONLY,
      scopeKey: 'manual_actor:character:90000003'
    }, async () => ({ status: TASK_STATES.SUCCEEDED, data: { rows: count(db, 'killmails') } }));
    assert(readDuringEvidence.status === TASK_STATES.SUCCEEDED, 'read-only task should run during evidence task');

    const sameEvidence = await runner.runTask({
      type: 'watch.executor.same-evidence-scope',
      classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      scopeKey: 'manual_actor:character:90000003'
    }, async () => ({ status: TASK_STATES.SUCCEEDED }));
    assertLocked(sameEvidence, 'same evidence scope should be lock-blocked');

    const destructiveDuringEvidence = await runner.runTask({
      type: 'runtime.db_snapshot.create.exclusive-during-evidence',
      classification: TASK_CLASSIFICATIONS.EXCLUSIVE
    }, async () => ({ status: TASK_STATES.SUCCEEDED }));
    assertLocked(destructiveDuringEvidence, 'exclusive task should be blocked while evidence task is active');

    releaseEvidence();
    const evidenceTask = await evidenceTaskPromise;
    assert(evidenceTask.status === TASK_STATES.SUCCEEDED, 'long-running evidence task should complete');
    assert(evidenceTask.warnings.some((entry) => entry.code === 'PARTIAL_SAMPLE'), 'completed task should retain warnings');

    let releaseMetadata;
    const metadataTaskPromise = runner.runTask({
      type: 'metadata.hydration.long-running',
      classification: TASK_CLASSIFICATIONS.METADATA_ONLY,
      scopeKey: 'report:actor:90000003'
    }, () => new Promise((resolve) => {
      releaseMetadata = () => resolve({ status: TASK_STATES.SUCCEEDED, data: { resolved: 0 } });
    }));
    const metadataSameScope = await runner.runTask({
      type: 'metadata.hydration.same-scope',
      classification: TASK_CLASSIFICATIONS.METADATA_ONLY,
      scopeKey: 'report:actor:90000003'
    }, async () => ({ status: TASK_STATES.SUCCEEDED }));
    assertLocked(metadataSameScope, 'same metadata scope should be lock-blocked');
    const metadataOtherScope = await runner.runTask({
      type: 'metadata.hydration.other-scope',
      classification: TASK_CLASSIFICATIONS.METADATA_ONLY,
      scopeKey: 'report:actor:90000004'
    }, async () => ({ status: TASK_STATES.SUCCEEDED, data: { resolved: 0 } }));
    assert(metadataOtherScope.status === TASK_STATES.SUCCEEDED, 'different metadata scope should run');
    releaseMetadata();
    await metadataTaskPromise;

    const failed = await runner.runTask({
      type: 'manual.expansion.failure',
      classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      scopeKey: 'manual_actor:character:90000005'
    }, async ({ progress, warn }) => {
      progress({ stage: 'expand', message: 'fixture expansion begins' });
      warn({ code: 'FIXTURE_WARNING', message: 'fixture warning before failure' });
      const error = new Error('fixture expansion failure for rerun pressure');
      error.code = 'FIXTURE_EXPANSION_FAILED';
      throw error;
    });
    assert(failed.status === TASK_STATES.FAILED, 'failing task should be visible as failed');
    assert(failed.error.code === 'FIXTURE_EXPANSION_FAILED', 'failure should preserve code');
    assert(failed.progress.length > 0, 'failure should keep progress diagnostics');
    assert(failed.warnings.length > 0, 'failure should keep warning diagnostics');

    const rerun = await runner.runTask({
      type: 'manual.expansion.failure-rerun',
      classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      scopeKey: 'manual_actor:character:90000005'
    }, async () => ({ status: TASK_STATES.SUCCEEDED, data: { expanded: 0 } }));
    assert(rerun.status === TASK_STATES.SUCCEEDED, 'same-scope rerun should succeed after failure releases lock');

    assertSame(evidenceCounts(db), before, 'lock pressure harness should preserve scoped evidence tables');
    const history = runner.listTasks({ limit: 80 });
    assert(history.some((task) => task.status === TASK_STATES.FAILED && task.error?.code === 'TASK_LOCKED'), 'history should include lock failure diagnostics');
    assert(history.some((task) => task.status === TASK_STATES.FAILED && task.error?.code === 'FIXTURE_EXPANSION_FAILED'), 'history should include task failure diagnostics');
  } finally {
    closeDatabase(db);
  }
}

async function verifyServiceDiagnosticsRemainReviewable() {
  const root = path.join(auraTempRoot(), 'task-concurrency-cancellation');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
  const dbPath = path.join(root, 'diagnostics.sqlite');
  const db = openDatabase(dbPath);
  migrate(db);
  const before = evidenceCounts(db);

  try {
    await withEnv({ AURA_ATLAS_LIVE_API: null }, async () => {
      const failed = await invokeServiceCommand('manual.discovery', {
        scope: 'actor',
        entityType: 'character',
        entityId: 90000006,
        entityName: 'Gate Closed Scout',
        scopeKey: 'manual_actor:character:90000006'
      }, {
        db,
        databasePath: dbPath,
        asTask: true,
        zkillClient: {
          async discoverRefs() {
            throw new Error('should not call zKill while gate is closed');
          }
        }
      });
      assert(failed.status === TASK_STATES.FAILED, 'gate-blocked service task should fail visibly');
      assert(failed.error.code === 'LIVE_API_DISABLED', 'gate-blocked task should preserve blocker code');
      assertSame(evidenceCounts(db), before, 'gate-blocked service task should not mutate evidence tables');

      const taskList = await invokeServiceCommand('task.list', { limit: 10 }, { db });
      assert(taskList.some((task) => task.task_id === failed.task_id && task.error?.code === 'LIVE_API_DISABLED'), 'task history should include failed gate task');

      const trace = await invokeServiceCommand('support.debug_trace_pack', {
        outputDir: path.join(root, 'trace')
      }, {
        db,
        databasePath: dbPath
      });
      assert(fs.existsSync(trace.output_path), 'debug trace pack should write reviewable support artifact');
      const traceText = fs.readFileSync(trace.output_path, 'utf8');
      assert(traceText.includes('LIVE_API_DISABLED'), 'trace pack should include task failure code');
      assert(trace.pack.exclusions.includes('raw_esi_payload'), 'trace pack should state raw payload exclusion');
      assert(!traceText.includes('"raw_esi_payload":{'), 'trace pack should not dump raw ESI payload objects');
      assert(!traceText.includes('"raw_esi_payload":"'), 'trace pack should not dump raw ESI payload strings');
      assertSame(evidenceCounts(db), before, 'trace pack should not mutate evidence tables');
    });
  } finally {
    closeDatabase(db);
    fs.rmSync(root, { recursive: true, force: true });
  }
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
    if (task && task.status !== TASK_STATES.RUNNING && task.status !== TASK_STATES.QUEUED) {
      return task;
    }
    await delay(10);
  }
  throw new Error(`Timed out waiting for task ${taskId}`);
}

function seedReviewableRows(db) {
  const repository = new EvidenceRepository(db);
  repository.upsertDiscoveredKillmailRefs([{
    killmail_id: 99001,
    hash: 'hash_99001',
    discovered_at: '2026-05-23T12:00:00Z'
  }], {
    runId: 'run_task_pressure_seed',
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000003',
    sourceActorType: 'character',
    sourceActorId: 90000003,
    sourceScope: 'character:90000003'
  });
}

function evidenceCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertLocked(task, message) {
  assert(task.status === TASK_STATES.FAILED, message);
  assert(task.error?.code === 'TASK_LOCKED', `${message}: expected TASK_LOCKED, got ${task.error?.code || task.status}`);
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
