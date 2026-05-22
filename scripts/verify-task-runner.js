const { TaskRunner, TASK_CLASSIFICATIONS, TASK_STATES } = require('../src/main/services/taskRunner');

async function main() {
  const runner = new TaskRunner({ historyLimit: 10 });

  const readOnly = await runner.runTask({
    type: 'report.fixture',
    classification: TASK_CLASSIFICATIONS.READ_ONLY,
    scopeKey: 'same-scope'
  }, async ({ progress, warn }) => {
    progress({ stage: 'report', message: 'building report', current: 1, total: 2 });
    warn({ severity: 'info', code: 'PARTIAL_SAMPLE', message: 'fixture sample' });
    return { status: TASK_STATES.SUCCEEDED, data: { ok: true } };
  });
  assert(readOnly.status === TASK_STATES.SUCCEEDED, 'read-only task should succeed');
  assert(readOnly.progress.length === 1, 'progress event should be recorded');
  assert(readOnly.warnings[0].code === 'PARTIAL_SAMPLE', 'warning should be recorded');

  let releaseEvidence;
  const firstEvidence = runner.runTask({
    type: 'manual.expand',
    classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
    scopeKey: 'manual_actor:character:90000002'
  }, () => new Promise((resolve) => {
    releaseEvidence = () => resolve({ status: TASK_STATES.SUCCEEDED, data: { expanded: 1 } });
  }));

  const lockedEvidence = await runner.runTask({
    type: 'manual.expand',
    classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
    scopeKey: 'manual_actor:character:90000002'
  }, async () => ({ status: TASK_STATES.SUCCEEDED }));
  assert(lockedEvidence.status === TASK_STATES.FAILED, 'overlapping evidence task should fail');
  assert(lockedEvidence.error.code === 'TASK_LOCKED', 'overlap should produce task lock error');

  releaseEvidence();
  const completedEvidence = await firstEvidence;
  assert(completedEvidence.status === TASK_STATES.SUCCEEDED, 'first evidence task should complete after lock release');

  const partial = await runner.runTask({
    type: 'hydration.fixture',
    classification: TASK_CLASSIFICATIONS.METADATA_ONLY,
    scopeKey: 'report:actor:90000002'
  }, async () => ({ status: TASK_STATES.PARTIAL, data: { resolved: 2, unresolved: 1 } }));
  assert(partial.status === TASK_STATES.PARTIAL, 'partial status should be preserved');

  const failed = await runner.runTask({
    type: 'failing.fixture',
    classification: TASK_CLASSIFICATIONS.READ_ONLY
  }, async () => {
    const error = new Error('fixture failure');
    error.code = 'FIXTURE_FAILURE';
    throw error;
  });
  assert(failed.status === TASK_STATES.FAILED, 'thrown task should fail');
  assert(failed.error.code === 'FIXTURE_FAILURE', 'task error code should be preserved');

  const history = runner.listTasks();
  assert(history.length >= 5, 'task history should include recent tasks');
  assert(runner.getTask(readOnly.task_id).task_id === readOnly.task_id, 'task get should return task');

  console.log('task runner verified');
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
