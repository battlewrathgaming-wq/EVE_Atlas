const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { runActorWatchService } = require('../src/main/services/mutatingActionService');
const { listServiceCommands } = require('../src/main/services/serviceRegistry');
const { actorWatchCompatibilitySummaryFieldParity } = require('../src/main/discovery/actorWatchCompatibilitySummary');

async function main() {
  verifySourceBoundaries();
  verifyProductionCommandMetadata();
  await verifyDirectActorWatchUsesBoundaryBody();
  console.log('direct actor.watch redirect verified');
}

async function verifyDirectActorWatchUsesBoundaryBody() {
  const previousLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const fetchImpl = createFakeFetch();
    const summary = await runActorWatchService(db, {
      entityType: 'character',
      entityId: 90044001,
      entityName: 'HS440 Direct Actor',
      lookbackSeconds: 86400,
      maxRefs: 3,
      maxExpansions: 1,
      trigger: 'hs440_direct_redirect_verifier'
    }, {
      fetchImpl,
      maxAttempts: 1,
      timeoutMs: 50,
      now: '2026-06-12T00:00:00.000Z'
    });

    const parity = actorWatchCompatibilitySummaryFieldParity(summary);
    assert(parity.matches === true, 'direct actor.watch should return 22-field compatibility summary');
    assert(parity.actual.length === 22, 'direct actor.watch compatibility summary should have 22 fields');
    assert(summary.actor.entity_id === 90044001, 'direct actor.watch should preserve actor identity');
    assert(summary.zkill_refs_discovered === 1, 'direct actor.watch should discover one fixture zKill ref');
    assert(summary.expansion_attempted === 1, 'direct actor.watch should select one ref');
    assert(summary.new_esi_expansions === 1, 'direct actor.watch should expand one fixture killmail');
    assert(summary.persisted_killmails === 1, 'direct actor.watch should persist one killmail');
    assert(summary.api_calls_zkill === 1, 'direct actor.watch should count zKill log from HttpClient');
    assert(summary.api_calls_esi === 1, 'direct actor.watch should count ESI log from HttpClient');

    const fetchRun = db.prepare('SELECT * FROM fetch_runs ORDER BY started_at DESC LIMIT 1').get();
    assert(fetchRun.status === 'success', 'direct actor.watch fetch run should finalize success');
    assert(fetchRun.api_calls_zkill === 1, 'fetch run should persist zKill API count');
    assert(fetchRun.api_calls_esi === 1, 'fetch run should persist ESI API count');

    const logs = db.prepare(`
      SELECT provider, endpoint, status_code, retry_count, rate_limited, error_message
      FROM api_request_logs
      ORDER BY provider
    `).all();
    assert(logs.length === 2, 'direct actor.watch should write two HttpClient API logs');
    assert(logs.some((row) => row.provider === 'zkill' && row.status_code === 200 && row.retry_count === 0 && row.rate_limited === 0), 'direct actor.watch should log zKill 200');
    assert(logs.some((row) => row.provider === 'esi' && row.status_code === 200 && row.retry_count === 0 && row.rate_limited === 0), 'direct actor.watch should log ESI 200');
    assert(fetchImpl.invocations().zkill === 1, 'direct verifier should use fake fetch for zKill once');
    assert(fetchImpl.invocations().esi === 1, 'direct verifier should use fake fetch for ESI once');
    assert(count(db, 'metadata_runs') === 0, 'direct actor.watch should not write Hydration/metadata runs');
    assert(count(db, 'system_watches') === 0, 'direct actor.watch should not touch system/radius watches');
  } finally {
    closeDatabase(db);
    if (previousLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = previousLive;
    }
  }
}

function verifyProductionCommandMetadata() {
  const actorWatch = listServiceCommands().find((entry) => entry.command === 'actor.watch');
  assert(actorWatch, 'production actor.watch command should be registered');
  assert(actorWatch.classification === 'evidence-creating', 'production actor.watch should remain evidence-creating');
  assert(actorWatch.effects.includes('external-live-api'), 'production actor.watch should retain external-live-api effect');
  assert(actorWatch.effects.includes('evidence-creation'), 'production actor.watch should retain Evidence/EVEidence creation effect');
  assert(actorWatch.renderer_allowed === false, 'production actor.watch should remain non-renderer');
}

function verifySourceBoundaries() {
  const mutatingActionService = read('src/main/services/mutatingActionService.js');
  assert(/runActorWatchDirectBody\(input, \{ \.\.\.dependencies, db \}\)/.test(mutatingActionService), 'direct runActorWatchService should call boundary-owned direct body');
  assert(!/collectActorWatch\(input, \{ \.\.\.dependencies, db \}\)/.test(mutatingActionService), 'direct runActorWatchService should no longer call collectActorWatch');
  assert(!/require\(.*actorWatchCollector/.test(mutatingActionService), 'mutatingActionService should no longer import actorWatchCollector');

  const directBody = read('src/main/discovery/actorWatchDirectBody.js');
  assert(!/require\(.*actorWatchCollector/.test(directBody), 'direct body should not import actorWatchCollector');
  assert(!/collectActorWatch\(/.test(directBody), 'direct body should not call collectActorWatch');
  assert(/new HttpClient/.test(directBody), 'direct body should construct HttpClient');
  assert(/new ZKillDiscoveryClient/.test(directBody), 'direct body should construct ZKillDiscoveryClient');
  assert(/new EsiClient/.test(directBody), 'direct body should construct EsiClient');

  const watchExecutor = read('src/main/watchlist/watchExecutor.js');
  assert(!/require\(.*actorWatchCollector/.test(watchExecutor), 'scheduled actor Watch should no longer import actorWatchCollector after HS446');
  assert(!/runner: collectActorWatch/.test(watchExecutor), 'scheduled actor Watch should no longer dispatch legacy collector after HS446');
  assert(/runner: runScheduledActorWatch/.test(watchExecutor), 'scheduled actor Watch should dispatch boundary-owned scheduled runner after HS446');
  assert(/runner: collectSystemRadiusWatch/.test(watchExecutor), 'system/radius Watch should remain on legacy system collector');

  const actorCollector = read('src/main/workers/actorWatchCollector.js');
  assert(/function collectActorWatch/.test(actorCollector), 'collectActorWatch should remain available even though direct/scheduled actor Watch no longer use it');
}

function createFakeFetch() {
  const state = { zkill: 0, esi: 0 };
  const fetchImpl = async (endpoint) => {
    if (endpoint.includes('zkillboard.com')) {
      state.zkill += 1;
      return response(200, [{
        killmail_id: 400440001,
        killmail_time: '2026-06-12T00:00:00Z',
        solar_system_id: 30003597,
        zkb: { hash: 'hs440hash001' },
        victim: { character_id: 90044001 },
        attackers: []
      }]);
    }
    if (endpoint.includes('esi.evetech.net')) {
      state.esi += 1;
      return response(200, rawKillmail(400440001));
    }
    throw new Error(`Unexpected fixture endpoint: ${endpoint}`);
  };
  fetchImpl.invocations = () => ({ ...state });
  return fetchImpl;
}

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    async text() {
      return JSON.stringify(body);
    }
  };
}

function rawKillmail(killmailId) {
  return {
    killmail_id: killmailId,
    killmail_time: '2026-06-12T00:00:00Z',
    solar_system_id: 30003597,
    victim: {
      character_id: 90044001,
      character_name: 'HS440 Fixture Victim',
      corporation_id: 98044001,
      corporation_name: 'HS440 Fixture Victim Corp',
      alliance_id: 99044001,
      alliance_name: 'HS440 Fixture Victim Alliance',
      ship_type_id: 587,
      ship_type_name: 'Rifter'
    },
    attackers: [{
      character_id: 90044002,
      character_name: 'HS440 Fixture Attacker',
      corporation_id: 98044002,
      corporation_name: 'HS440 Fixture Attackers',
      alliance_id: 99044002,
      alliance_name: 'HS440 Fixture Coalition',
      ship_type_id: 603,
      ship_type_name: 'Merlin',
      weapon_type_id: 2488,
      damage_done: 1200,
      final_blow: true
    }]
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
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
