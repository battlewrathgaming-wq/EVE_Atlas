const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

const ACCEPTED_IDS = [30003597, 30003601, 30003599];

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('watch.runtime_packet_plan.preview', {
      now: '2026-06-05T12:00:00.000Z',
      sessionArmed: true,
      liveApiEnabled: true
    }, {
      db,
      source: 'renderer'
    });
    const after = sideEffectCounts(db);

    verifyRegistrationAndCoverage();
    verifyReadOnlyBoundary(preview);
    verifyAcceptedModel(preview);
    verifyPacketPlans(preview);
    assertSame(after, before, 'Watch runtime packet plan preview should not mutate persistent tables');

    console.log(JSON.stringify({
      status: 'Watch runtime packet plan preview verified',
      action: preview.action,
      summary: preview.summary,
      sample_actor_plan: sample(preview, 'actor', 1),
      sample_system_radius_plan: sample(preview, 'system_radius', 1),
      sample_invalid_stored_scope: sample(preview, 'system_radius', 6),
      sample_waiting_rows: [
        sample(preview, 'actor', 2),
        sample(preview, 'system_radius', 3),
        sample(preview, 'system_radius', 4)
      ],
      mutation_check: {
        before,
        after,
        unchanged: JSON.stringify(before) === JSON.stringify(after)
      }
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Watch runtime packet plan preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.runtime_packet_plan.preview');
  assert(command, 'Watch runtime packet plan command should be registered');
  assert(command.classification === 'read-only', 'Watch runtime packet plan command should be read-only');
  assert(command.effects.includes('read-only'), 'Watch runtime packet plan command should declare read-only effect');
  assert(command.renderer_allowed === true, 'Watch runtime packet plan should be renderer eligible as read-only');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'watch.runtime_packet_plan.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'runtime packet plan command should be local DB inspection');
  assert(row?.runtime_context === 'watch_runtime_packet_plan_readout', 'runtime packet plan should have readout runtime context');
  assert(row?.external_io_dependency === 'none', 'runtime packet plan should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'runtime packet plan should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'watch.runtime_packet_plan.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should declare read-only behavior');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.live_api_calls === 0, 'preview should not make live/API calls');
  assert(preview.watch_dispatches === 0, 'preview should not dispatch Watch execution');
  assert(preview.would_dispatch_watch === false, 'preview should not claim dispatch');
  assert(preview.watch_execution_armed === false, 'preview should not arm Watch execution');
  assert(preview.tasks_created === 0, 'preview should not create tasks');
  assert(preview.would_create_task === false, 'preview should not claim task creation');
  assert(preview.runtime_packet_rows_created === 0, 'preview should not create runtime packet rows');
  assert(preview.runtime_packet_rows_persisted === 0, 'preview should not persist runtime packet rows');
  assert(preview.broad_provider_queue_created === false, 'preview should not create a provider queue');
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
  assert(preview.watch_result_created === false, 'preview should not create Watch results');
  assert(preview.relationship_tags_written === 0, 'preview should not write relationship tags');
  assert(preview.readiness_is_authorization === false, 'readiness should not be authorization');
  assert(preview.table_mutation_proof.unchanged === true, 'preview should prove table counts unchanged internally');
}

function verifyAcceptedModel(preview) {
  assert(preview.accepted_model.actor_watch_scope_source === 'watchlist_entities actor Watch source fields', 'actor source should be actor Watch fields');
  assert(preview.accepted_model.system_radius_scope_source === 'stored_included_system_ids', 'system/radius scope should come from stored IDs');
  assert(preview.accepted_model.system_radius_valid_scope_source === 'stored_watch_scope', 'valid system/radius packet source should be stored Watch scope');
  assert(preview.accepted_model.center_radius_role === 'provenance_and_management', 'center/radius should be provenance/management');
  assert(preview.accepted_model.center_radius_used_as_authority === false, 'center/radius should not be authority');
  assert(preview.accepted_model.would_recompute_from_center_radius === false, 'preview should not recompute from center/radius');
  assert(preview.accepted_model.invalid_stored_scope_creates_packet_plan === false, 'invalid scope should not create packet plan');
  assert(preview.accepted_model.preview_is_dispatch === false, 'preview should not be dispatch');
}

function verifyPacketPlans(preview) {
  assert(preview.packet_plans.length === 10, 'fixture should expose ten Watch packet rows');
  const actor = byWatch(preview, 'actor', 1);
  const notDueActor = byWatch(preview, 'actor', 2);
  const system = byWatch(preview, 'system_radius', 1);
  const inactive = byWatch(preview, 'system_radius', 2);
  const notDueSystem = byWatch(preview, 'system_radius', 3);
  const backoff = byWatch(preview, 'system_radius', 4);
  const missing = byWatch(preview, 'system_radius', 5);
  const invalid = byWatch(preview, 'system_radius', 6);
  const malformed = byWatch(preview, 'system_radius', 7);
  const empty = byWatch(preview, 'system_radius', 8);

  assert(actor.packet_plan_status === 'planned', 'valid due actor should plan');
  assert(actor.planned_lane === 'Discovery_then_Evidence_Expansion', 'actor should plan Discovery then Evidence Expansion');
  assert(actor.runtime_packet_plan.command === 'actor.watch', 'actor plan should name actor.watch');
  assert(actor.runtime_packet_plan.zkill_discovery_packet_count === 1, 'actor should have one zKill Discovery packet');
  assert(actor.runtime_packet_plan.esi_evidence_expansion_cap === 7, 'actor should expose ESI expansion cap');
  assert(actor.scope_authority.entity_type === 'character', 'actor source should expose entity type');
  assert(actor.would_dispatch_watch === false, 'actor preview should not dispatch');
  assert(actor.would_create_task === false, 'actor preview should not create tasks');
  assert(actor.provider_calls === 0, 'actor preview should not call providers');
  assert(actor.writes === 0, 'actor preview should not write');

  assert(system.packet_plan_status === 'planned', 'valid due system/radius should plan');
  assert(system.runtime_packet_plan.command === 'system.radius.watch', 'system plan should name system.radius.watch');
  assert(system.scope_authority.acceptedScopeSource === 'stored_watch_scope', 'system plan should use stored Watch scope');
  assertSame(system.scope_authority.accepted_system_ids, ACCEPTED_IDS, 'system scope should preserve accepted stored IDs');
  assertSame(system.selected_accepted_system_ids, ACCEPTED_IDS, 'system runtime selection should use accepted stored IDs');
  assert(system.runtime_packet_plan.zkill_discovery_packet_count === ACCEPTED_IDS.length, 'system zKill packet count should match accepted systems');
  assert(system.runtime_packet_plan.esi_evidence_expansion_cap === 9, 'system should expose ESI expansion cap');
  assert(system.runtime_packet_plan.max_refs_per_system === 3, 'system should expose max refs per system');
  assert(system.scope_authority.center_radius_role === 'provenance_and_management', 'center/radius should be provenance');
  assert(system.scope_authority.center_radius_used_as_authority === false, 'center/radius should not be authority');
  assert(system.scope_authority.would_recompute_from_center_radius === false, 'system plan should not recompute topology');

  assertBlocked(notDueActor, 'not_due');
  assertBlocked(inactive, 'inactive');
  assertBlocked(notDueSystem, 'not_due');
  assertBlocked(backoff, 'backoff');
  assertBlocked(missing, 'missing_stored_scope');
  assertBlocked(malformed, 'malformed_stored_scope');
  assertBlocked(empty, 'empty_stored_scope');

  assert(invalid.packet_plan_status === 'blocked_no_plan', 'invalid stored scope should be blocked/no-plan');
  assert(invalid.runtime_packet_plan === null, 'invalid stored scope should emit no packet plan');
  assertSame(invalid.scope_authority.accepted_system_ids, [], 'invalid stored scope should expose no accepted system IDs');
  assertSame(invalid.selected_accepted_system_ids, [], 'invalid stored scope should select no runtime systems');
  assertSame(invalid.selected_runtime_systems, [], 'invalid stored scope should select no runtime systems');
  assert(invalid.gate_posture.blocked_reasons.includes('watch_scope_authority_invalid'), 'invalid scope should block with authority-invalid reason');
  assertSame(invalid.invalid_scope_diagnostic.diagnostic_parseable_system_ids, [30003597], 'invalid parseable subset should be diagnostic only');
  assert(invalid.invalid_scope_diagnostic.operator_actionable === false, 'invalid diagnostic should not be operator-actionable');
  assert(invalid.invalid_scope_diagnostic.accepted_authority === false, 'invalid diagnostic should not be accepted authority');
  assert(invalid.invalid_scope_diagnostic.execution_authority === false, 'invalid diagnostic should not be execution authority');
  assert(invalid.invalid_scope_diagnostic.selected_runtime_systems === false, 'invalid diagnostic should not be selected runtime systems');
  assert(invalid.invalid_scope_diagnostic.repairs_stored_row === false, 'invalid diagnostic should not repair stored row');

  assert(preview.summary.planned_count === 2, 'summary should count two plans');
  assert(preview.summary.blocked_no_plan_count === 8, 'summary should count eight blocked/no-plan rows');
  assert(preview.summary.actor_plan_count === 1, 'summary should count actor plan');
  assert(preview.summary.system_radius_plan_count === 1, 'summary should count system/radius plan');
  assert(preview.summary.invalid_stored_scope_blocked_count === 1, 'summary should count invalid stored scope block');
  assert(preview.summary.dispatches === 0, 'summary should report no dispatches');
  assert(preview.summary.tasks_created === 0, 'summary should report no tasks');
  assert(preview.summary.provider_calls === 0, 'summary should report no providers');
  assert(preview.summary.writes === 0, 'summary should report no writes');

  assert(notDueSystem.scope_authority.acceptedScopeSource === 'stored_watch_scope', 'not-due valid system should still disclose stored Watch scope authority');
  assert(notDueSystem.scope_authority.accepted_authority === true, 'not-due valid system should still have accepted authority');
  assert(notDueSystem.scope_authority.selected_for_packet_plan === false, 'not-due valid system should not be selected into packet plan');
  assertSame(notDueSystem.selected_accepted_system_ids, [], 'not-due valid system should select no runtime systems');
  assert(backoff.scope_authority.acceptedScopeSource === 'stored_watch_scope', 'backoff valid system should still disclose stored Watch scope authority');
  assert(backoff.scope_authority.accepted_authority === true, 'backoff valid system should still have accepted authority');
  assert(backoff.scope_authority.selected_for_packet_plan === false, 'backoff valid system should not be selected into packet plan');
}

function assertBlocked(row, reason) {
  assert(row.packet_plan_status === 'blocked_no_plan', `watch ${row.watch_type}:${row.watch_id} should be blocked/no-plan`);
  assert(row.runtime_packet_plan === null, `watch ${row.watch_type}:${row.watch_id} should not emit packet plan`);
  assert(row.gate_posture.blocked_reasons.includes(reason), `watch ${row.watch_type}:${row.watch_id} should include ${reason}`);
  assert(row.waiting_is_failure === false, `watch ${row.watch_type}:${row.watch_id} waiting should not be failure`);
  assert(row.would_dispatch_watch === false, `watch ${row.watch_type}:${row.watch_id} should not dispatch`);
  assert(row.would_create_task === false, `watch ${row.watch_type}:${row.watch_id} should not create task`);
  assert(row.provider_calls === 0, `watch ${row.watch_type}:${row.watch_id} should not call providers`);
  assert(row.writes === 0, `watch ${row.watch_type}:${row.watch_id} should not write`);
}

function sample(preview, watchType, watchId) {
  const row = byWatch(preview, watchType, watchId);
  return {
    watch_type: row.watch_type,
    watch_id: row.watch_id,
    scope_key: row.scope_key,
    packet_plan_status: row.packet_plan_status,
    planned_lane: row.planned_lane,
    gate_posture: row.gate_posture,
    scope_authority: row.scope_authority,
    invalid_scope_diagnostic: row.invalid_scope_diagnostic,
    runtime_packet_plan: row.runtime_packet_plan,
    selected_accepted_system_ids: row.selected_accepted_system_ids,
    waiting_is_failure: row.waiting_is_failure,
    would_dispatch_watch: row.would_dispatch_watch,
    would_create_task: row.would_create_task,
    provider_calls: row.provider_calls,
    writes: row.writes
  };
}

function byWatch(preview, watchType, watchId) {
  const row = preview.packet_plans.find((entry) => entry.watch_type === watchType && entry.watch_id === watchId);
  assert(row, `${watchType} watch ${watchId} should be present`);
  return row;
}

function seedFixture(db) {
  seedActorWatch(db, {
    watchId: 1,
    entityType: 'character',
    entityId: 90000001,
    entityName: 'Due Pilot',
    maxKillmailsPerRun: 7,
    isActive: 1
  });
  seedActorWatch(db, {
    watchId: 2,
    entityType: 'corporation',
    entityId: 90000002,
    entityName: 'Future Corp',
    maxKillmailsPerRun: 5,
    isActive: 1,
    nextPollAt: '2026-06-05T13:00:00.000Z'
  });
  seedSystemWatch(db, {
    watchId: 1,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    maxKillmailsPerRun: 9,
    isActive: 1
  });
  seedSystemWatch(db, {
    watchId: 2,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    isActive: 0
  });
  seedSystemWatch(db, {
    watchId: 3,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    isActive: 1,
    nextPollAt: '2026-06-05T13:00:00.000Z'
  });
  seedSystemWatch(db, {
    watchId: 4,
    includedSystemIds: JSON.stringify(ACCEPTED_IDS),
    isActive: 1,
    backoffUntil: '2026-06-05T12:30:00.000Z'
  });
  seedSystemWatch(db, {
    watchId: 5,
    includedSystemIds: '',
    isActive: 1
  });
  seedSystemWatch(db, {
    watchId: 6,
    includedSystemIds: '[30003597,"bad"]',
    isActive: 1
  });
  seedSystemWatch(db, {
    watchId: 7,
    includedSystemIds: 'not-json',
    isActive: 1
  });
  seedSystemWatch(db, {
    watchId: 8,
    includedSystemIds: '[]',
    isActive: 1
  });
}

function seedActorWatch(db, input) {
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
    input.entityType,
    input.entityId,
    input.entityName,
    14,
    input.maxKillmailsPerRun,
    input.isActive,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS327 packet plan fixture'
  );
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
    35,
    input.maxKillmailsPerRun || 6,
    input.isActive,
    45,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS327 packet plan fixture'
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
