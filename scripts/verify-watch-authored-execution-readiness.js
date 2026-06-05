const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const ACCEPTED_IDS = [30003597, 30003601, 30003599, 30003598, 30003596];

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('watch.authored_execution_readiness.preview', {
      now: '2026-06-05T12:00:00.000Z'
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    verifyRegistrationAndCoverage();
    verifyReadOnlyBoundary(preview);
    verifyAcceptedModel(preview);
    verifyReadinessRows(preview);
    assertSame(after, before, 'authored Watch execution readiness preview should not mutate persistent tables');

    console.log(JSON.stringify({
      status: 'authored Watch execution readiness preview verified',
      action: preview.action,
      summary: preview.summary,
      future_consumer: preview.future_consumer,
      readiness_samples: preview.system_radius_watches.map((watch) => ({
        watch_id: watch.watch_id,
        ready: watch.execution_ready_from_stored_scope,
        source: watch.execution_scope_source,
        execution_system_ids: watch.execution_system_ids,
        blocked_reasons: watch.blocked_reasons,
        center_radius_role: watch.center_radius_role,
        would_recompute_from_center_radius: watch.would_recompute_from_center_radius,
        would_dispatch_watch: watch.would_dispatch_watch
      })),
      mutation_check: {
        before,
        after,
        unchanged: JSON.stringify(before) === JSON.stringify(after)
      }
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('authored Watch execution readiness preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.authored_execution_readiness.preview');
  assert(command, 'authored Watch execution readiness command should be registered');
  assert(command.classification === 'read-only', 'authored Watch execution readiness command should be read-only');
  assert(command.effects.includes('read-only'), 'authored Watch execution readiness command should declare read-only effect');
  assert(command.renderer_allowed === true, 'authored Watch execution readiness should be renderer eligible as read-only');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.authored_execution_readiness.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'readiness command should be local DB inspection');
  assert(row?.runtime_context === 'authored_watch_execution_readiness_readout', 'readiness command should have readout runtime context');
  assert(row?.external_io_dependency === 'none', 'readiness command should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'readiness command should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'watch.authored_execution_readiness.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only behavior');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.live_api_calls === 0, 'preview should not make live/API calls');
  assert(preview.watch_dispatches === 0, 'preview should not dispatch Watch execution');
  assert(preview.would_dispatch_watch === false, 'preview should not claim dispatch');
  assert(preview.watch_execution_armed === false, 'preview should not arm Watch execution');
  assert(preview.tasks_created === 0, 'preview should not create tasks');
  assert(preview.queue_dispatches === 0, 'preview should not dispatch queues');
  assert(preview.evidence_rows_written === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.discovery_refs_mutated === 0, 'preview should not mutate Discovery refs');
  assert(preview.watch_mutations === 0, 'preview should not mutate Watch rows');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration output');
  assert(preview.metadata_writes === 0, 'preview should not write metadata output');
  assert(preview.api_request_log_writes === 0, 'preview should not write API request logs');
  assert(preview.schema_changes === 0, 'preview should not change schema');
  assert(preview.support_artifacts_created === 0, 'preview should not create support artifacts');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.ui_work === false, 'preview should not do UI work');
  assert(preview.watch_result_created === false, 'preview should not create watch_result');
  assert(preview.relationship_tags_written === 0, 'preview should not write relationship tags');
  assert(preview.table_mutation_proof.unchanged === true, 'preview should prove table counts unchanged internally');
}

function verifyAcceptedModel(preview) {
  assert(preview.accepted_model.stored_included_system_ids_role === 'accepted_watch_scope_authority', 'stored included IDs should be authority');
  assert(preview.accepted_model.execution_scope_source === 'stored_included_system_ids', 'execution scope should come from stored IDs');
  assert(preview.accepted_model.center_radius_role === 'provenance_and_management', 'center/radius should be provenance/management');
  assert(preview.accepted_model.would_recompute_from_center_radius === false, 'accepted Watch readiness should not recompute from center/radius');
  assert(preview.accepted_model.invalid_scope_blocks_before_provider === true, 'invalid scope should block before provider movement');
  assert(preview.future_consumer.command_path.includes('watchExecutor.dispatchFor'), 'future consumer should name dispatchFor');
  assert(preview.future_consumer.future_execution_input_field === 'acceptedSystemIds', 'future execution field should be acceptedSystemIds');
  assert(preview.future_consumer.readiness_is_authorization === false, 'readiness should not be authorization');
}

function verifyReadinessRows(preview) {
  assert(preview.system_radius_watches.length === 6, 'fixture should expose six authored system/radius Watches');
  const ready = byWatch(preview, 1);
  const missing = byWatch(preview, 2);
  const malformed = byWatch(preview, 3);
  const empty = byWatch(preview, 4);
  const invalid = byWatch(preview, 5);
  const inactive = byWatch(preview, 6);

  assert(ready.execution_ready_from_stored_scope === true, 'valid active stored scope should be ready');
  assert(ready.execution_scope_source === 'stored_included_system_ids', 'valid row should derive from stored scope');
  assertSame(ready.execution_system_ids, ACCEPTED_IDS, 'valid row should preserve stored accepted execution IDs exactly');
  assert(ready.center_radius_role === 'provenance_and_management', 'center/radius should be provenance/management');
  assert(ready.would_recompute_from_center_radius === false, 'valid row should not recompute from center/radius');
  assert(ready.would_dispatch_watch === false, 'valid row should not dispatch Watch');
  assert(ready.future_execution_payload.command === 'system.radius.watch', 'valid row should name future execution command');
  assertSame(ready.future_execution_payload.acceptedSystemIds, ACCEPTED_IDS, 'future payload should carry accepted IDs');
  assert(ready.future_execution_payload.acceptedScopeSource === 'stored_watch_scope', 'future payload should carry stored scope source');

  assert(missing.blocked_reasons.includes('missing_stored_scope'), 'missing scope should be blocked');
  assert(malformed.blocked_reasons.includes('malformed_stored_scope'), 'malformed scope should be blocked');
  assert(empty.blocked_reasons.includes('empty_stored_scope'), 'empty scope should be blocked');
  assert(invalid.blocked_reasons.includes('invalid_stored_scope'), 'invalid scope should be blocked');
  assert(inactive.blocked_reasons.includes('inactive_watch'), 'inactive Watch should be blocked');
  for (const row of [missing, malformed, empty, invalid, inactive]) {
    assert(row.execution_ready_from_stored_scope === false, `watch ${row.watch_id} should be blocked`);
    assert(row.ready_status === 'blocked_before_provider_movement', `watch ${row.watch_id} should block before provider movement`);
    assert(row.provider_calls === 0, `watch ${row.watch_id} should not call providers`);
    assert(row.tasks_created === 0, `watch ${row.watch_id} should not create tasks`);
    assert(row.would_dispatch_watch === false, `watch ${row.watch_id} should not dispatch`);
    assert(row.future_execution_payload === null, `watch ${row.watch_id} should not emit executable future payload`);
  }

  assert(preview.summary.ready_watch_count === 1, 'summary should count one ready row');
  assert(preview.summary.blocked_watch_count === 5, 'summary should count five blocked rows');
  assert(preview.summary.missing_stored_scope_count === 1, 'summary should count missing stored scope');
  assert(preview.summary.malformed_stored_scope_count === 1, 'summary should count malformed stored scope');
  assert(preview.summary.empty_stored_scope_count === 1, 'summary should count empty stored scope');
  assert(preview.summary.invalid_stored_scope_count === 1, 'summary should count invalid stored scope');
  assert(preview.summary.inactive_watch_count === 1, 'summary should count inactive Watch');
  assert(preview.summary.would_recompute_from_center_radius === false, 'summary should not recompute from center/radius');
  assert(preview.summary.would_dispatch_watch === false, 'summary should not dispatch Watch');
}

function byWatch(preview, watchId) {
  const row = preview.system_radius_watches.find((entry) => entry.watch_id === watchId);
  assert(row, `watch ${watchId} should be present`);
  return row;
}

function seedFixture(db) {
  seedSystemWatch(db, {
    watchId: 1,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    isActive: 1
  });
  seedSystemWatch(db, {
    watchId: 2,
    includedSystemIds: '',
    isActive: 1
  });
  seedSystemWatch(db, {
    watchId: 3,
    includedSystemIds: 'not-json',
    isActive: 1
  });
  seedSystemWatch(db, {
    watchId: 4,
    includedSystemIds: '[]',
    isActive: 1
  });
  seedSystemWatch(db, {
    watchId: 5,
    includedSystemIds: '[30003597,"bad"]',
    isActive: 1
  });
  seedSystemWatch(db, {
    watchId: 6,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    isActive: 0
  });
}

function seedSystemWatch(db, input) {
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
    48,
    5,
    3,
    input.isActive,
    45,
    null,
    '2026-06-05T13:00:00.000Z',
    null,
    null,
    null,
    'HS314 readiness fixture'
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
