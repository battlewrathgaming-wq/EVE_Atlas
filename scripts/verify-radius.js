const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { TopologyService } = require('../src/main/sde/topologyService');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  const importer = new SdeTopologyImporter(db);
  await importer.importFromPath(require('node:path').resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
    buildNumber: 'fixture-build',
    sourceUrl: 'fixtures/sde-jsonl'
  });

  const topology = new TopologyService(db);

  assertSame(topology.getSystemsWithinRadius(30000001, 0), [30000001], 'radius 0 should return only center');
  assertSame(topology.getSystemsWithinRadius(30000001, 1), [30000001, 30000002, 30000003], 'radius 1 should return direct neighbors');
  assertSame(topology.getSystemsWithinRadius(30000001, 2), [30000001, 30000002, 30000003, 30000004], 'radius 2 should cross cycle and reach edge');
  assertThrows(() => topology.getSystemsWithinRadius(39999999, 1), 'Unknown center system ID', 'unknown center should fail clearly');
  assertThrows(() => topology.getSystemsWithinRadius(30000001, 6), 'exceeds guard max', 'radius guard should fail clearly');
  assertThrows(() => topology.getSystemsWithinRadius(30000001, 3, { maxSystems: 2 }), 'exceeds guard max', 'system count guard should fail clearly');

  closeDatabase(db);
  console.log('radius traversal verified');
}

function assertSame(actual, expected, message) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(`${message}: expected ${expectedText}, got ${actualText}`);
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
