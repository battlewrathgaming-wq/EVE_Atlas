const { EvidenceRepository } = require('../db/evidenceRepository');
const { HttpClient } = require('../api/httpClient');
const { ZKillDiscoveryClient } = require('../api/zkillClient');
const { EsiClient } = require('../api/esiClient');
const {
  selectExpansionCandidates,
  markFailedExpansionCandidates,
  summarizeExpansionQueue
} = require('../discovery/expansionQueueSelection');
const { pendingActorDiscovery } = require('../discovery/candidateRefMemory');
const { discoverActorRefs } = require('../discovery/zkillCandidateAcquisition');
const { buildEvidencePackageFromRefs } = require('../discovery/esiBackedExpansionPackage');
const { planActorWatch } = require('./actorWatchPlanner');

async function collectActorWatch(input, dependencies = {}) {
  const db = dependencies.db;
  if (!db) {
    throw new Error('collectActorWatch requires a db');
  }

  const repository = dependencies.repository || new EvidenceRepository(db);
  const plannerOutput = dependencies.plannerOutput || planActorWatch(input);
  const fetchRun = repository.createFetchRun({
    trigger: input.trigger || 'manual',
    watchType: 'actor',
    watchId: input.watchId || `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`
  });
  const httpClient = dependencies.httpClient || new HttpClient({
    repository,
    runId: fetchRun.run_id,
    signal: dependencies.signal,
    timeoutMs: dependencies.timeoutMs
  });
  const zkillClient = dependencies.zkillClient || new ZKillDiscoveryClient(httpClient);
  const esiClient = dependencies.esiClient || new EsiClient(httpClient);

  try {
    const queueScope = {
      discoveredByType: 'actor',
      discoveredById: plannerOutput.actor.entity_id
    };
    const pendingRefs = repository.pendingDiscoveryRefs({
      ...queueScope,
      limit: plannerOutput.caps.maxExpansions
    });
    const discovery = pendingRefs.length
      ? pendingActorDiscovery(pendingRefs, plannerOutput)
      : await discoverActorRefs(plannerOutput, zkillClient);
    if (!pendingRefs.length) {
      repository.upsertDiscoveredKillmailRefs(discovery.expansionQueue, {
        runId: fetchRun.run_id,
        discoveredByType: 'actor',
        discoveredById: plannerOutput.actor.entity_id,
        sourceScope: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`,
        sourceActorType: plannerOutput.actor.entity_type,
        sourceActorId: plannerOutput.actor.entity_id
      });
    }
    const selection = selectExpansionCandidates(discovery.expansionQueue, repository, plannerOutput.caps.maxExpansions);
    repository.markDiscoveryRefsSelected(selection.selectedRefs, undefined, queueScope);
    const evidencePackage = await buildEvidencePackageFromRefs({
      refs: selection.selectedRefs,
      repository,
      esiClient,
      run: {
        run_id: fetchRun.run_id,
        source_type: 'actor',
        source_id: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`,
        started_at: fetchRun.started_at
      },
      discoveredBy: {
        type: 'actor',
        id: plannerOutput.actor.entity_id
      }
    });
    markFailedExpansionCandidates(selection.expansionQueue, evidencePackage.warnings);
    selection.skipCounts = summarizeExpansionQueue(selection.expansionQueue);
    repository.markDiscoveryRefsFailed(selection.expansionQueue.filter((candidate) => candidate.skip_reason === 'failed'), undefined, queueScope);

    const persistResult = repository.persistEvidencePackage(evidencePackage);
    repository.markDiscoveryRefsExpanded(evidencePackage.killmails.map((killmail) => ({
      killmail_id: killmail.killmail_id,
      hash: killmail.killmail_hash
    })), undefined, queueScope);
    repository.markDiscoveryRefsCached(selection.expansionQueue
      .filter((candidate) => candidate.skip_reason === 'cached')
      .map((candidate) => ({ killmail_id: candidate.killmail_id, hash: candidate.hash })), queueScope);
    const apiCounts = apiCountsForRun(db, fetchRun.run_id);
    const collectionWarnings = [
      ...plannerOutput.guardrailWarnings,
      ...discovery.warnings
    ];

    if (selection.skipCounts.cap_skipped > 0) {
      collectionWarnings.push(`Expansion cap skipped ${selection.skipCounts.cap_skipped} uncached refs`);
    }

    for (const message of collectionWarnings) {
      repository.insertWarning(fetchRun.run_id, {
        warning_type: 'actor_collection',
        message,
        created_at: new Date().toISOString()
      });
    }

    const summary = {
      run_id: fetchRun.run_id,
      actor: plannerOutput.actor,
      zkill_refs_discovered: discovery.discoveredRefs,
      duplicate_refs_removed: discovery.duplicateRefsRemoved,
      malformed_refs_removed: discovery.malformedRefsRemoved,
      unique_refs_after_dedupe: discovery.uniqueRefs.length,
      pending_refs_considered: discovery.pendingRefsConsidered || 0,
      already_cached_killmails: selection.skipCounts.cached + evidencePackage.run.already_cached,
      expansion_attempted: selection.selectedRefs.length,
      expansion_cap_skipped: selection.skipCounts.cap_skipped,
      new_esi_expansions: evidencePackage.run.expanded_count,
      failed_expansions: evidencePackage.run.failed_count,
      persisted_killmails: persistResult.killmailsWritten,
      activity_events_written: persistResult.eventsWritten,
      api_calls_zkill: apiCounts.zkill,
      api_calls_esi: apiCounts.esi,
      warnings: [
        ...collectionWarnings,
        ...evidencePackage.warnings.map((entry) => entry.message)
      ],
      planned_zkill_requests: plannerOutput.plannedZkillRequests.length,
      zkill_discovery_skipped: Boolean(pendingRefs.length),
      collection_plan: buildActorCollectionPlanSummary(plannerOutput, selection),
      expansion_queue: selection.expansionQueue,
      expansion_queue_summary: selection.skipCounts
    };

    repository.finalizeFetchRun(fetchRun.run_id, {
      discovered_refs: summary.zkill_refs_discovered,
      already_cached: summary.already_cached_killmails,
      expanded_new: summary.new_esi_expansions,
      failed_expansions: summary.failed_expansions,
      activity_events_written: summary.activity_events_written,
      api_calls_zkill: summary.api_calls_zkill,
      api_calls_esi: summary.api_calls_esi
    }, 'success', summary.warnings.length ? summary.warnings.join('; ') : null);

    return summary;
  } catch (error) {
    const apiCounts = apiCountsForRun(db, fetchRun.run_id);
    repository.finalizeFetchRun(fetchRun.run_id, {
      api_calls_zkill: apiCounts.zkill,
      api_calls_esi: apiCounts.esi
    }, 'failed', error.message);
    throw error;
  }
}

function buildActorCollectionPlanSummary(plannerOutput, selection) {
  return {
    actor: plannerOutput.actor,
    zkill_requests_planned: plannerOutput.plannedZkillRequests.length,
    known_local_killmails: selection.skipCounts.cached,
    expansion_budget: plannerOutput.caps.maxExpansions,
    selected_for_expansion: selection.selectedRefs.length,
    estimated_api_calls: {
      zkill: plannerOutput.estimatedApiCalls.zkill,
      esi: selection.selectedRefs.length,
      metadata: 0
    }
  };
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
  collectActorWatch,
  discoverActorRefs
};
