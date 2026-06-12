const { buildWatchActorControlledRuntimeAdapterFixturePreview } = require('./watchActorControlledRuntimeAdapterFixtureService');
const {
  actorWatchCompatibilitySummaryFieldParity,
  buildDirectActorWatchCompatibilityReturn,
  buildScheduledActorWatchCompatibilityResult
} = require('../discovery/actorWatchCompatibilitySummary');

async function buildWatchActorControlledAdapterDisabledPreview(db, input = {}) {
  const fixtureProof = await buildWatchActorControlledRuntimeAdapterFixturePreview(db, input);
  const summary = fixtureProof.cases?.fresh_actor_candidate_acquisition?.compatibility_summary;
  const directCompatibilitySummary = buildDirectActorWatchCompatibilityReturn(summary);
  const directParity = actorWatchCompatibilitySummaryFieldParity(directCompatibilitySummary);
  const scheduledStyleWrapper = buildScheduledActorWatchCompatibilityResult({
    watch: buildFixtureWatch(input),
    collection: directCompatibilitySummary
  });

  return {
    action: 'watch.actor_controlled_adapter_disabled.preview',
    disabled: true,
    disabled_reason: 'proof_only_not_runtime_redirect',
    fixture_only: true,
    service_preview: true,
    renderer_eligible: false,
    fake_clients_only: fixtureProof.uses_injected_fake_clients_only === true,
    disposable_db_only: fixtureProof.disposable_db_only === true,
    provider_calls: 0,
    live_api_calls: 0,
    operator_corpus_mutated: false,
    production_actor_watch_redirected: false,
    runActorWatchService_changed: false,
    watchExecutor_dispatchFor_changed: false,
    watchSessionExecutor_tick_invoked: false,
    collect_actor_watch_imported: false,
    collect_actor_watch_invoked: false,
    collect_actor_watch_retired: false,
    direct_compatibility_summary: directCompatibilitySummary,
    direct_compatibility_summary_proof: {
      top_level_is_summary_object: directCompatibilitySummary === summary,
      field_parity: directParity
    },
    scheduled_style_wrapper: scheduledStyleWrapper,
    scheduled_style_wrapper_proof: {
      status: scheduledStyleWrapper.status,
      collection_under_data: scheduledStyleWrapper.data.collection === directCompatibilitySummary,
      tick_invoked: false,
      task_created: false
    },
    operator_corpus_non_mutation_proof: fixtureProof.operator_corpus_non_mutation_proof,
    controlled_runtime_adapter_fixture: {
      action: fixtureProof.action,
      fixture_only: fixtureProof.fixture_only,
      disposable_db_only: fixtureProof.disposable_db_only,
      uses_real_repository_methods: fixtureProof.uses_real_repository_methods,
      provider_calls: fixtureProof.provider_calls,
      live_api_calls: fixtureProof.live_api_calls,
      operator_corpus_mutated: fixtureProof.operator_corpus_mutated,
      production_actor_watch_redirected: fixtureProof.production_actor_watch_redirected,
      runActorWatchService_changed: fixtureProof.runActorWatchService_changed,
      watchExecutor_dispatchFor_changed: fixtureProof.watchExecutor_dispatchFor_changed,
      collect_actor_watch_imported: fixtureProof.collect_actor_watch_imported,
      collect_actor_watch_invoked: fixtureProof.collect_actor_watch_invoked
    },
    compatibility_language_posture: {
      collection: 'old scheduled caller return-shape compatibility/debug projection only',
      collection_plan: 'old compatibility summary field only',
      expansion_queue: 'old compatibility summary field only',
      expansion_queue_summary: 'old compatibility summary field only',
      zkill_refs_discovered: 'old compatibility summary field only',
      zkill_discovery_skipped: 'old compatibility summary field only'
    }
  };
}

function buildFixtureWatch(input = {}) {
  return {
    watch_id: input.watchId || 'fixture-actor-watch-disabled-seam',
    watch_type: 'actor',
    entity_type: 'character',
    entity_id: input.entityId || 90000001,
    source: 'fixture_only_disabled_adapter_seam',
    production_watch_row: false
  };
}

module.exports = {
  buildWatchActorControlledAdapterDisabledPreview
};
