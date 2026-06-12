function selectExpansionCandidates(expansionQueue, repository, maxExpansions) {
  const selectedRefs = [];
  const queue = expansionQueue.map((candidate) => ({ ...candidate }));

  for (const candidate of queue) {
    if (candidate.skip_reason) {
      continue;
    }

    if (repository.hasKillmail(candidate.killmail_id)) {
      candidate.already_cached = true;
      candidate.skip_reason = 'cached';
      continue;
    }

    if (selectedRefs.length >= maxExpansions) {
      candidate.skip_reason = 'cap_skipped';
      continue;
    }

    candidate.selected_for_expansion = true;
    selectedRefs.push({
      killmail_id: candidate.killmail_id,
      hash: candidate.hash,
      discovered_by_type: candidate.discovered_by_type,
      discovered_by_id: candidate.discovered_by_id
    });
  }

  return {
    selectedRefs,
    expansionQueue: queue,
    skipCounts: summarizeExpansionQueue(queue)
  };
}

function markFailedExpansionCandidates(expansionQueue, warnings) {
  const failedByKillmailId = new Map();
  for (const warning of warnings || []) {
    if (warning.warning_type !== 'failed_expansion' || !warning.killmail_id) {
      continue;
    }
    failedByKillmailId.set(Number(warning.killmail_id), warning.message || 'ESI expansion failed');
  }

  if (!failedByKillmailId.size) {
    return;
  }

  for (const candidate of expansionQueue) {
    if (!candidate.selected_for_expansion || !failedByKillmailId.has(candidate.killmail_id)) {
      continue;
    }
    candidate.skip_reason = 'failed';
    candidate.error_message = failedByKillmailId.get(candidate.killmail_id);
  }
}

function summarizeExpansionQueue(expansionQueue) {
  const summary = {
    total: expansionQueue.length,
    selected: 0,
    cached: 0,
    duplicate: 0,
    cap_skipped: 0,
    malformed: 0,
    failed: 0
  };

  for (const candidate of expansionQueue) {
    if (candidate.selected_for_expansion) {
      summary.selected += 1;
    }
    if (candidate.skip_reason && Object.prototype.hasOwnProperty.call(summary, candidate.skip_reason)) {
      summary[candidate.skip_reason] += 1;
    }
  }

  return summary;
}

module.exports = {
  selectExpansionCandidates,
  markFailedExpansionCandidates,
  summarizeExpansionQueue
};
