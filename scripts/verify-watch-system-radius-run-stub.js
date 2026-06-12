const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const NOW = '2026-06-12T12:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601];

async function main() {
  verifyRegistrationAndCoverage();
  await verifyCase('due valid system/radius emits one stub', seedMixedFixture, {
    sessionArmed: true,
    liveApiEnabled: true
  }, verifyMixedFixture);
  await verifyCase('invalid stored scope emits no stub', (db) => {
    seedSystemWatch(db, {
      watchId: 1,
      includedSystemIds: '[30003597,"bad"]'
    });
  }, {
    sessionArmed: true,
    liveApiEnabled: true
  }, (preview) => {
    assert(preview.watch_run_stub === null, 'invalid stored scope should not emit a stub');
    const invalid = byWatch(preview, 1);
    assert(invalid.no_stub_reason === 'watch_scope_authority_invalid', 'invalid scope should block before stub');
    assertSame(invalid.invalid_scope_diagnostic.diagnostic_parseable_system_ids, [30003597], 'parseable subset should be diagnostic only');
    assert(invalid.invalid_scope_diagnostic.execution_authority === false, 'diagnostic subset should not become authority');
  });
  await verifyCase('disarmed session emits no stub', (db) => {
    seedSystemWatch(db, {
      watchId: 1,
      includedSystemIds: JSON.stringify(ACCEPTED_IDS)
    });
  }, {
    sessionArmed: false,
    liveApiEnabled: true
  }, (preview) => {
    assert(preview.watch_run_stub === null, 'disarmed session should not emit a stub');
    assert(byWatch(preview, 1).no_stub_reason === 'session_not_armed', 'disarmed row should name session_not_armed');
  });
  await verifyCase('closed live gate emits no stub without provider calls', (db) => {
    seedSystemWatch(db, {
      watchId: 1,
      includedSystemIds: JSON.stringify(ACCEPTED_IDS)
    });
  }, {
    sessionArmed: true,
    liveApiEnabled: false
  }, (preview) => {
    assert(preview.watch_run_stub === null, 'closed live gate should not emit a scheduler due stub');
    assert(byWatch(preview, 1).no_stub_reason === 'live_api_disabled', 'closed live gate should be disclosed as waiting');
    assert(preview.provider_calls === 0, 'closed gate proof should not call providers');
  });

  console.log(JSON.stringify({
    status: 'System/radius Watch-run stub preview verified',
    command: 'watch.system_radius_run_stub.preview',
    cases: [
      'due_valid_one_stub',
      'invalid_stored_scope_no_stub',
      'disarmed_no_stub',
      'closed_live_gate_no_stub'
    ],
    sample: await sampleOutput()
  }, null, 2));
  console.log('System/radius Watch-run stub preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.system_radius_run_stub.preview');
  assert(command, 'system/radius run stub command should be registered');
  assert(command.classification === 'read-only', 'system/radius run stub command should be read-only');
  assert(command.effects.includes('read-only'), 'system/radius run stub command should declare read-only effect');
  assert(command.renderer_allowed === true, 'system/radius run stub command should be renderer eligible as read-only preview');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.system_radius_run_stub.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'run stub should be local DB inspection');
  assert(row?.runtime_context === 'watch_system_radius_run_stub_readout', 'run stub should have readout runtime context');
  assert(row?.external_io_dependency === 'none', 'run stub should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'run stub should remain non-enforcing proof');
}

async function verifyCase(label, seed, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seed(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('watch.system_radius_run_stub.preview', {
      now: NOW,
      ...input
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);
    verifyReadOnlyBoundary(preview, label);
    verifier(preview);
    assertSame(after, before, `${label} should not mutate persistent tables`);
    assert(preview.table_mutation_proof.unchanged === true, `${label} should include unchanged table proof`);
  } finally {
    closeDatabase(db);
  }
}

function verifyMixedFixture(preview) {
  assert(preview.action === 'watch.system_radius_run_stub.preview', 'preview action should be named');
  assert(preview.watch_run_stub_emitted === true, 'valid due fixture should emit a stub');
  assert(preview.watch_run_stub.watch_id === 1, 'stub should select the valid due system Watch');
  assert(preview.watch_run_stub.source_kind === 'watch_system_radius', 'stub should name source kind');
  assert(preview.watch_run_stub.watch_run_id === 'fixture-watch-run:system-radius:1:20260612T120000000Z', 'stub ID should be deterministic fixture ID');
  assertSame(preview.watch_run_stub.accepted_scope.included_system_ids, ACCEPTED_IDS, 'stub should preserve accepted stored included IDs');
  assert(preview.watch_run_stub.accepted_scope.execution_authority === 'stored_included_system_ids', 'stored IDs should be execution authority');
  assert(preview.watch_run_stub.accepted_scope.center_system_id === 30003597, 'center system should be present as provenance');
  assert(preview.watch_run_stub.accepted_scope.radius_jumps === 1, 'radius should be present as provenance');
  assert(preview.watch_run_stub.accepted_scope.center_radius_is_provenance_only === true, 'center/radius should be provenance only');
  assert(preview.watch_run_stub.accepted_scope.center_radius_used_as_execution_authority === false, 'center/radius should not be authority');
  assert(preview.watch_run_stub.window.lookback_seconds === 86400, 'stub should expose lookback window');
  assert(preview.watch_run_stub.window.due_at === NOW, 'stub should expose due time');
  assert(preview.watch_run_stub.window.emitted_at === NOW, 'stub should expose emitted time');
  assert(preview.watch_run_stub.caps.max_systems === ACCEPTED_IDS.length, 'stub max systems should follow accepted scope');
  assert(preview.watch_run_stub.caps.max_refs_per_system === 2, 'stub should expose per-system cap');
  assert(preview.watch_run_stub.caps.max_expansions === 6, 'stub should expose expansion cap');
  assert(preview.watch_run_stub.provenance.source_intent === 'Watch/system-radius', 'stub should expose Watch/system-radius intent');
  assert(preview.watch_run_stub.provenance.scope_provenance === 'system_watches.included_system_ids', 'stub should expose scope provenance');
  assert(preview.watch_run_stub.boundary_flags.candidate_input_for_future_bucket_or_discovery_pickup === true, 'stub should be candidate future input');
  assert(preview.watch_run_stub.boundary_flags.bucket_row_created === false, 'stub should not be a bucket row');
  assert(preview.watch_run_stub.boundary_flags.discovery_pickup_started === false, 'stub should not start pickup');
  assert(preview.watch_run_stub.boundary_flags.discovery_ref_written === false, 'stub should not write refs');
  assert(preview.watch_run_stub.boundary_flags.evidence_or_eveidence === false, 'stub should not be Evidence/EVEidence');
  assert(preview.watch_run_stub.boundary_flags.observation === false, 'stub should not be Observation');
  assert(preview.watch_run_stub.boundary_flags.provider_execution === false, 'stub should not execute providers');

  assert(preview.system_radius_watches.length === 5, 'fixture should expose five system/radius rows');
  assert(byWatch(preview, 2).no_stub_reason === 'inactive', 'inactive row should not emit a stub');
  assert(byWatch(preview, 3).no_stub_reason === 'not_due', 'not-due row should not emit a stub');
  assert(byWatch(preview, 4).no_stub_reason === 'backoff', 'backoff row should not emit a stub');
  assert(byWatch(preview, 5).no_stub_reason === 'watch_scope_authority_invalid', 'invalid row should not emit a stub');
  assert(byWatch(preview, 5).accepted_scope.accepted === false, 'invalid row should not expose accepted authority');
  assertSame(byWatch(preview, 5).accepted_scope.included_system_ids, [], 'invalid row should expose no accepted IDs');

  assert(preview.summary.valid_stub_count === 1, 'summary should count one valid stub candidate');
  assert(preview.summary.emitted_stub_count === 1, 'summary should emit exactly one stub');
  assert(preview.summary.invalid_stored_scope_count === 1, 'summary should count invalid scope');
  assert(preview.accepted_model.stub_is_bucket === false, 'accepted model should separate bucket');
  assert(preview.accepted_model.stub_is_discovery_pickup === false, 'accepted model should separate pickup');
  assert(preview.accepted_model.stub_is_discovery_ref === false, 'accepted model should separate refs');
  assert(preview.accepted_model.stub_is_evidence_or_eveidence === false, 'accepted model should separate Evidence/EVEidence');
  assert(preview.accepted_model.stub_is_observation === false, 'accepted model should separate Observation');
  assert(preview.accepted_model.parked_tension_resolved === false, 'preview should not resolve parked tension');
}

async function sampleOutput() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedMixedFixture(db);
    const preview = await invokeServiceCommand('watch.system_radius_run_stub.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true
    }, { db });
    return {
      summary: preview.summary,
      watch_run_stub: preview.watch_run_stub,
      invalid_example: byWatch(preview, 5),
      table_mutation_proof: preview.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyReadOnlyBoundary(preview, label) {
  assert(preview.read_only === true, `${label} should declare read-only`);
  assert(preview.mutates_state === false, `${label} should not mutate state`);
  assert(preview.provider_calls === 0, `${label} should not call providers`);
  assert(preview.live_api_calls === 0, `${label} should not make live/API calls`);
  assert(preview.watch_dispatches === 0, `${label} should not dispatch Watch execution`);
  assert(preview.watch_execution === false, `${label} should not execute Watch`);
  assert(preview.watch_executor_tick_called === false, `${label} should not call executor tick`);
  assert(preview.dispatch_runner_invocations === 0, `${label} should not invoke dispatch runners`);
  assert(preview.collectors_called === false, `${label} should not invoke collectors`);
  assert(preview.tasks_created === 0, `${label} should not create tasks`);
  assert(preview.bucket_rows_created === 0, `${label} should not create bucket rows`);
  assert(preview.bucket_rows_persisted === 0, `${label} should not persist bucket rows`);
  assert(preview.discovery_pickup_packets_created === 0, `${label} should not create pickup packets`);
  assert(preview.discovery_pickup_started === false, `${label} should not start Discovery pickup`);
  assert(preview.discovered_killmail_refs_written === 0, `${label} should not write discovered_killmail_refs`);
  assert(preview.discovery_refs_mutated === 0, `${label} should not mutate Discovery refs`);
  assert(preview.evidence_writes === 0, `${label} should not write Evidence/EVEidence`);
  assert(preview.hydration_writes === 0, `${label} should not write Hydration output`);
  assert(preview.metadata_writes === 0, `${label} should not write metadata`);
  assert(preview.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(preview.data_quality_warning_writes === 0, `${label} should not write warnings`);
  assert(preview.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(preview.cadence_mutations === 0, `${label} should not mutate cadence`);
  assert(preview.schema_changes === 0, `${label} should not change schema`);
  assert(preview.support_artifacts_created === 0, `${label} should not create support artifacts`);
  assert(preview.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(preview.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(preview.ui_work === false, `${label} should not do UI work`);
}

function seedMixedFixture(db) {
  seedSystemWatch(db, {
    watchId: 1,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS)
  });
  seedSystemWatch(db, {
    watchId: 2,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    isActive: 0
  });
  seedSystemWatch(db, {
    watchId: 3,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    nextPollAt: '2026-06-12T13:00:00.000Z'
  });
  seedSystemWatch(db, {
    watchId: 4,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    backoffUntil: '2026-06-12T12:30:00.000Z'
  });
  seedSystemWatch(db, {
    watchId: 5,
    includedSystemIds: '[30003597,"bad"]'
  });
}

function seedSystemWatch(db, input = {}) {
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
    6,
    input.isActive ?? 1,
    45,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS463 Watch-run stub fixture'
  );
}

function byWatch(preview, watchId) {
  const row = preview.system_radius_watches.find((entry) => Number(entry.watch_id) === Number(watchId));
  assert(row, `system/radius watch ${watchId} should be present`);
  return row;
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
