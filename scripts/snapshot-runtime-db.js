const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const {
  buildRuntimeDbSnapshotPreflight,
  createRuntimeDbSnapshot
} = require('../src/main/services/runtimeSnapshotService');

const args = process.argv.slice(2);
const destinationPath = valueFor(args, '--destination');
const preflightOnly = args.includes('--preflight');
const overwrite = args.includes('--overwrite');
const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-dev.sqlite');

const db = openDatabase(dbPath);
migrate(db);

try {
  const input = {
    destinationPath,
    overwrite
  };
  const context = {
    databasePath: dbPath
  };
  const result = preflightOnly
    ? buildRuntimeDbSnapshotPreflight(db, input, context)
    : createRuntimeDbSnapshot(db, input, context);
  console.log(JSON.stringify(result, null, 2));
} finally {
  closeDatabase(db);
}

function valueFor(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}
