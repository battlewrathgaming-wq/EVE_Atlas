const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const { openDatabase, migrate, closeDatabase, initializeRuntimeDatabase } = require('../src/main/db/database');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { makeAuraTempDir, auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  verifyRuntimeDbOverride();

  const db = openDatabase(':memory:');
  migrate(db);
  migrate(db);

  const importer = new SdeTopologyImporter(db);
  const fixtureZip = createFixtureZip();

  const first = await importer.importFromPath(fixtureZip, {
    buildNumber: 'fixture-build',
    sourceUrl: fixtureZip,
    etag: 'fixture-etag',
    lastModified: 'Thu, 21 May 2026 00:00:00 GMT',
    latestMetadataChecksum: 'fixture-latest',
    changesMetadataChecksum: 'fixture-changes',
    tempRoot: auraTempRoot()
  });
  const second = await importer.importFromPath(fixtureZip, {
    buildNumber: 'fixture-build',
    sourceUrl: fixtureZip,
    tempRoot: auraTempRoot()
  });

  assert(first.systems === 4, 'expected 4 systems imported from fixture');
  assert(first.constellations === 1, 'expected 1 constellation imported from fixture');
  assert(first.regions === 1, 'expected 1 region imported from fixture');
  assert(first.adjacency === 8, 'expected 8 directional adjacency rows from 4 stargates');
  assert(second.adjacency === 8, 'repeated rewrite should stage the complete adjacency set');
  assert(first.staged === true && second.staged === true, 'SDE topology imports should stage before promotion');
  assert(first.promotion?.transactional === true, 'SDE topology import should promote transactionally');
  assert(first.promotion?.provenance_written_after_complete_promotion === true, 'SDE topology import should write provenance after promotion');
  assert(count(db, 'solar_systems') === 4, 'solar_systems should remain idempotent');
  assert(count(db, 'regions') === 1, 'regions should remain idempotent');
  assert(count(db, 'constellations') === 1, 'constellations should remain idempotent');
  assert(count(db, 'system_adjacency') === 8, 'system_adjacency should remain idempotent');
  assert(count(db, 'sde_imports') === 2, 'each import should record provenance');
  assert(count(db, 'schema_migrations') === 1, 'migration should be repeatable');

  const sampleSystem = db.prepare('SELECT * FROM solar_systems WHERE solar_system_id = ?').get(30000001);
  assert(sampleSystem.region_name === 'Test Region', 'system should be enriched with region name');
  assert(sampleSystem.constellation_name === 'Test Constellation', 'system should be enriched with constellation name');
  const sampleConstellation = db.prepare('SELECT * FROM constellations WHERE constellation_id = ?').get(20000001);
  const sampleRegion = db.prepare('SELECT * FROM regions WHERE region_id = ?').get(10000001);
  assert(sampleConstellation.constellation_name === 'Test Constellation', 'constellation lookup should be populated');
  assert(sampleConstellation.region_name === 'Test Region', 'constellation lookup should include region name');
  assert(sampleRegion.region_name === 'Test Region', 'region lookup should be populated');

  fs.rmSync(path.dirname(fixtureZip), { recursive: true, force: true });
  closeDatabase(db);
  console.log('SDE fixture import verified');
}

function verifyRuntimeDbOverride() {
  const tempDir = makeAuraTempDir('db');
  const previous = process.env.AURA_ATLAS_DB_PATH;
  const dbPath = path.join(tempDir, 'runtime.sqlite');
  process.env.AURA_ATLAS_DB_PATH = dbPath;
  const runtime = initializeRuntimeDatabase();
  closeDatabase(runtime.db);
  assert(fs.existsSync(dbPath), 'runtime DB override should create a temp DB');
  fs.rmSync(tempDir, { recursive: true, force: true });
  if (previous === undefined) {
    delete process.env.AURA_ATLAS_DB_PATH;
  } else {
    process.env.AURA_ATLAS_DB_PATH = previous;
  }
}

function createFixtureZip() {
  const source = path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl');
  const tempDir = makeAuraTempDir('sde-fixture');
  const zipPath = path.join(tempDir, 'sde-fixture-jsonl.zip');
  const command = [
    'Compress-Archive',
    '-Path',
    powershellQuote(path.join(source, '*')),
    '-DestinationPath',
    powershellQuote(zipPath),
    '-Force'
  ].join(' ');
  childProcess.execFileSync('powershell.exe', ['-NoProfile', '-Command', command], { stdio: 'pipe' });
  return zipPath;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function powershellQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
