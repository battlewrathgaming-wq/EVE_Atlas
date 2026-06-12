const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildActorWatchDiscoveryRouteBodyFixture } = require('../src/main/discovery/actorWatchDiscoveryRouteBodyFixture');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-07T22:15:00.000Z';

async function main() {
  await verifyDirectFreshRoute();
  await verifyPendingDrainRoute();
  await verifyCacheSkipRoute();
  await verifyFailureRoute();
  await verifyServiceCommand();
  console.log(JSON.stringify({
    status: 'Actor Watch Discovery-owned route body fixture proof validated',
    command: 'watch.actor_discovery_route_body_fixture.preview',
    sample_fresh_route: await sample({
      now: NOW,
      maxRefs: 5,
      maxExpansions: 2
    }),
    sample_pending_route: await sample({
      now: NOW,
      pendingRefs: [{
        killmail_id: 400415010,
        hash: 'hs415_pending_hash_010',
        discovered_by_type: 'actor',
        discovered_by_id: 90000001
      }]
    }),
    sample_cache_skip: await sample({
      now: NOW,
      cachedKillmailIds: [400415001],
      maxExpansions: 2
    })
  }, null, 2));
  console.log('Actor Watch Discovery-owned route body fixture proof validated');
}

async function verifyDirectFreshRoute() {
  const proof = await buildActorWatchDiscoveryRouteBodyFixture({
    now: NOW,
    entityType: 'character',
    entityId: 90000001,
    entityName: 'Route Fixture Pilot',
    lookbackSeconds: 1209600,
    maxRefs: 5,
    maxExpansions: 2
  });
  verifyBoundary(proof, 'direct fresh route');
  verifyCompatibilityShape(proof);
  assert(proof.fake_zkill_client_invocations === 1, 'fresh route should invoke fake zKill client once');
  assert(proof.fake_esi_client_invocations === 2, 'fresh route should invoke fake ESI for selected refs');
  assert(proof.discovery_stage.discovered_refs === 3, 'fresh route should discover fixture refs');
  assert(proof.old_caller_facing_compatibility_result.expansion_attempted === 2, 'fresh route should select capped expansion refs');
  assert(proof.old_caller_facing_compatibility_result.new_esi_expansions === 2, 'fresh route should build expanded package rows');
  assert(proof.old_caller_facing_compatibility_result.expansion_cap_skipped === 1, 'fresh route should expose cap skipped compatibility field');
  assert(proof.evidence_writer_boundary.package_counts.killmails === 2, 'fresh route should produce a writer-ready package');
}

async function verifyPendingDrainRoute() {
  const proof = await buildActorWatchDiscoveryRouteBodyFixture({
    now: NOW,
    pendingRefs: [{
      killmail_id: 400415010,
      hash: 'hs415_pending_hash_010',
      discovered_by_type: 'actor',
      discovered_by_id: 90000001
    }]
  });
  verifyBoundary(proof, 'pending drain route');
  verifyCompatibilityShape(proof);
  assert(proof.fake_zkill_client_invocations === 0, 'pending route should not invoke fake zKill client');
  assert(proof.discovery_stage.used_pending_ref_drain === true, 'pending route should use pending-ref drain');
  assert(proof.old_caller_facing_compatibility_result.pending_refs_considered === 1, 'pending route should expose pending refs considered');
  assert(proof.old_caller_facing_compatibility_result.zkill_discovery_skipped === true, 'pending route should mark zKill discovery skipped');
}

async function verifyCacheSkipRoute() {
  const proof = await buildActorWatchDiscoveryRouteBodyFixture({
    now: NOW,
    cachedKillmailIds: [400415001],
    maxExpansions: 2
  });
  verifyBoundary(proof, 'cache skip route');
  verifyCompatibilityShape(proof);
  assert(proof.selection_stage.local_cache_skip_preserved === true, 'cache route should preserve local cache skip posture');
  assert(proof.old_caller_facing_compatibility_result.already_cached_killmails === 1, 'cache route should expose already cached count');
  assert(proof.candidate_ref_status_mutation_posture.would_mark_cached_count === 1, 'cache route should expose would-mark cached posture');
}

async function verifyFailureRoute() {
  const proof = await buildActorWatchDiscoveryRouteBodyFixture({
    now: NOW,
    maxExpansions: 2,
    fixtureEsiFailures: [{
      killmail_id: 400415001,
      code: 'FIXTURE_ESI_FAILURE',
      message: 'fixture selected-ref expansion failed'
    }]
  });
  verifyBoundary(proof, 'failure route');
  verifyCompatibilityShape(proof);
  assert(proof.old_caller_facing_compatibility_result.failed_expansions === 1, 'failure route should expose failed expansion count');
  assert(proof.candidate_ref_status_mutation_posture.would_mark_failed_count === 1, 'failure route should expose would-mark failed posture');
  assert(proof.old_caller_facing_compatibility_result.warnings.includes('fixture selected-ref expansion failed'), 'failure route should include failure warning');
}

async function verifyServiceCommand() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.actor_discovery_route_body_fixture.preview');
  assert(command, 'service command should be registered');
  assert(command.classification === 'read-only', 'service command should be read-only');
  assert(command.renderer_allowed === true, 'service command should be renderer eligible as preview/readout');

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorWatch(db);
    const before = sideEffectCounts(db);
    const proof = await invokeServiceCommand('watch.actor_discovery_route_body_fixture.preview', {
      now: NOW,
      maxRefs: 5,
      maxExpansions: 2
    }, { db });
    const after = sideEffectCounts(db);
    verifyBoundary(proof, 'service command route');
    verifyCompatibilityShape(proof);
    assertSame(after, before, 'service command should not mutate local rows');
    assert(proof.table_mutation_proof.unchanged === true, 'service command should include unchanged table proof');
  } finally {
    closeDatabase(db);
  }
}

async function sample(input) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorWatch(db);
    const proof = await invokeServiceCommand('watch.actor_discovery_route_body_fixture.preview', input, { db });
    return {
      route_body_fixture_only: proof.route_body_fixture_only,
      composed_discovery_helpers: proof.composed_discovery_helpers,
      fake_zkill_client_invocations: proof.fake_zkill_client_invocations,
      fake_esi_client_invocations: proof.fake_esi_client_invocations,
      old_caller_facing_compatibility_result: proof.old_caller_facing_compatibility_result,
      candidate_ref_status_mutation_posture: proof.candidate_ref_status_mutation_posture,
      evidence_writer_boundary: proof.evidence_writer_boundary,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyCompatibilityShape(proof) {
  const result = proof.old_caller_facing_compatibility_result;
  for (const field of [
    'run_id',
    'actor',
    'zkill_refs_discovered',
    'duplicate_refs_removed',
    'malformed_refs_removed',
    'unique_refs_after_dedupe',
    'pending_refs_considered',
    'already_cached_killmails',
    'expansion_attempted',
    'expansion_cap_skipped',
    'new_esi_expansions',
    'failed_expansions',
    'persisted_killmails',
    'activity_events_written',
    'api_calls_zkill',
    'api_calls_esi',
    'warnings',
    'planned_zkill_requests',
    'zkill_discovery_skipped',
    'collection_plan',
    'expansion_queue',
    'expansion_queue_summary'
  ]) {
    assert(Object.prototype.hasOwnProperty.call(result, field), `compatibility result should include ${field}`);
  }
  assert(proof.compatibility_term_posture.old_result_fields_are_compatibility_only === true, 'old fields should be compatibility-only');
  assert(proof.compatibility_term_posture.future_discovery_receipt_doctrine_claimed === false, 'route should not claim future receipt doctrine');
  assert(proof.old_result_compatibility_map.compatibility_only === true, 'compatibility map should be compatibility-only');
}

function verifyBoundary(proof, label) {
  assert(proof.action === 'watch.actor_discovery_route_body_fixture.preview', `${label} action should match`);
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.fixture_only === true, `${label} should be fixture-only`);
  assert(proof.route_body_fixture_only === true, `${label} should be route-body fixture only`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not make live/API calls`);
  assert(proof.zkill_calls === 0, `${label} should report zero real zKill calls`);
  assert(proof.esi_calls === 0, `${label} should report zero real ESI calls`);
  assert(proof.collect_actor_watch_invoked === false, `${label} should not invoke collectActorWatch`);
  assert(proof.mixed_collectors_invoked === false, `${label} should not invoke mixed collectors`);
  assert(proof.production_actor_watch_redirected === false, `${label} should not redirect actor.watch`);
  assert(proof.runActorWatchService_changed === false, `${label} should not change runActorWatchService`);
  assert(proof.watchExecutor_dispatchFor_changed === false, `${label} should not change watchExecutor.dispatchFor`);
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.discovered_killmail_refs_written === 0, `${label} should not write discovered refs`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence/EVEidence`);
  assert(proof.evidence_landing_performed === false, `${label} should not land Evidence/EVEidence`);
  assert(proof.evidence_writer_invoked === false, `${label} should not invoke writer`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.fetch_run_writes === 0, `${label} should not write fetch_runs`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.support_artifacts_created === 0, `${label} should not create support artifacts`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.boundary_flags.system_radius_behavior_changed === false, `${label} should not touch system/radius`);
  assert(proof.boundary_flags.protected_words_updated === false, `${label} should not update protected words`);
  assert(proof.discovery_stage.candidate_refs_are_possible_leads === true, `${label} should keep candidate refs as leads`);
  assert(proof.discovery_stage.candidate_refs_are_evidence === false, `${label} should not treat candidate refs as Evidence/EVEidence`);
  assert(proof.esi_backed_expansion_stage.owner === 'Discovery', `${label} should keep ESI-backed expansion Discovery-owned`);
  assert(proof.esi_backed_expansion_stage.not_hydration === true, `${label} should not treat ESI-backed expansion as Hydration`);
  assert(proof.evidence_writer_boundary.invoked === false, `${label} should represent writer boundary only`);
  assert(proof.non_invocation_proof.collectActorWatch_imported === false, `${label} should declare collectActorWatch not imported`);
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
  `).run(1, 'character', 90000001, 'Route Body Fixture Pilot', 14, 5, 1, 60, null, null, null, null, null, 'HS415 route body fixture');
}

function sideEffectCounts(db) {
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
