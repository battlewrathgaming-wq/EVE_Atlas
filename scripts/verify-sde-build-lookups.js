const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildSdeLookupTables } = require('../src/main/sde/sdeLookupBuilder');
const { buildAppReadiness } = require('../src/main/services/appReadinessService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');
const { TASK_STATES } = require('../src/main/services/taskRunner');
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
    await verifyFailedDownload(tempRoot);
    await verifyInvalidSourceFailure(tempRoot);
    await verifyExistingLookupPreservedOnRefreshFailure(tempRoot);
    await verifyInterruptedInventoryImportPreservesReadyLookups(tempRoot);
    await verifyServiceTaskFailureDiagnosticsAndRerun(tempRoot);
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

  const topologyOnly = openDatabase(':memory:');
  migrate(topologyOnly);
  seedTopologyOnly(topologyOnly);
  try {
    const readiness = buildAppReadiness(topologyOnly, { mode: 'verify' });
    assert(readiness.checks.topology_lookup_ready === true, 'topology-only DB should report topology ready');
    assert(readiness.checks.type_metadata_ready === false, 'topology-only DB should report inventory missing');
    assert(readiness.warnings.some((warning) => warning.code === 'SDE_LOOKUP_MISSING'), 'topology-only DB should produce SDE_LOOKUP_MISSING');
  } finally {
    closeDatabase(topologyOnly);
  }
}

async function verifyFailedDownload(tempRoot) {
  const db = openDatabase(':memory:');
  migrate(db);
  const cacheDir = path.join(tempRoot, 'failed-download-cache');
  const beforeEvidence = evidenceTableCounts(db);

  try {
    await assertRejects(
      () => buildSdeLookupTables(db, {
        cacheDir,
        downloadFile: async () => {
          throw new Error('fixture SDE download failed');
        }
      }),
      /fixture SDE download failed/,
      'failed official SDE download should surface the download error'
    );
    assert(!hasLookupBuildDirs(cacheDir), 'failed download should clean temporary work directory');
    assertSame(evidenceTableCounts(db), beforeEvidence, 'failed download should not mutate evidence or assessment tables');
    const readiness = buildAppReadiness(db, { mode: 'verify' });
    assert(readiness.warnings.some((warning) => warning.code === 'SDE_LOOKUP_MISSING'), 'failed download should leave lookup readiness missing');
  } finally {
    closeDatabase(db);
  }
}

async function verifyInvalidSourceFailure(tempRoot) {
  const db = openDatabase(':memory:');
  migrate(db);
  const cacheDir = path.join(tempRoot, 'invalid-source-cache');
  const invalidZip = path.join(tempRoot, 'invalid-source', 'eve-online-static-data-999999-jsonl.zip');
  fs.mkdirSync(path.dirname(invalidZip), { recursive: true });
  fs.writeFileSync(invalidZip, 'not a real zip');
  const beforeEvidence = evidenceTableCounts(db);

  try {
    await assertRejects(
      () => buildSdeLookupTables(db, {
        sourcePath: invalidZip,
        sourceUrl: 'fixture://invalid-sde.zip',
        cacheDir
      }),
      /Command failed|End of Central Directory|not a real zip|archive|SDE lookup build incomplete/i,
      'invalid source input should fail'
    );
    assert(!hasLookupBuildDirs(cacheDir), 'invalid source failure should clean temporary work directory');
    assertSame(evidenceTableCounts(db), beforeEvidence, 'invalid source failure should not mutate evidence or assessment tables');
    const readiness = buildAppReadiness(db, { mode: 'verify' });
    assert(readiness.checks.sde_lookup_ready === false, 'invalid source should not mark lookup tables ready');
  } finally {
    closeDatabase(db);
  }
}

async function verifyExistingLookupPreservedOnRefreshFailure(tempRoot) {
  const db = openDatabase(':memory:');
  migrate(db);
  const cacheDir = path.join(tempRoot, 'preserve-cache');
  const goodZip = createFixtureZip(path.join(tempRoot, 'preserve-good-source'));
  const badZip = path.join(tempRoot, 'preserve-bad-source', 'eve-online-static-data-999999-jsonl.zip');
  fs.mkdirSync(path.dirname(badZip), { recursive: true });
  fs.writeFileSync(badZip, 'not a real zip');

  try {
    await buildSdeLookupTables(db, {
      sourcePath: goodZip,
      sourceUrl: 'fixture://preserve-good.zip',
      buildNumber: 'fixture-build',
      cacheDir
    });
    const before = lookupTableCounts(db);
    const beforeEvidence = evidenceTableCounts(db);
    assert(before.sdeReady === true, 'fixture good import should establish ready lookup tables');

    await assertRejects(
      () => buildSdeLookupTables(db, {
        sourcePath: badZip,
        sourceUrl: 'fixture://preserve-bad.zip',
        cacheDir
      }),
      /Command failed|End of Central Directory|not a real zip|archive|SDE lookup build incomplete/i,
      'failed refresh should surface invalid source error'
    );

    const after = lookupTableCounts(db);
    assertSame(after, before, 'failed refresh should preserve existing lookup table counts');
    assertSame(evidenceTableCounts(db), beforeEvidence, 'failed refresh should not mutate evidence or assessment tables');
    assert(buildAppReadiness(db, { mode: 'verify' }).checks.sde_lookup_ready === true, 'failed refresh should not make existing lookups unready');
  } finally {
    closeDatabase(db);
  }
}

async function verifyInterruptedInventoryImportPreservesReadyLookups(tempRoot) {
  const db = openDatabase(':memory:');
  migrate(db);
  const cacheDir = path.join(tempRoot, 'interrupted-cache');
  const goodZip = createFixtureZip(path.join(tempRoot, 'interrupted-good-source'));

  class FailingInventoryImporter {
    importFromPath() {
      throw new Error('fixture inventory import interrupted');
    }
  }

  try {
    await buildSdeLookupTables(db, {
      sourcePath: goodZip,
      sourceUrl: 'fixture://interrupted-good.zip',
      buildNumber: 'fixture-build',
      cacheDir
    });
    const before = lookupTableCounts(db);
    const beforeEvidence = evidenceTableCounts(db);
    assert(before.sdeReady === true, 'fixture good import should establish ready lookup tables before interruption test');

    await assertRejects(
      () => buildSdeLookupTables(db, {
        sourcePath: goodZip,
        sourceUrl: 'fixture://interrupted-refresh.zip',
        buildNumber: 'fixture-build',
        cacheDir,
        InventoryImporter: FailingInventoryImporter
      }),
      /fixture inventory import interrupted/,
      'interrupted inventory import should surface clear error'
    );

    const after = lookupTableCounts(db);
    assert(after.regions >= before.regions, 'interrupted refresh should not remove regions');
    assert(after.constellations >= before.constellations, 'interrupted refresh should not remove constellations');
    assert(after.solar_systems >= before.solar_systems, 'interrupted refresh should not remove systems');
    assert(after.system_adjacency >= before.system_adjacency, 'interrupted refresh should not remove adjacency');
    assert(after.type_metadata === before.type_metadata, 'interrupted inventory refresh should not remove existing type metadata');
    assertSame(evidenceTableCounts(db), beforeEvidence, 'interrupted inventory refresh should not mutate evidence or assessment tables');
    assert(buildAppReadiness(db, { mode: 'verify' }).checks.sde_lookup_ready === true, 'interrupted refresh should preserve existing ready state');
  } finally {
    closeDatabase(db);
  }
}

async function verifyServiceTaskFailureDiagnosticsAndRerun(tempRoot) {
  const db = openDatabase(':memory:');
  migrate(db);
  const cacheDir = path.join(tempRoot, 'service-task-cache');
  const badZip = path.join(tempRoot, 'service-bad-source', 'eve-online-static-data-999999-jsonl.zip');
  const goodZip = createFixtureZip(path.join(tempRoot, 'service-good-source'));
  fs.mkdirSync(path.dirname(badZip), { recursive: true });
  fs.writeFileSync(badZip, 'not a real zip');
  const beforeLookup = lookupTableCounts(db);
  const beforeEvidence = evidenceTableCounts(db);

  try {
    const failed = await invokeServiceCommand('sde.build-lookups', {
      sourcePath: badZip,
      sourceUrl: 'fixture://service-bad-sde.zip',
      cacheDir,
      scopeKey: 'sde.build-lookups'
    }, {
      db,
      asTask: true
    });
    assert(failed.status === TASK_STATES.FAILED, 'bad SDE source service task should fail visibly');
    assert(failed.error?.message, 'failed SDE service task should retain an error message');
    assert(failed.progress.some((entry) => entry.stage === 'start'), 'failed SDE service task should retain start progress');
    assert(!hasLookupBuildDirs(cacheDir), 'failed SDE service task should clean temporary work directory');
    assertSame(lookupTableCounts(db), beforeLookup, 'failed SDE service task should not mutate lookup tables');
    assertSame(evidenceTableCounts(db), beforeEvidence, 'failed SDE service task should not mutate evidence or assessment tables');

    const taskList = await invokeServiceCommand('task.list', { limit: 8 }, { db });
    assert(taskList.some((task) => task.task_id === failed.task_id && task.status === TASK_STATES.FAILED), 'task history should retain failed SDE build task');

    const trace = await invokeServiceCommand('support.debug_trace_pack', {
      outputDir: path.join(tempRoot, 'service-sde-trace')
    }, { db });
    assert(fs.existsSync(trace.output_path), 'SDE service failure should produce reviewable support trace artifact');
    assert(trace.pack.task_history.some((task) => task.task_id === failed.task_id && task.status === TASK_STATES.FAILED), 'trace pack should include failed SDE task history');
    assert(trace.pack.exclusions.includes('SDE zip contents'), 'trace pack should state SDE source-content exclusion');
    const traceText = fs.readFileSync(trace.output_path, 'utf8');
    assert(!traceText.includes('not a real zip'), 'trace pack should not dump SDE source contents');

    const rerun = await invokeServiceCommand('sde.build-lookups', {
      sourcePath: goodZip,
      sourceUrl: 'fixture://service-good-sde.zip',
      buildNumber: 'fixture-build',
      cacheDir,
      deleteSourceAfterImport: true,
      scopeKey: 'sde.build-lookups'
    }, {
      db,
      asTask: true
    });
    assert(rerun.status === TASK_STATES.SUCCEEDED, 'explicit SDE service rerun should succeed after failure releases exclusive lock');
    assert(rerun.result.readiness.ready === true, 'explicit SDE service rerun should build ready lookup tables');
    assert(!fs.existsSync(goodZip), 'explicit successful rerun should clean disposable source');
    assertSame(evidenceTableCounts(db), beforeEvidence, 'explicit SDE service rerun should not mutate evidence or assessment tables');
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

function lookupCounts(db) {
  const counts = {
    regions: count(db, 'regions'),
    constellations: count(db, 'constellations'),
    solar_systems: count(db, 'solar_systems'),
    system_adjacency: count(db, 'system_adjacency'),
    type_metadata: count(db, 'type_metadata'),
    sde_imports: count(db, 'sde_imports'),
    sde_inventory_imports: count(db, 'sde_inventory_imports')
  };
  return {
    ...counts,
    sdeReady: counts.regions > 0 &&
      counts.constellations > 0 &&
      counts.solar_systems > 0 &&
      counts.system_adjacency > 0 &&
      counts.type_metadata > 0
  };
}

function lookupTableCounts(db) {
  const counts = {
    regions: count(db, 'regions'),
    constellations: count(db, 'constellations'),
    solar_systems: count(db, 'solar_systems'),
    system_adjacency: count(db, 'system_adjacency'),
    type_metadata: count(db, 'type_metadata')
  };
  return {
    ...counts,
    sdeReady: counts.regions > 0 &&
      counts.constellations > 0 &&
      counts.solar_systems > 0 &&
      counts.system_adjacency > 0 &&
      counts.type_metadata > 0
  };
}

function evidenceTableCounts(db) {
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

function seedTopologyOnly(db) {
  db.prepare(`
    INSERT INTO regions (region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?)
  `).run(10000001, 'Test Region', 'fixture-build', '2026-05-23T00:00:00Z');
  db.prepare(`
    INSERT INTO constellations (constellation_id, constellation_name, region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(20000001, 'Test Constellation', 10000001, 'Test Region', 'fixture-build', '2026-05-23T00:00:00Z');
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
  `).run('fixture-build', 'jsonl', 'fixture://topology-only.zip', '2026-05-23T00:00:00Z', 'checksum', 1, 1, 1, 1);
}

async function assertRejects(fn, expectedPattern, message) {
  try {
    await fn();
  } catch (error) {
    if (!expectedPattern || expectedPattern.test(String(error.message || error))) {
      return error;
    }
    throw new Error(`${message}: expected ${expectedPattern}, got ${error.message}`);
  }
  throw new Error(message);
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nBefore: ${JSON.stringify(expected)}\nAfter: ${JSON.stringify(actual)}`);
  }
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
