const { EvidenceRepository } = require('../db/evidenceRepository');
const { HttpClient } = require('../api/httpClient');
const { ZKillDiscoveryClient } = require('../api/zkillClient');
const { TopologyService } = require('../sde/topologyService');
const { planActorWatch } = require('./actorWatchPlanner');
const { planSystemRadiusWatch } = require('./systemRadiusPlanner');
const { discoverActorRefs } = require('./actorWatchCollector');
const { discoverRefs: discoverSystemRefs, summarizeExpansionQueue } = require('./systemRadiusCollector');

async function discoverManualRefs(input, dependencies = {}) {
  const db = dependencies.db;
  if (!db) {
    throw new Error('discoverManualRefs requires a db');
  }

  const repository = dependencies.repository || new EvidenceRepository(db);
  const plan = buildManualDiscoveryPlan(input, dependencies);
  const fetchRun = repository.createFetchRun({
    trigger: input.trigger || 'manual',
    watchType: 'manual_discovery',
    watchId: plan.watchId
  });
  const httpClient = dependencies.httpClient || new HttpClient({
    repository,
    runId: fetchRun.run_id,
    signal: dependencies.signal,
    timeoutMs: dependencies.timeoutMs
  });
  const zkillClient = dependencies.zkillClient || new ZKillDiscoveryClient(httpClient);

  try {
    const discovery = await plan.discover(zkillClient);
    const queue = markCachedCandidates(discovery.expansionQueue, repository);
    const written = repository.upsertDiscoveredKillmailRefs(queue, {
      runId: fetchRun.run_id,
      discoveredByType: plan.discoveredByType,
      discoveredById: plan.discoveredById,
      sourceScope: plan.sourceScope,
      sourceSystemId: plan.sourceSystemId,
      sourceActorType: plan.sourceActorType,
      sourceActorId: plan.sourceActorId
    });
    const summary = summarizeExpansionQueue(queue);
    const apiCounts = apiCountsForRun(db, fetchRun.run_id);
    const warnings = [
      ...plan.guardrailWarnings,
      ...discovery.warnings,
      'Manual discovery queued refs only; no ESI expansion was attempted'
    ];

    for (const message of warnings) {
      repository.insertWarning(fetchRun.run_id, {
        warning_type: 'manual_discovery',
        message,
        created_at: new Date().toISOString()
      });
    }

    const result = {
      run_id: fetchRun.run_id,
      scope: plan.sourceScope,
      discovered_by_type: plan.discoveredByType,
      discovered_by_id: plan.discoveredById,
      zkill_refs_discovered: discovery.discoveredRefs,
      duplicate_refs_removed: discovery.duplicateRefsRemoved,
      malformed_refs_removed: discovery.malformedRefsRemoved,
      queued_refs_written: written,
      already_cached_killmails: summary.cached,
      expansion_attempted: 0,
      new_esi_expansions: 0,
      activity_events_written: 0,
      api_calls_zkill: apiCounts.zkill,
      api_calls_esi: apiCounts.esi,
      zkill_discovery_skipped: false,
      expansion_queue_summary: summary,
      expansion_queue: queue,
      warnings
    };

    repository.finalizeFetchRun(fetchRun.run_id, {
      discovered_refs: result.zkill_refs_discovered,
      already_cached: result.already_cached_killmails,
      expanded_new: 0,
      failed_expansions: 0,
      activity_events_written: 0,
      api_calls_zkill: result.api_calls_zkill,
      api_calls_esi: result.api_calls_esi
    }, 'success', warnings.join('; '));

    return result;
  } catch (error) {
    const apiCounts = apiCountsForRun(db, fetchRun.run_id);
    repository.finalizeFetchRun(fetchRun.run_id, {
      api_calls_zkill: apiCounts.zkill,
      api_calls_esi: apiCounts.esi
    }, 'failed', error.message);
    throw error;
  }
}

function buildManualDiscoveryPlan(input, dependencies = {}) {
  const scope = String(input.scope || '').toLowerCase();
  if (scope === 'actor') {
    const actorPlan = planActorWatch({
      ...input,
      maxExpansions: input.maxExpansions || input.maxRefs || 1000000
    });
    const requestPlan = withPreviewRequests(actorPlan);
    return {
      watchId: `manual_actor:${actorPlan.actor.entity_type}:${actorPlan.actor.entity_id}`,
      discoveredByType: 'manual_actor',
      discoveredById: `${actorPlan.actor.entity_type}:${actorPlan.actor.entity_id}`,
      sourceScope: `${actorPlan.actor.entity_type}:${actorPlan.actor.entity_id}`,
      sourceActorType: actorPlan.actor.entity_type,
      sourceActorId: actorPlan.actor.entity_id,
      sourceSystemId: null,
      guardrailWarnings: actorPlan.guardrailWarnings,
      discover: (zkillClient) => discoverActorRefs(requestPlan, zkillClient)
    };
  }

  if (scope === 'system' || scope === 'radius') {
    const topologyService = dependencies.topologyService || new TopologyService(dependencies.db);
    const radiusJumps = scope === 'system' ? 0 : Number(input.radiusJumps ?? 1);
    const systemPlan = planSystemRadiusWatch({
      ...input,
      radiusJumps,
      maxExpansions: input.maxExpansions || 1000000
    }, { topologyService });
    const requestPlan = withPreviewRequests(systemPlan);
    const discoveredByType = scope === 'system' ? 'manual_system' : 'manual_radius';
    const discoveredById = scope === 'system'
      ? String(input.centerSystemId)
      : `${input.centerSystemId}:radius:${radiusJumps}`;
    return {
      watchId: `${discoveredByType}:${discoveredById}`,
      discoveredByType,
      discoveredById,
      sourceScope: `${scope}:${discoveredById}`,
      sourceActorType: null,
      sourceActorId: null,
      sourceSystemId: input.centerSystemId,
      guardrailWarnings: systemPlan.guardrailWarnings,
      discover: (zkillClient) => discoverSystemRefs(requestPlan, zkillClient)
    };
  }

  throw new Error('Manual discovery scope must be actor, system, or radius');
}

function withPreviewRequests(plan) {
  return {
    ...plan,
    plannedZkillRequests: plan.plannedZkillRequests.map((request) => ({
      ...request,
      include_preview: true
    }))
  };
}

function markCachedCandidates(expansionQueue, repository) {
  return expansionQueue.map((candidate) => {
    if (candidate.skip_reason || !repository.hasKillmail(candidate.killmail_id)) {
      return candidate;
    }
    return {
      ...candidate,
      already_cached: true,
      skip_reason: 'cached'
    };
  });
}

function apiCountsForRun(db, runId) {
  const rows = db.prepare(`
    SELECT provider, COUNT(*) AS count
    FROM api_request_logs
    WHERE run_id = ?
    GROUP BY provider
  `).all(runId);
  const counts = { zkill: 0, esi: 0 };
  for (const row of rows) {
    counts[row.provider] = row.count;
  }
  return counts;
}

module.exports = {
  discoverManualRefs,
  buildManualDiscoveryPlan
};
