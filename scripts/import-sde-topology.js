const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { assertProjectLocalPath } = require('./live-system-watch-runner');

async function main() {
  const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
  const sdePath = resolveSdePath();
  const sdeTemp = process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(auraTempRoot(), 'sde');
  assertProjectLocalPath(dbPath, 'AURA_ATLAS_DB_PATH');
  assertProjectLocalPath(sdePath, 'AURA_ATLAS_LIVE_SDE_JSONL_PATH');
  assertProjectLocalPath(sdeTemp, 'AURA_ATLAS_SDE_CACHE_DIR');

  const db = openDatabase(dbPath);
  migrate(db);

  try {
    const importer = new SdeTopologyImporter(db);
    const result = await importer.importFromPath(sdePath, {
      buildNumber: buildNumberFromFilename(sdePath),
      sourceUrl: sdePath,
      tempRoot: sdeTemp
    });
    console.log(JSON.stringify({
      db_path: dbPath,
      sde_path: sdePath,
      result
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
