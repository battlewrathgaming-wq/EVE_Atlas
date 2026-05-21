const path = require('node:path');
const { openDatabase, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot, projectRoot } = require('../src/main/util/tempPaths');
const { hydrateOperatorReportCandidates } = require('../src/main/metadata/reportHydrator');

const system = process.argv[2];
if (!system) {
  console.error('Usage: npm run hydrate:report-operators -- <system name or id>');
  process.exit(1);
}

if (process.env.AURA_ATLAS_LIVE_API !== '1') {
  console.error('Refusing metadata hydration: set AURA_ATLAS_LIVE_API=1 to allow ESI calls');
  process.exit(1);
}

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
assertProjectLocalPath(dbPath, 'AURA_ATLAS_DB_PATH');

const db = openDatabase(dbPath);

hydrateOperatorReportCandidates(db, system)
  .then((summary) => {
    console.log(JSON.stringify({ db_path: dbPath, ...summary }, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    closeDatabase(db);
  });

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
