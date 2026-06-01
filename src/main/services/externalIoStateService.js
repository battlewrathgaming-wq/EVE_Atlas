const fs = require('node:fs');
const path = require('node:path');
const { projectRoot } = require('../util/tempPaths');

const DEFAULT_PRODUCTION_TARGET = path.join(projectRoot(), 'config', 'external-io-state.json');

function buildExternalIoStateReadout(input = {}, context = {}) {
  const target = resolveStateTarget(context, DEFAULT_PRODUCTION_TARGET);
  const rendererPayloadIgnored = context.source === 'renderer' && Boolean(
    input.externalIoState || input.external_io_state || input.state || input.path || input.statePath || input.state_path
  );
  const persisted = readPersistedState(target);
  const inputState = context.source === 'renderer'
    ? null
    : input.externalIoState || input.external_io_state || input.state;
  const normalized = persisted.state
    ? {
      state: persisted.state,
      source: persisted.source,
      validation: validation('valid_external_io_state', [])
    }
    : normalizeExternalIoState(context.externalIoState || inputState || 'off');

  return stateReadoutResult({
    state: normalized.state,
    stateSource: persisted.state ? persisted.source : normalized.source,
    target,
    persisted,
    rendererPayloadIgnored,
    validation: normalized.validation
  });
}

function buildExternalIoStateConfigReadback(input = {}, context = {}) {
  const readout = buildExternalIoStateReadout(input, context);
  return {
    ...readout,
    action: 'external_io.state_config_readback',
    classification: 'read-only External I/O operator config readback',
    boundary: [
      'Read-only External I/O operator config readback only; it does not write config or call providers.',
      'It reads only the canonical app-local External I/O config path unless trusted fixture context supplies an allowed fixture path.',
      'External I/O off holds provider-backed movement; it is not failure.',
      'External I/O on releases provider-backed work only to normal storage, live/provider, cadence, Watch, and confirmation gates.',
      'External I/O on is not authorization and does not dispatch held work or create catch-up debt.'
    ]
  };
}

function buildExternalIoStateConfigWrite(input = {}, context = {}) {
  const target = resolveConfigWriteTarget(context, DEFAULT_PRODUCTION_TARGET);
  const requested = normalizeExternalIoState(input.state || input.externalIoState || input.external_io_state);
  const rendererPayloadIgnored = context.source === 'renderer' && Boolean(
    input.state || input.externalIoState || input.external_io_state || input.path || input.statePath || input.state_path
  );
  const validation = validateConfigWrite({ context, target, requested });

  if (!validation.valid) {
    return configWriteResult({
      target,
      requested,
      validation,
      rendererPayloadIgnored,
      write: null,
      readback: null,
      readout: null,
      forgedRendererReadout: null
    });
  }

  const payload = writablePayload(requested.state, input.reason || 'operator External I/O config write', {
    fixtureOfflineOnly: target.fixture_target === true
  });
  const write = writeJsonAtomically(target.path, payload);
  const readbackPayload = JSON.parse(fs.readFileSync(target.path, 'utf8'));
  const readback = {
    status: 'read_back_verified',
    path: target.path,
    matches_payload: stableJson(readbackPayload) === stableJson(payload),
    payload: readbackPayload
  };
  const readout = buildExternalIoStateReadout({}, {
    ...context,
    externalIoStateReadPath: target.path,
    externalIoStateAllowedRoot: target.allowed_root
  });
  const forgedRendererReadout = buildExternalIoStateReadout({
    state: requested.state === 'on' ? 'off' : 'on',
    path: path.join(path.dirname(target.allowed_root), 'renderer-forged', 'external-io-state.json'),
    acknowledgement: 'renderer forged acknowledgement',
    budgetBytes: 1
  }, {
    source: 'renderer'
  });

  return configWriteResult({
    target,
    requested,
    validation,
    rendererPayloadIgnored,
    write,
    readback,
    readout,
    forgedRendererReadout
  });
}

function buildExternalIoStatePersistenceProof(input = {}, context = {}) {
  const target = resolveStateTarget(context, DEFAULT_PRODUCTION_TARGET);
  const requested = normalizeExternalIoState(input.state || input.externalIoState || input.external_io_state);
  const rendererPayloadIgnored = context.source === 'renderer';
  const validation = validatePersistenceProof({ context, target, requested });

  if (!validation.valid) {
    return persistenceProofResult({
      target,
      requested,
      validation,
      rendererPayloadIgnored,
      write: null,
      readback: null,
      readout: null,
      forgedRendererReadout: null
    });
  }

  const payload = writablePayload(requested.state, input.reason, { fixtureOfflineOnly: true });
  const write = writeJsonAtomically(target.path, payload);
  const readbackPayload = JSON.parse(fs.readFileSync(target.path, 'utf8'));
  const readback = {
    status: 'read_back_verified',
    path: target.path,
    matches_payload: stableJson(readbackPayload) === stableJson(payload),
    payload: readbackPayload
  };
  const readout = buildExternalIoStateReadout({}, {
    ...context,
    externalIoStateReadPath: target.path,
    externalIoStateAllowedRoot: target.allowed_root
  });
  const forgedRendererReadout = buildExternalIoStateReadout({
    state: requested.state === 'on' ? 'off' : 'on',
    path: path.join(path.dirname(target.allowed_root), 'renderer-forged', 'external-io-state.json'),
    acknowledgement: 'renderer forged acknowledgement',
    budgetBytes: 1
  }, {
    source: 'renderer'
  });

  return persistenceProofResult({
    target,
    requested,
    validation,
    rendererPayloadIgnored,
    write,
    readback,
    readout,
    forgedRendererReadout
  });
}

function stateReadoutResult({ state, stateSource, target, persisted, rendererPayloadIgnored, validation }) {
  const posture = postureForState(state);
  return {
    action: 'external_io.state_readout',
    classification: 'read-only External I/O persisted state readout',
    generated_at: new Date().toISOString(),
    read_only: true,
    mutates_state: false,
    provider_calls: 0,
    filesystem_writes: 0,
    db_mutations: 0,
    schema_changes: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    queue_dispatches: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    state,
    state_source: stateSource,
    accepted_states: ['off', 'on'],
    persisted_state: {
      status: persisted.status,
      path: target.can_read ? target.path : null,
      path_basis: target.basis,
      path_allowed: target.path_allowed,
      allowed_root_explicit: target.allowed_root_explicit,
      read_allowed: target.can_read,
      read_error: persisted.error || null
    },
    provider_backed_posture: posture.provider_backed_posture,
    implementation_state: 'operator_config_readout',
    enforced: false,
    requested_readout_state: state,
    local_only_posture: 'available',
    held_is_failure: false,
    on_is_authorization: false,
    reenable_catch_up_policy: {
      catch_up_flood: false,
      immediate_dispatch: false,
      missed_slots_create_request_debt: false,
      next_step: 're_enter_normal_gates'
    },
    distinct_gates: {
      watch_executor_arm: 'session Watch arming remains separate from provider movement permission',
      live_gate: 'per-action provider/cadence gate remains separate from External I/O state',
      storage_authority: 'storage safety and budget remain separate from External I/O state',
      runtime_authorization: 'External I/O on is not runtime authorization'
    },
    validation_result: validation,
    renderer_payload_ignored: rendererPayloadIgnored,
    boundary: [
      'Read-only External I/O state readout only; it does not call providers or move work.',
      'External I/O off holds provider-backed movement; it is not failure.',
      'External I/O on releases provider-backed work only to normal storage, live/provider, cadence, Watch, and confirmation gates.',
      'External I/O on is not authorization and does not dispatch held work or create catch-up debt.',
      'Renderer payloads cannot choose persisted state paths, forge state, forge acknowledgement, forge budget, or probe arbitrary files.'
    ]
  };
}

function configWriteResult({ target, requested, validation, rendererPayloadIgnored, write, readback, readout, forgedRendererReadout }) {
  return {
    action: 'external_io.state_config_write',
    classification: 'trusted External I/O operator config write/readback',
    generated_at: new Date().toISOString(),
    read_only: false,
    mutates_state: validation.valid === true,
    fixture_offline_only: target.fixture_target === true,
    provider_calls: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    queue_dispatches: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    schema_changes: 0,
    real_config_write: validation.valid === true && target.fixture_target !== true,
    ui_work: false,
    default_config_path: target.default_production_path,
    target_path: target.path,
    target_path_basis: target.basis,
    allowed_root: target.allowed_root,
    path_allowed: target.path_allowed,
    would_write: validation.valid === true,
    requested_state: requested.state,
    normalized_state: requested.state,
    accepted_states: ['off', 'on'],
    validation_result: validation,
    renderer_payload_ignored: rendererPayloadIgnored,
    write,
    readback,
    readout: readout ? compactReadout(readout) : null,
    forged_renderer_readout: forgedRendererReadout ? compactReadout(forgedRendererReadout) : null,
    state_meaning: postureForState(requested.state),
    boundary: [
      'Trusted External I/O operator config write/readback only; it is not runtime enforcement.',
      'Renderer payloads cannot choose paths, forge trusted context, forge state authority, forge acknowledgement, forge budget, or probe arbitrary files.',
      'It writes only the External I/O state config and does not write storage authority config.',
      'It does not call providers, dispatch queues, create Evidence/EVEidence, hydrate metadata, mutate Watch execution, change schema, or redesign renderer UI.',
      'External I/O on remains release to normal gates, not authorization or immediate dispatch.'
    ]
  };
}

function persistenceProofResult({ target, requested, validation, rendererPayloadIgnored, write, readback, readout, forgedRendererReadout }) {
  return {
    action: 'external_io.state_persistence_proof',
    classification: 'fixture/offline External I/O state persistence proof',
    generated_at: new Date().toISOString(),
    read_only: false,
    mutates_state: true,
    fixture_offline_only: true,
    provider_calls: 0,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    queue_dispatches: 0,
    evidence_writes: 0,
    hydration_writes: 0,
    schema_changes: 0,
    real_config_write: false,
    ui_work: false,
    default_production_target_path: target.default_production_path,
    target_path: target.path,
    target_path_basis: target.basis,
    allowed_root: target.allowed_root,
    path_allowed: target.path_allowed,
    would_write: validation.valid === true,
    requested_state: requested.state,
    normalized_state: requested.state,
    validation_result: validation,
    renderer_payload_ignored: rendererPayloadIgnored,
    write,
    readback,
    readout: readout ? compactReadout(readout) : null,
    forged_renderer_readout: forgedRendererReadout ? compactReadout(forgedRendererReadout) : null,
    boundary: [
      'Fixture/offline External I/O state persistence proof only; it is not runtime enforcement.',
      'It writes only when trusted main-process/test context supplies an allowed fixture target.',
      'It does not write the real project-root External I/O config during verification.',
      'It does not call providers, dispatch queues, create Evidence/EVEidence, hydrate metadata, mutate Watch execution, change schema, or redesign renderer UI.',
      'External I/O on remains release to normal gates, not authorization or immediate dispatch.'
    ]
  };
}

function compactReadout(readout = {}) {
  return {
    state: readout.state,
    state_source: readout.state_source,
    provider_backed_posture: readout.provider_backed_posture,
    local_only_posture: readout.local_only_posture,
    held_is_failure: readout.held_is_failure,
    on_is_authorization: readout.on_is_authorization,
    path_basis: readout.persisted_state?.path_basis || null,
    path_allowed: readout.persisted_state?.path_allowed === true,
    read_allowed: readout.persisted_state?.read_allowed === true,
    renderer_payload_ignored: readout.renderer_payload_ignored === true,
    catch_up_flood: readout.reenable_catch_up_policy?.catch_up_flood === true,
    immediate_dispatch: readout.reenable_catch_up_policy?.immediate_dispatch === true
  };
}

function resolveStateTarget(context = {}, defaultTargetPath) {
  const fixtureTarget = context.allowExternalIoStateFixtureTarget === true
    ? context.externalIoStateTargetPath || context.externalIoStateReadPath
    : context.externalIoStateReadPath;
  const fixtureRoot = context.externalIoStateAllowedRoot ? path.resolve(context.externalIoStateAllowedRoot) : null;
  const targetPath = path.resolve(fixtureTarget || defaultTargetPath);
  const allowedRoot = fixtureRoot || path.dirname(defaultTargetPath);
  const allowed = isInsidePath(targetPath, allowedRoot);
  const trustedReadPath = Boolean(context.externalIoStateReadPath && fixtureRoot);
  const canonicalReadPath = !fixtureTarget;
  const trustedWriteTarget = Boolean(context.allowExternalIoStateFixtureTarget === true && context.externalIoStateTargetPath && fixtureRoot);

  return {
    path: targetPath,
    default_production_path: defaultTargetPath,
    basis: fixtureTarget
      ? 'trusted_fixture_context_target'
      : '<Atlas app/root>/config/external-io-state.json',
    allowed_root: path.resolve(allowedRoot),
    allowed_root_explicit: Boolean(fixtureRoot),
    path_allowed: allowed,
    path_block_reason: allowed ? null : 'target_path_outside_allowed_external_io_root',
    fixture_target: trustedWriteTarget,
    can_read: (trustedReadPath || canonicalReadPath) && allowed,
    can_write: trustedWriteTarget && allowed
  };
}

function resolveConfigWriteTarget(context = {}, defaultTargetPath) {
  const defaultConfigRoot = path.dirname(defaultTargetPath);
  const fixtureTarget = context.allowExternalIoStateConfigFixtureTarget === true
    ? context.externalIoStateConfigWriteTargetPath
    : null;
  const fixtureRoot = context.allowExternalIoStateConfigFixtureTarget === true && context.externalIoStateConfigAllowedRoot
    ? path.resolve(context.externalIoStateConfigAllowedRoot)
    : null;
  const targetPath = path.resolve(fixtureTarget || defaultTargetPath);
  const allowedRoot = fixtureRoot || defaultConfigRoot;
  const allowed = isInsidePath(targetPath, allowedRoot);

  return {
    path: targetPath,
    default_production_path: defaultTargetPath,
    basis: fixtureTarget
      ? 'trusted_fixture_context_target'
      : '<Atlas app/root>/config/external-io-state.json',
    allowed_root: path.resolve(allowedRoot),
    allowed_root_explicit: Boolean(fixtureRoot),
    path_allowed: allowed,
    path_block_reason: allowed ? null : 'target_path_outside_allowed_external_io_config_root',
    fixture_target: Boolean(fixtureTarget),
    can_write: allowed
  };
}

function validatePersistenceProof({ context = {}, target = {}, requested = {} }) {
  const issues = [];
  if (context.source === 'renderer') {
    issues.push('renderer_not_allowed_to_persist_external_io_state');
  }
  if (context.allowExternalIoStatePersistenceProof !== true) {
    issues.push('trusted_external_io_persistence_context_required');
  }
  if (target.fixture_target !== true) {
    issues.push('fixture_target_required_for_external_io_state_proof');
  }
  if (target.allowed_root_explicit !== true) {
    issues.push('trusted_allowed_root_required_for_external_io_state_proof');
  }
  if (target.path_allowed !== true) {
    issues.push(target.path_block_reason || 'target_path_blocked');
  }
  if (requested.valid !== true) {
    issues.push('invalid_external_io_state');
  }

  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'external_io_state_persistence_valid' : uniqueIssues[0],
    issues: uniqueIssues,
    enforcement_state: 'not_implemented_readout_only'
  };
}

function validateConfigWrite({ context = {}, target = {}, requested = {} }) {
  const issues = [];
  if (context.source === 'renderer') {
    issues.push('renderer_not_allowed_to_write_external_io_config');
  }
  if (context.allowExternalIoStateConfigWrite !== true) {
    issues.push('trusted_external_io_config_write_context_required');
  }
  if (target.fixture_target === true && target.allowed_root_explicit !== true) {
    issues.push('trusted_allowed_root_required_for_external_io_config_fixture');
  }
  if (target.path_allowed !== true) {
    issues.push(target.path_block_reason || 'target_path_blocked');
  }
  if (requested.valid !== true) {
    issues.push('invalid_external_io_state');
  }

  const uniqueIssues = [...new Set(issues)];
  return {
    valid: uniqueIssues.length === 0,
    status: uniqueIssues.length === 0 ? 'external_io_config_write_valid' : uniqueIssues[0],
    issues: uniqueIssues,
    enforcement_state: 'not_implemented_readout_only'
  };
}

function readPersistedState(target = {}) {
  if (target.can_read !== true) {
    return {
      status: 'not_reading_untrusted_or_default_path',
      source: 'default_safe_off',
      state: null
    };
  }
  if (!fs.existsSync(target.path)) {
    return {
      status: 'missing',
      source: 'default_safe_off',
      state: null
    };
  }
  try {
    const payload = JSON.parse(fs.readFileSync(target.path, 'utf8'));
    const normalized = normalizeExternalIoState(payload.external_io_state || payload.state);
    const source = target.fixture_target === true || target.basis === 'trusted_fixture_context_target'
      ? 'trusted_fixture_persisted_state'
      : 'operator_config_persisted_state';
    return {
      status: normalized.valid ? 'read' : 'invalid_state',
      source: normalized.valid ? source : 'default_safe_off',
      state: normalized.valid ? normalized.state : null,
      payload: normalized.valid ? payload : null,
      error: normalized.valid ? null : 'invalid_external_io_state'
    };
  } catch (error) {
    return {
      status: 'unparseable',
      source: 'default_safe_off',
      state: null,
      error: error.message
    };
  }
}

function writablePayload(state, reason, options = {}) {
  return {
    version: 1,
    external_io_state: state,
    config_kind: 'external_io_operator_state',
    state_meaning: postureForState(state),
    reason: reason || 'External I/O state persistence',
    fixture_offline_only: options.fixtureOfflineOnly === true,
    written_at: 'EXTERNAL_IO_STATE_PROOF_TIMESTAMP_PLACEHOLDER'
  };
}

function postureForState(state) {
  if (state === 'on') {
    return {
      provider_backed_posture: 'released_to_normal_gates',
      meaning: 'Provider-backed work may be reconsidered by normal storage, live/provider, cadence, Watch, and confirmation gates.',
      authorization: false,
      immediate_dispatch: false,
      catch_up_flood: false
    };
  }
  return {
    provider_backed_posture: 'held_by_external_io',
    meaning: 'Provider-backed movement is held by operator trust posture; held is not failed.',
    authorization: false,
    immediate_dispatch: false,
    catch_up_flood: false
  };
}

function normalizeExternalIoState(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (['on', 'enabled'].includes(normalized)) {
    return {
      valid: true,
      state: 'on',
      source: 'normalized_input',
      validation: validation('valid_external_io_state', [])
    };
  }
  if (['off', 'disabled', ''].includes(normalized)) {
    return {
      valid: true,
      state: 'off',
      source: 'normalized_input',
      validation: validation('valid_external_io_state', [])
    };
  }
  return {
    valid: false,
    state: 'off',
    source: 'default_safe_off',
    validation: validation('invalid_external_io_state', ['invalid_external_io_state'])
  };
}

function validation(status, issues) {
  return {
    valid: issues.length === 0,
    status,
    issues,
    enforcement_state: 'not_implemented_readout_only'
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
  buildExternalIoStateConfigReadback,
  buildExternalIoStateConfigWrite,
  buildExternalIoStateReadout,
  buildExternalIoStatePersistenceProof,
  normalizeExternalIoState
};
