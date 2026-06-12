const PRODUCTION_ACTOR_WATCH_COMPATIBILITY_SUMMARY_FIELDS = Object.freeze([
  'run_id',
  'actor',
  'zkill_refs_discovered',
  'duplicate_refs_removed',
  'malformed_refs_removed',
  'unique_refs_after_dedupe',
  'pending_refs_considered',
  'already_cached_killmails',
  'expansion_attempted',
  'expansion_cap_skipped',
  'new_esi_expansions',
  'failed_expansions',
  'persisted_killmails',
  'activity_events_written',
  'api_calls_zkill',
  'api_calls_esi',
  'warnings',
  'planned_zkill_requests',
  'zkill_discovery_skipped',
  'collection_plan',
  'expansion_queue',
  'expansion_queue_summary'
]);

function buildActorWatchCompatibilitySummary({
  fetchRun,
  plannerOutput,
  discovery,
  selection,
  evidencePackage,
  persistResult,
  apiCounts,
  collectionWarnings,
  pendingRefs
}) {
  return {
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
    collection_plan: buildActorWatchCompatibilityCollectionPlan(plannerOutput, selection),
    expansion_queue: selection.expansionQueue,
    expansion_queue_summary: selection.skipCounts
  };
}

function buildActorWatchCompatibilityCollectionPlan(plannerOutput, selection) {
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
    },
    compatibility_only: true
  };
}

function actorWatchCompatibilitySummaryFields() {
  return [...PRODUCTION_ACTOR_WATCH_COMPATIBILITY_SUMMARY_FIELDS];
}

function actorWatchCompatibilitySummaryFieldParity(summary = {}) {
  const expected = actorWatchCompatibilitySummaryFields();
  const actual = Object.keys(summary);
  const missing = expected.filter((field) => !actual.includes(field));
  const extra = actual.filter((field) => !expected.includes(field));
  return {
    expected,
    actual,
    missing,
    extra,
    matches: missing.length === 0 && extra.length === 0
  };
}

function buildDirectActorWatchCompatibilityReturn(summary) {
  return summary;
}

function buildScheduledActorWatchCompatibilityResult({ watch, collection }) {
  return {
    status: 'succeeded',
    data: {
      watch,
      collection
    }
  };
}

module.exports = {
  PRODUCTION_ACTOR_WATCH_COMPATIBILITY_SUMMARY_FIELDS,
  buildActorWatchCompatibilitySummary,
  buildActorWatchCompatibilityCollectionPlan,
  actorWatchCompatibilitySummaryFields,
  actorWatchCompatibilitySummaryFieldParity,
  buildDirectActorWatchCompatibilityReturn,
  buildScheduledActorWatchCompatibilityResult
};
