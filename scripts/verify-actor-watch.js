const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { collectActorWatch } = require('../src/main/workers/actorWatchCollector');
const { planActorWatch } = require('../src/main/workers/actorWatchPlanner');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

async function main() {
  verifyActorPlannerRoutes();
  await verifyActorCollectorStaging();
  console.log('actor watch verified');
}

function verifyActorPlannerRoutes() {
  const expected = {
    character: '/characterID/90000002/pastSeconds/86400/',
    corporation: '/corporationID/90000002/pastSeconds/86400/',
    alliance: '/allianceID/90000002/pastSeconds/86400/'
  };

  for (const [entityType, route] of Object.entries(expected)) {
    const plan = planActorWatch({
      entityType,
      entityId: 90000002,
      lookbackSeconds: 86400,
      maxRefs: 10,
      maxExpansions: 2
    });
    assert(plan.plannedZkillRequests[0].route === route, `${entityType} actor route should be ${route}`);
    assert(plan.estimatedApiCalls.zkill === 1, 'actor plan should estimate one zKill call');
    assert(plan.estimatedApiCalls.esi === 2, 'actor plan should estimate expansion cap for ESI');
  }
}

async function verifyActorCollectorStaging() {
  const db = openDatabase(':memory:');
  migrate(db);
  const repository = new EvidenceRepository(db);
  preCacheKillmail(repository, 3002);

  const expanded = [];
  const failed = [];
  const zkillClient = {
    async discoverRefs({ targetType, targetId, pastSeconds, maxRefs }) {
      assert(targetType === 'character', 'actor collector should use character zKill route');
      assert(targetId === 90000002, 'actor collector should request watched character ID');
      assert(pastSeconds === 86400, 'actor collector should use requested lookback');
      assert(maxRefs === 8, 'actor collector should pass max refs');
      return [
        { killmail_id: 3001, hash: 'fixture_hash_3001' },
        { killmail_id: 3002, hash: 'fixture_hash_3002' },
        { killmail_id: 3001, hash: 'duplicate_hash_3001' },
        { killmail_id: null, hash: 'malformed_hash' },
        { killmail_id: 3003, hash: 'fixture_hash_3003' },
        { killmail_id: 3004, hash: 'fixture_hash_3004' },
        { killmail_id: 3005, hash: 'fixture_hash_3005' }
      ];
    }
  };
  const esiClient = {
    async expandKillmail(killmailId) {
      expanded.push(killmailId);
      if (killmailId === 3003) {
        failed.push(killmailId);
        throw new Error('fixture actor ESI failure');
      }
      return syntheticKillmail(killmailId);
    }
  };

  const summary = await collectActorWatch({
    entityType: 'character',
    entityId: 90000002,
    entityName: 'Atlas Scout',
    lookbackSeconds: 86400,
    maxRefs: 8,
    maxExpansions: 3,
    trigger: 'fixture_test',
    watchId: 'actor-fixture'
  }, { db, zkillClient, esiClient });

  assert(summary.actor.entity_type === 'character', 'summary should include actor type');
  assert(summary.actor.entity_id === 90000002, 'summary should include actor ID');
  assert(summary.zkill_refs_discovered === 7, 'actor run should count raw refs');
  assert(summary.duplicate_refs_removed === 1, 'actor run should remove duplicate refs');
  assert(summary.malformed_refs_removed === 1, 'actor run should remove malformed refs');
  assert(summary.unique_refs_after_dedupe === 5, 'actor run should retain 5 unique valid refs');
  assert(summary.already_cached_killmails === 1, 'actor run should skip cached killmail before expansion');
  assert(summary.expansion_attempted === 3, 'actor run should apply global expansion budget after cache skip');
  assert(summary.failed_expansions === 1, 'actor run should count failed expansion');
  assert(summary.new_esi_expansions === 2, 'actor run should persist two successful expansions');
  assert(summary.persisted_killmails === 2, 'actor run should write two new killmails');
  assert(summary.activity_events_written === 14, 'actor run should write two killmails worth of activity events');
  assert(summary.expansion_cap_skipped === 1, 'actor run should cap-skip remaining uncached refs');
  assert(summary.expansion_queue_summary.cached === 1, 'actor queue should explain cached ref');
  assert(summary.expansion_queue_summary.duplicate === 1, 'actor queue should explain duplicate ref');
  assert(summary.expansion_queue_summary.malformed === 1, 'actor queue should explain malformed ref');
  assert(summary.expansion_queue_summary.failed === 1, 'actor queue should explain failed expansion');
  assert(summary.expansion_queue_summary.cap_skipped === 1, 'actor queue should explain cap skip');
  assertSame(expanded, [3001, 3003, 3004], 'actor run should expand selected uncached refs in priority order');
  assertSame(failed, [3003], 'actor run should fail only configured expansion');

  const failedCandidate = summary.expansion_queue.find((candidate) => candidate.killmail_id === 3003);
  assert(failedCandidate.skip_reason === 'failed', 'failed actor candidate should be marked failed');
  assert(failedCandidate.error_message === 'fixture actor ESI failure', 'failed actor candidate should include error message');
  assert(count(db, 'killmails') === 3, 'actor run should leave cached plus two new killmails');
  assert(count(db, 'activity_events') === 21, 'actor run should have cached plus two new event sets');
  assert(count(db, 'fetch_runs') === 2, 'actor run should record precache and actor runs');
  assert(count(db, 'discovered_killmail_refs') === 5, 'actor run should persist valid unique discovered refs');
  assert(discoveryRefStatus(db, 3001) === 'expanded', 'expanded actor ref should be marked expanded');
  assert(discoveryRefStatus(db, 3002) === 'cached', 'cached actor ref should be marked cached');
  assert(discoveryRefStatus(db, 3003) === 'failed', 'failed actor ref should be marked failed');
  assert(discoveryRefStatus(db, 3005) === 'pending', 'cap-skipped actor ref should remain pending');

  closeDatabase(db);
}

function preCacheKillmail(repository, killmailId) {
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'manual_scan',
    watchId: 'actor-precache'
  });
  const packageToPersist = evidencePackageFromExpandedKillmails({
    killmails: [{
      raw: syntheticKillmail(killmailId),
      hash: `fixture_hash_${killmailId}`
    }],
    run: {
      run_id: run.run_id,
      source_type: 'manual_scan',
      source_id: 'actor-precache',
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

function syntheticKillmail(killmailId) {
  return {
    ...fixtureKillmail,
    killmail_id: killmailId,
    killmail_time: `2026-05-01T20:${String(killmailId - 3000).padStart(2, '0')}:00Z`,
    solar_system_id: 30000001
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function discoveryRefStatus(db, killmailId) {
  return db.prepare(`
    SELECT status
    FROM discovered_killmail_refs
    WHERE killmail_id = ?
  `).get(killmailId)?.status;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
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
