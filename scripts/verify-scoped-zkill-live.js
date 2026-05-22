const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot } = require('../src/main/util/tempPaths');
const { resolveSystemIdentity } = require('../src/main/resolution/systemResolver');
const { normalizeManualDiscoveryScope } = require('../src/main/scopes/scopeControls');
const { planSystemRadiusWatch } = require('../src/main/workers/systemRadiusPlanner');
const { discoverManualRefs } = require('../src/main/workers/manualDiscoveryWorker');
const { TopologyService } = require('../src/main/sde/topologyService');
const { buildZkillDiscoveryEndpoint } = require('../src/main/api/zkillClient');
const { actionGate } = require('../src/main/services/liveApiGateService');
const {
  assertProjectLocalPath,
  assertNoRuntimeSdeZipImport,
  logLocalLookupFailure
} = require('./live-system-watch-runner');

async function main() {
  assertLiveEnabled();
  assertNoRuntimeSdeZipImport();
  const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'scoped-zkill-live.sqlite');
  assertProjectLocalPath(dbPath, 'AURA_ATLAS_DB_PATH');

  const db = openDatabase(dbPath);
  migrate(db);
  try {
    const plannedAt = new Date().toISOString();
    const { system, input, endpoint, plan } = preflightLocalSystemScope(db);
    const liveGate = actionGate('manual.discovery', {
      scope: 'system',
      maxSystems: 1
    });
    if (!liveGate.allowed) {
      throw new Error(liveGate.blockers[0]?.message || 'Live gate blocked scoped zKill smoke');
    }

    const result = await discoverManualRefs(input, { db });
    const trace = {
      status: 'scoped zKill live discovery verified',
      db_path: dbPath,
      planned_at: plannedAt,
      completed_at: new Date().toISOString(),
      freshness: {
        requested_window_seconds: input.lookbackSeconds,
        requested_window_label: `${Math.round(input.lookbackSeconds / 3600 * 100) / 100} hours before discovery`,
        preview_time_range: previewTimeRange(result.expansion_queue),
        note: 'Queued refs and zKill preview fields are discovery/provenance metadata, not killmail evidence. Expand with ESI before using activity reports.'
      },
      scope: {
        system: systemLabel(system),
        center_system_id: system.solar_system_id,
        radius_jumps: 0,
        max_refs_per_system: input.maxRefsPerSystem
      },
      live_gate: {
        state: liveGate.state,
        estimated_api_calls: liveGate.estimated_api_calls,
        providers: liveGate.providers
      },
      route: {
        provider: 'zkill',
        endpoint,
        planned_requests: plan.plannedZkillRequests.length
      },
      run: {
        run_id: result.run_id,
        refs_discovered: result.zkill_refs_discovered,
        queued_refs_written: result.queued_refs_written,
        expansion_attempted: result.expansion_attempted,
        api_calls_zkill: result.api_calls_zkill,
        api_calls_esi: result.api_calls_esi,
        warnings: result.warnings
      }
    };

    if (result.api_calls_esi !== 0 || result.expansion_attempted !== 0) {
      throw new Error('Scoped zKill live smoke must not call ESI or expand evidence');
    }
    console.log(JSON.stringify(trace, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function preflightLocalSystemScope(db) {
  try {
    const system = resolveInputSystem(db);
    const input = normalizeManualDiscoveryScope({
      scope: 'system',
      centerSystemId: system.solar_system_id,
      lookbackSeconds: integerEnv('AURA_ATLAS_LIVE_LOOKBACK_SECONDS', 3600),
      maxSystems: 1,
      maxRefsPerSystem: integerEnv('AURA_ATLAS_LIVE_MAX_REFS_PER_SYSTEM', 5),
      maxRadius: 0,
      maxTopologySystems: 1,
      trigger: 'manual'
    });
    const endpoint = buildZkillDiscoveryEndpoint({
      targetType: 'system',
      targetId: input.centerSystemId,
      pastSeconds: input.lookbackSeconds
    });
    const plan = planSystemRadiusWatch(input, { topologyService: new TopologyService(db) });
    return { system, input, endpoint, plan };
  } catch (error) {
    logLocalLookupFailure(db, error);
    throw error;
  }
}

function resolveInputSystem(db) {
  if (!process.env.AURA_ATLAS_LIVE_CENTER_SYSTEM_ID && !process.env.AURA_ATLAS_LIVE_CENTER_SYSTEM_NAME) {
    throw new Error('AURA_ATLAS_LIVE_CENTER_SYSTEM_ID or AURA_ATLAS_LIVE_CENTER_SYSTEM_NAME is required');
  }
  return resolveSystemIdentity(db, {
    systemId: process.env.AURA_ATLAS_LIVE_CENTER_SYSTEM_ID,
    systemName: process.env.AURA_ATLAS_LIVE_CENTER_SYSTEM_NAME
  });
}

function previewTimeRange(queue = []) {
  const times = queue
    .map((candidate) => candidate.preview?.killmail_time)
    .filter(Boolean)
    .sort();
  return {
    earliest: times[0] || null,
    latest: times[times.length - 1] || null,
    previewed_refs: times.length
  };
}

function systemLabel(system) {
  return `${system.solar_system_name} [solarSystemID: ${system.solar_system_id}]`;
}

function integerEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function assertLiveEnabled() {
  if (process.env.AURA_ATLAS_LIVE_API !== '1') {
    throw new Error('Refusing scoped zKill live smoke: set AURA_ATLAS_LIVE_API=1 to allow zKill calls');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
