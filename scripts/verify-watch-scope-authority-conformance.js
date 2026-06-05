const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('watch.scope_authority_conformance.preview', {
      now: '2026-06-05T12:00:00.000Z'
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    verifyRegistrationAndCoverage();
    verifyReadOnlyBoundary(preview);
    verifyAcceptedModel(preview);
    verifyWatchScopeRows(preview);
    verifyCorrectionSeams(preview);
    assertSame(after, before, 'Watch scope authority conformance preview should not mutate persistent tables');

    console.log(JSON.stringify({
      status: 'Watch scope authority conformance preview verified',
      action: preview.action,
      summary: preview.summary,
      topology_lookup_posture: preview.topology_lookup_posture,
      source_path_conformance: preview.source_path_conformance.map((entry) => ({
        path: entry.path,
        role: entry.role,
        status: entry.accepted_model_status,
        correction_needed: entry.correction_needed
      })),
      watch_scope_samples: preview.system_radius_watches.map((watch) => ({
        watch_id: watch.watch_id,
        included_status: watch.stored_scope.included_status,
        stored_included: watch.stored_scope.included_system_ids,
        recomputed: watch.diagnostic_recomputed_scope.system_ids,
        scope_match: watch.diagnostic_recomputed_scope.scope_match,
        execution_status: watch.execution_scope_authority_now.accepted_model_status,
        uses_stored_scope: watch.execution_scope_authority_now.uses_stored_included_system_ids,
        invalid_scope_blocks: watch.execution_scope_authority_now.invalid_scope_blocks_before_provider
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

  console.log('Watch scope authority conformance preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.scope_authority_conformance.preview');
  assert(command, 'Watch scope authority conformance command should be registered');
  assert(command.classification === 'read-only', 'Watch scope authority conformance command should be read-only');
  assert(command.effects.includes('read-only'), 'Watch scope authority conformance command should declare read-only effect');
  assert(command.renderer_allowed === true, 'Watch scope authority conformance command should be renderer eligible as a readout');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.scope_authority_conformance.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'Watch scope authority conformance command should be local DB inspection');
  assert(row?.runtime_context === 'watch_scope_authority_conformance_readout', 'Watch scope authority conformance command should have readout runtime context');
  assert(row?.external_io_dependency === 'none', 'Watch scope authority conformance command should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'Watch scope authority conformance command should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'watch.scope_authority_conformance.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only behavior');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.live_api_calls === 0, 'preview should not make live/API calls');
  assert(preview.watch_dispatches === 0, 'preview should not dispatch Watch execution');
  assert(preview.watch_execution_armed === false, 'preview should not arm Watch execution');
  assert(preview.tasks_created === 0, 'preview should not create tasks');
  assert(preview.queue_dispatches === 0, 'preview should not dispatch queues');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.watch_mutations === 0, 'preview should not mutate Watch rows');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration output');
  assert(preview.metadata_writes === 0, 'preview should not write metadata output');
  assert(preview.api_request_log_writes === 0, 'preview should not write API request logs');
  assert(preview.schema_changes === 0, 'preview should not change schema');
  assert(preview.watch_result_created === false, 'preview should not create watch_result');
  assert(preview.watch_result_items_created === false, 'preview should not create watch_result_items');
  assert(preview.relationship_tags_written === 0, 'preview should not write relationship tags');
  assert(preview.support_artifacts_created === 0, 'preview should not create support artifacts');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.ui_work === false, 'preview should not do UI work');
  assert(preview.table_mutation_proof.unchanged === true, 'preview should prove table counts are unchanged internally');
}

function verifyAcceptedModel(preview) {
  assert(preview.accepted_model.sde_source_material_role === 'import/source_provenance_only', 'SDE source material should be import/source provenance only');
  assert(preview.accepted_model.runtime_geometry_substrate === 'local_topology_lookup_tables', 'runtime geometry should use local topology lookup tables');
  assert(preview.accepted_model.stored_included_system_ids_role === 'accepted_watch_scope_authority', 'stored included IDs should be accepted Watch scope authority');
  assert(preview.accepted_model.center_radius_role_after_acceptance === 'provenance_and_explanation', 'center/radius should be provenance/explanation after acceptance');
  assert(preview.accepted_model.recomputed_topology_role_after_acceptance === 'diagnostic_comparison_only', 'recomputed topology should be diagnostic only');
  assert(preview.accepted_model.discovery_refs_role === 'possible_leads_not_evidence', 'Discovery refs should remain possible leads');
  assert(preview.accepted_model.evidence_eveidence_role === 'ESI-expanded killmail records only', 'Evidence/EVEidence should remain ESI-expanded killmail records');
  assert(preview.topology_lookup_posture.runtime_lookup_authority === 'local_topology_lookup_tables', 'local topology tables should be runtime lookup authority');
  assert(preview.topology_lookup_posture.local_topology_tables_present === true, 'fixture should have local topology tables');
  assert(preview.topology_lookup_posture.local_topology_edges_present === true, 'fixture should have local topology edges');
}

function verifyWatchScopeRows(preview) {
  assert(preview.system_radius_watches.length === 3, 'fixture should expose three system/radius Watches');
  const valid = preview.system_radius_watches.find((watch) => watch.watch_id === 1);
  const missing = preview.system_radius_watches.find((watch) => watch.watch_id === 2);
  const malformed = preview.system_radius_watches.find((watch) => watch.watch_id === 3);

  assert(valid.stored_scope.included_status === 'valid', 'valid stored included scope should be distinguished');
  assert(valid.stored_scope.excluded_status === 'valid', 'valid stored excluded scope should be distinguished');
  assert(valid.stored_scope.accepted_authority === true, 'valid stored included scope should be accepted authority');
  assert(valid.diagnostic_recomputed_scope.status === 'computed', 'valid fixture should compute diagnostic topology');
  assert(valid.diagnostic_recomputed_scope.diagnostic_only_under_accepted_model === true, 'recomputed topology should be diagnostic only');
  assert(valid.diagnostic_recomputed_scope.scope_match === false, 'fixture should distinguish stored authority from recomputed topology');
  assert(valid.execution_scope_authority_now.uses_stored_included_system_ids === true, 'current execution should use stored included IDs');
  assert(valid.execution_scope_authority_now.accepted_system_ids.includes(30000103), 'stored execution authority should include accepted non-recomputed system');
  assert(valid.execution_scope_authority_now.recomputes_from_center_radius === false, 'current execution should not recompute from center/radius');
  assert(valid.execution_scope_authority_now.accepted_model_status === 'conforms', 'current execution should conform for valid stored scope');
  assert(valid.discovery_ref_identity.identity_level === 'center_only', 'system/radius Discovery ref identity should remain center-only');
  assert(valid.discovery_ref_identity.possible_leads_not_evidence === true, 'Discovery refs should remain possible leads');

  assert(missing.stored_scope.included_status === 'not_stored', 'missing stored included scope should be distinguished');
  assert(missing.stored_scope.accepted_authority === false, 'missing stored included scope should not be accepted authority');
  assert(missing.execution_scope_authority_now.invalid_scope_blocks_before_provider === true, 'missing stored scope should block before provider work');
  assert(malformed.stored_scope.included_status === 'malformed', 'malformed stored included scope should be distinguished');
  assert(malformed.stored_scope.accepted_authority === false, 'malformed stored included scope should not be accepted authority');
  assert(malformed.execution_scope_authority_now.invalid_scope_blocks_before_provider === true, 'malformed stored scope should block before provider work');
  assert(preview.summary.missing_stored_scope_count === 1, 'summary should count missing stored scope');
  assert(preview.summary.malformed_stored_scope_count === 1, 'summary should count malformed stored scope');
  assert(preview.summary.stored_vs_recomputed_mismatch_count >= 1, 'summary should count stored versus recomputed mismatch');
}

function verifyCorrectionSeams(preview) {
  assert(preview.summary.accepted_model_conformance === 'conforms', 'summary should report current execution conformance');
  assert(preview.summary.execution_uses_stored_included_ids_now === true, 'summary should claim execution uses stored IDs');
  assert(preview.summary.execution_recomputes_from_center_radius_now === false, 'summary should report execution no longer recomputes from center/radius');
  assert(preview.summary.invalid_stored_scope_blocks_before_provider === true, 'summary should report invalid stored scope blocks before provider work');
  assert(preview.summary.direct_manual_system_radius_preserves_center_radius_planner === true, 'summary should preserve direct/manual center-radius behavior');
  assert(preview.correction_seams.length === 0, 'correction seams should be closed');
  assert(preview.source_path_conformance.find((entry) => entry.path === 'watchlistRepository.addSystemRadiusWatch')?.accepted_model_status === 'conforms', 'authoring should conform to local topology lookup use');
  assert(preview.source_path_conformance.find((entry) => entry.path === 'watchScheduler.buildWatchScheduleStatus')?.accepted_model_status === 'conforms', 'scheduler readout should conform');
  assert(preview.source_path_conformance.find((entry) => entry.path === 'watchExecutor.dispatchFor')?.accepted_model_status === 'conforms', 'executor dispatch should conform');
  assert(preview.source_path_conformance.find((entry) => entry.path === 'systemRadiusCollector.collectSystemRadiusWatch')?.accepted_model_status === 'conforms', 'collector should conform');
  assert(preview.source_path_conformance.find((entry) => entry.path === 'systemRadiusPlanner.planSystemRadiusWatch')?.accepted_model_status === 'conforms', 'planner should conform');
}

function seedFixture(db) {
  seedTopology(db);
  seedSystemWatch(db, {
    watchId: 1,
    centerSystemId: 30000101,
    centerSystemName: 'ATLAS-A',
    radiusJumps: 1,
    includedSystemIds: '[30000101,30000103]',
    excludedSystemIds: '[30000102]'
  });
  seedSystemWatch(db, {
    watchId: 2,
    centerSystemId: 30000102,
    centerSystemName: 'ATLAS-B',
    radiusJumps: 1,
    includedSystemIds: '[]',
    excludedSystemIds: '[]'
  });
  seedSystemWatch(db, {
    watchId: 3,
    centerSystemId: 30000103,
    centerSystemName: 'ATLAS-C',
    radiusJumps: 1,
    includedSystemIds: 'not-json',
    excludedSystemIds: '[]'
  });
}

function seedTopology(db) {
  for (const [systemId, name] of [
    [30000101, 'ATLAS-A'],
    [30000102, 'ATLAS-B'],
    [30000103, 'ATLAS-C']
  ]) {
    db.prepare(`
      INSERT INTO solar_systems (
        solar_system_id, solar_system_name, constellation_id, constellation_name,
        region_id, region_name, security_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(systemId, name, 20000001, 'Atlas Fixture Constellation', 10000001, 'Atlas Fixture Region', 0.4);
  }
  for (const [from, to] of [
    [30000101, 30000102],
    [30000102, 30000101],
    [30000102, 30000103],
    [30000103, 30000102]
  ]) {
    db.prepare('INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type) VALUES (?, ?, ?)')
      .run(from, to, 'stargate');
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
    input.centerSystemId,
    input.centerSystemName,
    input.radiusJumps,
    input.includedSystemIds,
    input.excludedSystemIds,
    24,
    10,
    10,
    1,
    60,
    null,
    '2026-06-05T11:00:00.000Z',
    null,
    null,
    null,
    'HS294 fixture'
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
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
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
