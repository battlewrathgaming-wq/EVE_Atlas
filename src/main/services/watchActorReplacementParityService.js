const { buildWatchMixedCollectorReplacementRoutePreview } = require('./watchMixedCollectorReplacementRouteService');

const ACTION = 'watch.actor_replacement_parity.preview';

function buildWatchActorReplacementParityPreview(db, input = {}, context = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const route = buildWatchMixedCollectorReplacementRoutePreview(db, {
    ...input,
    now
  }, context);
  const sourceWatch = route.selected_watch_source || null;
  const actorOnly = sourceWatch?.watch_type === 'actor';
  const payload = route.future_route?.[1]?.input?.source_dispatch_payload || {};
  const candidates = route.future_route?.[1]?.output?.normalized_candidate_refs || [];
  const handoffCandidates = route.future_route?.[2]?.input || [];
  const cachedKillmailIds = new Set((input.cachedKillmailIds || []).map((value) => Number(value)));
  const after = stateSnapshot(db);

  return {
    action: ACTION,
    classification: 'read-only actor Watch replacement parity proof',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    fixture_only: true,
    actor_only: true,
    system_radius_selected_or_changed: false,
    renderer_eligible: true,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    watch_execution: false,
    watch_dispatches: 0,
    dispatch_runner_invoked: false,
    dispatch_runner_invocations: 0,
    collectors_called: false,
    collect_actor_watch_invoked: false,
    collect_system_radius_watch_invoked: false,
    mixed_collectors_invoked: false,
    task_runner_methods_called: [],
    tasks_created: 0,
    queue_created: false,
    dispatcher_created: false,
    leases_created: 0,
    watch_mutations: 0,
    watch_rows_mutated: 0,
    discovery_refs_written: false,
    durable_discovery_refs_written: false,
    discovered_killmail_refs_written: 0,
    discovery_refs_mutated: 0,
    evidence_written: false,
    evidence_created: false,
    evidence_writes: 0,
    evidence_rows_written: 0,
    live_esi_backed_expansion_run: false,
    esi_evidence_expansion_run: false,
    evidence_landing_performed: false,
    hydration_writes: 0,
    hydration_created: false,
    metadata_writes: 0,
    api_request_log_writes: 0,
    data_quality_warning_writes: 0,
    fetch_run_writes: 0,
    schema_changes: 0,
    durable_task_packet_schema_created: false,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    actor_watch_redirected: false,
    mixed_collector_redirected: false,
    mixed_collector_retired: false,
    selected_actor_watch_source: actorOnly ? sourceWatch : null,
    current_actor_entry_point_shape: {
      command: 'actor.watch',
      payload_family: 'actor_watch_dispatch_payload',
      represented: actorOnly,
      payload,
      actor_target_identity: {
        entity_type: payload.entityType || null,
        entity_id: payload.entityId ?? null,
        entity_name: payload.entityName || null
      },
      lookback_seconds: payload.lookbackSeconds ?? null,
      max_refs: payload.maxRefs ?? null,
      max_expansions: payload.maxExpansions ?? null
    },
    current_legacy_collector: {
      function: 'collectActorWatch',
      file: 'src/main/workers/actorWatchCollector.js',
      would_have_been_used_by_current_actor_watch: actorOnly,
      invoked: false
    },
    future_boundary_owned_stages: actorOnly ? route.future_route : [],
    semantic_parity_map: semanticParityMapFor({ route, payload, candidates, handoffCandidates, cachedKillmailIds, actorOnly }),
    represented_current_behavior_items: representedItemsFor({ route, payload, candidates, handoffCandidates, cachedKillmailIds, actorOnly }),
    missing_or_parked_current_behavior_items: missingItemsFor({ route, candidates, cachedKillmailIds, actorOnly }),
    compatibility_wrapper_posture: {
      posture: 'candidate_only_not_implemented',
      old_command_entry_point: 'actor.watch',
      current_behavior_changed: false,
      redirect_performed: false,
      redirect_authorized_now: false
    },
    retire_posture: {
      posture: 'retire_candidate_only_not_retired',
      retire_candidate: {
        function: 'collectActorWatch',
        file: 'src/main/workers/actorWatchCollector.js'
      },
      retirement_performed: false,
      retirement_authorized_now: false
    },
    proof_basis: {
      hs374_route_preview: {
        command: 'watch.mixed_collector_replacement_route.preview',
        represented: true,
        actor_route_selected: actorOnly,
        route_summary: route.route_summary || null
      },
      hs376_readiness: {
        artifact: 'workspace/EngineeringTraceHS376-actor-watch-first-replacement-slice-readiness.md',
        represented: true,
        system_radius_deferred: true
      },
      hs370_handoff_basis: route.existing_proof_basis?.hs370_discovery_acquisition_to_evidence_handoff || null
    },
    non_invocation_proof: {
      collectActorWatch_entered: false,
      collectSystemRadiusWatch_entered: false,
      WatchSessionExecutor_tick_invoked: false,
      TaskRunner_runDetachedTask_invoked: false,
      runActorWatchService_runtime_changed: false,
      watchExecutor_dispatchFor_runtime_changed: false,
      live_watch_dispatch_invoked: false,
      redirect_performed: false,
      retirement_performed: false,
      source_actions_used: [
        ACTION,
        route.action,
        ...(route.non_invocation_proof?.source_actions_used || [])
      ],
      excluded_runtime_paths: [
        'runActorWatchService',
        'watchExecutor.dispatchFor runtime path',
        'collectActorWatch',
        'collectSystemRadiusWatch',
        'WatchSessionExecutor.tick',
        'TaskRunner.runDetachedTask'
      ]
    },
    no_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
        && route.no_mutation_proof?.unchanged === true,
      writes_attempted: false,
      runtime_behavior_changed: false
    },
    boundary_flags: {
      providers_called: false,
      live_api_called: false,
      actor_watch_redirected: false,
      runActorWatchService_changed: false,
      watchExecutor_dispatchFor_changed: false,
      mixed_collectors_invoked: false,
      live_watch_dispatch_invoked: false,
      task_created: false,
      watch_mutated: false,
      discovery_refs_written: false,
      evidence_written: false,
      live_esi_backed_expansion_run: false,
      hydration_written: false,
      api_logs_or_warnings_written: false,
      fetch_runs_written: false,
      schema_changed: false,
      queue_dispatcher_or_lease_created: false,
      support_artifact_created: false,
      ui_changed: false,
      runtime_enforcement_or_command_blocking_active: false,
      system_radius_behavior_changed: false,
      mixed_collectors_retired_or_redirected: false,
      protected_words_updated: false
    },
    boundary: [
      'Actor Watch remains the source of actor intent, cadence, caps, and lookback.',
      'Discovery owns zKill candidate-lead acquisition and the ESI-backed killmail/detail expansion lane.',
      'Candidate refs are possible leads, not Evidence/EVEidence.',
      'Discovery ESI-backed expansion is provider movement, not Hydration.',
      'Evidence/EVEidence starts at final landed memory; the writer boundary is represented but not invoked.'
    ]
  };
}

function semanticParityMapFor({ route, payload, candidates, handoffCandidates, cachedKillmailIds, actorOnly }) {
  const outcomeCounts = route.future_route?.[4]?.input?.watch_summary_projection?.packet_outcome_counts || {};
  const malformed = candidates.filter((candidate) => !candidate.killmail_id || !candidate.killmail_hash);
  const cached = handoffCandidates.filter((candidate) => cachedKillmailIds.has(Number(candidate.killmail_id)));
  return {
    actor_only_selected: actorOnly,
    actor_target_identity: fact(Boolean(payload.entityType && payload.entityId), {
      entity_type: payload.entityType || null,
      entity_id: payload.entityId ?? null,
      entity_name: payload.entityName || null
    }),
    lookback_seconds: fact(Number.isFinite(Number(payload.lookbackSeconds)), payload.lookbackSeconds ?? null),
    max_refs: fact(Number.isFinite(Number(payload.maxRefs)), payload.maxRefs ?? null),
    max_expansions: fact(Number.isFinite(Number(payload.maxExpansions)), payload.maxExpansions ?? null),
    zkill_request_target: fact(Boolean(route.future_route?.[1]?.input?.packet_targets?.[0]?.provider_target), route.future_route?.[1]?.input?.packet_targets?.[0]?.provider_target || null),
    candidate_ref_extraction: fact(candidates.length > 0, candidates.map((candidate) => ({
      killmail_id: candidate.killmail_id,
      killmail_hash: candidate.killmail_hash,
      candidate_only: true,
      evidence_written: false
    }))),
    malformed_candidate_posture: {
      represented: malformed.length > 0,
      count: malformed.length,
      posture: malformed.length ? 'fixture_malformed_candidate_disclosed' : 'not_present_in_this_fixture_case'
    },
    duplicate_candidate_posture: {
      represented: (route.future_route?.[1]?.output?.dedupe_posture?.duplicate_candidate_count || 0) > 0,
      posture: route.future_route?.[1]?.output?.dedupe_posture || null
    },
    no_ref_posture: {
      represented: Boolean(outcomeCounts.complete_no_refs),
      outcome_count: outcomeCounts.complete_no_refs || 0
    },
    acquisition_capped_posture: {
      represented: Boolean(outcomeCounts.acquisition_capped),
      full_coverage_claimed: false,
      cap_basis: route.future_route?.[4]?.input?.canonical_discovery_receipt_basis?.cap_basis || null
    },
    provider_deferred_posture: {
      represented: Boolean(outcomeCounts.provider_deferred || outcomeCounts.partial_deferred),
      deferred_count: (outcomeCounts.provider_deferred || 0) + (outcomeCounts.partial_deferred || 0)
    },
    esi_backed_expansion_intake: {
      represented: handoffCandidates.length > 0,
      owner: 'Discovery',
      not_hydration: true,
      candidates: handoffCandidates.map((candidate) => ({
        killmail_id: candidate.killmail_id,
        killmail_hash: candidate.killmail_hash,
        esi_call_performed: false,
        evidence_written: false
      }))
    },
    local_cache_skip_posture: {
      represented: cached.length > 0,
      fixture_basis: cachedKillmailIds.size > 0 ? 'input.cachedKillmailIds' : 'not_supplied',
      cached_count: cached.length,
      esi_call_required_for_cached_candidates: false
    },
    esi_backed_expansion_failure_posture: {
      represented: false,
      missing_reason: 'fixture does not execute ESI-backed expansion; failure posture remains future Discovery ESI-backed lane proof'
    },
    evidence_writer_landing_boundary: {
      represented: true,
      owner: 'Evidence/EVEidence writer',
      invoked: false,
      evidence_writes: 0
    },
    watch_receipt_cadence_posture: {
      represented: true,
      owner: 'Watch',
      watch_mutation: false,
      projection: route.route_summary?.watch_receipt_projection || null
    }
  };
}

function representedItemsFor(input) {
  const map = semanticParityMapFor(input);
  return Object.entries(map)
    .filter(([, value]) => value?.represented === true || value === true)
    .map(([key]) => key);
}

function missingItemsFor({ route, candidates, cachedKillmailIds, actorOnly }) {
  const outcomeCounts = route.future_route?.[4]?.input?.watch_summary_projection?.packet_outcome_counts || {};
  const missing = [
    'live_zkill_provider_call_not_proven',
    'durable_discovery_ref_write_not_proven',
    'live_esi_backed_expansion_not_proven',
    'evidence_eveidence_landing_not_proven',
    'watch_cadence_mutation_not_proven',
    'compatibility_wrapper_not_implemented',
    'collectActorWatch_not_retired'
  ];
  if (!actorOnly) {
    missing.push('actor_watch_source_not_selected');
  }
  if (!candidates.some((candidate) => !candidate.killmail_id || !candidate.killmail_hash)) {
    missing.push('malformed_candidate_not_present_in_this_fixture_case');
  }
  if (!(route.future_route?.[1]?.output?.dedupe_posture?.duplicate_candidate_count > 0)) {
    missing.push('duplicate_candidate_not_present_in_this_fixture_case');
  }
  if (!outcomeCounts.complete_no_refs) {
    missing.push('no_ref_outcome_not_present_in_this_fixture_case');
  }
  if (!outcomeCounts.acquisition_capped) {
    missing.push('acquisition_capped_not_present_in_this_fixture_case');
  }
  if (!outcomeCounts.provider_deferred && !outcomeCounts.partial_deferred) {
    missing.push('provider_deferred_not_present_in_this_fixture_case');
  }
  if (!cachedKillmailIds.size) {
    missing.push('local_cache_skip_fixture_basis_not_supplied');
  }
  return missing;
}

function fact(represented, value) {
  return { represented, value };
}

function stateSnapshot(db) {
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

function stableJson(value) {
  return JSON.stringify(value);
}

module.exports = {
  buildWatchActorReplacementParityPreview
};
