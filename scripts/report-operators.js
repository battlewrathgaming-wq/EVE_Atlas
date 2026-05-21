const path = require('node:path');
const { openDatabase, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { buildObservedOperatorsReport } = require('../src/main/reports/operatorReport');

const args = process.argv.slice(2);
const positional = args.filter((arg) => !arg.startsWith('--'));
const system = valueFor(args, '--system') || positional[0];
const lookbackSeconds = valueFor(args, '--lookback');
const evidenceStart = valueFor(args, '--start');
const evidenceEnd = valueFor(args, '--end');
if (!system) {
  console.error('Usage: npm run report:operators -- <system name or id> [--lookback seconds] [--start iso] [--end iso]');
  process.exit(1);
}

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
const db = openDatabase(dbPath);

try {
  console.log(buildObservedOperatorsReport(db, system, {
    lookbackSeconds: lookbackSeconds ? Number(lookbackSeconds) : null,
    evidenceStart,
    evidenceEnd
  }));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  closeDatabase(db);
}

function valueFor(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}
