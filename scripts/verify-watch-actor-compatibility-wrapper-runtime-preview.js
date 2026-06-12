const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildWatchActorCompatibilityWrapperPreview } = require('../src/main/services/watchActorCompatibilityWrapperRuntimePreviewService');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { auraTempRoot } = require('../src/main/util/tempPaths');

const NOW = '2026-06-07T23:00:00.000Z';
const ROOT = path.resolve(__dirname, '..');

async function main() {
  verifyStaticRuntimePreserved();
  await verifyDirectPreview();
  await verifyServiceCommand();

  console.log(JSON.stringify({
    status: 'Actor Watch compatibility wrapper runtime preview validated',
    command: 'watch.actor_compatibility_wrapper.preview',
    sample: await sample()
  }, null, 2));
  console.log('Actor Watch compatibility wrapper runtime preview validated');
}

async function verifyDirectPreview() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorWatch(db);
    const before = sideEffectCounts(db);
    const proof = buildWatchActorCompatibilityWrapperPreview(db, {
      now: NOW,
      entity_type: 'character',
      entity_id: 90000001,
      entity_name: 'Wrapper Preview Pilot',
      lookback_seconds: 1209600,
      max_refs: 5,
      max_expansions: 5,
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    });
    const after = sideEffectCounts(db);
    verifyBoundary(proof, 'direct preview');
    verifyCompatibilityShape(proof);
    assertSame(after, before, 'direct preview should not mutate local rows');
    assert(proof.table_mutation_proof.unchanged === true, 'direct preview should include unchanged table proof');
  } finally {
    closeDatabase(db);
  }
}

async function verifyServiceCommand() {
  const dbPath = path.join(auraTempRoot(), 'watch-actor-wrapper-runtime-preview.sqlite');
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorWatch(db);
    const commands = listServiceCommands();
    const command = commands.find((entry) => entry.command === 'watch.actor_compatibility_wrapper.preview');
    assert(command, 'runtime preview command should be listed');
    assert(command.classification === 'read-only', 'runtime preview command should be read-only');
    assert(command.effects.includes('read-only'), 'runtime preview command should declare read-only effect');
    assert(command.renderer_allowed === true, 'runtime preview command should be renderer eligible');

    const before = sideEffectCounts(db);
    const proof = await invokeServiceCommand('watch.actor_compatibility_wrapper.preview', {
      now: NOW,
      entityType: 'character',
      entityId: 90000001,
      entityName: 'Wrapper Preview Pilot',
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, { db, databasePath: dbPath });
    const after = sideEffectCounts(db);
    verifyBoundary(proof, 'service command');
    verifyCompatibilityShape(proof);
    assertSame(after, before, 'service command should not mutate local rows');
  } finally {
    closeDatabase(db);
  }
}

async function sample() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorWatch(db);
    const proof = buildWatchActorCompatibilityWrapperPreview(db, {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    });
    return {
      wrapper_status: proof.wrapper_status,
      legacy_payload_shape_accepted: proof.legacy_payload_shape_accepted,
      old_caller_facing_fields: Object.keys(proof.old_caller_facing_compatibility_result),
      represented_old_result_fields: proof.represented_old_result_fields,
      approximate_old_result_fields: proof.approximate_old_result_fields,
      not_represented_old_result_fields: proof.not_represented_old_result_fields,
      parked_old_result_fields: proof.parked_old_result_fields,
      existing_runtime_preserved: proof.existing_runtime_preserved,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyCompatibilityShape(proof) {
  const result = proof.old_caller_facing_compatibility_result;
  assert(proof.action === 'watch.actor_compatibility_wrapper.preview', 'action should match runtime preview command');
  assert(proof.wrapper_status === 'explicit_preview_no_provider_no_write_not_active', 'runtime wrapper preview should be inactive');
  assert(proof.adapter_basis_action === 'watch.actor_compatibility_wrapper_adapter_fixture.preview', 'runtime preview should use HS383 adapter fixture basis');
  assert(proof.contract_basis_action === 'watch.actor_compatibility_wrapper_contract.preview', 'runtime preview should retain contract basis');
  assert(proof.old_entry_point === 'actor.watch', 'old entry point should be actor.watch');
  assert(proof.current_retire_candidate === 'collectActorWatch', 'retire candidate should be collectActorWatch only');
  assert(proof.legacy_payload_shape_accepted.entityType === 'character', 'legacy payload should accept entityType');
  assert(proof.legacy_payload_shape_accepted.entityId === 90000001, 'legacy payload should accept entityId');
  assert(result.actor.entity_id === 90000001, 'old caller-facing result should include actor identity');
  assert(result.collection_plan.requested_window.lookback_seconds === 1209600, 'old caller-facing result should include lookback window');
  assert(result.collection_plan.caps.max_refs === 5, 'old caller-facing result should include max refs');
  assert(result.collection_plan.caps.max_expansions === 5, 'old caller-facing result should include max expansions');
  assert(result.api_calls_zkill === 0, 'old caller-facing result should report zero zKill API calls');
  assert(result.api_calls_esi === 0, 'old caller-facing result should report zero ESI API calls');
  assert(result.persisted_killmails === 0, 'old caller-facing result should not persist killmails');
  assert(result.activity_events_written === 0, 'old caller-facing result should not write activity events');
  assert(proof.represented_old_result_fields.includes('actor'), 'represented fields should include actor');
  assert(proof.represented_old_result_fields.includes('collection_plan'), 'represented fields should include collection_plan');
  assert(proof.approximate_old_result_fields.includes('warnings'), 'approximate fields should include warnings');
  assert(proof.not_represented_old_result_fields.includes('real fetch_runs run_id and lifecycle'), 'not represented fields should include fetch_runs lifecycle');
  assert(proof.parked_old_result_fields.includes('actor.watch redirect'), 'parked fields should include actor.watch redirect');
  assert(proof.parked_old_result_fields.includes('collectActorWatch retirement'), 'parked fields should include collector retirement');
  assert(proof.legacy_term_posture.legacy_mixed_collector_language_is_compatibility_only === true, 'legacy mixed terminology should be compatibility-only');
  assert(proof.legacy_term_posture.future_doctrine_claimed === false, 'preview should not claim future doctrine');
  assert(proof.existing_runtime_preserved.actor_watch_handler_changed === false, 'actor.watch handler should be preserved');
  assert(proof.existing_runtime_preserved.actor_watch_runtime_entry_point === 'runActorWatchService', 'actor.watch should still name runActorWatchService');
  assert(proof.existing_runtime_preserved.runActorWatchService_current_call_target === 'runActorWatchDirectBody', 'runActorWatchService should disclose current direct body call target');
  assert(proof.existing_runtime_preserved.scheduled_actor_watch_dispatch_command === 'actor.watch', 'scheduled actor Watch should still dispatch actor.watch');
  assert(proof.existing_runtime_preserved.scheduled_actor_watch_current_runner === 'runScheduledActorWatch', 'scheduled actor Watch should disclose current scheduled runner');
  assert(proof.existing_runtime_preserved.scheduled_actor_watch_runner_call_target === 'runActorWatchDirectBody', 'scheduled actor Watch should disclose direct body runner call target');
  assert(proof.existing_runtime_preserved.collectActorWatch_status === 'legacy_compatibility_available_retirement_candidate', 'collectActorWatch should be parked legacy compatibility code');
}

function verifyBoundary(proof, label) {
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.fixture_only === true, `${label} should be fixture-only`);
  assert(proof.compatibility_wrapper_preview === true, `${label} should be compatibility-wrapper preview`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not make live/API calls`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.watch_execution === false, `${label} should not execute Watch`);
  assert(proof.watch_dispatches === 0, `${label} should not dispatch Watch`);
  assert(proof.collect_actor_watch_invoked === false, `${label} should not invoke collectActorWatch`);
  assert(proof.mixed_collectors_invoked === false, `${label} should not invoke mixed collectors`);
  assert(proof.tasks_created === 0, `${label} should not create tasks`);
  assert(proof.queue_created === false, `${label} should not create queues`);
  assert(proof.dispatcher_created === false, `${label} should not create dispatchers`);
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.discovered_killmail_refs_written === 0, `${label} should not write discovered_killmail_refs`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence/EVEidence`);
  assert(proof.evidence_landing_performed === false, `${label} should not land Evidence/EVEidence`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration`);
  assert(proof.metadata_writes === 0, `${label} should not write metadata`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.data_quality_warning_writes === 0, `${label} should not write warnings`);
  assert(proof.fetch_run_writes === 0, `${label} should not write fetch_runs`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.support_artifacts_created === 0, `${label} should not create support artifacts`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.actor_watch_redirected === false, `${label} should not redirect actor.watch`);
  assert(proof.runActorWatchService_changed === false, `${label} should not change runActorWatchService`);
  assert(proof.watchExecutor_dispatchFor_changed === false, `${label} should not change watchExecutor.dispatchFor`);
  assert(proof.mixed_collector_retired === false, `${label} should not retire collectors`);
  assert(proof.boundary_flags.system_radius_behavior_changed === false, `${label} should not change system/radius behavior`);
  assert(proof.boundary_flags.protected_words_updated === false, `${label} should not update protected words`);
}

function verifyStaticRuntimePreserved() {
  const registry = read('src/main/services/serviceRegistry.js');
  const mutating = read('src/main/services/mutatingActionService.js');
  const executor = read('src/main/watchlist/watchExecutor.js');
  const runtimePreview = read('src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js');

  assert(registry.includes("'actor.watch':"), 'actor.watch should remain registered');
  assert(registry.includes('handler: ({ db, payload, ...context }) => runActorWatchService(db, payload, context)'), 'actor.watch should still call runActorWatchService');
  assert(mutating.includes('async function runActorWatchService'), 'runActorWatchService should remain defined');
  assert(mutating.includes('return runActorWatchDirectBody(input, { ...dependencies, db });'), 'runActorWatchService should call runActorWatchDirectBody');
  assert(executor.includes("command: 'actor.watch'"), 'watchExecutor.dispatchFor(actor) should still dispatch actor.watch');
  assert(executor.includes('runner: runScheduledActorWatch'), 'watchExecutor.dispatchFor(actor) should use runScheduledActorWatch runner');
  assert(executor.includes('return runActorWatchDirectBody(payload, dependencies);'), 'runScheduledActorWatch should delegate to runActorWatchDirectBody');
  assert(!runtimePreview.includes('actorWatchCollector'), 'new wrapper preview service should not import actorWatchCollector.js');
  assert(!runtimePreview.includes("require('../workers/actorWatchCollector')"), 'new wrapper preview service should not require the actor Watch collector');
  assert(!runtimePreview.includes('runActorWatchService('), 'new wrapper preview service should not invoke runActorWatchService');
}

function insertActorWatch(db) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 'character', 90000001, 'Wrapper Preview Pilot', 14, 5, 1, 60, null, null, null, null, null, 'HS395 runtime preview fixture');
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    entities: count(db, 'entities'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
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
  process.exit(1);
});
