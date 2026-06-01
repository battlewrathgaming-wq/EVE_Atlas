const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const root = path.join(projectRoot(), '.tmp', 'storage-authority-config-write-fixture');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const selected = await verifySelectedStorageWrite(db, root);
    const fallback = await verifyAcknowledgedFallbackWrite(db, root);
    const realConfig = await verifyRealOperatorConfigWrite(db, root);
    const blocked = await verifyBlockedStates(db, root);
    const unsafe = await verifyUnsafePathRejection(db, root);
    const missingAllowedRoot = await verifyMissingAllowedRootRejection(db, root);
    await verifyRendererCannotInvokeWriteProof(db, root);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'storage authority config write proof verified',
      sample_selected_storage: compactWrite(selected),
      sample_acknowledged_fallback: compactWrite(fallback),
      sample_real_operator_config: compactRealConfig(realConfig),
      sample_blocked_states: blocked,
      sample_unsafe_path: compactWrite(unsafe),
      sample_missing_allowed_root: compactWrite(missingAllowedRoot),
      real_project_config_exists: fs.existsSync(path.join(projectRoot(), 'config', 'storage-authority.json')),
      boundary: selected.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function verifyRealOperatorConfigWrite(db, root) {
  const targetPath = path.join(root, 'real-config-fixture', 'config', 'storage-authority.json');
  const selectedDbPath = path.join(root, 'real-config-fixture', 'selected-storage', 'atlas.sqlite');
  const defaultConfigPath = path.join(projectRoot(), 'config', 'storage-authority.json');
  const missingReadback = await invokeServiceCommand('storage.authority_config.readback', {
    storageAuthority: {
      mode: 'app_local_fallback_acknowledged',
      acknowledgement_status: 'acknowledged',
      budget_bytes: 1
    },
    configPath: 'C:\\renderer-forged-storage-authority.json',
    appRoot: 'C:\\renderer-forged-app-root'
  }, {
    db,
    source: 'renderer'
  });
  assert(missingReadback.read_only === true, 'storage authority config readback should be read-only');
  assert(missingReadback.default_config_path === defaultConfigPath, 'readback should report canonical default config path');
  assert(missingReadback.target_path === defaultConfigPath, 'readback should use canonical target path');
  assert(missingReadback.persisted_config.status === 'missing', 'canonical readback should safely report missing config');
  assert(missingReadback.renderer_payload_ignored === true, 'renderer readback should ignore forged payload authority');
  assert(missingReadback.filesystem_writes === 0, 'readback should not write files');

  const result = await invokeServiceCommand('storage.authority_config.write', {
    operatorLabel: 'Fixture operator selected storage',
    storagePreflight: fixturePreflight({
      mode: 'configured',
      source: 'configured',
      path: selectedDbPath,
      exists: true
    }),
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      config_source: 'fixture_explicit_selection',
      config_version: 1,
      budget_source: 'operator_selected',
      budget_bytes: 10 * 1024 * 1024 * 1024
    },
    storageBudgetBytes: 1,
    storageConfigPath: 'C:\\renderer-style-forged-config-path',
    appRoot: 'C:\\renderer-forged-app-root'
  }, {
    db,
    allowStorageAuthorityConfigWrite: true,
    allowStorageAuthorityConfigFixtureTarget: true,
    storageAuthorityConfigWriteTargetPath: targetPath,
    storageAuthorityConfigAllowedRoot: path.join(root, 'real-config-fixture'),
    storageBudgetBytes: 10 * 1024 * 1024 * 1024
  });

  assert(result.action === 'storage.authority_config.write', 'real config command should be named');
  assert(result.validation_result.status === 'storage_authority_config_write_valid', 'real config write should validate');
  assert(result.would_write === true, 'real config write should write trusted target');
  assert(result.write.status === 'written_atomically', 'real config write should write atomically');
  assert(result.write.temp_exists_after_rename === false, 'real config temp file should not remain');
  assert(result.readback.matches_payload === true, 'real config readback should match payload');
  assert(result.readback.payload.real_operator_config === false, 'fixture verification should not claim real project config write');
  assert(result.readback.payload.fixture_offline_only === true, 'fixture-target write should mark fixture-only');
  assert(result.readback.payload.selected_storage_mode === 'selected_storage', 'selected storage mode should persist');
  assert(result.readback.payload.selected_database_path === selectedDbPath, 'selected DB path should persist');
  assert(result.readback.payload.budget_bytes === 10 * 1024 * 1024 * 1024, 'operator-selected budget should persist');
  assert(result.readback.payload.suggested_default_budget_bytes === 5 * 1024 * 1024 * 1024, '5GB suggestion should be visible');
  assert(result.readback.payload.suggested_default_budget_is_acceptance === false, '5GB suggestion must not be hidden acceptance');
  assert(result.readback_posture.storage_authority_mode === 'selected_storage', 'readback posture should preserve selected storage');
  assert(result.readback_posture.selected === true, 'readback posture should mark selected storage only for selected mode');
  assert(result.readback_posture.budget_state === 'within_budget', 'readback posture should use explicit operator budget');
  assert(result.forged_renderer_readback.renderer_payload_ignored === true, 'forged renderer readback should ignore payload claims');
  assert(result.provider_calls === 0, 'real config write should not call providers');
  assert(result.queue_dispatches === 0, 'real config write should not dispatch queues');
  assert(result.evidence_writes === 0, 'real config write should not write Evidence/EVEidence');
  assert(result.hydration_writes === 0, 'real config write should not write Hydration');
  assert(result.schema_changes === 0, 'real config write should not change schema');
  assert(result.storage_movement === false, 'real config write should not move storage');
  assert(fs.existsSync(targetPath), 'fixture real-config target should be written');

  const trustedReadback = await invokeServiceCommand('storage.authority_config.readback', {}, {
    db,
    storageAuthorityConfigReadPath: targetPath,
    storageAuthorityConfigAllowedRoot: path.join(root, 'real-config-fixture')
  });
  assert(trustedReadback.persisted_config.status === 'read', 'trusted fixture readback should read written config');
  assert(trustedReadback.storage_authority.mode === 'selected_storage', 'trusted readback should expose selected storage');
  assert(trustedReadback.readback_posture.selected === true, 'trusted readback posture should preserve selected storage');

  await assertRejects(
    () => invokeServiceCommand('storage.authority_config.write', {
      storageAuthority: {
        mode: 'selected_storage',
        selected: true,
        budget_bytes: 1
      },
      storageConfigPath: targetPath
    }, {
      db,
      source: 'renderer',
      allowStorageAuthorityConfigWrite: true,
      allowStorageAuthorityConfigFixtureTarget: true,
      storageAuthorityConfigWriteTargetPath: targetPath,
      storageAuthorityConfigAllowedRoot: root
    }),
    'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
    'renderer should not be eligible for real storage config write'
  );

  return {
    write: result,
    missing_readback: missingReadback,
    trusted_readback: trustedReadback
  };
}

async function verifySelectedStorageWrite(db, root) {
  const targetPath = path.join(root, 'selected-config', 'storage-authority.json');
  const readout = await invokeServiceCommand('storage.authority_config.write_proof', {
    storagePreflight: fixturePreflight({
      mode: 'configured',
      source: 'configured',
      path: path.join(root, 'selected', 'atlas.sqlite'),
      exists: true
    }),
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      config_source: 'fixture_explicit_selection',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  }, trustedWriteContext(db, root, targetPath));

  assert(readout.would_write === true, 'selected storage should write in fixture proof');
  assert(readout.write.status === 'written_atomically', 'selected storage should use atomic write status');
  assert(readout.write.temp_exists_after_rename === false, 'staged temp file should be gone after rename');
  assert(readout.readback.status === 'read_back_verified', 'selected storage should read back written config');
  assert(readout.readback.matches_payload === true, 'selected storage readback should match payload');
  assert(readout.payload.dry_run === false, 'written proof payload should not be marked dry-run');
  assert(readout.payload.write_proof === true, 'written proof payload should carry write proof marker');
  assert(readout.payload.selected_storage_mode === 'selected_storage', 'selected storage mode should be preserved');
  assert(readout.payload.budget_bytes === 4096, 'budget bytes should be preserved');
  assert(readout.default_production_target_path === path.join(projectRoot(), 'config', 'storage-authority.json'), 'production target should be derived from project config root');
  assert(readout.target_path === targetPath, 'fixture target should be used only from trusted context');
  assert(fs.existsSync(targetPath), 'fixture config file should exist after proof write');
  return readout;
}

async function verifyAcknowledgedFallbackWrite(db, root) {
  const targetPath = path.join(root, 'fallback-config', 'storage-authority.json');
  const readout = await invokeServiceCommand('storage.authority_config.write_proof', {
    storagePreflight: fixturePreflight({
      mode: 'fallback',
      source: 'fallback',
      path: path.join(root, 'fallback', 'atlas.sqlite'),
      exists: true
    }),
    storageAuthority: {
      mode: 'app_local_fallback_acknowledged',
      fallback_available: true,
      acknowledgement_status: 'acknowledged',
      acknowledgement_basis: 'fixture operator accepted app-local fallback',
      config_source: 'fixture_acknowledgement',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  }, trustedWriteContext(db, root, targetPath));

  assert(readout.would_write === true, 'acknowledged fallback should write in fixture proof');
  assert(readout.payload.selected_storage_mode === 'app_local_fallback_acknowledged', 'fallback mode should remain distinct');
  assert(readout.payload.fallback_acknowledgement.status === 'acknowledged', 'fallback acknowledgement should be preserved');
  assert(readout.readback.matches_payload === true, 'acknowledged fallback readback should match payload');
  return readout;
}

async function verifyBlockedStates(db, root) {
  const invalidated = await blockedWrite(db, root, 'invalidated', {
    storagePreflight: fixturePreflight({
      mode: 'fallback',
      source: 'fallback',
      path: path.join(root, 'invalidated', 'atlas.sqlite'),
      exists: true
    }),
    storageAuthority: {
      mode: 'acknowledgement_invalidated',
      fallback_available: true,
      acknowledgement_status: 'invalidated',
      acknowledgement_basis: 'fixture previous acknowledgement',
      acknowledgement_invalid_reason: 'app path changed',
      config_source: 'fixture_acknowledgement',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  });
  const budgetMissing = await blockedWrite(db, root, 'budget-missing', {
    storagePreflight: fixturePreflight({
      mode: 'configured',
      source: 'configured',
      path: path.join(root, 'budget-missing', 'atlas.sqlite'),
      exists: true
    }),
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      config_source: 'fixture_explicit_selection',
      config_version: 1
    }
  }, { storageBudgetBytes: null });

  assert(invalidated.validation_result.issues.includes('fallback_acknowledgement_invalidated'), 'invalidated acknowledgement should block write proof');
  assert(budgetMissing.validation_result.issues.includes('budget_required_for_provider_backed_work'), 'missing budget should block write proof');

  return {
    acknowledgement_invalidated: compactWrite(invalidated),
    budget_missing_provider_backed: compactWrite(budgetMissing)
  };
}

async function blockedWrite(db, root, name, payload, options = {}) {
  const targetPath = path.join(root, `${name}-config`, 'storage-authority.json');
  const readout = await invokeServiceCommand('storage.authority_config.write_proof', payload, trustedWriteContext(db, root, targetPath, options));
  assert(readout.would_write === false, `${name} should not write`);
  assert(readout.write === null, `${name} should not have write result`);
  assert(readout.readback === null, `${name} should not have readback`);
  assert(!fs.existsSync(targetPath), `${name} should not create fixture config`);
  return readout;
}

async function verifyUnsafePathRejection(db, root) {
  const targetPath = path.join(root, 'outside-allowed', 'storage-authority.json');
  const allowedRoot = path.join(root, 'safe-config-root');
  const readout = await invokeServiceCommand('storage.authority_config.write_proof', {
    storagePreflight: fixturePreflight({
      mode: 'configured',
      source: 'configured',
      path: path.join(root, 'unsafe', 'atlas.sqlite'),
      exists: true
    }),
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      config_source: 'fixture_explicit_selection',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  }, {
    ...trustedWriteContext(db, root, targetPath),
    storageConfigWriteAllowedRoot: allowedRoot
  });

  assert(readout.would_write === false, 'unsafe target should not write');
  assert(readout.validation_result.issues.includes('target_path_outside_allowed_config_root'), 'unsafe target should expose path block');
  assert(!fs.existsSync(targetPath), 'unsafe target file should not be created');
  return readout;
}

async function verifyMissingAllowedRootRejection(db, root) {
  const targetPath = path.join(root, 'missing-allowed-root', 'storage-authority.json');
  const readout = await invokeServiceCommand('storage.authority_config.write_proof', {
    storagePreflight: fixturePreflight({
      mode: 'configured',
      source: 'configured',
      path: path.join(root, 'missing-allowed-root', 'atlas.sqlite'),
      exists: true
    }),
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      config_source: 'fixture_explicit_selection',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  }, {
    db,
    allowStorageSetupGateFixtureInput: true,
    allowStorageConfigWriteProof: true,
    allowStorageConfigWriteFixtureTarget: true,
    storageConfigWriteTargetPath: targetPath,
    storageBudgetBytes: 4096
  });

  assert(readout.would_write === false, 'fixture target without explicit allowed root should not write');
  assert(readout.validation_result.issues.includes('trusted_allowed_root_required_for_write_proof'), 'missing allowed root should be visible');
  assert(!fs.existsSync(targetPath), 'missing allowed root should not create fixture config');
  return readout;
}

async function verifyRendererCannotInvokeWriteProof(db, root) {
  const rendererTarget = path.join(root, 'renderer-forged', 'storage-authority.json');
  await assertRejects(
    () => invokeServiceCommand('storage.authority_config.write_proof', {
      storageConfigWriteTargetPath: rendererTarget,
      storageAuthority: {
        mode: 'app_local_fallback_acknowledged',
        acknowledgement_status: 'acknowledged',
        budget_bytes: 1
      }
    }, {
      db,
      source: 'renderer',
      storageConfigWriteTargetPath: rendererTarget,
      allowStorageConfigWriteProof: true,
      allowStorageConfigWriteFixtureTarget: true
    }),
    'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
    'renderer should not be eligible for storage config write proof command'
  );
  assert(!fs.existsSync(rendererTarget), 'renderer-origin payload should not create forged config file');
}

function verifyCommandRegistration() {
  const commands = listServiceCommands();
  const command = commands.find((entry) => entry.command === 'storage.authority_config.write_proof');
  const readback = commands.find((entry) => entry.command === 'storage.authority_config.readback');
  const write = commands.find((entry) => entry.command === 'storage.authority_config.write');
  assert(command, 'storage authority config write proof should be listed');
  assert(command.classification === 'metadata-only', 'write proof should be metadata-only');
  assert(command.effects.includes('local-data-mutation'), 'write proof should declare local mutation effect');
  assert(command.renderer_allowed === false, 'write proof should not be renderer eligible');
  assert(readback, 'storage authority config readback should be listed');
  assert(readback.classification === 'read-only', 'real config readback should be read-only');
  assert(readback.renderer_allowed === true, 'real config readback should be renderer eligible');
  assert(write, 'storage authority config write should be listed');
  assert(write.classification === 'metadata-only', 'real config write should be metadata-only');
  assert(write.effects.includes('local-data-mutation'), 'real config write should declare local mutation');
  assert(write.renderer_allowed === false, 'real config write should not be renderer eligible');
}

function trustedWriteContext(db, root, targetPath, options = {}) {
  const context = {
    db,
    allowStorageSetupGateFixtureInput: true,
    allowStorageConfigWriteProof: true,
    allowStorageConfigWriteFixtureTarget: true,
    storageConfigWriteTargetPath: targetPath,
    storageConfigWriteAllowedRoot: root
  };
  if (options.storageBudgetBytes !== null) {
    context.storageBudgetBytes = options.storageBudgetBytes || 4096;
  }
  return context;
}

function fixturePreflight({
  mode,
  source,
  path: dbPath,
  exists
}) {
  const parentPath = dbPath ? path.dirname(dbPath) : null;
  return {
    action: 'storage.authority_preflight',
    read_only: true,
    mutates_state: false,
    database: {
      path: dbPath,
      source,
      mode,
      mode_flags: {
        configured: source === 'configured',
        fallback: source !== 'configured',
        missing: !exists,
        outside_policy: false,
        demo_fixture: false
      },
      parent: {
        path: parentPath,
        exists: exists !== false,
        is_directory: exists !== false && Boolean(parentPath)
      },
      exists: exists === true,
      total_bytes: 32
    },
    snapshot: {
      settings: {
        status: 'ready'
      }
    },
    byte_usage: {
      database_bytes: 32,
      known_controlled_locations_bytes: 96
    }
  };
}

function compactWrite(readout) {
  return {
    would_write: readout.would_write,
    target_path_basis: readout.target_path_basis,
    path_allowed: readout.path_allowed,
    validation_status: readout.validation_result.status,
    issues: readout.validation_result.issues,
    write_status: readout.write?.status || null,
    readback_status: readout.readback?.status || null,
    readback_matches_payload: readout.readback?.matches_payload ?? null,
    enforcement_state: readout.enforcement_state
  };
}

function compactRealConfig(result) {
  return {
    missing_readback_status: result.missing_readback.persisted_config.status,
    default_config_path: result.write.default_config_path,
    write_target_basis: result.write.target_path_basis,
    would_write: result.write.would_write,
    validation_status: result.write.validation_result.status,
    write_status: result.write.write?.status || null,
    readback_matches_payload: result.write.readback?.matches_payload ?? null,
    selected_storage_mode: result.write.readback?.payload?.selected_storage_mode || null,
    budget_bytes: result.write.readback?.payload?.budget_bytes || null,
    suggested_default_budget_bytes: result.write.readback?.payload?.suggested_default_budget_bytes || null,
    suggested_default_budget_is_acceptance: result.write.readback?.payload?.suggested_default_budget_is_acceptance,
    readback_posture: result.write.readback_posture,
    provider_calls: result.write.provider_calls,
    queue_dispatches: result.write.queue_dispatches,
    evidence_writes: result.write.evidence_writes,
    hydration_writes: result.write.hydration_writes,
    real_config_write: result.write.real_config_write
  };
}

async function assertRejects(fn, expectedCode, message) {
  try {
    await fn();
  } catch (error) {
    if (error.code === expectedCode) {
      return error;
    }
    throw new Error(`${message}; expected ${expectedCode}, got ${error.code || error.message}`);
  }
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
