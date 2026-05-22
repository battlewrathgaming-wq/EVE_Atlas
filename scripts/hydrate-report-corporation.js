const path = require('node:path');
const { openDatabase, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot, projectRoot } = require('../src/main/util/tempPaths');
const { resolveActorIdentity } = require('../src/main/resolution/actorResolver');
const { hydrateCorporationReportCandidates } = require('../src/main/metadata/reportHydrator');

const args = process.argv.slice(2);
const entityId = valueFor(args, '--id');
const entityName = valueFor(args, '--name');
const topN = valueFor(args, '--top');
const threshold = valueFor(args, '--threshold');

if (!entityId && !entityName) {
  console.error('Usage: npm run hydrate:report-corporation -- (--id <id> | --name <name>) [--top N] [--threshold N]');
  process.exit(1);
}

if (process.env.AURA_ATLAS_LIVE_API !== '1') {
  console.error('Refusing metadata hydration: set AURA_ATLAS_LIVE_API=1 to allow ESI calls');
  process.exit(1);
}

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
assertProjectLocalPath(dbPath, 'AURA_ATLAS_DB_PATH');
const db = openDatabase(dbPath);

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => {
  closeDatabase(db);
});

async function run() {
  const corporation = await resolveActorIdentity(db, {
    entityType: 'corporation',
    entityId,
    entityName
  });
  const summary = await hydrateCorporationReportCandidates(db, {
    entityId: corporation.entity_id,
    entityName: corporation.entity_name
  }, {
    topN: topN ? Number(topN) : 25,
    threshold: threshold ? Number(threshold) : 1
  });
  console.log(JSON.stringify({ db_path: dbPath, ...summary }, null, 2));
}

function assertProjectLocalPath(targetPath, label) {
  const allowExternal = process.env.AURA_ATLAS_ALLOW_EXTERNAL_PATHS === '1';
  const resolvedTarget = path.resolve(targetPath);
  const resolvedProject = projectRoot();
  const relative = path.relative(resolvedProject, resolvedTarget);
  const isInsideProject = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));

  if (!isInsideProject && !allowExternal) {
    throw new Error(`${label} must stay under ${resolvedProject}; set AURA_ATLAS_ALLOW_EXTERNAL_PATHS=1 to override`);
  }
}

function valueFor(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}
