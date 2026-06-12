const { EvidenceRepository } = require('../db/evidenceRepository');
const { HttpClient } = require('../api/httpClient');
const { ZKillDiscoveryClient } = require('../api/zkillClient');
const { EsiClient } = require('../api/esiClient');
const { normalizeKillmail } = require('../normalization/killmailNormalizer');
const { planActorWatch } = require('../workers/actorWatchPlanner');
const { discoverActorRefs } = require('./zkillCandidateAcquisition');
const { pendingActorDiscovery } = require('./candidateRefMemory');
const {
  selectExpansionCandidates,
  markFailedExpansionCandidates,
  summarizeExpansionQueue
} = require('./expansionQueueSelection');
const { buildActorWatchCompatibilitySummary } = require('./actorWatchCompatibilitySummary');

async function runActorWatchDirectBody(input, dependencies = {}) {
  const db = dependencies.db;
  if (!db) {
    throw new Error('actor.watch direct body requires a database');
  }

  const repository = dependencies.repository || new EvidenceRepository(db);
  const plannerOutput = planActorWatch(input);
  const fetchRun = repository.createFetchRun({
    trigger: input.trigger || 'actor.watch',
    watchType: 'actor',
    watchId: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`
  });
  const httpClient = dependencies.httpClient || new HttpClient({
    repository,
    runId: fetchRun.run_id,
    runType: 'collection',
    signal: dependencies.signal,
    timeoutMs: dependencies.timeoutMs,
    fetchImpl: dependencies.fetchImpl,
    maxAttempts: dependencies.maxAttempts
  });
  const zkillClient = dependencies.zkillClient || new ZKillDiscoveryClient(httpClient);
  const esiClient = dependencies.esiClient || new EsiClient(httpClient);
  const queueScope = {
    discoveredByType: 'actor',
    discoveredById: plannerOutput.actor.entity_id
  };

  try {
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
    const evidencePackage = await buildEvidencePackageFromRefsForDirectWatch({
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
    repository.markDiscoveryRefsFailed(
      selection.expansionQueue.filter((candidate) => candidate.skip_reason === 'failed'),
      undefined,
      queueScope
    );

    const persistResult = repository.persistEvidencePackage(evidencePackage);
    repository.markDiscoveryRefsExpanded(evidencePackage.killmails.map((killmail) => ({
      killmail_id: killmail.killmail_id,
      hash: killmail.killmail_hash
    })), undefined, queueScope);
    repository.markDiscoveryRefsCached(selection.expansionQueue
      .filter((candidate) => candidate.skip_reason === 'cached')
      .map((candidate) => ({ killmail_id: candidate.killmail_id, hash: candidate.hash })), queueScope);

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
        message
      });
    }

    const apiCounts = apiCountsForRun(db, fetchRun.run_id);
    const compatibilitySummary = buildActorWatchCompatibilitySummary({
      fetchRun,
      plannerOutput,
      discovery,
      selection,
      evidencePackage,
      persistResult,
      apiCounts,
      collectionWarnings,
      pendingRefs
    });
    repository.finalizeFetchRun(fetchRun.run_id, {
      discovered_refs: compatibilitySummary.zkill_refs_discovered,
      already_cached: compatibilitySummary.already_cached_killmails,
      expanded_new: compatibilitySummary.new_esi_expansions,
      failed_expansions: compatibilitySummary.failed_expansions,
      activity_events_written: compatibilitySummary.activity_events_written,
      api_calls_zkill: compatibilitySummary.api_calls_zkill,
      api_calls_esi: compatibilitySummary.api_calls_esi
    }, 'success', compatibilitySummary.warnings.length ? compatibilitySummary.warnings.join('; ') : null);

    return compatibilitySummary;
  } catch (error) {
    const apiCounts = apiCountsForRun(db, fetchRun.run_id);
    repository.finalizeFetchRun(fetchRun.run_id, {
      discovered_refs: 0,
      already_cached: 0,
      expanded_new: 0,
      failed_expansions: 1,
      activity_events_written: 0,
      api_calls_zkill: apiCounts.zkill,
      api_calls_esi: apiCounts.esi
    }, 'failed', error.message);
    throw error;
  }
}

async function buildEvidencePackageFromRefsForDirectWatch({ refs, repository, esiClient, run, discoveredBy }) {
  const output = {
    run: {
      run_id: run.run_id,
      source_type: run.source_type,
      source_id: run.source_id,
      started_at: run.started_at,
      finished_at: null,
      discovered_refs: refs.length,
      already_cached: 0,
      expanded_count: 0,
      failed_count: 0,
      warnings: []
    },
    killmails: [],
    activity_events: [],
    entity_updates: [],
    type_updates: [],
    ingestion_audits: [],
    warnings: []
  };

  for (const ref of refs) {
    if (repository.hasKillmail(ref.killmail_id)) {
      output.run.already_cached += 1;
      continue;
    }
    try {
      const rawKillmail = await esiClient.expandKillmail(ref.killmail_id, ref.hash);
      const normalized = normalizeKillmail(rawKillmail, {
        killmailHash: ref.hash,
        discoveredBy
      });
      output.killmails.push(normalized.killmail);
      output.activity_events.push(...normalized.activity_events);
      output.entity_updates.push(...normalized.entity_updates);
      output.ingestion_audits.push(normalized.ingestion_audit);
      output.warnings.push(...normalized.warnings);
      output.run.expanded_count += 1;
    } catch (error) {
      if (isFatalTransportError(error)) {
        throw error;
      }
      if (isProviderCapacityError(error)) {
        output.warnings.push({
          killmail_id: ref.killmail_id,
          warning_type: 'provider_capacity_deferred',
          message: error.message,
          created_at: new Date().toISOString()
        });
        continue;
      }
      output.run.failed_count += 1;
      output.warnings.push({
        killmail_id: ref.killmail_id,
        warning_type: 'failed_expansion',
        message: error.message,
        created_at: new Date().toISOString()
      });
    }
  }
  return output;
}

function isFatalTransportError(error) {
  return error?.code === 'HTTP_CANCELLED' ||
    error?.code === 'TASK_CANCELLED' ||
    error?.code === 'HTTP_TIMEOUT' ||
    error?.name === 'AbortError' ||
    error?.name === 'TimeoutError';
}

function isProviderCapacityError(error) {
  return error?.code === 'PROVIDER_CAPACITY_DEFERRED' ||
    error?.code === 'HTTP_RETRYABLE_CAPACITY' ||
    [420, 429, 503].includes(Number(error?.statusCode || error?.status_code));
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
    counts[row.provider] = Number(row.count);
  }
  return counts;
}

module.exports = {
  runActorWatchDirectBody,
  buildEvidencePackageFromRefsForDirectWatch
};
