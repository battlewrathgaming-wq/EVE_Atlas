const { EvidenceRepository } = require('../db/evidenceRepository');
const { HttpClient } = require('../api/httpClient');
const { EsiClient } = require('../api/esiClient');
const {
  markFailedExpansionCandidates,
  summarizeExpansionQueue
} = require('../discovery/expansionQueueSelection');
const { buildEvidencePackageFromRefs } = require('../discovery/esiBackedExpansionPackage');

async function expandManualRefs(input, dependencies = {}) {
  const db = dependencies.db;
  if (!db) {
    throw new Error('expandManualRefs requires a db');
  }

  const repository = dependencies.repository || new EvidenceRepository(db);
  const maxExpansions = positiveInteger(input.maxExpansions ?? 2, 'maxExpansions');
  const fetchRun = repository.createFetchRun({
    trigger: input.trigger || 'manual',
    watchType: 'manual_expand',
    watchId: expansionWatchId(input)
  });
  const httpClient = dependencies.httpClient || new HttpClient({
    repository,
    runId: fetchRun.run_id,
    signal: dependencies.signal,
    timeoutMs: dependencies.timeoutMs
  });
  const esiClient = dependencies.esiClient || new EsiClient(httpClient);

  try {
    const candidates = manualExpansionCandidates(db, input, maxExpansions);
    const selectedRefs = candidates.map((candidate) => ({
      killmail_id: candidate.killmail_id,
      hash: candidate.hash,
      discovered_by_type: candidate.discovered_by_type,
      discovered_by_id: candidate.discovered_by_id
    }));
    repository.markDiscoveryRefsSelected(selectedRefs);

    const evidencePackage = await buildEvidencePackageFromRefs({
      refs: selectedRefs,
      repository,
      esiClient,
      run: {
        run_id: fetchRun.run_id,
        source_type: 'manual_expand',
        source_id: expansionWatchId(input),
        started_at: fetchRun.started_at
      },
      discoveredBy: evidenceDiscoveredBy(input, candidates)
    });
    markFailedExpansionCandidates(candidates, evidencePackage.warnings);
    repository.markDiscoveryRefsFailed(candidates.filter((candidate) => candidate.skip_reason === 'failed'));

    const persistResult = repository.persistEvidencePackage(evidencePackage);
    repository.markDiscoveryRefsExpanded(evidencePackage.killmails.map((killmail) => ({
      killmail_id: killmail.killmail_id,
      hash: killmail.killmail_hash,
      ...scopeForKillmail(candidates, killmail.killmail_id)
    })));
    repository.markDiscoveryRefsCached(candidates
      .filter((candidate) => repository.hasKillmail(candidate.killmail_id))
      .map((candidate) => ({
        killmail_id: candidate.killmail_id,
        hash: candidate.hash,
        discovered_by_type: candidate.discovered_by_type,
        discovered_by_id: candidate.discovered_by_id
      })));

    const apiCounts = apiCountsForRun(db, fetchRun.run_id);
    const summary = summarizeExpansionQueue(candidates);
    const warnings = evidencePackage.warnings.map((entry) => entry.message);

    const result = {
      run_id: fetchRun.run_id,
      candidates_considered: candidates.length,
      expansion_attempted: selectedRefs.length,
      new_esi_expansions: evidencePackage.run.expanded_count,
      already_cached_killmails: evidencePackage.run.already_cached,
      failed_expansions: evidencePackage.run.failed_count,
      persisted_killmails: persistResult.killmailsWritten,
      activity_events_written: persistResult.eventsWritten,
      api_calls_zkill: apiCounts.zkill,
      api_calls_esi: apiCounts.esi,
      expansion_queue_summary: summary,
      warnings
    };

    repository.finalizeFetchRun(fetchRun.run_id, {
      discovered_refs: result.candidates_considered,
      already_cached: result.already_cached_killmails,
      expanded_new: result.new_esi_expansions,
      failed_expansions: result.failed_expansions,
      activity_events_written: result.activity_events_written,
      api_calls_zkill: result.api_calls_zkill,
      api_calls_esi: result.api_calls_esi
    }, 'success', warnings.length ? warnings.join('; ') : null);

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

function manualExpansionCandidates(db, input, limit) {
  const where = ["status IN ('pending', 'failed')"];
  const params = [];
  if (input.discoveredByType) {
    where.push('discovered_by_type = ?');
    params.push(input.discoveredByType);
  }
  if (input.discoveredById) {
    where.push('discovered_by_id = ?');
    params.push(String(input.discoveredById));
  }
  if (input.killmailIds?.length) {
    where.push(`killmail_id IN (${input.killmailIds.map(() => '?').join(', ')})`);
    params.push(...input.killmailIds.map((id) => positiveInteger(id, 'killmailIds')));
  }

  return db.prepare(`
    SELECT killmail_id, killmail_hash AS hash, discovered_by_type, discovered_by_id,
           priority, discovered_at,
           source_system_id, source_actor_type, source_actor_id
    FROM discovered_killmail_refs
    WHERE ${where.join(' AND ')}
    ORDER BY status = 'failed', priority ASC, discovered_at ASC, killmail_id ASC
    LIMIT ?
  `).all(...params, limit)
    .map((row) => ({
      ...row,
      selected_for_expansion: true,
      already_cached: false,
      skip_reason: null
    }));
}

function scopeForKillmail(candidates, killmailId) {
  const match = candidates.find((candidate) => candidate.killmail_id === killmailId);
  if (!match) {
    return {};
  }
  return {
    discovered_by_type: match.discovered_by_type,
    discovered_by_id: match.discovered_by_id
  };
}

function expansionWatchId(input) {
  if (input.discoveredByType && input.discoveredById) {
    return `${input.discoveredByType}:${input.discoveredById}`;
  }
  if (input.killmailIds?.length) {
    return `killmail:${input.killmailIds.join(',')}`;
  }
  return 'manual_expand';
}

function evidenceDiscoveredBy(input, candidates) {
  const first = candidates[0] || {};
  if (input.discoveredByType === 'manual_actor') {
    return {
      type: 'manual_actor',
      id: first.source_actor_id || null
    };
  }
  if (input.discoveredByType === 'manual_system' || input.discoveredByType === 'manual_radius') {
    return {
      type: input.discoveredByType,
      id: first.source_system_id || null
    };
  }
  const numericId = Number(input.discoveredById);
  return {
    type: input.discoveredByType || 'manual_expand',
    id: Number.isInteger(numericId) ? numericId : null
  };
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} must contain positive integers`);
  }
  return number;
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
  expandManualRefs,
  manualExpansionCandidates
};
