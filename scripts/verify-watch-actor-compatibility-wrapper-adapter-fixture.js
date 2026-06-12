const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildWatchActorCompatibilityWrapperAdapterFixturePreview } = require('../src/main/services/watchActorCompatibilityWrapperAdapterFixtureService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-07T21:00:00.000Z';

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('refs found and selected', null, {
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, verifyRefsFound);
    await verifyCase('no refs', null, {
      fixtureOutcomes: ['complete_no_refs']
    }, verifyNoRefs);
    await verifyCase('malformed candidate', null, {
      fixtureCandidateRefs: [{
        killmail_id: null,
        killmail_hash: null,
        source_lane: 'watch',
        source_kind: 'actor',
        scope_key: 'actor:character:90000001',
        pickup_packet_index: 0
      }]
    }, verifyMalformed);
    await verifyCase('duplicate candidate', null, {
      maxHandoffCandidates: 4,
      fixtureOutcomes: [{
        outcome: 'complete_refs_found',
        candidate_ref_handles: [duplicateCandidate(), duplicateCandidate()]
      }]
    }, verifyDuplicate);
    await verifyCase('capped/not selected candidate', null, {
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, verifyCapped);
    await verifyCase('provider deferred', null, {
      fixtureOutcomes: ['provider_deferred']
    }, verifyDeferred);
    await verifyCase('local Evidence cache skip', seedCachedEvidence, {
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, verifyLocalCacheSkip);
    await verifyCase('retryable ESI-backed failure', null, {
      fixtureOutcomes: ['complete_refs_found'],
      fixtureEsiExpansionOutcomes: [{
        killmail_id: 400349001,
        killmail_hash: 'hs349_actor_stub_hash_001',
        outcome: 'failed_retryable'
      }]
    }, verifyRetryableFailure);
    await verifyCase('terminal ESI-backed failure', null, {
      fixtureOutcomes: ['complete_refs_found'],
      fixtureEsiExpansionOutcomes: [{
        killmail_id: 400349001,
        killmail_hash: 'hs349_actor_stub_hash_001',
        outcome: 'failed_terminal'
      }]
    }, verifyTerminalFailure);
    await verifyServiceCommand();

    console.log(JSON.stringify({
      status: 'Actor Watch compatibility wrapper adapter fixture preview validated',
      command: 'watch.actor_compatibility_wrapper_adapter_fixture.preview',
      sample_refs_found: await sample(null, {
        maxHandoffCandidates: 1,
        fixtureOutcomes: ['complete_refs_found']
      }),
      sample_cache_skip: await sample(seedCachedEvidence, {
        maxHandoffCandidates: 1,
        fixtureOutcomes: ['complete_refs_found']
      }),
      sample_retryable_failure: await sample(null, {
        fixtureOutcomes: ['complete_refs_found'],
        fixtureEsiExpansionOutcomes: [{
          killmail_id: 400349001,
          killmail_hash: 'hs349_actor_stub_hash_001',
          outcome: 'failed_retryable'
        }]
      })
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Actor Watch compatibility wrapper adapter fixture preview validated');
}

async function verifyCase(label, seedExtra, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorWatch(db);
    if (typeof seedExtra === 'function') {
      seedExtra(db);
    }
    const before = sideEffectCounts(db);
    const proof = buildWatchActorCompatibilityWrapperAdapterFixturePreview(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      ...input
    });
    const after = sideEffectCounts(db);
    verifyBoundary(proof, label);
    verifyAdapterShape(proof);
    verifier(proof);
    assertSame(after, before, `${label} should not mutate local rows`);
    assert(proof.table_mutation_proof.unchanged === true, `${label} should include unchanged table proof`);
  } finally {
    closeDatabase(db);
  }
}

async function verifyServiceCommand() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorWatch(db);
    const before = sideEffectCounts(db);
    const result = await invokeServiceCommand('watch.actor_compatibility_wrapper_adapter_fixture.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, { db });
    const after = sideEffectCounts(db);
    verifyBoundary(result, 'service command');
    verifyAdapterShape(result);
    verifyRefsFound(result);
    assertSame(after, before, 'service command should not mutate local rows');
  } finally {
    closeDatabase(db);
  }
}

async function sample(seedExtra, input) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorWatch(db);
    if (typeof seedExtra === 'function') {
      seedExtra(db);
    }
    const proof = buildWatchActorCompatibilityWrapperAdapterFixturePreview(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      ...input
    });
    return {
      wrapper_status: proof.wrapper_status,
      adapter_fixture_result: proof.adapter_fixture_result,
      old_result_compatibility_map: proof.old_result_compatibility_map,
      hs381_contract_expectation_map: proof.hs381_contract_expectation_map,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyAdapterShape(proof) {
  const result = proof.adapter_fixture_result;
  assert(proof.wrapper_status === 'adapter_fixture_only_not_active', 'adapter should be fixture-only inactive');
  assert(proof.contract_basis_action === 'watch.actor_compatibility_wrapper_contract.preview', 'adapter should use HS381 contract basis');
  assert(proof.old_entry_point === 'actor.watch', 'old entry point should be actor.watch');
  assert(result.adapter_fixture_metadata.adapter_status === 'fixture_only_non_authoritative', 'adapter result should be non-authoritative fixture');
  assert(result.adapter_fixture_metadata.old_collector_semantics_claimed_replaced === false, 'adapter should not claim old collector semantics fully replaced');
  assert(result.adapter_fixture_metadata.actor_watch_redirected === false, 'adapter should not redirect actor.watch');
  assert(result.adapter_fixture_metadata.collectActorWatch_invoked === false, 'adapter should not invoke collectActorWatch');
  assert(result.adapter_fixture_metadata.collectActorWatch_retired === false, 'adapter should not retire collectActorWatch');
  assert(result.actor.entity_id === 90000001, 'adapter result should include actor identity');
  assert(result.collection_plan.requested_window.lookback_seconds === 1209600, 'adapter result should include lookback window');
  assert(result.collection_plan.caps.max_refs === 5, 'adapter result should include max refs');
  assert(result.collection_plan.caps.max_expansions === 5, 'adapter result should include max expansions');
  assert(result.api_calls_zkill === 0, 'adapter result should report zero zKill API calls');
  assert(result.api_calls_esi === 0, 'adapter result should report zero ESI API calls');
  assert(result.persisted_killmails === 0, 'adapter result should not persist killmails');
  assert(result.activity_events_written === 0, 'adapter result should not write activity events');
  assert(proof.old_result_compatibility_map.represented_by_adapter_fixture.some((entry) => entry.field === 'actor'), 'compatibility map should include actor');
  assert(proof.old_result_compatibility_map.represented_only_approximately.some((entry) => entry.field === 'warnings'), 'compatibility map should mark warnings approximate');
  assert(proof.old_result_compatibility_map.not_represented_yet.includes('real fetch_runs run_id and lifecycle'), 'compatibility map should park fetch_runs lifecycle');
  assert(proof.old_result_compatibility_map.deliberately_parked.includes('actor.watch redirect'), 'compatibility map should park redirect');
  assert(proof.hs381_contract_expectation_map.adapter_preserves_candidate_lead_boundary === true, 'adapter should preserve candidate lead boundary');
  assert(proof.accepted_model.candidate_refs_are_evidence === false, 'candidate refs should not be Evidence/EVEidence');
  assert(proof.accepted_model.esi_backed_expansion_is_hydration === false, 'ESI-backed expansion should not be Hydration');
}

function verifyRefsFound(proof) {
  assert(proof.adapter_fixture_result.zkill_refs_discovered >= 1, 'refs-found case should map discovered refs count');
  assert(proof.adapter_fixture_result.expansion_attempted >= 1, 'refs-found case should map selected expansion count');
  assert(proof.adapter_fixture_result.expansion_queue.length >= 1, 'refs-found case should map expansion queue');
}

function verifyNoRefs(proof) {
  assert(proof.adapter_fixture_result.zkill_refs_discovered === 0, 'no-ref case should map zero discovered refs');
  assert(proof.adapter_fixture_result.warnings.includes('fixture_no_candidate_refs_available'), 'no-ref case should include no-ref warning');
}

function verifyMalformed(proof) {
  assert(proof.adapter_fixture_result.malformed_refs_removed >= 1, 'malformed case should map malformed refs removed');
  assert(proof.adapter_fixture_result.warnings.includes('fixture_malformed_candidate_refs_present'), 'malformed case should include malformed warning');
}

function verifyDuplicate(proof) {
  assert(proof.adapter_fixture_result.duplicate_refs_removed >= 1, 'duplicate case should map duplicate refs removed');
  assert(proof.adapter_fixture_result.warnings.includes('fixture_duplicate_candidate_refs_present'), 'duplicate case should include duplicate warning');
}

function verifyCapped(proof) {
  assert(proof.adapter_fixture_result.expansion_cap_skipped >= 1, 'capped case should map cap skipped');
  assert(proof.adapter_fixture_result.warnings.includes('fixture_acquisition_or_handoff_capped_not_full_coverage'), 'capped case should include cap warning');
}

function verifyDeferred(proof) {
  assert(proof.adapter_fixture_result.expansion_queue_summary.deferred >= 1, 'deferred case should map deferred posture');
  assert(proof.adapter_fixture_result.warnings.includes('fixture_provider_deferred_before_expansion'), 'deferred case should include deferred warning');
}

function verifyLocalCacheSkip(proof) {
  assert(proof.adapter_fixture_result.already_cached_killmails >= 1, 'local cache case should map already cached killmails');
  assert(proof.adapter_fixture_result.warnings.includes('fixture_local_evidence_eveidence_cache_skip'), 'local cache case should include cache skip warning');
}

function verifyRetryableFailure(proof) {
  assert(proof.adapter_fixture_result.failed_expansions >= 1, 'retryable case should map failed expansions');
  assert(proof.adapter_fixture_result.warnings.includes('fixture_retryable_esi_backed_expansion_failure'), 'retryable case should include retryable warning');
}

function verifyTerminalFailure(proof) {
  assert(proof.adapter_fixture_result.failed_expansions >= 1, 'terminal case should map failed expansions');
  assert(proof.adapter_fixture_result.warnings.includes('fixture_terminal_esi_backed_expansion_failure'), 'terminal case should include terminal warning');
}

function verifyBoundary(proof, label) {
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.fixture_only === true, `${label} should be fixture-only`);
  assert(proof.adapter_fixture_only === true, `${label} should be adapter fixture only`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not make live/API calls`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.watch_execution === false, `${label} should not execute Watch`);
  assert(proof.watch_dispatches === 0, `${label} should not dispatch Watch`);
  assert(proof.mixed_collectors_invoked === false, `${label} should not invoke mixed collectors`);
  assert(proof.collect_actor_watch_invoked === false, `${label} should not invoke collectActorWatch`);
  assert(proof.non_invocation_proof.runActorWatchService_runtime_changed === false, `${label} should not change runActorWatchService`);
  assert(proof.non_invocation_proof.watchExecutor_dispatchFor_runtime_changed === false, `${label} should not change watchExecutor.dispatchFor`);
  assert(Array.isArray(proof.task_runner_methods_called) && proof.task_runner_methods_called.length === 0, `${label} should not call TaskRunner methods`);
  assert(proof.tasks_created === 0, `${label} should not create tasks`);
  assert(proof.queue_created === false, `${label} should not create queue`);
  assert(proof.dispatcher_created === false, `${label} should not create dispatcher`);
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.discovery_refs_written === false, `${label} should not write Discovery refs`);
  assert(proof.discovered_killmail_refs_written === 0, `${label} should not write discovered_killmail_refs`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence/EVEidence`);
  assert(proof.evidence_landing_performed === false, `${label} should not land Evidence/EVEidence`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration`);
  assert(proof.metadata_writes === 0, `${label} should not write metadata`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.data_quality_warning_writes === 0, `${label} should not write warnings`);
  assert(proof.fetch_run_writes === 0, `${label} should not write fetch_runs`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.support_artifacts_created === 0, `${label} should not create support artifacts`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.actor_watch_redirected === false, `${label} should not redirect actor.watch`);
  assert(proof.runActorWatchService_changed === false, `${label} should not change runActorWatchService`);
  assert(proof.watchExecutor_dispatchFor_changed === false, `${label} should not change watchExecutor.dispatchFor`);
  assert(proof.mixed_collector_retired === false, `${label} should not retire collectors`);
  assert(proof.boundary_flags.system_radius_behavior_changed === false, `${label} should not change system/radius behavior`);
  assert(proof.boundary_flags.protected_words_updated === false, `${label} should not update protected words`);
}

function insertActorWatch(db) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 'character', 90000001, 'Wrapper Adapter Pilot', 14, 5, 1, 60, null, null, null, null, null, 'HS383 compatibility adapter fixture');
}

function seedCachedEvidence(db) {
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id,
      raw_esi_payload, raw_payload_checksum, source,
      first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(400349001, 'hs349_actor_stub_hash_001', NOW, 30003597, '{}', 'fixture_checksum', 'fixture', NOW, NOW, NOW);
}

function duplicateCandidate() {
  return {
    killmail_id: 900383001,
    killmail_hash: 'hs383_duplicate_hash',
    source_lane: 'watch',
    source_kind: 'actor',
    scope_key: 'actor:character:90000001'
  };
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    entities: count(db, 'entities'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
