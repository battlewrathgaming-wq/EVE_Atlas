const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');

async function main() {
  const command = listServiceCommands().find((entry) => entry.command === 'watch.actor_controlled_adapter_disabled.preview');
  assert(command, 'disabled adapter seam command should be registered');
  assert(command.classification === 'metadata-only', 'disabled adapter seam command should be metadata-only');
  assert(command.effects.includes('local-data-mutation'), 'disabled adapter seam command should declare fixture local mutation');
  assert(!command.effects.includes('external-live-api'), 'disabled adapter seam command should not declare external live API effect');
  assert(!command.effects.includes('evidence-creation'), 'disabled adapter seam command should not declare Evidence/EVEidence creation effect');
  assert(command.renderer_allowed === false, 'disabled adapter seam command should not be renderer eligible');

  const actorWatchCommand = listServiceCommands().find((entry) => entry.command === 'actor.watch');
  assert(actorWatchCommand, 'production actor.watch command should remain registered');
  assert(actorWatchCommand.classification === 'evidence-creating', 'production actor.watch should remain evidence-creating');
  assert(actorWatchCommand.effects.includes('external-live-api'), 'production actor.watch should retain external live API effect');
  assert(actorWatchCommand.effects.includes('evidence-creation'), 'production actor.watch should retain Evidence/EVEidence creation effect');

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    seedOperatorWatch(db);
    const before = operatorCounts(db);
    const preview = await invokeServiceCommand('watch.actor_controlled_adapter_disabled.preview', {}, { db });
    const after = operatorCounts(db);

    assertSame(after, before, 'disabled adapter seam should not mutate caller/operator DB');
    verifyPreview(preview);

    console.log(JSON.stringify({
      status: 'Actor Watch controlled adapter disabled seam validated',
      command: 'watch.actor_controlled_adapter_disabled.preview',
      classification: command.classification,
      effects: command.effects,
      renderer_allowed: command.renderer_allowed,
      direct_summary_field_count: preview.direct_compatibility_summary_proof.field_parity.actual.length,
      scheduled_wrapper_status: preview.scheduled_style_wrapper_proof.status,
      operator_corpus_non_mutation: preview.operator_corpus_non_mutation_proof.unchanged,
      production_actor_watch_redirected: preview.production_actor_watch_redirected,
      collect_actor_watch_invoked: preview.collect_actor_watch_invoked,
      provider_calls: preview.provider_calls,
      live_api_calls: preview.live_api_calls
    }, null, 2));
    console.log('Actor Watch controlled adapter disabled seam validated');
  } finally {
    closeDatabase(db);
  }
}

function verifyPreview(preview) {
  assert(preview.action === 'watch.actor_controlled_adapter_disabled.preview', 'preview action should match');
  assert(preview.disabled === true, 'preview should be disabled');
  assert(preview.disabled_reason === 'proof_only_not_runtime_redirect', 'preview should disclose disabled reason');
  assert(preview.fixture_only === true, 'preview should be fixture-only');
  assert(preview.service_preview === true, 'preview should be service preview');
  assert(preview.renderer_eligible === false, 'preview should not be renderer eligible');
  assert(preview.fake_clients_only === true, 'preview should use fake clients only');
  assert(preview.disposable_db_only === true, 'preview should use disposable DBs only');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.live_api_calls === 0, 'preview should not make live/API calls');
  assert(preview.operator_corpus_mutated === false, 'preview should not mutate operator corpus');
  assert(preview.production_actor_watch_redirected === false, 'preview should not redirect production actor.watch');
  assert(preview.runActorWatchService_changed === false, 'preview should not change runActorWatchService');
  assert(preview.watchExecutor_dispatchFor_changed === false, 'preview should not change watchExecutor.dispatchFor');
  assert(preview.watchSessionExecutor_tick_invoked === false, 'preview should not invoke WatchSessionExecutor.tick');
  assert(preview.collect_actor_watch_imported === false, 'preview should not import collectActorWatch');
  assert(preview.collect_actor_watch_invoked === false, 'preview should not invoke collectActorWatch');
  assert(preview.collect_actor_watch_retired === false, 'preview should not retire collectActorWatch');
  assert(preview.direct_compatibility_summary_proof.top_level_is_summary_object === true, 'direct return should be summary object');
  assert(preview.direct_compatibility_summary_proof.field_parity.matches === true, 'direct summary field parity should match production summary fields');
  assert(preview.direct_compatibility_summary_proof.field_parity.actual.length === 22, 'direct summary should expose 22 compatibility fields');
  assert(preview.scheduled_style_wrapper.status === 'succeeded', 'scheduled-style wrapper should use succeeded status');
  assert(preview.scheduled_style_wrapper.data.collection === preview.direct_compatibility_summary, 'scheduled-style wrapper should put summary under data.collection');
  assert(preview.scheduled_style_wrapper_proof.collection_under_data === true, 'scheduled-style proof should confirm collection under data');
  assert(preview.scheduled_style_wrapper_proof.tick_invoked === false, 'scheduled-style proof should not invoke tick');
  assert(preview.scheduled_style_wrapper_proof.task_created === false, 'scheduled-style proof should not create tasks');
  assert(preview.operator_corpus_non_mutation_proof.unchanged === true, 'operator DB should be unchanged');
  assert(preview.operator_corpus_non_mutation_proof.operator_db_written === false, 'operator DB should not be written');
  assert(preview.controlled_runtime_adapter_fixture.action === 'watch.actor_controlled_runtime_adapter_fixture.preview', 'disabled seam should call controlled fixture path');
  assert(preview.controlled_runtime_adapter_fixture.collect_actor_watch_invoked === false, 'controlled fixture should not invoke collectActorWatch');
}

function seedOperatorWatch(db) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, 'character', 90000001, 'HS428 Operator Sentinel', 14, 5, 1, 60, null, null, null, null, null, 'operator non-mutation sentinel');
}

function operatorCounts(db) {
  return {
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    watchlist_entities: count(db, 'watchlist_entities')
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
