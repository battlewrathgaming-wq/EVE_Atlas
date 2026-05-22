function buildActorQueuePreflight(db, input) {
  return buildQueuePreflight(db, {
    scopeType: 'actor',
    discoveredByType: 'actor',
    discoveredById: input.entityId,
    expansionRate: input.maxExpansions,
    plannedZkillRequests: 1
  });
}

function buildSystemRadiusQueuePreflight(db, input, plannerOutput) {
  return buildQueuePreflight(db, {
    scopeType: 'system_radius',
    discoveredByType: 'system_radius',
    discoveredById: input.centerSystemId,
    expansionRate: input.maxExpansions,
    plannedZkillRequests: plannerOutput.plannedZkillRequests.length
  });
}

function buildQueuePreflight(db, options) {
  const pendingRefs = db.prepare(`
    SELECT COUNT(*) AS count
    FROM discovered_killmail_refs
    WHERE discovered_by_type = ?
      AND discovered_by_id = ?
      AND status IN ('pending', 'failed')
  `).get(options.discoveredByType, String(options.discoveredById)).count;
  const drainCount = Math.min(pendingRefs, options.expansionRate);
  const draining = pendingRefs > 0;

  return {
    title: 'Discovery Queue Preflight',
    scope_type: options.scopeType,
    scope: `${options.discoveredByType}:${options.discoveredById}`,
    pending_refs: pendingRefs,
    mode: draining ? 'drain_discovery_queue' : 'discover_new_refs',
    zkill_discovery: draining ? 'not_needed' : 'needed',
    expected_zkill_calls: draining ? 0 : options.plannedZkillRequests,
    esi_expansion_rate: options.expansionRate,
    expected_esi_calls: draining ? drainCount : 'unknown_until_discovery',
    expected_esi_call_note: draining
      ? `Expected ESI calls: ${drainCount}`
      : `Expected ESI calls: unknown until discovery; Atlas may expand up to ${options.expansionRate} killmails this run`,
    remaining_queued_after_run_estimate: draining ? Math.max(0, pendingRefs - drainCount) : 'depends_on_discovery_result'
  };
}

module.exports = {
  buildActorQueuePreflight,
  buildSystemRadiusQueuePreflight
};
