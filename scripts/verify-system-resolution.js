const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { resolveSystemIdentity } = require('../src/main/resolution/systemResolver');
const { buildZkillDiscoveryEndpoint } = require('../src/main/api/zkillClient');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    await new SdeTopologyImporter(db).importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
      buildNumber: 'fixture-build',
      sourceUrl: 'fixtures/sde-jsonl'
    });

    const byName = resolveSystemIdentity(db, { systemName: 'Atlas Prime' });
    assert(byName.solar_system_id === 30000001, 'system name should resolve from local topology');
    assert(byName.region_name === 'Test Region', 'system resolver should expose region label');
    assert(byName.source === 'local_sde_topology', 'system resolver should declare local SDE source');

    const byId = resolveSystemIdentity(db, { systemId: 30000002 });
    assert(byId.solar_system_name === 'Atlas Gate', 'system ID should resolve from local topology');

    assertThrows(() => resolveSystemIdentity(db, { systemName: 'Not A System' }), 'was not found in local SDE topology');
    assertThrows(() => resolveSystemIdentity(db, { systemId: 'abc' }), 'positive integer');

    const endpoint = buildZkillDiscoveryEndpoint({
      targetType: 'system',
      targetId: byName.solar_system_id,
      pastSeconds: 86400
    });
    assert(endpoint === 'https://zkillboard.com/api/systemID/30000001/pastSeconds/86400/', 'system route should use scoped systemID/pastSeconds endpoint');

    closeDatabase(db);
    console.log('local system resolver verified');
  } catch (error) {
    closeDatabase(db);
    throw error;
  }
}

function assertThrows(fn, expected) {
  try {
    fn();
  } catch (error) {
    assert(error.message.includes(expected), `expected error to include "${expected}", got "${error.message}"`);
    return;
  }
  throw new Error(`expected function to throw "${expected}"`);
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
