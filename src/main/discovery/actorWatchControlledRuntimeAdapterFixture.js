const { openDatabase, migrate, closeDatabase } = require('../db/database');
const { EvidenceRepository } = require('../db/evidenceRepository');
const { planActorWatch } = require('../workers/actorWatchPlanner');
const { discoverActorRefs } = require('./zkillCandidateAcquisition');
const { pendingActorDiscovery } = require('./candidateRefMemory');
const {
  selectExpansionCandidates,
  markFailedExpansionCandidates,
  summarizeExpansionQueue
} = require('./expansionQueueSelection');
const { buildEvidencePackageFromRefs } = require('./esiBackedExpansionPackage');
const { buildActorWatchCompatibilitySummary } = require('./actorWatchCompatibilitySummary');

const ACTION = 'watch.actor_controlled_runtime_adapter_fixture.preview';

async function buildActorWatchControlledRuntimeAdapterFixtureProof(input = {}) {
  const now = input.now || '2026-06-08T00:00:00.000Z';
  const cases = {
    fresh_actor_candidate_acquisition: await runFixtureCase({
      caseName: 'fresh_actor_candidate_acquisition',
      now,
      input: {
        entityName: 'HS419 Fresh Actor',
        maxRefs: 5,
        maxExpansions: 2,
        fixtureRefs: [
          ref(400419001, 'hs419_fresh_hash_001'),
          ref(400419002, 'hs419_fresh_hash_002'),
          ref(400419003, 'hs419_fresh_hash_003')
        ]
      }
    }),
    pending_candidate_drain: await runFixtureCase({
      caseName: 'pending_candidate_drain',
      now,
      input: {
        entityName: 'HS419 Pending Actor',
        maxRefs: 5,
        maxExpansions: 2
      },
      seedPendingRefs: [
        ref(400419010, 'hs419_pending_hash_010'),
        ref(400419011, 'hs419_pending_hash_011')
      ]
    }),
    local_evidence_cache_skip: await runFixtureCase({
      caseName: 'local_evidence_cache_skip',
      now,
      input: {
        entityName: 'HS419 Cached Actor',
        maxRefs: 5,
        maxExpansions: 2,
        fixtureRefs: [
          ref(400419020, 'hs419_cached_hash_020'),
          ref(400419021, 'hs419_uncached_hash_021')
        ]
      },
      seedEvidenceKillmails: [ref(400419020, 'hs419_cached_hash_020')]
    }),
    expansion_failure: await runFixtureCase({
      caseName: 'expansion_failure',
      now,
      input: {
        entityName: 'HS419 Failure Actor',
        maxRefs: 5,
        maxExpansions: 1,
        fixtureRefs: [
          ref(400419030, 'hs419_failed_hash_030')
        ],
        fixtureEsiFailures: [{
          killmail_id: 400419030,
          code: 'FIXTURE_ESI_FAILURE',
          message: 'fixture selected-ref expansion failed'
        }]
      }
    })
  };

  return {
    action: ACTION,
    generated_at: now,
    fixture_only: true,
    disposable_db_only: true,
    disposable_db_path: ':memory:',
    uses_real_repository_methods: true,
    uses_injected_fake_clients_only: true,
    provider_calls: 0,
    live_api_calls: 0,
    fake_client_invocation_summary: summarizeFakeClients(cases),
    operator_corpus_mutated: false,
    production_actor_watch_redirected: false,
    runActorWatchService_changed: false,
    watchExecutor_dispatchFor_changed: false,
    collect_actor_watch_imported: false,
    collect_actor_watch_invoked: false,
    collect_actor_watch_retired: false,
    watch_cadence_mutated: false,
    watch_run_records_mutated: false,
    schema_changes: 0,
    dispatcher_queue_lease_behavior_changed: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    support_artifacts_created: 0,
    source_terms_renamed: false,
    protected_word_json_updated: false,
    repository_methods_proven: [
      'createFetchRun',
      'pendingDiscoveryRefs',
      'upsertDiscoveredKillmailRefs',
      'markDiscoveryRefsSelected',
      'markDiscoveryRefsFailed',
      'persistEvidencePackage',
      'markDiscoveryRefsExpanded',
      'markDiscoveryRefsCached',
      'insertWarning',
      'finalizeFetchRun'
    ],
    cases,
    non_invocation_proof: {
      route_body_file: 'src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js',
      collectActorWatch_imported: false,
      collectActorWatch_entered: false,
      actorWatchCollector_imported: false,
      production_actor_watch_redirected: false,
      runActorWatchService_runtime_changed: false,
      watchExecutor_dispatchFor_runtime_changed: false,
      WatchSessionExecutor_tick_invoked: false,
      TaskRunner_runDetachedTask_invoked: false
    },
    boundary: [
      'This proof mutates only internal disposable :memory: databases.',
      'Fake zKill/ESI clients are injected; no HttpClient, ZKillDiscoveryClient, EsiClient, or provider endpoint is used.',
      'Production actor.watch, runActorWatchService, watchExecutor.dispatchFor, and collectActorWatch remain unchanged.',
      'Candidate refs remain Discovery working memory / possible leads until disposable Evidence/EVEidence writer landing occurs.',
      'Evidence/EVEidence writer landing is proven only inside disposable fixture DBs.'
    ]
  };
}

async function runFixtureCase({ caseName, now, input, seedPendingRefs = [], seedEvidenceKillmails = [] }) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const repository = new EvidenceRepository(db);
    const payload = normalizeActorPayload({ now, ...input });
    const plannerOutput = planActorWatch(payload);
    const queueScope = {
      discoveredByType: 'actor',
      discoveredById: plannerOutput.actor.entity_id
    };

    seedPending(repository, seedPendingRefs, plannerOutput, `${caseName}_seed_pending`);
    seedEvidence(repository, seedEvidenceKillmails, plannerOutput, `${caseName}_seed_evidence`, now);

    const before = stateSnapshot(db);
    const fakeZkillClient = fixtureZkillClient(input);
    const fakeEsiClient = fixtureEsiClient(input);
    const fetchRun = repository.createFetchRun({
      runId: `hs419_${caseName}`,
      trigger: 'hs419_fixture',
      watchType: 'actor',
      watchId: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`
    });
    const pendingRefs = repository.pendingDiscoveryRefs({
      ...queueScope,
      limit: plannerOutput.caps.maxExpansions
    });
    const discovery = pendingRefs.length
      ? pendingActorDiscovery(pendingRefs, plannerOutput)
      : await discoverActorRefs(plannerOutput, fakeZkillClient);

    let refsWritten = 0;
    if (!pendingRefs.length) {
      refsWritten = repository.upsertDiscoveredKillmailRefs(discovery.expansionQueue, {
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
      esiClient: fakeEsiClient,
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
        message,
        created_at: now
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

    const after = stateSnapshot(db);
    return {
      case_name: caseName,
      disposable_db_path: ':memory:',
      actor_watch_input: payload,
      provider_calls: 0,
      live_api_calls: 0,
      fake_zkill_client_invocations: fakeZkillClient.invocations,
      fake_esi_client_invocations: fakeEsiClient.invocations,
      zkill_discovery_skipped: pendingRefs.length > 0,
      pending_refs_considered: pendingRefs.length,
      refs_written_to_disposable_discovery_memory: refsWritten,
      selected_refs_count: selection.selectedRefs.length,
      expanded_refs_count: evidencePackage.killmails.length,
      cached_refs_count: selection.skipCounts.cached + evidencePackage.run.already_cached,
      failed_refs_count: evidencePackage.run.failed_count,
      persisted_killmails: persistResult.killmailsWritten,
      activity_events_written: persistResult.eventsWritten,
      collection_warning_count: collectionWarnings.length,
      evidence_warning_count: evidencePackage.warnings.length,
      fetch_run_finalized: Boolean(db.prepare('SELECT finished_at FROM fetch_runs WHERE run_id = ?').get(fetchRun.run_id)?.finished_at),
      fetch_run_row: db.prepare('SELECT * FROM fetch_runs WHERE run_id = ?').get(fetchRun.run_id),
      discovery_ref_status_counts: discoveryStatusCounts(db),
      disposable_table_mutation_proof: {
        before,
        after,
        deltas: deltas(before, after),
        operator_corpus_mutated: false
      },
      compatibility_summary: compatibilitySummary,
      boundary_flags: {
        fake_clients_only: true,
        collectActorWatch_invoked: false,
        production_actor_watch_redirected: false,
        runActorWatchService_changed: false,
        watchExecutor_dispatchFor_changed: false,
        operator_db_written: false,
        live_provider_called: false
      }
    };
  } finally {
    closeDatabase(db);
  }
}

function seedPending(repository, refs, plannerOutput, runId) {
  if (!refs.length) {
    return;
  }
  repository.upsertDiscoveredKillmailRefs(refs, {
    runId,
    discoveredByType: 'actor',
    discoveredById: plannerOutput.actor.entity_id,
    sourceScope: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`,
    sourceActorType: plannerOutput.actor.entity_type,
    sourceActorId: plannerOutput.actor.entity_id
  });
}

function seedEvidence(repository, refs, plannerOutput, runId, now) {
  if (!refs.length) {
    return;
  }
  const run = repository.createFetchRun({
    runId,
    trigger: 'hs419_fixture_seed',
    watchType: 'actor',
    watchId: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`
  });
  const pkg = {
    run: {
      run_id: run.run_id,
      source_type: 'actor',
      source_id: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`,
      started_at: run.started_at
    },
    killmails: refs.map((item) => normalizedFixtureKillmail(item.killmail_id, item.hash, now).killmail),
    activity_events: [],
    entity_updates: [],
    ingestion_audits: [],
    warnings: []
  };
  const result = repository.persistEvidencePackage(pkg);
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: refs.length,
    already_cached: 0,
    expanded_new: result.killmailsWritten,
    failed_expansions: 0,
    activity_events_written: result.eventsWritten,
    api_calls_zkill: 0,
    api_calls_esi: 0
  }, 'success', null);
}

function normalizeActorPayload(input = {}) {
  return {
    entityType: input.entityType || input.entity_type || 'character',
    entityId: input.entityId ?? input.entity_id ?? 90000001,
    entityName: input.entityName || input.entity_name || 'HS419 Runtime Adapter Pilot',
    lookbackSeconds: input.lookbackSeconds ?? input.lookback_seconds ?? 1209600,
    maxRefs: input.maxRefs ?? input.max_refs ?? 5,
    maxExpansions: input.maxExpansions ?? input.max_expansions ?? 2,
    trigger: input.trigger || 'hs419_fixture'
  };
}

function stateSnapshot(db) {
  return {
    fetch_runs: count(db, 'fetch_runs'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    entities: count(db, 'entities'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    api_request_logs: count(db, 'api_request_logs'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function discoveryStatusCounts(db) {
  const rows = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM discovered_killmail_refs
    GROUP BY status
    ORDER BY status
  `).all();
  return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
}

function deltas(before, after) {
  return Object.fromEntries(Object.keys(after).map((key) => [key, after[key] - (before[key] || 0)]));
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

function summarizeFakeClients(cases) {
  return Object.fromEntries(Object.entries(cases).map(([name, value]) => [name, {
    fake_zkill_client_invocations: value.fake_zkill_client_invocations,
    fake_esi_client_invocations: value.fake_esi_client_invocations
  }]));
}

function ref(killmailId, hash) {
  return { killmail_id: Number(killmailId), hash };
}

function fixtureZkillClient(input = {}) {
  const refs = Array.isArray(input.fixtureRefs) ? input.fixtureRefs : [
    ref(400419001, 'hs419_default_hash_001'),
    ref(400419002, 'hs419_default_hash_002')
  ];
  return {
    invocations: 0,
    async discoverRefs() {
      this.invocations += 1;
      return refs.map((item) => ({ ...item }));
    }
  };
}

function fixtureEsiClient(input = {}) {
  const failures = new Map((input.fixtureEsiFailures || []).map((entry) => [Number(entry.killmail_id), entry]));
  return {
    invocations: 0,
    async expandKillmail(killmailId, hash) {
      this.invocations += 1;
      const failure = failures.get(Number(killmailId));
      if (failure) {
        const error = new Error(failure.message || 'fixture ESI-backed expansion failure');
        error.code = failure.code || 'FIXTURE_ESI_FAILURE';
        error.statusCode = failure.statusCode;
        throw error;
      }
      return rawFixtureKillmail(Number(killmailId), hash);
    }
  };
}

function rawFixtureKillmail(killmailId) {
  return {
    killmail_id: killmailId,
    killmail_time: '2026-06-08T00:00:00Z',
    solar_system_id: 30003597,
    victim: {
      character_id: 90000001,
      character_name: 'HS419 Fixture Victim',
      corporation_id: 98000001,
      corporation_name: 'HS419 Fixture Victim Corp',
      alliance_id: 99000001,
      alliance_name: 'HS419 Fixture Victim Alliance',
      ship_type_id: 587,
      ship_type_name: 'Rifter'
    },
    attackers: [{
      character_id: 90000002,
      character_name: 'HS419 Fixture Attacker',
      corporation_id: 98000002,
      corporation_name: 'HS419 Fixture Attackers',
      alliance_id: 99000002,
      alliance_name: 'HS419 Fixture Coalition',
      ship_type_id: 603,
      ship_type_name: 'Merlin',
      weapon_type_id: 2488,
      damage_done: 1200,
      final_blow: true
    }]
  };
}

function normalizedFixtureKillmail(killmailId, hash, now) {
  return {
    killmail: {
      killmail_id: Number(killmailId),
      killmail_hash: hash,
      killmail_time: '2026-06-08T00:00:00Z',
      solar_system_id: 30003597,
      raw_esi_payload: rawFixtureKillmail(Number(killmailId)),
      raw_payload_checksum: `fixture_checksum_${killmailId}`,
      source: 'esi',
      first_seen_at: now,
      last_seen_at: now,
      ingested_at: now
    }
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

module.exports = {
  ACTION,
  buildActorWatchControlledRuntimeAdapterFixtureProof
};
