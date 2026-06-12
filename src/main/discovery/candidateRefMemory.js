function pendingActorDiscovery(pendingRefs, plannerOutput) {
  const expansionQueue = pendingRefs.map((ref, index) => ({
    killmail_id: ref.killmail_id,
    hash: ref.hash,
    discovered_by_type: ref.discovered_by_type,
    discovered_by_id: ref.discovered_by_id,
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

function pendingSystemRadiusDiscovery(pendingRefs) {
  const expansionQueue = pendingRefs.map((ref, index) => ({
    killmail_id: ref.killmail_id,
    hash: ref.hash,
    discovered_by_type: ref.discovered_by_type,
    discovered_by_id: ref.discovered_by_id,
    source_system_id: ref.source_system_id || null,
    discovered_at: new Date().toISOString(),
    priority: ref.priority || index + 1,
    already_cached: false,
    selected_for_expansion: false,
    skip_reason: null
  }));
  return {
    systemsScanned: 0,
    discoveredRefs: 0,
    duplicateRefsRemoved: 0,
    malformedRefsRemoved: 0,
    uniqueRefs: pendingRefs.map((ref) => ({ killmail_id: ref.killmail_id, hash: ref.hash })),
    pendingRefsConsidered: pendingRefs.length,
    expansionQueue,
    warnings: ['zKill discovery skipped; draining pending system-radius discovery refs from local queue']
  };
}

module.exports = {
  pendingActorDiscovery,
  pendingSystemRadiusDiscovery
};
