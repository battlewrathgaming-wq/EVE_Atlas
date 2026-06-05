const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('watch.create_mutation_safety_map.preview', {
      now: '2026-06-05T12:00:00.000Z'
    }, { db, source: 'renderer' });
    const after = sideEffectCounts(db);

    verifyRegistrationAndCoverage();
    verifyReadOnlyBoundary(preview);
    verifyCurrentPathAndGap(preview);
    verifyFutureMutationSurface(preview);
    verifyTermAssurance(preview);
    assertSame(after, before, 'watch.create mutation safety map should not mutate persistent tables');

    console.log(JSON.stringify({
      status: 'watch.create mutation safety map verified',
      action: preview.action,
      current_watch_create_consumes_preflight_included_ids: preview.current_watch_create_consumes_preflight_included_ids,
      future_mutation_contract_required: preview.future_mutation_contract_required,
      future_payload_directly_executable_now: preview.future_payload_directly_executable_now,
      expected_future_mutation_target: preview.expected_future_mutation_target,
      current_packet_allows_watch_row_write: preview.current_packet_allows_watch_row_write,
      current_path: preview.current_watch_create_path,
      recomputation_point: preview.current_recomputation_point,
      future_allowed_write_surface: preview.future_allowed_write_surface,
      forbidden_tables: preview.future_forbidden_write_surface.tables,
      term_drift_assurance: {
        status: preview.term_drift_assurance.status,
        flagged_terms: preview.term_drift_assurance.flagged_terms,
        renames_performed: preview.term_drift_assurance.renames_performed,
        protected_word_json_updated: preview.term_drift_assurance.protected_word_json_updated
      },
      mutation_check: {
        before,
        after,
        unchanged: JSON.stringify(before) === JSON.stringify(after)
      }
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('watch.create mutation safety map verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.create_mutation_safety_map.preview');
  assert(command, 'watch.create mutation safety map command should be registered');
  assert(command.classification === 'read-only', 'watch.create mutation safety map should be read-only');
  assert(command.effects.includes('read-only'), 'watch.create mutation safety map should declare read-only effect');
  assert(command.renderer_allowed === true, 'watch.create mutation safety map should be renderer eligible as a readout');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.create_mutation_safety_map.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'watch.create mutation safety map should be local DB inspection');
  assert(row?.runtime_context === 'watch_create_mutation_safety_map_readout', 'watch.create mutation safety map should have readout runtime context');
  assert(row?.external_io_dependency === 'none', 'watch.create mutation safety map should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'watch.create mutation safety map should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'watch.create_mutation_safety_map.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only behavior');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.current_packet_allows_watch_row_write === false, 'current packet should not allow Watch row writes');
  assert(preview.would_write_watch_row === false, 'preview should not claim it will write a Watch row');
  assert(preview.watch_rows_written === 0, 'preview should not write Watch rows');
  assert(preview.watch_dispatches === 0, 'preview should not dispatch Watch execution');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.live_api_calls === 0, 'preview should not make live/API calls');
  assert(preview.tasks_created === 0, 'preview should not create tasks');
  assert(preview.discovery_refs_mutated === 0, 'preview should not mutate Discovery refs');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.evidence_rows_written === 0, 'preview should not write Evidence/EVEidence rows');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration output');
  assert(preview.metadata_writes === 0, 'preview should not write metadata output');
  assert(preview.schema_changes === 0, 'preview should not change schema');
  assert(preview.support_artifacts_created === 0, 'preview should not create support artifacts');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate runtime enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.ui_work === false, 'preview should not add UI work');
  assert(preview.table_mutation_proof.unchanged === true, 'preview should prove table counts unchanged internally');
}

function verifyCurrentPathAndGap(preview) {
  assert(preview.current_watch_create_consumes_preflight_included_ids === false, 'current watch.create should not consume preflight included IDs');
  assert(preview.future_mutation_contract_required === true, 'future mutation contract should be required');
  assert(preview.future_payload_directly_executable_now === false, 'future payload should not be directly executable now');
  assert(preview.expected_future_mutation_target === 'watch.create', 'future mutation target should be watch.create');
  assertSame(
    preview.current_watch_create_path,
    [
      'serviceRegistry watch.create',
      'mutatingActionService.runWatchCreateService',
      'normalizeSystemRadiusWatchScope',
      'watchlistRepository.addSystemRadiusWatch',
      'TopologyService.getSystemsWithinRadius'
    ],
    'current watch.create path should disclose recompute path'
  );
  assert(preview.current_recomputation_point.path.includes('TopologyService.getSystemsWithinRadius'), 'current recompute point should be named');
  assert(preview.current_recomputation_point.consumes_accepted_preflight_included_ids === false, 'recompute point should disclose accepted IDs are not consumed');
  assert(preview.current_system_radius_mutation_inputs.includes('centerSystemId / center_system_id'), 'current center input should be mapped');
  assert(preview.current_system_radius_stored_fields.includes('system_watches.included_system_ids'), 'current stored included field should be mapped');
}

function verifyFutureMutationSurface(preview) {
  assert(preview.future_required_mutation_contract_inputs.includes('included_system_ids'), 'future contract should require accepted included IDs');
  assert(preview.future_allowed_write_surface.table === 'system_watches', 'future write surface should be bounded to system_watches');
  assert(preview.future_allowed_write_surface.fields.includes('system_watches.included_system_ids'), 'future write fields should include included_system_ids');
  assert(preview.future_allowed_write_surface.write_authority_basis === 'accepted_preflight_included_system_ids', 'future write basis should be accepted preflight IDs');
  assert(preview.future_allowed_write_surface.confirmation_required === true, 'future mutation should require confirmation');
  assert(preview.future_forbidden_write_surface.tables.includes('killmails'), 'killmails should not be touched');
  assert(preview.future_forbidden_write_surface.tables.includes('discovered_killmail_refs'), 'Discovery refs should not be touched');
  assert(preview.future_forbidden_write_surface.behavior.includes('provider calls'), 'provider calls should be forbidden');
  assert(preview.accepted_scope_authority.center_radius_role === 'provenance_and_explanation_only', 'center/radius should remain provenance');
  assert(preview.accepted_scope_authority.included_system_ids_role === 'future_stored_scope_authority', 'accepted included IDs should be future stored-scope authority');
  assert(preview.accepted_scope_authority.rejected_if_mismatched_or_forged === true, 'mismatched IDs should be rejected later');
  assert(preview.unsafe_or_mismatched_id_rejection_posture.reject_if_claimed_ids_replace_preflight_ids === true, 'future mutation should reject forged replacement IDs');
  assert(preview.readiness.ready_for_mutation_behavior_change_now === false, 'HS310 should not say mutation behavior is ready to change now');
  assert(preview.readiness.ready_for_next_implementation_seam === true, 'HS310 should identify next implementation seam');
}

function verifyTermAssurance(preview) {
  assert(preview.term_drift_assurance.status === 'focused_assurance_warning_only', 'term assurance should be warning-only');
  assert(preview.term_drift_assurance.renames_performed === false, 'term assurance should not rename terms');
  assert(preview.term_drift_assurance.protected_word_json_updated === false, 'term assurance should not update protected-word JSON');
  const terms = new Map(preview.term_drift_assurance.terms.map((entry) => [entry.term, entry]));
  for (const required of [
    'Watch',
    'watch.create',
    'system/radius',
    'radius',
    'included systems',
    'direct neighbors',
    'stargate / topology source data',
    'Discovery',
    'Evidence/EVEidence',
    'Hydration',
    'Observation',
    'Assessment'
  ]) {
    assert(terms.has(required), `${required} should be included in term drift assurance`);
  }
  assert(terms.get('Discovery').note.includes('Possible leads'), 'Discovery term should preserve possible-leads meaning');
  assert(terms.get('Evidence/EVEidence').note.includes('Expanded ESI killmail'), 'Evidence/EVEidence term should preserve evidence boundary');
  assert(terms.get('Hydration').note.includes('Readability'), 'Hydration term should preserve readability meaning');
  assert(preview.term_drift_assurance.flagged_terms.includes('radius'), 'radius should be flagged as caution-prone');
  assert(preview.term_drift_assurance.flagged_terms.includes('stargate / topology source data'), 'topology source wording should be flagged as caution-prone');
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
