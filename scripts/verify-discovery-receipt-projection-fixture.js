const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildDiscoveryReceiptProjectionFixturePreview } = require('../src/main/services/discoveryReceiptProjectionFixtureService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-07T12:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601, 30003602];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('actor refs found minimal', insertActorOnly, {
      projection: 'minimal',
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyActorRefsFoundMinimal);
    await verifyCase('actor no refs', insertActorOnly, {
      projection: 'operator_detail',
      fixtureCase: 'no_refs',
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyActorNoRefs);
    await verifyCase('system/radius packets', insertSystemOnly, {
      projection: 'operator_detail',
      sessionArmed: true,
      liveApiEnabled: true
    }, verifySystemPackets);
    await verifyCase('mixed system rollup watch summary', insertSystemOnly, {
      projection: 'watch_summary',
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: [
        'complete_refs_found',
        'complete_no_refs',
        'provider_deferred',
        'failed_retryable'
      ]
    }, verifyMixedSystemWatchSummary);
    await verifyCase('provider deferred', insertActorOnly, {
      projection: 'operator_detail',
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['provider_deferred']
    }, (proof) => verifySingleOutcome(proof, 'provider_deferred'));
    await verifyCase('acquisition capped', insertActorOnly, {
      projection: 'operator_detail',
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['acquisition_capped']
    }, verifyAcquisitionCapped);
    await verifyCase('retryable failure', insertActorOnly, {
      projection: 'operator_detail',
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['failed_retryable']
    }, (proof) => verifySingleOutcome(proof, 'failed_retryable'));
    await verifyCase('terminal failure', insertActorOnly, {
      projection: 'operator_detail',
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['failed_terminal']
    }, (proof) => verifySingleOutcome(proof, 'failed_terminal'));
    await verifyCase('held by External I/O', () => {}, {
      projection: 'minimal',
      externalIoState: 'off',
      selectedWatch: {
        watch_type: 'actor',
        watch_id: 99,
        scope_key: 'actor:character:90000099'
      }
    }, verifyHeldByExternalIo);
    await verifyCase('debug basis projection', insertSystemOnly, {
      projection: 'debug_basis',
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyDebugBasis);
    await verifyServiceCommand();

    console.log(JSON.stringify({
      status: 'Discovery receipt projection fixture validated',
      command: 'discovery.receipt_projection_fixture.preview',
      sample_minimal: await sample(insertActorOnly, { projection: 'minimal', sessionArmed: true, liveApiEnabled: true }),
      sample_watch_summary: await sample(insertSystemOnly, {
        projection: 'watch_summary',
        sessionArmed: true,
        liveApiEnabled: true,
        fixtureOutcomes: ['complete_refs_found', 'complete_no_refs', 'provider_deferred', 'failed_retryable']
      }),
      sample_operator_detail: await sample(insertSystemOnly, { projection: 'operator_detail', sessionArmed: true, liveApiEnabled: true }),
      sample_debug_basis: await sample(insertSystemOnly, { projection: 'debug_basis', sessionArmed: true, liveApiEnabled: true })
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Discovery receipt projection fixture validated');
}

async function verifyCase(label, insertRows, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const before = sideEffectCounts(db);
    const proof = buildDiscoveryReceiptProjectionFixturePreview(db, { now: NOW, ...input });
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
    const result = await invokeServiceCommand('discovery.receipt_projection_fixture.preview', {
      now: NOW,
      projection: 'minimal',
      sessionArmed: true,
      liveApiEnabled: true
    }, { db });
    const after = sideEffectCounts(db);
    verifyActorRefsFoundMinimal(result);
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
    const proof = buildDiscoveryReceiptProjectionFixturePreview(db, { now: NOW, ...input });
    return {
      canonical_receipt_basis: proof.canonical_receipt_basis,
      projection: proof.projection,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyActorRefsFoundMinimal(proof) {
  const receipt = proof.canonical_receipt_basis;
  assert(receipt.source_intent_kind === 'watch_actor', 'actor receipt should keep source intent kind');
  assert(receipt.source_watch_id === 1, 'actor Watch ID should derive');
  assert(receipt.accepted_packet_count === 1, 'actor should accept one packet');
  assert(receipt.attempted_packet_count === 1, 'actor should attempt one packet');
  assert(receipt.completed_packet_count === 1, 'actor should complete one packet');
  assert(receipt.packet_outcome_counts.complete_refs_found === 1, 'actor should count refs-found outcome');
  assert(receipt.ref_count >= 1, 'actor should include candidate refs');
  assert(receipt.boundary_flags.discovery_owns_receipt_basis === true, 'Discovery should own basis');
  assert(receipt.boundary_flags.caller_satisfaction_not_reported === true, 'receipt should not report caller satisfaction');
  assert(receipt.boundary_flags.candidate_refs_are_not_evidence === true, 'candidate refs should not be Evidence');
  assert(proof.projection.projection_name === 'minimal', 'minimal projection should emit');
  assert(!proof.projection.packets, 'minimal projection should omit packet list');
  assert(proof.projection.packet_outcome_counts.complete_refs_found === 1, 'minimal projection should keep outcome counts');
  assert(proof.projection.omitted_field_note.includes('safety fields'), 'minimal projection should explain omitted fields');
}

function verifyActorNoRefs(proof) {
  const receipt = proof.canonical_receipt_basis;
  assert(receipt.packet_outcome_counts.complete_no_refs === 1, 'actor no-ref should count complete_no_refs');
  assert(receipt.ref_count === 0, 'actor no-ref should include no refs');
  assert(receipt.packets[0].outcome === 'complete_no_refs', 'packet outcome should be complete_no_refs');
}

function verifySystemPackets(proof) {
  const receipt = proof.canonical_receipt_basis;
  assert(receipt.source_intent_kind === 'watch_system_radius', 'system receipt should keep system/radius source');
  assert(receipt.accepted_packet_count === ACCEPTED_IDS.length, 'system should accept one packet per accepted ID');
  assert(receipt.packets.length === ACCEPTED_IDS.length, 'system should emit one packet receipt per accepted ID');
  assertSame(receipt.scope_basis.accepted_system_ids, ACCEPTED_IDS, 'scope basis should preserve accepted IDs');
  const systems = receipt.packets.map((packet) => packet.candidate_system_id);
  assertSame(systems, ACCEPTED_IDS, 'packet candidate systems should match accepted IDs');
  assert(proof.projection.projection_name === 'operator_detail', 'operator_detail should emit');
  assert(proof.projection.packets.length === ACCEPTED_IDS.length, 'operator_detail should include packet detail');
}

function verifyMixedSystemWatchSummary(proof) {
  const receipt = proof.canonical_receipt_basis;
  assert(receipt.packet_outcome_counts.complete_refs_found === 1, 'mixed receipt should count refs found');
  assert(receipt.packet_outcome_counts.complete_no_refs === 1, 'mixed receipt should count no refs');
  assert(receipt.packet_outcome_counts.provider_deferred === 1, 'mixed receipt should count provider deferred');
  assert(receipt.packet_outcome_counts.failed_retryable === 1, 'mixed receipt should count retryable failure');
  assert(receipt.deferred_count === 1, 'mixed receipt should count deferred packets');
  assert(receipt.retryable_count === 1, 'mixed receipt should count retryable failures');
  assert(proof.projection.projection_name === 'watch_summary', 'watch_summary should emit');
  assert(!proof.projection.packets, 'watch_summary should omit packet list');
  assert(proof.projection.recovery_candidate_counts.deferred === 1, 'watch_summary should preserve deferred count');
  assert(proof.projection.projection_transfers_meaning_ownership === false, 'projection should not transfer meaning');
}

function verifySingleOutcome(proof, outcome) {
  const receipt = proof.canonical_receipt_basis;
  assert(receipt.packet_outcome_counts[outcome] === 1, `${outcome} should be counted`);
  assert(receipt.packets[0].outcome === outcome, `packet should emit ${outcome}`);
  assert(!receipt.packets.some((packet) => packet.outcome === 'held_by_external_io'), 'held should not be packet outcome');
}

function verifyAcquisitionCapped(proof) {
  verifySingleOutcome(proof, 'acquisition_capped');
  assert(proof.canonical_receipt_basis.cap_basis.capped_packet_count === 1, 'cap basis should count capped packet');
  assert(proof.canonical_receipt_basis.missing_basis_flags.includes('cap_basis_fixture_only'), 'cap basis should be fixture-only');
}

function verifyHeldByExternalIo(proof) {
  const receipt = proof.canonical_receipt_basis;
  assert(receipt.request_posture === 'held_by_external_io', 'held posture should be request-level');
  assert(receipt.held_before_acquisition === true, 'held receipt should be held before acquisition');
  assert(receipt.attempted_packet_count === 0, 'held receipt should attempt no packets');
  assert(receipt.completed_packet_count === 0, 'held receipt should complete no packets');
  assert(receipt.packet_outcomes_emitted === false, 'held receipt should emit no packet outcomes');
  assert(Object.keys(receipt.packet_outcome_counts).length === 0, 'held receipt should have empty outcome counts');
  assert(receipt.packets.length === 0, 'held receipt should have no packet receipts');
  assert(receipt.missing_basis_flags.includes('held_by_external_io_request_posture_only'), 'held posture should be flagged request-only');
}

function verifyDebugBasis(proof) {
  assert(proof.projection.projection_name === 'debug_basis', 'debug_basis should emit');
  assert(proof.projection.canonical_receipt_basis.receipt_id === proof.canonical_receipt_basis.receipt_id, 'debug_basis should include canonical basis');
  assert(proof.projection.omitted_field_note.includes('full bounded canonical basis'), 'debug_basis should disclose full bounded basis');
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
  assert(proof.dispatch_runner_invocations === 0, `${label} should not invoke dispatch runners`);
  assert(proof.collectors_called === false, `${label} should not call collectors`);
  assert(proof.tasks_created === 0, `${label} should not create tasks`);
  assert(proof.queue_created === false, `${label} should not create queue`);
  assert(proof.dispatcher_created === false, `${label} should not create dispatcher`);
  assert(proof.leases_created === 0, `${label} should not create leases`);
  assert(proof.discovery_refs_written === false, `${label} should not write Discovery refs`);
  assert(proof.discovered_killmail_refs_written === 0, `${label} should not write discovered_killmail_refs`);
  assert(proof.discovery_refs_mutated === 0, `${label} should not mutate Discovery refs`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence/EVEidence`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration`);
  assert(proof.metadata_writes === 0, `${label} should not write metadata`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.data_quality_warning_writes === 0, `${label} should not write warnings`);
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.support_artifacts_created === 0, `${label} should not create support artifacts`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.durable_task_packet_schema_created === false, `${label} should not create durable task/packet schema`);
  assert(proof.canonical_receipt_basis.boundary_flags.evidence_landing_not_performed === true, `${label} should not perform Evidence landing`);
  assert(proof.canonical_receipt_basis.boundary_flags.projection_is_view_only === true, `${label} should keep projection view-only`);
  assert(!proof.canonical_receipt_basis.packets.some((packet) => packet.outcome === 'held_by_external_io'), `${label} should not use held as packet outcome`);
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
    input.entityName || 'Receipt Fixture Pilot',
    14,
    input.maxKillmailsPerRun || 5,
    input.isActive ?? 1,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS363 receipt projection fixture'
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
    'HS363 receipt projection fixture'
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
