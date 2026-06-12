const {
  buildActorWatchProductionLikeFakeClientDirectProof
} = require('../discovery/actorWatchProductionLikeFakeClientDirectProof');
const {
  actorWatchCompatibilitySummaryFieldParity
} = require('../discovery/actorWatchCompatibilitySummary');

const ACTION = 'watch.actor_discovery_handoff_contract.preview';

async function buildWatchActorDiscoveryHandoffContractPreview(db, input = {}) {
  const before = db ? tableCounts(db) : null;
  const proof = await buildActorWatchProductionLikeFakeClientDirectProof({
    now: input.now || '2026-06-12T00:00:00.000Z'
  });
  const after = db ? tableCounts(db) : null;
  const fixtureCase = proof.cases.fresh_direct_actor_watch;
  const compatibilitySummary = fixtureCase.compatibility_summary;

  const directRequest = buildActorWatchDiscoveryRequest({
    source: 'direct_actor_watch',
    normalizedInput: fixtureCase.normalized_actor_watch_input,
    compatibilitySummary,
    basis: {
      watch_id: null,
      scope_key: null,
      direct_request_basis: 'fixture actor.watch payload projected from production-like direct body proof'
    }
  });
  const scheduledRequest = buildActorWatchDiscoveryRequest({
    source: 'scheduled_actor_watch',
    normalizedInput: fixtureCase.normalized_actor_watch_input,
    compatibilitySummary,
    basis: {
      watch_id: 'fixture-watch-452',
      scope_key: scopeKeyForActor(compatibilitySummary.actor),
      direct_request_basis: null
    }
  });

  const directReceipt = buildActorWatchDiscoveryReceipt({
    request: directRequest,
    compatibilitySummary
  });
  const scheduledReceipt = buildActorWatchDiscoveryReceipt({
    request: scheduledRequest,
    compatibilitySummary
  });

  return {
    action: ACTION,
    generated_at: input.now || '2026-06-12T00:00:00.000Z',
    read_only: true,
    fixture_only: true,
    provider_calls: 0,
    live_api_calls: 0,
    operator_corpus_mutated: false,
    runtime_behavior_changed: false,
    actor_watch_redirected_by_this_proof: false,
    scheduled_actor_watch_redirected_by_this_proof: false,
    collect_actor_watch_retired: false,
    system_radius_behavior_changed: false,
    watch_execution: false,
    watch_dispatches: 0,
    tasks_created: 0,
    task_runner_methods_called: [],
    discovered_killmail_refs_written: 0,
    evidence_writes: 0,
    evidence_landing_performed: false,
    hydration_writes: 0,
    watch_mutations: 0,
    schema_changes: 0,
    dispatcher_queue_lease_behavior_changed: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    source_terms_renamed: false,
    protected_word_json_updated: false,
    contract_projection_shape: {
      request_model: 'actor_watch_discovery_request',
      receipt_model: 'actor_watch_discovery_receipt',
      compatibility_summary_nested: true,
      compatibility_summary_is_future_contract: false
    },
    ownership_split: {
      watch_owned_request_fields: [
        'source',
        'command',
        'actor',
        'window.lookback_seconds',
        'caps.max_refs',
        'caps.max_expansions',
        'basis.watch_id',
        'basis.scope_key',
        'basis.direct_request_basis'
      ],
      discovery_owned_receipt_fields: [
        'run_id',
        'candidate_ref_counts',
        'pending_ref_counts',
        'selection_counts',
        'evidence_landing_counts',
        'api_counts',
        'warnings',
        'outcome',
        'compatibility_summary'
      ]
    },
    direct_projection: {
      caller: 'runActorWatchService -> runActorWatchDirectBody',
      request: directRequest,
      receipt: directReceipt,
      caller_projection: {
        current_return_shape: '22-field compatibility summary',
        projected_contract_shape: 'actor_watch_discovery_receipt',
        compatibility_summary_nested_for_contract: true
      }
    },
    scheduled_projection: {
      caller: 'WatchSessionExecutor.tick -> dispatchFor(actor) -> runScheduledActorWatch -> runActorWatchDirectBody',
      request: scheduledRequest,
      receipt: scheduledReceipt,
      caller_projection: {
        current_return_shape: '{ status, data: { watch, collection } }',
        current_collection_shape: '22-field compatibility summary',
        projected_contract_shape: 'actor_watch_discovery_receipt',
        compatibility_summary_nested_for_contract: true
      }
    },
    compatibility_posture: {
      field_count: Object.keys(compatibilitySummary).length,
      field_parity: actorWatchCompatibilitySummaryFieldParity(compatibilitySummary),
      nested_under: 'compatibility_summary',
      compatibility_only: true,
      temporary_debug_fields: [
        'collection',
        'collection_plan',
        'expansion_queue',
        'expansion_queue_summary',
        'zkill_refs_discovered',
        'zkill_discovery_skipped',
        'production compatibility summary',
        'direct body',
        'runScheduledActorWatch'
      ]
    },
    fixture_source: {
      action: proof.action,
      fixture_owned_db_only: proof.fixture_owned_db_only,
      uses_injected_fake_clients_only: proof.uses_injected_fake_clients_only,
      compatibility_summary_field_parity: proof.compatibility_summary_field_parity,
      production_direct_redirect_status: proof.production_direct_redirect_status,
      scheduled_runtime_status: proof.scheduled_runtime_status
    },
    operator_corpus_non_mutation_proof: {
      before,
      after,
      unchanged: !before || JSON.stringify(before) === JSON.stringify(after)
    },
    boundary_flags: {
      live_provider_called: false,
      operator_db_written: false,
      runtime_behavior_changed: false,
      collectActorWatch_retired: false,
      system_radius_behavior_changed: false,
      durable_receipt_persisted: false,
      dispatcher_queue_lease_behavior_changed: false,
      renderer_ui_changed: false
    }
  };
}

function buildActorWatchDiscoveryRequest({ source, normalizedInput = {}, compatibilitySummary, basis }) {
  const actor = compatibilitySummary.actor || {};
  return {
    model: 'actor_watch_discovery_request',
    source,
    command: 'actor.watch',
    actor: {
      entity_type: actor.entity_type,
      entity_id: actor.entity_id,
      entity_name: actor.entity_name
    },
    window: {
      lookback_seconds: normalizedInput.lookbackSeconds ?? normalizedInput.lookback_seconds ?? null
    },
    caps: {
      max_refs: normalizedInput.maxRefs ?? normalizedInput.max_refs ?? null,
      max_expansions: normalizedInput.maxExpansions ?? normalizedInput.max_expansions ?? null
    },
    basis
  };
}

function buildActorWatchDiscoveryReceipt({ request, compatibilitySummary }) {
  return {
    model: 'actor_watch_discovery_receipt',
    run_id: compatibilitySummary.run_id,
    actor: request.actor,
    request_window: request.window,
    caps: request.caps,
    candidate_ref_counts: {
      discovered: compatibilitySummary.zkill_refs_discovered,
      unique_after_dedupe: compatibilitySummary.unique_refs_after_dedupe,
      duplicate_removed: compatibilitySummary.duplicate_refs_removed,
      malformed_removed: compatibilitySummary.malformed_refs_removed
    },
    pending_ref_counts: {
      considered: compatibilitySummary.pending_refs_considered,
      zkill_discovery_skipped: compatibilitySummary.zkill_discovery_skipped
    },
    selection_counts: {
      selected_for_expansion: compatibilitySummary.expansion_attempted,
      cap_skipped: compatibilitySummary.expansion_cap_skipped,
      already_cached: compatibilitySummary.already_cached_killmails,
      failed_expansions: compatibilitySummary.failed_expansions,
      expansion_queue_summary: compatibilitySummary.expansion_queue_summary
    },
    evidence_landing_counts: {
      new_esi_expansions: compatibilitySummary.new_esi_expansions,
      persisted_killmails: compatibilitySummary.persisted_killmails,
      activity_events_written: compatibilitySummary.activity_events_written
    },
    api_counts: {
      zkill: compatibilitySummary.api_calls_zkill,
      esi: compatibilitySummary.api_calls_esi,
      source: 'fixture synthetic api_request_logs from disposable proof DB'
    },
    warnings: compatibilitySummary.warnings,
    outcome: deriveProjectedOutcome(compatibilitySummary),
    compatibility_summary: compatibilitySummary
  };
}

function deriveProjectedOutcome(summary) {
  if (summary.failed_expansions > 0 && summary.persisted_killmails > 0) {
    return {
      code: 'partial_deferred',
      derived_projection_only: true
    };
  }
  if (summary.failed_expansions > 0) {
    return {
      code: 'failed_retryable',
      derived_projection_only: true
    };
  }
  if (summary.persisted_killmails > 0) {
    return {
      code: 'complete_refs_found',
      derived_projection_only: true
    };
  }
  return {
    code: 'complete_no_refs',
    derived_projection_only: true
  };
}

function scopeKeyForActor(actor = {}) {
  return `${actor.entity_type || 'character'}:${actor.entity_id || 'unknown'}`;
}

function tableCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
}

module.exports = {
  ACTION,
  buildWatchActorDiscoveryHandoffContractPreview,
  buildActorWatchDiscoveryRequest,
  buildActorWatchDiscoveryReceipt
};
