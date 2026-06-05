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
    const preview = await invokeServiceCommand('watch.system_radius_setup_readout.preview', {
      now: '2026-06-05T12:00:00.000Z'
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    verifyRegistrationAndCoverage();
    verifyReadOnlyBoundary(preview);
    verifyAcceptedModel(preview);
    verifySetupRows(preview);
    assertSame(after, before, 'system/radius setup readout should not mutate persistent tables');

    console.log(JSON.stringify({
      status: 'system/radius Watch setup readout verified',
      action: preview.action,
      summary: preview.summary,
      valid_readout: sample(preview, 1),
      blocked_readouts: [2, 3, 4, 5].map((watchId) => sample(preview, watchId)),
      inactive_readout: sample(preview, 6),
      unknown_name_readout: sample(preview, 7),
      mutation_check: {
        before,
        after,
        unchanged: JSON.stringify(before) === JSON.stringify(after)
      }
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('system/radius Watch setup readout verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.system_radius_setup_readout.preview');
  assert(command, 'system/radius setup readout command should be registered');
  assert(command.classification === 'read-only', 'system/radius setup readout command should be read-only');
  assert(command.effects.includes('read-only'), 'system/radius setup readout command should declare read-only effect');
  assert(command.renderer_allowed === true, 'system/radius setup readout should be renderer eligible as read-only');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.system_radius_setup_readout.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'setup readout command should be local DB inspection');
  assert(row?.runtime_context === 'system_radius_watch_setup_readout', 'setup readout should have readout runtime context');
  assert(row?.external_io_dependency === 'none', 'setup readout should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'setup readout should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'watch.system_radius_setup_readout.preview', 'preview action should be named');
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
  assert(preview.does_not_do.includes('does_not_recompute_accepted_scope_from_center_radius'), 'preview should disclose no center/radius recompute');
}

function verifyAcceptedModel(preview) {
  assert(preview.accepted_model.stored_included_system_ids_role === 'accepted_watch_scope_authority', 'stored included IDs should be authority');
  assert(preview.accepted_model.setup_scope_source === 'stored_included_system_ids', 'setup scope should come from stored IDs');
  assert(preview.accepted_model.center_radius_role === 'provenance_and_management', 'center/radius should be provenance/management');
  assert(preview.accepted_model.readout_role === 'inspection_only', 'readout should be inspection only');
  assert(preview.accepted_model.would_recompute_from_center_radius === false, 'readout should not recompute from center/radius');
}

function verifySetupRows(preview) {
  assert(preview.system_radius_watch_setups.length === 7, 'fixture should expose seven setup rows');
  const valid = byWatch(preview, 1);
  const missing = byWatch(preview, 2);
  const malformed = byWatch(preview, 3);
  const empty = byWatch(preview, 4);
  const invalid = byWatch(preview, 5);
  const inactive = byWatch(preview, 6);
  const unknownName = byWatch(preview, 7);

  assert(valid.is_active === true, 'valid row should be active');
  assert(valid.state === 'active', 'valid row state should be active');
  assert(valid.center_system.role === 'provenance_and_management', 'center system should be provenance/management');
  assert(valid.radius.role === 'provenance_and_management', 'radius should be provenance/management');
  assert(valid.stored_scope_status === 'valid', 'valid row should have valid stored scope');
  assert(valid.ready_for_future_execution_input_from_stored_scope === true, 'valid active stored scope should be ready for future input');
  assert(valid.accepted_scope_authority.source === 'system_watches.included_system_ids', 'accepted authority should come from stored row');
  assert(valid.accepted_scope_authority.center_radius_used_as_authority === false, 'center/radius should not be authority');
  assert(valid.accepted_scope_authority.topology_recomputed_for_readout === false, 'readout should not recompute topology');
  assertSame(valid.accepted_scope_authority.included_system_ids, ACCEPTED_IDS, 'valid row should preserve stored accepted IDs exactly');
  assert(valid.included_system_count === ACCEPTED_IDS.length, 'valid row should count included systems');
  assert(valid.included_systems[0].display_name === 'Hare', 'valid row should use local display names when present');
  assert(valid.included_system_display_names_available === 5, 'valid row should find all local names');
  assert(valid.next_safe_action === 'operator_may_review_setup_then_open_separate_execution_readiness_or_watch_runtime_runway', 'valid row should name safe review action');

  assert(missing.stored_scope_status === 'missing', 'missing scope should be reported');
  assert(missing.blocked_reasons.includes('missing_stored_scope'), 'missing scope should block future input');
  assert(malformed.stored_scope_status === 'malformed', 'malformed scope should be reported');
  assert(malformed.blocked_reasons.includes('malformed_stored_scope'), 'malformed scope should block future input');
  assert(empty.stored_scope_status === 'empty', 'empty scope should be reported');
  assert(empty.blocked_reasons.includes('empty_stored_scope'), 'empty scope should block future input');
  assert(invalid.stored_scope_status === 'invalid', 'invalid scope should be reported');
  assert(invalid.blocked_reasons.includes('invalid_stored_scope'), 'invalid scope should block future input');
  assertSame(invalid.accepted_scope_authority.included_system_ids, [], 'invalid scope should expose no accepted included IDs');
  assertSame(invalid.included_systems, [], 'invalid scope should expose no operator-actionable included systems');
  assertSame(invalid.invalid_scope_diagnostic.diagnostic_parseable_system_ids, [30003597], 'invalid scope should retain parseable subset only as diagnostic detail');
  assert(invalid.invalid_scope_diagnostic.operator_actionable === false, 'invalid diagnostic IDs should not be operator-actionable');
  assert(invalid.invalid_scope_diagnostic.accepted_authority === false, 'invalid diagnostic IDs should not be accepted authority');
  assert(invalid.invalid_scope_diagnostic.execution_authority === false, 'invalid diagnostic IDs should not be execution authority');
  assert(invalid.invalid_scope_diagnostic.repairs_stored_row === false, 'invalid diagnostic should not repair stored row');
  for (const row of [missing, malformed, empty, invalid]) {
    assert(row.ready_for_future_execution_input_from_stored_scope === false, `watch ${row.watch_id} should not be ready`);
    assert(row.included_system_count === 0, `watch ${row.watch_id} should not expose accepted count`);
    assert(row.provider_calls === 0, `watch ${row.watch_id} should not call providers`);
    assert(row.tasks_created === 0, `watch ${row.watch_id} should not create tasks`);
    assert(row.would_dispatch_watch === false, `watch ${row.watch_id} should not dispatch`);
    assert(row.next_safe_action === 'operator_review_stored_scope_before_any_future_execution_runway', `watch ${row.watch_id} should require stored-scope review`);
  }

  assert(inactive.stored_scope_status === 'valid', 'inactive row can still have valid stored scope');
  assert(inactive.state === 'inactive', 'inactive row state should be inactive');
  assert(inactive.ready_for_future_execution_input_from_stored_scope === false, 'inactive row should not be ready for future input');
  assert(inactive.blocked_reasons.includes('inactive_watch'), 'inactive row should report inactive Watch');
  assertSame(inactive.accepted_scope_authority.included_system_ids, ACCEPTED_IDS, 'inactive valid row should still preserve accepted IDs');

  assert(unknownName.stored_scope_status === 'valid', 'unknown-name row should still have valid stored scope');
  assert(unknownName.ready_for_future_execution_input_from_stored_scope === true, 'unknown-name row should still be ready from stored IDs');
  assert(unknownName.included_system_display_names_missing === 1, 'unknown-name row should report missing local display name');
  assert(unknownName.included_systems.some((system) => system.local_name_status === 'missing_local_name'), 'unknown system name should be visible');
  assert(unknownName.accepted_scope_authority.included_system_ids.includes(31000001), 'unknown-name row should preserve raw ID');

  assert(preview.summary.system_radius_watch_count === 7, 'summary should count all rows');
  assert(preview.summary.valid_stored_scope_count === 3, 'summary should count valid stored scopes');
  assert(preview.summary.missing_stored_scope_count === 1, 'summary should count missing stored scope');
  assert(preview.summary.malformed_stored_scope_count === 1, 'summary should count malformed stored scope');
  assert(preview.summary.empty_stored_scope_count === 1, 'summary should count empty stored scope');
  assert(preview.summary.invalid_stored_scope_count === 1, 'summary should count invalid stored scope');
  assert(preview.summary.would_recompute_from_center_radius === false, 'summary should not recompute from center/radius');
  assert(preview.summary.would_dispatch_watch === false, 'summary should not dispatch Watch');
}

function sample(preview, watchId) {
  const row = byWatch(preview, watchId);
  return {
    watch_id: row.watch_id,
    state: row.state,
    center: row.center_system,
    radius: row.radius,
    stored_scope_status: row.stored_scope_status,
    included_system_ids: row.accepted_scope_authority.included_system_ids,
    included_systems: row.included_systems,
    included_system_count: row.included_system_count,
    ready_for_future_execution_input_from_stored_scope: row.ready_for_future_execution_input_from_stored_scope,
    blocked_reasons: row.blocked_reasons,
    next_safe_action: row.next_safe_action
  };
}

function byWatch(preview, watchId) {
  const row = preview.system_radius_watch_setups.find((entry) => entry.watch_id === watchId);
  assert(row, `watch ${watchId} should be present`);
  return row;
}

function seedFixture(db) {
  seedLocalSystems(db);
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
  seedSystemWatch(db, {
    watchId: 7,
    includedSystemIds: JSON.stringify([30003597, 31000001]),
    isActive: 1
  });
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
    'HS320 setup readout fixture'
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
