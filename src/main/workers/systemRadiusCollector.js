const { EvidenceRepository } = require('../db/evidenceRepository');
const { HttpClient } = require('../api/httpClient');
const { ZKillDiscoveryClient } = require('../api/zkillClient');
const { EsiClient } = require('../api/esiClient');
const { TopologyService } = require('../sde/topologyService');
const { planSystemRadiusWatch } = require('./systemRadiusPlanner');
const {
  selectExpansionCandidates,
  markFailedExpansionCandidates,
  summarizeExpansionQueue
} = require('../discovery/expansionQueueSelection');
const { pendingSystemRadiusDiscovery } = require('../discovery/candidateRefMemory');
const { discoverSystemRefs } = require('../discovery/zkillCandidateAcquisition');
const { buildEvidencePackageFromRefs } = require('../discovery/esiBackedExpansionPackage');

async function collectSystemRadiusWatch(input, dependencies = {}) {
  const db = dependencies.db;
  if (!db) {
    throw new Error('collectSystemRadiusWatch requires a db');
  }

  const repository = dependencies.repository || new EvidenceRepository(db);
  const topologyService = dependencies.topologyService || new TopologyService(db);
  const fetchRun = repository.createFetchRun({
    trigger: input.trigger || 'manual',
    watchType: 'system_radius',
    watchId: input.watchId || `system:${input.centerSystemId}:radius:${input.radiusJumps ?? 0}`
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
    const plannerOutput = dependencies.plannerOutput || planSystemRadiusWatch(input, { topologyService });
    const queueScope = {
      discoveredByType: 'system_radius',
      discoveredById: input.centerSystemId
    };
    const pendingRefs = repository.pendingDiscoveryRefs({
      ...queueScope,
      limit: plannerOutput.caps.maxExpansions
    });
    const discovery = pendingRefs.length
      ? pendingSystemRadiusDiscovery(pendingRefs)
      : await discoverSystemRefs(plannerOutput, zkillClient);
    if (!pendingRefs.length) {
      repository.upsertDiscoveredKillmailRefs(discovery.expansionQueue, {
        runId: fetchRun.run_id,
        discoveredByType: 'system_radius',
        discoveredById: input.centerSystemId,
        sourceScope: `system:${input.centerSystemId}:radius:${input.radiusJumps ?? 0}`
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
        source_type: 'system_radius',
        source_id: String(input.centerSystemId),
        started_at: fetchRun.started_at
      },
      discoveredBy: {
        type: 'system_radius',
        id: Number(input.centerSystemId)
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
        warning_type: 'system_radius_collection',
        message,
        created_at: new Date().toISOString()
      });
    }

    const summary = {
      run_id: fetchRun.run_id,
      systems_planned: plannerOutput.includedSystems.length + plannerOutput.skippedSystems.length,
      systems_scanned: discovery.systemsScanned,
      zkill_refs_discovered: discovery.discoveredRefs,
      duplicate_refs_removed: discovery.duplicateRefsRemoved,
      unique_refs_after_dedupe: discovery.uniqueRefs.length,
      malformed_refs_removed: discovery.malformedRefsRemoved,
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
      included_systems: plannerOutput.includedSystems,
      skipped_systems: plannerOutput.skippedSystems,
      planned_zkill_requests: plannerOutput.plannedZkillRequests.length,
      zkill_discovery_skipped: Boolean(pendingRefs.length),
      collection_plan: buildCollectionPlanSummary(plannerOutput, selection),
      scope_authority: plannerOutput.scopeAuthority,
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

function buildCollectionPlanSummary(plannerOutput, selection) {
  return {
    scope_authority_source: plannerOutput.scopeAuthority?.source || 'center_radius_planner',
    uses_stored_included_system_ids: plannerOutput.scopeAuthority?.uses_stored_included_system_ids === true,
    recomputed_topology_used_as_authority: plannerOutput.scopeAuthority?.recomputed_topology_used_as_authority === true,
    center_radius_role: plannerOutput.scopeAuthority?.center_radius_role || 'direct_manual_execution_authority',
    systems_in_scope: plannerOutput.includedSystems.length,
    zkill_requests_planned: plannerOutput.plannedZkillRequests.length,
    known_local_killmails: selection.skipCounts.cached,
    expansion_budget: plannerOutput.caps.maxExpansions,
    selected_for_expansion: selection.selectedRefs.length,
    estimated_api_calls: {
      zkill: plannerOutput.estimatedApiCalls?.zkill ?? plannerOutput.plannedZkillRequests.length,
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
  collectSystemRadiusWatch,
  discoverRefs: discoverSystemRefs
};
