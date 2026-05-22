const { openDatabase, closeDatabase } = require('../src/main/db/database');
const { runLiveActorWatch } = require('./live-actor-watch-runner');
const { buildRunReport } = require('../src/main/reports/runReport');
const { buildActorReport } = require('../src/main/reports/actorReport');
const { buildQueueReport } = require('../src/main/reports/queueReport');

async function main() {
  assertSmokeInput();
  const first = await runLiveActorWatch();
  const second = await runLiveActorWatch();
  const actor = second.first.actor || first.first.actor;
  const db = openDatabase(second.db_path);

  try {
    printJsonSection('First Run Preflight', first.preflight);
    printJsonSection('First Run Summary', first.first);
    printSection('First Run Diagnostics', buildRunReport(db, first.first.run_id));
    printJsonSection('Second Run Preflight', second.preflight);
    printJsonSection('Second Run Summary', second.first);
    printSection('Second Run Diagnostics', buildRunReport(db, second.first.run_id));
    printSection('Actor Evidence Report', buildActorReport(db, {
      entityType: actor.entity_type,
      entityId: actor.entity_id,
      entityName: actor.entity_name
    }));
    printSection('Actor Discovery Queue Report', buildQueueReport(db, {
      type: 'actor',
      id: actor.entity_id,
      limit: 10
    }));
    printSection('Smoke Integrity', [
      `DB: ${second.db_path}`,
      `Actor: ${actor.entity_name || 'unresolved'} [${actor.entity_type}ID: ${actor.entity_id}]`,
      `Run IDs: ${first.first.run_id}, ${second.first.run_id}`,
      `Duplicate activity event keys: ${duplicateEventKeyCount(db)}`,
      `Total stored killmails: ${count(db, 'killmails')}`,
      `Total activity events: ${count(db, 'activity_events')}`,
      `Total discovery refs: ${count(db, 'discovered_killmail_refs')}`
    ].join('\n'));
  } finally {
    closeDatabase(db);
  }
}

function assertSmokeInput() {
  if (process.env.AURA_ATLAS_LIVE_API !== '1') {
    throw new Error('Refusing live actor workflow smoke: set AURA_ATLAS_LIVE_API=1');
  }
  if (!process.env.AURA_ATLAS_LIVE_ACTOR_TYPE) {
    throw new Error('AURA_ATLAS_LIVE_ACTOR_TYPE is required for live actor workflow smoke');
  }
  if (!process.env.AURA_ATLAS_LIVE_ACTOR_ID && !process.env.AURA_ATLAS_LIVE_ACTOR_NAME) {
    throw new Error('AURA_ATLAS_LIVE_ACTOR_ID or AURA_ATLAS_LIVE_ACTOR_NAME is required for live actor workflow smoke');
  }
}

function printJsonSection(title, value) {
  printSection(title, JSON.stringify(value, null, 2));
}

function printSection(title, body) {
  console.log(`\n=== ${title} ===`);
  console.log(body);
}

function duplicateEventKeyCount(db) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM (
      SELECT event_key
      FROM activity_events
      GROUP BY event_key
      HAVING COUNT(*) > 1
    )
  `).get().count;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
