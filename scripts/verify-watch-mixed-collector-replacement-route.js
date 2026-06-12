const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildWatchMixedCollectorReplacementRoutePreview } = require('../src/main/services/watchMixedCollectorReplacementRouteService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-07T17:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601, 30003602];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('actor route with selected candidates', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, verifyActorRoute);
    await verifyCase('system/radius route with accepted included_system_ids', insertSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 2,
      fixtureOutcomes: ['complete_refs_found', 'complete_no_refs', 'provider_deferred', 'failed_retryable']
    }, verifySystemRoute);
    await verifyCase('held by External I/O before provider movement', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      externalIoState: 'off'
    }, verifyHeldRoute);
    await verifyCase('route with no candidate refs', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['complete_no_refs']
    }, verifyNoRefsRoute);
    await verifyServiceCommand();

    console.log(JSON.stringify({
      status: 'Watch mixed collector replacement route preview validated',
      command: 'watch.mixed_collector_replacement_route.preview',
      sample_actor_route: await sample(insertActorOnly, {
        sessionArmed: true,
        liveApiEnabled: true,
        maxHandoffCandidates: 1,
        fixtureOutcomes: ['complete_refs_found']
      }),
      sample_system_radius_route: await sample(insertSystemOnly, {
        sessionArmed: true,
        liveApiEnabled: true,
        maxHandoffCandidates: 2,
        fixtureOutcomes: ['complete_refs_found', 'complete_no_refs', 'provider_deferred', 'failed_retryable']
      }),
      sample_held_route: await sample(insertActorOnly, {
        sessionArmed: true,
        liveApiEnabled: true,
        externalIoState: 'off'
      }),
      sample_no_refs_route: await sample(insertActorOnly, {
        sessionArmed: true,
        liveApiEnabled: true,
        fixtureOutcomes: ['complete_no_refs']
      })
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Watch mixed collector replacement route preview validated');
}

async function verifyCase(label, insertRows, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const before = sideEffectCounts(db);
    const proof = buildWatchMixedCollectorReplacementRoutePreview(db, { now: NOW, ...input });
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
    insertActorOnly(db);
    const before = sideEffectCounts(db);
    const result = await invokeServiceCommand('watch.mixed_collector_replacement_route.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, { db });
    const after = sideEffectCounts(db);
    verifyActorRoute(result);
    assertSame(after, before, 'service command should not mutate local rows');
  } finally {
    closeDatabase(db);
  }
}

async function sample(insertRows, input) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const proof = buildWatchMixedCollectorReplacementRoutePreview(db, { now: NOW, ...input });
    return {
      selected_watch_source: proof.selected_watch_source,
      current_command_entry_point_shape: proof.current_command_entry_point_shape,
      current_legacy_collector_that_would_have_been_used: proof.current_legacy_collector_that_would_have_been_used,
      future_route: proof.future_route,
      compatibility_wrapper_posture: proof.compatibility_wrapper_posture,
      retire_posture: proof.retire_posture,
      missing_proof_flags: proof.missing_proof_flags,
      existing_proof_basis: proof.existing_proof_basis,
      non_invocation_proof: proof.non_invocation_proof,
      no_mutation_proof: proof.no_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyActorRoute(proof) {
  assert(proof.selected_watch_source.watch_type === 'actor', 'actor route should select actor Watch');
  assert(proof.current_command_entry_point_shape.command === 'actor.watch', 'actor route should name actor.watch entry point');
  assert(proof.current_legacy_collector_that_would_have_been_used === 'collectActorWatch', 'actor route should name collectActorWatch');
  verifyRouteStages(proof);
  assert(proof.route_summary.acquisition_lane_candidate_count === 2, 'actor route should show two acquisition candidates');
  assert(proof.route_summary.esi_backed_expansion_handoff_candidate_count === 1, 'actor route should show one selected handoff candidate');
  assert(proof.future_route[2].owner === 'Discovery', 'ESI-backed expansion lane should be Discovery-owned');
  assert(proof.future_route[3].owner === 'Evidence/EVEidence writer', 'Evidence writer should be final landing owner');
}

function verifySystemRoute(proof) {
  assert(proof.selected_watch_source.watch_type === 'system_radius', 'system route should select system/radius Watch');
  assert(proof.current_command_entry_point_shape.command === 'system.radius.watch', 'system route should name system.radius.watch entry point');
  assert(proof.current_legacy_collector_that_would_have_been_used === 'collectSystemRadiusWatch', 'system route should name collectSystemRadiusWatch');
  assertSame(
    proof.existing_proof_basis.hs370_discovery_acquisition_to_evidence_handoff.source?.accepted_scope_basis?.accepted_system_ids || proof.future_route[0].output.accepted_scope_basis.accepted_system_ids,
    ACCEPTED_IDS,
    'system route should preserve accepted included_system_ids'
  );
  assert(proof.future_route[1].output.provider_facing_packets.length === ACCEPTED_IDS.length, 'system route should emit one provider-facing packet per accepted system');
  verifyRouteStages(proof);
}

function verifyHeldRoute(proof) {
  assert(proof.route_summary.request_posture === 'held_by_external_io', 'held route should stay request-level');
  assert(proof.future_route[1].output.provider_facing_packets.length === 0, 'held route should emit no provider-facing packets');
  assert(proof.route_summary.esi_backed_expansion_handoff_candidate_count === 0, 'held route should not select handoff candidates');
  assert(proof.missing_proof_flags.includes('held_by_external_io_request_has_no_packet_outcomes_by_design'), 'held route should disclose no packet outcomes by design');
  verifyRouteStages(proof);
}

function verifyNoRefsRoute(proof) {
  assert(proof.route_summary.acquisition_lane_candidate_count === 0, 'no-ref route should have no acquisition candidates');
  assert(proof.route_summary.esi_backed_expansion_handoff_candidate_count === 0, 'no-ref route should have no handoff candidates');
  assert(proof.missing_proof_flags.includes('no_candidate_refs_available_in_this_fixture_case'), 'no-ref route should disclose missing candidate refs');
  verifyRouteStages(proof);
}

function verifyRouteStages(proof) {
  const stages = proof.future_route.map((stage) => stage.stage);
  assertSame(stages, [
    'watch_accepted_intent_and_cadence',
    'discovery_zkill_candidate_lead_acquisition_lane',
    'discovery_esi_backed_killmail_detail_expansion_lane',
    'evidence_eveidence_writer_landed_memory',
    'watch_receipt_and_cadence_posture'
  ], 'future route stages should match accepted replacement model');
  assert(proof.future_route.every((stage) => stage.invoked === false), 'route stages should be future candidates, not invoked runtime');
  assert(proof.compatibility_wrapper_posture.redirect_performed === false, 'compatibility wrapper should not redirect now');
  assert(proof.compatibility_wrapper_posture.current_behavior_changed === false, 'compatibility wrapper should not change current behavior');
  assert(proof.retire_posture.retirement_performed === false, 'retire posture should not perform retirement');
  assert(proof.retire_posture.replacement_frame === true, 'retire posture should preserve replacement frame');
  assert(proof.existing_proof_basis.hs368_watch_to_discovery_acquisition_split.represented === true, 'HS368 basis should be represented');
  assert(proof.existing_proof_basis.hs370_discovery_acquisition_to_evidence_handoff.represented === true, 'HS370 basis should be represented');
  assert(proof.missing_proof_flags.includes('compatibility_wrapper_not_implemented'), 'missing flags should disclose compatibility wrapper not implemented');
  assert(proof.missing_proof_flags.includes('mixed_collector_retirement_not_performed'), 'missing flags should disclose collector retirement not performed');
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
  assert(proof.mixed_collector_redirected === false, `${label} should not redirect collectors`);
  assert(proof.mixed_collector_retired === false, `${label} should not retire collectors`);
  assert(proof.boundary_flags.mixed_collectors_retired_or_redirected === false, `${label} should not retire or redirect collectors`);
  assert(proof.non_invocation_proof.collectActorWatch_entered === false, `${label} should not enter collectActorWatch`);
  assert(proof.non_invocation_proof.collectSystemRadiusWatch_entered === false, `${label} should not enter collectSystemRadiusWatch`);
  assert(proof.non_invocation_proof.WatchSessionExecutor_tick_invoked === false, `${label} should not invoke WatchSessionExecutor.tick`);
  assert(proof.non_invocation_proof.TaskRunner_runDetachedTask_invoked === false, `${label} should not invoke TaskRunner.runDetachedTask`);
}

function insertActorOnly(db) {
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
    'Replacement Route Pilot',
    14,
    5,
    1,
    60,
    null,
    null,
    null,
    null,
    null,
    'HS374 route fixture'
  );
}

function insertSystemOnly(db) {
  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    30003597,
    'Hare',
    1,
    JSON.stringify(ACCEPTED_IDS),
    '[]',
    24,
    35,
    8,
    1,
    45,
    null,
    null,
    null,
    null,
    null,
    'HS374 route fixture'
  );
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
