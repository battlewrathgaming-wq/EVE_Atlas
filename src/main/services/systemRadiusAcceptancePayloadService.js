const { buildSystemRadiusAuthoringPreflight } = require('./systemRadiusAuthoringPreflightService');

const ACTION = 'watch.system_radius_acceptance_payload.preview';
const SOURCE_ACTION = 'watch.system_radius_authoring_preflight.preview';
const TARGET_COMMAND = 'watch.create';
const CURRENT_WATCH_CREATE_PATH = [
  'serviceRegistry watch.create',
  'mutatingActionService.runWatchCreateService',
  'normalizeSystemRadiusWatchScope',
  'watchlistRepository.addSystemRadiusWatch',
  'TopologyService.getSystemsWithinRadius'
];

function buildSystemRadiusAcceptancePayloadPreview(db, input = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  const preflightInput = input.preflightInput || input.preflight_input || input;
  const preflight = input.preflight || buildSystemRadiusAuthoringPreflight(db, preflightInput);
  const optionalSettings = normalizeOptionalSettings(input.operatorSettings || input.operator_settings || input);
  const forgeCheck = detectForgedIncludedIds(input, preflight);
  const issues = [
    ...preflightIssues(preflight),
    ...forgeCheck.issues
  ];
  const acceptedIds = Array.isArray(preflight.included_system_ids_for_acceptance)
    ? preflight.included_system_ids_for_acceptance.map(Number)
    : [];
  const acceptablePreflight = preflight.acceptable_for_watch_authoring === true
    && preflight.status === 'acceptable'
    && acceptedIds.length > 0;
  const payloadReady = acceptablePreflight && issues.length === 0;
  const center = preflight.selected_center_system || null;
  const radiusJumps = preflight.requested_scope?.radius_jumps ?? null;
  const futurePayload = payloadReady
    ? {
        type: 'system_radius',
        contract_role: 'candidate_future_mutation_contract',
        directly_executable_by_current_watch_create: false,
        targetType: 'system',
        targetId: center?.solar_system_id ?? null,
        targetName: center?.solar_system_name ?? null,
        center_system_id: center?.solar_system_id ?? null,
        center_system_name: center?.solar_system_name ?? null,
        radius_jumps: radiusJumps,
        included_system_ids: acceptedIds,
        excluded_system_ids: [],
        stored_scope_authority: {
          included_system_ids: acceptedIds,
          source: 'accepted_preflight_included_system_ids',
          current_watch_create_consumes_this_field: false,
          future_mutation_contract_required: true
        },
        provenance: {
          center_system_id: center?.solar_system_id ?? null,
          center_system_name: center?.solar_system_name ?? null,
          radius_jumps: radiusJumps,
          source_preflight_action: SOURCE_ACTION
        },
        settings: optionalSettings
      }
    : null;

  return finish(db, {
    action: ACTION,
    classification: 'read-only system/radius Watch acceptance payload preview',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    source_preflight_action: SOURCE_ACTION,
    source_preflight_status: preflight.status || 'unknown',
    acceptable_for_watch_authoring: preflight.acceptable_for_watch_authoring === true,
    payload_ready_for_future_watch_create: payloadReady,
    payload_ready_for_future_mutation_contract: payloadReady,
    future_target_command: TARGET_COMMAND,
    current_watch_create_compatibility: 'requires_future_mutation_contract',
    current_watch_create_consumes_preflight_included_ids: false,
    future_mutation_contract_required: true,
    future_payload_directly_executable_now: false,
    current_watch_create_path: CURRENT_WATCH_CREATE_PATH,
    current_watch_create_gap: {
      status: 'gap_disclosed',
      current_behavior: 'current watch.create normalizes center/radius and addSystemRadiusWatch recomputes included systems from local topology',
      missing_contract: 'watch.create does not yet consume accepted preflight included_system_ids as stored-scope authority',
      consequence: 'preview payload is a candidate future mutation contract, not a direct current watch.create payload'
    },
    future_write_authority: payloadReady
      ? 'operator_confirmation_required_for_watch_create'
      : 'not_ready_no_future_write_authority',
    future_write_authority_basis: payloadReady
      ? 'accepted_preflight_included_system_ids'
      : 'preflight_or_payload_not_acceptable',
    selected_center_system: center,
    radius_jumps: radiusJumps,
    included_system_ids: payloadReady ? acceptedIds : [],
    accepted_included_system_ids_source: 'preflight.included_system_ids_for_acceptance',
    center_radius_role: 'provenance_and_explanation_only',
    stored_scope_authority_role: 'included_system_ids_are_future_execution_authority_after_watch_create',
    optional_operator_settings: optionalSettings,
    confirmation_posture: {
      future_confirmation_required: true,
      future_confirmation_token: 'confirm:watch.create',
      confirmation_persisted: false,
      operator_real_watch_write_performed: false
    },
    candidate_future_watch_create_payload: futurePayload,
    future_watch_create_payload: futurePayload,
    rejected_payload_claims: forgeCheck.rejected_claims,
    would_write_watch_row: false,
    watch_rows_written: 0,
    watch_dispatches: 0,
    provider_calls: 0,
    live_api_calls: 0,
    tasks_created: 0,
    discovery_ref_mutations: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    metadata_writes: 0,
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    status: payloadReady ? 'ready_for_future_mutation_contract_payload' : rejectionStatus(preflight, issues),
    issues,
    boundary: [
      'Read-only acceptance payload preview only; it does not call watch.create.',
      'The payload is not directly executable by current watch.create because current authoring recomputes included systems from center/radius.',
      'A future watch.create mutation contract is required before accepted preflight IDs can become stored scope authority at creation time.',
      'Future Watch execution authority comes only from accepted preflight included_system_ids.',
      'Center and radius remain provenance/explanation after acceptance.',
      'Capped, invalid, missing, unknown, empty, or forged payload claims are not acceptable.'
    ]
  }, before);
}

function preflightIssues(preflight) {
  const issues = [];
  if (preflight.status !== 'acceptable') {
    issues.push(`preflight_status_${preflight.status || 'unknown'}`);
  }
  if (preflight.acceptable_for_watch_authoring !== true) {
    issues.push('preflight_not_acceptable_for_watch_authoring');
  }
  if (!Array.isArray(preflight.included_system_ids_for_acceptance) || preflight.included_system_ids_for_acceptance.length === 0) {
    issues.push('missing_accepted_included_system_ids');
  }
  return issues;
}

function detectForgedIncludedIds(input, preflight) {
  const acceptedIds = Array.isArray(preflight.included_system_ids_for_acceptance)
    ? preflight.included_system_ids_for_acceptance.map(Number)
    : [];
  const claimed = firstArray(
    input.includedSystemIds,
    input.included_system_ids,
    input.acceptancePayload?.included_system_ids,
    input.acceptance_payload?.included_system_ids,
    input.futureWatchCreatePayload?.included_system_ids,
    input.future_watch_create_payload?.included_system_ids
  );
  if (!claimed) {
    return { issues: [], rejected_claims: [] };
  }
  const claimedIds = claimed.map(Number);
  if (stableJson(claimedIds) === stableJson(acceptedIds)) {
    return { issues: [], rejected_claims: [] };
  }
  return {
    issues: ['included_system_ids_claim_mismatch'],
    rejected_claims: [{
      field: 'included_system_ids',
      claimed: claimedIds,
      accepted_preflight_value: acceptedIds,
      reason: 'future payload may not replace preflight accepted included_system_ids'
    }]
  };
}

function normalizeOptionalSettings(input) {
  return {
    lookback_hours: optionalNumber(input.lookbackHours ?? input.lookback_hours),
    max_systems: optionalNumber(input.maxSystems ?? input.max_systems),
    max_refs: optionalNumber(input.maxRefs ?? input.max_refs),
    max_killmails: optionalNumber(input.maxKillmails ?? input.max_killmails),
    poll_interval_minutes: optionalNumber(input.pollIntervalMinutes ?? input.poll_interval_minutes),
    active: typeof input.active === 'boolean' ? input.active : null,
    notes: typeof input.notes === 'string' ? input.notes : null
  };
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rejectionStatus(preflight, issues) {
  if (issues.includes('included_system_ids_claim_mismatch')) {
    return 'payload_claim_rejected';
  }
  if (preflight.status === 'capped_scope_not_acceptable_without_adjustment') {
    return 'preflight_capped_not_acceptable';
  }
  if (preflight.status === 'unknown_system') {
    return 'preflight_unknown_system';
  }
  if (preflight.status === 'missing_topology') {
    return 'preflight_missing_topology';
  }
  if (preflight.status === 'invalid_radius') {
    return 'preflight_invalid_radius';
  }
  return 'not_ready_for_future_watch_create_payload';
}

function firstArray(...values) {
  return values.find((value) => Array.isArray(value));
}

function finish(db, result, before) {
  const after = stateSnapshot(db);
  return {
    ...result,
    table_mutation_proof: {
      before,
      after,
      unchanged: stableJson(before) === stableJson(after)
    }
  };
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
  buildSystemRadiusAcceptancePayloadPreview
};
