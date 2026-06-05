const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');
const { bridgeRows } = require('../src/main/services/systemRadiusReadoutReadinessBridgeService');

const ACCEPTED_IDS = [30003597, 30003601, 30003599, 30003598, 30003596];

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('watch.system_radius_readout_readiness_bridge.preview', {
      now: '2026-06-05T12:00:00.000Z'
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    verifyRegistrationAndCoverage();
    verifyReadOnlyBoundary(preview);
    verifyAcceptedModel(preview);
    verifyBridgeRows(preview);
    const mismatchHandling = verifyMismatchHandling();
    assertSame(after, before, 'system/radius readout/readiness bridge should not mutate persistent tables');

    console.log(JSON.stringify({
      status: 'system/radius Watch readout/readiness bridge verified',
      action: preview.action,
      summary: preview.summary,
      matched_readout_readiness_row: sample(preview, 1),
      blocked_rows: [2, 3, 4, 5].map((watchId) => sample(preview, watchId)),
      inactive_row: sample(preview, 6),
      missing_local_name_row: sample(preview, 7),
      mismatch_handling: mismatchHandling,
      mutation_check: {
        before,
        after,
        unchanged: JSON.stringify(before) === JSON.stringify(after)
      }
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('system/radius Watch readout/readiness bridge verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.system_radius_readout_readiness_bridge.preview');
  assert(command, 'system/radius readout/readiness bridge command should be registered');
  assert(command.classification === 'read-only', 'system/radius readout/readiness bridge should be read-only');
  assert(command.effects.includes('read-only'), 'system/radius readout/readiness bridge should declare read-only effect');
  assert(command.renderer_allowed === true, 'system/radius readout/readiness bridge should be renderer eligible as read-only');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.system_radius_readout_readiness_bridge.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'bridge command should be local DB inspection');
  assert(row?.runtime_context === 'system_radius_readout_readiness_bridge', 'bridge should have readout runtime context');
  assert(row?.external_io_dependency === 'none', 'bridge should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'bridge should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'watch.system_radius_readout_readiness_bridge.preview', 'preview action should be named');
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
  assert(preview.does_not_do.includes('does_not_infer_execution_authority_from_center_radius'), 'preview should disclose no center/radius authority');
}

function verifyAcceptedModel(preview) {
  assert(preview.source_actions.includes('watch.system_radius_setup_readout.preview'), 'bridge should name setup source action');
  assert(preview.source_actions.includes('watch.authored_execution_readiness.preview'), 'bridge should name readiness source action');
  assert(preview.accepted_model.stored_included_system_ids_role === 'shared_authority', 'stored included IDs should be shared authority');
  assert(preview.accepted_model.setup_readout_role === 'what_atlas_accepted_and_stored', 'setup readout role should be explicit');
  assert(preview.accepted_model.execution_readiness_role === 'whether_stored_scope_is_usable_as_future_execution_input', 'readiness role should be explicit');
  assert(preview.accepted_model.bridge_role === 'conformance_proof_only', 'bridge should be proof only');
  assert(preview.accepted_model.center_radius_used_as_authority === false, 'center/radius should not be authority');
  assert(preview.accepted_model.would_recompute_from_center_radius === false, 'bridge should not recompute from center/radius');
}

function verifyBridgeRows(preview) {
  assert(preview.bridge_rows.length === 7, 'fixture should expose seven bridge rows');
  assert(preview.summary.status === 'all_setup_readout_and_readiness_rows_match', 'invalid fixture row should now match after diagnostic quarantine');
  assert(preview.summary.matched_row_count === 7, 'summary should count seven matched rows');
  assert(preview.summary.mismatched_row_count === 0, 'summary should count no mismatches');
  assertSame(preview.summary.mismatch_watch_ids, [], 'summary should have no mismatch watch IDs');

  const valid = byWatch(preview, 1);
  const missing = byWatch(preview, 2);
  const malformed = byWatch(preview, 3);
  const empty = byWatch(preview, 4);
  const invalid = byWatch(preview, 5);
  const inactive = byWatch(preview, 6);
  const unknownName = byWatch(preview, 7);

  assert(valid.conformance_status === 'matched', 'valid active row should match');
  assertSame(valid.stored_included_system_ids.setup, ACCEPTED_IDS, 'valid setup IDs should match accepted IDs');
  assertSame(valid.stored_included_system_ids.readiness, ACCEPTED_IDS, 'valid readiness IDs should match accepted IDs');
  assert(valid.included_system_count.setup === 5, 'valid setup count should be 5');
  assert(valid.included_system_count.readiness === 5, 'valid readiness count should be 5');
  assert(valid.readiness_for_future_execution_input.setup === true, 'valid setup should be ready');
  assert(valid.readiness_for_future_execution_input.readiness === true, 'valid readiness should be ready');
  assert(valid.center_radius_used_as_authority.setup === false, 'setup should not use center/radius authority');
  assert(valid.center_radius_used_as_authority.readiness === false, 'readiness should not use center/radius authority');
  assert(valid.mismatch_fields.length === 0, 'valid row should have no mismatches');

  assertBlocked(missing, 'missing', 'missing_stored_scope');
  assertBlocked(malformed, 'malformed', 'malformed_stored_scope');
  assertBlocked(empty, 'empty', 'empty_stored_scope');
  assertInvalidMatched(invalid);

  assert(inactive.conformance_status === 'matched', 'inactive valid row should match');
  assert(inactive.stored_scope_status.setup === 'valid', 'inactive setup scope should remain valid');
  assert(inactive.readiness_for_future_execution_input.setup === false, 'inactive setup should not be ready');
  assert(inactive.readiness_for_future_execution_input.readiness === false, 'inactive readiness should not be ready');
  assert(inactive.blocked_reasons.setup.includes('inactive_watch'), 'inactive setup should disclose inactive Watch');
  assert(inactive.blocked_reasons.readiness.includes('inactive_watch'), 'inactive readiness should disclose inactive Watch');

  assert(unknownName.conformance_status === 'matched', 'missing local display name row should still match');
  assertSame(unknownName.stored_included_system_ids.setup, [30003597, 31000001], 'setup should preserve raw unknown-name ID');
  assertSame(unknownName.stored_included_system_ids.readiness, [30003597, 31000001], 'readiness should preserve raw unknown-name ID');
  assert(unknownName.readiness_for_future_execution_input.setup === true, 'unknown-name setup should be ready from raw IDs');
  assert(unknownName.readiness_for_future_execution_input.readiness === true, 'unknown-name readiness should be ready from raw IDs');
}

function assertBlocked(row, status, reason) {
  assert(row.conformance_status === 'matched', `${status} row should match`);
  assert(row.stored_scope_status.setup === status, `${status} setup status should match`);
  assert(row.stored_scope_status.readiness === status, `${status} readiness status should match`);
  assert(row.readiness_for_future_execution_input.setup === false, `${status} setup should not be ready`);
  assert(row.readiness_for_future_execution_input.readiness === false, `${status} readiness should not be ready`);
  assert(row.blocked_reasons.setup.includes(reason), `${status} setup should include ${reason}`);
  assert(row.blocked_reasons.readiness.includes(reason), `${status} readiness should include ${reason}`);
  assert(row.mismatch_fields.length === 0, `${status} row should have no mismatch fields`);
}

function assertInvalidMatched(row) {
  assert(row.conformance_status === 'matched', 'invalid row should match once diagnostic IDs are quarantined');
  assert(row.stored_scope_status.setup === 'invalid', 'invalid setup status should match');
  assert(row.stored_scope_status.readiness === 'invalid', 'invalid readiness status should match');
  assertSame(row.stored_included_system_ids.setup, [], 'invalid setup should expose no accepted included IDs');
  assertSame(row.stored_included_system_ids.readiness, [], 'invalid readiness should expose no stored-scope included IDs');
  assertSame(row.invalid_scope_diagnostic.setup.diagnostic_parseable_system_ids, [30003597], 'invalid setup diagnostic should retain parseable subset');
  assertSame(row.invalid_scope_diagnostic.readiness.diagnostic_parseable_system_ids, [30003597], 'invalid readiness diagnostic should retain parseable subset');
  assert(row.invalid_scope_diagnostic.setup.operator_actionable === false, 'invalid setup diagnostic should not be operator-actionable');
  assert(row.invalid_scope_diagnostic.readiness.operator_actionable === false, 'invalid readiness diagnostic should not be operator-actionable');
  assert(row.readiness_for_future_execution_input.setup === false, 'invalid setup should not be ready');
  assert(row.readiness_for_future_execution_input.readiness === false, 'invalid readiness should not be ready');
  assert(row.blocked_reasons.setup.includes('invalid_stored_scope'), 'invalid setup should include invalid_stored_scope');
  assert(row.blocked_reasons.readiness.includes('invalid_stored_scope'), 'invalid readiness should include invalid_stored_scope');
  assert(row.mismatch_fields.length === 0, 'invalid row should have no mismatch fields');
  assert(row.mismatch_handling === 'no_mismatch', 'invalid row should not report mismatch handling');
}

function verifyMismatchHandling() {
  const rows = bridgeRows({
    system_radius_watch_setups: [{
      watch_id: 99,
      is_active: true,
      stored_scope_status: 'valid',
      accepted_scope_authority: {
        included_system_ids: [30003597],
        center_radius_used_as_authority: false
      },
      included_system_count: 1,
      center_system: {
        solar_system_id: 30003597,
        role: 'provenance_and_management'
      },
      radius: {
        radius_jumps: 1
      },
      ready_for_future_execution_input_from_stored_scope: true,
      blocked_reasons: [],
      next_safe_action: 'operator_may_review_setup_then_open_separate_execution_readiness_or_watch_runtime_runway',
      would_recompute_from_center_radius: false
    }]
  }, {
    system_radius_watches: [{
      watch_id: 99,
      authored_settings: { is_active: true },
      stored_scope_status: 'valid',
      stored_scope: {
        included_system_ids: [30003597, 30003601]
      },
      execution_system_count: 2,
      center_system_id: 30003597,
      radius_jumps: 1,
      center_radius_role: 'provenance_and_management',
      center_radius_used_as_execution_authority: false,
      would_recompute_from_center_radius: false,
      execution_ready_from_stored_scope: true,
      blocked_reasons: []
    }]
  });
  const row = rows[0];
  assert(row.conformance_status === 'mismatch', 'test helper should report mismatch');
  assert(row.mismatch_fields.some((entry) => entry.field === 'stored_included_system_ids'), 'mismatch should name stored included IDs');
  assert(row.mismatch_fields.some((entry) => entry.field === 'included_system_count'), 'mismatch should name count');
  assert(row.mismatch_handling === 'reported_only_no_fix_or_mutation', 'mismatch should be report-only');
  return {
    conformance_status: row.conformance_status,
    mismatch_fields: row.mismatch_fields.map((entry) => entry.field),
    mismatch_handling: row.mismatch_handling
  };
}

function sample(preview, watchId) {
  const row = byWatch(preview, watchId);
  return {
    watch_id: row.watch_id,
    conformance_status: row.conformance_status,
    stored_scope_status: row.stored_scope_status,
    stored_included_system_ids: row.stored_included_system_ids,
    invalid_scope_diagnostic: row.invalid_scope_diagnostic,
    included_system_count: row.included_system_count,
    center_radius_role: row.center_radius_role,
    center_radius_used_as_authority: row.center_radius_used_as_authority,
    readiness_for_future_execution_input: row.readiness_for_future_execution_input,
    blocked_reasons: row.blocked_reasons,
    next_safe_action: row.next_safe_action,
    mismatch_fields: row.mismatch_fields
  };
}

function byWatch(preview, watchId) {
  const row = preview.bridge_rows.find((entry) => entry.watch_id === watchId);
  assert(row, `watch ${watchId} should be present`);
  return row;
}

function seedFixture(db) {
  seedLocalSystems(db);
  seedSystemWatch(db, { watchId: 1, includedSystemIds: JSON.stringify(ACCEPTED_IDS), isActive: 1 });
  seedSystemWatch(db, { watchId: 2, includedSystemIds: '', isActive: 1 });
  seedSystemWatch(db, { watchId: 3, includedSystemIds: 'not-json', isActive: 1 });
  seedSystemWatch(db, { watchId: 4, includedSystemIds: '[]', isActive: 1 });
  seedSystemWatch(db, { watchId: 5, includedSystemIds: '[30003597,"bad"]', isActive: 1 });
  seedSystemWatch(db, { watchId: 6, includedSystemIds: JSON.stringify(ACCEPTED_IDS), isActive: 0 });
  seedSystemWatch(db, { watchId: 7, includedSystemIds: JSON.stringify([30003597, 31000001]), isActive: 1 });
}

function seedLocalSystems(db) {
  const systems = [
    [30003597, 'Hare'],
    [30003601, 'Babirmoult'],
    [30003599, 'Heluene'],
    [30003598, 'Ogaria'],
    [30003596, 'Oruse']
  ];
  for (const [systemId, systemName] of systems) {
    db.prepare(`
      INSERT INTO solar_systems (
        solar_system_id, solar_system_name, constellation_id, constellation_name,
        region_id, region_name, security_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(systemId, systemName, 20000304, 'Gallente Fixture', 10000064, 'Essence', 0.5);
  }
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
    'HS322 bridge fixture'
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
