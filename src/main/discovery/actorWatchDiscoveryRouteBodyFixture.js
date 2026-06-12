const { planActorWatch } = require('../workers/actorWatchPlanner');
const { discoverActorRefs } = require('./zkillCandidateAcquisition');
const { pendingActorDiscovery } = require('./candidateRefMemory');
const {
  selectExpansionCandidates,
  markFailedExpansionCandidates,
  summarizeExpansionQueue
} = require('./expansionQueueSelection');
const { buildEvidencePackageFromRefs } = require('./esiBackedExpansionPackage');

const ACTION = 'watch.actor_discovery_route_body_fixture.preview';

async function buildActorWatchDiscoveryRouteBodyFixture(input = {}, dependencies = {}) {
  const now = input.now || new Date().toISOString();
  const payload = normalizeActorPayload(input);
  const plannerOutput = dependencies.plannerOutput || planActorWatch(payload);
  const fakeRepository = dependencies.repository || fixtureRepository(input);
  const fakeZkillClient = dependencies.zkillClient || fixtureZkillClient(input);
  const fakeEsiClient = dependencies.esiClient || fixtureEsiClient(input);
  const pendingRefs = Array.isArray(input.pendingRefs) ? input.pendingRefs : [];
  const discovery = pendingRefs.length
    ? pendingActorDiscovery(pendingRefs, plannerOutput)
    : await discoverActorRefs(plannerOutput, fakeZkillClient);

  const selection = selectExpansionCandidates(
    discovery.expansionQueue,
    fakeRepository,
    plannerOutput.caps.maxExpansions
  );
  const evidencePackage = await buildEvidencePackageFromRefs({
    refs: selection.selectedRefs,
    repository: fakeRepository,
    esiClient: fakeEsiClient,
    run: {
      run_id: `route_body_fixture_${safe(plannerOutput.actor.entity_type)}_${safe(plannerOutput.actor.entity_id)}_${Date.parse(now) || 0}`,
      source_type: 'actor',
      source_id: `${plannerOutput.actor.entity_type}:${plannerOutput.actor.entity_id}`,
      started_at: now
    },
    discoveredBy: {
      type: 'actor',
      id: plannerOutput.actor.entity_id
    }
  });

  markFailedExpansionCandidates(selection.expansionQueue, evidencePackage.warnings);
  selection.skipCounts = summarizeExpansionQueue(selection.expansionQueue);

  const collectionWarnings = [
    ...plannerOutput.guardrailWarnings,
    ...discovery.warnings
  ];
  if (selection.skipCounts.cap_skipped > 0) {
    collectionWarnings.push(`Expansion cap skipped ${selection.skipCounts.cap_skipped} uncached refs`);
  }

  const compatibilityResult = buildCompatibilityResult({
    plannerOutput,
    discovery,
    selection,
    evidencePackage,
    collectionWarnings,
    pendingRefs
  });

  return {
    action: ACTION,
    classification: 'actor Watch Discovery-owned route body fixture proof',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    fixture_only: true,
    route_body_fixture_only: true,
    explicit_preview_command_only: true,
    non_authoritative_for_runtime_behavior: true,
    actor_only: true,
    system_radius_touched: false,
    old_entry_point: 'actor.watch',
    current_retire_candidate: 'collectActorWatch',
    production_actor_watch_redirected: false,
    runActorWatchService_changed: false,
    watchExecutor_dispatchFor_changed: false,
    provider_calls: 0,
    live_api_calls: 0,
    zkill_calls: 0,
    esi_calls: 0,
    fake_zkill_client_invocations: fakeZkillClient.invocations || 0,
    fake_esi_client_invocations: fakeEsiClient.invocations || 0,
    watch_execution: false,
    watch_dispatches: 0,
    dispatch_runner_invoked: false,
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
    candidate_ref_status_mutation_posture: candidateRefStatusMutationPosture(selection, evidencePackage),
    evidence_written: false,
    evidence_created: false,
    evidence_writes: 0,
    evidence_rows_written: 0,
    evidence_landing_performed: false,
    evidence_writer_invoked: false,
    evidence_writer_boundary: evidenceWriterBoundary(evidencePackage),
    live_esi_backed_expansion_run: false,
    esi_evidence_expansion_run: false,
    esi_backed_expansion_is_hydration: false,
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
    actor_watch_payload: payload,
    normalized_actor_scope: plannerOutput.actor,
    composed_discovery_helpers: [
      'discoverActorRefs',
      ...(pendingRefs.length ? ['pendingActorDiscovery'] : []),
      'selectExpansionCandidates',
      'buildEvidencePackageFromRefs'
    ],
    helper_source_files: {
      discoverActorRefs: 'src/main/discovery/zkillCandidateAcquisition.js',
      pendingActorDiscovery: 'src/main/discovery/candidateRefMemory.js',
      selectExpansionCandidates: 'src/main/discovery/expansionQueueSelection.js',
      buildEvidencePackageFromRefs: 'src/main/discovery/esiBackedExpansionPackage.js'
    },
    discovery_stage: {
      used_pending_ref_drain: pendingRefs.length > 0,
      zkill_discovery_skipped: pendingRefs.length > 0,
      discovered_refs: discovery.discoveredRefs,
      duplicate_refs_removed: discovery.duplicateRefsRemoved,
      malformed_refs_removed: discovery.malformedRefsRemoved,
      unique_refs_after_dedupe: discovery.uniqueRefs.length,
      pending_refs_considered: discovery.pendingRefsConsidered || 0,
      warnings: discovery.warnings,
      candidate_refs_are_possible_leads: true,
      candidate_refs_are_evidence: false,
      durable_refs_written: false
    },
    selection_stage: {
      selected_refs: selection.selectedRefs,
      expansion_queue: selection.expansionQueue,
      expansion_queue_summary: selection.skipCounts,
      local_cache_skip_preserved: selection.skipCounts.cached > 0 || evidencePackage.run.already_cached > 0
    },
    esi_backed_expansion_stage: {
      owner: 'Discovery',
      not_hydration: true,
      package_built: true,
      fake_client_only: true,
      killmail_package_count: evidencePackage.killmails.length,
      activity_event_package_count: evidencePackage.activity_events.length,
      warning_count: evidencePackage.warnings.length,
      failed_count: evidencePackage.run.failed_count,
      already_cached_count: evidencePackage.run.already_cached,
      evidence_landing_performed: false
    },
    old_caller_facing_compatibility_result: compatibilityResult,
    old_result_compatibility_map: oldResultCompatibilityMap(compatibilityResult),
    compatibility_term_posture: {
      old_result_fields_are_compatibility_only: true,
      future_discovery_receipt_doctrine_claimed: false,
      old_collector_semantics_claimed_replaced: false
    },
    non_invocation_proof: {
      route_body_file: 'src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js',
      collectActorWatch_imported: false,
      collectActorWatch_entered: false,
      collectSystemRadiusWatch_entered: false,
      runActorWatchService_runtime_changed: false,
      watchExecutor_dispatchFor_runtime_changed: false,
      WatchSessionExecutor_tick_invoked: false,
      TaskRunner_runDetachedTask_invoked: false,
      actor_watch_redirect_performed: false,
      collector_retirement_performed: false,
      source_actions_used: [ACTION],
      excluded_runtime_paths: [
        'runActorWatchService',
        'watchExecutor.dispatchFor runtime path',
        'collectActorWatch',
        'collectSystemRadiusWatch',
        'WatchSessionExecutor.tick',
        'TaskRunner.runDetachedTask',
        'live HttpClient',
        'ZKillDiscoveryClient',
        'EsiClient',
        'EvidenceRepository.persistEvidencePackage'
      ]
    },
    boundary_flags: {
      providers_called: false,
      live_api_called: false,
      fake_clients_only: true,
      actor_watch_redirected: false,
      runActorWatchService_changed: false,
      watchExecutor_dispatchFor_changed: false,
      mixed_collectors_invoked: false,
      collectActorWatch_invoked_or_retired: false,
      live_watch_dispatch_invoked: false,
      task_created: false,
      watch_mutated: false,
      discovery_refs_written: false,
      evidence_written: false,
      evidence_writer_invoked: false,
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
      protected_words_updated: false
    },
    boundary: [
      'This proof composes Discovery-owned helpers with fake/injected clients only.',
      'The old caller-facing result shape is emitted as compatibility output, not Discovery receipt doctrine.',
      'Candidate refs remain Discovery leads/provenance, not Evidence/EVEidence.',
      'ESI-backed expansion remains Discovery-owned provider-facing behavior, not Hydration.',
      'Evidence/EVEidence begins only at writer landing; writer landing is represented but not invoked.',
      'Production actor.watch, runActorWatchService, watchExecutor.dispatchFor, and collectActorWatch remain unchanged.'
    ]
  };
}

function normalizeActorPayload(input = {}) {
  return {
    entityType: input.entityType || input.entity_type || 'character',
    entityId: input.entityId ?? input.entity_id ?? 90000001,
    entityName: input.entityName || input.entity_name || 'Route Body Fixture Pilot',
    lookbackSeconds: input.lookbackSeconds ?? input.lookback_seconds ?? 1209600,
    maxRefs: input.maxRefs ?? input.max_refs ?? 5,
    maxExpansions: input.maxExpansions ?? input.max_expansions ?? 2
  };
}

function buildCompatibilityResult({ plannerOutput, discovery, selection, evidencePackage, collectionWarnings, pendingRefs }) {
  return {
    run_id: evidencePackage.run.run_id,
    actor: plannerOutput.actor,
    zkill_refs_discovered: discovery.discoveredRefs,
    duplicate_refs_removed: discovery.duplicateRefsRemoved,
    malformed_refs_removed: discovery.malformedRefsRemoved,
    unique_refs_after_dedupe: discovery.uniqueRefs.length,
    pending_refs_considered: discovery.pendingRefsConsidered || 0,
    already_cached_killmails: selection.skipCounts.cached + evidencePackage.run.already_cached,
    expansion_attempted: selection.selectedRefs.length,
    expansion_cap_skipped: selection.skipCounts.cap_skipped,
    new_esi_expansions: evidencePackage.run.expanded_count,
    failed_expansions: evidencePackage.run.failed_count,
    persisted_killmails: 0,
    activity_events_written: 0,
    api_calls_zkill: 0,
    api_calls_esi: 0,
    warnings: [
      ...collectionWarnings,
      ...evidencePackage.warnings.map((entry) => entry.message)
    ],
    planned_zkill_requests: plannerOutput.plannedZkillRequests.length,
    zkill_discovery_skipped: pendingRefs.length > 0,
    collection_plan: {
      actor: plannerOutput.actor,
      zkill_requests_planned: plannerOutput.plannedZkillRequests.length,
      known_local_killmails: selection.skipCounts.cached,
      expansion_budget: plannerOutput.caps.maxExpansions,
      selected_for_expansion: selection.selectedRefs.length,
      estimated_api_calls: {
        zkill: plannerOutput.estimatedApiCalls.zkill,
        esi: selection.selectedRefs.length,
        metadata: 0
      },
      compatibility_only: true
    },
    expansion_queue: selection.expansionQueue,
    expansion_queue_summary: selection.skipCounts,
    compatibility_metadata: {
      old_caller_facing_shape: true,
      not_future_discovery_receipt_doctrine: true,
      evidence_writer_landing_not_invoked: true,
      provider_calls: 0,
      live_api_calls: 0
    }
  };
}

function oldResultCompatibilityMap(result) {
  return {
    compatibility_fields: [
      'run_id',
      'actor',
      'zkill_refs_discovered',
      'duplicate_refs_removed',
      'malformed_refs_removed',
      'unique_refs_after_dedupe',
      'pending_refs_considered',
      'already_cached_killmails',
      'expansion_attempted',
      'expansion_cap_skipped',
      'new_esi_expansions',
      'failed_expansions',
      'persisted_killmails',
      'activity_events_written',
      'api_calls_zkill',
      'api_calls_esi',
      'warnings',
      'planned_zkill_requests',
      'zkill_discovery_skipped',
      'collection_plan',
      'expansion_queue',
      'expansion_queue_summary'
    ],
    compatibility_only: true,
    represented_by_route_body_fixture: Object.keys(result),
    represented_as_zero_because_writer_not_invoked: [
      'persisted_killmails',
      'activity_events_written',
      'api_calls_zkill',
      'api_calls_esi'
    ],
    not_claimed: [
      'real fetch_runs lifecycle',
      'real api_request_logs counts',
      'real discovered_killmail_refs status mutation',
      'real Evidence/EVEidence writer landing',
      'Watch cadence update from receipt'
    ]
  };
}

function candidateRefStatusMutationPosture(selection, evidencePackage) {
  const selected = selection.selectedRefs.map((ref) => ({ killmail_id: ref.killmail_id, hash: ref.hash }));
  const expanded = evidencePackage.killmails.map((killmail) => ({
    killmail_id: killmail.killmail_id,
    hash: killmail.killmail_hash
  }));
  const cached = selection.expansionQueue
    .filter((candidate) => candidate.skip_reason === 'cached')
    .map((candidate) => ({ killmail_id: candidate.killmail_id, hash: candidate.hash }));
  const failed = selection.expansionQueue
    .filter((candidate) => candidate.skip_reason === 'failed')
    .map((candidate) => ({ killmail_id: candidate.killmail_id, hash: candidate.hash }));
  return {
    fixture_proven_no_persistence: true,
    status_policy_rewritten: false,
    would_mark_selected_count: selected.length,
    would_mark_expanded_count: expanded.length,
    would_mark_cached_count: cached.length,
    would_mark_failed_count: failed.length,
    selected_refs: selected,
    expanded_refs: expanded,
    cached_refs: cached,
    failed_refs: failed
  };
}

function evidenceWriterBoundary(evidencePackage) {
  return {
    owner: 'Evidence/EVEidence writer',
    represented: true,
    invoked: false,
    evidence_writes: 0,
    persistEvidencePackage_called: false,
    package_ready_for_future_writer: true,
    package_counts: {
      killmails: evidencePackage.killmails.length,
      activity_events: evidencePackage.activity_events.length,
      entity_updates: evidencePackage.entity_updates.length,
      ingestion_audits: evidencePackage.ingestion_audits.length,
      warnings: evidencePackage.warnings.length
    }
  };
}

function fixtureRepository(input = {}) {
  const cached = new Set((input.cachedKillmailIds || []).map((value) => Number(value)));
  return {
    hasKillmail(killmailId) {
      return cached.has(Number(killmailId));
    }
  };
}

function fixtureZkillClient(input = {}) {
  const refs = Array.isArray(input.fixtureRefs) ? input.fixtureRefs : defaultFixtureRefs();
  return {
    invocations: 0,
    async discoverRefs() {
      this.invocations += 1;
      return refs.map((ref) => ({ ...ref }));
    }
  };
}

function fixtureEsiClient(input = {}) {
  const failures = new Map((input.fixtureEsiFailures || []).map((entry) => [Number(entry.killmail_id), entry]));
  return {
    invocations: 0,
    async expandKillmail(killmailId, hash) {
      this.invocations += 1;
      const failure = failures.get(Number(killmailId));
      if (failure) {
        const error = new Error(failure.message || 'fixture ESI-backed expansion failure');
        error.code = failure.code || 'FIXTURE_ESI_FAILURE';
        error.statusCode = failure.statusCode;
        throw error;
      }
      return fixtureKillmail(Number(killmailId), hash);
    }
  };
}

function defaultFixtureRefs() {
  return [
    { killmail_id: 400415001, hash: 'hs415_actor_route_hash_001' },
    { killmail_id: 400415002, hash: 'hs415_actor_route_hash_002' },
    { killmail_id: 400415003, hash: 'hs415_actor_route_hash_003' }
  ];
}

function fixtureKillmail(killmailId) {
  return {
    killmail_id: killmailId,
    killmail_time: '2026-06-07T22:15:00Z',
    solar_system_id: 30003597,
    victim: {
      character_id: 90000001,
      character_name: 'Route Body Victim',
      corporation_id: 98000001,
      corporation_name: 'Route Body Victim Corp',
      alliance_id: 99000001,
      alliance_name: 'Route Body Victim Alliance',
      ship_type_id: 587,
      ship_type_name: 'Rifter'
    },
    attackers: [{
      character_id: 90000002,
      character_name: 'Route Body Attacker',
      corporation_id: 98000002,
      corporation_name: 'Route Body Attackers',
      alliance_id: 99000002,
      alliance_name: 'Route Body Coalition',
      ship_type_id: 603,
      ship_type_name: 'Merlin',
      weapon_type_id: 2488,
      damage_done: 1200,
      final_blow: true
    }]
  };
}

function safe(value) {
  return String(value || 'unknown').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'unknown';
}

module.exports = {
  ACTION,
  buildActorWatchDiscoveryRouteBodyFixture
};
