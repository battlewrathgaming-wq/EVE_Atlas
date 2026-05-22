const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { collectActorWatch } = require('../src/main/workers/actorWatchCollector');
const { buildActorReport } = require('../src/main/reports/actorReport');
const { addWatchlistEntity } = require('../src/main/watchlist/watchlistRepository');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedSystem(db);

  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run('character', 90000002, 'Atlas Scout', '2026-05-01T20:01:00Z', '2026-05-01T20:02:00Z');
  addWatchlistEntity(db, {
    entityType: 'character',
    entityId: 90000002,
    notes: 'Actor report fixture'
  });

  const zkillClient = {
    async discoverRefs() {
      return [
        { killmail_id: 4001, hash: 'fixture_hash_4001' },
        { killmail_id: 4002, hash: 'fixture_hash_4002' },
        { killmail_id: 4003, hash: 'fixture_hash_4003' }
      ];
    }
  };
  const esiClient = {
    async expandKillmail(killmailId) {
      return {
        ...fixtureKillmail,
        killmail_id: killmailId,
        killmail_time: `2026-05-01T20:0${killmailId - 4000}:00Z`,
        solar_system_id: 30000001
      };
    }
  };

  const summary = await collectActorWatch({
    entityType: 'character',
    entityId: 90000002,
    entityName: 'Atlas Scout',
    lookbackSeconds: 86400,
    maxRefs: 3,
    maxExpansions: 2,
    trigger: 'fixture_test',
    watchId: 'actor-report-fixture'
  }, { db, zkillClient, esiClient });

  const repository = new EvidenceRepository(db);
  repository.insertApiRequestLog({
    run_id: summary.run_id,
    provider: 'zkill',
    endpoint: 'https://zkillboard.com/api/characterID/90000002/pastSeconds/86400/',
    method: 'GET',
    status_code: 200,
    duration_ms: 1,
    cache_status: 'fixture',
    requested_at: new Date().toISOString()
  });

  const report = buildActorReport(db, {
    entityType: 'character',
    entityId: 90000002
  });
  const emptyWindowReport = buildActorReport(db, {
    entityType: 'character',
    entityId: 90000002
  }, {
    evidenceStart: '2026-05-02T00:00:00Z',
    evidenceEnd: '2026-05-03T00:00:00Z'
  });

  assertIncludes(report, 'AURA Atlas Actor Evidence Report - PARTIAL SAMPLE');
  assertIncludes(report, 'Actor: Atlas Scout [characterID: 90000002]');
  assertIncludes(report, 'Evidence window: all stored evidence');
  assertIncludes(report, 'Basis: 2 expanded killmails / 2 actor activity events matching actor/time scope');
  assertIncludes(report, 'Discovery provenance window(s): 86400 seconds / 24 hours');
  assertIncludes(report, 'Stored evidence matching this scope: 2 killmails / 2 actor activity events');
  assertIncludes(report, 'Collection provenance zKill refs discovered: 3');
  assertIncludes(report, 'Collection provenance expanded new: 2');
  assertIncludes(report, 'Actor Role Split');
  assertIncludes(report, 'attacker');
  assertIncludes(report, 'Observed Systems');
  assertIncludes(report, 'Atlas Prime [solarSystemID: 30000001]');
  assertIncludes(report, 'Observed Ships');
  assertIncludes(report, 'Merlin [typeID: 603]');
  assertIncludes(report, 'Event-Time Corporations');
  assertIncludes(report, 'Signal Cartel Test [corporationID: 98000002]');
  assertIncludes(report, 'Event-Time Alliances');
  assertIncludes(report, 'Observed Operators [allianceID: 99000002]');
  assertIncludes(report, 'not proof of current location, intent, staging, ownership, or affiliation');
  assertIncludes(report, 'Source: zKill discovery + ESI expanded killmails');
  assertIncludes(emptyWindowReport, 'Evidence window: 2026-05-02T00:00:00Z -> 2026-05-03T00:00:00Z');
  assertIncludes(emptyWindowReport, 'Stored evidence matching this scope: 0 killmails / 0 actor activity events');

  closeDatabase(db);
  console.log('actor evidence report verified');
}

function seedSystem(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected actor report to include "${expected}"`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
