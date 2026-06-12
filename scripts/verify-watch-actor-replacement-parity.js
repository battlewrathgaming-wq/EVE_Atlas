const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildWatchActorReplacementParityPreview } = require('../src/main/services/watchActorReplacementParityService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-07T18:00:00.000Z';

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('actor refs found and selected', {
      maxHandoffCandidates: 1,
      cachedKillmailIds: [400349001],
      fixtureOutcomes: ['complete_refs_found']
    }, verifyRefsFoundSelected);
    await verifyCase('actor no refs', {
      fixtureOutcomes: ['complete_no_refs']
    }, verifyNoRefs);
    await verifyCase('actor malformed candidate ref', {
      fixtureCandidateRefs: [{
        killmail_id: null,
        killmail_hash: null,
        source_lane: 'watch',
        source_kind: 'actor',
        scope_key: 'actor:character:90000001',
        pickup_packet_index: 0
      }]
    }, verifyMalformedCandidate);
    await verifyCase('actor duplicate candidate ref', {
      maxHandoffCandidates: 4,
      fixtureOutcomes: [{
        outcome: 'complete_refs_found',
        candidate_ref_handles: [
          duplicateCandidate(),
          duplicateCandidate()
        ]
      }]
    }, verifyDuplicateCandidate);
    await verifyCase('actor acquisition capped', {
      fixtureOutcomes: ['acquisition_capped']
    }, verifyAcquisitionCapped);
    await verifyCase('actor provider deferred', {
      fixtureOutcomes: ['provider_deferred']
    }, verifyProviderDeferred);
    await verifyServiceCommand();

    console.log(JSON.stringify({
      status: 'Actor Watch replacement parity preview validated',
      command: 'watch.actor_replacement_parity.preview',
      sample_refs_found_selected: await sample({
        maxHandoffCandidates: 1,
        cachedKillmailIds: [400349001],
        fixtureOutcomes: ['complete_refs_found']
      }),
      sample_no_refs: await sample({ fixtureOutcomes: ['complete_no_refs'] }),
      sample_malformed: await sample({
        fixtureCandidateRefs: [{
          killmail_id: null,
          killmail_hash: null,
          source_lane: 'watch',
          source_kind: 'actor',
          scope_key: 'actor:character:90000001',
          pickup_packet_index: 0
        }]
      }),
      sample_duplicate: await sample({
        maxHandoffCandidates: 4,
        fixtureOutcomes: [{
          outcome: 'complete_refs_found',
          candidate_ref_handles: [duplicateCandidate(), duplicateCandidate()]
        }]
      }),
      sample_capped: await sample({ fixtureOutcomes: ['acquisition_capped'] }),
      sample_deferred: await sample({ fixtureOutcomes: ['provider_deferred'] })
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Actor Watch replacement parity preview validated');
}

async function verifyCase(label, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorWatch(db);
    const before = sideEffectCounts(db);
    const proof = buildWatchActorReplacementParityPreview(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      ...input
    });
    const after = sideEffectCounts(db);
    verifyBoundary(proof, label);
    verifier(proof);
    assertSame(after, before, `${label} should not mutate local rows`);
    assert(proof.no_mutation_proof.unchanged === true, `${label} should include unchanged mutation proof`);
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
    const result = await invokeServiceCommand('watch.actor_replacement_parity.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 1,
      cachedKillmailIds: [400349001],
      fixtureOutcomes: ['complete_refs_found']
    }, { db });
    const after = sideEffectCounts(db);
    verifyRefsFoundSelected(result);
    assertSame(after, before, 'service command should not mutate local rows');
  } finally {
    closeDatabase(db);
  }
}

async function sample(input) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorWatch(db);
    const proof = buildWatchActorReplacementParityPreview(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      ...input
    });
    return {
      selected_actor_watch_source: proof.selected_actor_watch_source,
      current_actor_entry_point_shape: proof.current_actor_entry_point_shape,
      current_legacy_collector: proof.current_legacy_collector,
      semantic_parity_map: proof.semantic_parity_map,
      represented_current_behavior_items: proof.represented_current_behavior_items,
      missing_or_parked_current_behavior_items: proof.missing_or_parked_current_behavior_items,
      compatibility_wrapper_posture: proof.compatibility_wrapper_posture,
      retire_posture: proof.retire_posture,
      proof_basis: proof.proof_basis,
      non_invocation_proof: proof.non_invocation_proof,
      no_mutation_proof: proof.no_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyRefsFoundSelected(proof) {
  verifyActorShape(proof);
  assert(proof.semantic_parity_map.candidate_ref_extraction.represented === true, 'refs-found case should represent candidate extraction');
  assert(proof.semantic_parity_map.esi_backed_expansion_intake.represented === true, 'refs-found case should represent ESI-backed expansion intake');
  assert(proof.semantic_parity_map.local_cache_skip_posture.represented === true, 'refs-found case should represent cache skip posture when fixture cache basis is supplied');
  assert(proof.semantic_parity_map.local_cache_skip_posture.esi_call_required_for_cached_candidates === false, 'cached fixture candidate should not require ESI call');
}

function verifyNoRefs(proof) {
  verifyActorShape(proof);
  assert(proof.semantic_parity_map.no_ref_posture.represented === true, 'no-ref case should represent no-ref posture');
  assert(proof.semantic_parity_map.esi_backed_expansion_intake.represented === false, 'no-ref case should not select ESI-backed intake candidates');
}

function verifyMalformedCandidate(proof) {
  verifyActorShape(proof);
  assert(proof.semantic_parity_map.malformed_candidate_posture.represented === true, 'malformed case should represent malformed candidate posture');
  assert(proof.semantic_parity_map.malformed_candidate_posture.count >= 1, 'malformed case should count malformed candidates');
}

function verifyDuplicateCandidate(proof) {
  verifyActorShape(proof);
  assert(proof.semantic_parity_map.duplicate_candidate_posture.represented === true, 'duplicate case should represent duplicate candidate posture');
  assert(proof.semantic_parity_map.duplicate_candidate_posture.posture.duplicate_candidate_count === 1, 'duplicate case should disclose one duplicate');
}

function verifyAcquisitionCapped(proof) {
  verifyActorShape(proof);
  assert(proof.semantic_parity_map.acquisition_capped_posture.represented === true, 'capped case should represent acquisition capped posture');
  assert(proof.semantic_parity_map.acquisition_capped_posture.full_coverage_claimed === false, 'capped case should not claim full coverage');
}

function verifyProviderDeferred(proof) {
  verifyActorShape(proof);
  assert(proof.semantic_parity_map.provider_deferred_posture.represented === true, 'deferred case should represent provider deferred posture');
  assert(proof.semantic_parity_map.provider_deferred_posture.deferred_count === 1, 'deferred case should count one deferred packet');
}

function verifyActorShape(proof) {
  assert(proof.actor_only === true, 'proof should be actor-only');
  assert(proof.system_radius_selected_or_changed === false, 'system/radius should not be selected or changed');
  assert(proof.selected_actor_watch_source.watch_type === 'actor', 'selected source should be actor Watch');
  assert(proof.current_actor_entry_point_shape.command === 'actor.watch', 'entry point should be actor.watch');
  assert(proof.current_actor_entry_point_shape.actor_target_identity.entity_type === 'character', 'actor identity type should be represented');
  assert(proof.current_actor_entry_point_shape.actor_target_identity.entity_id === 90000001, 'actor identity ID should be represented');
  assert(proof.current_actor_entry_point_shape.lookback_seconds === 1209600, 'lookback seconds should be represented');
  assert(proof.current_actor_entry_point_shape.max_refs === 5, 'max refs should be represented');
  assert(proof.current_actor_entry_point_shape.max_expansions === 5, 'max expansions should be represented');
  assert(proof.current_legacy_collector.function === 'collectActorWatch', 'legacy collector should be collectActorWatch');
  assert(proof.current_legacy_collector.invoked === false, 'collectActorWatch should not be invoked');
  assert(proof.future_boundary_owned_stages.map((stage) => stage.owner).includes('Evidence/EVEidence writer'), 'Evidence/EVEidence writer boundary should be represented');
  assert(proof.semantic_parity_map.esi_backed_expansion_intake.not_hydration === true, 'ESI-backed expansion should not be Hydration');
  assert(proof.semantic_parity_map.evidence_writer_landing_boundary.invoked === false, 'Evidence writer should not be invoked');
  assert(proof.compatibility_wrapper_posture.redirect_performed === false, 'compatibility wrapper should not redirect actor.watch');
  assert(proof.retire_posture.retirement_performed === false, 'collectActorWatch should not be retired');
  assert(proof.proof_basis.hs374_route_preview.actor_route_selected === true, 'HS374 proof basis should select actor route');
  assert(proof.proof_basis.hs376_readiness.system_radius_deferred === true, 'HS376 proof basis should defer system/radius');
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
  assert(proof.evidence_written === false, `${label} should not write Evidence/EVEidence`);
  assert(proof.live_esi_backed_expansion_run === false, `${label} should not run live ESI-backed expansion`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration`);
  assert(proof.metadata_writes === 0, `${label} should not write metadata`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.data_quality_warning_writes === 0, `${label} should not write warnings`);
  assert(proof.fetch_run_writes === 0, `${label} should not write fetch_runs`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.durable_task_packet_schema_created === false, `${label} should not create durable task/packet schema`);
  assert(proof.support_artifacts_created === 0, `${label} should not create support artifacts`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.ui_work === false, `${label} should not do UI work`);
  assert(proof.actor_watch_redirected === false, `${label} should not redirect actor.watch`);
  assert(proof.mixed_collector_redirected === false, `${label} should not redirect mixed collectors`);
  assert(proof.mixed_collector_retired === false, `${label} should not retire mixed collectors`);
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
  `).run(
    1,
    'character',
    90000001,
    'Actor Replacement Pilot',
    14,
    5,
    1,
    60,
    null,
    null,
    null,
    null,
    null,
    'HS377 actor replacement parity fixture'
  );
}

function duplicateCandidate() {
  return {
    killmail_id: 900377001,
    killmail_hash: 'hs377_duplicate_hash',
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
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
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
