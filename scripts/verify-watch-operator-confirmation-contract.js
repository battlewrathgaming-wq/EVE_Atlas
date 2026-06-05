const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const ACCEPTED_IDS = [30003597, 30003601, 30003599, 30003598, 30003596];

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedTopology(db);
    const before = sideEffectCounts(db);
    const visible = await invokeServiceCommand('watch.operator_confirmation_contract.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 1,
      maxSystems: 10,
      preflightVisible: true,
      localTopologyLookupSuccess: true,
      now: '2026-06-05T12:00:00.000Z'
    }, { db, source: 'renderer' });
    const focusHover = await invokeServiceCommand('watch.operator_confirmation_contract.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 1,
      maxSystems: 10,
      focus: true,
      hover: true,
      highlight: true,
      keyboardNavigation: true
    }, { db, source: 'renderer' });
    const confirmed = await invokeServiceCommand('watch.operator_confirmation_contract.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 1,
      maxSystems: 10,
      explicitConfirmation: true,
      lookbackHours: 48,
      maxRefs: 25,
      maxKillmails: 10,
      pollIntervalMinutes: 60,
      active: true,
      notes: 'fixture operator confirmation proof'
    }, { db, source: 'renderer' });
    const capped = await invokeServiceCommand('watch.operator_confirmation_contract.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 1,
      maxSystems: 3,
      explicitConfirmation: true
    }, { db, source: 'renderer' });
    const unknown = await invokeServiceCommand('watch.operator_confirmation_contract.preview', {
      centerSystemName: 'Not Hare',
      radiusJumps: 1,
      explicitConfirmation: true
    }, { db, source: 'renderer' });
    const after = sideEffectCounts(db);

    verifyRegistrationAndCoverage();
    verifyReadOnlyBoundary(visible);
    verifyVisibleNotAccepted(visible);
    verifyPassiveSignalsNotAccepted(focusHover);
    verifyConfirmedPayload(confirmed);
    verifyBlocked({ capped, unknown });
    assertSame(after, before, 'operator confirmation contract preview should not mutate persistent tables');

    console.log(JSON.stringify({
      status: 'Watch operator confirmation contract preview verified',
      action: confirmed.action,
      visible_state: {
        state: visible.contract_state,
        accepted_payload_ready_for_watch_create: visible.accepted_payload_ready_for_watch_create,
        passive_signals: visible.listen_hook_confirmation_boundary
      },
      confirmed_state: {
        state: confirmed.contract_state,
        accepted_payload_ready_for_watch_create: confirmed.accepted_payload_ready_for_watch_create,
        included_system_ids: confirmed.accepted_payload_shape.included_system_ids,
        center_radius_role: confirmed.accepted_payload_shape.stored_scope_authority.center_radius_role,
        would_recompute_topology_from_center_radius: confirmed.accepted_payload_shape.would_recompute_topology_from_center_radius
      },
      blocked_states: {
        capped: capped.contract_state,
        capped_reasons: capped.listen_hook_confirmation_boundary.current_state === 'blocked_not_confirmable' ? capped.expected_states.find((entry) => entry.state === 'blocked_not_confirmable') : null,
        unknown: unknown.contract_state
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

  console.log('Watch operator confirmation contract preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.operator_confirmation_contract.preview');
  assert(command, 'Watch operator confirmation contract command should be registered');
  assert(command.classification === 'read-only', 'Watch operator confirmation contract should be read-only');
  assert(command.effects.includes('read-only'), 'Watch operator confirmation contract should declare read-only effect');
  assert(command.renderer_allowed === true, 'Watch operator confirmation contract should be renderer eligible as a readout');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.operator_confirmation_contract.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'operator confirmation contract should be local DB inspection');
  assert(row?.runtime_context === 'watch_operator_confirmation_contract_readout', 'operator confirmation contract should have readout runtime context');
  assert(row?.external_io_dependency === 'none', 'operator confirmation contract should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'operator confirmation contract should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'watch.operator_confirmation_contract.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only behavior');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.live_api_calls === 0, 'preview should not make live/API calls');
  assert(preview.watch_dispatches === 0, 'preview should not dispatch Watch execution');
  assert(preview.watch_rows_written === 0, 'preview should not write Watch rows');
  assert(preview.would_write_watch_row === false, 'preview should not claim current Watch row write');
  assert(preview.tasks_created === 0, 'preview should not create tasks');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration output');
  assert(preview.metadata_writes === 0, 'preview should not write metadata output');
  assert(preview.schema_changes === 0, 'preview should not change schema');
  assert(preview.support_artifacts_created === 0, 'preview should not create support artifacts');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate runtime enforcement');
  assert(preview.command_blocking_active === false, 'preview should not activate command blocking');
  assert(preview.ui_work === false, 'preview should not add renderer UI');
  assert(preview.popup_modal_behavior === false, 'preview should not add popup/modal behavior');
  assert(preview.final_copy_design === false, 'preview should not add final copy/design');
  assert(preview.table_mutation_proof.unchanged === true, 'preview should prove table counts unchanged internally');
}

function verifyVisibleNotAccepted(preview) {
  assert(preview.source_preflight_action === 'watch.system_radius_authoring_preflight.preview', 'source preflight action should be named');
  assert(preview.source_preflight_status === 'acceptable', 'fixture preflight should be acceptable');
  assert(preview.source_preflight_result_shape.acceptable_for_watch_authoring === true, 'preflight can prepare candidate scope');
  assert(preview.visible_operator_payload_before_acceptance.visible_is_acceptance === false, 'visible payload should not be acceptance');
  assertSame(preview.visible_operator_payload_before_acceptance.included_system_ids, ACCEPTED_IDS, 'visible payload should expose accepted/storable IDs');
  assert(preview.contract_state === 'preflight_visible_not_accepted', 'visible preflight should not be accepted');
  assert(preview.confirmation_ready === true, 'valid visible preflight should be confirmation-ready');
  assert(preview.confirmation_pending_operator_intent === true, 'valid visible preflight should wait for operator intent');
  assert(preview.accepted_payload_ready_for_watch_create === false, 'visible preflight should not produce watch.create payload');
  assert(preview.accepted_payload_shape === null, 'visible preflight should not emit accepted payload');
  assert(preview.listen_hook_confirmation_boundary.list_visible_is_acceptance === false, 'list visible should not be acceptance');
  assert(preview.listen_hook_confirmation_boundary.successful_local_topology_lookup_is_acceptance === false, 'topology lookup success should not be acceptance');
  assert(preview.listen_hook_confirmation_boundary.explicit_operator_confirmation_required === true, 'explicit confirmation should be required');
}

function verifyPassiveSignalsNotAccepted(preview) {
  assert(preview.contract_state === 'confirmation_ready', 'focus/hover/highlight/navigation should leave confirmation ready');
  assert(preview.confirmation_pending_operator_intent === true, 'passive signals should still wait for operator intent');
  assert(preview.accepted_payload_ready_for_watch_create === false, 'passive signals should not produce accepted payload');
  assert(preview.listen_hook_confirmation_boundary.focus_is_acceptance === false, 'focus should not be acceptance');
  assert(preview.listen_hook_confirmation_boundary.hover_is_acceptance === false, 'hover should not be acceptance');
  assert(preview.listen_hook_confirmation_boundary.highlight_is_acceptance === false, 'highlight should not be acceptance');
  assert(preview.listen_hook_confirmation_boundary.keyboard_navigation_is_acceptance === false, 'keyboard navigation should not be acceptance');
}

function verifyConfirmedPayload(preview) {
  assert(preview.contract_state === 'confirmed_accepted_scope_payload', 'explicit confirmation should produce accepted payload state');
  assert(preview.confirmation_ready === true, 'confirmed payload should be confirmation-ready');
  assert(preview.confirmation_pending_operator_intent === false, 'confirmed payload should no longer be pending operator intent');
  assert(preview.accepted_payload_ready_for_watch_create === true, 'explicit confirmation should produce accepted watch.create payload');
  assert(preview.accepted_payload_preserves_exact_included_system_ids === true, 'accepted payload should preserve exact IDs');
  assert(preview.center_radius_role_after_acceptance === 'provenance_explanation_management', 'center/radius should be provenance/management');
  assert(preview.accepted_included_ids_role_after_acceptance === 'stored_scope_authority', 'accepted IDs should be stored scope authority');
  assert(preview.renderer_forgery_posture.renderer_provided_included_ids_authoritative === false, 'renderer IDs should not be authority');
  assert(preview.renderer_forgery_posture.local_validation_required_before_watch_create === true, 'local validation posture should be required');
  assert(preview.acceptance_rules.watch_create_may_receive_accepted_scope_only_after_confirmation === true, 'watch.create may receive scope only after confirmation');
  assert(preview.acceptance_rules.future_accepted_payload_must_not_recompute_topology_from_center_radius === true, 'accepted payload must not recompute from center/radius');
  assert(preview.interaction_agnostic.exact_ui_affordance_parked === true, 'UI affordance should remain parked');
  assert(preview.interaction_agnostic.this_preview_implements_renderer_behavior === false, 'preview should not implement renderer behavior');

  const payload = preview.accepted_payload_shape;
  assert(payload.command === 'watch.create', 'accepted payload should target watch.create');
  assert(payload.watchType === 'system_radius', 'accepted payload should identify system/radius Watch');
  assert(payload.centerSystemId === 30003597, 'payload should preserve center ID as provenance');
  assert(payload.centerSystemName === 'Hare', 'payload should preserve center name as provenance');
  assert(payload.radiusJumps === 1, 'payload should preserve radius as provenance');
  assertSame(payload.included_system_ids, ACCEPTED_IDS, 'payload should preserve exact accepted included IDs');
  assert(payload.accepted_preflight_action === 'watch.system_radius_authoring_preflight.preview', 'payload should carry source preflight action');
  assert(payload.accepted_preflight_status === 'acceptable', 'payload should carry acceptable preflight status');
  assert(payload.included_system_ids_source === 'explicit_operator_confirmed_preflight_included_system_ids', 'payload should carry explicit confirmation source');
  assert(payload.accepted_scope_source === 'operator_confirmation_listen_hook', 'payload should carry listen-hook scope source');
  assert(payload.stored_scope_authority.source === 'accepted_preflight_included_system_ids', 'stored authority source should be accepted preflight IDs');
  assert(payload.stored_scope_authority.topology_recomputed_for_payload === false, 'payload should not recompute topology');
  assert(payload.payload_directly_executable_after_confirmation === true, 'payload should be executable after explicit confirmation under HS312 contract');
  assert(payload.would_recompute_topology_from_center_radius === false, 'payload should not recompute from center/radius');
  assert(payload.renderer_forged_ids_authoritative === false, 'payload should not trust forged renderer IDs');
  assert(payload.settings.lookback_hours === 48, 'settings should carry lookback');
  assert(payload.settings.max_refs === 25, 'settings should carry max refs');
  assert(payload.settings.max_killmails === 10, 'settings should carry max killmails');
  assert(payload.settings.poll_interval_minutes === 60, 'settings should carry poll interval');
  assert(payload.settings.active === true, 'settings should carry active flag');
  assert(payload.settings.notes === 'fixture operator confirmation proof', 'settings should carry notes');
}

function verifyBlocked({ capped, unknown }) {
  for (const preview of [capped, unknown]) {
    assert(preview.contract_state === 'blocked_not_confirmable', 'blocked preflight should not be confirmable');
    assert(preview.confirmation_ready === false, 'blocked preflight should not be confirmation-ready');
    assert(preview.accepted_payload_ready_for_watch_create === false, 'blocked preflight should not produce payload');
    assert(preview.accepted_payload_shape === null, 'blocked preflight should not emit accepted payload');
    assert(preview.expected_states.find((entry) => entry.state === 'blocked_not_confirmable').active === true, 'blocked state should be active');
  }
  assert(capped.source_preflight_status === 'capped_scope_not_acceptable_without_adjustment', 'capped preflight should stay capped');
  assert(capped.visible_operator_payload_before_acceptance.cap_status === 'capped_not_confirmable', 'capped status should be disclosed');
  assert(unknown.source_preflight_status === 'unknown_system', 'unknown preflight should stay unknown');
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
