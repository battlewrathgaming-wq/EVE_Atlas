const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const NOW = '2026-06-06T14:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    verifyRegistrationAndCoverage();
    await verifyCase('due actor parity', seedActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyActorParity);
    await verifyCase('due system/radius parity', seedSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifySystemParity);
    await verifyCase('invalid stored scope parity', seedInvalidSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyInvalidScopeParity);
    await verifyCase('waiting rows skipped diagnostic-only', seedWaitingOnly, {
      sessionArmed: true,
      liveApiEnabled: true
    }, verifyWaitingRows);

    console.log(JSON.stringify({
      status: 'Watch packet/dry-run/dispatch parity preview verified',
      command: 'watch.packet_dry_run_dispatch_parity.preview',
      cases: [
        'due_actor_parity',
        'due_system_radius_parity',
        'invalid_stored_scope_blocks_all_surfaces',
        'waiting_rows_skipped_diagnostic_only'
      ],
      sample_actor_parity: await sample(seedActorOnly),
      sample_system_radius_parity: await sample(seedSystemOnly),
      sample_invalid_scope_parity: await sample(seedInvalidSystemOnly)
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Watch packet/dry-run/dispatch parity preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.packet_dry_run_dispatch_parity.preview');
  assert(command, 'Watch packet/dry-run/dispatch parity command should be registered');
  assert(command.classification === 'read-only', 'Watch packet/dry-run/dispatch parity command should be read-only');
  assert(command.effects.includes('read-only'), 'Watch packet/dry-run/dispatch parity command should declare read-only effect');
  assert(command.renderer_allowed === true, 'Watch packet/dry-run/dispatch parity should be renderer eligible as read-only preview');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.packet_dry_run_dispatch_parity.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'parity command should be local DB inspection');
  assert(row?.runtime_context === 'watch_packet_dry_run_dispatch_parity_readout', 'parity command should be classified as readout');
  assert(row?.external_io_dependency === 'none', 'parity command should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'parity command should remain non-enforcing proof');
}

async function verifyCase(label, seed, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seed(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('watch.packet_dry_run_dispatch_parity.preview', {
      now: NOW,
      ...input
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);
    verifier(preview);
    verifyReadOnlyBoundary(preview, label);
    assertSame(after, before, `${label} should not mutate persistent tables`);
    assert(preview.table_mutation_proof.unchanged === true, `${label} should include unchanged table proof`);
  } finally {
    closeDatabase(db);
  }
}

async function sample(seed) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seed(db);
    const preview = await invokeServiceCommand('watch.packet_dry_run_dispatch_parity.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true
    }, { db });
    return preview.parity_rows.map((row) => ({
      watch_type: row.watch_type,
      watch_id: row.watch_id,
      comparison_status: row.comparison_status,
      command_parity: row.command_parity,
      payload_parity: row.payload_parity,
      invalid_scope_parity: row.invalid_scope_parity,
      packet_plan_command: row.packet_plan_command,
      dry_run_command: row.dry_run_command,
      dispatch_for_command: row.dispatch_for_command,
      dispatch_for: row.dispatch_for,
      packet_payload_shape: row.packet_payload_shape,
      dry_run_payload_shape: row.dry_run_payload_shape,
      dispatch_for_payload_shape: row.dispatch_for_payload_shape
    }));
  } finally {
    closeDatabase(db);
  }
}

function verifyActorParity(preview) {
  assert(preview.summary.status === 'parity_proven_for_comparable_rows', 'actor parity should be proven');
  assert(preview.summary.comparable_match_count === 1, 'actor fixture should have one comparable match');
  const row = onlyRow(preview);
  assert(row.watch_type === 'actor', 'actor fixture should compare actor Watch');
  assert(row.selected_by_dry_run === true, 'actor should be selected by dry-run');
  assert(row.comparison_status === 'matches', 'actor row should match');
  assert(row.command_parity === 'matches', 'actor command parity should match');
  assert(row.payload_parity === 'matches', 'actor payload parity should match');
  assert(row.packet_plan_command === 'actor.watch', 'packet plan should name actor.watch');
  assert(row.dry_run_command === 'actor.watch', 'dry-run should name actor.watch');
  assert(row.dispatch_for_command === 'actor.watch', 'dispatchFor should name actor.watch');
  assert(row.packet_payload_shape.entity_type === 'character', 'actor entity type should match');
  assert(row.packet_payload_shape.entity_id === 90000001, 'actor entity ID should match');
  assert(row.packet_payload_shape.lookback_seconds === 14 * 86400, 'actor lookback should match');
  assert(row.packet_payload_shape.max_refs === 5, 'actor max refs should match');
  assert(row.packet_payload_shape.max_expansions === 5, 'actor max expansions should match');
  assert(row.dispatch_for.runner_present_but_not_invoked === true, 'dispatch runner should be present but not invoked');
}

function verifySystemParity(preview) {
  assert(preview.summary.status === 'parity_proven_for_comparable_rows', 'system parity should be proven');
  assert(preview.summary.comparable_match_count === 1, 'system fixture should have one comparable match');
  const row = onlyRow(preview);
  assert(row.watch_type === 'system_radius', 'system fixture should compare system/radius Watch');
  assert(row.selected_by_dry_run === true, 'system/radius should be selected by dry-run');
  assert(row.comparison_status === 'matches', 'system row should match');
  assert(row.command_parity === 'matches', 'system command parity should match');
  assert(row.payload_parity === 'matches', 'system payload parity should match');
  assert(row.packet_plan_command === 'system.radius.watch', 'packet plan should name system.radius.watch');
  assert(row.dry_run_command === 'system.radius.watch', 'dry-run should name system.radius.watch');
  assert(row.dispatch_for_command === 'system.radius.watch', 'dispatchFor should name system.radius.watch');
  assertSame(row.packet_payload_shape.accepted_system_ids, ACCEPTED_IDS, 'packet plan should use stored accepted IDs');
  assertSame(row.dry_run_payload_shape.accepted_system_ids, ACCEPTED_IDS, 'dry-run should use stored accepted IDs');
  assertSame(row.dispatch_for_payload_shape.accepted_system_ids, ACCEPTED_IDS, 'dispatchFor should use stored accepted IDs');
  assert(row.packet_payload_shape.accepted_scope_source === 'stored_watch_scope', 'packet plan should preserve stored scope source');
  assert(row.packet_payload_shape.accepted_scope_provenance.centerSystemId === 30003597, 'packet provenance should preserve center');
  assert(row.packet_payload_shape.accepted_scope_provenance.radiusJumps === 1, 'packet provenance should preserve radius');
  assert(row.packet_payload_shape.center_system_id === 30003597, 'system center should match');
  assert(row.packet_payload_shape.radius_jumps === 1, 'system radius should match');
  assert(row.packet_payload_shape.lookback_seconds === 24 * 3600, 'system lookback should match');
  assert(row.packet_payload_shape.max_systems === ACCEPTED_IDS.length, 'system max systems should match accepted count');
  assert(row.packet_payload_shape.max_refs_per_system === 2, 'system max refs per system should match');
  assert(row.packet_payload_shape.max_expansions === 6, 'system max expansions should match');
  assert(row.selected_scope_authority.center_radius_used_as_authority === false, 'center/radius should not be execution authority');
  assert(row.dispatch_for.runner_present_but_not_invoked === true, 'dispatch runner should be present but not invoked');
}

function verifyInvalidScopeParity(preview) {
  assert(preview.summary.status === 'parity_proven_for_comparable_rows', 'invalid scope blocking parity should be proven');
  assert(preview.summary.invalid_scope_blocked_count === 1, 'invalid fixture should count one invalid scope block');
  const row = onlyRow(preview);
  assert(row.watch_type === 'system_radius', 'invalid fixture should compare system/radius Watch');
  assert(row.selected_by_dry_run === true, 'invalid due row should be selected by dry-run');
  assert(row.comparison_status === 'matches', 'invalid row should match blocked semantics');
  assert(row.packet_plan_status === 'blocked_no_plan', 'invalid packet plan should be blocked/no-plan');
  assert(row.packet_plan_command === null, 'invalid packet plan should have no command');
  assert(row.dry_run_command === null, 'invalid dry-run should have no command');
  assert(row.dispatch_for_command === null, 'invalid dispatchFor should have no command');
  assert(row.invalid_scope_parity === 'matches_blocked_before_task_creation', 'invalid scope should block across all surfaces');
  assert(row.dispatch_for.status === 'blocked', 'dispatchFor should block');
  assert(row.dispatch_for.error_code === 'watch_scope_authority_invalid', 'dispatchFor should throw authority invalid');
  assert(row.selected_invalid_scope_diagnostic.execution_authority === false, 'parseable diagnostic subset should not be execution authority');
}

function verifyWaitingRows(preview) {
  assert(preview.summary.status === 'parity_proven_for_comparable_rows', 'waiting rows should not create parity mismatch');
  assert(preview.summary.skipped_waiting_or_blocked_count === 3, 'waiting fixture should skip three blocked rows');
  assert(preview.dry_run_decision.status === 'idle', 'waiting fixture should idle');
  for (const row of preview.parity_rows) {
    assert(row.selected_by_dry_run === false, 'waiting rows should not be selected');
    assert(row.comparison_status === 'skipped_waiting_or_blocked', 'waiting rows should be skipped');
    assert(row.dispatch_for.status === 'skipped', 'dispatchFor should be skipped for waiting rows');
    assert(row.dispatch_for.diagnostic_only === true, 'skipped dispatchFor comparison should be diagnostic-only');
    assert(row.dispatch_for.runner_invoked === false, 'dispatch runner should not be invoked');
    assert(row.would_create_task === false, 'waiting rows should not create tasks');
  }
}

function verifyReadOnlyBoundary(preview, label) {
  assert(preview.action === 'watch.packet_dry_run_dispatch_parity.preview', `${label} action should be named`);
  assert(preview.read_only === true, `${label} preview should declare read-only`);
  assert(preview.mutates_state === false, `${label} preview should not mutate state`);
  assert(preview.watch_dispatches === 0, `${label} preview should not dispatch Watch execution`);
  assert(preview.watch_execution_armed === false, `${label} preview should not arm Watch execution`);
  assert(preview.tasks_created === 0, `${label} preview should not create tasks`);
  assert(preview.would_create_task === false, `${label} preview should not claim task creation`);
  assert(preview.dispatch_runner_invocations === 0, `${label} preview should not invoke runners`);
  assert(preview.provider_calls === 0, `${label} preview should not call providers`);
  assert(preview.live_api_calls === 0, `${label} preview should not make live/API calls`);
  assert(preview.evidence_writes === 0, `${label} preview should not write Evidence/EVEidence`);
  assert(preview.discovery_refs_mutated === 0, `${label} preview should not mutate Discovery refs`);
  assert(preview.hydration_writes === 0, `${label} preview should not write Hydration output`);
  assert(preview.metadata_writes === 0, `${label} preview should not write metadata`);
  assert(preview.api_request_log_writes === 0, `${label} preview should not write API logs`);
  assert(preview.watch_mutations === 0, `${label} preview should not mutate Watch rows`);
  assert(preview.schema_changes === 0, `${label} preview should not change schema`);
  assert(preview.support_artifacts_created === 0, `${label} preview should not create support artifacts`);
  assert(preview.runtime_enforcement_active === false, `${label} preview should not activate enforcement`);
  assert(preview.command_blocking_active === false, `${label} preview should not activate command blocking`);
  assert(preview.ui_work === false, `${label} preview should not do UI work`);
  assert(preview.parity_is_authorization === false, `${label} parity should not be authorization`);
}

function seedActorOnly(db) {
  seedActorWatch(db, { watchId: 1 });
}

function seedSystemOnly(db) {
  seedSystemWatch(db, { watchId: 1, includedSystemIds: JSON.stringify(ACCEPTED_IDS) });
}

function seedInvalidSystemOnly(db) {
  seedSystemWatch(db, { watchId: 1, includedSystemIds: '[30003597,"bad"]' });
}

function seedWaitingOnly(db) {
  seedActorWatch(db, { watchId: 1, nextPollAt: '2026-06-06T15:00:00.000Z' });
  seedSystemWatch(db, {
    watchId: 1,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    backoffUntil: '2026-06-06T14:30:00.000Z'
  });
  seedSystemWatch(db, {
    watchId: 2,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    isActive: 0
  });
}

function seedActorWatch(db, input = {}) {
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
    input.entityName || 'Parity Pilot',
    14,
    input.maxKillmailsPerRun || 5,
    input.isActive ?? 1,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS334 parity fixture'
  );
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
    input.maxKillmailsPerRun || 6,
    input.isActive ?? 1,
    45,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS334 parity fixture'
  );
}

function onlyRow(preview) {
  assert(preview.parity_rows.length === 1, `expected one parity row, got ${preview.parity_rows.length}`);
  return preview.parity_rows[0];
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
