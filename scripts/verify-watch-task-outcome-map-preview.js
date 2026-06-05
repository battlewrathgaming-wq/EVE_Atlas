const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('runtime.watch_task_outcome_map.preview', {
      now: '2026-06-05T10:00:00.000Z',
      live_api_enabled: false
    }, {
      db,
      source: 'renderer',
      watchExecutor: fixtureWatchExecutor(),
      taskRunner: fixtureTaskRunner()
    });
    const after = sideEffectCounts(db);

    verifyRegistrationAndCoverage();
    verifyReadOnlyBoundary(preview);
    verifyOriginMap(preview);
    verifyWatchAndTaskState(preview);
    verifySystemRadiusSignals(preview);
    assertSame(after, before, 'Watch/task outcome map preview should not mutate persistent tables');

    console.log(JSON.stringify({
      status: 'Watch/task outcome map preview verified',
      action: preview.action,
      origin_sections: preview.origin_outcome_sections.map((section) => section.origin_kind),
      volatile_task_state: preview.volatile_runtime_state.task_runner,
      system_radius_identity: preview.queue_identity.system_radius,
      first_system_radius_scope: preview.system_radius_scope.watches[0],
      durable_result_artifacts: preview.no_durable_result_artifacts,
      mutation_check: {
        before,
        after,
        unchanged: JSON.stringify(before) === JSON.stringify(after)
      }
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('Watch/task outcome map preview verified');
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'runtime.watch_task_outcome_map.preview');
  assert(command, 'Watch/task outcome map preview command should be registered');
  assert(command.classification === 'read-only', 'Watch/task outcome map preview should be read-only');
  assert(command.effects.includes('read-only'), 'Watch/task outcome map preview should declare read-only effect');
  assert(command.renderer_allowed === true, 'Watch/task outcome map preview should be renderer eligible as a readout');

  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'runtime.watch_task_outcome_map.preview');
  assert(row?.storage_action_class === 'local_db_inspection', 'Watch/task outcome map preview should be local DB inspection');
  assert(row?.runtime_context === 'watch_task_outcome_map_readout', 'Watch/task outcome map preview should have readout runtime context');
  assert(row?.external_io_dependency === 'none', 'Watch/task outcome map preview should not depend on External I/O');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'Watch/task outcome map preview should remain non-enforcing proof');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'runtime.watch_task_outcome_map.preview', 'preview action should be named');
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

function verifyOriginMap(preview) {
  const sections = new Map(preview.origin_outcome_sections.map((section) => [section.origin_kind, section]));
  for (const name of [
    'Manual Discovery',
    'Manual Expansion',
    'Watch authoring',
    'Watch schedule readout',
    'Watch executor dispatch',
    'Actor Watch collection',
    'System/radius Watch collection'
  ]) {
    assert(sections.has(name), `${name} section should be present`);
  }

  assert(sections.get('Manual Discovery').discovery_ref_counts_by_status.total >= 1, 'Manual Discovery should report local Discovery refs');
  assert(sections.get('Manual Discovery').evidence_eveidence_counts.activity_events === 0, 'Manual Discovery should not report Evidence output');
  assert(sections.get('Manual Expansion').evidence_eveidence_counts.activity_events >= 1, 'Manual Expansion should report durable Evidence/EVEidence output');
  assert(sections.get('Watch authoring').watch_rows.active_actor_watches >= 1, 'Watch authoring should report actor Watch rows');
  assert(sections.get('Watch authoring').watch_rows.active_system_radius_watches >= 1, 'Watch authoring should report system/radius Watch rows');
  assert(
    sections.get('Watch schedule readout').schedule_posture.due_count + sections.get('Watch schedule readout').schedule_posture.blocked_count >= 1,
    'Watch schedule readout should report local Watch posture without provider movement'
  );
  assert(sections.get('Watch executor dispatch').volatile_task_state.task_state_is_volatile === true, 'Watch executor dispatch should identify volatile task state');
  assert(sections.get('Actor Watch collection').latest_matching_fetch_run?.watch_type === 'actor', 'Actor Watch collection should report latest actor run');
  assert(sections.get('System/radius Watch collection').latest_matching_fetch_run?.watch_type === 'system_radius', 'System/radius Watch collection should report latest radius run');
  assert(sections.get('System/radius Watch collection').warning_error_deferral_basis.deferrals.length >= 1, 'System/radius Watch collection should expose provider deferral/wait basis');

  assert(preview.no_durable_result_artifacts.watch_result_exists === false, 'watch_result should be absent');
  assert(preview.no_durable_result_artifacts.watch_results_exists === false, 'watch_results should be absent');
  assert(preview.no_durable_result_artifacts.watch_result_items_exists === false, 'watch_result_items should be absent');
  assert(preview.no_durable_result_artifacts.relationship_tag_column_exists === false, 'relationship_tag column should be absent');
  assert(preview.boundary_model.discovery_refs_are_possible_leads_not_evidence === true, 'Discovery should remain possible leads');
  assert(preview.boundary_model.manual_expansion_outputs_evidence === true, 'Manual Expansion should remain explicit Evidence expansion');
}

function verifyWatchAndTaskState(preview) {
  assert(preview.volatile_runtime_state.task_state_is_volatile === true, 'task state should be marked volatile');
  assert(preview.volatile_runtime_state.executor_state_is_volatile === true, 'executor state should be marked volatile');
  assert(preview.volatile_runtime_state.task_runner.total_tasks === 2, 'fixture task runner should be observed only');
  assert(preview.volatile_runtime_state.task_runner.watch_task_count === 1, 'fixture Watch task should be observed only');
  assert(preview.volatile_runtime_state.task_runner.creates_tasks === false, 'task snapshot should not create tasks');
  assert(preview.volatile_runtime_state.watch_executor.read_method === 'direct_property_snapshot_no_status_call', 'executor should be read without status mutation');
  assert(preview.volatile_runtime_state.watch_executor.mutates_executor_state === false, 'executor snapshot should not mutate executor');
  assert(preview.watch_schedule_posture.due_count + preview.watch_schedule_posture.blocked_count >= 1, 'schedule posture should include local Watch posture');
  assert(preview.watch_schedule_posture.blocked_count >= 1, 'schedule posture should include blocked Watches');
}

function verifySystemRadiusSignals(preview) {
  assert(preview.system_radius_scope.watch_execution_scope_authority === 'stored_watch_scope', 'Watch execution should disclose stored Watch scope authority');
  assert(preview.system_radius_scope.direct_manual_scope_authority === 'center_radius_planner', 'direct/manual system.radius.watch should remain center/radius planner behavior');
  assert(preview.system_radius_scope.discovery_ref_identity_level === 'center_only', 'system/radius Discovery ref identity should remain center-only');
  assert(preview.system_radius_scope.result_semantics_ready === false, 'durable result semantics should remain parked');
  assert(preview.system_radius_scope.executor_dispatch_payload_uses_stored_included_system_ids === true, 'executor should disclose stored included IDs are dispatch authority');
  assert(preview.system_radius_scope.executor_dispatch_payload_uses_stored_excluded_system_ids === false, 'executor should disclose stored excluded IDs are not a separate execution payload');
  assert(preview.system_radius_scope.watch_execution_recomputes_topology_from_center_radius === false, 'Watch execution should not be described as recomputing topology authority');
  assert(preview.system_radius_scope.direct_manual_collection_recomputes_topology_from_center_radius === true, 'direct/manual collection should preserve center/radius planner behavior');
  assert(preview.system_radius_scope.invalid_stored_scope_blocks_before_provider === true, 'invalid stored scope should block before provider work');
  assert(preview.system_radius_scope.watches.length >= 3, 'fixture should include valid, missing, and malformed system radius Watches');
  const first = preview.system_radius_scope.watches.find((watch) => watch.watch_id === 1);
  const missing = preview.system_radius_scope.watches.find((watch) => watch.watch_id === 2);
  const malformed = preview.system_radius_scope.watches.find((watch) => watch.watch_id === 3);
  assert(first.authored_scope.included_scope_status === 'valid', 'valid included scope should be distinguished');
  assert(first.authored_scope.excluded_scope_status === 'valid', 'valid excluded scope should be distinguished');
  assert(first.authored_scope.accepted_authority === true, 'valid stored included scope should be accepted Watch authority');
  assert(first.watch_execution_scope_authority.uses_stored_included_system_ids === true, 'valid Watch execution should use stored included IDs');
  assert(first.watch_execution_scope_authority.accepted_system_ids.includes(30000103), 'stored execution authority should include accepted non-recomputed system');
  assert(first.watch_execution_scope_authority.recomputes_from_center_radius === false, 'Watch execution should not recompute from center/radius');
  assert(first.watch_execution_scope_authority.invalid_scope_blocks_before_provider === false, 'valid stored scope should not block before provider work');
  assert(first.diagnostic_recomputed_scope.status === 'computed', 'diagnostic scope should be computable from topology');
  assert(first.diagnostic_recomputed_scope.diagnostic_only_under_accepted_model === true, 'recomputed topology should be diagnostic only after acceptance');
  assert(first.diagnostic_recomputed_scope.excluded_systems_applied_from_watch_row === false, 'preview should disclose excluded systems are not applied by diagnostic recompute');
  assert(first.direct_manual_planner_scope.authority_for_direct_manual_system_radius_watch === true, 'direct/manual path should keep planner authority');
  assert(first.direct_manual_planner_scope.authority_for_accepted_watch_execution === false, 'direct/manual planner scope should not be accepted Watch execution authority');
  assert(first.scope_match === false, 'fixture should prove stored Watch scope can differ from diagnostic recompute');
  assert(first.queue_identity.identity_level === 'center_only', 'system/radius identity should be center-only today');
  assert(first.queue_identity.includes_radius === false, 'system/radius identity should not include radius today');
  assert(first.queue_identity.includes_watch_id === false, 'system/radius identity should not include watch id today');
  assert(first.queue_identity.separate_from_watch_scope_authority === true, 'Discovery ref identity should be separate from Watch scope authority');
  assert(first.result_semantics_ready === false, 'Watch result semantics should stay parked');
  assert(missing.authored_scope.included_scope_status === 'not_stored', 'missing stored scope should be distinguished');
  assert(missing.watch_execution_scope_authority.invalid_scope_blocks_before_provider === true, 'missing stored scope should block before provider work');
  assert(malformed.authored_scope.included_scope_status === 'malformed', 'malformed stored scope should be distinguished');
  assert(malformed.watch_execution_scope_authority.invalid_scope_blocks_before_provider === true, 'malformed stored scope should block before provider work');
  assert(preview.queue_identity.system_radius.current_identity_level === 'center_only', 'top-level queue identity should disclose center-only scope');
  assert(preview.queue_identity.system_radius.watch_execution_scope_authority === 'stored_watch_scope', 'top-level queue identity should disclose stored Watch execution authority');
  assert(preview.queue_identity.system_radius.separate_from_watch_scope_authority === true, 'top-level queue identity should separate identity from execution authority');
  assert(preview.queue_identity.system_radius.radius_or_watch_id_in_discovery_ref_identity === false, 'top-level queue identity should disclose missing radius/watch id identity');
}

function seedFixture(db) {
  seedTopology(db);
  seedWatchRows(db);
  seedRuns(db);
  seedDiscoveryRefs(db);
  seedEvidence(db);
  seedProviderDeferral(db);
}

function seedTopology(db) {
  for (const row of [
    [30000101, 'ATLAS-A'],
    [30000102, 'ATLAS-B'],
    [30000103, 'ATLAS-C']
  ]) {
    db.prepare(`
      INSERT INTO solar_systems (
        solar_system_id, solar_system_name, constellation_id, constellation_name,
        region_id, region_name, security_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(row[0], row[1], 20000001, 'Atlas Fixture Constellation', 10000001, 'Atlas Fixture Region', 0.4);
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

function seedWatchRows(db) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run, is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 'character', 90000001, 'Atlas Watch Pilot', 30, 10, 1, 60, '2026-06-05T08:00:00.000Z', '2026-06-05T09:00:00.000Z', null, null, null, 'HS292 fixture');
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run, is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(2, 'character', 90000002, 'Blocked Watch Pilot', 30, 10, 1, 60, null, null, null, null, null, 'HS292 fixture');
  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 30000101, 'ATLAS-A', 1, '[30000101,30000103]', '[30000102]', 24, 10, 10, 1, 60, '2026-06-05T08:00:00.000Z', '2026-06-05T09:00:00.000Z', null, null, null, 'HS300 fixture');
  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(2, 30000102, 'ATLAS-B', 1, '[]', '[]', 24, 10, 10, 1, 60, null, null, null, null, null, 'HS300 fixture');
  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(3, 30000103, 'ATLAS-C', 1, 'not-json', '[]', 24, 10, 10, 1, 60, null, null, null, null, null, 'HS300 fixture');
}

function seedRuns(db) {
  seedFetchRun({
    runId: 'run_manual_discovery',
    trigger: 'manual',
    watchType: 'manual_discovery',
    watchId: 'character:90000001',
    startedAt: '2026-06-05T08:10:00.000Z',
    finishedAt: '2026-06-05T08:10:05.000Z',
    status: 'success',
    discoveredRefs: 1
  });
  seedFetchRun({
    runId: 'run_manual_expand',
    trigger: 'manual',
    watchType: 'manual_expand',
    watchId: 'selection:fixture',
    startedAt: '2026-06-05T08:20:00.000Z',
    finishedAt: '2026-06-05T08:20:05.000Z',
    status: 'success',
    discoveredRefs: 0,
    expandedNew: 1,
    activityEventsWritten: 1,
    apiCallsEsi: 1
  });
  seedFetchRun({
    runId: 'run_actor_watch',
    trigger: 'watch',
    watchType: 'actor',
    watchId: 'character:90000001',
    startedAt: '2026-06-05T08:30:00.000Z',
    finishedAt: '2026-06-05T08:30:05.000Z',
    status: 'success',
    discoveredRefs: 1,
    expandedNew: 1,
    activityEventsWritten: 1,
    apiCallsZkill: 1,
    apiCallsEsi: 1
  });
  seedFetchRun({
    runId: 'run_system_radius',
    trigger: 'watch',
    watchType: 'system_radius',
    watchId: '30000101',
    startedAt: '2026-06-05T08:40:00.000Z',
    finishedAt: '2026-06-05T08:40:05.000Z',
    status: 'partial',
    discoveredRefs: 1,
    expandedNew: 1,
    activityEventsWritten: 1,
    apiCallsZkill: 1,
    apiCallsEsi: 1,
    errorSummary: 'fixture provider wait'
  });

  function seedFetchRun(input) {
    db.prepare(`
      INSERT INTO fetch_runs (
        run_id, trigger, watch_type, watch_id, started_at, finished_at, status,
        discovered_refs, already_cached, expanded_new, failed_expansions,
        activity_events_written, api_calls_zkill, api_calls_esi, duration_ms,
        error_summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.runId,
      input.trigger,
      input.watchType,
      input.watchId,
      input.startedAt,
      input.finishedAt,
      input.status,
      input.discoveredRefs || 0,
      0,
      input.expandedNew || 0,
      0,
      input.activityEventsWritten || 0,
      input.apiCallsZkill || 0,
      input.apiCallsEsi || 0,
      5,
      input.errorSummary || null
    );
  }
}

function seedDiscoveryRefs(db) {
  for (const input of [
    ['910001', 'hash_manual_pending', 'manual_actor', 'character:90000001', null, 'character', 90000001, 'run_manual_discovery', 'pending'],
    ['910002', 'hash_actor_expanded', 'actor', '90000001', null, 'character', 90000001, 'run_actor_watch', 'expanded'],
    ['910003', 'hash_system_expanded', 'system_radius', '30000101', 30000101, null, null, 'run_system_radius', 'expanded']
  ]) {
    db.prepare(`
      INSERT INTO discovered_killmail_refs (
        killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
        source_scope, source_system_id, source_actor_type, source_actor_id,
        discovered_at, first_seen_run_id, last_seen_run_id, last_seen_at,
        status, priority, preview_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(input[0]),
      input[1],
      input[2],
      input[3],
      input[3],
      input[4],
      input[5],
      input[6],
      '2026-06-05T08:00:00.000Z',
      input[7],
      input[7],
      '2026-06-05T08:00:00.000Z',
      input[8],
      1,
      '{}'
    );
  }
}

function seedEvidence(db) {
  for (const [killmailId, runId, systemId, discoveredByType, discoveredById] of [
    [910010, 'run_manual_expand', 30000101, 'manual_expand', 'selection:fixture'],
    [910011, 'run_actor_watch', 30000101, 'actor', '90000001'],
    [910012, 'run_system_radius', 30000102, 'system_radius', '30000101']
  ]) {
    db.prepare(`
      INSERT INTO killmails (
        killmail_id, killmail_hash, killmail_time, solar_system_id,
        raw_esi_payload, raw_payload_checksum, source,
        first_seen_at, last_seen_at, ingested_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      killmailId,
      `hash_${killmailId}`,
      '2026-06-05T08:50:00.000Z',
      systemId,
      '{}',
      `checksum_${killmailId}`,
      'fixture',
      '2026-06-05T08:51:00.000Z',
      '2026-06-05T08:51:00.000Z',
      '2026-06-05T08:51:00.000Z'
    );
    db.prepare(`
      INSERT INTO ingestion_audits (
        run_id, killmail_id, raw_payload_checksum, normalized_event_count,
        attacker_count, victim_present, warnings, normalizer_version, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(runId, killmailId, `checksum_${killmailId}`, 1, 1, 1, '[]', 'fixture', '2026-06-05T08:51:00.000Z');
    db.prepare(`
      INSERT INTO activity_events (
        event_key, killmail_id, role, entity_type, entity_id, entity_name,
        character_id, character_name, corporation_id, corporation_name,
        alliance_id, alliance_name, ship_type_id, ship_type_name,
        weapon_type_id, final_blow, damage_done,
        solar_system_id, solar_system_name, region_id, region_name,
        killmail_time, ingested_at, discovered_by_type, discovered_by_id,
        normalizer_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `${killmailId}:attacker:90000001`,
      killmailId,
      'attacker',
      'character',
      90000001,
      'Atlas Fixture Pilot',
      90000001,
      'Atlas Fixture Pilot',
      98000001,
      'Atlas Fixture Corp',
      null,
      null,
      603,
      'Merlin',
      null,
      1,
      500,
      systemId,
      systemId === 30000101 ? 'ATLAS-A' : 'ATLAS-B',
      10000001,
      'Atlas Fixture Region',
      '2026-06-05T08:50:00.000Z',
      '2026-06-05T08:51:00.000Z',
      discoveredByType,
      discoveredById,
      'fixture'
    );
  }
}

function seedProviderDeferral(db) {
  db.prepare(`
    INSERT INTO api_request_logs (
      request_id, run_id, run_type, provider, endpoint, method, status_code,
      duration_ms, cache_status, retry_count, rate_limited, error_message,
      requested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('request_system_deferred', 'run_system_radius', 'collection', 'esi', 'fixture://esi/deferred', 'GET', 429, 1, 'miss', 0, 1, 'fixture provider wait', '2026-06-05T08:40:02.000Z');
  db.prepare(`
    INSERT INTO data_quality_warnings (
      warning_id, run_id, killmail_id, warning_type, message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('warning_system_deferred', 'run_system_radius', null, 'provider_capacity_deferred', 'fixture provider wait', '2026-06-05T08:40:03.000Z');
}

function fixtureWatchExecutor() {
  return {
    sessionArmed: true,
    activeTaskId: 'task_watch_actor_1',
    interval: null,
    pollIntervalMs: 60000,
    lastTick: '2026-06-05T09:59:00.000Z',
    lastDispatch: {
      watch_type: 'actor',
      watch_id: 1,
      task_id: 'task_watch_actor_1'
    },
    lastBlockedReason: null
  };
}

function fixtureTaskRunner() {
  return {
    listTasks: () => [
      {
        task_id: 'task_watch_actor_1',
        type: 'watch.executor.actor.watch',
        classification: 'evidence-creating',
        scope_key: 'actor:character:90000001',
        status: 'running',
        queued_at: '2026-06-05T09:59:00.000Z',
        started_at: '2026-06-05T09:59:01.000Z',
        finished_at: null,
        result: null,
        error: null
      },
      {
        task_id: 'task_report_1',
        type: 'report.actor',
        classification: 'read-only',
        scope_key: 'actor:character:90000001',
        status: 'completed',
        queued_at: '2026-06-05T09:58:00.000Z',
        started_at: '2026-06-05T09:58:01.000Z',
        finished_at: '2026-06-05T09:58:02.000Z',
        result: { ok: true },
        error: null
      }
    ]
  };
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
