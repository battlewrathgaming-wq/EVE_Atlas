const { openDatabase, migrate, closeDatabase } = require('../db/database');
const { EvidenceRepository } = require('../db/evidenceRepository');
const { actionGate } = require('../services/liveApiGateService');
const { resolveActorIdentity } = require('../resolution/actorResolver');
const { normalizeActorWatchScope } = require('../scopes/scopeControls');
const { planActorWatch } = require('../workers/actorWatchPlanner');
const { discoverActorRefs } = require('./zkillCandidateAcquisition');
const { pendingActorDiscovery } = require('./candidateRefMemory');
const {
  selectExpansionCandidates,
  markFailedExpansionCandidates,
  summarizeExpansionQueue
} = require('./expansionQueueSelection');
const { buildEvidencePackageFromRefs } = require('./esiBackedExpansionPackage');
const {
  buildActorWatchCompatibilitySummary,
  actorWatchCompatibilitySummaryFieldParity
} = require('./actorWatchCompatibilitySummary');

const ACTION = 'watch.actor_production_like_fake_client_direct_proof';

async function buildActorWatchProductionLikeFakeClientDirectProof(input = {}) {
  const now = input.now || '2026-06-11T00:00:00.000Z';
  const cases = {
    fresh_direct_actor_watch: await runFixtureOwnedCase({
      caseName: 'fresh_direct_actor_watch',
      now,
      payload: {
        entityType: 'character',
        entityId: 90043301,
        entityName: 'HS433 Fresh Direct Actor',
        maxRefs: 5,
        maxExpansions: 2,
        fixtureRefs: [
          ref(400433001, 'hs433_fresh_hash_001'),
          ref(400433002, 'hs433_fresh_hash_002'),
          ref(400433003, 'hs433_fresh_hash_003')
        ]
      }
    }),
    pending_direct_actor_watch: await runFixtureOwnedCase({
      caseName: 'pending_direct_actor_watch',
      now,
      payload: {
        entityType: 'character',
        entityId: 90043302,
        entityName: 'HS433 Pending Direct Actor',
        maxRefs: 5,
        maxExpansions: 2
      },
      seedPendingRefs: [
        ref(400433010, 'hs433_pending_hash_010'),
        ref(400433011, 'hs433_pending_hash_011')
      ]
    }),
    cached_direct_actor_watch: await runFixtureOwnedCase({
      caseName: 'cached_direct_actor_watch',
      now,
      payload: {
        entityType: 'character',
        entityId: 90043303,
        entityName: 'HS433 Cached Direct Actor',
        maxRefs: 5,
        maxExpansions: 2,
        fixtureRefs: [
          ref(400433020, 'hs433_cached_hash_020'),
          ref(400433021, 'hs433_uncached_hash_021')
        ]
      },
      seedEvidenceKillmails: [ref(400433020, 'hs433_cached_hash_020')]
    }),
    failed_direct_actor_watch: await runFixtureOwnedCase({
      caseName: 'failed_direct_actor_watch',
      now,
      payload: {
        entityType: 'character',
        entityId: 90043304,
        entityName: 'HS433 Failed Direct Actor',
        maxRefs: 5,
        maxExpansions: 1,
        fixtureRefs: [
          ref(400433030, 'hs433_failed_hash_030')
        ],
        fixtureEsiFailures: [{
          killmail_id: 400433030,
          code: 'FIXTURE_ESI_FAILURE',
          message: 'fixture selected-ref expansion failed'
        }]
      }
    })
  };

  return {
    action: ACTION,
    generated_at: now,
    production_like_direct_body: true,
    fixture_only: true,
    fixture_owned_db_only: true,
    disposable_db_path: ':memory:',
    uses_injected_fake_clients_only: true,
    provider_calls: 0,
    live_api_calls: 0,
    production_actor_watch_redirected: false,
    runActorWatchService_production_call_target_changed: false,
    watchExecutor_dispatchFor_changed: false,
    production_direct_redirect_status: {
      actor_watch_redirected_after_hs440: true,
      runtime_entry_point: 'runActorWatchService',
      runActorWatchService_call_target: 'runActorWatchDirectBody'
    },
    scheduled_runtime_status: {
      scheduled_actor_watch_redirected_after_hs446: true,
      current_runner: 'runScheduledActorWatch',
      legacy_collectActorWatch_still_available: true,
      system_radius_current_runner: 'collectSystemRadiusWatch'
    },
    collector_retired: false,
    hydration_writes: 0,
    observation_report_paths_touched: false,
    schema_changes: 0,
    dispatcher_queue_lease_behavior_changed: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    source_terms_renamed: false,
    protected_word_json_updated: false,
    direct_body_shape: [
      'resolve actor input against fixture DB',
      'normalize actor Watch scope with current scope controls',
      'represent actor.watch live-gate expectations without entering provider attempt control',
      'plan actor Watch acquisition',
      'prefer pending Discovery refs before fresh fixture zKill candidate acquisition',
      'select refs for ESI-backed expansion',
      'land Evidence/EVEidence through EvidenceRepository in fixture DB',
      'return caller compatibility summary from boundary-owned helper'
    ],
    api_request_count_posture: {
      represented: true,
      fixture_synthetic_logs: true,
      http_client_logging_parity_proven: false,
      limitation: 'Injected fake clients insert fixture api_request_logs for count posture; they do not exercise HttpClient/ZKillDiscoveryClient/EsiClient transport logging.'
    },
    cases,
    compatibility_summary_field_parity: actorWatchCompatibilitySummaryFieldParity(cases.fresh_direct_actor_watch.compatibility_summary),
    non_invocation_proof: {
      proof_body_file: 'src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js',
      mixed_collector_imported: false,
      mixed_collector_called: false,
      production_actor_watch_redirected: false,
      scheduled_actor_watch_redirected_by_this_proof: false
    }
  };
}

async function runFixtureOwnedCase({ caseName, now, payload, seedPendingRefs = [], seedEvidenceKillmails = [] }) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const repository = new EvidenceRepository(db);
    seedPending(repository, seedPendingRefs, payload, `${caseName}_seed_pending`);
    seedEvidence(repository, seedEvidenceKillmails, payload, `${caseName}_seed_evidence`, now);
    const before = stateSnapshot(db);
    const result = await runActorWatchProductionLikeDirectBody(db, payload, {
      now,
      repository,
      zkillClientFactory: ({ runId }) => fixtureZkillClient({ ...payload, repository, runId }),
      esiClientFactory: ({ runId }) => fixtureEsiClient({ ...payload, repository, runId })
    });
    const after = stateSnapshot(db);
    return {
      case_name: caseName,
      ...result,
      disposable_table_mutation_proof: {
        before,
        after,
        deltas: deltas(before, after),
        operator_corpus_mutated: false
      }
    };
  } finally {
    closeDatabase(db);
  }
}

async function runActorWatchProductionLikeDirectBody(db, payload = {}, dependencies = {}) {
  const repository = dependencies.repository || new EvidenceRepository(db);
  const actor = await resolveActorIdentity(db, {
    entityType: payload.entityType || payload.entity_type || 'character',
    entityId: payload.entityId ?? payload.entity_id,
    entityName: payload.entityName || payload.entity_name || payload.actorName || payload.actor_name
  }, { trigger: 'hs433_fixture_resolution' });
  const input = normalizeActorWatchScope({
    ...payload,
    entityType: actor.entity_type,
    entityId: actor.entity_id,
    entityName: actor.entity_name
  });
  const liveGate = actionGate('actor.watch', input, { now: dependencies.now });
  const plannerOutput = planActorWatch(input);
  const fetchRun = repository.createFetchRun({
    runId: `hs433_${payload.caseName || actor.entity_id}_${Date.now()}`,
    trigger: payload.trigger || 'hs433_production_like_fake_client_direct_proof',
    watchType: 'actor',
    watchId: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`
  });
  const zkillClient = dependencies.zkillClient || dependencies.zkillClientFactory?.({ runId: fetchRun.run_id });
  const esiClient = dependencies.esiClient || dependencies.esiClientFactory?.({ runId: fetchRun.run_id });
  if (!zkillClient || !esiClient) {
    throw new Error('HS433 direct proof requires injected fake zKill and ESI clients');
  }

  const queueScope = {
    discoveredByType: 'actor',
    discoveredById: plannerOutput.actor.entity_id
  };
  const pendingRefs = repository.pendingDiscoveryRefs({
    ...queueScope,
    limit: plannerOutput.caps.maxExpansions
  });
  const discovery = pendingRefs.length
    ? pendingActorDiscovery(pendingRefs, plannerOutput)
    : await discoverActorRefs(plannerOutput, zkillClient);

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
      message,
      created_at: dependencies.now
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

  return {
    actor_resolution: actor,
    normalized_actor_watch_input: input,
    live_gate_posture: {
      action: 'actor.watch',
      mode: liveGate.mode,
      providers: liveGate.providers,
      allowed_in_current_environment: liveGate.allowed,
      blockers: liveGate.blockers,
      request_control_recorded: false,
      production_provider_attempt_entered: false
    },
    provider_calls: 0,
    live_api_calls: 0,
    fake_zkill_client_invocations: zkillClient.invocations,
    fake_esi_client_invocations: esiClient.invocations,
    zkill_discovery_skipped: pendingRefs.length > 0,
    pending_refs_considered: pendingRefs.length,
    refs_written_to_fixture_discovery_memory: refsWritten,
    selected_refs_count: selection.selectedRefs.length,
    expanded_refs_count: evidencePackage.killmails.length,
    cached_refs_count: selection.skipCounts.cached + evidencePackage.run.already_cached,
    failed_refs_count: evidencePackage.run.failed_count,
    persisted_killmails: persistResult.killmailsWritten,
    activity_events_written: persistResult.eventsWritten,
    collection_warning_count: collectionWarnings.length,
    evidence_warning_count: evidencePackage.warnings.length,
    api_request_log_posture: {
      synthetic_fixture_logs: true,
      zkill: apiCounts.zkill,
      esi: apiCounts.esi,
      http_client_logging_parity_proven: false
    },
    fetch_run_finalized: Boolean(db.prepare('SELECT finished_at FROM fetch_runs WHERE run_id = ?').get(fetchRun.run_id)?.finished_at),
    fetch_run_row: db.prepare('SELECT * FROM fetch_runs WHERE run_id = ?').get(fetchRun.run_id),
    discovery_ref_status_counts: discoveryStatusCounts(db),
    compatibility_summary: compatibilitySummary,
    compatibility_summary_field_parity: actorWatchCompatibilitySummaryFieldParity(compatibilitySummary),
    boundary_flags: {
      fake_clients_only: true,
      mixed_collector_invoked: false,
      production_actor_watch_redirected: false,
      runActorWatchService_changed: false,
      watchExecutor_dispatchFor_changed: false,
      operator_db_written: false,
      live_provider_called: false,
      hydration_written: false,
      observation_path_touched: false,
      schema_changed: false
    }
  };
}

function seedPending(repository, refs, payload, runId) {
  if (!refs.length) {
    return;
  }
  const entityType = payload.entityType || payload.entity_type || 'character';
  const entityId = Number(payload.entityId ?? payload.entity_id);
  repository.upsertDiscoveredKillmailRefs(refs, {
    runId,
    discoveredByType: 'actor',
    discoveredById: entityId,
    sourceScope: `${entityType}:${entityId}`,
    sourceActorType: entityType,
    sourceActorId: entityId
  });
}

function seedEvidence(repository, refs, payload, runId, now) {
  if (!refs.length) {
    return;
  }
  const entityType = payload.entityType || payload.entity_type || 'character';
  const entityId = Number(payload.entityId ?? payload.entity_id);
  const run = repository.createFetchRun({
    runId,
    trigger: 'hs433_fixture_seed',
    watchType: 'actor',
    watchId: `${entityType}:${entityId}`
  });
  const pkg = {
    run: {
      run_id: run.run_id,
      source_type: 'actor',
      source_id: `${entityType}:${entityId}`,
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

function fixtureZkillClient(input = {}) {
  const refs = Array.isArray(input.fixtureRefs) ? input.fixtureRefs : [
    ref(400433001, 'hs433_default_hash_001'),
    ref(400433002, 'hs433_default_hash_002')
  ];
  return {
    invocations: 0,
    async discoverRefs(request) {
      this.invocations += 1;
      input.repository.insertApiRequestLog({
        run_id: input.runId,
        run_type: 'collection',
        provider: 'zkill',
        endpoint: `/fixture/${request.targetType}/${request.targetId}`,
        method: 'GET',
        status_code: 200,
        duration_ms: 1,
        cache_status: 'fixture',
        requested_at: '2026-06-11T00:00:00.000Z'
      });
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
      input.repository.insertApiRequestLog({
        run_id: input.runId,
        run_type: 'collection',
        provider: 'esi',
        endpoint: `/fixture/killmails/${killmailId}/${hash}`,
        method: 'GET',
        status_code: failure?.statusCode || (failure ? 500 : 200),
        duration_ms: 1,
        cache_status: 'fixture',
        error_message: failure?.message || null,
        requested_at: '2026-06-11T00:00:00.000Z'
      });
      if (failure) {
        const error = new Error(failure.message || 'fixture ESI-backed expansion failure');
        error.code = failure.code || 'FIXTURE_ESI_FAILURE';
        error.statusCode = failure.statusCode;
        throw error;
      }
      return rawFixtureKillmail(Number(killmailId));
    }
  };
}

function rawFixtureKillmail(killmailId) {
  return {
    killmail_id: killmailId,
    killmail_time: '2026-06-11T00:00:00Z',
    solar_system_id: 30003597,
    victim: {
      character_id: 90043301,
      character_name: 'HS433 Fixture Victim',
      corporation_id: 98043301,
      corporation_name: 'HS433 Fixture Victim Corp',
      alliance_id: 99043301,
      alliance_name: 'HS433 Fixture Victim Alliance',
      ship_type_id: 587,
      ship_type_name: 'Rifter'
    },
    attackers: [{
      character_id: 90043302,
      character_name: 'HS433 Fixture Attacker',
      corporation_id: 98043302,
      corporation_name: 'HS433 Fixture Attackers',
      alliance_id: 99043302,
      alliance_name: 'HS433 Fixture Coalition',
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
      killmail_time: '2026-06-11T00:00:00Z',
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

function deltas(before, after) {
  return Object.fromEntries(Object.keys(after).map((key) => [key, after[key] - (before[key] || 0)]));
}

function ref(killmailId, hash) {
  return { killmail_id: Number(killmailId), hash };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

module.exports = {
  ACTION,
  buildActorWatchProductionLikeFakeClientDirectProof,
  runActorWatchProductionLikeDirectBody
};
