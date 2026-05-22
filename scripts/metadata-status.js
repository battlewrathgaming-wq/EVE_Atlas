const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { buildMetadataStatusReport } = require('../src/main/reports/metadataStatusReport');

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
const db = openDatabase(dbPath);
migrate(db);

try {
  console.log(buildMetadataStatusReport(db));
  console.log(`\nDB: ${dbPath}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  closeDatabase(db);
}
