const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { collectSystemRadiusWatch } = require('../src/main/workers/systemRadiusCollector');
const { buildRunReport } = require('../src/main/reports/runReport');
const { buildSystemReport } = require('../src/main/reports/systemReport');

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
      return { ...fixtureKillmail, killmail_id: killmailId, solar_system_id: 30000001 };
    }
  };

  const summary = await collectSystemRadiusWatch({
    centerSystemId: 30000001,
    radiusJumps: 0,
    lookbackSeconds: 86400,
    maxSystems: 1,
    maxRefsPerSystem: 3,
    maxExpansions: 1,
    trigger: 'fixture_test',
    watchId: 'report-fixture'
  }, { db, zkillClient, esiClient });

  const repository = new EvidenceRepository(db);
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

  const runReport = buildRunReport(db, summary.run_id);
  const systemReport = buildSystemReport(db, 'Atlas Prime');
  const emptyWindowReport = buildSystemReport(db, 'Atlas Prime', {
    evidenceStart: '2026-05-02T00:00:00Z',
    evidenceEnd: '2026-05-03T00:00:00Z'
  });

  assertIncludes(runReport, 'PARTIAL SAMPLE');
  assertIncludes(runReport, 'Atlas Prime [solarSystemID: 30000001]');
  assertIncludes(runReport, 'Discovery window: 86400 seconds / 24 hours');
  assertIncludes(runReport, 'Run status: success');
  assertIncludes(runReport, 'zKill route(s): 1');
  assertIncludes(runReport, 'Expanded sample: 1 expanded / 3 discovered refs; 0 failed');
  assertIncludes(runReport, 'Coverage note: expansion cap skipped refs; not all discovered refs are represented in this run sample');
  assertIncludes(runReport, 'Diagnostics Summary');
  assertIncludes(runReport, 'API calls by provider: zkill 1 / esi 0');
  assertIncludes(runReport, 'Systems Scanned');
  assertIncludes(runReport, 'zKill Requests');
  assertIncludes(runReport, 'ESI Requests');
  assertIncludes(runReport, 'Source: zKill discovery + ESI expanded killmails');
  assertIncludes(systemReport, 'PARTIAL SAMPLE');
  assertIncludes(systemReport, 'Atlas Prime [solarSystemID: 30000001]');
  assertIncludes(systemReport, 'Evidence window: all stored evidence');
  assertIncludes(systemReport, 'Discovery provenance window(s): 86400 seconds / 24 hours');
  assertIncludes(systemReport, 'Expanded sample: 1 stored killmails matching system/time scope');
  assertIncludes(systemReport, 'Stored evidence matching this scope: 1 killmails / 7 activity events');
  assertIncludes(systemReport, 'Collection provenance may include multiple run types; intelligence sections are filtered by stored evidence scope.');
  assertIncludes(emptyWindowReport, 'Evidence window: 2026-05-02T00:00:00Z -> 2026-05-03T00:00:00Z');
  assertIncludes(emptyWindowReport, 'Stored evidence matching this scope: 0 killmails / 0 activity events');

  closeDatabase(db);
  console.log('report scope wording verified');
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
