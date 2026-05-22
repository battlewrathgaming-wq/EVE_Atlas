const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { buildQueueReport } = require('../src/main/reports/queueReport');
const { resolveActorIdentity } = require('../src/main/resolution/actorResolver');

const args = process.argv.slice(2);
const type = valueFor(args, '--type');
const id = valueFor(args, '--id');
const actorType = valueFor(args, '--actor-type');
const name = valueFor(args, '--name');
const status = valueFor(args, '--status');
const limit = valueFor(args, '--limit');

const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'aura-atlas-zts-smoke.sqlite');
const db = openDatabase(dbPath);
migrate(db);

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => {
  closeDatabase(db);
});

async function run() {
  let resolvedType = type;
  let resolvedId = id;
  if (type === 'actor' && name) {
    const actor = await resolveActorIdentity(db, {
      entityType: actorType,
      entityName: name
    });
    resolvedId = actor.entity_id;
  }

  console.log(buildQueueReport(db, {
    type: resolvedType,
    id: resolvedId,
    status,
    limit: limit ? Number(limit) : 10
  }));
}

function valueFor(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}
