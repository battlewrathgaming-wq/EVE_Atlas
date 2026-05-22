const { EvidenceRepository } = require('../db/evidenceRepository');
const { HttpClient } = require('../api/httpClient');
const { ZKillDiscoveryClient } = require('../api/zkillClient');
const { EsiClient } = require('../api/esiClient');
const { buildEvidencePackageFromRefs } = require('./killmailIngestionWorker');
const {
  selectExpansionCandidates,
  markFailedExpansionCandidates,
  summarizeExpansionQueue
} = require('./systemRadiusCollector');
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
  const httpClient = dependencies.httpClient || new HttpClient({ repository, runId: fetchRun.run_id });
  const zkillClient = dependencies.zkillClient || new ZKillDiscoveryClient(httpClient);
  const esiClient = dependencies.esiClient || new EsiClient(httpClient);

  try {
    const pendingRefs = repository.pendingDiscoveryRefs({
      discoveredByType: 'actor',
      discoveredById: plannerOutput.actor.entity_id,
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
    repository.markDiscoveryRefsSelected(selection.selectedRefs);
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
    repository.markDiscoveryRefsFailed(evidencePackage.warnings);

    const persistResult = repository.persistEvidencePackage(evidencePackage);
    repository.markDiscoveryRefsExpanded(evidencePackage.killmails.map((killmail) => ({
      killmail_id: killmail.killmail_id,
      hash: killmail.killmail_hash
    })));
    repository.markDiscoveryRefsCached(selection.expansionQueue
      .filter((candidate) => candidate.skip_reason === 'cached')
      .map((candidate) => ({ killmail_id: candidate.killmail_id, hash: candidate.hash })));
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

function pendingActorDiscovery(pendingRefs, plannerOutput) {
  const expansionQueue = pendingRefs.map((ref, index) => ({
    killmail_id: ref.killmail_id,
    hash: ref.hash,
    source_actor_type: plannerOutput.actor.entity_type,
    source_actor_id: plannerOutput.actor.entity_id,
    discovered_at: new Date().toISOString(),
    priority: ref.priority || index + 1,
    already_cached: false,
    selected_for_expansion: false,
    skip_reason: null
  }));
  return {
    discoveredRefs: 0,
    duplicateRefsRemoved: 0,
    malformedRefsRemoved: 0,
    uniqueRefs: pendingRefs.map((ref) => ({ killmail_id: ref.killmail_id, hash: ref.hash })),
    pendingRefsConsidered: pendingRefs.length,
    expansionQueue,
    warnings: ['zKill discovery skipped; draining pending actor discovery refs from local queue']
  };
}

async function discoverActorRefs(plannerOutput, zkillClient) {
  const refsByKillmailId = new Map();
  let discoveredRefs = 0;
  let duplicateRefsRemoved = 0;
  let malformedRefsRemoved = 0;
  let priority = 0;
  const warnings = [];
  const expansionQueue = [];

  for (const request of plannerOutput.plannedZkillRequests) {
    try {
      const refs = await zkillClient.discoverRefs({
        targetType: request.target_type,
        targetId: request.target_id,
        pastSeconds: request.past_seconds,
        maxRefs: request.max_refs,
        includePreview: request.include_preview || false
      });
      if (!Array.isArray(refs)) {
        warnings.push(`zKill discovery for ${request.target_type} ${request.target_id} returned a non-array response`);
        continue;
      }
      discoveredRefs += refs.length;

      for (const ref of refs) {
        const candidate = expansionCandidate(ref, request, priority += 1);
        if (!candidate.killmail_id || !candidate.hash) {
          candidate.skip_reason = 'malformed';
          malformedRefsRemoved += 1;
          expansionQueue.push(candidate);
          continue;
        }

        if (refsByKillmailId.has(candidate.killmail_id)) {
          candidate.skip_reason = 'duplicate';
          duplicateRefsRemoved += 1;
          expansionQueue.push(candidate);
          continue;
        }

        refsByKillmailId.set(candidate.killmail_id, {
          killmail_id: candidate.killmail_id,
          hash: candidate.hash
        });
        expansionQueue.push(candidate);
      }
    } catch (error) {
      warnings.push(`zKill discovery failed for ${request.target_type} ${request.target_id}: ${error.message}`);
    }
  }

  return {
    discoveredRefs,
    duplicateRefsRemoved,
    malformedRefsRemoved,
    uniqueRefs: [...refsByKillmailId.values()],
    expansionQueue,
    warnings
  };
}

function expansionCandidate(ref, request, priority) {
  const killmailId = Number(ref?.killmail_id);
  return {
    killmail_id: Number.isInteger(killmailId) && killmailId > 0 ? killmailId : null,
    hash: ref?.hash || null,
    source_actor_type: request.target_type,
    source_actor_id: request.target_id,
    discovered_at: new Date().toISOString(),
    priority,
    already_cached: false,
    selected_for_expansion: false,
    skip_reason: null,
    preview: ref?.preview || null
  };
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
