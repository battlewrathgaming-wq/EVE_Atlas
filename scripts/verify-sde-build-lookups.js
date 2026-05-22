const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildSdeLookupTables } = require('../src/main/sde/sdeLookupBuilder');
const { buildAppReadiness } = require('../src/main/services/appReadinessService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');
const { makeAuraTempDir, projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previous = captureEnv();
  const tempRoot = path.join(projectRoot(), '.tmp', 'verify-sde-build-lookups');
  fs.rmSync(tempRoot, { recursive: true, force: true });
  fs.mkdirSync(tempRoot, { recursive: true });
  process.env.AURA_ATLAS_TEST_TMP = tempRoot;
  process.env.AURA_ATLAS_CACHE_DIR = path.join(tempRoot, 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = path.join(tempRoot, 'sde');
  delete process.env.AURA_ATLAS_KEEP_SDE_SOURCE;

  try {
    await verifyBuildAndCleanup(tempRoot);
    await verifyKeepSource(tempRoot);
    verifyMissingReadiness();
    verifyReportsDoNotReferenceSdeSource();
    console.log('SDE lookup builder verified');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    restoreEnv(previous);
  }
}

async function verifyBuildAndCleanup(tempRoot) {
  const db = openDatabase(':memory:');
  migrate(db);
  const cacheDir = path.join(tempRoot, 'cleanup-cache');
  const fixtureZip = createFixtureZip(path.join(tempRoot, 'source-delete'));

  try {
    const result = await buildSdeLookupTables(db, {
      sourcePath: fixtureZip,
      sourceUrl: 'fixture://sde-build-lookups.zip',
      buildNumber: 'fixture-build',
      etag: 'fixture-etag',
      lastModified: 'Thu, 21 May 2026 00:00:00 GMT',
      cacheDir,
      deleteSourceAfterImport: true
    });

    assert(result.readiness.ready === true, 'lookup builder should report ready lookup tables');
    assert(result.cleanup.source_removed === true, 'cleanup should report source removal for disposable source');
    assert(!fs.existsSync(fixtureZip), 'disposable source zip should be removed after successful import');
    assert(!hasLookupBuildDirs(cacheDir), 'temporary extraction/build directories should be removed');

    assert(count(db, 'regions') === 1, 'regions table should be populated');
    assert(count(db, 'constellations') === 1, 'constellations table should be populated');
    assert(count(db, 'solar_systems') === 4, 'solar_systems table should be populated');
    assert(count(db, 'system_adjacency') === 8, 'system_adjacency table should be populated');
    assert(count(db, 'type_metadata') === 2, 'type_metadata table should be populated with published types');

    const rifter = db.prepare('SELECT * FROM ship_types WHERE type_id = ?').get(587);
    assert(rifter?.type_name === 'Rifter', 'ship_types view should expose Rifter');
    assert(rifter.group_name === 'Frigate', 'ship_types view should include group name');
    assert(rifter.category_name === 'Ship', 'ship_types view should include Ship category');

    const topologyManifest = db.prepare('SELECT * FROM sde_imports ORDER BY id DESC LIMIT 1').get();
    const inventoryManifest = db.prepare('SELECT * FROM sde_inventory_imports ORDER BY id DESC LIMIT 1').get();
    assert(topologyManifest.source_url === 'fixture://sde-build-lookups.zip', 'topology provenance should record source URL');
    assert(topologyManifest.etag === 'fixture-etag', 'topology provenance should record ETag');
    assert(topologyManifest.last_modified === 'Thu, 21 May 2026 00:00:00 GMT', 'topology provenance should record Last-Modified');
    assert(inventoryManifest.source_url === 'fixture://sde-build-lookups.zip', 'inventory provenance should record source URL');
    assert(inventoryManifest.etag === 'fixture-etag', 'inventory provenance should record ETag');
    assert(inventoryManifest.last_modified === 'Thu, 21 May 2026 00:00:00 GMT', 'inventory provenance should record Last-Modified');

    const serviceDb = openDatabase(':memory:');
    migrate(serviceDb);
    const serviceZip = createFixtureZip(path.join(tempRoot, 'service-source-delete'));
    try {
      const serviceResult = await invokeServiceCommand('sde.build-lookups', {
        sourcePath: serviceZip,
        sourceUrl: 'fixture://service-sde-build-lookups.zip',
        buildNumber: 'fixture-build',
        cacheDir: path.join(tempRoot, 'service-cache'),
        deleteSourceAfterImport: true
      }, { db: serviceDb });
      assert(serviceResult.readiness.ready === true, 'sde.build-lookups service should build lookup tables');
      assert(!fs.existsSync(serviceZip), 'service command should honor disposable source cleanup');
    } finally {
      closeDatabase(serviceDb);
    }
  } finally {
    closeDatabase(db);
  }
}

async function verifyKeepSource(tempRoot) {
  const db = openDatabase(':memory:');
  migrate(db);
  const cacheDir = path.join(tempRoot, 'keep-cache');
  const fixtureZip = createFixtureZip(path.join(tempRoot, 'source-keep'));

  try {
    const result = await buildSdeLookupTables(db, {
      sourcePath: fixtureZip,
      sourceUrl: 'fixture://sde-build-lookups-keep.zip',
      buildNumber: 'fixture-build',
      cacheDir,
      keepSource: true,
      deleteSourceAfterImport: true
    });

    assert(result.cleanup.keep_source === true, 'keepSource should be reported');
    assert(fs.existsSync(fixtureZip), 'keepSource should preserve source zip');
    assert(fs.existsSync(result.cleanup.work_dir), 'keepSource should preserve temporary work directory for debugging');
  } finally {
    closeDatabase(db);
  }
}

function verifyMissingReadiness() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const readiness = buildAppReadiness(db, { mode: 'verify' });
    assert(readiness.checks.sde_lookup_ready === false, 'empty DB should not be SDE lookup ready');
    assert(readiness.warnings.some((warning) => warning.code === 'SDE_LOOKUP_MISSING'), 'missing lookup tables should produce SDE_LOOKUP_MISSING');
  } finally {
    closeDatabase(db);
  }
}

function verifyReportsDoNotReferenceSdeSource() {
  const reportDir = path.join(projectRoot(), 'src', 'main', 'reports');
  const scriptsDir = path.join(projectRoot(), 'scripts');
  const forbidden = [
    'sdeLookupBuilder',
    'SdeTopologyImporter',
    'SdeInventoryImporter',
    'AURA_ATLAS_LIVE_SDE_JSONL_PATH',
    '.zip'
  ];
  const files = [
    ...walk(reportDir).filter((filePath) => filePath.endsWith('.js')),
    ...walk(scriptsDir).filter((filePath) => /^report-.*\.js$/i.test(path.basename(filePath)))
  ];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const token of forbidden) {
      assert(!content.includes(token), `${path.relative(projectRoot(), filePath)} should not reference SDE source token ${token}`);
    }
  }
}

function createFixtureZip(targetDir) {
  const sourceDir = path.join(targetDir, 'source');
  const fixtureRoot = path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl');
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(sourceDir, { recursive: true });
  for (const fileName of fs.readdirSync(fixtureRoot)) {
    fs.copyFileSync(path.join(fixtureRoot, fileName), path.join(sourceDir, fileName));
  }
  fs.writeFileSync(path.join(sourceDir, 'categories.jsonl'), [
    JSON.stringify({ _key: 6, _value: { categoryID: 6, name: 'Ship', published: true } }),
    JSON.stringify({ _key: 7, _value: { categoryID: 7, name: 'Module', published: true } })
  ].join('\n'));
  fs.writeFileSync(path.join(sourceDir, 'groups.jsonl'), [
    JSON.stringify({ _key: 25, _value: { groupID: 25, name: 'Frigate', categoryID: 6, published: true } }),
    JSON.stringify({ _key: 53, _value: { groupID: 53, name: 'Laser Weapon', categoryID: 7, published: true } })
  ].join('\n'));
  fs.writeFileSync(path.join(sourceDir, 'types.jsonl'), [
    JSON.stringify({ _key: 587, _value: { typeID: 587, name: 'Rifter', groupID: 25, published: true } }),
    JSON.stringify({ _key: 643, _value: { typeID: 643, name: 'Armageddon', groupID: 25, published: true } }),
    JSON.stringify({ _key: 2000, _value: { typeID: 2000, name: 'Unpublished Test Type', groupID: 25, published: false } })
  ].join('\n'));

  const zipPath = path.join(targetDir, 'fixture-sde-jsonl.zip');
  const command = [
    'Compress-Archive',
    '-Path',
    powershellQuote(path.join(sourceDir, '*')),
    '-DestinationPath',
    powershellQuote(zipPath),
    '-Force'
  ].join(' ');
  childProcess.execFileSync('powershell.exe', ['-NoProfile', '-Command', command], { stdio: 'pipe' });
  return zipPath;
}

function hasLookupBuildDirs(cacheDir) {
  if (!fs.existsSync(cacheDir)) {
    return false;
  }
  return fs.readdirSync(cacheDir).some((entry) => entry.startsWith('lookup-build-'));
}

function walk(root) {
  if (!fs.existsSync(root)) {
    return [];
  }
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function captureEnv() {
  return {
    AURA_ATLAS_TEST_TMP: process.env.AURA_ATLAS_TEST_TMP,
    AURA_ATLAS_CACHE_DIR: process.env.AURA_ATLAS_CACHE_DIR,
    AURA_ATLAS_SDE_CACHE_DIR: process.env.AURA_ATLAS_SDE_CACHE_DIR,
    AURA_ATLAS_KEEP_SDE_SOURCE: process.env.AURA_ATLAS_KEEP_SDE_SOURCE
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

function powershellQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
