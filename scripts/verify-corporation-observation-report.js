const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { collectActorWatch } = require('../src/main/workers/actorWatchCollector');
const { buildCorporationObservationReport } = require('../src/main/reports/corporationObservationReport');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedSystem(db);
  seedCorporation(db);

  const zkillClient = {
    async discoverRefs() {
      return [
        { killmail_id: 5001, hash: 'fixture_hash_5001' },
        { killmail_id: 5002, hash: 'fixture_hash_5002' },
        { killmail_id: 5003, hash: 'fixture_hash_5003' }
      ];
    }
  };
  const esiClient = {
    async expandKillmail(killmailId) {
      return {
        ...fixtureKillmail,
        killmail_id: killmailId,
        killmail_time: `2026-05-01T21:0${killmailId - 5000}:00Z`,
        solar_system_id: 30000001
      };
    }
  };

  const summary = await collectActorWatch({
    entityType: 'corporation',
    entityId: 98000002,
    entityName: 'Signal Cartel Test',
    lookbackSeconds: 86400,
    maxRefs: 3,
    maxExpansions: 3,
    trigger: 'fixture_test',
    watchId: 'actor:corporation:98000002'
  }, { db, zkillClient, esiClient });

  const repository = new EvidenceRepository(db);
  repository.insertApiRequestLog({
    run_id: summary.run_id,
    provider: 'zkill',
    endpoint: 'https://zkillboard.com/api/corporationID/98000002/pastSeconds/86400/',
    method: 'GET',
    status_code: 200,
    duration_ms: 1,
    cache_status: 'fixture',
    requested_at: new Date().toISOString()
  });

  const report = buildCorporationObservationReport(db, {
    entityId: 98000002,
    entityName: 'Signal Cartel Test'
  });
  const emptyWindowReport = buildCorporationObservationReport(db, {
    entityId: 98000002,
    entityName: 'Signal Cartel Test'
  }, {
    evidenceStart: '2026-05-02T00:00:00Z',
    evidenceEnd: '2026-05-03T00:00:00Z'
  });

  assertIncludes(report, 'AURA Atlas Corporation Observation Report - COMPLETE EXPANDED SAMPLE');
  assertIncludes(report, 'Corporation: Signal Cartel Test [corporationID: 98000002]');
  assertIncludes(report, 'Basis: 3 expanded killmails / 3 corporation activity events matching corporation/time scope');
  assertIncludes(report, 'Evidence Basis');
  assertIncludes(report, 'Collection Provenance');
  assertIncludes(report, 'Event-time member pilot rows in scope: 6');
  assertIncludes(report, 'Observation sections are filtered by stored evidence scope');
  assertIncludes(report, 'Corporation Role Split');
  assertIncludes(report, 'Observed Systems');
  assertIncludes(report, 'Atlas Prime [solarSystemID: 30000001]');
  assertIncludes(report, 'Observed Member Pilots');
  assertIncludes(report, 'Atlas Scout [characterID: 90000002]');
  assertIncludes(report, 'Atlas Wing [characterID: 90000003]');
  assertIncludes(report, 'Final Blows');
  assertIncludes(report, 'Damage');
  assertIncludes(report, 'Observed Final Blows');
  assertIncludes(report, 'Observed Ships');
  assertIncludes(report, 'Merlin [typeID: 603]');
  assertIncludes(report, 'Kestrel [typeID: 602]');
  assertIncludes(report, 'Observed Regions');
  assertIncludes(report, 'Observed Activity Cadence');
  assertIncludes(report, 'Fri 21:00');
  assertIncludes(report, 'Observed Counterpart Corporations');
  assertIncludes(report, 'Victim Logistics [corporationID: 98000001]');
  assertIncludes(report, 'Observed Counterpart Alliances');
  assertIncludes(report, 'Quiet Coalition [allianceID: 99000001]');
  assertIncludes(report, 'Recent Timeline');
  assertIncludes(report, 'Aggressor Detail');
  assertIncludes(report, 'final blow, damage');
  assertIncludes(report, 'does not assess intent, affiliation, staging, ownership, or threat');
  assertIncludes(emptyWindowReport, 'Stored evidence matching this scope: 0 killmails / 0 corporation activity events');

  closeDatabase(db);
  console.log('corporation observation report verified');
}

function seedSystem(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
}

function seedCorporation(db) {
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run('corporation', 98000002, 'Signal Cartel Test', '2026-05-01T21:01:00Z', '2026-05-01T21:03:00Z');
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected corporation observation report to include "${expected}"`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
