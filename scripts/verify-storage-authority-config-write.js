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
    const blocked = await verifyBlockedStates(db, root);
    const unsafe = await verifyUnsafePathRejection(db, root);
    const missingAllowedRoot = await verifyMissingAllowedRootRejection(db, root);
    await verifyRendererCannotInvokeWriteProof(db, root);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'storage authority config write proof verified',
      sample_selected_storage: compactWrite(selected),
      sample_acknowledged_fallback: compactWrite(fallback),
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
  assert(command, 'storage authority config write proof should be listed');
  assert(command.classification === 'metadata-only', 'write proof should be metadata-only');
  assert(command.effects.includes('local-data-mutation'), 'write proof should declare local mutation effect');
  assert(command.renderer_allowed === false, 'write proof should not be renderer eligible');
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
