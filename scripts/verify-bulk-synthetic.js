const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { collectSystemRadiusWatch } = require('../src/main/workers/systemRadiusCollector');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');
const { buildRadiusReport } = require('../src/main/reports/radiusReport');
const { hydrateOperatorReportCandidates } = require('../src/main/metadata/reportHydrator');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  const importer = new SdeTopologyImporter(db);
  await importer.importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
    buildNumber: 'fixture-build',
    sourceUrl: 'fixtures/sde-jsonl'
  });

  const repository = new EvidenceRepository(db);
  preCacheKillmail(db, repository, 2004, 30000002);

  const expanded = [];
  const failed = [];
  const zkillClient = {
    async discoverRefs({ targetId }) {
      return refsBySystem().get(targetId) || [];
    }
  };
  const esiClient = {
    async expandKillmail(killmailId) {
      expanded.push(killmailId);
      if (killmailId === 2006) {
        failed.push(killmailId);
        throw new Error('fixture ESI expansion failure');
      }
      return syntheticKillmail(killmailId, systemByKillmail().get(killmailId));
    }
  };

  const summary = await collectSystemRadiusWatch({
    centerSystemId: 30000001,
    radiusJumps: 2,
    lookbackSeconds: 86400,
    maxSystems: 4,
    maxRefsPerSystem: 10,
    maxExpansions: 5,
    trigger: 'fixture_test',
    watchId: 'bulk-synthetic'
  }, { db, zkillClient, esiClient });

  addFixtureApiLogs(repository, summary.run_id, [30000001, 30000002, 30000003, 30000004]);
  assertCollectionSummary(summary, expanded, failed);
  assertDatabaseState(db);

  const hydration = await hydrateOperatorReportCandidates(db, 'Atlas Prime', {
    threshold: 1,
    topN: 10,
    esiClient: {
      async resolveNames(ids) {
        return ids.map((id) => resolvedName(id)).filter(Boolean);
      }
    }
  });
  assert(hydration.requested_from_esi > 0, 'hydration should request unresolved entity IDs');
  assert(hydration.entities_upserted > 0, 'hydration should upsert entity labels');
  assert(hydration.activity_events_patched > 0, 'hydration should patch display-name columns only');
  assert(count(db, 'metadata_runs') === 1, 'bulk harness should record one metadata run');

  const report = buildRadiusReport(db, 'Atlas Prime', { radiusJumps: 2, maxSystems: 4 });
  assertIncludes(report, 'AURA Atlas Radius Watch Evidence Report - PARTIAL SAMPLE');
  assertIncludes(report, 'Center: Atlas Prime [solarSystemID: 30000001]');
  assertIncludes(report, 'Included systems: 4');
  assertIncludes(report, 'Stored evidence matching this scope: 5 killmails / 35 activity events');
  assertIncludes(report, 'Collection provenance zKill refs discovered: 11');
  assertIncludes(report, 'Collection provenance failed expansions: 1');
  assertIncludes(report, 'Multi-System Presence');
  assertIncludes(report, 'Atlas Scout [characterID: 90000002]');
  assertIncludes(report, 'candidate operator, multi-system presence');

  closeDatabase(db);
  console.log('bulk synthetic system verified');
}

function preCacheKillmail(db, repository, killmailId, systemId) {
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'manual_scan',
    watchId: 'bulk-synthetic-precache'
  });
  const packageToPersist = evidencePackageFromExpandedKillmails({
    killmails: [{
      raw: syntheticKillmail(killmailId, systemId),
      hash: `fixture_hash_${killmailId}`
    }],
    run: {
      run_id: run.run_id,
      source_type: 'manual_scan',
      source_id: 'bulk-synthetic-precache',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'manual_scan',
      id: killmailId
    }
  });
  const result = repository.persistEvidencePackage(packageToPersist);
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: 1,
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten
  }, 'success', null);
}

function refsBySystem() {
  return new Map([
    [30000001, [
      { killmail_id: 2001, hash: 'fixture_hash_2001' },
      { killmail_id: 2002, hash: 'fixture_hash_2002' },
      { killmail_id: null, hash: 'malformed_hash' },
      { killmail_id: 2003 }
    ]],
    [30000002, [
      { killmail_id: 2002, hash: 'fixture_hash_2002_duplicate' },
      { killmail_id: 2004, hash: 'fixture_hash_2004' },
      { killmail_id: 2005, hash: 'fixture_hash_2005' }
    ]],
    [30000003, [
      { killmail_id: 2006, hash: 'fixture_hash_2006' },
      { killmail_id: 2007, hash: 'fixture_hash_2007' },
      { killmail_id: 2008, hash: 'fixture_hash_2008' }
    ]],
    [30000004, [
      { killmail_id: 2009, hash: 'fixture_hash_2009' }
    ]]
  ]);
}

function systemByKillmail() {
  return new Map([
    [2001, 30000001],
    [2002, 30000001],
    [2004, 30000002],
    [2005, 30000002],
    [2006, 30000003],
    [2007, 30000003],
    [2008, 30000003],
    [2009, 30000004]
  ]);
}

function syntheticKillmail(killmailId, systemId) {
  const clone = JSON.parse(JSON.stringify(fixtureKillmail));
  clone.killmail_id = killmailId;
  clone.killmail_time = `2026-05-01T20:${String(killmailId - 2000).padStart(2, '0')}:00Z`;
  clone.solar_system_id = systemId;
  stripDisplayNames(clone.victim);
  for (const attacker of clone.attackers) {
    stripDisplayNames(attacker);
  }
  return clone;
}

function stripDisplayNames(participant) {
  delete participant.character_name;
  delete participant.corporation_name;
  delete participant.alliance_name;
  delete participant.ship_type_name;
}

function addFixtureApiLogs(repository, runId, systemIds) {
  for (const systemId of systemIds) {
    repository.insertApiRequestLog({
      run_id: runId,
      run_type: 'collection',
      provider: 'zkill',
      endpoint: `https://zkillboard.com/api/systemID/${systemId}/pastSeconds/86400/`,
      method: 'GET',
      status_code: 200,
      duration_ms: 1,
      cache_status: 'fixture',
      requested_at: new Date().toISOString()
    });
  }
}

function assertCollectionSummary(summary, expanded, failed) {
  assert(summary.systems_planned === 4, 'bulk run should plan 4 systems');
  assert(summary.systems_scanned === 4, 'bulk run should scan 4 systems');
  assert(summary.zkill_refs_discovered === 11, 'bulk run should discover 11 raw refs');
  assert(summary.duplicate_refs_removed === 1, 'bulk run should remove 1 duplicate ref');
  assert(summary.malformed_refs_removed === 2, 'bulk run should remove 2 malformed refs');
  assert(summary.unique_refs_after_dedupe === 8, 'bulk run should retain 8 unique valid refs');
  assert(summary.already_cached_killmails === 1, 'bulk run should identify 1 cached killmail before expansion');
  assert(summary.expansion_attempted === 5, 'bulk run should attempt 5 globally capped expansions');
  assert(summary.failed_expansions === 1, 'bulk run should record 1 failed ESI expansion');
  assert(summary.new_esi_expansions === 4, 'bulk run should expand 4 new killmails after one failure');
  assert(summary.persisted_killmails === 4, 'bulk run should persist 4 new killmails');
  assert(summary.activity_events_written === 28, 'bulk run should write 28 new activity events');
  assert(summary.expansion_cap_skipped === 2, 'bulk run should cap-skip 2 uncached refs');
  assert(summary.collection_plan.systems_in_scope === 4, 'bulk plan should expose 4 systems in scope');
  assert(summary.collection_plan.estimated_api_calls.zkill === 4, 'bulk plan should estimate 4 zKill calls');
  assert(summary.collection_plan.estimated_api_calls.esi === 5, 'bulk plan should estimate 5 ESI expansion attempts');
  assert(summary.expansion_queue_summary.total === 11, 'bulk queue should include all raw refs');
  assert(summary.expansion_queue_summary.duplicate === 1, 'bulk queue should explain duplicate skip');
  assert(summary.expansion_queue_summary.malformed === 2, 'bulk queue should explain malformed skips');
  assert(summary.expansion_queue_summary.cached === 1, 'bulk queue should explain cached skip');
  assert(summary.expansion_queue_summary.cap_skipped === 2, 'bulk queue should explain cap skips');
  assert(summary.expansion_queue_summary.selected === 5, 'bulk queue should select 5 refs');
  assertSame(expanded, [2001, 2002, 2005, 2006, 2007], 'bulk run should expand selected uncached refs in priority order');
  assertSame(failed, [2006], 'bulk run should fail only the configured fixture expansion');
  assert(summary.warnings.some((message) => message.includes('Expansion cap skipped 2')), 'bulk run should warn about capped coverage');
  assert(summary.warnings.some((message) => message.includes('fixture ESI expansion failure')), 'bulk run should surface failed expansion warning');
}

function assertDatabaseState(db) {
  assert(count(db, 'killmails') === 5, 'database should contain precached plus 4 new killmails');
  assert(count(db, 'activity_events') === 35, 'database should contain 35 deduped activity events');
  assert(count(db, 'fetch_runs') === 2, 'database should record precache and bulk collection runs');
  const duplicateEvents = db.prepare(`
    SELECT event_key, COUNT(*) AS count
    FROM activity_events
    GROUP BY event_key
    HAVING COUNT(*) > 1
  `).all();
  assert(duplicateEvents.length === 0, 'bulk run should not create duplicate activity event keys');
}

function resolvedName(id) {
  const rows = {
    90000001: { id, category: 'character', name: 'Observed Victim' },
    90000002: { id, category: 'character', name: 'Atlas Scout' },
    90000003: { id, category: 'character', name: 'Atlas Wing' },
    98000001: { id, category: 'corporation', name: 'Victim Logistics' },
    98000002: { id, category: 'corporation', name: 'Signal Cartel Test' },
    99000001: { id, category: 'alliance', name: 'Quiet Coalition' },
    99000002: { id, category: 'alliance', name: 'Observed Operators' }
  };
  return rows[id] || null;
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

function assertSame(actual, expected, message) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(`${message}: expected ${expectedText}, got ${actualText}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
