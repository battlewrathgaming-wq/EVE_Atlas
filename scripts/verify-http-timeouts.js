const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { HttpClient } = require('../src/main/api/httpClient');
const { TaskRunner, TASK_CLASSIFICATIONS, TASK_STATES } = require('../src/main/services/taskRunner');

async function main() {
  await verifyHttpTimeoutLogs();
  await verifyTaskCancellationAbortsHttp();
  console.log('HTTP timeout and cancellation verified');
}

async function verifyHttpTimeoutLogs() {
  const db = openDatabase(':memory:');
  migrate(db);
  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'manual_discovery',
    watchId: 'timeout-fixture'
  });
  const client = new HttpClient({
    repository,
    runId: run.run_id,
    timeoutMs: 20,
    fetchImpl: neverFetch
  });

  try {
    await assertRejects(
      () => client.json('zkill', 'https://example.invalid/timeout'),
      'HTTP_TIMEOUT',
      'timeout request should reject with HTTP_TIMEOUT'
    );
    const log = db.prepare(`
      SELECT provider, error_message, retry_count
      FROM api_request_logs
      WHERE run_id = ?
    `).get(run.run_id);
    assert(log.provider === 'zkill', 'timeout should log provider');
    assert(log.error_message === 'HTTP request timed out', 'timeout should log clear message');
    assert(log.retry_count === 0, 'timeout should not retry repeatedly');
  } finally {
    closeDatabase(db);
  }
}

async function verifyTaskCancellationAbortsHttp() {
  const runner = new TaskRunner();
  const task = runner.runDetachedTask({
    type: 'http.fixture',
    classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
    scopeKey: 'http-timeout-fixture'
  }, async ({ signal }) => {
    const client = new HttpClient({
      signal,
      timeoutMs: 1000,
      fetchImpl: neverFetch
    });
    await client.json('esi', 'https://example.invalid/cancel');
    return { status: TASK_STATES.SUCCEEDED };
  });

  assert(task.status === TASK_STATES.RUNNING, 'detached HTTP fixture should start running');
  runner.cancelTask(task.task_id, 'fixture cancellation');
  const cancelled = await waitForTask(runner, task.task_id);
  assert(cancelled.status === TASK_STATES.CANCELLED, 'cancelled HTTP fixture should finish as cancelled');
  assert(cancelled.error.code === 'TASK_CANCELLED', 'cancelled task should use task cancellation code');
  assert(cancelled.cancel_requested_at, 'cancelled task should record cancel request time');
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

async function assertRejects(fn, expectedCode, message) {
  try {
    await fn();
  } catch (error) {
    assert(error.code === expectedCode, `${message}: expected ${expectedCode}, got ${error.code || error.message}`);
    return;
  }
  throw new Error(message);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
