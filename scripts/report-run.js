const path = require('node:path');
const { openDatabase, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { buildRunReport } = require('../src/main/reports/runReport');

const runId = process.argv[2];
if (!runId) {
  console.error('Usage: npm run report:run -- <run_id>');
  process.exit(1);
}

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
const db = openDatabase(dbPath);

try {
  console.log(buildRunReport(db, runId));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  closeDatabase(db);
}
