const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { collectSystemRadiusWatch } = require('../src/main/workers/systemRadiusCollector');
const { buildRadiusReport } = require('../src/main/reports/radiusReport');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  const importer = new SdeTopologyImporter(db);
  await importer.importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
    buildNumber: 'fixture-build',
    sourceUrl: 'fixtures/sde-jsonl'
  });

  const refsBySystem = new Map([
    [30000001, [{ killmail_id: 2001, hash: 'fixture_hash_2001' }]],
    [30000002, [{ killmail_id: 2002, hash: 'fixture_hash_2002' }]],
    [30000003, [{ killmail_id: 2003, hash: 'fixture_hash_2003' }]]
  ]);
  const systemByKillmail = new Map([
    [2001, 30000001],
    [2002, 30000002],
    [2003, 30000003]
  ]);

  const zkillClient = {
    async discoverRefs({ targetId }) {
      return refsBySystem.get(targetId) || [];
    }
  };
  const esiClient = {
    async expandKillmail(killmailId) {
      return {
        ...fixtureKillmail,
        killmail_id: killmailId,
        killmail_time: `2026-05-01T20:${killmailId - 2000}5:00Z`,
        solar_system_id: systemByKillmail.get(killmailId)
      };
    }
  };

  const summary = await collectSystemRadiusWatch({
    centerSystemId: 30000001,
    radiusJumps: 1,
    lookbackSeconds: 86400,
    maxSystems: 3,
    maxRefsPerSystem: 1,
    maxExpansions: 2,
    trigger: 'fixture_test',
    watchId: 'radius-report-fixture'
  }, { db, zkillClient, esiClient });

  const repository = new EvidenceRepository(db);
  for (const systemId of [30000001, 30000002, 30000003]) {
    repository.insertApiRequestLog({
      run_id: summary.run_id,
      provider: 'zkill',
      endpoint: `https://zkillboard.com/api/systemID/${systemId}/pastSeconds/86400/`,
      method: 'GET',
      status_code: 200,
      duration_ms: 1,
      cache_status: 'fixture',
      requested_at: new Date().toISOString()
    });
  }

  const report = buildRadiusReport(db, 'Atlas Prime', { radiusJumps: 1, maxSystems: 3 });
  const emptyWindowReport = buildRadiusReport(db, 'Atlas Prime', {
    radiusJumps: 1,
    maxSystems: 3,
    evidenceStart: '2026-05-02T00:00:00Z',
    evidenceEnd: '2026-05-03T00:00:00Z'
  });

  assertIncludes(report, 'AURA Atlas Radius Watch Evidence Report - PARTIAL SAMPLE');
  assertIncludes(report, 'Center: Atlas Prime [solarSystemID: 30000001]');
  assertIncludes(report, 'Radius: 1 jump');
  assertIncludes(report, 'Included systems: 3');
  assertIncludes(report, 'Evidence window: all stored evidence');
  assertIncludes(report, 'Discovery provenance window(s): 86400 seconds / 24 hours');
  assertIncludes(report, 'Expanded sample: 2 stored killmails matching radius/time scope');
  assertIncludes(report, 'Stored evidence matching this scope: 2 killmails / 14 activity events');
  assertIncludes(report, 'Collection provenance may include multiple run types; intelligence sections are filtered by stored evidence scope.');
  assertIncludes(report, 'Multi-System Presence');
  assertIncludes(report, 'Atlas Scout [characterID: 90000002]');
  assertIncludes(report, 'candidate operator, multi-system presence');
  assertIncludes(report, 'Atlas Prime [solarSystemID: 30000001]');
  assertIncludes(report, 'Atlas Gate [solarSystemID: 30000002]');
  assertIncludes(report, 'Test Constellation');
  assertIncludes(report, 'Test Region');
  assertIncludes(report, 'Source: zKill discovery + ESI expanded killmails');
  assertIncludes(emptyWindowReport, 'Evidence window: 2026-05-02T00:00:00Z -> 2026-05-03T00:00:00Z');
  assertIncludes(emptyWindowReport, 'Stored evidence matching this scope: 0 killmails / 0 activity events');

  closeDatabase(db);
  console.log('radius report verified');
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected radius report to include "${expected}"`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
