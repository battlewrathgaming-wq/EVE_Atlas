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
        const candidate = actorExpansionCandidate(ref, request, priority += 1);
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

async function discoverSystemRefs(plannerOutput, zkillClient) {
  const refsByKillmailId = new Map();
  let discoveredRefs = 0;
  let duplicateRefsRemoved = 0;
  let malformedRefsRemoved = 0;
  let systemsScanned = 0;
  let priority = 0;
  const warnings = [];
  const expansionQueue = [];

  for (const request of plannerOutput.plannedZkillRequests) {
    try {
      const refs = await zkillClient.discoverRefs({
        targetType: 'system',
        targetId: request.target_id,
        pastSeconds: request.past_seconds,
        maxRefs: request.max_refs,
        includePreview: request.include_preview || false
      });
      if (!Array.isArray(refs)) {
        warnings.push(`zKill discovery for system ${request.target_id} returned a non-array response`);
        continue;
      }
      systemsScanned += 1;
      discoveredRefs += refs.length;

      for (const ref of refs) {
        const candidate = systemExpansionCandidate(ref, request.target_id, priority += 1);
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
      warnings.push(`zKill discovery failed for system ${request.target_id}: ${error.message}`);
    }
  }

  return {
    systemsScanned,
    discoveredRefs,
    duplicateRefsRemoved,
    malformedRefsRemoved,
    uniqueRefs: [...refsByKillmailId.values()],
    expansionQueue,
    warnings
  };
}

function actorExpansionCandidate(ref, request, priority) {
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

function systemExpansionCandidate(ref, sourceSystemId, priority) {
  const killmailId = Number(ref?.killmail_id);
  return {
    killmail_id: Number.isInteger(killmailId) && killmailId > 0 ? killmailId : null,
    hash: ref?.hash || null,
    source_system_id: sourceSystemId,
    discovered_at: new Date().toISOString(),
    priority,
    already_cached: false,
    selected_for_expansion: false,
    skip_reason: null,
    preview: ref?.preview || null
  };
}

module.exports = {
  discoverActorRefs,
  discoverSystemRefs
};
