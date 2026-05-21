const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { TopologyService } = require('../src/main/sde/topologyService');
const { planSystemRadiusWatch } = require('../src/main/workers/systemRadiusPlanner');
const { auraTempRoot, projectRoot } = require('../src/main/util/tempPaths');
const { assertProjectLocalPath } = require('./live-system-watch-runner');

async function main() {
  const tempRoot = auraTempRoot();
  process.env.AURA_ATLAS_TEST_TMP = process.env.AURA_ATLAS_TEST_TMP || tempRoot;
  process.env.AURA_ATLAS_CACHE_DIR = process.env.AURA_ATLAS_CACHE_DIR || path.join(tempRoot, 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(tempRoot, 'sde');

  assertProjectLocalPath(process.env.AURA_ATLAS_TEST_TMP, 'AURA_ATLAS_TEST_TMP');
  assertProjectLocalPath(process.env.AURA_ATLAS_CACHE_DIR, 'AURA_ATLAS_CACHE_DIR');
  assertProjectLocalPath(process.env.AURA_ATLAS_SDE_CACHE_DIR, 'AURA_ATLAS_SDE_CACHE_DIR');

  const sdePath = resolveSdePath();
  assertProjectLocalPath(sdePath, 'AURA_ATLAS_LIVE_SDE_JSONL_PATH');
  const dbPath = process.env.AURA_ATLAS_SDE_LOCAL_DB_PATH || path.join(tempRoot, 'sde-real-local.sqlite');
  assertProjectLocalPath(dbPath, 'AURA_ATLAS_SDE_LOCAL_DB_PATH');

  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }

  const db = openDatabase(dbPath);
  migrate(db);

  try {
    const importer = new SdeTopologyImporter(db);
    const importResult = await importer.importFromPath(sdePath, {
      buildNumber: buildNumberFromFilename(sdePath),
      sourceUrl: sdePath,
      tempRoot: process.env.AURA_ATLAS_SDE_CACHE_DIR
    });

    assert(importResult.systems > 0, 'expected real SDE systems to import');
    assert(importResult.constellations > 0, 'expected real SDE constellations to import');
    assert(importResult.regions > 0, 'expected real SDE regions to import');
    assert(importResult.adjacency > 0, 'expected real SDE stargate adjacency to import');

    const zts = db.prepare(`
      SELECT ss.solar_system_id, ss.solar_system_name,
             c.constellation_id, c.constellation_name,
             r.region_id, r.region_name,
             ss.security_status
      FROM solar_systems ss
      LEFT JOIN constellations c ON c.constellation_id = ss.constellation_id
      LEFT JOIN regions r ON r.region_id = ss.region_id
      WHERE lower(ss.solar_system_name) = lower(?)
    `).get('ZTS-4D');
    assert(zts, 'expected ZTS-4D to resolve from imported SDE');
    assert(zts.constellation_name === 'Mermaid', `expected ZTS-4D constellation Mermaid, got ${zts.constellation_name}`);
    assert(zts.region_name === 'Fountain', `expected ZTS-4D region Fountain, got ${zts.region_name}`);

    const topologyService = new TopologyService(db);
    const radiusZero = planSystemRadiusWatch({
      centerSystemId: zts.solar_system_id,
      radiusJumps: 0,
      lookbackSeconds: 86400,
      maxSystems: 1,
      maxRefsPerSystem: 20,
      maxExpansions: 2
    }, { topologyService });
    assert(radiusZero.includedSystems.length === 1, 'radius 0 should include one system');
    assert(radiusZero.includedSystems[0].solar_system_name === 'ZTS-4D', 'radius 0 should include ZTS-4D');

    const radiusOne = planSystemRadiusWatch({
      centerSystemId: zts.solar_system_id,
      radiusJumps: 1,
      lookbackSeconds: 86400,
      maxSystems: 50,
      maxRefsPerSystem: 20,
      maxExpansions: 2
    }, { topologyService });

    const manifest = db.prepare('SELECT * FROM sde_imports ORDER BY id DESC LIMIT 1').get();
    const counts = {
      solar_systems: count(db, 'solar_systems'),
      constellations: count(db, 'constellations'),
      regions: count(db, 'regions'),
      system_adjacency: count(db, 'system_adjacency'),
      sde_imports: count(db, 'sde_imports')
    };

    console.log(JSON.stringify({
      status: 'sde real local verified',
      project_root: projectRoot(),
      sde_path: sdePath,
      db_path: dbPath,
      zts_4d: zts,
      import_result: {
        systems: importResult.systems,
        constellations: importResult.constellations,
        regions: importResult.regions,
        adjacency: importResult.adjacency,
        file_checksum: importResult.file_checksum
      },
      table_counts: counts,
      manifest: {
        build_number: manifest.build_number,
        variant: manifest.variant,
        source_url: manifest.source_url,
        systems_count: manifest.systems_count,
        constellations_count: manifest.constellations_count,
        regions_count: manifest.regions_count,
        adjacency_count: manifest.adjacency_count
      },
      radius_0: {
        includedSystems: radiusZero.includedSystems,
        plannedZkillRequests: radiusZero.plannedZkillRequests
      },
      radius_1: {
        includedSystems: radiusOne.includedSystems,
        skippedSystems: radiusOne.skippedSystems,
        guardrailWarnings: radiusOne.guardrailWarnings,
        plannedZkillRequests: radiusOne.plannedZkillRequests.length
      }
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function resolveSdePath() {
  if (process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH) {
    return process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH;
  }

  const sdeRoot = process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(auraTempRoot(), 'sde');
  const zips = fs.existsSync(sdeRoot)
    ? fs.readdirSync(sdeRoot)
      .filter((name) => /^eve-online-static-data-.*-jsonl\.zip$/i.test(name))
      .map((name) => path.join(sdeRoot, name))
      .sort()
    : [];

  if (zips.length === 1) {
    return zips[0];
  }

  if (!zips.length) {
    throw new Error(`No JSONL SDE zip found in ${sdeRoot}; set AURA_ATLAS_LIVE_SDE_JSONL_PATH`);
  }

  throw new Error(`Multiple JSONL SDE zips found in ${sdeRoot}; set AURA_ATLAS_LIVE_SDE_JSONL_PATH`);
}

function buildNumberFromFilename(filePath) {
  const match = path.basename(filePath).match(/static-data-(\d+)-jsonl/i);
  return match ? match[1] : null;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
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
