const { buildAppReadiness } = require('../src/main/services/appReadinessService');
const { actionGate } = require('../src/main/services/liveApiGateService');
const {
  knownCodes,
  taxonomyMessage,
  validateTaxonomyMessage
} = require('../src/main/services/messageTaxonomy');
const { TaskRunner, TASK_CLASSIFICATIONS } = require('../src/main/services/taskRunner');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');

async function main() {
  assert(knownCodes().includes('LIVE_API_DISABLED'), 'taxonomy should include live API disabled');
  assert(knownCodes().includes('TASK_LOCKED'), 'taxonomy should include task locked');

  const partial = taxonomyMessage('PARTIAL_SAMPLE', 'Fixture partial sample', { source: 'verify' });
  assert(validateTaxonomyMessage(partial), 'taxonomy message should validate');
  assert(partial.severity === 'info', 'partial sample should be info severity');
  assert(partial.category === 'report', 'partial sample should be report category');

  const previous = process.env.AURA_ATLAS_LIVE_API;
  delete process.env.AURA_ATLAS_LIVE_API;

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const readiness = buildAppReadiness(db);
    assert(readiness.warnings.every(validateTaxonomyMessage), 'readiness warnings should use taxonomy shape');
    assert(readiness.warnings.some((entry) => entry.code === 'LIVE_API_DISABLED' && entry.severity === 'blocked'), 'readiness should classify live disabled as blocked');

    const gate = actionGate('manual.discovery', { scope: 'actor' });
    assert(gate.blockers.every(validateTaxonomyMessage), 'live gate blockers should use taxonomy shape');
    assert(gate.blockers.some((entry) => entry.code === 'LIVE_API_DISABLED'), 'live gate should include live disabled blocker');

    const runner = new TaskRunner();
    let release;
    const first = runner.runTask({
      type: 'evidence.fixture',
      classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      scopeKey: 'same'
    }, () => new Promise((resolve) => {
      release = () => resolve({ data: { ok: true } });
    }));
    const locked = await runner.runTask({
      type: 'evidence.fixture',
      classification: TASK_CLASSIFICATIONS.EVIDENCE_CREATING,
      scopeKey: 'same'
    }, async () => ({ data: { ok: false } }));
    assert(validateTaxonomyMessage(locked.error), 'task lock error should use taxonomy shape');
    assert(locked.error.code === 'TASK_LOCKED', 'task lock should preserve code');
    release();
    await first;
  } finally {
    closeDatabase(db);
    if (previous === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = previous;
    }
  }

  console.log('message taxonomy verified');
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
