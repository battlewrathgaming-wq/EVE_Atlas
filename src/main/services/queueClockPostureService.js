const { actionGate } = require('./liveApiGateService');
const { buildExternalIoStateConfigReadback } = require('./externalIoStateService');
const { buildHydrationAttentionRuntimePosturePreview } = require('./hydrationAttentionRuntimePostureService');
const { buildHydrationCandidatePreview } = require('./hydrationCandidatePreviewService');
const { buildHydrationExecutionPolicyPreview } = require('./hydrationExecutionPolicyPreviewService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');
const { buildWatchOfflineReadout } = require('../watchlist/watchOfflineReadout');

const PROVIDER_ACTIONS = Object.freeze({
  zkill_discovery: 'manual.discovery',
  esi_evidence_expansion: 'manual.expansion',
  watch_background_hydration: 'metadata.hydration',
  view_local_record_hydration: 'metadata.hydration'
});

function buildQueueClockPosturePreview(db, input = {}, context = {}) {
  const now = input.now || new Date().toISOString();
  const externalIo = safeExternalIoReadback(input, context);
  const externalIoState = externalIo.state || 'off';
  const storage = safeStorageSetupReadout(input, context);
  const discovery = buildDiscoveryRefPosture(db, input);
  const watchOffline = safeWatchOfflineReadout(db, input, {
    ...context,
    now,
    externalIoState
  });
  const hydrationCandidates = safeHydrationCandidates(db, input, externalIoState);
  const hydrationRuntime = safeHydrationRuntime(db, input, context, externalIoState);
  const hydrationExecution = safeHydrationExecution(db, input, context, externalIoState);
  const lanes = buildClockLanes({
    discovery,
    watchOffline,
    hydrationCandidates,
    hydrationRuntime,
    hydrationExecution,
    externalIo,
    storage,
    input,
    context,
    now
  });

  return {
    action: 'runtime.queue_clock_posture.preview',
    classification: 'read-only queue/clock runtime posture preview',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    queue_dispatches: 0,
    discovery_ref_mutations: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    watch_mutations: 0,
    persisted_sequencer_packets: false,
    provider_work_queue_created: false,
    dispatcher_added: false,
    schema_changes: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    support_artifacts_created: 0,
    ui_work: false,
    restart_policy: {
      no_catch_up_flood_after_restart: true,
      no_catch_up_flood_after_storage_unlock: true,
      no_catch_up_flood_after_external_io_reenable: true,
      missed_slots_create_request_debt: false,
      next_step: 'recompute_local_posture_then_re_enter_normal_gates',
      immediate_dispatch: false
    },
    gates: {
      external_io: externalIoSummary(externalIo),
      storage_setup: storageSummary(storage)
    },
    summary: summarizeLanes(lanes, discovery, watchOffline, hydrationCandidates),
    discovery_refs: discovery,
    watch_offline_restart: compactWatchOffline(watchOffline),
    hydration: {
      candidate_summary: hydrationCandidates.summary || null,
      execution_policy_summary: hydrationExecution.summary || null,
      runtime_posture_summary: hydrationRuntime.runtime_posture?.summary || null,
      not_computable: [
        ...(hydrationRuntime.runtime_posture?.not_computable || []),
        ...(hydrationExecution.gates?.live_provider?.state === 'unknown'
          ? [{ fact: 'hydration_live_provider_cadence', reason: hydrationExecution.gates.live_provider.reason || 'unknown', guessed: false }]
          : [])
      ]
    },
    clocks: {
      acquisition_clock: {
        lanes: [
          lanes.zkill_discovery,
          lanes.esi_evidence_expansion
        ],
        discovery_refs_preferred_before_fresh_zkill: discovery.pending_or_failed_refs > 0,
        discovery_refs_are_possible_leads: true,
        esi_expansion_creates_evidence_if_executed_later: true,
        preview_creates_evidence: false
      },
      hydration_recovery_clock: {
        lanes: [
          lanes.watch_background_hydration,
          lanes.view_local_record_hydration
        ],
        hydration_is_readability_only: true,
        provider_needed_labels_are_evidence_work: false,
        preview_hydration_writes: 0
      }
    },
    next_safe_actions: nextSafeActions(lanes),
    unknown_or_uncomputable: unknownsFor({ lanes, watchOffline, hydrationExecution, storage }),
    boundary: [
      'Read-only queue/clock posture preview only; it does not dispatch work, call providers, or create a provider work queue.',
      'Discovery refs are possible leads/provenance, not Evidence/EVEidence; pending refs are preferred before fresh zKill discovery.',
      'ESI Evidence Expansion candidates are computed from local Discovery refs without mutating refs or writing killmail Evidence/EVEidence.',
      'Hydration candidates are readability demand from local records and previews; Hydration is separate from Evidence/EVEidence and Discovery.',
      'External I/O off, storage/setup blocks, budget hard-stop, cadence waits, and Watch arming are held/waiting posture, not failure.',
      'Restart, storage unlock, or External I/O re-enable does not create catch-up flood or request debt.'
    ]
  };
}

function buildDiscoveryRefPosture(db, input = {}) {
  const limit = boundedLimit(input.limit || input.previewLimit || input.preview_limit, 10, 50);
  const statusRows = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM discovered_killmail_refs
    GROUP BY status
  `).all();
  const counts = {
    pending: 0,
    failed: 0,
    expanded: 0,
    cached: 0,
    superseded: 0,
    total: 0
  };
  for (const row of statusRows) {
    const count = Number(row.count || 0);
    counts.total += count;
    if (Object.prototype.hasOwnProperty.call(counts, row.status)) {
      counts[row.status] = count;
    }
  }
  const candidateRows = db.prepare(`
    SELECT killmail_id, killmail_hash, status, discovered_by_type, discovered_by_id,
           source_scope, source_system_id, source_actor_type, source_actor_id,
           discovered_at, last_seen_at, priority, selected_for_expansion_at,
           failure_count, last_error
    FROM discovered_killmail_refs
    WHERE status IN ('pending', 'failed')
      AND killmail_hash IS NOT NULL
      AND killmail_hash <> ''
    ORDER BY status = 'failed', priority ASC, discovered_at ASC, killmail_id ASC
    LIMIT ?
  `).all(limit);
  const selectedRows = db.prepare(`
    SELECT COUNT(*) AS count
    FROM discovered_killmail_refs
    WHERE selected_for_expansion_at IS NOT NULL
      AND status IN ('pending', 'failed')
  `).get();

  return {
    classification: 'read-only Discovery ref queue posture',
    queue_status_counts: counts,
    pending_or_failed_refs: counts.pending + counts.failed,
    selected_for_expansion_count: Number(selectedRows?.count || 0),
    esi_expansion_candidates: candidateRows.length,
    fresh_zkill_discovery_preferred: candidateRows.length === 0,
    pending_refs_preferred_before_fresh_zkill: candidateRows.length > 0,
    possible_leads_not_evidence: true,
    evidence_writes: 0,
    ref_mutations: 0,
    representatives: candidateRows.map(compactDiscoveryRef),
    basis: [
      'discovered_killmail_refs status counts are local durable queue posture',
      'pending and failed refs with hashes are possible ESI expansion candidates',
      'queued refs and preview fields are not Evidence/EVEidence until ESI expansion writes killmails'
    ]
  };
}

function buildClockLanes({ discovery, watchOffline, hydrationCandidates, hydrationRuntime, hydrationExecution, externalIo, storage, input, context, now }) {
  const zkillGate = safeProviderGate('manual.discovery', providerInput('manual.discovery', input), context);
  const expansionGate = safeProviderGate('manual.expansion', {
    maxExpansions: discovery.esi_expansion_candidates || 0
  }, context);
  const hydrationGate = safeProviderGate('metadata.hydration', {
    idsToRequest: hydrationCandidates.summary?.provider_needed_candidates || 0
  }, context);
  const providerNeededHydration = hydrationCandidates.summary?.provider_needed_candidates || 0;
  const localHydration = hydrationCandidates.summary?.known_or_stale_local_label_candidates || 0;
  const sdeLocal = hydrationCandidates.summary?.local_sde_gap_candidates || 0;

  return {
    zkill_discovery: providerLane({
      laneId: 'zkill_discovery',
      clock: 'acquisition',
      label: 'zKill Discovery lane',
      actionClass: 'zkill_discovery',
      providerAction: 'manual.discovery',
      localWorkCount: discovery.pending_or_failed_refs,
      providerWorkCount: discovery.pending_or_failed_refs > 0 ? 0 : 1,
      preferredLocalAction: discovery.pending_or_failed_refs > 0 ? 'drain_pending_discovery_refs_first' : null,
      localOnlyWork: discovery.pending_or_failed_refs > 0
        ? 'existing Discovery refs available as possible leads before fresh zKill Discovery'
        : 'no pending Discovery refs found',
      storage,
      externalIo,
      providerGate: zkillGate,
      now
    }),
    esi_evidence_expansion: providerLane({
      laneId: 'esi_evidence_expansion',
      clock: 'acquisition',
      label: 'ESI Evidence Expansion lane',
      actionClass: 'esi_evidence_expansion',
      providerAction: 'manual.expansion',
      localWorkCount: discovery.esi_expansion_candidates,
      providerWorkCount: discovery.esi_expansion_candidates,
      preferredLocalAction: discovery.esi_expansion_candidates > 0 ? 'review_or_enrich_selected_refs' : null,
      localOnlyWork: 'ESI expansion candidates are computable from local Discovery refs without mutation',
      storage,
      externalIo,
      providerGate: expansionGate,
      now,
      evidenceCreationIfExecutedLater: true
    }),
    watch_background_hydration: providerLane({
      laneId: 'watch_background_hydration',
      clock: 'hydration_recovery',
      label: 'Watch/background hydration lane',
      actionClass: 'background_hydration',
      providerAction: 'metadata.hydration',
      localWorkCount: watchOffline.summary?.local_context_available || 0,
      providerWorkCount: watchHydrationDemand(hydrationCandidates),
      preferredLocalAction: watchNextAction(watchOffline),
      localOnlyWork: 'Watch/offline readout supplies durable restart posture; arming remains separate from provider movement',
      storage,
      externalIo,
      providerGate: hydrationGate,
      now,
      watchOffline
    }),
    view_local_record_hydration: providerLane({
      laneId: 'view_local_record_hydration',
      clock: 'hydration_recovery',
      label: 'view/local-record hydration lane',
      actionClass: 'fast_view_metadata_hydration',
      providerAction: 'metadata.hydration',
      localWorkCount: localHydration + sdeLocal,
      providerWorkCount: providerNeededHydration,
      preferredLocalAction: localHydration + sdeLocal > 0 ? 'use_local_readability_first' : null,
      localOnlyWork: 'known local labels and local SDE lookup gaps remain local/readability posture',
      storage,
      externalIo,
      providerGate: hydrationGate,
      now,
      hydrationRuntime,
      hydrationExecution
    })
  };
}

function providerLane({
  laneId,
  clock,
  label,
  actionClass,
  providerAction,
  localWorkCount,
  providerWorkCount,
  preferredLocalAction,
  localOnlyWork,
  storage,
  externalIo,
  providerGate,
  now,
  watchOffline = null,
  hydrationRuntime = null,
  hydrationExecution = null,
  evidenceCreationIfExecutedLater = false
}) {
  const storageDecision = storage.action_class_matrix?.actions?.[actionClass] || null;
  const externalIoPosture = externalIo.provider_backed_posture || 'held_by_external_io';
  const storageState = storage.action_class_matrix?.storage_state || storage.storage?.state || 'unknown';
  const budgetState = storage.budget?.state || 'unknown';
  const posture = lanePosture({
    storageDecision,
    storageState,
    budgetState,
    externalIoPosture,
    providerGate,
    providerWorkCount,
    watchOffline,
    preferredLocalAction
  });

  return {
    lane_id: laneId,
    clock,
    label,
    provider_action: providerAction,
    storage_action_class: actionClass,
    local_only_available_work: Number(localWorkCount || 0),
    provider_backed_work: Number(providerWorkCount || 0),
    posture: posture.state,
    next_safe_action: posture.nextSafeAction,
    reason_codes: posture.reasonCodes,
    waiting_is_failure: false,
    held_is_failure: false,
    provider_calls: 0,
    dispatches: 0,
    writes: 0,
    evidence_creation_if_executed_later: evidenceCreationIfExecutedLater,
    preview_creates_evidence: false,
    preview_mutates_state: false,
    storage: {
      storage_state: storageState,
      budget_state: budgetState,
      action_posture: storageDecision?.posture || 'unknown',
      action_write_posture: storageDecision?.basis?.write_posture || null,
      block_hold_reason: storageDecision?.basis?.block_hold_reason || null
    },
    external_io: {
      state: externalIo.state || 'off',
      provider_backed_posture: externalIoPosture,
      held_is_failure: externalIo.held_is_failure === true,
      on_is_authorization: externalIo.on_is_authorization === true,
      no_catch_up_flood_on_reenable: externalIo.reenable_catch_up_policy?.catch_up_flood !== true
    },
    provider_cadence: compactProviderGate(providerGate),
    watch_session: watchOffline ? {
      session_armed: watchOffline.session_armed === true,
      arming_required_for_watch_dispatch: watchOffline.session_armed !== true,
      due_or_eligible_if_armed: watchOffline.summary?.eligible_if_armed || 0,
      collection_active: watchOffline.collection_active === true,
      next_safe_actions: unique((watchOffline.watches || []).map((watch) => watch.next_safe_action).filter(Boolean))
    } : null,
    hydration_context: hydrationRuntime || hydrationExecution ? {
      runtime_summary: hydrationRuntime?.runtime_posture?.summary || null,
      execution_policy_summary: hydrationExecution?.summary || null
    } : null,
    basis: [
      localOnlyWork,
      `storage/action posture comes from storage.setup_gate_readout action_class_matrix.${actionClass}`,
      `External I/O posture comes from external_io.state_config_readback (${externalIo.state || 'off'})`,
      'provider cadence is read-only live.gate posture; allowed/waiting is not runtime authorization',
      'preview does not dispatch, persist packets, mutate queues, write Evidence/EVEidence, hydrate labels, arm Watch, or call providers',
      now ? `preview generated at ${now}` : null
    ].filter(Boolean)
  };
}

function lanePosture({ storageDecision = {}, storageState, budgetState, externalIoPosture, providerGate = {}, providerWorkCount, watchOffline, preferredLocalAction }) {
  const reasonCodes = new Set([
    `storage_state:${storageState || 'unknown'}`,
    `budget_state:${budgetState || 'unknown'}`
  ]);
  const actionPosture = storageDecision?.posture || 'unknown';
  reasonCodes.add(`storage_action_posture:${actionPosture}`);

  if (providerWorkCount <= 0 && preferredLocalAction) {
    reasonCodes.add('local_work_preferred');
    return posture('local_only_available', preferredLocalAction, reasonCodes);
  }
  if (budgetState === 'budget_hard_lock' || storageState === 'budget_hard_lock_full') {
    reasonCodes.add('budget_hard_stop');
    return posture('budget_hard_stop', 'wait_for_storage_budget_recovery', reasonCodes);
  }
  if (['block', 'block_writes'].includes(actionPosture)) {
    reasonCodes.add(storageDecision?.basis?.block_hold_reason || 'storage_setup_blocked');
    return posture('storage_setup_blocked', 'wait_for_storage_setup_recovery', reasonCodes);
  }
  if (watchOffline && watchOffline.session_armed !== true) {
    reasonCodes.add('watch_session_arm_required');
    if (externalIoPosture === 'held_by_external_io') {
      reasonCodes.add('held_by_external_io');
    }
    return posture('watch_session_arm_required', preferredLocalAction || 'arm_watch_session_before_watch_dispatch', reasonCodes);
  }
  if (externalIoPosture === 'held_by_external_io') {
    reasonCodes.add('held_by_external_io');
    return posture('held_by_external_io', preferredLocalAction || 'wait_for_external_io_reenable_then_normal_gates', reasonCodes);
  }
  if (providerGate.request_control?.cooldown_active || providerGate.request_control?.lockout_active) {
    reasonCodes.add(providerGate.request_control.lockout_active ? 'provider_lockout_wait' : 'provider_cooldown_wait');
    return posture('provider_backed_waiting_cadence', 'wait_for_provider_cadence', reasonCodes);
  }
  if (providerGate.allowed === false || providerGate.state === 'blocked') {
    for (const blocker of providerGate.blockers || []) {
      reasonCodes.add(`provider_gate:${blocker.code || 'blocked'}`);
    }
    return posture('provider_backed_held_by_live_gate', preferredLocalAction || 'wait_for_live_provider_gate', reasonCodes);
  }
  if (providerWorkCount > 0) {
    reasonCodes.add('released_to_normal_gates_only');
    return posture('provider_backed_waiting_normal_gate', preferredLocalAction || 'wait_for_explicit_execution_path', reasonCodes);
  }
  reasonCodes.add('no_current_provider_work');
  return posture('no_current_work', preferredLocalAction || 'nothing_to_dispatch', reasonCodes);
}

function posture(state, nextSafeAction, reasonCodes) {
  return {
    state,
    nextSafeAction,
    reasonCodes: [...reasonCodes]
  };
}

function safeExternalIoReadback(input, context) {
  try {
    return buildExternalIoStateConfigReadback(input.external_io || input.externalIo || {}, context);
  } catch (error) {
    return {
      state: 'off',
      provider_backed_posture: 'held_by_external_io',
      held_is_failure: false,
      on_is_authorization: false,
      reenable_catch_up_policy: {
        catch_up_flood: false,
        immediate_dispatch: false,
        missed_slots_create_request_debt: false
      },
      read_error: error.message
    };
  }
}

function safeStorageSetupReadout(input, context) {
  try {
    return buildStorageSetupGateReadout(input.storage || input.storageSetup || {}, context);
  } catch (error) {
    return {
      storage: { state: 'storage_readout_unavailable', setup_gate: 'unknown' },
      budget: { state: 'budget_readout_unavailable' },
      action_class_matrix: {
        storage_state: 'storage_readout_unavailable',
        actions: {}
      },
      read_error: error.message
    };
  }
}

function safeWatchOfflineReadout(db, input, context) {
  try {
    return buildWatchOfflineReadout(db, {
      now: context.now,
      liveApiEnabled: context.externalIoState === 'on',
      executorStatus: input.executorStatus || input.executor_status || {}
    });
  } catch (error) {
    return {
      model: 'Watch_offline',
      read_error: error.message,
      summary: {},
      watches: [],
      session_armed: false,
      collection_active: false
    };
  }
}

function safeHydrationCandidates(db, input, externalIoState) {
  try {
    return buildHydrationCandidatePreview(db, {
      ...(input.hydration || {}),
      externalIoState,
      limit: input.limit || input.previewLimit || input.preview_limit
    });
  } catch (error) {
    return {
      read_error: error.message,
      summary: {
        total_candidates: 0,
        provider_needed_candidates: 0,
        known_or_stale_local_label_candidates: 0,
        local_sde_gap_candidates: 0
      },
      lanes: [],
      candidates: []
    };
  }
}

function safeHydrationRuntime(db, input, context, externalIoState) {
  try {
    return buildHydrationAttentionRuntimePosturePreview(db, {
      ...(input.hydration || {}),
      externalIoState,
      limit: input.limit || input.previewLimit || input.preview_limit
    }, context);
  } catch (error) {
    return {
      read_error: error.message,
      runtime_posture: {
        summary: {},
        not_computable: [{ fact: 'hydration_attention_runtime', reason: error.message, guessed: false }]
      }
    };
  }
}

function safeHydrationExecution(db, input, context, externalIoState) {
  try {
    return buildHydrationExecutionPolicyPreview(db, {
      ...(input.hydration || {}),
      externalIoState,
      limit: input.limit || input.previewLimit || input.preview_limit
    }, context);
  } catch (error) {
    return {
      read_error: error.message,
      summary: {},
      gates: {
        live_provider: { state: 'unknown', reason: error.message }
      }
    };
  }
}

function safeProviderGate(action, input, context) {
  try {
    return actionGate(action, input, {
      taskRunner: context.taskRunner,
      now: context.now
    });
  } catch (error) {
    return {
      action,
      mode: 'unknown',
      allowed: false,
      state: 'readout_unavailable',
      blockers: [{ code: error.code || 'PROVIDER_GATE_READOUT_UNAVAILABLE', message: error.message }],
      warnings: [],
      estimated_api_calls: null,
      request_control: null
    };
  }
}

function providerInput(action, input) {
  if (action === 'manual.discovery') {
    return input.discoveryGateInput || input.discovery_gate_input || { scope: 'actor', maxRefs: 1 };
  }
  return {};
}

function externalIoSummary(externalIo = {}) {
  return {
    state: externalIo.state || 'off',
    state_source: externalIo.state_source || null,
    provider_backed_posture: externalIo.provider_backed_posture || 'held_by_external_io',
    held_is_failure: externalIo.held_is_failure === true,
    on_is_authorization: externalIo.on_is_authorization === true,
    reenable_catch_up_policy: externalIo.reenable_catch_up_policy || {
      catch_up_flood: false,
      immediate_dispatch: false,
      missed_slots_create_request_debt: false,
      next_step: 're_enter_normal_gates'
    }
  };
}

function storageSummary(storage = {}) {
  return {
    storage_state: storage.action_class_matrix?.storage_state || storage.storage?.state || null,
    setup_gate: storage.storage?.setup_gate || null,
    budget_state: storage.budget?.state || null,
    budget_blocks_writes: storage.budget?.blocks_writes === true,
    authority_mode: storage.storage_authority?.mode || null,
    provider_movement_allowed_if_enforced_later: storage.storage_authority?.provider_movement_allowed_if_enforced_later === true,
    action_postures: Object.fromEntries(Object.entries(storage.action_class_matrix?.actions || {}).map(([key, value]) => [
      key,
      value.posture || null
    ]))
  };
}

function compactProviderGate(gate = {}) {
  return {
    state: gate.state || null,
    mode: gate.mode || null,
    allowed: gate.allowed === true,
    allowed_is_authorization: false,
    providers: gate.providers || [],
    estimated_api_calls: gate.estimated_api_calls || null,
    blockers: (gate.blockers || []).map((entry) => entry.code || entry.message),
    warnings: (gate.warnings || []).map((entry) => entry.code || entry.message),
    request_control: gate.request_control ? {
      provider: gate.request_control.provider || null,
      action: gate.request_control.action || null,
      scope_fingerprint: gate.request_control.scope_fingerprint || null,
      cooldown_active: gate.request_control.cooldown_active === true,
      lockout_active: gate.request_control.lockout_active === true,
      next_eligible_at: gate.request_control.next_eligible_at || null,
      lockout_until: gate.request_control.lockout_until || null,
      persistence: gate.request_control.persistence || null
    } : null
  };
}

function compactWatchOffline(readout = {}) {
  return {
    model: readout.model || 'Watch_offline',
    session_armed: readout.session_armed === true,
    collection_active: readout.collection_active === true,
    summary: readout.summary || {},
    watches: (readout.watches || []).map((watch) => ({
      watch_type: watch.watch_type,
      watch_id: watch.watch_id,
      scheduler_state: watch.scheduler_state,
      blocked_reasons: watch.blocked_reasons || [],
      time_eligible: watch.time_eligible === true,
      eligible_if_armed: watch.eligible_if_armed === true,
      next_eligible_at: watch.next_eligible_at || null,
      next_safe_action: watch.next_safe_action || null,
      pending_refs_count: watch.recovery?.pending_refs_count || 0,
      expected_next_run_at: watch.recovery?.expected_next_run_at || null,
      observed_movement_at: watch.recovery?.observed_movement_at || null,
      missed_slot: watch.recovery?.missed_slot || null,
      orphaned_run: watch.recovery?.orphaned_run || null,
      provider_deferral: watch.recovery?.provider_deferral || null,
      reconstructed_scope: watch.recovery?.reconstructed_scope || null
    }))
  };
}

function summarizeLanes(lanes, discovery, watchOffline, hydrationCandidates) {
  const values = Object.values(lanes);
  return {
    lanes: values.length,
    local_only_available_work: values.reduce((sum, lane) => sum + lane.local_only_available_work, 0),
    provider_backed_work: values.reduce((sum, lane) => sum + lane.provider_backed_work, 0),
    held_by_external_io: values.filter((lane) => lane.posture === 'held_by_external_io').length,
    waiting_or_deferred: values.filter((lane) => lane.posture.includes('waiting') || lane.posture.includes('held')).length,
    storage_or_budget_blocked: values.filter((lane) => ['storage_setup_blocked', 'budget_hard_stop'].includes(lane.posture)).length,
    watch_session_arming_required: values.filter((lane) => lane.posture === 'watch_session_arm_required').length,
    pending_discovery_refs_possible_leads: discovery.pending_or_failed_refs,
    esi_expansion_candidates_from_local_refs: discovery.esi_expansion_candidates,
    hydration_candidates: hydrationCandidates.summary?.total_candidates || 0,
    watch_configured: watchOffline.summary?.configured_watches || 0,
    preview_authorizes_execution: false
  };
}

function nextSafeActions(lanes) {
  return Object.fromEntries(Object.entries(lanes).map(([key, lane]) => [
    key,
    {
      posture: lane.posture,
      next_safe_action: lane.next_safe_action,
      reason_codes: lane.reason_codes
    }
  ]));
}

function unknownsFor({ lanes, watchOffline, hydrationExecution, storage }) {
  const unknowns = [];
  for (const lane of Object.values(lanes)) {
    if (lane.storage.action_posture === 'unknown') {
      unknowns.push({ fact: `${lane.lane_id}.storage_action_posture`, reason: 'storage action class not emitted by setup gate', guessed: false });
    }
    if (lane.provider_cadence.state === 'readout_unavailable') {
      unknowns.push({ fact: `${lane.lane_id}.provider_cadence`, reason: lane.provider_cadence.blockers.join(',') || 'readout unavailable', guessed: false });
    }
  }
  if (watchOffline.read_error) {
    unknowns.push({ fact: 'watch_offline_restart_posture', reason: watchOffline.read_error, guessed: false });
  }
  if (hydrationExecution.read_error) {
    unknowns.push({ fact: 'hydration_execution_policy', reason: hydrationExecution.read_error, guessed: false });
  }
  if (storage.read_error) {
    unknowns.push({ fact: 'storage_setup_gate', reason: storage.read_error, guessed: false });
  }
  return unknowns;
}

function watchHydrationDemand(preview = {}) {
  const lane = (preview.lanes || []).find((entry) => entry.lane_id === 'watch_background');
  return lane?.provider_needed_count || 0;
}

function watchNextAction(readout = {}) {
  const actions = unique((readout.watches || []).map((watch) => watch.next_safe_action).filter(Boolean));
  if (actions.includes('drain_pending_refs')) {
    return 'drain_pending_refs';
  }
  if (actions.includes('review_orphan')) {
    return 'review_orphan';
  }
  if (actions.includes('wait')) {
    return 'wait';
  }
  if ((readout.summary?.eligible_if_armed || 0) > 0) {
    return 'arm_required';
  }
  return actions[0] || 'watch_readout_only';
}

function compactDiscoveryRef(row) {
  return {
    killmail_id: row.killmail_id,
    status: row.status,
    discovered_by_type: row.discovered_by_type,
    discovered_by_id: row.discovered_by_id,
    source_system_id: row.source_system_id || null,
    source_actor_type: row.source_actor_type || null,
    source_actor_id: row.source_actor_id || null,
    discovered_at: row.discovered_at,
    last_seen_at: row.last_seen_at || null,
    priority: row.priority,
    selected_for_expansion_at: row.selected_for_expansion_at || null,
    has_hash_for_esi_expansion: Boolean(row.killmail_hash),
    possible_lead_not_evidence: true,
    failure_count: row.failure_count || 0,
    last_error: row.last_error || null
  };
}

function boundedLimit(value, fallback, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }
  return Math.min(max, Math.floor(number));
}

function unique(values) {
  return [...new Set(values)];
}

module.exports = {
  buildQueueClockPosturePreview
};
