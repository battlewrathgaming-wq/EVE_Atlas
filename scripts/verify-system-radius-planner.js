const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { TopologyService } = require('../src/main/sde/topologyService');
const { planSystemRadiusWatch } = require('../src/main/workers/systemRadiusPlanner');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  const importer = new SdeTopologyImporter(db);
  await importer.importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
    buildNumber: 'fixture-build',
    sourceUrl: 'fixtures/sde-jsonl'
  });

  const topologyService = new TopologyService(db);

  const radiusZero = planSystemRadiusWatch({
    centerSystemId: 30000001,
    radiusJumps: 0,
    lookbackSeconds: 86400,
    maxSystems: 10,
    maxRefsPerSystem: 10,
    maxExpansions: 50
  }, { topologyService });
  assertSame(ids(radiusZero.includedSystems), [30000001], 'radius 0 should plan one system');
  assert(radiusZero.plannedZkillRequests.length === 1, 'radius 0 should plan one zKill request');
  assert(radiusZero.plannedZkillRequests[0].route === '/systemID/30000001/pastSeconds/86400/', 'planner should use systemID pastSeconds route');
  assert(radiusZero.estimatedApiCalls.zkill === 1, 'radius 0 should estimate one zKill call');
  assert(radiusZero.estimatedApiCalls.esi === 50, 'radius 0 should estimate ESI calls from expansion budget');
  assert(radiusZero.estimatedApiCalls.metadata === 0, 'collection planner should not include metadata hydration calls');

  const radiusOne = planSystemRadiusWatch({
    centerSystemId: 30000001,
    radiusJumps: 1,
    lookbackSeconds: 604800,
    maxSystems: 10,
    maxRefsPerSystem: 5,
    maxExpansions: 20
  }, { topologyService });
  assertSame(ids(radiusOne.includedSystems), [30000001, 30000002, 30000003], 'radius 1 should plan center and neighbors');
  assert(radiusOne.plannedZkillRequests.every((request) => request.max_refs === 5), 'planner should preserve per-system ref cap');
  assert(radiusOne.plannedZkillRequests.every((request) => request.provider === 'zkill'), 'planner should only describe zKill discovery requests');
  assert(radiusOne.estimatedApiCalls.zkill === 3, 'radius 1 should estimate one zKill call per included system');
  assert(radiusOne.caps.maxExpansions === 20, 'planner should expose expansion budget');

  const capped = planSystemRadiusWatch({
    centerSystemId: 30000001,
    radiusJumps: 2,
    maxSystems: 2,
    maxRefsPerSystem: 10,
    maxExpansions: 50
  }, { topologyService });
  assert(capped.includedSystems.length === 2, 'max systems should cap included systems');
  assert(capped.skippedSystems.length === 2, 'max systems should report skipped systems');
  assert(capped.guardrailWarnings.length === 1, 'max systems should emit a guardrail warning');

  const excluded = planSystemRadiusWatch({
    centerSystemId: 30000001,
    radiusJumps: 1,
    excludedSystemIds: [30000002],
    maxSystems: 10
  }, { topologyService });
  assertSame(ids(excluded.includedSystems), [30000001, 30000003], 'excluded systems should not be planned');

  assertThrows(() => planSystemRadiusWatch({
    centerSystemId: 30000001,
    radiusJumps: 6
  }, { topologyService }), 'exceeds guard max', 'radius guard should surface from topology service');

  closeDatabase(db);
  console.log('system radius planner verified');
}

function ids(systems) {
  return systems.map((system) => system.solar_system_id).sort((a, b) => a - b);
}

function assertSame(actual, expected, message) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(`${message}: expected ${expectedText}, got ${actualText}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrows(fn, expectedMessage, message) {
  try {
    fn();
  } catch (error) {
    if (error.message.includes(expectedMessage)) {
      return;
    }
    throw new Error(`${message}: wrong error "${error.message}"`);
  }
  throw new Error(`${message}: did not throw`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
