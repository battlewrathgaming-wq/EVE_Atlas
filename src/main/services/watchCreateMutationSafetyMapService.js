const ACTION = 'watch.create_mutation_safety_map.preview';

const CURRENT_WATCH_CREATE_PATH = Object.freeze([
  'serviceRegistry watch.create',
  'mutatingActionService.runWatchCreateService',
  'normalizeSystemRadiusWatchScope',
  'watchlistRepository.addSystemRadiusWatch',
  'TopologyService.getSystemsWithinRadius'
]);

const CURRENT_SYSTEM_RADIUS_INPUTS = Object.freeze([
  'centerSystemId / center_system_id',
  'radiusJumps / radius_jumps',
  'lookbackSeconds / lookback_seconds',
  'maxSystems / max_systems_per_run',
  'maxRefsPerSystem / max_refs_per_system',
  'maxExpansions / max_killmails_per_run',
  'maxRadius',
  'maxTopologySystems',
  'pollIntervalMinutes / poll_interval_minutes',
  'isActive / is_active',
  'notes'
]);

const CURRENT_SYSTEM_RADIUS_STORED_FIELDS = Object.freeze([
  'system_watches.center_system_id',
  'system_watches.center_system_name',
  'system_watches.radius_jumps',
  'system_watches.included_system_ids',
  'system_watches.excluded_system_ids',
  'system_watches.lookback_hours',
  'system_watches.max_systems_per_run',
  'system_watches.max_killmails_per_run',
  'system_watches.is_active',
  'system_watches.poll_interval_minutes',
  'system_watches.notes'
]);

const FUTURE_MUTATION_CONTRACT_INPUTS = Object.freeze([
  'accepted_preflight_action',
  'accepted_preflight_status',
  'center_system_id',
  'center_system_name',
  'radius_jumps',
  'included_system_ids',
  'included_system_ids_source',
  'operator_confirmation_token',
  'lookback_hours',
  'max_systems_per_run',
  'max_killmails_per_run',
  'poll_interval_minutes',
  'is_active',
  'notes'
]);

const FUTURE_ALLOWED_WRITE_FIELDS = Object.freeze([
  'system_watches.center_system_id',
  'system_watches.center_system_name',
  'system_watches.radius_jumps',
  'system_watches.included_system_ids',
  'system_watches.excluded_system_ids',
  'system_watches.lookback_hours',
  'system_watches.max_systems_per_run',
  'system_watches.max_killmails_per_run',
  'system_watches.is_active',
  'system_watches.poll_interval_minutes',
  'system_watches.notes'
]);

const MUST_NOT_TOUCH = Object.freeze({
  tables: [
    'killmails',
    'activity_events',
    'discovered_killmail_refs',
    'fetch_runs',
    'api_request_logs',
    'metadata_runs',
    'ingestion_audits',
    'data_quality_warnings',
    'entities',
    'assessment_artifacts',
    'runtime snapshots / support artifacts'
  ],
  behavior: [
    'provider calls',
    'Watch dispatch',
    'task creation',
    'Discovery ref mutation',
    'Evidence/EVEidence writes',
    'Hydration writes',
    'schema changes',
    'topology traversal changes',
    'renderer/UI changes',
    'runtime enforcement activation',
    'durable watch_result semantics',
    'relationship tags',
    'fourth lane / fast lane'
  ]
});

const TERM_ASSURANCE = Object.freeze([
  term('Watch', 'preserve', 'Atlas active routine check configuration or behavior; not generic attention.'),
  term('watch.create', 'caution', 'Current mutation command writes local Watch intent metadata but does not dispatch collection.'),
  term('system/radius', 'preserve', 'Atlas Watch scope pattern using a selected center system and radius provenance.'),
  term('radius', 'caution', 'Radius scope includes the center; do not call included count neighbor count.'),
  term('included systems', 'preserve', 'Accepted full scope IDs; future stored-scope authority after creation.'),
  term('direct neighbors', 'preserve', 'Immediate adjacent systems excluding center; diagnostic/detail only.'),
  term('stargate / topology source data', 'caution', 'Runtime lookup tables are local topology authority; SDE source material is import/source provenance.'),
  term('Discovery', 'preserve', 'Possible leads before ESI expansion; not Evidence/EVEidence.'),
  term('Evidence/EVEidence', 'preserve', 'Expanded ESI killmail data and Atlas-owned derived activity events.'),
  term('Hydration', 'preserve', 'Readability repair/label refresh, not Evidence creation.'),
  term('Observation', 'preserve', 'Rendered pattern/report-layer meaning derived from stored Atlas evidence.'),
  term('Assessment', 'preserve', 'Deliberate operator judgment/Assessment Memory, not automatic proof.')
]);

function buildWatchCreateMutationSafetyMap(db, input = {}) {
  const before = stateSnapshot(db);
  const now = input.now || new Date().toISOString();
  return finish(db, {
    action: ACTION,
    classification: 'read-only Watch create mutation safety map',
    generated_at: now,
    read_only: true,
    mutates_state: false,
    renderer_eligible: true,
    current_watch_create_consumes_preflight_included_ids: false,
    future_mutation_contract_required: true,
    future_payload_directly_executable_now: false,
    expected_future_mutation_target: 'watch.create',
    current_packet_allows_watch_row_write: false,
    current_watch_create_path: CURRENT_WATCH_CREATE_PATH,
    current_system_radius_mutation_inputs: CURRENT_SYSTEM_RADIUS_INPUTS,
    current_system_radius_stored_fields: CURRENT_SYSTEM_RADIUS_STORED_FIELDS,
    current_recomputation_point: {
      path: 'watchlistRepository.addSystemRadiusWatch -> TopologyService.getSystemsWithinRadius',
      input_basis: 'center_system_id + radius_jumps + maxRadius/maxTopologySystems',
      consumes_accepted_preflight_included_ids: false,
      posture: 'current_gap_for_future_contract'
    },
    future_required_mutation_contract_inputs: FUTURE_MUTATION_CONTRACT_INPUTS,
    future_allowed_write_surface: {
      table: 'system_watches',
      fields: FUTURE_ALLOWED_WRITE_FIELDS,
      write_authority_basis: 'accepted_preflight_included_system_ids',
      confirmation_required: true,
      confirmation_token: 'confirm:watch.create'
    },
    future_forbidden_write_surface: MUST_NOT_TOUCH,
    accepted_scope_authority: {
      center_radius_role: 'provenance_and_explanation_only',
      included_system_ids_role: 'future_stored_scope_authority',
      direct_neighbor_count_role: 'diagnostic_detail_only',
      rejected_if_missing_or_empty: true,
      rejected_if_mismatched_or_forged: true
    },
    unsafe_or_mismatched_id_rejection_posture: {
      accepted_ids_source: 'HS304 preflight included_system_ids_for_acceptance',
      reject_if_claimed_ids_replace_preflight_ids: true,
      reject_if_current_watch_create_would_recompute_different_scope: true,
      reject_if_capped_scope: true,
      reject_if_unknown_system_or_missing_topology: true,
      expected_reason_codes: [
        'accepted_included_system_ids_required',
        'included_system_ids_claim_mismatch',
        'current_watch_create_contract_gap',
        'preflight_not_acceptable_for_watch_authoring'
      ]
    },
    readiness: {
      ready_for_mutation_behavior_change_now: false,
      ready_for_next_implementation_seam: true,
      next_implementation_seam: 'actual watch.create mutation contract consuming accepted preflight included_system_ids as stored-scope authority'
    },
    term_drift_assurance: {
      status: 'focused_assurance_warning_only',
      renames_performed: false,
      protected_word_json_updated: false,
      terms: TERM_ASSURANCE,
      flagged_terms: TERM_ASSURANCE.filter((entry) => entry.status === 'caution').map((entry) => entry.term),
      notes: [
        'Watch remains active routine check configuration/behavior, not generic attention.',
        'Discovery remains possible leads, not Evidence/EVEidence.',
        'Hydration remains readability repair, not Evidence creation.',
        'Radius included system count must not be described as direct-neighbor count.',
        'Stargate/topology wording should preserve local runtime lookup authority versus SDE source provenance.'
      ]
    },
    would_write_watch_row: false,
    watch_rows_written: 0,
    watch_dispatches: 0,
    provider_calls: 0,
    live_api_calls: 0,
    tasks_created: 0,
    discovery_refs_mutated: 0,
    discovery_ref_mutations: 0,
    evidence_rows_written: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    metadata_writes: 0,
    schema_changes: 0,
    support_artifacts_created: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    boundary: [
      'Read-only mutation safety map only; it does not call watch.create.',
      'It does not write Watch rows or change mutation behavior.',
      'It maps the future accepted-ID mutation contract seam without opening provider movement, schema, UI, support artifacts, or result semantics.'
    ]
  }, before);
}

function term(termName, status, note) {
  return { term: termName, status, note };
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
  buildWatchCreateMutationSafetyMap
};
