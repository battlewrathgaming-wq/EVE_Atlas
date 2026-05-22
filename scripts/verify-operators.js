const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { collectSystemRadiusWatch } = require('../src/main/workers/systemRadiusCollector');
const { buildObservedOperatorsReport } = require('../src/main/reports/operatorReport');
const { addWatchlistEntity } = require('../src/main/watchlist/watchlistRepository');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  const importer = new SdeTopologyImporter(db);
  await importer.importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
    buildNumber: 'fixture-build',
    sourceUrl: 'fixtures/sde-jsonl'
  });

  const zkillClient = {
    async discoverRefs() {
      return [
        { killmail_id: 1001, hash: 'fixture_hash_1001' },
        { killmail_id: 1002, hash: 'fixture_hash_1002' },
        { killmail_id: 1003, hash: 'fixture_hash_1003' }
      ];
    }
  };
  const esiClient = {
    async expandKillmail(killmailId) {
      return {
        ...fixtureKillmail,
        killmail_id: killmailId,
        solar_system_id: 30000001,
        killmail_time: `2026-05-01T20:${10 + killmailId - 1001}:00Z`
      };
    }
  };

  const summary = await collectSystemRadiusWatch({
    centerSystemId: 30000001,
    radiusJumps: 0,
    lookbackSeconds: 86400,
    maxSystems: 1,
    maxRefsPerSystem: 3,
    maxExpansions: 3,
    trigger: 'fixture_test',
    watchId: 'operator-fixture'
  }, { db, zkillClient, esiClient });

  const repository = new EvidenceRepository(db);
  const eventsBeforeWatchlist = count(db, 'activity_events');
  addWatchlistEntity(db, {
    entityType: 'character',
    entityId: 90000002,
    notes: 'Promoted from observed operators fixture'
  });
  assert(count(db, 'activity_events') === eventsBeforeWatchlist, 'watchlist promotion should not mutate activity events');
  repository.insertApiRequestLog({
    run_id: summary.run_id,
    provider: 'zkill',
    endpoint: 'https://zkillboard.com/api/systemID/30000001/pastSeconds/86400/',
    method: 'GET',
    status_code: 200,
    duration_ms: 1,
    cache_status: 'fixture',
    requested_at: new Date().toISOString()
  });

  const report = buildObservedOperatorsReport(db, 'Atlas Prime');
  const emptyWindowReport = buildObservedOperatorsReport(db, 'Atlas Prime', {
    evidenceStart: '2026-05-02T00:00:00Z',
    evidenceEnd: '2026-05-03T00:00:00Z'
  });
  assertIncludes(report, 'AURA Atlas Observed Operators - COMPLETE EXPANDED SAMPLE');
  assertIncludes(report, 'Atlas Prime [solarSystemID: 30000001]');
  assertIncludes(report, 'Evidence window: all stored evidence');
  assertIncludes(report, 'Discovery provenance window(s): 86400 seconds / 24 hours');
  assertIncludes(report, 'Basis: 3 expanded killmails / 21 activity events matching system/time scope');
  assertIncludes(report, 'Stored evidence matching this scope: 3 killmails / 21 activity events');
  assertIncludes(report, 'Collection provenance may include multiple run types; observation sections are filtered by stored evidence scope.');
  assertIncludes(report, 'Signal Cartel Test [corporationID: 98000002]');
  assertIncludes(report, 'Watchlisted');
  assertIncludes(report, 'Atlas Scout [characterID: 90000002]');
  assertIncludes(report, 'yes');
  assertIncludes(report, 'repeated attacker');
  assertIncludes(report, 'not proof of staging, ownership, or affiliation');
  assertIncludes(report, 'Source: zKill discovery + ESI expanded killmails');
  assertIncludes(emptyWindowReport, 'Evidence window: 2026-05-02T00:00:00Z -> 2026-05-03T00:00:00Z');
  assertIncludes(emptyWindowReport, 'Stored evidence matching this scope: 0 killmails / 0 activity events');

  closeDatabase(db);
  console.log('observed operators report verified');
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected report to include "${expected}"`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
