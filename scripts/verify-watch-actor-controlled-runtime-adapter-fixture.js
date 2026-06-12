const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildActorWatchControlledRuntimeAdapterFixtureProof } = require('../src/main/discovery/actorWatchControlledRuntimeAdapterFixture');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');

async function main() {
  const direct = await buildActorWatchControlledRuntimeAdapterFixtureProof();
  verifyProof(direct);
  await verifyServiceCommand();
  console.log(JSON.stringify({
    status: 'Actor Watch controlled runtime adapter fixture proof validated',
    command: 'watch.actor_controlled_runtime_adapter_fixture.preview',
    sample_fresh: sampleCase(direct.cases.fresh_actor_candidate_acquisition),
    sample_pending: sampleCase(direct.cases.pending_candidate_drain),
    sample_cache: sampleCase(direct.cases.local_evidence_cache_skip),
    sample_failure: sampleCase(direct.cases.expansion_failure)
  }, null, 2));
  console.log('Actor Watch controlled runtime adapter fixture proof validated');
}

async function verifyServiceCommand() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.actor_controlled_runtime_adapter_fixture.preview');
  assert(command, 'controlled runtime adapter fixture command should be registered');
  assert(command.classification === 'metadata-only', 'controlled runtime adapter fixture command should be metadata-only');
  assert(command.effects.includes('local-data-mutation'), 'controlled runtime adapter fixture command should declare fixture local mutation');
  assert(command.renderer_allowed === false, 'controlled runtime adapter fixture command should not be renderer eligible');

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedOperatorWatch(db);
    const before = operatorCounts(db);
    const proof = await invokeServiceCommand('watch.actor_controlled_runtime_adapter_fixture.preview', {}, { db });
    const after = operatorCounts(db);
    verifyProof(proof);
    assertSame(after, before, 'service command should not mutate caller/operator DB');
    assert(proof.operator_corpus_non_mutation_proof.unchanged === true, 'service command should prove operator DB unchanged');
    assert(proof.operator_corpus_non_mutation_proof.disposable_db_only === true, 'service command should use disposable DBs only');
  } finally {
    closeDatabase(db);
  }
}

function verifyProof(proof) {
  assert(proof.action === 'watch.actor_controlled_runtime_adapter_fixture.preview', 'action should match');
  assert(proof.fixture_only === true, 'proof should be fixture-only');
  assert(proof.disposable_db_only === true, 'proof should use disposable DBs only');
  assert(proof.uses_real_repository_methods === true, 'proof should use real repository methods');
  assert(proof.uses_injected_fake_clients_only === true, 'proof should use injected fake clients only');
  assert(proof.provider_calls === 0, 'proof should not call providers');
  assert(proof.live_api_calls === 0, 'proof should not make live/API calls');
  assert(proof.operator_corpus_mutated === false, 'proof should not mutate operator corpus');
  assert(proof.production_actor_watch_redirected === false, 'proof should not redirect production actor.watch');
  assert(proof.runActorWatchService_changed === false, 'proof should not change runActorWatchService');
  assert(proof.watchExecutor_dispatchFor_changed === false, 'proof should not change watchExecutor.dispatchFor');
  assert(proof.collect_actor_watch_imported === false, 'proof should not import collectActorWatch');
  assert(proof.collect_actor_watch_invoked === false, 'proof should not invoke collectActorWatch');
  assert(proof.schema_changes === 0, 'proof should not change schema');
  assert(proof.dispatcher_queue_lease_behavior_changed === false, 'proof should not add dispatcher/queue/lease behavior');
  assert(proof.runtime_enforcement_active === false, 'proof should not activate runtime enforcement');
  assert(proof.command_blocking_active === false, 'proof should not activate command blocking');
  assert(proof.ui_work === false, 'proof should not touch UI');
  assert(proof.support_artifacts_created === 0, 'proof should not create support artifacts');
  for (const method of [
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
  ]) {
    assert(proof.repository_methods_proven.includes(method), `proof should declare ${method}`);
  }

  verifyFresh(proof.cases.fresh_actor_candidate_acquisition);
  verifyPending(proof.cases.pending_candidate_drain);
  verifyCache(proof.cases.local_evidence_cache_skip);
  verifyFailure(proof.cases.expansion_failure);
}

function verifyFresh(caseProof) {
  verifyCaseBoundary(caseProof, 'fresh');
  assert(caseProof.fake_zkill_client_invocations === 1, 'fresh case should invoke fake zKill once');
  assert(caseProof.fake_esi_client_invocations === 2, 'fresh case should invoke fake ESI twice');
  assert(caseProof.refs_written_to_disposable_discovery_memory === 3, 'fresh case should write discovered refs to disposable DB');
  assert(caseProof.selected_refs_count === 2, 'fresh case should mark selected refs');
  assert(caseProof.expanded_refs_count === 2, 'fresh case should expand refs');
  assert(caseProof.persisted_killmails === 2, 'fresh case should land Evidence/EVEidence killmails in disposable DB');
  assert(caseProof.activity_events_written > 0, 'fresh case should write activity events in disposable DB');
  assert(caseProof.fetch_run_finalized === true, 'fresh case should finalize fetch run');
  assert(caseProof.discovery_ref_status_counts.expanded === 2, 'fresh case should mark expanded refs');
  assert(caseProof.discovery_ref_status_counts.pending === 1, 'fresh case should leave capped ref pending');
}

function verifyPending(caseProof) {
  verifyCaseBoundary(caseProof, 'pending');
  assert(caseProof.fake_zkill_client_invocations === 0, 'pending case should not invoke fake zKill');
  assert(caseProof.fake_esi_client_invocations === 2, 'pending case should invoke fake ESI for pending refs');
  assert(caseProof.pending_refs_considered === 2, 'pending case should consider seeded pending refs');
  assert(caseProof.refs_written_to_disposable_discovery_memory === 0, 'pending case should not write fresh zKill refs');
  assert(caseProof.discovery_ref_status_counts.expanded === 2, 'pending case should mark pending refs expanded');
  assert(caseProof.fetch_run_finalized === true, 'pending case should finalize fetch run');
}

function verifyCache(caseProof) {
  verifyCaseBoundary(caseProof, 'cache');
  assert(caseProof.fake_zkill_client_invocations === 1, 'cache case should invoke fake zKill once');
  assert(caseProof.fake_esi_client_invocations === 1, 'cache case should skip fake ESI for cached candidate');
  assert(caseProof.cached_refs_count >= 1, 'cache case should count cached ref');
  assert(caseProof.discovery_ref_status_counts.cached === 1, 'cache case should mark cached ref');
  assert(caseProof.persisted_killmails === 1, 'cache case should land only uncached killmail during adapter run');
  assert(caseProof.fetch_run_finalized === true, 'cache case should finalize fetch run');
}

function verifyFailure(caseProof) {
  verifyCaseBoundary(caseProof, 'failure');
  assert(caseProof.fake_zkill_client_invocations === 1, 'failure case should invoke fake zKill once');
  assert(caseProof.fake_esi_client_invocations === 1, 'failure case should invoke fake ESI once');
  assert(caseProof.failed_refs_count === 1, 'failure case should count failed expansion');
  assert(caseProof.discovery_ref_status_counts.failed === 1, 'failure case should mark failed ref');
  assert(caseProof.evidence_warning_count === 1, 'failure case should persist warning posture');
  assert(caseProof.disposable_table_mutation_proof.deltas.data_quality_warnings >= 1, 'failure case should write warning in disposable DB');
  assert(caseProof.fetch_run_finalized === true, 'failure case should finalize fetch run');
}

function verifyCaseBoundary(caseProof, label) {
  assert(caseProof.disposable_db_path === ':memory:', `${label} case should use :memory: DB`);
  assert(caseProof.provider_calls === 0, `${label} case should not call providers`);
  assert(caseProof.live_api_calls === 0, `${label} case should not make live/API calls`);
  assert(caseProof.boundary_flags.fake_clients_only === true, `${label} case should use fake clients only`);
  assert(caseProof.boundary_flags.collectActorWatch_invoked === false, `${label} case should not invoke collectActorWatch`);
  assert(caseProof.boundary_flags.production_actor_watch_redirected === false, `${label} case should not redirect actor.watch`);
  assert(caseProof.boundary_flags.operator_db_written === false, `${label} case should not write operator DB`);
  assert(caseProof.disposable_table_mutation_proof.deltas.fetch_runs >= 1, `${label} case should write fetch_runs in disposable DB`);
  assert(caseProof.compatibility_summary.run_id, `${label} case should return compatibility summary`);
  assert(caseProof.compatibility_summary.api_calls_zkill === 0, `${label} case should report zero zKill API calls`);
  assert(caseProof.compatibility_summary.api_calls_esi === 0, `${label} case should report zero ESI API calls`);
}

function sampleCase(caseProof) {
  return {
    fake_zkill_client_invocations: caseProof.fake_zkill_client_invocations,
    fake_esi_client_invocations: caseProof.fake_esi_client_invocations,
    refs_written_to_disposable_discovery_memory: caseProof.refs_written_to_disposable_discovery_memory,
    selected_refs_count: caseProof.selected_refs_count,
    expanded_refs_count: caseProof.expanded_refs_count,
    cached_refs_count: caseProof.cached_refs_count,
    failed_refs_count: caseProof.failed_refs_count,
    persisted_killmails: caseProof.persisted_killmails,
    activity_events_written: caseProof.activity_events_written,
    fetch_run_finalized: caseProof.fetch_run_finalized,
    discovery_ref_status_counts: caseProof.discovery_ref_status_counts,
    deltas: caseProof.disposable_table_mutation_proof.deltas,
    compatibility_summary: {
      run_id: caseProof.compatibility_summary.run_id,
      zkill_refs_discovered: caseProof.compatibility_summary.zkill_refs_discovered,
      pending_refs_considered: caseProof.compatibility_summary.pending_refs_considered,
      already_cached_killmails: caseProof.compatibility_summary.already_cached_killmails,
      expansion_attempted: caseProof.compatibility_summary.expansion_attempted,
      new_esi_expansions: caseProof.compatibility_summary.new_esi_expansions,
      failed_expansions: caseProof.compatibility_summary.failed_expansions,
      persisted_killmails: caseProof.compatibility_summary.persisted_killmails,
      activity_events_written: caseProof.compatibility_summary.activity_events_written,
      api_calls_zkill: caseProof.compatibility_summary.api_calls_zkill,
      api_calls_esi: caseProof.compatibility_summary.api_calls_esi
    }
  };
}

function seedOperatorWatch(db) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 'character', 90000001, 'HS419 Operator Sentinel', 14, 5, 1, 60, null, null, null, null, null, 'operator non-mutation sentinel');
}

function operatorCounts(db) {
  return {
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    watchlist_entities: count(db, 'watchlist_entities')
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
  process.exitCode = 1;
});
