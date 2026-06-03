const { buildHydrationCandidatePreview } = require('./hydrationCandidatePreviewService');
const { buildQueueClockPosturePreview } = require('./queueClockPostureService');
const { buildWatchScheduleStatus } = require('../watchlist/watchScheduler');

const POLICY_VERSION = Object.freeze({
  cadence: 'derived-current-watch-cadence-v1',
  cap: 'derived-current-cap-policy-v1',
  hydrationFreshness: 'hydration-freshness-preview-v1',
  hydrationBasis: 'hydration-basis-preview-v1'
});

function buildPatientPacketIdentityPreview(db, input = {}, context = {}) {
  const now = input.now || new Date().toISOString();
  const limit = boundedLimit(input.limit || input.previewLimit || input.preview_limit, 12, 50);
  const queueClock = buildQueueClockPosturePreview(db, { ...input, now, limit }, context);
  const hydration = buildHydrationCandidatePreview(db, {
    ...(input.hydration || {}),
    now,
    limit,
    externalIoState: queueClock.gates?.external_io?.state || input.externalIoState || input.external_io_state || 'off'
  });
  const watchSchedule = safeWatchSchedule(db, now, queueClock.gates?.external_io?.state === 'on');
  const rows = [
    zkillDiscoveryIdentityRow(watchSchedule, queueClock),
    esiEvidenceExpansionIdentityRow(db, queueClock),
    hydrationIdentityRow(hydration, queueClock, 'view_local_record'),
    hydrationIdentityRow(hydration, queueClock, 'watch_background')
  ];

  return {
    action: 'runtime.patient_packet_identity.preview',
    classification: 'read-only patient packet identity conformance preview',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    dispatches: 0,
    packet_tables_created: 0,
    persisted_queue_created: false,
    active_dispatcher: false,
    zkill_discovery_executions: 0,
    esi_evidence_expansion_executions: 0,
    hydration_executions: 0,
    hydration_writes: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    watch_mutations: 0,
    assessment_memory_mutations: 0,
    marked_mutations: 0,
    storage_config_writes: 0,
    storage_movements: 0,
    support_artifacts_created: 0,
    schema_changes: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    pruning_deletion_behavior: false,
    ui_work: false,
    proof_question: 'If Atlas needed a future durable unit, what identity would each current candidate have, and can it be derived now?',
    summary: summarizeRows(rows),
    source_previews: {
      queue_clock: {
        action: queueClock.action,
        read_only: queueClock.read_only === true,
        preview_authorizes_execution: queueClock.summary?.preview_authorizes_execution === true,
        local_only_available_work: queueClock.summary?.local_only_available_work || 0,
        provider_backed_work: queueClock.summary?.provider_backed_work || 0
      },
      hydration_candidates: {
        action: hydration.action,
        read_only: hydration.read_only === true,
        total_candidates: hydration.summary?.total_candidates || 0,
        persisted_queue: hydration.persisted_queue === true
      }
    },
    identity_rows: rows,
    no_catch_up_posture: noCatchUpPosture(queueClock),
    boundary: [
      'Read-only patient packet identity preview only; it derives identity examples and does not persist packets.',
      'Acquisition and Hydration identity shapes remain separate and lane-specific.',
      'Discovery refs remain possible leads/provenance and are not Evidence/EVEidence or sequencer packets.',
      'Hydration identities are readability-candidate shaped and are not provider attempts or Evidence/EVEidence work.',
      'Every row is derived_for_now, not persisted, not executable, and not execution authority.',
      'Restart, storage unlock, and External I/O re-enable recompute posture and must not create catch-up flood or request debt.'
    ]
  };
}

function zkillDiscoveryIdentityRow(schedule, queueClock) {
  const watch = selectWatchForDiscovery(schedule);
  const lane = laneById(queueClock, 'zkill_discovery');
  if (!watch) {
    return identityRow({
      clock: 'acquisition',
      lane: 'zkill_discovery',
      candidateKind: 'zkill_discovery_movement_intent',
      identityKey: null,
      sourceBasis: ['no_current_watch_scope_available'],
      sourceAnchors: [],
      duplicatePreventionBasis: ['scope fingerprint cannot be derived without Watch or explicit scope input'],
      gatePosture: gatePostureForLane(lane),
      unknowns: [{ fact: 'watch_or_explicit_scope_identity', reason: 'no Watch rows available in local state', guessed: false }]
    });
  }

  const source = watch.source || {};
  const target = watch.watch_type === 'actor'
    ? `${source.entity_type}:${source.entity_id}`
    : `system:${source.center_system_id}:radius:${source.radius_jumps}`;
  const lookback = watch.watch_type === 'actor' ? `days:${source.lookback_days}` : `hours:${source.lookback_hours}`;
  const caps = watch.watch_type === 'actor'
    ? `max_killmails:${source.max_killmails_per_run}`
    : `max_systems:${source.max_systems_per_run}:max_killmails:${source.max_killmails_per_run}`;
  return identityRow({
    clock: 'acquisition',
    lane: 'zkill_discovery',
    candidateKind: 'zkill_discovery_movement_intent',
    identityKey: [
      'acquisition',
      'zkill_discovery',
      'watch',
      watch.watch_type,
      watch.watch_id,
      target,
      lookback,
      `cadence:${watch.poll_interval_minutes}`,
      `caps:${caps}`,
      `provider_action:${lane?.provider_action || 'manual.discovery'}`
    ].join('|'),
    sourceBasis: [
      'watch.schedule local Watch rows',
      watch.watch_type === 'actor' ? 'watchlist_entities durable Watch intent' : 'system_watches durable Watch intent',
      'Watch/scope/lookback/cadence/cap/provider-action shaped identity'
    ],
    sourceAnchors: [
      anchor('watch_type', watch.watch_type),
      anchor('watch_id', watch.watch_id),
      anchor('scope_key', watch.scope_key),
      anchor('target', target),
      anchor('lookback', lookback),
      anchor('poll_interval_minutes', watch.poll_interval_minutes),
      anchor('caps', caps),
      anchor('next_poll_at', watch.next_poll_at || null),
      anchor('blocked_reasons', watch.blocked_reasons || [])
    ],
    duplicatePreventionBasis: [
      'same Watch/scope/lookback/cadence/cap/provider-action identity can be recomputed after restart',
      'Watch schedule timestamps and provider cadence gates prevent unbounded repeat movement',
      'pending Discovery refs should be preferred before fresh zKill Discovery for the same local posture'
    ],
    gatePosture: gatePostureForLane(lane),
    unknowns: unknownsForWatchIdentity(watch)
  });
}

function esiEvidenceExpansionIdentityRow(db, queueClock) {
  const row = db.prepare(`
    SELECT killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
           source_scope, source_system_id, source_actor_type, source_actor_id,
           status, priority, selected_for_expansion_at, discovered_at, last_seen_at
    FROM discovered_killmail_refs
    WHERE status IN ('pending', 'failed')
      AND killmail_hash IS NOT NULL
      AND killmail_hash <> ''
    ORDER BY status = 'failed', priority ASC, discovered_at ASC, killmail_id ASC
    LIMIT 1
  `).get();
  const lane = laneById(queueClock, 'esi_evidence_expansion');
  if (!row) {
    return identityRow({
      clock: 'acquisition',
      lane: 'esi_evidence_expansion',
      candidateKind: 'esi_evidence_expansion_candidate',
      identityKey: null,
      sourceBasis: ['discovered_killmail_refs local Discovery ref table'],
      sourceAnchors: [],
      duplicatePreventionBasis: ['no pending/failed local Discovery ref with hash is available to derive an ESI expansion identity'],
      gatePosture: gatePostureForLane(lane),
      unknowns: [{ fact: 'discovery_ref_identity', reason: 'no selectable local Discovery ref with killmail_hash', guessed: false }]
    });
  }

  return identityRow({
    clock: 'acquisition',
    lane: 'esi_evidence_expansion',
    candidateKind: 'discovery_ref_esi_expansion_candidate',
    identityKey: [
      'acquisition',
      'esi_evidence_expansion',
      `killmail:${row.killmail_id}`,
      `hash:${row.killmail_hash}`,
      `scope:${row.discovered_by_type}:${row.discovered_by_id}`
    ].join('|'),
    sourceBasis: [
      'discovered_killmail_refs local Discovery ref row',
      'Discovery-ref shaped identity: killmail_id + killmail_hash + discovery scope/provenance',
      'ESI Evidence Expansion is the future evidence-creating step if executed later'
    ],
    sourceAnchors: [
      anchor('killmail_id', row.killmail_id),
      anchor('killmail_hash_present', Boolean(row.killmail_hash)),
      anchor('discovered_by_type', row.discovered_by_type),
      anchor('discovered_by_id', row.discovered_by_id),
      anchor('source_scope', row.source_scope || null),
      anchor('source_system_id', row.source_system_id || null),
      anchor('source_actor', row.source_actor_type && row.source_actor_id ? `${row.source_actor_type}:${row.source_actor_id}` : null),
      anchor('status', row.status),
      anchor('priority', row.priority),
      anchor('selected_for_expansion_at', row.selected_for_expansion_at || null)
    ],
    duplicatePreventionBasis: [
      'dedupe by killmail_id + killmail_hash + discovery scope/provenance',
      'skip already-cached killmails before future ESI call',
      'Discovery ref status remains staging/provenance and must not become sequencer state'
    ],
    gatePosture: gatePostureForLane(lane),
    unknowns: []
  });
}

function hydrationIdentityRow(hydration, queueClock, laneId) {
  const lane = (hydration.lanes || []).find((entry) => entry.lane_id === laneId) || null;
  const candidate = (lane?.representatives || [])[0] || (hydration.candidates || []).find((entry) => (entry.lanes || []).includes(laneId)) || null;
  const postureLane = laneById(queueClock, laneId === 'watch_background' ? 'watch_background_hydration' : 'view_local_record_hydration');
  if (!candidate) {
    return identityRow({
      clock: 'hydration_recovery',
      lane: laneId,
      candidateKind: 'hydration_readability_candidate',
      identityKey: null,
      sourceBasis: ['metadata.hydration_candidates.preview local readout'],
      sourceAnchors: [],
      duplicatePreventionBasis: [`no ${laneId} hydration candidate is available to derive identity`],
      gatePosture: gatePostureForLane(postureLane),
      unknowns: [{ fact: `${laneId}_hydration_candidate`, reason: 'no representative candidate in local preview', guessed: false }]
    });
  }

  return identityRow({
    clock: 'hydration_recovery',
    lane: laneId,
    candidateKind: candidate.candidate_kind || 'hydration_readability_candidate',
    identityKey: [
      'hydration_recovery',
      laneId,
      candidate.dedupe_key,
      `freshness_policy:${POLICY_VERSION.hydrationFreshness}`,
      `basis_policy:${POLICY_VERSION.hydrationBasis}`
    ].join('|'),
    sourceBasis: [
      'metadata.hydration_candidates.preview local candidate',
      'Hydration candidate key + lane + source anchors + freshness/basis policy',
      candidate.provider_needed ? 'provider-needed label is Hydration/readability work, not Evidence/EVEidence work' : 'candidate is local/readability posture'
    ],
    sourceAnchors: [
      anchor('dedupe_key', candidate.dedupe_key),
      anchor('candidate_kind', candidate.candidate_kind),
      anchor('entity_type', candidate.entity_type || null),
      anchor('entity_id', candidate.entity_id || null),
      anchor('lookup_type', candidate.lookup_type || null),
      anchor('lookup_id', candidate.lookup_id || null),
      anchor('label_state', candidate.label_state || null),
      anchor('provider_needed', candidate.provider_needed === true),
      anchor('source_anchors', candidate.source_anchors || []),
      anchor('source_basis', candidate.source_basis || []),
      anchor('lanes', candidate.lanes || [])
    ],
    duplicatePreventionBasis: [
      'dedupe by hydration candidate dedupe_key + lane',
      'skip known local labels unless freshness policy says stale',
      'local SDE lookup gaps stay local lookup posture, not ESI Hydration',
      laneId === 'view_local_record'
        ? 'view/local-record identity remains ahead of background lanes'
        : 'Watch/background identity remains patient and must not starve view/local-record Hydration'
    ],
    gatePosture: gatePostureForLane(postureLane),
    unknowns: unknownsForHydrationCandidate(candidate)
  });
}

function identityRow({
  clock,
  lane,
  candidateKind,
  identityKey,
  sourceBasis,
  sourceAnchors,
  duplicatePreventionBasis,
  gatePosture,
  unknowns
}) {
  return {
    clock,
    lane,
    candidate_kind: candidateKind,
    derived_identity_key: identityKey,
    proposed_future_key: identityKey,
    identity_derivable_now: Boolean(identityKey),
    source_basis: sourceBasis,
    source_anchors: sourceAnchors,
    duplicate_prevention_basis: duplicatePreventionBasis,
    gate_posture_summary: gatePosture,
    no_catch_up_posture: {
      restart_creates_request_debt: false,
      storage_unlock_creates_request_debt: false,
      external_io_reenable_creates_request_debt: false,
      immediate_dispatch_authorized: false,
      next_step: 'recompute_local_posture_then_re_enter_normal_gates'
    },
    persistence_recommendation: 'derived_for_now',
    not_persisted: true,
    not_executable: true,
    not_execution_authority: true,
    provider_calls: 0,
    writes: 0,
    unknown_or_uncomputable: unknowns || [],
    boundary_statement: 'This derived identity row is not a packet, not persisted, not executable, and not execution authority.'
  };
}

function safeWatchSchedule(db, now, liveApiEnabled) {
  try {
    return buildWatchScheduleStatus(db, {
      now,
      sessionArmed: false,
      liveApiEnabled
    });
  } catch (error) {
    return {
      read_error: error.message,
      watches: []
    };
  }
}

function selectWatchForDiscovery(schedule) {
  return (schedule.watches || []).find((watch) => watch.watch_type === 'actor') ||
    (schedule.watches || []).find((watch) => watch.watch_type === 'system_radius') ||
    null;
}

function laneById(queueClock, laneId) {
  return [
    ...(queueClock.clocks?.acquisition_clock?.lanes || []),
    ...(queueClock.clocks?.hydration_recovery_clock?.lanes || [])
  ].find((entry) => entry.lane_id === laneId) || null;
}

function gatePostureForLane(lane = {}) {
  return {
    posture: lane?.posture || 'unknown',
    next_safe_action: lane?.next_safe_action || null,
    reason_codes: lane?.reason_codes || [],
    storage_state: lane?.storage?.storage_state || null,
    budget_state: lane?.storage?.budget_state || null,
    external_io_posture: lane?.external_io?.provider_backed_posture || null,
    provider_cadence_state: lane?.provider_cadence?.state || null,
    waiting_is_failure: lane?.waiting_is_failure === true,
    held_is_failure: lane?.held_is_failure === true,
    would_allow_is_authorization: false
  };
}

function noCatchUpPosture(queueClock = {}) {
  const restart = queueClock.restart_policy || {};
  return {
    after_restart: restart.no_catch_up_flood_after_restart === true,
    after_storage_unlock: restart.no_catch_up_flood_after_storage_unlock === true,
    after_external_io_reenable: restart.no_catch_up_flood_after_external_io_reenable === true,
    missed_slots_create_request_debt: restart.missed_slots_create_request_debt === true,
    immediate_dispatch: restart.immediate_dispatch === true,
    basis: restart.next_step || 'recompute_local_posture_then_re_enter_normal_gates'
  };
}

function unknownsForWatchIdentity(watch = {}) {
  const unknowns = [];
  if (!watch.poll_interval_minutes) {
    unknowns.push({ fact: 'watch_cadence_minutes', reason: 'watch schedule did not emit poll interval', guessed: false });
  }
  if (!watch.source) {
    unknowns.push({ fact: 'watch_source_scope', reason: 'watch source was unavailable', guessed: false });
  }
  if (watch.watch_type === 'system_radius' && watch.source?.included_system_scope_status === 'malformed') {
    unknowns.push({ fact: 'included_system_ids', reason: 'stored radius scope is malformed', guessed: false });
  }
  return unknowns;
}

function unknownsForHydrationCandidate(candidate = {}) {
  const unknowns = [];
  if (!candidate.dedupe_key) {
    unknowns.push({ fact: 'hydration_dedupe_key', reason: 'candidate did not emit dedupe_key', guessed: false });
  }
  if (!candidate.source_anchors || candidate.source_anchors.length === 0) {
    unknowns.push({ fact: 'hydration_source_anchors', reason: 'candidate did not emit source anchors', guessed: false });
  }
  if (candidate.provider_needed === true && !candidate.entity_id) {
    unknowns.push({ fact: 'provider_needed_entity_id', reason: 'provider-needed label has no entity_id', guessed: false });
  }
  return unknowns;
}

function summarizeRows(rows) {
  return {
    identity_rows: rows.length,
    derivable_now: rows.filter((row) => row.identity_derivable_now).length,
    unknown_rows: rows.filter((row) => row.unknown_or_uncomputable.length > 0).length,
    clocks: [...new Set(rows.map((row) => row.clock))],
    lanes: rows.map((row) => row.lane),
    acquisition_and_hydration_separate: rows.some((row) => row.clock === 'acquisition') && rows.some((row) => row.clock === 'hydration_recovery'),
    all_derived_for_now: rows.every((row) => row.persistence_recommendation === 'derived_for_now'),
    all_not_execution_authority: rows.every((row) => row.not_execution_authority === true),
    packet_persistence_recommended: rows.some((row) => row.persistence_recommendation !== 'derived_for_now')
  };
}

function anchor(type, value) {
  return { type, value };
}

function boundedLimit(value, fallback, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }
  return Math.min(max, Math.floor(number));
}

module.exports = {
  buildPatientPacketIdentityPreview
};
