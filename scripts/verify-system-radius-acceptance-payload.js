const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedTopology(db);
    const before = sideEffectCounts(db);
    const ready = await invokeServiceCommand('watch.system_radius_acceptance_payload.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 1,
      maxSystems: 10,
      lookbackHours: 48,
      maxRefs: 25,
      maxKillmails: 10,
      pollIntervalMinutes: 60,
      active: true,
      notes: 'fixture acceptance payload proof',
      now: '2026-06-05T12:00:00.000Z'
    }, { db, source: 'renderer' });
    const capped = await invokeServiceCommand('watch.system_radius_acceptance_payload.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 1,
      maxSystems: 3
    }, { db, source: 'renderer' });
    const unknown = await invokeServiceCommand('watch.system_radius_acceptance_payload.preview', {
      centerSystemName: 'Not Hare',
      radiusJumps: 1
    }, { db, source: 'renderer' });
    const invalidRadius = await invokeServiceCommand('watch.system_radius_acceptance_payload.preview', {
      centerSystemName: 'Hare',
      radiusJumps: -1
    }, { db, source: 'renderer' });
    const forged = await invokeServiceCommand('watch.system_radius_acceptance_payload.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 1,
      maxSystems: 10,
      included_system_ids: [30003597, 30003601]
    }, { db, source: 'renderer' });

    const emptyDb = openDatabase(':memory:');
    migrate(emptyDb);
    const emptyBefore = sideEffectCounts(emptyDb);
    const missingTopology = await invokeServiceCommand('watch.system_radius_acceptance_payload.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 1
    }, { db: emptyDb, source: 'renderer' });
    const emptyAfter = sideEffectCounts(emptyDb);
    closeDatabase(emptyDb);

    const after = sideEffectCounts(db);

    verifyRegistrationAndCoverage();
    verifyReadOnlyBoundary(ready);
    verifyReadyPayload(ready);
    verifyRejectedCases({ capped, unknown, invalidRadius, missingTopology, forged });
    assertSame(after, before, 'system/radius acceptance payload preview should not mutate persistent tables');
    assertSame(emptyAfter, emptyBefore, 'missing topology acceptance payload preview should not mutate persistent tables');

    console.log(JSON.stringify({
      status: 'system/radius acceptance payload verified',
      action: ready.action,
      sample: {
        source_preflight_action: ready.source_preflight_action,
        source_preflight_status: ready.source_preflight_status,
        payload_ready_for_future_watch_create: ready.payload_ready_for_future_watch_create,
        current_watch_create_compatibility: ready.current_watch_create_compatibility,
        current_watch_create_consumes_preflight_included_ids: ready.current_watch_create_consumes_preflight_included_ids,
        future_mutation_contract_required: ready.future_mutation_contract_required,
        future_payload_directly_executable_now: ready.future_payload_directly_executable_now,
        future_target_command: ready.future_target_command,
        center_radius_role: ready.center_radius_role,
        stored_scope_authority_role: ready.stored_scope_authority_role,
        included_system_ids: ready.included_system_ids,
        candidate_future_watch_create_payload: ready.candidate_future_watch_create_payload,
        would_write_watch_row: ready.would_write_watch_row,
        watch_rows_written: ready.watch_rows_written,
        watch_dispatches: ready.watch_dispatches,
        provider_calls: ready.provider_calls
      },
      rejected_cases: {
        capped: capped.status,
        unknown_system: unknown.status,
        invalid_radius: invalidRadius.status,
        missing_topology: missingTopology.status,
        forged: forged.status,
        forged_issues: forged.issues
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

  console.log('system/radius acceptance payload verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.system_radius_acceptance_payload.preview');
  assert(command, 'system/radius acceptance payload command should be registered');
  assert(command.classification === 'read-only', 'system/radius acceptance payload should be read-only');
  assert(command.effects.includes('read-only'), 'system/radius acceptance payload should declare read-only effect');
  assert(command.renderer_allowed === true, 'system/radius acceptance payload should be renderer eligible as a readout');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.system_radius_acceptance_payload.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'system/radius acceptance payload should be local DB inspection');
  assert(row?.runtime_context === 'system_radius_acceptance_payload_readout', 'system/radius acceptance payload should have readout runtime context');
  assert(row?.external_io_dependency === 'none', 'system/radius acceptance payload should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'system/radius acceptance payload should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'watch.system_radius_acceptance_payload.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only behavior');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.live_api_calls === 0, 'preview should not make live/API calls');
  assert(preview.watch_dispatches === 0, 'preview should not dispatch Watch execution');
  assert(preview.watch_rows_written === 0, 'preview should not write Watch rows');
  assert(preview.would_write_watch_row === false, 'preview should not claim it will write a Watch row now');
  assert(preview.tasks_created === 0, 'preview should not create tasks');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
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

function verifyReadyPayload(preview) {
  assert(preview.status === 'ready_for_future_mutation_contract_payload', 'valid Hare radius should produce a ready future mutation contract payload');
  assert(preview.source_preflight_action === 'watch.system_radius_authoring_preflight.preview', 'source preflight action should be named');
  assert(preview.source_preflight_status === 'acceptable', 'source preflight should be acceptable');
  assert(preview.acceptable_for_watch_authoring === true, 'preflight should be acceptable for authoring');
  assert(preview.payload_ready_for_future_watch_create === true, 'payload should be ready for future watch.create contract');
  assert(preview.payload_ready_for_future_mutation_contract === true, 'payload should be ready for future mutation contract');
  assert(preview.future_target_command === 'watch.create', 'future target command should be watch.create');
  assert(preview.current_watch_create_compatibility === 'requires_future_mutation_contract', 'preview should disclose current watch.create compatibility gap');
  assert(preview.current_watch_create_consumes_preflight_included_ids === false, 'current watch.create should not be claimed to consume preflight included IDs');
  assert(preview.future_mutation_contract_required === true, 'future mutation contract should be required');
  assert(preview.future_payload_directly_executable_now === false, 'future payload should not be directly executable now');
  assert(preview.current_watch_create_gap.status === 'gap_disclosed', 'current watch.create gap should be disclosed');
  assert(preview.current_watch_create_gap.missing_contract.includes('does not yet consume'), 'current watch.create missing contract should be named');
  assert(preview.current_watch_create_gap.consequence.includes('not a direct current watch.create payload'), 'gap consequence should prevent direct execution claims');
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
  assert(preview.future_write_authority === 'operator_confirmation_required_for_watch_create', 'future write should still require operator confirmation');
  assert(preview.future_write_authority_basis === 'accepted_preflight_included_system_ids', 'future write authority should be based on accepted preflight IDs');
  assert(preview.selected_center_system.solar_system_name === 'Hare', 'center should resolve to Hare');
  assert(preview.radius_jumps === 1, 'radius should be preserved');
  assertSame(preview.included_system_ids, [30003597, 30003601, 30003599, 30003598, 30003596], 'included IDs should come from accepted preflight');
  assert(preview.accepted_included_system_ids_source === 'preflight.included_system_ids_for_acceptance', 'accepted IDs source should be explicit');
  assert(preview.center_radius_role === 'provenance_and_explanation_only', 'center/radius should remain provenance');
  assert(preview.stored_scope_authority_role === 'included_system_ids_are_future_execution_authority_after_watch_create', 'stored included IDs should be future execution authority');
  assert(preview.confirmation_posture.future_confirmation_required === true, 'future watch.create should require confirmation');
  assert(preview.confirmation_posture.confirmation_persisted === false, 'preview should not persist confirmation');
  assert(preview.confirmation_posture.operator_real_watch_write_performed === false, 'preview should not perform operator Watch write');
  assert(preview.candidate_future_watch_create_payload === preview.future_watch_create_payload, 'legacy future payload alias should match candidate future contract payload');
  assert(preview.candidate_future_watch_create_payload.contract_role === 'candidate_future_mutation_contract', 'payload should be marked as a candidate future mutation contract');
  assert(preview.candidate_future_watch_create_payload.directly_executable_by_current_watch_create === false, 'payload should not be marked directly executable now');
  assert(preview.future_watch_create_payload.type === 'system_radius', 'future payload should identify system/radius watch type');
  assertSame(preview.future_watch_create_payload.included_system_ids, preview.included_system_ids, 'future payload should preserve accepted included IDs');
  assertSame(preview.future_watch_create_payload.stored_scope_authority.included_system_ids, preview.included_system_ids, 'stored scope authority should preserve accepted IDs');
  assert(preview.future_watch_create_payload.stored_scope_authority.source === 'accepted_preflight_included_system_ids', 'stored scope source should be accepted preflight');
  assert(preview.future_watch_create_payload.stored_scope_authority.current_watch_create_consumes_this_field === false, 'stored scope authority should disclose current watch.create does not consume it');
  assert(preview.future_watch_create_payload.stored_scope_authority.future_mutation_contract_required === true, 'stored scope authority should require future mutation contract');
  assert(preview.future_watch_create_payload.provenance.center_system_name === 'Hare', 'provenance should keep center name');
  assert(preview.future_watch_create_payload.provenance.radius_jumps === 1, 'provenance should keep radius');
  assert(preview.future_watch_create_payload.settings.lookback_hours === 48, 'operator lookback setting should flow into future payload');
  assert(preview.future_watch_create_payload.settings.max_refs === 25, 'operator max refs setting should flow into future payload');
  assert(preview.future_watch_create_payload.settings.max_killmails === 10, 'operator max killmails setting should flow into future payload');
  assert(preview.future_watch_create_payload.settings.poll_interval_minutes === 60, 'operator poll interval should flow into future payload');
  assert(preview.future_watch_create_payload.settings.active === true, 'operator active state should flow into future payload');
  assert(preview.future_watch_create_payload.settings.notes === 'fixture acceptance payload proof', 'operator notes should flow into future payload');
}

function verifyRejectedCases({ capped, unknown, invalidRadius, missingTopology, forged }) {
  assert(capped.status === 'preflight_capped_not_acceptable', 'capped preflight should not produce payload');
  assert(capped.payload_ready_for_future_watch_create === false, 'capped preflight should not be payload-ready');
  assert(capped.included_system_ids.length === 0, 'capped payload should not expose accepted included IDs');
  assert(capped.future_watch_create_payload === null, 'capped preflight should not emit future watch.create payload');
  assert(capped.issues.includes('preflight_status_capped_scope_not_acceptable_without_adjustment'), 'capped issue should be explicit');

  assert(unknown.status === 'preflight_unknown_system', 'unknown system should not produce payload');
  assert(unknown.payload_ready_for_future_watch_create === false, 'unknown system should not be payload-ready');
  assert(unknown.future_watch_create_payload === null, 'unknown system should not emit future watch.create payload');

  assert(invalidRadius.status === 'preflight_invalid_radius', 'invalid radius should not produce payload');
  assert(invalidRadius.payload_ready_for_future_watch_create === false, 'invalid radius should not be payload-ready');
  assert(invalidRadius.future_watch_create_payload === null, 'invalid radius should not emit future watch.create payload');

  assert(missingTopology.status === 'preflight_missing_topology', 'missing topology should not produce payload');
  assert(missingTopology.payload_ready_for_future_watch_create === false, 'missing topology should not be payload-ready');
  assert(missingTopology.future_watch_create_payload === null, 'missing topology should not emit future watch.create payload');

  assert(forged.status === 'payload_claim_rejected', 'forged included IDs should be rejected');
  assert(forged.payload_ready_for_future_watch_create === false, 'forged included IDs should not be payload-ready');
  assert(forged.future_watch_create_payload === null, 'forged included IDs should not emit future watch.create payload');
  assert(forged.issues.includes('included_system_ids_claim_mismatch'), 'forged mismatch issue should be explicit');
  assert(forged.rejected_payload_claims[0].reason.includes('may not replace'), 'forged rejection should explain authority source');
}

function seedTopology(db) {
  for (const [systemId, name] of [
    [30003597, 'Hare'],
    [30003601, 'Babirmoult'],
    [30003599, 'Heluene'],
    [30003598, 'Ogaria'],
    [30003596, 'Oruse']
  ]) {
    db.prepare(`
      INSERT INTO solar_systems (
        solar_system_id, solar_system_name, constellation_id, constellation_name,
        region_id, region_name, security_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(systemId, name, 20000440, 'Elerelle', 10000048, 'Solitude', 0.2);
  }
  for (const neighbor of [30003601, 30003599, 30003598, 30003596]) {
    db.prepare('INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type) VALUES (?, ?, ?)')
      .run(30003597, neighbor, 'stargate');
    db.prepare('INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type) VALUES (?, ?, ?)')
      .run(neighbor, 30003597, 'stargate');
  }
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
