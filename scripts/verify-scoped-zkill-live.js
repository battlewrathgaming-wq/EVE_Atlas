const fs = require('node:fs');
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
  const startedAt = new Date().toISOString();
  try {
    assertLiveEnabled();
    assertNoRuntimeSdeZipImport();
  } catch (error) {
    writeArtifact({
      status: 'refused',
      reason: error.message,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      live_api_enabled: process.env.AURA_ATLAS_LIVE_API === '1',
      boundary: boundaryText()
    });
    throw error;
  }

  const dbPath = process.env.AURA_ATLAS_DB_PATH || path.join(auraTempRoot(), 'scoped-zkill-live.sqlite');
  assertProjectLocalPath(dbPath, 'AURA_ATLAS_DB_PATH');

  const db = openDatabase(dbPath);
  migrate(db);
  try {
    const plannedAt = startedAt;
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
      topology_readiness: topologyReadiness(db),
      evidence_counts: evidenceCounts(db),
      freshness: {
        requested_window_seconds: input.lookbackSeconds,
        requested_window_label: `${Math.round(input.lookbackSeconds / 3600 * 100) / 100} hours before discovery`,
        preview_time_range: previewTimeRange(result.expansion_queue),
        note: boundaryText()
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
        queued_ref_ids_sample: queuedRefSample(result.expansion_queue),
        expansion_attempted: result.expansion_attempted,
        no_esi_expansion_occurred: result.expansion_attempted === 0 && result.api_calls_esi === 0,
        api_calls_zkill: result.api_calls_zkill,
        api_calls_esi: result.api_calls_esi,
        warnings: result.warnings
      }
    };

    if (result.api_calls_esi !== 0 || result.expansion_attempted !== 0) {
      throw new Error('Scoped zKill live smoke must not call ESI or expand evidence');
    }
    trace.artifact_path = writeArtifact(trace);
    console.log(JSON.stringify(trace, null, 2));
  } catch (error) {
    writeArtifact({
      status: 'failed',
      reason: error.message,
      db_path: dbPath,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      topology_readiness: safeDbSummary(db, topologyReadiness),
      evidence_counts: safeDbSummary(db, evidenceCounts),
      boundary: boundaryText()
    });
    throw error;
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

function queuedRefSample(queue = []) {
  return queue
    .filter((candidate) => candidate.killmail_id)
    .slice(0, 10)
    .map((candidate) => ({
      killmail_id: candidate.killmail_id,
      status: candidate.skip_reason || (candidate.selected_for_expansion ? 'selected' : 'queued'),
      preview_time: candidate.preview?.killmail_time || null
    }));
}

function topologyReadiness(db) {
  return {
    solar_systems: count(db, 'solar_systems'),
    system_adjacency: count(db, 'system_adjacency'),
    topology_ready: count(db, 'solar_systems') > 0
  };
}

function evidenceCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function safeDbSummary(db, callback) {
  try {
    return callback(db);
  } catch (error) {
    return {
      unavailable: true,
      reason: error.message
    };
  }
}

function writeArtifact(payload) {
  const outputDir = path.join(auraTempRoot(), 'live-scoped-zkill-smoke');
  fs.mkdirSync(outputDir, { recursive: true });
  const artifact = {
    artifact_type: 'live_scoped_zkill_smoke',
    generated_at: new Date().toISOString(),
    ...payload
  };
  const status = String(artifact.status || 'unknown').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  const outputPath = path.join(outputDir, `scoped-zkill-${status}.json`);
  const latestPath = path.join(outputDir, 'latest.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
  fs.writeFileSync(latestPath, `${JSON.stringify(artifact, null, 2)}\n`);
  return outputPath;
}

function boundaryText() {
  return 'Queued refs and zKill preview fields are discovery/provenance metadata, not killmail evidence. Expand with ESI before using activity reports.';
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
