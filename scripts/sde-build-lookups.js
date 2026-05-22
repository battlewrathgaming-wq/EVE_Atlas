const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildSdeLookupTables } = require('../src/main/sde/sdeLookupBuilder');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-dev.sqlite');
  const db = openDatabase(dbPath);
  migrate(db);

  try {
    const result = await buildSdeLookupTables(db, {
      sourcePath: process.env.AURA_ATLAS_SDE_SOURCE_PATH || process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH || null,
      cacheDir: process.env.AURA_ATLAS_SDE_CACHE_DIR || path.join(auraTempRoot(), 'sde'),
      keepSource: process.env.AURA_ATLAS_KEEP_SDE_SOURCE === '1'
    });
    console.log(JSON.stringify({
      db_path: dbPath,
      ...result
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
