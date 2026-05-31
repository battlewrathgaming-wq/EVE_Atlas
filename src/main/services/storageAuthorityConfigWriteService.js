const fs = require('node:fs');
const path = require('node:path');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');
const { projectRoot } = require('../util/tempPaths');

function buildStorageAuthorityConfigWriteProof(input = {}, context = {}) {
  const root = path.resolve(projectRoot());
  const defaultTargetPath = path.join(root, 'config', 'storage-authority.json');
  const target = resolveWriteTarget(context, defaultTargetPath);
  const setupReadout = buildStorageSetupGateReadout(input, context);
  const dryRun = setupReadout.storage_config_dry_run;
  const rendererPayloadIgnored = context.source === 'renderer';
  const validation = validateWriteProof({
    context,
    target,
    dryRun
  });

  if (!validation.valid) {
    return writeProofResult({
      target,
      dryRun,
      rendererPayloadIgnored,
      validation,
      write: null,
      readback: null
    });
  }

  const payload = normalizeWritablePayload(dryRun.payload);
  const write = writeJsonAtomically(target.path, payload);
  const readbackPayload = JSON.parse(fs.readFileSync(target.path, 'utf8'));
  const readback = {
    status: 'read_back_verified',
    path: target.path,
    matches_payload: stableJson(readbackPayload) === stableJson(payload),
    payload: readbackPayload
  };

  return writeProofResult({
    target,
    dryRun,
    rendererPayloadIgnored,
    validation,
    write,
    readback
  });
}

function buildStorageAuthorityAcknowledgementPersistenceProof(input = {}, context = {}) {
  const validation = validateAcknowledgementProofRequest(input, context);
  const rendererPayloadIgnored = context.source === 'renderer';
  if (!validation.valid) {
    return acknowledgementProofResult({
      validation,
      rendererPayloadIgnored,
      writeProof: null,
      readbackAuthority: null,
      readbackPosture: null,
      invalidation: null,
      missingBudget: null
    });
  }

  const writeProof = buildStorageAuthorityConfigWriteProof(input, {
    ...context,
    allowStorageSetupGateFixtureInput: true,
    allowStorageConfigWriteProof: true,
    allowStorageConfigWriteFixtureTarget: true
  });
  if (writeProof.would_write !== true || writeProof.readback?.matches_payload !== true) {
    return acknowledgementProofResult({
      validation: {
        valid: false,
        status: writeProof.validation_result?.status || 'write_proof_failed',
        issues: writeProof.validation_result?.issues || ['write_proof_failed'],
        enforcement_state: 'not_implemented_readout_only'
      },
      rendererPayloadIgnored,
      writeProof,
      readbackAuthority: null,
      readbackPosture: null,
      invalidation: null,
      missingBudget: null
    });
  }

  const persistedPayload = writeProof.readback.payload;
  const readbackAuthority = authorityFromPersistedPayload(persistedPayload);
  const readbackPosture = buildStorageSetupGateReadout({
    storagePreflight: input.storagePreflight,
    storageAuthority: readbackAuthority
  }, {
    ...context,
    allowStorageSetupGateFixtureInput: true,
    storageBudgetBytes: persistedPayload.budget_bytes
  });
  const invalidation = buildAcknowledgementInvalidationProof(input, context, persistedPayload);
  const missingBudget = buildMissingBudgetProof(input, context, persistedPayload);

  return acknowledgementProofResult({
    validation,
    rendererPayloadIgnored,
    writeProof,
    readbackAuthority,
    readbackPosture,
    invalidation,
    missingBudget
  });
}

function validateAcknowledgementProofRequest(input = {}, context = {}) {
  const issues = [];
  const authority = input.storageAuthority || {};
  if (context.source === 'renderer') {
    issues.push('renderer_not_allowed_to_persist_acknowledgement');
  }
  if (context.allowStorageAcknowledgementPersistenceProof !== true) {
    issues.push('trusted_acknowledgement_persistence_context_required');
  }
  if (context.allowStorageConfigWriteFixtureTarget !== true || !context.storageConfigWriteTargetPath) {
    issues.push('trusted_fixture_target_required');
  }
  if (!context.storageConfigWriteAllowedRoot) {
    issues.push('trusted_allowed_root_required_for_acknowledgement_proof');
  }
  if (authority.mode !== 'app_local_fallback_acknowledged') {
    issues.push('app_local_fallback_acknowledged_required');
  }
  if (authority.acknowledgement_status !== 'acknowledged') {
    issues.push('acknowledgement_status_acknowledged_required');
  }

  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'acknowledgement_persistence_valid' : uniqueIssues[0],
    issues: uniqueIssues,
    enforcement_state: 'not_implemented_readout_only'
  };
}

function authorityFromPersistedPayload(payload = {}, overrides = {}) {
  return {
    mode: overrides.mode || payload.selected_storage_mode || null,
    selected: false,
    fallback_available: true,
    acknowledgement_status: overrides.acknowledgement_status || payload.fallback_acknowledgement?.status || null,
    acknowledgement_basis: overrides.acknowledgement_basis || payload.fallback_acknowledgement?.provenance || null,
    acknowledgement_invalid_reason: overrides.acknowledgement_invalid_reason || payload.fallback_acknowledgement?.invalidation_basis || null,
    config_source: 'persisted_storage_authority_fixture',
    config_version: payload.version || null,
    storage_root: payload.selected_storage_root || null,
    database_path: payload.selected_database_path || null,
    path_basis: payload.path_basis || null,
    validation_status: overrides.validation_status || payload.validation_status || null,
    budget_source: payload.budget_source || null,
    budget_bytes: overrides.budget_bytes === undefined ? payload.budget_bytes : overrides.budget_bytes
  };
}

function buildAcknowledgementInvalidationProof(input = {}, context = {}, persistedPayload = {}) {
  const originalPath = persistedPayload.selected_database_path || null;
  const changedPath = context.acknowledgementInvalidationDatabasePath || (originalPath
    ? path.join(path.dirname(originalPath), 'changed-app-root', path.basename(originalPath))
    : null);
  const changedPreflight = clonePreflightWithDatabasePath(input.storagePreflight, changedPath);
  const pathChanged = Boolean(originalPath && changedPath && path.resolve(originalPath) !== path.resolve(changedPath));
  const invalidatedAuthority = authorityFromPersistedPayload(persistedPayload, pathChanged
    ? {
      mode: 'acknowledgement_invalidated',
      acknowledgement_status: 'invalidated',
      acknowledgement_invalid_reason: 'fallback_path_basis_changed',
      validation_status: 'invalidated'
    }
    : {});
  const readout = buildStorageSetupGateReadout({
    storagePreflight: changedPreflight,
    storageAuthority: invalidatedAuthority
  }, {
    ...context,
    allowStorageSetupGateFixtureInput: true,
    storageBudgetBytes: persistedPayload.budget_bytes
  });

  return {
    status: pathChanged ? 'invalidated' : 'unchanged',
    comparison_basis: {
      persisted_database_path: originalPath,
      current_database_path: changedPath,
      path_changed: pathChanged
    },
    readout: compactSetupReadout(readout)
  };
}

function buildMissingBudgetProof(input = {}, context = {}, persistedPayload = {}) {
  const noBudgetPayload = {
    ...persistedPayload,
    budget_bytes: null,
    budget_source: 'unconfigured'
  };
  const authority = authorityFromPersistedPayload(noBudgetPayload, { budget_bytes: null });
  const readout = buildStorageSetupGateReadout({
    storagePreflight: input.storagePreflight,
    storageAuthority: authority
  }, {
    ...context,
    allowStorageSetupGateFixtureInput: true,
    storageBudgetBytes: null
  });

  return {
    status: readout.storage_config_dry_run.validation_result.status,
    issues: readout.storage_config_dry_run.validation_result.issues,
    provider_backed_write_posture: readout.storage_config_dry_run.would_write === true
      ? 'allowed_subject_to_future_gates'
      : 'blocked_budget_required',
    provider_backed_config_write_allowed: readout.storage_config_dry_run.would_write === true,
    write_allowed_if_enforced_later: readout.storage_authority.write_allowed_if_enforced_later,
    provider_movement_allowed_if_enforced_later: readout.storage_authority.provider_movement_allowed_if_enforced_later,
    dry_run_would_write: readout.storage_config_dry_run.would_write,
    budget_state: readout.budget.state,
    readout: compactSetupReadout(readout)
  };
}

function clonePreflightWithDatabasePath(preflight = {}, dbPath) {
  const database = preflight.database || {};
  return {
    ...preflight,
    database: {
      ...database,
      path: dbPath,
      parent: {
        ...(database.parent || {}),
        path: dbPath ? path.dirname(dbPath) : null,
        exists: database.parent?.exists !== false,
        is_directory: database.parent?.is_directory !== false
      }
    }
  };
}

function compactSetupReadout(readout = {}) {
  return {
    storage_authority_mode: readout.storage_authority?.mode || null,
    selected: readout.storage_authority?.selected === true,
    fallback_acknowledged: readout.storage_authority?.fallback_acknowledged === true,
    acknowledgement_status: readout.storage_authority?.acknowledgement_status || null,
    acknowledgement_basis: readout.storage_authority?.acknowledgement_basis || null,
    acknowledgement_invalid_reason: readout.storage_authority?.acknowledgement_invalid_reason || null,
    storage_state: readout.storage?.state || null,
    setup_gate: readout.storage?.setup_gate || null,
    dry_run_would_write: readout.storage_config_dry_run?.would_write === true,
    dry_run_status: readout.storage_config_dry_run?.validation_result?.status || null,
    budget_state: readout.budget?.state || null,
    write_allowed_if_enforced_later: readout.storage_authority?.write_allowed_if_enforced_later === true,
    provider_movement_allowed_if_enforced_later: readout.storage_authority?.provider_movement_allowed_if_enforced_later === true
  };
}

function acknowledgementProofResult({
  validation,
  rendererPayloadIgnored,
  writeProof,
  readbackAuthority,
  readbackPosture,
  invalidation,
  missingBudget
}) {
  return {
    action: 'storage.authority_config.acknowledgement_persistence_proof',
    classification: 'fixture/offline storage authority acknowledgement persistence proof',
    generated_at: new Date().toISOString(),
    read_only: false,
    mutates_state: true,
    fixture_offline_only: true,
    enforcement_state: 'not_implemented_readout_only',
    validation_result: validation,
    renderer_payload_ignored: rendererPayloadIgnored,
    write_proof: writeProof ? {
      would_write: writeProof.would_write,
      target_path: writeProof.target_path,
      target_path_basis: writeProof.target_path_basis,
      readback_matches_payload: writeProof.readback?.matches_payload === true,
      write_status: writeProof.write?.status || null
    } : null,
    persisted_acknowledgement_payload: writeProof?.readback?.payload || null,
    readback_authority: readbackAuthority,
    readback_posture: readbackPosture ? compactSetupReadout(readbackPosture) : null,
    invalidation,
    missing_budget: missingBudget,
    boundary: [
      'Fixture/offline acknowledgement persistence proof only; it is not storage enforcement.',
      'It writes only when trusted main-process/test context supplies an allowed fixture target.',
      'It keeps app-local/current-file fallback distinct from selected storage.',
      'It does not write the real project-root storage authority config during verification.',
      'It does not move, copy, migrate, create, relocate, restore, or delete active DB files.',
      'It does not call providers, create Evidence/EVEidence, hydrate metadata, prune/delete records, change schema, or redesign renderer UI.'
    ]
  };
}

function resolveWriteTarget(context = {}, defaultTargetPath) {
  const root = path.resolve(projectRoot());
  const defaultConfigRoot = path.join(root, 'config');
  const fixtureTarget = context.allowStorageConfigWriteFixtureTarget === true
    ? context.storageConfigWriteTargetPath
    : null;
  const fixtureRoot = context.allowStorageConfigWriteFixtureTarget === true && context.storageConfigWriteAllowedRoot
    ? path.resolve(context.storageConfigWriteAllowedRoot)
    : null;
  const targetPath = path.resolve(fixtureTarget || defaultTargetPath);
  const allowedRoot = fixtureRoot || defaultConfigRoot;
  const allowed = isInsidePath(targetPath, allowedRoot);

  return {
    path: targetPath,
    default_production_path: defaultTargetPath,
    basis: fixtureTarget
      ? 'trusted_fixture_context_target'
      : '<Atlas app/root>/config/storage-authority.json',
    allowed_root: path.resolve(allowedRoot),
    allowed_root_explicit: Boolean(fixtureRoot),
    path_allowed: allowed,
    path_block_reason: allowed ? null : 'target_path_outside_allowed_config_root',
    fixture_target: Boolean(fixtureTarget)
  };
}

function validateWriteProof({ context = {}, target = {}, dryRun = {} }) {
  const issues = [];
  if (context.source === 'renderer') {
    issues.push('renderer_not_allowed_to_write_storage_config');
  }
  if (context.allowStorageConfigWriteProof !== true) {
    issues.push('trusted_write_proof_context_required');
  }
  if (target.fixture_target !== true) {
    issues.push('fixture_target_required_for_write_proof');
  }
  if (target.fixture_target === true && target.allowed_root_explicit !== true) {
    issues.push('trusted_allowed_root_required_for_write_proof');
  }
  if (target.path_allowed !== true) {
    issues.push(target.path_block_reason || 'target_path_blocked');
  }
  if (dryRun?.would_write !== true) {
    issues.push(dryRun?.validation_result?.status || 'dry_run_not_writable');
  }
  if (dryRun?.would_write === true && !dryRun?.payload) {
    issues.push('dry_run_payload_missing');
  }

  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'write_proof_valid' : uniqueIssues[0],
    issues: uniqueIssues,
    dry_run_status: dryRun?.validation_result?.status || null,
    enforcement_state: 'not_implemented_readout_only'
  };
}

function normalizeWritablePayload(payload = {}) {
  return {
    ...payload,
    dry_run: false,
    write_proof: true,
    written_at: 'WRITE_PROOF_TIMESTAMP_PLACEHOLDER'
  };
}

function writeJsonAtomically(targetPath, payload) {
  const directory = path.dirname(targetPath);
  fs.mkdirSync(directory, { recursive: true });
  const tempPath = path.join(directory, `.${path.basename(targetPath)}.${process.pid}.tmp`);
  const serialized = `${stableJson(payload)}\n`;
  fs.writeFileSync(tempPath, serialized, { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(tempPath, targetPath);
  const stats = fs.statSync(targetPath);
  return {
    status: 'written_atomically',
    path: targetPath,
    temp_path: tempPath,
    temp_exists_after_rename: fs.existsSync(tempPath),
    bytes_written: stats.size
  };
}

function writeProofResult({
  target,
  dryRun,
  rendererPayloadIgnored,
  validation,
  write,
  readback
}) {
  return {
    action: 'storage.authority_config.write_proof',
    classification: 'fixture/offline storage authority config write proof',
    generated_at: new Date().toISOString(),
    read_only: false,
    mutates_state: true,
    fixture_offline_only: true,
    enforcement_state: 'not_implemented_readout_only',
    default_production_target_path: target.default_production_path,
    target_path: target.path,
    target_path_basis: target.basis,
    allowed_root: target.allowed_root,
    path_allowed: target.path_allowed,
    path_block_reason: target.path_block_reason,
    would_write: validation.valid === true,
    payload: validation.valid === true ? normalizeWritablePayload(dryRun.payload) : null,
    write,
    readback,
    validation_result: validation,
    renderer_payload_ignored: rendererPayloadIgnored,
    source_dry_run: {
      would_write: dryRun?.would_write === true,
      validation_status: dryRun?.validation_result?.status || null,
      target_path_basis: dryRun?.target_path_basis || null
    },
    boundary: [
      'Fixture/offline write proof only; it is not storage enforcement.',
      'It writes only when trusted main-process/test context supplies an allowed fixture target.',
      'It does not write the real project-root storage authority config during verification.',
      'It does not move, copy, migrate, create, relocate, restore, or delete active DB files.',
      'It does not call providers, create Evidence/EVEidence, hydrate metadata, prune/delete records, change schema, or redesign renderer UI.'
    ]
  };
}

function stableJson(value) {
  return JSON.stringify(sortJsonValue(value), null, 2);
}

function sortJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [
      key,
      sortJsonValue(value[key])
    ]));
  }
  return value;
}

function isInsidePath(targetPath, rootPath) {
  const relative = path.relative(path.resolve(rootPath), path.resolve(targetPath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

module.exports = {
  buildStorageAuthorityConfigWriteProof,
  buildStorageAuthorityAcknowledgementPersistenceProof
};
