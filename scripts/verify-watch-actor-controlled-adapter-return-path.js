const fs = require('fs');
const path = require('path');
const { buildActorWatchControlledRuntimeAdapterFixtureProof } = require('../src/main/discovery/actorWatchControlledRuntimeAdapterFixture');
const {
  actorWatchCompatibilitySummaryFields,
  actorWatchCompatibilitySummaryFieldParity,
  buildDirectActorWatchCompatibilityReturn,
  buildScheduledActorWatchCompatibilityResult
} = require('../src/main/discovery/actorWatchCompatibilitySummary');

async function main() {
  const proof = await buildActorWatchControlledRuntimeAdapterFixtureProof({
    now: '2026-06-11T00:00:00.000Z'
  });
  verifyProofBoundary(proof);

  const summary = proof.cases.fresh_actor_candidate_acquisition.compatibility_summary;
  const fieldParity = actorWatchCompatibilitySummaryFieldParity(summary);
  assert(fieldParity.matches, `compatibility field parity failed: ${JSON.stringify(fieldParity)}`);
  verifyLegacyCollectorCompatibilityFieldSet(fieldParity.expected);

  const directReturn = buildDirectActorWatchCompatibilityReturn(summary);
  assert(directReturn === summary, 'direct caller return should be the summary object');
  assertSame(Object.keys(directReturn), fieldParity.expected, 'direct caller field order should match compatibility field set');

  const scheduledWatch = {
    watch_type: 'actor',
    watch_id: 423,
    scope_key: 'actor:character:90000001'
  };
  const scheduledResult = buildScheduledActorWatchCompatibilityResult({
    watch: scheduledWatch,
    collection: directReturn
  });
  assert(scheduledResult.status === 'succeeded', 'scheduled-style wrapper should preserve success status');
  assert(scheduledResult.data.watch === scheduledWatch, 'scheduled-style wrapper should preserve watch object');
  assert(scheduledResult.data.collection === directReturn, 'scheduled-style wrapper should preserve summary under data.collection');
  assertSame(Object.keys(scheduledResult.data.collection), fieldParity.expected, 'scheduled collection field set should match compatibility field set');
  const runtimeStatus = inspectPostHs446RuntimeStatus();

  const output = {
    status: 'Actor Watch controlled adapter return-path proof validated',
    direct_caller_return_shape: {
      top_level_is_summary_object: directReturn === summary,
      field_count: Object.keys(directReturn).length,
      fields: Object.keys(directReturn)
    },
    scheduled_style_return_shape: {
      wrapper_status: scheduledResult.status,
      collection_under_data: scheduledResult.data.collection === directReturn,
      watch_preserved: scheduledResult.data.watch === scheduledWatch,
      collection_field_count: Object.keys(scheduledResult.data.collection).length
    },
    compatibility_field_set_parity: fieldParity,
    production_direct_redirect_status: {
      actor_watch_redirected_after_hs440: true,
      runtime_entry_point: 'runActorWatchService',
      runActorWatchService_call_target: 'runActorWatchDirectBody',
      direct_body_imports_collectActorWatch: runtimeStatus.directBodyImportsCollectActorWatch,
      direct_body_invokes_collectActorWatch: runtimeStatus.directBodyInvokesCollectActorWatch
    },
    scheduled_runtime_status: {
      scheduled_actor_watch_redirected_after_hs446: true,
      watchExecutor_dispatchFor_uses_runScheduledActorWatch: runtimeStatus.watchExecutorUsesScheduledRunner,
      watchExecutor_dispatchFor_uses_collectActorWatch: runtimeStatus.watchExecutorUsesCollectActorWatch,
      current_runner: 'runScheduledActorWatch',
      legacy_collectActorWatch_still_available: runtimeStatus.collectActorWatchAvailable
    },
    controlled_adapter_preview_status: {
      fixture_only: proof.fixture_only,
      non_production: true,
      preview_performed_redirect: proof.production_actor_watch_redirected,
      preview_changed_runActorWatchService: proof.runActorWatchService_changed,
      preview_changed_watchExecutor_dispatchFor: proof.watchExecutor_dispatchFor_changed,
      collectActorWatch_imported_by_preview: proof.collect_actor_watch_imported,
      collectActorWatch_invoked_by_preview: proof.collect_actor_watch_invoked
    },
    compatibility_language_posture: {
      collection: 'scheduled-wrapper compatibility only',
      collection_plan: 'compatibility/debug only',
      expansion_queue: 'compatibility/debug only',
      expansion_queue_summary: 'compatibility/debug only',
      zkill_refs_discovered: 'compatibility/debug only',
      zkill_discovery_skipped: 'compatibility/debug only'
    },
    provider_calls: 0,
    live_api_calls: 0,
    operator_db_writes: 0
  };
  console.log(JSON.stringify(output, null, 2));
  console.log('Actor Watch controlled adapter return-path proof validated');
}

function verifyProofBoundary(proof) {
  assert(proof.fixture_only === true, 'proof should remain fixture-only');
  assert(proof.disposable_db_only === true, 'proof should use disposable DBs');
  assert(proof.uses_injected_fake_clients_only === true, 'proof should use fake clients only');
  assert(proof.provider_calls === 0, 'proof should not call providers');
  assert(proof.live_api_calls === 0, 'proof should not make live/API calls');
  assert(proof.operator_corpus_mutated === false, 'proof should not mutate operator corpus');
  assert(proof.production_actor_watch_redirected === false, 'controlled adapter proof should not perform the HS440 actor.watch redirect');
  assert(proof.runActorWatchService_changed === false, 'controlled adapter proof should not change runActorWatchService');
  assert(proof.watchExecutor_dispatchFor_changed === false, 'controlled adapter proof should not change watchExecutor.dispatchFor');
  assert(proof.collect_actor_watch_imported === false, 'controlled adapter proof should not import collectActorWatch');
  assert(proof.collect_actor_watch_invoked === false, 'controlled adapter proof should not invoke collectActorWatch');
}

function verifyLegacyCollectorCompatibilityFieldSet(expected) {
  const sourcePath = path.join(__dirname, '..', 'src', 'main', 'workers', 'actorWatchCollector.js');
  const source = fs.readFileSync(sourcePath, 'utf8');
  for (const field of expected) {
    assert(source.includes(`${field}:`), `legacy actor collector compatibility summary should include ${field}`);
  }
  assert(source.includes('const summary = {'), 'legacy actor collector summary object should remain visible');
  assert(source.includes('return summary;'), 'legacy actor collector should return summary directly');
}

function inspectPostHs446RuntimeStatus() {
  const mutatingActionService = readSource('src/main/services/mutatingActionService.js');
  const directBody = readSource('src/main/discovery/actorWatchDirectBody.js');
  const watchExecutor = readSource('src/main/watchlist/watchExecutor.js');
  const actorCollector = readSource('src/main/workers/actorWatchCollector.js');

  assert(
    /runActorWatchDirectBody\(input, \{ \.\.\.dependencies, db \}\)/.test(mutatingActionService),
    'post-HS440 direct actor.watch should call runActorWatchDirectBody'
  );
  assert(
    !/collectActorWatch\(input, \{ \.\.\.dependencies, db \}\)/.test(mutatingActionService),
    'post-HS440 direct actor.watch should not call collectActorWatch'
  );
  assert(!/require\(.*actorWatchCollector/.test(directBody), 'direct body should not import actorWatchCollector');
  assert(!/collectActorWatch\(/.test(directBody), 'direct body should not invoke collectActorWatch');
  assert(!/require\(.*actorWatchCollector/.test(watchExecutor), 'post-HS446 scheduled actor Watch should not import actorWatchCollector');
  assert(!/runner: collectActorWatch/.test(watchExecutor), 'post-HS446 scheduled actor Watch should not use collectActorWatch runner');
  assert(/runner: runScheduledActorWatch/.test(watchExecutor), 'post-HS446 scheduled actor Watch should use runScheduledActorWatch runner');
  assert(/function collectActorWatch/.test(actorCollector), 'collectActorWatch should remain available for now');

  return {
    directBodyImportsCollectActorWatch: /require\(.*actorWatchCollector/.test(directBody),
    directBodyInvokesCollectActorWatch: /collectActorWatch\(/.test(directBody),
    watchExecutorUsesCollectActorWatch: /runner: collectActorWatch/.test(watchExecutor),
    watchExecutorUsesScheduledRunner: /runner: runScheduledActorWatch/.test(watchExecutor),
    collectActorWatchAvailable: /function collectActorWatch/.test(actorCollector)
  };
}

function readSource(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
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
