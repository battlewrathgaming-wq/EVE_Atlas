const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { SdeTopologyImporter } = require('../src/main/sde/sdeImporter');
const { collectSystemRadiusWatch } = require('../src/main/workers/systemRadiusCollector');
const {
  assertNoRuntimeSdeZipImport,
  preflightLiveLookup,
  logLocalLookupFailure
} = require('./live-system-watch-runner');

async function main() {
  verifyRuntimeSdeZipGuard();
  await verifyLocalLookupPreflightFailureLogging();
  await verifyLocalLookupPreflightPassesWithFixtureSde();
  await verifyIdempotentCachedSkip();
  await verifyGradualIngestAfterCacheSkip();
  console.log('system radius collector verified');
}

function verifyRuntimeSdeZipGuard() {
  const previous = process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH;
  process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH = 'F:\\Projects\\AURA-Atlas\\.tmp\\sde\\eve-online-static-data-3351823-jsonl.zip';
  try {
    let blocked = false;
    try {
      assertNoRuntimeSdeZipImport();
    } catch (error) {
      blocked = error.message.includes('import material only');
    }
    assert(blocked, 'live runner should reject runtime SDE zip import configuration');
  } finally {
    if (previous === undefined) {
      delete process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH;
    } else {
      process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH = previous;
    }
  }
}

async function verifyLocalLookupPreflightFailureLogging() {
  const db = openDatabase(':memory:');
  migrate(db);
  withEnv({
    AURA_ATLAS_LIVE_CENTER_SYSTEM_NAME: 'Atlas Prime',
    AURA_ATLAS_LIVE_RADIUS_JUMPS: '1'
  }, () => {
    let error = null;
    try {
      preflightLiveLookup(db);
    } catch (caught) {
      error = caught;
      logLocalLookupFailure(db, caught);
    }
    assert(error, 'empty lookup DB should fail live preflight');
    assert(error.message.includes('solar_systems is empty'), 'empty lookup DB should explain missing solar_systems');
  });

  const failedRun = db.prepare('SELECT * FROM fetch_runs WHERE status = ?').get('failed');
  assert(failedRun, 'local lookup failure should create a failed fetch run');
  assert(failedRun.error_summary.includes('solar_systems is empty'), 'failed run should record local lookup error summary');
  const warning = db.prepare('SELECT * FROM data_quality_warnings WHERE run_id = ?').get(failedRun.run_id);
  assert(warning.warning_type === 'LOCAL_LOOKUP_FAILURE', 'local lookup failure should write LOCAL_LOOKUP_FAILURE warning');

  closeDatabase(db);
}

async function verifyLocalLookupPreflightPassesWithFixtureSde() {
  const db = openDatabase(':memory:');
  migrate(db);

  const importer = new SdeTopologyImporter(db);
  await importer.importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
    buildNumber: 'fixture-build',
    sourceUrl: 'fixtures/sde-jsonl'
  });

  withEnv({
    AURA_ATLAS_LIVE_CENTER_SYSTEM_NAME: 'Atlas Prime',
    AURA_ATLAS_LIVE_RADIUS_JUMPS: '1',
    AURA_ATLAS_LIVE_LOOKBACK_SECONDS: '86400',
    AURA_ATLAS_LIVE_MAX_SYSTEMS: '3',
    AURA_ATLAS_LIVE_MAX_REFS_PER_SYSTEM: '2',
    AURA_ATLAS_LIVE_MAX_EXPANSIONS: '2'
  }, () => {
    const input = preflightLiveLookup(db);
    assert(input.centerSystemId === 30000001, 'preflight should resolve fixture center system locally');
    assert(input.radiusJumps === 1, 'preflight should preserve configured radius');
  });

  assert(count(db, 'fetch_runs') === 0, 'successful preflight should not create a fetch run');
  closeDatabase(db);
}

async function verifyIdempotentCachedSkip() {
  const db = openDatabase(':memory:');
  migrate(db);

  const importer = new SdeTopologyImporter(db);
  await importer.importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
    buildNumber: 'fixture-build',
    sourceUrl: 'fixtures/sde-jsonl'
  });

  const zkillClient = {
    async discoverRefs({ targetId }) {
      if (targetId === 30000001 || targetId === 30000002) {
        return [{ killmail_id: 1001, hash: 'fixture_hash_1001' }];
      }
      return [];
    }
  };
  const esiClient = {
    async expandKillmail(killmailId) {
      if (killmailId !== 1001) {
        throw new Error(`Unexpected killmail ${killmailId}`);
      }
      return fixtureKillmail;
    }
  };

  const input = {
    centerSystemId: 30000001,
    radiusJumps: 1,
    lookbackSeconds: 86400,
    maxSystems: 3,
    maxRefsPerSystem: 2,
    maxExpansions: 2,
    trigger: 'fixture_test',
    watchId: 'offline-collector'
  };

  const first = await collectSystemRadiusWatch(input, { db, zkillClient, esiClient });
  assert(first.systems_planned === 3, 'first run should plan 3 systems');
  assert(first.systems_scanned === 3, 'first run should scan 3 systems');
  assert(first.zkill_refs_discovered === 2, 'first run should discover 2 refs');
  assert(first.duplicate_refs_removed === 1, 'first run should remove duplicate ref globally');
  assert(first.expansion_queue_summary.duplicate === 1, 'first run should explain duplicate skip');
  assert(first.unique_refs_after_dedupe === 1, 'first run should have one unique ref after dedupe');
  assert(first.already_cached_killmails === 0, 'first run should not find cached killmails');
  assert(first.expansion_attempted === 1, 'first run should attempt one expansion');
  assert(first.new_esi_expansions === 1, 'first run should expand one new ESI killmail');
  assert(first.persisted_killmails === 1, 'first run should persist one killmail');
  assert(first.activity_events_written === 7, 'first run should write 7 activity events');
  assert(first.collection_plan.systems_in_scope === 3, 'first run should expose systems in plan');
  assert(first.collection_plan.zkill_requests_planned === 3, 'first run should expose planned zKill requests');
  assert(first.collection_plan.expansion_budget === 2, 'first run should expose expansion budget');
  assert(first.collection_plan.estimated_api_calls.esi === 1, 'first run should estimate selected ESI expansions');
  assert(first.expansion_queue.some((candidate) => candidate.skip_reason === 'duplicate'), 'first queue should include duplicate skip reason');
  assert(first.expansion_queue.some((candidate) => candidate.selected_for_expansion), 'first queue should include selected expansion candidate');

  const second = await collectSystemRadiusWatch(input, { db, zkillClient, esiClient });
  assert(second.zkill_refs_discovered === 2, 'second run should rediscover refs');
  assert(second.duplicate_refs_removed === 1, 'second run should remove duplicate ref globally');
  assert(second.unique_refs_after_dedupe === 1, 'second run should have one unique ref after dedupe');
  assert(second.already_cached_killmails === 1, 'second run should skip cached killmail');
  assert(second.expansion_queue_summary.cached === 1, 'second run should explain cached skip');
  assert(second.expansion_attempted === 0, 'second run should attempt no ESI expansions');
  assert(second.new_esi_expansions === 0, 'second run should not expand cached killmail');
  assert(second.persisted_killmails === 0, 'second run should persist no new killmail package rows');
  assert(second.activity_events_written === 0, 'second run should not write duplicate events');
  assert(second.expansion_queue.some((candidate) => candidate.skip_reason === 'cached'), 'second queue should include cached skip reason');

  assert(count(db, 'killmails') === 1, 'killmails table should remain idempotent');
  assert(count(db, 'activity_events') === 7, 'activity_events table should remain idempotent');
  assert(count(db, 'fetch_runs') === 2, 'both collector runs should be recorded');

  closeDatabase(db);
}

async function verifyGradualIngestAfterCacheSkip() {
  const db = openDatabase(':memory:');
  migrate(db);

  const importer = new SdeTopologyImporter(db);
  await importer.importFromPath(path.resolve(__dirname, '..', 'fixtures', 'sde-jsonl'), {
    buildNumber: 'fixture-build',
    sourceUrl: 'fixtures/sde-jsonl'
  });

  const killmails = new Map([
    [1001, fixtureKillmail],
    [1002, { ...fixtureKillmail, killmail_id: 1002, killmail_time: '2026-05-01T21:15:00Z' }],
    [1003, { ...fixtureKillmail, killmail_id: 1003, killmail_time: '2026-05-01T22:15:00Z' }],
    [1004, { ...fixtureKillmail, killmail_id: 1004, killmail_time: '2026-05-01T23:15:00Z' }]
  ]);
  const expanded = [];
  const zkillClient = {
    async discoverRefs() {
      return [
        { killmail_id: 1001, hash: 'fixture_hash_1001' },
        { killmail_id: 1002, hash: 'fixture_hash_1002' },
        { killmail_id: 1003, hash: 'fixture_hash_1003' },
        { killmail_id: 1004, hash: 'fixture_hash_1004' },
        { killmail_id: null, hash: 'malformed_hash' },
        { killmail_id: 1005 }
      ];
    }
  };
  const esiClient = {
    async expandKillmail(killmailId) {
      expanded.push(killmailId);
      return killmails.get(killmailId);
    }
  };
  const input = {
    centerSystemId: 30000001,
    radiusJumps: 0,
    lookbackSeconds: 86400,
    maxSystems: 1,
    maxRefsPerSystem: 4,
    maxExpansions: 2,
    trigger: 'fixture_test',
    watchId: 'offline-gradual'
  };

  const first = await collectSystemRadiusWatch(input, { db, zkillClient, esiClient });
  const second = await collectSystemRadiusWatch(input, { db, zkillClient, esiClient });

  assertSame(expanded, [1001, 1002, 1003, 1004], 'rerun should expand next uncached refs after cache skip');
  assert(first.expansion_attempted === 2, 'first gradual run should attempt first 2 expansions');
  assert(first.expansion_cap_skipped === 2, 'first gradual run should skip 2 refs by cap');
  assert(first.malformed_refs_removed === 2, 'first gradual run should remove malformed refs');
  assert(first.expansion_queue_summary.malformed === 2, 'first gradual run should explain malformed skips');
  assert(first.expansion_queue_summary.cap_skipped === 2, 'first gradual run should explain cap skips');
  assert(first.persisted_killmails === 2, 'first gradual run should persist 2 killmails');
  assert(second.already_cached_killmails === 2, 'second gradual run should count first 2 as cached');
  assert(second.expansion_attempted === 2, 'second gradual run should attempt next 2 expansions');
  assert(second.expansion_cap_skipped === 0, 'second gradual run should have no remaining uncached refs past cap');
  assert(second.expansion_queue_summary.cached === 2, 'second gradual run should explain cached refs');
  assert(second.expansion_queue_summary.selected === 2, 'second gradual run should select next uncached refs');
  assert(second.persisted_killmails === 2, 'second gradual run should persist next 2 killmails');
  assert(count(db, 'killmails') === 4, 'gradual runs should store all 4 killmails');

  closeDatabase(db);
}

function withEnv(values, callback) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    process.env[key] = value;
  }

  try {
    return callback();
  } finally {
    for (const key of Object.keys(values)) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
  }
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
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
