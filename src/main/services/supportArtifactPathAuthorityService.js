const path = require('node:path');
const { buildStorageAuthorityPreflight } = require('./storageAuthorityPreflightService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');
const { projectRoot } = require('../util/tempPaths');

const FORBIDDEN_RENDERER_PATH_KEYS = Object.freeze([
  'path',
  'paths',
  'outputDir',
  'output_dir',
  'destinationPath',
  'destination_path',
  'snapshotDestination',
  'snapshot_destination',
  'snapshotDestinationDir',
  'snapshot_destination_dir',
  'tracePackOutputDir',
  'trace_pack_output_dir',
  'cacheDir',
  'cache_dir',
  'sdeCacheDir',
  'sde_cache_dir',
  'storageRoot',
  'storage_root',
  'databasePath',
  'database_path',
  'settingsPath',
  'runtimeSnapshotSettingsPath',
  'windowSettingsPath'
]);

function buildSupportArtifactPathAuthorityPreview(input = {}, context = {}) {
  const root = path.resolve(projectRoot());
  const rendererPayloadIgnored = context.source === 'renderer' && rendererPayloadHasPathClaims(input);
  const trustedInput = context.source === 'renderer' ? {} : input;
  const preflight = context.storagePreflight || buildStorageAuthorityPreflight(trustedInput, {
    ...context,
    allowStorageAuthorityPathOverrides: context.allowStorageAuthorityPathOverrides === true && context.source !== 'renderer'
  });
  const setupGate = context.storageSetupGate || buildStorageSetupGateReadout({
    storagePreflight: preflight,
    storageAuthority: trustedInput.storageAuthority,
    storageBudgetBytes: trustedInput.storageBudgetBytes
  }, {
    ...context,
    allowStorageSetupGateFixtureInput: context.allowStorageSetupGateFixtureInput === true && context.source !== 'renderer',
    storagePreflight: preflight
  });
  const classes = buildArtifactClasses({ root, preflight, setupGate });

  return {
    action: 'support.artifact_path_authority.preview',
    classification: 'read-only support artifact path authority inventory',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    creates_files: false,
    creates_directories: false,
    deletes_files: false,
    moves_or_copies_storage: false,
    provider_calls: 0,
    storage_config_written: false,
    enforcement_active: false,
    external_io_enforced: false,
    renderer_payload_ignored: rendererPayloadIgnored,
    project_root: root,
    storage_authority: summarizeStorageAuthority(setupGate),
    summary: summarizeClasses(classes),
    classes,
    boundary: [
      'Read-only support artifact inventory only; it does not create snapshots, trace packs, logs, cache, directories, or files.',
      'It does not move, copy, restore, delete, prune, package, upload, or migrate storage.',
      'It does not call zKill, ESI, SDE download endpoints, or any other provider.',
      'It does not write storage config, persist acknowledgement, enforce lockout, change schema, or redesign renderer UI.',
      'Support artifacts are support/readout material, not Evidence/EVEidence, Discovery refs, Observation, or Assessment Memory.'
    ]
  };
}

function buildArtifactClasses({ root, preflight = {}, setupGate = {} }) {
  const snapshotDestination = preflight.snapshot?.destination || {};
  const snapshotSettings = preflight.snapshot?.settings || {};
  const tracePackOutput = preflight.trace_pack?.output || {};
  const paths = preflight.paths || {};
  const storageState = setupGate.action_class_matrix?.storage_state || setupGate.storage?.state || 'unknown';

  return [
    artifactClass({
      id: 'runtime_snapshot_rolling',
      name: 'Runtime DB snapshot - rolling/recovery copy',
      family: 'corpus_adjacent_support',
      path_basis: snapshotDestination.source === 'configured'
        ? 'configured snapshot destination from runtime snapshot settings'
        : 'fallback snapshot destination under Atlas temp/support path',
      current_or_candidate_path: snapshotDestination.path || null,
      source_path_key: 'storage.authority_preflight.snapshot.destination.path',
      allowed_before_storage_setup: fixtureOrFallbackOnly(storageState),
      requires_storage_authority: true,
      counts_against_storage_budget: true,
      storage_budget_basis: 'snapshot/support-artifact bytes are part of Atlas-controlled corpus-adjacent storage',
      provider_posture: 'local_only',
      external_io_relevance: 'none; snapshot creation must not initiate provider contact',
      renderer_safety: 'renderer may request preflight, but destination authority is backend/settings derived and renderer path claims are ignored',
      trusted_context_requirement: 'trusted backend/settings path required for actual creation',
      cleanup_stage: 'recovery_cleanup',
      privacy_sensitivity: 'high; database copy can contain local Evidence/EVEidence, Discovery refs, labels, assessments, and local paths',
      snapshot_posture: 'rolling_or_overwritten_recovery_copy',
      read_only_non_mutating: true,
      status: pathStatus(snapshotDestination),
      notes: 'Preview only; runtime.db_snapshot.create remains the explicit support artifact write command.'
    }),
    artifactClass({
      id: 'runtime_snapshot_retained',
      name: 'Runtime DB snapshot - retained/manual copy',
      family: 'corpus_adjacent_support',
      path_basis: snapshotDestination.source === 'configured'
        ? 'configured retained snapshot destination'
        : 'candidate destination requires storage authority before real corpus use',
      current_or_candidate_path: snapshotDestination.path || null,
      source_path_key: 'storage.authority_preflight.snapshot.destination.path',
      allowed_before_storage_setup: false,
      requires_storage_authority: true,
      counts_against_storage_budget: true,
      storage_budget_basis: 'retained snapshots are recovery/support copies of corpus state',
      provider_posture: 'local_only',
      external_io_relevance: 'none',
      renderer_safety: 'not renderer-authoritative for paths; actual retained writes need backend validation and confirmation',
      trusted_context_requirement: 'trusted backend/settings path required for actual creation',
      cleanup_stage: 'recovery_cleanup',
      privacy_sensitivity: 'high; retained copies may outlive ordinary cleanup and must disclose path',
      snapshot_posture: 'retained_recovery_copy',
      read_only_non_mutating: true,
      status: pathStatus(snapshotDestination),
      notes: `Snapshot settings status: ${snapshotSettings.status || 'unknown'}.`
    }),
    artifactClass({
      id: 'operator_debug_trace_pack',
      name: 'Operator debug trace pack',
      family: 'corpus_adjacent_support',
      path_basis: tracePackOutput.source === 'configured_request'
        ? 'trusted configured/requested output path'
        : 'default operator debug trace-pack output under Atlas temp/support path',
      current_or_candidate_path: tracePackOutput.path || null,
      source_path_key: 'storage.authority_preflight.trace_pack.output.path',
      allowed_before_storage_setup: false,
      requires_storage_authority: true,
      counts_against_storage_budget: true,
      storage_budget_basis: 'trace packs expose support/debug summaries derived from real Atlas activity',
      provider_posture: 'local_only',
      external_io_relevance: 'none; trace packs must summarize already-local state and must not call providers',
      renderer_safety: 'renderer can request readout, but cannot forge output path authority in this preview',
      trusted_context_requirement: 'trusted backend destination required for actual support artifact write',
      cleanup_stage: 'recovery_cleanup',
      privacy_sensitivity: 'high; can reveal local intelligence, local paths, queue posture, run diagnostics, and warnings',
      snapshot_posture: 'not_applicable',
      read_only_non_mutating: true,
      status: pathStatus(tracePackOutput),
      notes: 'support.debug_trace_pack is a write command; this preview does not package or write trace packs.'
    }),
    artifactClass({
      id: 'light_operational_logs',
      name: 'Light operational logs',
      family: 'operational_support',
      path_basis: 'bounded app/runtime logging, if present; current service surface does not expose a dedicated log directory',
      current_or_candidate_path: null,
      source_path_key: 'not_exposed_by_current_helpers',
      allowed_before_storage_setup: true,
      requires_storage_authority: false,
      counts_against_storage_budget: false,
      storage_budget_basis: 'basic app-running noise is expected operational support unless written under selected Atlas storage',
      provider_posture: 'local_only',
      external_io_relevance: 'none unless a future log explicitly records provider-derived support exports',
      renderer_safety: 'readout only; renderer receives no arbitrary filesystem probe',
      trusted_context_requirement: 'trusted logging backend required for any future file writes',
      cleanup_stage: 'ordinary_cleanup',
      privacy_sensitivity: 'medium; may contain errors, local paths, and runtime state but should avoid secrets/raw payloads',
      snapshot_posture: 'not_applicable',
      read_only_non_mutating: true,
      status: { source: 'not_exposed', exists: false, usage_bytes: 0 }
    }),
    artifactClass({
      id: 'readiness_preflight_reports',
      canonical_artifact_class: 'readiness_preflight_export',
      aliases: ['readiness_preflight_reports'],
      alias_role: 'path_authority_alias_for_current_in_memory_readout',
      alias_disclosure: 'readiness_preflight_export is the canonical contents/creation class id; readiness_preflight_reports names the current path-authority in-memory/readout surface and does not create an export writer.',
      name: 'Readiness and preflight reports',
      family: 'operational_support',
      path_basis: 'in-memory service/report output unless an explicit future export is added',
      current_or_candidate_path: null,
      source_path_key: 'service readouts',
      allowed_before_storage_setup: true,
      requires_storage_authority: false,
      counts_against_storage_budget: false,
      storage_budget_basis: 'read-only report output has no disk budget impact unless exported later',
      provider_posture: 'local_only',
      external_io_relevance: 'none',
      renderer_safety: 'renderer-safe readout when generated from backend-known state',
      trusted_context_requirement: 'none for readout; future exports need trusted destination authority',
      cleanup_stage: 'ordinary_cleanup',
      privacy_sensitivity: 'medium; can disclose local path/state posture',
      snapshot_posture: 'not_applicable',
      read_only_non_mutating: true,
      status: { source: 'in_memory', exists: false, usage_bytes: 0 }
    }),
    artifactClass({
      id: 'runtime_temp_cache',
      name: 'Runtime temp/cache - operational',
      family: 'operational_support',
      path_basis: 'AURA_ATLAS_TEST_TMP or project .tmp; AURA_ATLAS_CACHE_DIR or .tmp/cache',
      current_or_candidate_path: paths.cache_dir?.path || null,
      source_path_key: 'storage.authority_preflight.paths.cache_dir.path',
      allowed_before_storage_setup: true,
      requires_storage_authority: false,
      counts_against_storage_budget: false,
      storage_budget_basis: 'light operational cache is disclosed separately unless placed under selected storage',
      provider_posture: 'local_only',
      external_io_relevance: 'none for local operational cache',
      renderer_safety: 'readout only from backend-known cache path',
      trusted_context_requirement: 'trusted backend path required for writes/cleanup',
      cleanup_stage: 'ordinary_cleanup',
      privacy_sensitivity: 'medium; may reveal local paths and transient runtime state',
      snapshot_posture: 'not_applicable',
      cache_origin: 'operational_runtime',
      read_only_non_mutating: true,
      status: controlledPathStatus(paths.cache_dir)
    }),
    artifactClass({
      id: 'provider_activity_cache',
      name: 'Provider/activity-derived cache or support material',
      family: 'corpus_adjacent_support',
      path_basis: 'future provider-derived cache/support output should live under storage authority, not ad hoc temp',
      current_or_candidate_path: null,
      source_path_key: 'future_policy_class',
      allowed_before_storage_setup: false,
      requires_storage_authority: true,
      counts_against_storage_budget: true,
      storage_budget_basis: 'anything generated by real scanning, Discovery, Evidence/EVEidence, Hydration, or Assessment-linked activity is corpus-adjacent',
      provider_posture: 'provider_capable_when_future_artifact_creation_is_authorized',
      external_io_relevance: 'provider-derived content requires External I/O for acquisition, but support artifact creation itself must not call providers',
      renderer_safety: 'not renderer-authoritative for paths or provider movement',
      trusted_context_requirement: 'trusted backend and future accepted runway required',
      cleanup_stage: 'recovery_cleanup',
      privacy_sensitivity: 'high; may contain provider-derived local intelligence or derived labels',
      snapshot_posture: 'not_applicable',
      cache_origin: 'provider_activity_derived',
      read_only_non_mutating: true,
      status: { source: 'future_policy_class', exists: false, usage_bytes: 0 }
    }),
    artifactClass({
      id: 'sde_source_import_material',
      name: 'SDE source/import material',
      family: 'operational_support',
      path_basis: 'AURA_ATLAS_SDE_CACHE_DIR or project .tmp/sde for source/work material',
      current_or_candidate_path: paths.sde_cache_dir?.path || null,
      source_path_key: 'storage.authority_preflight.paths.sde_cache_dir.path',
      allowed_before_storage_setup: true,
      requires_storage_authority: false,
      counts_against_storage_budget: 'disclose_separately',
      storage_budget_basis: 'heavy optional import material is disclosed separately; if kept under selected storage, count it',
      provider_posture: 'provider_capable_when_no_local_source_is_supplied',
      external_io_relevance: 'SDE download is External I/O; local source import is not',
      renderer_safety: 'not renderer-eligible for build/import; preview exposes backend-known cache posture only',
      trusted_context_requirement: 'trusted backend command and confirmation required for downloads/import writes',
      cleanup_stage: 'recovery_cleanup',
      privacy_sensitivity: 'low_to_medium; mostly public SDE data plus local paths/build metadata',
      snapshot_posture: 'not_applicable',
      cache_origin: 'sde_source_import',
      read_only_non_mutating: true,
      status: controlledPathStatus(paths.sde_cache_dir)
    }),
    artifactClass({
      id: 'sde_derived_lookup_material',
      name: 'SDE derived lookup material',
      family: 'operational_support',
      path_basis: 'derived local lookup rows in Atlas DB tables such as regions, solar_systems, system_adjacency, and type_metadata',
      current_or_candidate_path: preflight.database?.path || null,
      source_path_key: 'storage.authority_preflight.database.path',
      allowed_before_storage_setup: storageState !== 'no_storage_selected',
      requires_storage_authority: true,
      counts_against_storage_budget: true,
      storage_budget_basis: 'derived lookup rows consume the Atlas DB/storage budget once imported',
      provider_posture: 'local_only_after_import',
      external_io_relevance: 'none after import; initial source may be local or provider-backed SDE download',
      renderer_safety: 'readout only; renderer cannot write lookup rows through this preview',
      trusted_context_requirement: 'trusted backend import command required for writes',
      cleanup_stage: 'recovery_cleanup',
      privacy_sensitivity: 'low; public lookup metadata, with local DB path disclosure',
      snapshot_posture: 'not_applicable',
      cache_origin: 'sde_derived_db_lookup',
      read_only_non_mutating: true,
      status: databasePathStatus(preflight.database)
    }),
    artifactClass({
      id: 'fixture_config_write_proofs',
      name: 'Storage config/write-proof fixture artifacts',
      family: 'operational_support',
      path_basis: 'trusted fixture/test root only; never operator-real config path from renderer',
      current_or_candidate_path: path.join(root, '.tmp', 'fixture-only-storage-authority-proofs'),
      source_path_key: 'fixture_only_candidate',
      allowed_before_storage_setup: true,
      requires_storage_authority: false,
      counts_against_storage_budget: false,
      storage_budget_basis: 'fixture-only proof material is not operator corpus storage',
      provider_posture: 'local_only',
      external_io_relevance: 'none',
      renderer_safety: 'not renderer eligible for fixture write commands; renderer path claims are ignored',
      trusted_context_requirement: 'trusted fixture context only',
      cleanup_stage: 'fixture_only',
      privacy_sensitivity: 'low_to_medium; fixture payloads should not contain operator-real storage authority',
      snapshot_posture: 'not_applicable',
      read_only_non_mutating: true,
      status: { source: 'fixture_candidate_not_inspected', exists: false, usage_bytes: 0 }
    })
  ];
}

function artifactClass(entry) {
  return {
    ...entry,
    local_or_provider_capable: entry.provider_posture,
    read_only: true,
    mutates_state: false,
    creates_files: false,
    creates_directories: false
  };
}

function summarizeStorageAuthority(setupGate = {}) {
  return {
    storage_state: setupGate.storage?.state || null,
    action_matrix_state: setupGate.action_class_matrix?.storage_state || null,
    budget_state: setupGate.budget?.state || null,
    storage_authority_mode: setupGate.storage_authority?.mode || null,
    selected: setupGate.storage_authority?.selected === true,
    fallback_acknowledged: setupGate.storage_authority?.fallback_acknowledged === true,
    enforcement_state: setupGate.enforcement_state || 'not_implemented_readout_only'
  };
}

function summarizeClasses(classes) {
  const byFamily = countBy(classes, 'family');
  const byCleanupStage = countBy(classes, 'cleanup_stage');
  return {
    total_classes: classes.length,
    by_family: byFamily,
    by_cleanup_stage: byCleanupStage,
    pre_storage_allowed: classes.filter((entry) => entry.allowed_before_storage_setup === true).map((entry) => entry.id),
    storage_authority_required: classes.filter((entry) => entry.requires_storage_authority === true).map((entry) => entry.id),
    storage_budget_included: classes.filter((entry) => entry.counts_against_storage_budget === true).map((entry) => entry.id),
    provider_capable: classes.filter((entry) => String(entry.provider_posture).includes('provider_capable')).map((entry) => entry.id),
    cache_origins: classes
      .filter((entry) => entry.cache_origin)
      .map((entry) => ({
        id: entry.id,
        cache_origin: entry.cache_origin,
        family: entry.family,
        counts_against_storage_budget: entry.counts_against_storage_budget
      })),
    snapshot_postures: classes
      .filter((entry) => entry.snapshot_posture && entry.snapshot_posture !== 'not_applicable')
      .map((entry) => ({
        id: entry.id,
        snapshot_posture: entry.snapshot_posture,
        cleanup_stage: entry.cleanup_stage,
        counts_against_storage_budget: entry.counts_against_storage_budget
      }))
  };
}

function countBy(entries, key) {
  return entries.reduce((counts, entry) => {
    const value = entry[key] || 'unknown';
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function fixtureOrFallbackOnly(storageState) {
  return storageState === 'demo_fixture_mode';
}

function controlledPathStatus(entry = {}) {
  return {
    source: 'backend_known_controlled_path',
    exists: entry.exists === true,
    is_directory: entry.is_directory === true,
    is_file: entry.is_file === true,
    usage_bytes: Number(entry.usage_bytes || 0),
    posture: entry.posture || []
  };
}

function pathStatus(entry = {}) {
  return {
    source: entry.source || null,
    exists: entry.exists === true,
    status: entry.status || null,
    usage_bytes: Number(entry.usage_bytes || 0)
  };
}

function databasePathStatus(database = {}) {
  return {
    source: database.source || null,
    mode: database.mode || null,
    exists: database.exists === true,
    usage_bytes: Number(database.total_bytes || 0)
  };
}

function rendererPayloadHasPathClaims(input = {}) {
  return FORBIDDEN_RENDERER_PATH_KEYS.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

module.exports = {
  buildSupportArtifactPathAuthorityPreview
};
