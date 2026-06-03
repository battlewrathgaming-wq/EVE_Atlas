const path = require('node:path');
const { buildComposedGatePolicyPreview } = require('./composedGatePolicyService');
const { buildEnforcementDryRunCommandEffectMap } = require('./enforcementDryRunService');
const { buildGateStackReadout } = require('./gateStackReadoutService');
const { buildLocalSdeReadinessPreview } = require('./localSdeReadinessPreviewService');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');
const { buildSupportArtifactPathAuthorityPreview } = require('./supportArtifactPathAuthorityService');

const SDE_COMMANDS = Object.freeze([
  'sde.import.topology',
  'sde.import.inventory',
  'sde.build-lookups'
]);

function buildLocalSdeSourcePosturePreview(db, input = {}, context = {}) {
  const metadata = commandMetadata(context);
  const canBuildBroadComposedPolicy = Array.isArray(context.commandMetadata) && context.commandMetadata.length > 10;
  const readiness = buildLocalSdeReadinessPreview(db, input);
  const storageSetup = buildStorageSetupGateReadout({}, {
    ...context,
    allowStorageSetupGateFixtureInput: false
  });
  const gateStack = buildGateStackReadout(db, {
    externalIoState: input.externalIoState || input.external_io_state || 'off',
    actions: ['sde.build-lookups'],
    actionInputs: {
      'sde.build-lookups': sourcePayloadForGate(input, context)
    }
  }, {
    ...context,
    commandMetadata: metadata
  });
  const dryRun = buildEnforcementDryRunCommandEffectMap({}, {
    ...context,
    commandMetadata: metadata
  });
  const composed = canBuildBroadComposedPolicy
    ? buildComposedGatePolicyPreview(db, {
      externalIoState: input.externalIoState || input.external_io_state || 'off'
    }, {
      ...context,
      commandMetadata: metadata
    })
    : { rows: [] };
  const supportPathAuthority = buildSupportArtifactPathAuthorityPreview({}, {
    ...context,
    commandMetadata: metadata,
    source: context.source
  });
  const sourcePath = sourcePathPosture(input, context);
  const commandFamilies = buildCommandFamilies({
    readiness,
    storageSetup,
    gateStack,
    dryRun,
    composed,
    sourcePath
  });
  const sourceSummary = sourcePostureSummary(readiness);

  return {
    action: 'metadata.local_sde_source_posture.preview',
    classification: 'read-only local SDE source/import posture preview',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    sde_downloads: 0,
    sde_imports_started: 0,
    lookup_writes: 0,
    hydration_writes: 0,
    entity_writes: 0,
    activity_event_label_patches: 0,
    metadata_run_writes: 0,
    evidence_writes: 0,
    discovery_ref_mutations: 0,
    watch_mutations: 0,
    assessment_memory_mutations: 0,
    marked_mutations: 0,
    support_artifacts_created: 0,
    storage_config_written: false,
    storage_moves: 0,
    persisted_queue: false,
    schema_changes: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    ui_work: false,
    source_posture_summary: sourceSummary,
    readiness_summary: readinessSummary(readiness),
    source_path_authority: sourcePath,
    command_family_posture: commandFamilies,
    external_io_posture: externalIoSummary(commandFamilies, gateStack),
    storage_posture: storagePosture(storageSetup),
    support_corpus_posture: supportCorpusPosture(supportPathAuthority),
    representative_missing_groups: representativeMissingGroups(readiness),
    boundary_statements: {
      local_sde_readiness_is_hydration: false,
      local_sde_readiness_is_evidence: false,
      local_import_rewrite_requires_external_io: false,
      provider_backed_download_requires_external_io: true,
      external_io_on_is_authorization: false,
      readiness_authorizes_provider_calls: false,
      readiness_authorizes_imports: false,
      readiness_authorizes_downloads: false,
      readiness_authorizes_lookup_rewrites: false,
      storage_blocks_future_lookup_writes_not_readout: true,
      arbitrary_user_file_inspection: false
    },
    boundary: [
      'Read-only local SDE source/import posture preview only; it does not download, import, or rewrite lookup tables.',
      'Local SDE lookup readiness is local readability/geometry support, not Evidence/EVEidence and not ESI Hydration.',
      'Local source import/rewrite is distinct from provider-backed SDE download/build.',
      'External I/O off holds provider-backed SDE download/build; it does not block local source posture readout.',
      'Storage/setup posture may block future lookup-table rewrites without blocking this readout.',
      'Supplied source paths are classified without arbitrary user-file inspection.'
    ]
  };
}

function commandMetadata(context = {}) {
  const supplied = Array.isArray(context.commandMetadata) ? context.commandMetadata : [];
  const byCommand = new Map(supplied.map((entry) => [entry.command, entry]));
  for (const entry of fallbackSdeCommandMetadata()) {
    if (!byCommand.has(entry.command)) {
      byCommand.set(entry.command, entry);
    }
  }
  return [...byCommand.values()];
}

function fallbackSdeCommandMetadata() {
  return [
    {
      command: 'sde.import.topology',
      classification: 'exclusive',
      effects: ['metadata-readability', 'local-data-mutation'],
      renderer_allowed: false,
      authority: { confirmation_required: false, token: null, reason: null },
      description: 'Import local SDE topology/geography into SQLite lookup tables'
    },
    {
      command: 'sde.import.inventory',
      classification: 'exclusive',
      effects: ['metadata-readability', 'local-data-mutation'],
      renderer_allowed: false,
      authority: { confirmation_required: false, token: null, reason: null },
      description: 'Import local SDE inventory/type metadata into SQLite lookup tables'
    },
    {
      command: 'sde.build-lookups',
      classification: 'exclusive',
      effects: ['external-live-api', 'metadata-readability', 'local-data-mutation'],
      renderer_allowed: false,
      authority: { confirmation_required: true, token: 'confirm:sde.build-lookups', reason: 'SDE lookup build may download source data and rewrite local lookup metadata.' },
      description: 'Download or read SDE JSONL source, build local lookup tables, then remove source files by default'
    }
  ];
}

function sourcePostureSummary(readiness = {}) {
  const missing = readiness.readiness?.missing_table_groups || [];
  return {
    readiness_state: readinessState(readiness),
    missing_material: missingMaterial(readiness),
    missing_table_groups: missing,
    local_import_rewrite_needed_later: readiness.readiness?.overall_ready !== true,
    provider_backed_download_needed_later: false,
    provider_backed_download_available_as_future_path: true,
    readiness_is_authorization: false,
    local_sde_lookup_readiness_is_provider_hydration: false
  };
}

function readinessSummary(readiness = {}) {
  return {
    action: readiness.action || 'metadata.local_sde_readiness.preview',
    topology_lookup_ready: readiness.readiness?.topology_lookup_ready === true,
    inventory_type_lookup_ready: readiness.readiness?.inventory_type_lookup_ready === true,
    import_provenance_ready: readiness.readiness?.import_provenance_ready === true,
    overall_ready: readiness.readiness?.overall_ready === true,
    table_counts: readiness.tables?.counts || {},
    provider_calls: readiness.provider_calls || 0,
    sde_downloads: readiness.sde_downloads || 0,
    sde_imports_started: readiness.sde_imports_started || 0,
    lookup_writes: readiness.lookup_writes || 0,
    local_sde_gaps_are_esi_hydration: readiness.hydration_boundary?.local_sde_gaps_are_esi_hydration === true
  };
}

function readinessState(readiness = {}) {
  if (readiness.readiness?.overall_ready === true) {
    return 'complete';
  }
  const tables = readiness.tables || {};
  const anyReady = tables.inventory?.ready === true ||
    tables.topology?.ready === true ||
    Boolean(readiness.import_provenance?.topology || readiness.import_provenance?.inventory);
  return anyReady ? 'partial' : 'missing';
}

function missingMaterial(readiness = {}) {
  const missing = [];
  if (readiness.tables?.inventory?.ready !== true) {
    missing.push('inventory/type lookup');
  }
  if (readiness.tables?.topology?.ready !== true) {
    missing.push('topology/geography lookup');
  }
  if (readiness.readiness?.import_provenance_ready !== true) {
    missing.push('import provenance');
  }
  if (missing.length > 1) {
    missing.push('mixed');
  }
  return missing;
}

function sourcePathPosture(input = {}, context = {}) {
  const supplied = input.sourcePath || input.source_path || input.path || null;
  const envSource = context.source === 'renderer'
    ? null
    : process.env.AURA_ATLAS_SDE_SOURCE_PATH || process.env.AURA_ATLAS_LIVE_SDE_JSONL_PATH || null;
  const value = supplied || envSource;
  const rendererIgnored = context.source === 'renderer' && Boolean(supplied);

  if (rendererIgnored) {
    return {
      status: 'not_inspected_renderer_payload_ignored',
      supplied: true,
      observed: false,
      path: null,
      local_or_provider: 'not_authoritative',
      unsupported_reason: null,
      arbitrary_file_inspection: false,
      renderer_payload_ignored: true,
      requires_future_operator_input: true
    };
  }
  if (!value) {
    return {
      status: 'absent',
      supplied: false,
      observed: false,
      path: null,
      local_or_provider: 'not_selected',
      unsupported_reason: null,
      arbitrary_file_inspection: false,
      renderer_payload_ignored: false,
      requires_future_operator_input: true
    };
  }

  const text = String(value);
  if (/^https?:\/\//i.test(text)) {
    return {
      status: 'unsupported_remote_source_reference',
      supplied: Boolean(supplied),
      observed: Boolean(envSource && !supplied),
      path: null,
      local_or_provider: 'provider_or_remote_reference',
      unsupported_reason: 'remote_source_requires_provider_backed_download_build_path',
      arbitrary_file_inspection: false,
      renderer_payload_ignored: false,
      requires_future_operator_input: true
    };
  }
  if (!isSupportedSdePath(text)) {
    return {
      status: 'unsupported_local_source_shape_not_inspected',
      supplied: Boolean(supplied),
      observed: Boolean(envSource && !supplied),
      path: text,
      local_or_provider: 'local_candidate',
      unsupported_reason: 'expected_jsonl_zip_or_directory_source_shape',
      arbitrary_file_inspection: false,
      renderer_payload_ignored: false,
      requires_future_operator_input: true
    };
  }
  return {
    status: 'local_candidate_not_inspected',
    supplied: Boolean(supplied),
    observed: Boolean(envSource && !supplied),
    path: text,
    local_or_provider: 'local_source_candidate',
    unsupported_reason: null,
    path_absolute: path.isAbsolute(text),
    arbitrary_file_inspection: false,
    renderer_payload_ignored: false,
    requires_future_operator_input: false
  };
}

function isSupportedSdePath(value) {
  const lower = String(value).toLowerCase();
  return lower.endsWith('.zip') || lower.endsWith('.jsonl') || !path.extname(lower);
}

function buildCommandFamilies({ readiness, storageSetup, gateStack, dryRun, composed, sourcePath }) {
  const dryRunIndex = new Map((dryRun.commands || []).map((entry) => [entry.command, entry]));
  const gateIndex = new Map((gateStack.gate_stacks || []).map((entry) => [entry.command, entry]));
  const composedIndex = new Map((composed.rows || []).map((entry) => [entry.command, entry]));
  return SDE_COMMANDS.map((command) => commandFamily(command, {
    readiness,
    storageSetup,
    dryRun: dryRunIndex.get(command) || null,
    gate: gateIndex.get(command) || null,
    composed: composedIndex.get(command) || null,
    sourcePath
  }));
}

function commandFamily(command, context) {
  if (command === 'sde.import.topology') {
    return localImportFamily(command, 'topology/geography lookup import', 'topology/geography lookup-table rewrite', context);
  }
  if (command === 'sde.import.inventory') {
    return localImportFamily(command, 'inventory/type lookup import', 'inventory/type lookup-table rewrite', context);
  }
  return buildLookupsFamily(context);
}

function localImportFamily(command, label, rewriteScope, context) {
  return {
    command,
    label,
    future_action_kind: 'local_source_import_rewrite',
    rewrite_scope: rewriteScope,
    external_io_required: false,
    external_io_posture: 'not_required_for_local_source_import',
    source_path_status: context.sourcePath.status,
    source_path_required: true,
    storage: storageWritePosture(context.storageSetup),
    dry_run_decision_input_only: context.dryRun?.decision || null,
    composed_state_input_only: context.composed?.composed_state || null,
    readiness_needed: readinessNeededFor(command, context.readiness),
    provider_calls_authorized: false,
    imports_authorized: false,
    downloads_authorized: false,
    lookup_rewrites_authorized: false,
    reason_codes: [
      'local_source_import_not_provider_download',
      context.sourcePath.status,
      'storage_required_for_future_lookup_rewrite',
      'readiness_not_authorization'
    ]
  };
}

function buildLookupsFamily(context) {
  const localSource = context.sourcePath.status === 'local_candidate_not_inspected';
  const providerBacked = !localSource;
  const gate = context.gate?.gates?.external_io || {};
  return {
    command: 'sde.build-lookups',
    label: 'SDE lookup build/download',
    future_action_kind: localSource ? 'local_source_build_rewrite' : 'provider_backed_download_build',
    rewrite_scope: 'topology/geography and inventory/type lookup-table rewrite',
    external_io_required: providerBacked,
    external_io_posture: providerBacked
      ? (gate.state || 'held_by_external_io')
      : 'not_required_for_local_source_build',
    source_path_status: context.sourcePath.status,
    source_path_required: false,
    storage: storageWritePosture(context.storageSetup),
    dry_run_decision_input_only: context.dryRun?.decision || null,
    composed_state_input_only: context.composed?.composed_state || null,
    readiness_needed: context.readiness.readiness?.overall_ready === true ? [] : context.readiness.readiness?.missing_table_groups || [],
    provider_calls_authorized: false,
    imports_authorized: false,
    downloads_authorized: false,
    lookup_rewrites_authorized: false,
    reason_codes: [
      localSource ? 'local_source_build_no_external_io' : 'provider_download_build_requires_external_io',
      context.sourcePath.status,
      'external_io_on_is_not_authorization',
      'storage_required_for_future_lookup_rewrite',
      'readiness_not_authorization'
    ]
  };
}

function readinessNeededFor(command, readiness = {}) {
  if (command === 'sde.import.topology') {
    return [
      ...(readiness.tables?.topology?.ready === true ? [] : ['topology_lookup_gap']),
      ...(readiness.import_provenance?.topology ? [] : ['topology_import_provenance_gap'])
    ];
  }
  return [
    ...(readiness.tables?.inventory?.ready === true ? [] : ['inventory_type_lookup_gap']),
    ...(readiness.import_provenance?.inventory ? [] : ['inventory_import_provenance_gap'])
  ];
}

function storageWritePosture(storageSetup = {}) {
  const topology = storageSetup.action_class_matrix?.actions?.background_hydration || {};
  const local = storageSetup.action_class_matrix?.actions?.fast_view_metadata_hydration || {};
  const posture = topology.posture || local.posture || 'unknown';
  const blocked = ['block', 'block_writes'].includes(posture);
  return {
    storage_state: storageSetup.action_class_matrix?.storage_state || storageSetup.storage?.state || null,
    budget_state: storageSetup.budget?.state || null,
    future_lookup_rewrite_posture: posture,
    future_lookup_rewrite_blocked: blocked,
    local_readout_available: true,
    local_readout_blocked: false,
    storage_posture_is_authorization: false
  };
}

function externalIoSummary(commandFamilies, gateStack = {}) {
  return {
    requested_readout_state: gateStack.external_io?.requested_readout_state || null,
    provider_backed_download_commands: commandFamilies
      .filter((entry) => entry.external_io_required)
      .map((entry) => entry.command),
    local_only_import_commands: commandFamilies
      .filter((entry) => entry.external_io_required === false)
      .map((entry) => entry.command),
    held_is_failure: false,
    external_io_on_is_authorization: false,
    provider_calls: 0
  };
}

function storagePosture(storageSetup = {}) {
  return {
    action: storageSetup.action || 'storage.setup_gate_readout',
    storage_state: storageSetup.action_class_matrix?.storage_state || storageSetup.storage?.state || null,
    budget_state: storageSetup.budget?.state || null,
    local_readout_available: true,
    future_lookup_rewrite: storageWritePosture(storageSetup),
    storage_setup_enforced_now: false
  };
}

function supportCorpusPosture(supportPathAuthority = {}) {
  const sdeSource = (supportPathAuthority.classes || []).find((entry) => entry.id === 'sde_source_import_material') || {};
  const sdeLookup = (supportPathAuthority.classes || []).find((entry) => entry.id === 'sde_derived_lookup_material') || {};
  return {
    sde_source_material_family: sdeSource.family || 'operational_support',
    sde_source_cache_origin: sdeSource.cache_origin || 'sde_source_import',
    sde_source_counts_against_storage_budget: sdeSource.counts_against_storage_budget || 'disclose_separately',
    sde_source_external_io_relevance: sdeSource.external_io_relevance || 'SDE download is External I/O; local source import is not',
    sde_derived_lookup_family: sdeLookup.family || 'operational_support',
    sde_derived_lookup_counts_against_storage_budget: sdeLookup.counts_against_storage_budget === true,
    source_cache_path_status: sdeSource.status || null,
    derived_lookup_path_status: sdeLookup.status || null,
    support_artifact_created: false
  };
}

function representativeMissingGroups(readiness = {}) {
  return Object.fromEntries(Object.entries(readiness.gap_groups || {}).map(([key, value]) => [
    key,
    {
      count: value.count || 0,
      provider_needed: value.provider_needed === true,
      esi_hydration_work: value.esi_hydration_work === true,
      representatives: (value.representatives || []).slice(0, 5)
    }
  ]));
}

function sourcePayloadForGate(input = {}, context = {}) {
  const sourcePath = context.source === 'renderer'
    ? null
    : input.sourcePath || input.source_path || input.path || null;
  return sourcePath ? { sourcePath } : {};
}

module.exports = {
  buildLocalSdeSourcePosturePreview
};
