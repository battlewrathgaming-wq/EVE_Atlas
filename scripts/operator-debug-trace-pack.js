const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { writeOperatorDebugTracePack } = require('../src/main/support/operatorDebugTracePack');

const dbPath = process.env.AURA_ATLAS_DB_PATH;
if (!dbPath) {
  throw new Error('AURA_ATLAS_DB_PATH is required for operator debug trace packs');
}

const db = openDatabase(dbPath);
migrate(db);

try {
  const result = writeOperatorDebugTracePack(db, {
    databasePath: dbPath,
    limit: Number(process.env.AURA_ATLAS_TRACE_PACK_LIMIT || 12)
  });
  console.log(JSON.stringify({
    status: 'operator debug trace pack written',
    output_path: result.output_path,
    generated_at: result.pack.generated_at,
    boundaries: result.pack.boundaries,
    exclusions: result.pack.exclusions
  }, null, 2));
} finally {
  closeDatabase(db);
}
