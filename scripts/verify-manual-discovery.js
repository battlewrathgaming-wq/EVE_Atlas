const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { discoverManualRefs } = require('../src/main/workers/manualDiscoveryWorker');
const { expandManualRefs } = require('../src/main/workers/manualExpansionWorker');
const { buildQueueReport } = require('../src/main/reports/queueReport');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  const zkillCalls = [];
  const esiCalls = [];
  const zkillClient = {
    async discoverRefs({ targetType, targetId, pastSeconds, maxRefs, includePreview }) {
      zkillCalls.push({ targetType, targetId, pastSeconds, maxRefs, includePreview });
      return [
        previewRef(7001, 'hash_7001', '2026-05-01T20:01:00Z', 603, 3),
        previewRef(7002, 'hash_7002', '2026-05-01T20:02:00Z', 587, 1),
        { killmail_id: 7001, hash: 'hash_7001', preview: { killmail_time: 'duplicate' } },
        { killmail_id: null, hash: null }
      ];
    }
  };
  const esiClient = {
    async expandKillmail(killmailId) {
      esiCalls.push(killmailId);
      return {
        ...fixtureKillmail,
        killmail_id: killmailId,
        killmail_time: `2026-05-01T21:0${killmailId - 7000}:00Z`,
        solar_system_id: 30000001
      };
    }
  };

  const discovery = await discoverManualRefs({
    scope: 'actor',
    entityType: 'character',
    entityId: 90000002,
    entityName: 'Atlas Scout',
    lookbackSeconds: 86400,
    maxRefs: 4,
    trigger: 'fixture_test'
  }, { db, zkillClient });

  assert(zkillCalls.length === 1, 'manual discovery should call zKill once');
  assert(zkillCalls[0].includePreview === true, 'manual discovery should request zKill preview metadata');
  assert(esiCalls.length === 0, 'manual discovery must not call ESI');
  assert(discovery.zkill_refs_discovered === 4, 'manual discovery should count raw zKill refs');
  assert(discovery.queued_refs_written === 2, 'manual discovery should queue two unique valid refs');
  assert(discovery.expansion_attempted === 0, 'manual discovery must not attempt expansion');
  assert(count(db, 'killmails') === 0, 'manual discovery must not write killmails');
  assert(count(db, 'activity_events') === 0, 'manual discovery must not write activity events');
  assert(count(db, 'discovered_killmail_refs') === 2, 'manual discovery should persist queued refs');

  const queueReport = buildQueueReport(db, {
    type: 'manual_actor',
    id: 'character:90000002'
  });
  assertIncludes(queueReport, 'Classification: discovery refs are staging/provenance metadata, not killmail evidence.');
  assertIncludes(queueReport, 'At-a-glance values are zKill discovery preview metadata only.');
  assertIncludes(queueReport, 'victim ship typeID 603');
  assertIncludes(queueReport, '3 attackers');

  const expansion = await expandManualRefs({
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000002',
    maxExpansions: 1,
    trigger: 'fixture_test'
  }, { db, esiClient });

  assertSame(esiCalls, [7001], 'manual expansion should expand only the first queued ref under cap');
  assert(expansion.new_esi_expansions === 1, 'manual expansion should persist one new ESI killmail');
  assert(expansion.activity_events_written > 0, 'manual expansion should write normalized activity events');
  assert(count(db, 'killmails') === 1, 'manual expansion should write one killmail');
  assert(queueStatus(db, 7001) === 'expanded', 'expanded ref should be marked expanded');
  assert(queueStatus(db, 7002) === 'pending', 'unselected ref should remain pending');

  const run = db.prepare(`
    SELECT discovered_refs, expanded_new, activity_events_written, api_calls_zkill, api_calls_esi
    FROM fetch_runs
    WHERE run_id = ?
  `).get(discovery.run_id);
  assert(run.discovered_refs === 4, 'manual discovery fetch run should record discovered refs');
  assert(run.expanded_new === 0, 'manual discovery fetch run should record zero expansions');
  assert(run.activity_events_written === 0, 'manual discovery fetch run should record zero activity events');
  assert(run.api_calls_esi === 0, 'manual discovery fetch run should record zero ESI calls');

  closeDatabase(db);
  console.log('manual discovery and expansion verified');
}

function previewRef(killmailId, hash, killmailTime, shipTypeId, attackerCount) {
  return {
    killmail_id: killmailId,
    hash,
    preview: {
      killmail_time: killmailTime,
      victim: { ship_type_id: shipTypeId },
      attacker_count: attackerCount,
      zkb: { totalValue: 1234567 }
    }
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function queueStatus(db, killmailId) {
  return db.prepare(`
    SELECT status
    FROM discovered_killmail_refs
    WHERE killmail_id = ?
  `).get(killmailId).status;
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected output to include "${expected}"`);
  }
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
