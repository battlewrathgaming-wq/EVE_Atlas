const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { collectActorWatch } = require('../src/main/workers/actorWatchCollector');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');
const { buildActorReport } = require('../src/main/reports/actorReport');
const { buildRunReport } = require('../src/main/reports/runReport');
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
  const repository = new EvidenceRepository(db);
  persistSystemDiscoveredKillmail(db, repository);

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
  const runReport = buildRunReport(db, summary.run_id);
  const cachedSummary = await collectActorWatch({
    entityType: 'character',
    entityId: 90000002,
    entityName: 'Atlas Scout',
    lookbackSeconds: 86400,
    maxRefs: 2,
    maxExpansions: 2,
    trigger: 'fixture_test',
    watchId: 'actor:character:90000002'
  }, {
    db,
    zkillClient: {
      async discoverRefs() {
        return [
          { killmail_id: 4001, hash: 'fixture_hash_4001' },
          { killmail_id: 4002, hash: 'fixture_hash_4002' }
        ];
      }
    },
    esiClient: {
      async expandKillmail(killmailId) {
        return {
          ...fixtureKillmail,
          killmail_id: killmailId,
          killmail_time: `2026-05-01T20:0${killmailId - 4000}:00Z`,
          solar_system_id: 30000001
        };
      }
    }
  });
  const cachedRunReport = buildRunReport(db, cachedSummary.run_id);
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
  assertIncludes(report, 'Basis: 3 expanded killmails / 3 actor activity events matching actor/time scope');
  assertIncludes(report, 'Actor discovery window(s): 86400 seconds / 24 hours');
  assertIncludes(report, 'Stored evidence matching this scope: 3 killmails / 3 actor activity events');
  assertIncludes(report, 'Collection provenance zKill requests: 2');
  assertIncludes(report, 'Actor-route zKill requests: 1');
  assertIncludes(report, 'Collection provenance zKill refs discovered: 4');
  assertIncludes(report, 'Collection provenance expanded new: 3');
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
  assertIncludes(runReport, 'Watch: actor / actor-report-fixture');
  assertIncludes(runReport, 'Collection target: Atlas Scout [characterID: 90000002]');
  assertIncludes(runReport, 'First zKill actor: Atlas Scout [characterID: 90000002]');
  assertIncludes(runReport, 'Collection Routes');
  assertIncludes(runReport, 'character');
  assertIncludes(runReport, 'Atlas Scout [characterID: 90000002]');
  assertIncludes(runReport, 'Discovery Queue State');
  assertIncludes(runReport, 'Scope: actor:90000002');
  assertIncludes(runReport, 'Queued refs for scope: 3');
  assertIncludes(runReport, 'Pending refs after run: 1');
  assertIncludes(cachedRunReport, 'AURA Atlas Run Report - PENDING REF EXPANSION');
  assertIncludes(cachedRunReport, 'Collection target: Atlas Scout [characterID: 90000002]');
  assertIncludes(cachedRunReport, 'zKill requests: 0');
  assertIncludes(cachedRunReport, 'New ESI expansions: 1');
  assertIncludes(cachedRunReport, 'Coverage note: expanded refs from local pending discovery queue; no live zKill discovery was needed for this run');
  assertIncludes(cachedRunReport, 'Queued refs for scope: 3');
  assertIncludes(cachedRunReport, 'Pending refs after run: 0');
  assertIncludes(emptyWindowReport, 'Evidence window: 2026-05-02T00:00:00Z -> 2026-05-03T00:00:00Z');
  assertIncludes(emptyWindowReport, 'Stored evidence matching this scope: 0 killmails / 0 actor activity events');

  closeDatabase(db);
  console.log('actor evidence report verified');
}

function persistSystemDiscoveredKillmail(db, repository) {
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'system_radius',
    watchId: 'system-report-fixture'
  });
  const packageToPersist = evidencePackageFromExpandedKillmails({
    killmails: [{
      raw: {
        ...fixtureKillmail,
        killmail_id: 3999,
        killmail_time: '2026-05-01T19:59:00Z',
        solar_system_id: 30000001
      },
      hash: 'fixture_hash_3999'
    }],
    run: {
      run_id: run.run_id,
      source_type: 'system_radius',
      source_id: '30000001:0',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'system_radius',
      id: 30000001
    }
  });
  const result = repository.persistEvidencePackage(packageToPersist);
  repository.insertApiRequestLog({
    run_id: run.run_id,
    provider: 'zkill',
    endpoint: 'https://zkillboard.com/api/systemID/30000001/pastSeconds/86400/',
    method: 'GET',
    status_code: 200,
    duration_ms: 1,
    cache_status: 'fixture',
    requested_at: new Date().toISOString()
  });
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: 1,
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten
  }, 'success', null);
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
