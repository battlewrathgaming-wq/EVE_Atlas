const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { buildCorpusHealthReport } = require('../src/main/reports/corpusHealthReport');

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-dev.sqlite');
const db = openDatabase(dbPath);
migrate(db);

try {
  console.log(buildCorpusHealthReport(db));
} finally {
  closeDatabase(db);
}
