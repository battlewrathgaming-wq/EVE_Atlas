const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildAppReadiness, ensureAppReady } = require('../src/main/services/appReadinessService');
const { auraTempRoot, projectRoot } = require('../src/main/util/tempPaths');

function main() {
  const previous = captureEnv();
  process.env.AURA_ATLAS_TEST_TMP = path.join(projectRoot(), '.tmp');
  process.env.AURA_ATLAS_CACHE_DIR = path.join(projectRoot(), '.tmp', 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = path.join(projectRoot(), '.tmp', 'sde');
  delete process.env.AURA_ATLAS_LIVE_API;

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const empty = buildAppReadiness(db, {
      databasePath: path.join(auraTempRoot(), 'readiness-fixture.sqlite'),
      mode: 'verify'
    });
    assert(empty.status === 'degraded', 'empty migrated DB should be degraded, not blocked');
    assert(empty.checks.db_initialized === true, 'DB should be initialized');
    assert(empty.checks.migrations_applied === true, 'migrations should be applied');
    assert(empty.checks.topology_lookup_ready === false, 'empty DB should not have topology ready');
    assert(empty.checks.type_metadata_ready === false, 'empty DB should not have type metadata ready');
    assert(empty.live_api.enabled === false, 'live API should default disabled');
    assertHasWarning(empty, 'SDE_TOPOLOGY_NOT_READY');
    assertHasWarning(empty, 'SDE_INVENTORY_NOT_READY');
    assertHasWarning(empty, 'LIVE_API_DISABLED');

    seedReadinessMetadata(db);
    process.env.AURA_ATLAS_LIVE_API = '1';
    const ready = buildAppReadiness(db, {
      databasePath: path.join(auraTempRoot(), 'readiness-fixture.sqlite'),
      mode: 'verify'
    });
    assert(ready.status === 'ready', `seeded DB should be ready, got ${ready.status}`);
    assert(ready.checks.topology_lookup_ready === true, 'topology should be ready');
    assert(ready.checks.type_metadata_ready === true, 'type metadata should be ready');
    assert(ready.live_api.enabled === true, 'live API should reflect explicit gate');
    assert(ready.sde.topology.build_number === 'fixture-build', 'topology build should be reported');
    assert(ready.sde.inventory.build_number === 'fixture-build', 'inventory build should be reported');
    ensureAppReady(ready, ['migrations_applied', 'topology_lookup_ready', 'type_metadata_ready']);

    assertThrows(() => ensureAppReady(empty, ['topology_lookup_ready']), 'missing topology should block required readiness');
  } finally {
    closeDatabase(db);
    restoreEnv(previous);
  }

  console.log('app readiness verified');
}

function seedReadinessMetadata(db) {
  db.prepare(`
    INSERT INTO regions (region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?)
  `).run(10000001, 'Test Region', 'fixture-build', '2026-05-22T00:00:00Z');
  db.prepare(`
    INSERT INTO constellations (constellation_id, constellation_name, region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(20000001, 'Test Constellation', 10000001, 'Test Region', 'fixture-build', '2026-05-22T00:00:00Z');
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
  db.prepare(`
    INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type)
    VALUES (?, ?, ?)
  `).run(30000001, 30000002, 'stargate');
  db.prepare(`
    INSERT INTO sde_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      systems_count, constellations_count, regions_count, adjacency_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-22T00:00:00Z', 'checksum', 1, 1, 1, 1);
  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(587, 'Rifter', 25, 'Frigate', 6, 'Ship', '2026-05-22T00:00:00Z');
  db.prepare(`
    INSERT INTO sde_inventory_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      categories_count, groups_count, types_count, type_metadata_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-22T00:00:00Z', 'checksum', 1, 1, 1, 1);
}

function assertHasWarning(readiness, code) {
  assert(readiness.warnings.some((entry) => entry.code === code), `Expected readiness warning ${code}`);
}

function assertThrows(fn, message) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(message);
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
