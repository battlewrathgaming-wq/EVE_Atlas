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
  buildStorageAuthorityConfigWriteProof
};
