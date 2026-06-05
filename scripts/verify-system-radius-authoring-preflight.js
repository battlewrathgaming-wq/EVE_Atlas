const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedTopology(db);
    const before = sideEffectCounts(db);
    const acceptable = await invokeServiceCommand('watch.system_radius_authoring_preflight.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 1,
      maxSystems: 10,
      now: '2026-06-05T12:00:00.000Z'
    }, { db, source: 'renderer' });
    const capped = await invokeServiceCommand('watch.system_radius_authoring_preflight.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 1,
      maxSystems: 3
    }, { db, source: 'renderer' });
    const radiusTwo = await invokeServiceCommand('watch.system_radius_authoring_preflight.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 2,
      maxSystems: 10
    }, { db, source: 'renderer' });
    const unknown = await invokeServiceCommand('watch.system_radius_authoring_preflight.preview', {
      centerSystemName: 'Not Hare',
      radiusJumps: 1
    }, { db, source: 'renderer' });
    const invalidRadius = await invokeServiceCommand('watch.system_radius_authoring_preflight.preview', {
      centerSystemName: 'Hare',
      radiusJumps: -1
    }, { db, source: 'renderer' });

    const emptyDb = openDatabase(':memory:');
    migrate(emptyDb);
    const emptyBefore = sideEffectCounts(emptyDb);
    const missingTopology = await invokeServiceCommand('watch.system_radius_authoring_preflight.preview', {
      centerSystemName: 'Hare',
      radiusJumps: 1
    }, { db: emptyDb, source: 'renderer' });
    const emptyAfter = sideEffectCounts(emptyDb);
    closeDatabase(emptyDb);

    const after = sideEffectCounts(db);

    verifyRegistrationAndCoverage();
    verifyReadOnlyBoundary(acceptable);
    verifyAcceptableReadout(acceptable);
    verifyRadiusTwoReadout(radiusTwo);
    verifyCappedReadout(capped);
    verifyInvalidPostures({ unknown, invalidRadius, missingTopology });
    assertSame(after, before, 'system/radius authoring preflight should not mutate persistent tables');
    assertSame(emptyAfter, emptyBefore, 'missing topology preflight should not mutate persistent tables');

    console.log(JSON.stringify({
      status: 'system/radius authoring preflight verified',
      action: acceptable.action,
      sample: {
        heading: acceptable.operator_facing_readout.heading,
        included_system_count: acceptable.included_system_count,
        direct_neighbor_count: acceptable.direct_neighbor_count,
        direct_neighbor_count_role: acceptable.direct_neighbor_count_role,
        included_systems: acceptable.operator_facing_readout.included_systems.map((system) => system.display_name),
        included_system_ids_for_acceptance: acceptable.included_system_ids_for_acceptance,
        acceptable_for_watch_authoring: acceptable.acceptable_for_watch_authoring
      },
      capped: {
        status: capped.status,
        issues: capped.issues,
        guardrails: capped.guardrails
      },
      radius_2: {
        included_system_count: radiusTwo.included_system_count,
        direct_neighbor_count: radiusTwo.direct_neighbor_count,
        included_systems: radiusTwo.operator_facing_readout.included_systems.map((system) => system.display_name),
        included_system_ids_for_acceptance: radiusTwo.included_system_ids_for_acceptance
      },
      invalid_cases: {
        unknown_system: unknown.status,
        invalid_radius: invalidRadius.status,
        missing_topology: missingTopology.status
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

  console.log('system/radius authoring preflight verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.system_radius_authoring_preflight.preview');
  assert(command, 'system/radius authoring preflight command should be registered');
  assert(command.classification === 'read-only', 'system/radius authoring preflight should be read-only');
  assert(command.effects.includes('read-only'), 'system/radius authoring preflight should declare read-only effect');
  assert(command.renderer_allowed === true, 'system/radius authoring preflight should be renderer eligible as a readout');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.system_radius_authoring_preflight.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'system/radius authoring preflight should be local DB inspection');
  assert(row?.runtime_context === 'system_radius_authoring_preflight_readout', 'system/radius authoring preflight should have readout runtime context');
  assert(row?.external_io_dependency === 'none', 'system/radius authoring preflight should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'system/radius authoring preflight should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'watch.system_radius_authoring_preflight.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only behavior');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.live_api_calls === 0, 'preview should not make live/API calls');
  assert(preview.watch_dispatches === 0, 'preview should not dispatch Watch execution');
  assert(preview.watch_rows_written === 0, 'preview should not write Watch rows');
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

function verifyAcceptableReadout(preview) {
  assert(preview.status === 'acceptable', 'valid Hare radius should be acceptable');
  assert(preview.acceptable_for_watch_authoring === true, 'valid Hare radius should be acceptable for authoring');
  assert(preview.selected_center_system.solar_system_name === 'Hare', 'center should resolve to Hare');
  assert(preview.selected_center_system.solar_system_id === 30003597, 'center should resolve Hare ID');
  assert(preview.requested_scope.radius_jumps === 1, 'requested radius should be preserved');
  assert(preview.operator_facing_readout.heading === 'System Hare with a radius of 1 jump:', 'heading should use simple operator-facing shape');
  assert(preview.operator_facing_readout.included_systems_label === 'Included systems', 'included list should use Included systems label');
  assert(preview.operator_facing_readout.included_systems[0].display_name === 'Hare (center)', 'center should be first and marked');
  assert(preview.operator_facing_readout.included_systems[0].center === true, 'center row should be marked');
  assertSame(
    preview.operator_facing_readout.included_systems.map((system) => system.display_name),
    ['Hare (center)', 'Babirmoult', 'Heluene', 'Ogaria', 'Oruse'],
    'included systems should be center first, then local topology systems'
  );
  assert(preview.included_system_count === 5, 'Hare radius 1 should report 5 included systems');
  assert(preview.direct_neighbor_count === 4, 'Hare should report 4 direct neighbors only as detail');
  assert(preview.direct_neighbor_count_role === 'diagnostic_detail_only', 'direct neighbor count should be diagnostic/detail only');
  assertSame(
    preview.included_system_ids_for_acceptance,
    [30003597, 30003601, 30003599, 30003598, 30003596],
    'included IDs should be exact stored scope candidate in display order'
  );
  assertSame(preview.would_store_included_system_ids, preview.included_system_ids_for_acceptance, 'would-store IDs should match accepted included IDs');
  assert(preview.accepted_semantics.radius_scope_includes_center === true, 'accepted semantics should disclose radius includes center');
  assert(preview.accepted_semantics.direct_neighbor_count_excludes_center === true, 'accepted semantics should disclose neighbor count excludes center');
}

function verifyRadiusTwoReadout(preview) {
  assert(preview.status === 'acceptable', 'radius 2 scope should be acceptable when uncapped');
  assert(preview.requested_scope.radius_jumps === 2, 'radius 2 request should be preserved');
  assert(preview.included_system_count === 6, 'radius 2 should include center, direct neighbors, and second-hop systems');
  assert(preview.direct_neighbor_count === 4, 'direct neighbor count should remain immediate-neighbor-only at radius 2');
  assert(preview.included_system_count > preview.direct_neighbor_count + 1, 'radius 2 included count should exceed center plus direct neighbors');
  assert(preview.operator_facing_readout.included_systems[0].display_name === 'Hare (center)', 'radius 2 should keep center first and marked');
  assert(preview.operator_facing_readout.included_systems.some((system) => system.display_name === 'Second Hop'), 'radius 2 should include second-hop system in included scope');
  assertSame(
    preview.included_system_ids_for_acceptance,
    [30003597, 30003601, 30003599, 30003598, 30003596, 30003650],
    'radius 2 acceptance IDs should include full included scope, not direct neighbors only'
  );
  assertSame(preview.would_store_included_system_ids, preview.included_system_ids_for_acceptance, 'radius 2 would-store IDs should match acceptance IDs');
}

function verifyCappedReadout(preview) {
  assert(preview.status === 'capped_scope_not_acceptable_without_adjustment', 'capped scope should be distinguished');
  assert(preview.acceptable_for_watch_authoring === false, 'capped scope should not be accepted silently');
  assert(preview.issues.includes('included_system_scope_capped_by_max_systems'), 'capped issue should be explicit');
  assert(preview.guardrails[0].type === 'max_systems_cap', 'max systems guardrail should be reported');
  assert(preview.guardrails[0].full_included_system_count === 5, 'guardrail should report full included count');
  assert(preview.guardrails[0].returned_included_system_count === 3, 'guardrail should report capped returned count');
  assert(preview.returned_included_system_ids.length === 3, 'capped preflight should expose returned capped IDs as diagnostic detail');
  assert(preview.included_system_ids_for_acceptance.length === 0, 'capped preflight should not expose partial IDs as acceptable stored scope');
  assert(preview.would_store_included_system_ids.length === 0, 'capped preflight should not claim partial IDs would be stored');
}

function verifyInvalidPostures({ unknown, invalidRadius, missingTopology }) {
  assert(unknown.status === 'unknown_system', 'unknown system should be distinguished');
  assert(unknown.acceptable_for_watch_authoring === false, 'unknown system should not be acceptable');
  assert(unknown.issues.some((issue) => issue.includes('was not found')), 'unknown system should explain local lookup miss');
  assert(invalidRadius.status === 'invalid_radius', 'invalid radius should be distinguished');
  assert(invalidRadius.issues.includes('radius_must_be_non_negative'), 'negative radius should be named');
  assert(missingTopology.status === 'missing_topology', 'missing topology should be distinguished');
  assert(missingTopology.issues.includes('local_topology_lookup_missing'), 'missing topology issue should be named');
}

function seedTopology(db) {
  for (const [systemId, name] of [
    [30003597, 'Hare'],
    [30003601, 'Babirmoult'],
    [30003599, 'Heluene'],
    [30003598, 'Ogaria'],
    [30003596, 'Oruse'],
    [30003650, 'Second Hop']
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
  db.prepare('INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type) VALUES (?, ?, ?)')
    .run(30003596, 30003650, 'stargate');
  db.prepare('INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type) VALUES (?, ?, ?)')
    .run(30003650, 30003596, 'stargate');
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
