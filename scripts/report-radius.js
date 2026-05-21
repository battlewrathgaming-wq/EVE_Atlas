const path = require('node:path');
const { openDatabase, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { buildRadiusReport } = require('../src/main/reports/radiusReport');

const args = process.argv.slice(2);
const positional = args.filter((arg) => !arg.startsWith('--'));
const center = valueFor(args, '--center') || positional[0];
const radius = valueFor(args, '--radius') || positional[1] || '0';
const lookbackSeconds = valueFor(args, '--lookback');
const evidenceStart = valueFor(args, '--start');
const evidenceEnd = valueFor(args, '--end');

if (!center) {
  console.error('Usage: npm run report:radius -- <center system name or id> --radius <jumps> [--lookback seconds] [--start iso] [--end iso]');
  process.exit(1);
}

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
const db = openDatabase(dbPath);

try {
  console.log(buildRadiusReport(db, center, {
    radiusJumps: Number(radius),
    lookbackSeconds: lookbackSeconds ? Number(lookbackSeconds) : null,
    evidenceStart,
    evidenceEnd,
    maxRadius: Number(process.env.AURA_ATLAS_REPORT_MAX_RADIUS || 5),
    maxSystems: Number(process.env.AURA_ATLAS_REPORT_MAX_TOPOLOGY_SYSTEMS || 100)
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
