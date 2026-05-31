const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const root = path.join(projectRoot(), '.tmp', 'storage-acknowledgement-persistence-fixture');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const proof = await verifyAcknowledgementPersistence(db, root);
    const nonFallback = await verifyNonFallbackRejected(db, root);
    await verifyRendererCannotInvokeAcknowledgementProof(db, root);
    verifyCommandRegistration();

    console.log(JSON.stringify({
      status: 'storage acknowledgement persistence proof verified',
      sample_persisted_acknowledgement: compactProof(proof),
      sample_payload: compactPayload(proof.persisted_acknowledgement_payload),
      sample_readback_posture: proof.readback_posture,
      sample_invalidation: proof.invalidation,
      sample_missing_budget: proof.missing_budget,
      sample_non_fallback_rejected: compactProof(nonFallback),
      real_project_config_exists: fs.existsSync(path.join(projectRoot(), 'config', 'storage-authority.json')),
      boundary: proof.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function verifyAcknowledgementPersistence(db, root) {
  const fallbackDbPath = path.join(root, 'app-local-fallback', 'atlas.sqlite');
  const targetPath = path.join(root, 'ack-config', 'storage-authority.json');
  const proof = await invokeServiceCommand('storage.authority_config.acknowledgement_persistence_proof', {
    storagePreflight: fixturePreflight({
      mode: 'fallback',
      source: 'fallback',
      path: fallbackDbPath,
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
  }, trustedAckContext(db, root, targetPath));

  assert(proof.validation_result.status === 'acknowledgement_persistence_valid', 'acknowledgement proof should be valid');
  assert(proof.write_proof.would_write === true, 'acknowledgement proof should write fixture config');
  assert(proof.write_proof.readback_matches_payload === true, 'acknowledgement proof should read back matching payload');
  assert(proof.persisted_acknowledgement_payload.selected_storage_mode === 'app_local_fallback_acknowledged', 'persisted fallback mode should remain distinct');
  assert(proof.persisted_acknowledgement_payload.selected_storage_mode !== 'selected_storage', 'persisted fallback must not become selected storage');
  assert(proof.persisted_acknowledgement_payload.fallback_acknowledgement.status === 'acknowledged', 'acknowledgement status should persist');
  assert(proof.persisted_acknowledgement_payload.fallback_acknowledgement.provenance === 'fixture operator accepted app-local fallback', 'acknowledgement provenance should persist');
  assert(proof.persisted_acknowledgement_payload.selected_database_path === fallbackDbPath, 'fallback DB path basis should persist');
  assert(proof.persisted_acknowledgement_payload.selected_storage_root === path.dirname(fallbackDbPath), 'fallback storage root basis should persist');
  assert(proof.persisted_acknowledgement_payload.path_basis === 'app_local_current_file_fallback', 'fallback path basis should persist');
  assert(proof.persisted_acknowledgement_payload.budget_bytes === 4096, 'budget bytes should persist');
  assert(proof.persisted_acknowledgement_payload.budget_source === 'fixture_configured', 'budget source should persist');
  assert(proof.readback_posture.storage_authority_mode === 'app_local_fallback_acknowledged', 'readback posture should preserve fallback mode');
  assert(proof.readback_posture.selected === false, 'readback posture should not mark fallback as selected storage');
  assert(proof.readback_posture.fallback_acknowledged === true, 'readback posture should treat fallback as acknowledged');
  assert(proof.readback_posture.storage_state === 'configured_ready', 'acknowledged fallback should be accepted storage posture');
  assert(proof.readback_posture.write_allowed_if_enforced_later === true, 'acknowledged fallback with budget should allow future write posture');
  assert(proof.invalidation.status === 'invalidated', 'changed fallback path should invalidate acknowledgement');
  assert(proof.invalidation.comparison_basis.path_changed === true, 'invalidation should expose changed path basis');
  assert(proof.invalidation.readout.acknowledgement_status === 'invalidated', 'invalidated readout should expose invalidated acknowledgement');
  assert(proof.invalidation.readout.acknowledgement_invalid_reason === 'fallback_path_basis_changed', 'invalidation reason should be explicit');
  assert(proof.invalidation.readout.write_allowed_if_enforced_later === false, 'invalidated acknowledgement should block write posture');
  assert(proof.missing_budget.status === 'budget_required_for_provider_backed_work', 'missing budget should block provider-backed write posture');
  assert(proof.missing_budget.dry_run_would_write === false, 'missing budget should prevent write dry-run');
  assert(proof.missing_budget.provider_backed_write_posture === 'blocked_budget_required', 'missing budget should expose provider-backed write block');
  assert(proof.missing_budget.provider_backed_config_write_allowed === false, 'missing budget should not allow provider-backed config/write progression');
  assert(proof.missing_budget.provider_movement_allowed_if_enforced_later === true, 'storage acknowledgement alone should remain distinct from budget gate in authority posture');
  assert(fs.existsSync(targetPath), 'fixture acknowledgement config should be written');
  return proof;
}

async function verifyRendererCannotInvokeAcknowledgementProof(db, root) {
  const rendererTarget = path.join(root, 'renderer-forged', 'storage-authority.json');
  await assertRejects(
    () => invokeServiceCommand('storage.authority_config.acknowledgement_persistence_proof', {
      storageAuthority: {
        mode: 'app_local_fallback_acknowledged',
        acknowledgement_status: 'acknowledged',
        budget_bytes: 1
      }
    }, {
      db,
      source: 'renderer',
      allowStorageAcknowledgementPersistenceProof: true,
      allowStorageConfigWriteFixtureTarget: true,
      storageConfigWriteTargetPath: rendererTarget,
      storageConfigWriteAllowedRoot: root
    }),
    'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
    'renderer should not be eligible for acknowledgement persistence proof command'
  );
  assert(!fs.existsSync(rendererTarget), 'renderer-origin acknowledgement payload should not create forged config');
}

async function verifyNonFallbackRejected(db, root) {
  const targetPath = path.join(root, 'non-fallback-rejected', 'storage-authority.json');
  const proof = await invokeServiceCommand('storage.authority_config.acknowledgement_persistence_proof', {
    storagePreflight: fixturePreflight({
      mode: 'configured',
      source: 'configured',
      path: path.join(root, 'selected-storage', 'atlas.sqlite'),
      exists: true
    }),
    storageAuthority: {
      mode: 'selected_storage',
      selected: true,
      acknowledgement_status: 'not_required',
      config_source: 'fixture_explicit_selection',
      config_version: 1,
      budget_source: 'fixture_configured',
      budget_bytes: 4096
    }
  }, trustedAckContext(db, root, targetPath));

  assert(proof.validation_result.status === 'app_local_fallback_acknowledged_required', 'acknowledgement proof should reject selected storage input');
  assert(proof.validation_result.issues.includes('acknowledgement_status_acknowledged_required'), 'acknowledgement proof should require acknowledged status');
  assert(proof.write_proof === null, 'non-fallback input should not write');
  assert(!fs.existsSync(targetPath), 'non-fallback input should not create fixture config');
  return proof;
}

function verifyCommandRegistration() {
  const commands = listServiceCommands();
  const command = commands.find((entry) => entry.command === 'storage.authority_config.acknowledgement_persistence_proof');
  assert(command, 'storage acknowledgement persistence proof should be listed');
  assert(command.classification === 'metadata-only', 'acknowledgement proof should be metadata-only');
  assert(command.effects.includes('local-data-mutation'), 'acknowledgement proof should declare local mutation effect');
  assert(command.renderer_allowed === false, 'acknowledgement proof should not be renderer eligible');
}

function trustedAckContext(db, root, targetPath) {
  return {
    db,
    allowStorageSetupGateFixtureInput: true,
    allowStorageAcknowledgementPersistenceProof: true,
    allowStorageConfigWriteFixtureTarget: true,
    storageConfigWriteTargetPath: targetPath,
    storageConfigWriteAllowedRoot: root,
    storageBudgetBytes: 4096
  };
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

function compactProof(proof) {
  return {
    validation_status: proof.validation_result.status,
    write_status: proof.write_proof?.write_status || null,
    readback_matches_payload: proof.write_proof?.readback_matches_payload ?? null,
    storage_authority_mode: proof.readback_posture?.storage_authority_mode || null,
    selected: proof.readback_posture?.selected ?? null,
    fallback_acknowledged: proof.readback_posture?.fallback_acknowledged ?? null,
    storage_state: proof.readback_posture?.storage_state || null,
    enforcement_state: proof.enforcement_state
  };
}

function compactPayload(payload) {
  return {
    selected_storage_mode: payload.selected_storage_mode,
    selected_storage_root: payload.selected_storage_root,
    selected_database_path: payload.selected_database_path,
    path_basis: payload.path_basis,
    acknowledgement_status: payload.fallback_acknowledgement.status,
    acknowledgement_provenance: payload.fallback_acknowledgement.provenance,
    budget_bytes: payload.budget_bytes,
    budget_source: payload.budget_source
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
