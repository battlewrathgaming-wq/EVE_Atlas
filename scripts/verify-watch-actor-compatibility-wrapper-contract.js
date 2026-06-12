const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildWatchActorCompatibilityWrapperContractPreview } = require('../src/main/services/watchActorCompatibilityWrapperContractService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-07T20:00:00.000Z';

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('refs found and selected', null, {
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, verifyRefsFoundSelected);
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
      status: 'Actor Watch compatibility wrapper contract preview validated',
      command: 'watch.actor_compatibility_wrapper_contract.preview',
      sample_refs_found: await sample(null, {
        maxHandoffCandidates: 1,
        fixtureOutcomes: ['complete_refs_found']
      }),
      sample_deferred: await sample(null, { fixtureOutcomes: ['provider_deferred'] }),
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
  console.log('Actor Watch compatibility wrapper contract preview validated');
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
    const proof = buildWatchActorCompatibilityWrapperContractPreview(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      ...input
    });
    const after = sideEffectCounts(db);
    verifyBoundary(proof, label);
    verifyContractShape(proof);
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
    const result = await invokeServiceCommand('watch.actor_compatibility_wrapper_contract.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, { db });
    const after = sideEffectCounts(db);
    verifyBoundary(result, 'service command');
    verifyContractShape(result);
    verifyRefsFoundSelected(result);
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
    const proof = buildWatchActorCompatibilityWrapperContractPreview(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      ...input
    });
    return {
      wrapper_status: proof.wrapper_status,
      direct_command_path_basis: proof.direct_command_path_basis,
      scheduled_dispatch_path_basis: proof.scheduled_dispatch_path_basis,
      future_boundary_owned_stages: proof.future_boundary_owned_stages.map((stage) => ({
        stage: stage.stage,
        owner: stage.owner,
        invoked: stage.invoked === true,
        provider_calls: stage.provider_calls || 0,
        evidence_writes: stage.evidence_writes || 0,
        watch_mutations: stage.watch_mutations || 0
      })),
      candidate_compatibility_result: proof.candidate_compatibility_result,
      legacy_summary_mapping: proof.legacy_summary_mapping,
      composed_proof_surfaces: proof.composed_proof_surfaces,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyContractShape(proof) {
  assert(proof.wrapper_status === 'contract_only_not_active', 'wrapper status should be contract-only inactive');
  assert(proof.old_entry_point === 'actor.watch', 'old entry point should be actor.watch');
  assert(proof.current_retire_candidate === 'collectActorWatch', 'retire candidate should be collectActorWatch');
  assert(proof.direct_command_path_basis.source_function === 'runActorWatchService', 'direct basis should name runActorWatchService');
  assert(proof.direct_command_path_basis.current_path.includes('runActorWatchDirectBody(input, { ...dependencies, db })'), 'direct basis should disclose current direct body path');
  assert(proof.direct_command_path_basis.collectActorWatch_status === 'legacy_compatibility_available_retirement_candidate', 'direct basis should park collectActorWatch as legacy compatibility');
  assert(proof.direct_command_path_basis.collectActorWatch_invoked === false, 'direct basis should not invoke collectActorWatch');
  assert(proof.scheduled_dispatch_path_basis.source_function === 'watchExecutor.dispatchFor', 'scheduled basis should name watchExecutor.dispatchFor');
  assert(proof.scheduled_dispatch_path_basis.sends_for_actor_watch.command === 'actor.watch', 'scheduled basis should send actor.watch');
  assert(proof.scheduled_dispatch_path_basis.current_runner === 'runScheduledActorWatch', 'scheduled basis should name runScheduledActorWatch as current runner');
  assert(proof.scheduled_dispatch_path_basis.runner_call_target === 'runActorWatchDirectBody', 'scheduled basis should disclose direct body runner call target');
  assert(proof.scheduled_dispatch_path_basis.collectActorWatch_status === 'legacy_compatibility_available_retirement_candidate', 'scheduled basis should park collectActorWatch as legacy compatibility');
  assert(proof.scheduled_dispatch_path_basis.runner_invoked === false, 'scheduled basis should not invoke runner');
  assert(proof.candidate_compatibility_result.actor_target_identity.entity_id === 90000001, 'actor identity should be represented');
  assert(proof.candidate_compatibility_result.lookback_seconds === 1209600, 'lookback should be represented');
  assert(proof.candidate_compatibility_result.max_refs === 5, 'max refs should be represented');
  assert(proof.candidate_compatibility_result.max_expansions === 5, 'max expansions should be represented');
  assert(proof.future_boundary_owned_stages.map((stage) => stage.owner).includes('Discovery'), 'Discovery stage should be represented');
  assert(proof.future_boundary_owned_stages.map((stage) => stage.owner).includes('Evidence/EVEidence writer'), 'Evidence writer boundary should be represented');
  assert(proof.accepted_model.candidate_refs_are_possible_leads === true, 'candidate refs should remain possible leads');
  assert(proof.accepted_model.candidate_refs_are_evidence === false, 'candidate refs should not become Evidence/EVEidence');
  assert(proof.accepted_model.esi_backed_expansion_is_hydration === false, 'ESI-backed expansion should not be Hydration');
  assert(proof.accepted_model.evidence_eveidence_writer_invoked === false, 'Evidence/EVEidence writer should not be invoked');
  assert(proof.legacy_summary_mapping.represented_now.includes('old entry point actor.watch remains registered and unchanged'), 'legacy mapping should disclose old entry point unchanged');
  assert(proof.legacy_summary_mapping.represented_now.includes('collectActorWatch is identified as parked legacy compatibility and current retire candidate without invocation or retirement'), 'legacy mapping should disclose collectActorWatch parked status');
  assert(proof.legacy_summary_mapping.not_represented_yet.includes('live zKill provider execution'), 'legacy mapping should park live zKill');
  assert(proof.legacy_summary_mapping.intentionally_parked.includes('collectActorWatch retirement'), 'legacy mapping should park collector retirement');
}

function verifyRefsFoundSelected(proof) {
  const result = proof.candidate_compatibility_result;
  assert(result.zkill_provider_target_shape.provider === 'zkill', 'refs-found case should expose zKill provider target');
  assert(result.candidate_ref_posture.refs_found_count >= 1, 'refs-found case should count found candidate refs');
  assert(result.selected_esi_backed_expansion_intake_candidates.length >= 1, 'refs-found case should expose selected ESI-backed intake candidates');
}

function verifyNoRefs(proof) {
  assert(proof.candidate_compatibility_result.candidate_ref_posture.none_count === 1, 'no-ref case should count no refs');
  assert(proof.candidate_compatibility_result.selected_esi_backed_expansion_intake_candidates.length === 0, 'no-ref case should not expose selected ESI-backed candidates');
}

function verifyMalformed(proof) {
  assert(proof.candidate_compatibility_result.candidate_ref_posture.malformed_count >= 1, 'malformed case should count malformed candidates');
}

function verifyDuplicate(proof) {
  assert(proof.candidate_compatibility_result.candidate_ref_posture.duplicate_count >= 1, 'duplicate case should count duplicates');
}

function verifyCapped(proof) {
  assert(proof.candidate_compatibility_result.candidate_ref_posture.capped_or_not_selected_count >= 1, 'capped case should count capped/not-selected posture');
}

function verifyDeferred(proof) {
  assert(proof.candidate_compatibility_result.candidate_ref_posture.deferred_count >= 1, 'deferred case should count deferred posture');
}

function verifyLocalCacheSkip(proof) {
  assert(proof.candidate_compatibility_result.local_evidence_eveidence_cache_skip_posture.represented === true, 'local cache case should represent cache skip');
  assert(proof.candidate_compatibility_result.local_evidence_eveidence_cache_skip_posture.future_esi_needed_for_cached_candidates === false, 'local cache skip should not need future ESI for cached candidates');
}

function verifyRetryableFailure(proof) {
  assert(proof.candidate_compatibility_result.retryable_esi_backed_expansion_failure_posture_fixture_only.represented === true, 'retryable failure should be represented fixture-only');
}

function verifyTerminalFailure(proof) {
  assert(proof.candidate_compatibility_result.terminal_esi_backed_expansion_failure_posture_fixture_only.represented === true, 'terminal failure should be represented fixture-only');
}

function verifyBoundary(proof, label) {
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.fixture_only === true, `${label} should be fixture-only`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not make live/API calls`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.watch_execution === false, `${label} should not execute Watch`);
  assert(proof.watch_dispatches === 0, `${label} should not dispatch Watch`);
  assert(proof.mixed_collectors_invoked === false, `${label} should not invoke mixed collectors`);
  assert(proof.collect_actor_watch_invoked === false, `${label} should not invoke collectActorWatch`);
  assert(proof.collect_system_radius_watch_invoked === false, `${label} should not invoke collectSystemRadiusWatch`);
  assert(proof.non_invocation_proof.runActorWatchService_runtime_changed === false, `${label} should not change runActorWatchService runtime behavior`);
  assert(proof.non_invocation_proof.watchExecutor_dispatchFor_runtime_changed === false, `${label} should not change watchExecutor.dispatchFor runtime behavior`);
  assert(Array.isArray(proof.task_runner_methods_called) && proof.task_runner_methods_called.length === 0, `${label} should not call TaskRunner methods`);
  assert(proof.tasks_created === 0, `${label} should not create tasks`);
  assert(proof.queue_created === false, `${label} should not create queue`);
  assert(proof.dispatcher_created === false, `${label} should not create dispatcher`);
  assert(proof.leases_created === 0, `${label} should not create leases`);
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.discovery_refs_written === false, `${label} should not write Discovery refs`);
  assert(proof.discovered_killmail_refs_written === 0, `${label} should not write discovered_killmail_refs`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence/EVEidence`);
  assert(proof.evidence_landing_performed === false, `${label} should not land Evidence/EVEidence`);
  assert(proof.live_esi_backed_expansion_run === false, `${label} should not run live ESI-backed expansion`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration`);
  assert(proof.metadata_writes === 0, `${label} should not write metadata`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.data_quality_warning_writes === 0, `${label} should not write warnings`);
  assert(proof.fetch_run_writes === 0, `${label} should not write fetch_runs`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.support_artifacts_created === 0, `${label} should not create support artifacts`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.ui_work === false, `${label} should not do UI work`);
  assert(proof.actor_watch_redirected === false, `${label} should not redirect actor.watch`);
  assert(proof.runActorWatchService_changed === false, `${label} should not change runActorWatchService`);
  assert(proof.watchExecutor_dispatchFor_changed === false, `${label} should not change watchExecutor.dispatchFor`);
  assert(proof.mixed_collector_retired === false, `${label} should not retire collectors`);
  assert(proof.system_radius_touched === false, `${label} should not touch system/radius`);
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
  `).run(1, 'character', 90000001, 'Wrapper Contract Pilot', 14, 5, 1, 60, null, null, null, null, null, 'HS381 compatibility wrapper fixture');
}

function seedCachedEvidence(db) {
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id,
      raw_esi_payload, raw_payload_checksum, source,
      first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    400349001,
    'hs349_actor_stub_hash_001',
    NOW,
    30003597,
    '{}',
    'fixture_checksum',
    'fixture',
    NOW,
    NOW,
    NOW
  );
}

function duplicateCandidate() {
  return {
    killmail_id: 900381001,
    killmail_hash: 'hs381_duplicate_hash',
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
