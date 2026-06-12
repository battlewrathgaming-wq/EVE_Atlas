const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildWatchDiscoveryAcquisitionSplitFixturePreview } = require('../src/main/services/watchDiscoveryAcquisitionSplitFixtureService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-07T15:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601, 30003602];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('actor dispatch to Discovery acquisition', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['complete_refs_found']
    }, verifyActorBridge);
    await verifyCase('system/radius dispatch to Discovery acquisition', insertSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['complete_refs_found', 'complete_no_refs', 'provider_deferred', 'failed_retryable']
    }, verifySystemBridge);
    await verifyCase('no refs outcome', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['complete_no_refs']
    }, (proof) => verifySingleOutcome(proof, 'complete_no_refs'));
    await verifyCase('provider deferred outcome', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['provider_deferred']
    }, (proof) => verifySingleOutcome(proof, 'provider_deferred'));
    await verifyCase('acquisition capped outcome', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['acquisition_capped']
    }, verifyAcquisitionCapped);
    await verifyCase('retryable failure outcome', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['failed_retryable']
    }, (proof) => verifySingleOutcome(proof, 'failed_retryable'));
    await verifyCase('terminal failure outcome', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['failed_terminal']
    }, (proof) => verifySingleOutcome(proof, 'failed_terminal'));
    await verifyCase('held by External I/O before acquisition', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      externalIoState: 'off'
    }, verifyHeldByExternalIo);
    await verifyServiceCommand();

    console.log(JSON.stringify({
      status: 'Watch-to-Discovery acquisition split fixture bridge validated',
      command: 'watch.discovery_acquisition_split_fixture.preview',
      sample_actor_bridge: await sample(insertActorOnly, {
        sessionArmed: true,
        liveApiEnabled: true,
        fixtureOutcomes: ['complete_refs_found']
      }),
      sample_system_radius_bridge: await sample(insertSystemOnly, {
        sessionArmed: true,
        liveApiEnabled: true,
        fixtureOutcomes: ['complete_refs_found', 'complete_no_refs', 'provider_deferred', 'failed_retryable']
      }),
      sample_held_bridge: await sample(insertActorOnly, {
        sessionArmed: true,
        liveApiEnabled: true,
        externalIoState: 'off'
      })
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Watch-to-Discovery acquisition split fixture bridge validated');
}

async function verifyCase(label, insertRows, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const before = sideEffectCounts(db);
    const proof = buildWatchDiscoveryAcquisitionSplitFixturePreview(db, { now: NOW, ...input });
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
    insertActorOnly(db);
    const before = sideEffectCounts(db);
    const result = await invokeServiceCommand('watch.discovery_acquisition_split_fixture.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['complete_refs_found']
    }, { db });
    const after = sideEffectCounts(db);
    verifyActorBridge(result);
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
    const proof = buildWatchDiscoveryAcquisitionSplitFixturePreview(db, { now: NOW, ...input });
    return {
      source_watch: proof.source_watch,
      current_dispatch_payload_basis: proof.current_dispatch_payload_basis,
      discovery_acquisition_request: proof.discovery_acquisition_request,
      pickup_packet_count: proof.pickup_packet_count,
      packet_targets: proof.packet_targets,
      fixture_provider_outcome_summary: proof.fixture_provider_outcome_summary,
      canonical_discovery_receipt_basis: proof.canonical_discovery_receipt_basis,
      watch_summary_projection: proof.watch_summary_projection,
      mixed_collector_non_invocation_proof: proof.mixed_collector_non_invocation_proof,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyActorBridge(proof) {
  assert(proof.source_kind === 'watch_actor', 'actor bridge should report watch_actor source');
  assert(proof.source_watch.watch_type === 'actor', 'actor source Watch should be selected');
  assert(proof.current_dispatch_payload_basis.would_be_command === 'actor.watch', 'actor dispatch command should be actor.watch');
  assert(proof.current_dispatch_payload_basis.dispatch_for_command === 'actor.watch', 'dispatchFor actor command should match');
  assert(proof.current_dispatch_payload_basis.payload_parity === 'matches', 'actor payload should match dispatch parity');
  assert(proof.current_dispatch_payload_basis.dispatch_runner_present_but_not_invoked === true, 'actor runner should be present but not invoked');
  assert(proof.discovery_acquisition_request.owner === 'Discovery', 'Discovery should own acquisition request');
  assert(proof.discovery_acquisition_request.source_dispatch_command === 'actor.watch', 'acquisition request should retain source dispatch command');
  assert(proof.discovery_acquisition_request.source_dispatch_payload.entityId === 90000001, 'actor payload entity ID should be preserved');
  assert(proof.pickup_packet_count === 1, 'actor bridge should emit one pickup packet');
  assert(proof.packet_targets.length === 1, 'actor bridge should have one packet target');
  assert(proof.canonical_discovery_receipt_basis.source_intent_kind === 'watch_actor', 'actor receipt should be Watch actor source');
  assert(proof.watch_summary_projection.projection_name === 'watch_summary', 'bridge should emit watch_summary projection');
  assert(proof.watch_summary_projection.packet_outcome_counts.complete_refs_found === 1, 'actor bridge should count refs-found outcome');
  verifyMixedCollectorsNotInvoked(proof);
}

function verifySystemBridge(proof) {
  assert(proof.source_kind === 'watch_system_radius', 'system bridge should report watch_system_radius source');
  assert(proof.source_watch.watch_type === 'system_radius', 'system source Watch should be selected');
  assert(proof.current_dispatch_payload_basis.would_be_command === 'system.radius.watch', 'system dispatch command should be system.radius.watch');
  assert(proof.current_dispatch_payload_basis.dispatch_for_command === 'system.radius.watch', 'dispatchFor system command should match');
  assert(proof.current_dispatch_payload_basis.payload_parity === 'matches', 'system payload should match dispatch parity');
  assert(proof.current_dispatch_payload_basis.dispatch_runner_present_but_not_invoked === true, 'system runner should be present but not invoked');
  assertSame(proof.discovery_acquisition_request.accepted_scope_basis.accepted_system_ids, ACCEPTED_IDS, 'Discovery acquisition should preserve accepted stored IDs');
  assert(proof.discovery_acquisition_request.accepted_scope_basis.center_radius_used_as_execution_authority === false, 'center/radius should not become execution authority');
  assert(proof.pickup_packet_count === ACCEPTED_IDS.length, 'system bridge should emit one pickup packet per accepted ID');
  assertSame(proof.packet_targets.map((target) => target.candidate_system_id), ACCEPTED_IDS, 'packet targets should match accepted IDs');
  assert(proof.canonical_discovery_receipt_basis.scope_basis.center_radius_used_as_execution_authority === false, 'receipt should keep center/radius non-authoritative');
  assertSame(proof.canonical_discovery_receipt_basis.scope_basis.accepted_system_ids, ACCEPTED_IDS, 'receipt should preserve accepted IDs');
  assert(proof.watch_summary_projection.packet_outcome_counts.complete_refs_found === 1, 'system bridge should count refs-found');
  assert(proof.watch_summary_projection.packet_outcome_counts.complete_no_refs === 1, 'system bridge should count no-ref');
  assert(proof.watch_summary_projection.packet_outcome_counts.provider_deferred === 1, 'system bridge should count provider deferred');
  assert(proof.watch_summary_projection.packet_outcome_counts.failed_retryable === 1, 'system bridge should count retryable failure');
  verifyMixedCollectorsNotInvoked(proof);
}

function verifySingleOutcome(proof, outcome) {
  assert(proof.fixture_provider_outcome_summary.packet_outcome_counts[outcome] === 1, `${outcome} should be counted in summary`);
  assert(proof.watch_summary_projection.packet_outcome_counts[outcome] === 1, `${outcome} should be counted in watch_summary`);
  assert(proof.canonical_discovery_receipt_basis.packets[0].outcome === outcome, `canonical packet should emit ${outcome}`);
  assert(!Object.prototype.hasOwnProperty.call(proof.watch_summary_projection.packet_outcome_counts, 'held_by_external_io'), 'held_by_external_io should not be packet outcome');
}

function verifyAcquisitionCapped(proof) {
  verifySingleOutcome(proof, 'acquisition_capped');
  assert(proof.fixture_provider_outcome_summary.cap_basis.capped_packet_count === 1, 'cap basis should count capped packet');
  assert(proof.watch_summary_projection.cap_basis.full_coverage_claimed === false, 'capped acquisition must not claim full coverage');
}

function verifyHeldByExternalIo(proof) {
  assert(proof.discovery_acquisition_request.request_posture === 'held_by_external_io', 'held bridge should mark request-level hold');
  assert(proof.discovery_acquisition_request.held_before_acquisition === true, 'held bridge should hold before acquisition');
  assert(proof.discovery_acquisition_request.packet_count === 0, 'held bridge should forward no acquisition packets');
  assert(proof.pickup_packet_count === 0, 'held bridge should report no pickup packets forwarded');
  assert(proof.packet_targets.length === 0, 'held bridge should emit no packet targets');
  assert(proof.fixture_provider_outcome_summary.attempted_packet_count === 0, 'held bridge should attempt no packets');
  assert(proof.fixture_provider_outcome_summary.completed_packet_count === 0, 'held bridge should complete no packets');
  assert(proof.fixture_provider_outcome_summary.packet_outcomes_emitted === false, 'held bridge should emit no packet outcomes');
  assert(Object.keys(proof.fixture_provider_outcome_summary.packet_outcome_counts).length === 0, 'held bridge should have no packet outcomes');
  assert(proof.fixture_provider_outcome_summary.no_packet_outcome_for_held_by_external_io === true, 'held should not be packet outcome');
  assert(proof.watch_summary_projection.request_posture === 'held_by_external_io', 'watch_summary should keep held request posture');
  verifyMixedCollectorsNotInvoked(proof);
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
  assert(proof.dispatch_runner_invoked === false, `${label} should not invoke dispatch runner`);
  assert(proof.dispatch_runner_invocations === 0, `${label} should not invoke dispatch runners`);
  assert(proof.collectors_called === false, `${label} should not call collectors`);
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
  assert(proof.discovery_refs_mutated === 0, `${label} should not mutate Discovery refs`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence/EVEidence`);
  assert(proof.esi_evidence_expansion_run === false, `${label} should not run ESI Evidence Expansion`);
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
  assert(proof.canonical_discovery_receipt_basis.boundary_flags.discovery_owns_receipt_basis === true, `${label} should keep Discovery as receipt owner`);
  assert(proof.canonical_discovery_receipt_basis.boundary_flags.candidate_refs_are_not_evidence === true, `${label} should not treat candidates as Evidence`);
}

function verifyMixedCollectorsNotInvoked(proof) {
  assert(proof.mixed_collector_non_invocation_proof.collectActorWatch_entered === false, 'collectActorWatch should not be entered');
  assert(proof.mixed_collector_non_invocation_proof.collectSystemRadiusWatch_entered === false, 'collectSystemRadiusWatch should not be entered');
  assert(proof.mixed_collector_non_invocation_proof.dispatch_runner_invoked === false, 'dispatch runner should not be invoked');
  assert(proof.mixed_collector_non_invocation_proof.dispatch_runner_invocations === 0, 'dispatch runner invocation count should be zero');
  assert(proof.mixed_collector_non_invocation_proof.excluded_runtime_paths.includes('collectActorWatch'), 'excluded paths should name collectActorWatch');
  assert(proof.mixed_collector_non_invocation_proof.excluded_runtime_paths.includes('collectSystemRadiusWatch'), 'excluded paths should name collectSystemRadiusWatch');
}

function insertActorOnly(db) {
  insertActorWatch(db, { watchId: 1 });
}

function insertSystemOnly(db) {
  insertSystemWatch(db, { watchId: 1, includedSystemIds: JSON.stringify(ACCEPTED_IDS) });
}

function insertActorWatch(db, input = {}) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.watchId,
    input.entityType || 'character',
    input.entityId || 90000001,
    input.entityName || 'Split Fixture Pilot',
    14,
    input.maxKillmailsPerRun || 5,
    input.isActive ?? 1,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS368 split fixture'
  );
}

function insertSystemWatch(db, input = {}) {
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
    input.watchId,
    30003597,
    'Hare',
    1,
    input.includedSystemIds,
    '[]',
    24,
    35,
    input.maxKillmailsPerRun || 8,
    input.isActive ?? 1,
    45,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS368 split fixture'
  );
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    metadata_runs: count(db, 'metadata_runs'),
    ingestion_audits: count(db, 'ingestion_audits'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
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
