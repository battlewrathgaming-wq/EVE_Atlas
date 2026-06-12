const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildDiscoveryEsiExpansionIntakePosturePreview } = require('../src/main/services/discoveryEsiExpansionIntakePostureService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-07T19:00:00.000Z';

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('selected candidate ready', {}, {
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, verifySelectedReady);
    await verifyCase('local Evidence cache skip', seedCachedEvidence, {
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, verifyLocalEvidenceSkip);
    await verifyCase('malformed candidate', {}, {
      fixtureCandidateRefs: [{
        killmail_id: null,
        killmail_hash: null,
        source_lane: 'watch',
        source_kind: 'actor',
        scope_key: 'actor:character:90000001',
        pickup_packet_index: 0
      }]
    }, verifyMalformed);
    await verifyCase('duplicate candidate', {}, {
      maxHandoffCandidates: 4,
      fixtureOutcomes: [{
        outcome: 'complete_refs_found',
        candidate_ref_handles: [duplicateCandidate(), duplicateCandidate()]
      }]
    }, verifyDuplicate);
    await verifyCase('not selected capped candidate', {}, {
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, verifyNotSelected);
    await verifyCase('provider deferred', {}, {
      fixtureOutcomes: ['provider_deferred']
    }, verifyProviderDeferred);
    await verifyCase('retryable ESI-backed failure', {}, {
      fixtureOutcomes: ['complete_refs_found'],
      fixtureEsiExpansionOutcomes: [{
        killmail_id: 400349001,
        killmail_hash: 'hs349_actor_stub_hash_001',
        outcome: 'failed_retryable'
      }]
    }, verifyRetryableFailure);
    await verifyCase('terminal ESI-backed failure', {}, {
      fixtureOutcomes: ['complete_refs_found'],
      fixtureEsiExpansionOutcomes: [{
        killmail_id: 400349001,
        killmail_hash: 'hs349_actor_stub_hash_001',
        outcome: 'failed_terminal'
      }]
    }, verifyTerminalFailure);
    await verifyServiceCommand();

    console.log(JSON.stringify({
      status: 'Discovery ESI-backed expansion intake posture validated',
      command: 'discovery.esi_expansion_intake_posture.preview',
      sample_ready: await sample({}, {
        maxHandoffCandidates: 1,
        fixtureOutcomes: ['complete_refs_found']
      }),
      sample_local_cache_skip: await sample(seedCachedEvidence, {
        maxHandoffCandidates: 1,
        fixtureOutcomes: ['complete_refs_found']
      }),
      sample_malformed: await sample({}, {
        fixtureCandidateRefs: [{
          killmail_id: null,
          killmail_hash: null,
          source_lane: 'watch',
          source_kind: 'actor',
          scope_key: 'actor:character:90000001',
          pickup_packet_index: 0
        }]
      }),
      sample_deferred: await sample({}, {
        fixtureOutcomes: ['provider_deferred']
      }),
      sample_retryable_failure: await sample({}, {
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
  console.log('Discovery ESI-backed expansion intake posture validated');
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
    const proof = buildDiscoveryEsiExpansionIntakePosturePreview(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      ...input
    });
    const after = sideEffectCounts(db);
    verifyBoundary(proof, label);
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
    const result = await invokeServiceCommand('discovery.esi_expansion_intake_posture.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, { db });
    const after = sideEffectCounts(db);
    verifySelectedReady(result);
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
    const proof = buildDiscoveryEsiExpansionIntakePosturePreview(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      ...input
    });
    return {
      source_acquisition_handoff: proof.source_acquisition_handoff,
      posture_summary: proof.posture_summary,
      intake_items: proof.intake_items,
      evidence_eveidence_writer_boundary: proof.evidence_eveidence_writer_boundary,
      accepted_model: proof.accepted_model,
      missing_or_parked_runtime_work: proof.missing_or_parked_runtime_work,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifySelectedReady(proof) {
  const ready = proof.intake_items.find((item) => item.posture === 'selected_ready_for_future_esi_expansion');
  assert(ready, 'ready case should include selected ready candidate');
  verifyItemShape(ready);
  assert(ready.future_provider_target.provider === 'esi', 'ready item should expose future ESI target');
  assert(ready.local_cache_means_no_future_esi_needed === false, 'ready item should still need future ESI expansion');
}

function verifyLocalEvidenceSkip(proof) {
  const skipped = proof.intake_items.find((item) => item.posture === 'local_evidence_exists_skip');
  assert(skipped, 'local cache case should include local Evidence skip');
  verifyItemShape(skipped);
  assert(skipped.local_cache_means_no_future_esi_needed === true, 'local Evidence should mean no future ESI is needed for that item');
}

function verifyMalformed(proof) {
  const malformed = proof.intake_items.find((item) => item.posture === 'malformed_candidate_missing_killmail_id_or_hash');
  assert(malformed, 'malformed case should include malformed posture');
  assert(malformed.killmail_id === null, 'malformed item should disclose missing killmail_id');
  assert(malformed.killmail_hash === null, 'malformed item should disclose missing killmail_hash');
  assert(malformed.future_provider_target === null, 'malformed item should not expose executable provider target');
}

function verifyDuplicate(proof) {
  assert(proof.posture_summary.duplicate_count === 1, 'duplicate case should count one duplicate');
  const duplicate = proof.intake_items.find((item) => item.posture === 'duplicate_candidate_ref');
  assert(duplicate, 'duplicate case should include duplicate posture');
  verifyItemShape(duplicate);
}

function verifyNotSelected(proof) {
  assert(proof.posture_summary.not_selected_capped_count >= 1, 'not-selected case should disclose a capped/not-selected candidate');
  const notSelected = proof.intake_items.find((item) => item.posture === 'not_selected_capped_candidate');
  assert(notSelected.selection_or_skip_reason === 'max_handoff_candidates_reached', 'not-selected reason should be max handoff cap');
}

function verifyProviderDeferred(proof) {
  assert(proof.posture_summary.provider_deferred_count === 1, 'provider deferred case should count provider deferred posture');
  const deferred = proof.intake_items.find((item) => item.posture === 'provider_capacity_deferred');
  assert(deferred.selection_or_skip_reason === 'provider_deferred', 'deferred reason should be provider_deferred');
  assert(deferred.future_provider_target === null, 'deferred posture should not expose executable ESI target');
}

function verifyRetryableFailure(proof) {
  assert(proof.posture_summary.retryable_failure_count === 1, 'retryable case should count retryable failure posture');
  const retryable = proof.intake_items.find((item) => item.posture === 'retryable_esi_backed_expansion_failure');
  verifyItemShape(retryable);
  assert(retryable.selection_or_skip_reason === 'fixture_retryable_esi_backed_expansion_failure', 'retryable reason should be fixture-only');
}

function verifyTerminalFailure(proof) {
  assert(proof.posture_summary.terminal_failure_count === 1, 'terminal case should count terminal failure posture');
  const terminal = proof.intake_items.find((item) => item.posture === 'terminal_esi_backed_expansion_failure');
  verifyItemShape(terminal);
  assert(terminal.selection_or_skip_reason === 'fixture_terminal_esi_backed_expansion_failure', 'terminal reason should be fixture-only');
}

function verifyItemShape(item) {
  assert(item.killmail_id !== null, 'intake item should disclose killmail_id');
  assert(Boolean(item.killmail_hash), 'intake item should disclose killmail_hash');
  assert(item.source_candidate_basis, 'intake item should disclose source candidate basis');
  assert(item.future_provider_target?.provider_calls === 0, 'future provider target should not call providers');
  assert(item.future_provider_target?.live_api_calls === 0, 'future provider target should not call live APIs');
  assert(item.esi_call_performed === false, 'intake item should not perform ESI call');
  assert(item.evidence_written === false, 'intake item should not write Evidence/EVEidence');
  assert(item.hydration_written === false, 'intake item should not write Hydration');
  assert(item.candidate_refs_are_possible_leads === true, 'candidate refs should remain possible leads');
  assert(item.candidate_ref_is_evidence === false, 'candidate refs should not be Evidence');
  assert(item.esi_backed_expansion_is_hydration === false, 'ESI-backed expansion should not be Hydration');
}

function verifyBoundary(proof, label) {
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.fixture_only === true, `${label} should be fixture-only`);
  assert(proof.accepted_model.owner === 'Discovery', `${label} should be Discovery-owned`);
  assert(proof.accepted_model.source_agnostic === true, `${label} should remain source-agnostic`);
  assert(proof.accepted_model.actor_watch_is_one_possible_caller === true, `${label} should not become actor-only`);
  assert(proof.accepted_model.esi_backed_expansion_is_hydration === false, `${label} should not treat ESI expansion as Hydration`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not make live/API calls`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.watch_execution === false, `${label} should not execute Watch`);
  assert(proof.watch_dispatches === 0, `${label} should not dispatch Watch`);
  assert(proof.mixed_collectors_invoked === false, `${label} should not invoke mixed collectors`);
  assert(proof.collect_actor_watch_invoked === false, `${label} should not invoke collectActorWatch`);
  assert(proof.collect_system_radius_watch_invoked === false, `${label} should not invoke collectSystemRadiusWatch`);
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
  assert(proof.boundary_flags.system_radius_behavior_changed === false, `${label} should not change system/radius behavior`);
  assert(proof.boundary_flags.protected_words_updated === false, `${label} should not update protected words`);
  assert(proof.evidence_eveidence_writer_boundary.invoked === false, `${label} should not invoke Evidence/EVEidence writer`);
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
  `).run(1, 'character', 90000001, 'ESI Intake Pilot', 14, 5, 1, 60, null, null, null, null, null, 'HS379 ESI intake fixture');
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
    killmail_id: 900379001,
    killmail_hash: 'hs379_duplicate_hash',
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
