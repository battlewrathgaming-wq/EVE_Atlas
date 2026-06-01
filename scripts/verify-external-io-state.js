const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const root = path.join(projectRoot(), '.tmp', 'external-io-state-fixture');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
  const realConfigPath = path.join(projectRoot(), 'config', 'external-io-state.json');
  const realConfigExistedBefore = fs.existsSync(realConfigPath);

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const offProof = await verifyPersistence(db, root, 'off');
    const onProof = await verifyPersistence(db, root, 'enabled');
    const blocked = await verifyBlockedInputs(db, root);
    const renderer = await verifyRendererCannotForge(db, root);
    verifyCommandRegistration();

    const realConfigExistedAfter = fs.existsSync(realConfigPath);
    assert(realConfigExistedAfter === realConfigExistedBefore, 'real project External I/O config existence should not change');

    console.log(JSON.stringify({
      status: 'external io state persistence proof verified',
      sample_off: compactProof(offProof),
      sample_on: compactProof(onProof),
      sample_blocked: blocked,
      sample_renderer_readout: renderer,
      real_project_config_exists_before: realConfigExistedBefore,
      real_project_config_exists_after: realConfigExistedAfter,
      boundary: onProof.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function verifyPersistence(db, root, requestedState) {
  const targetPath = path.join(root, requestedState, 'external-io-state.json');
  const proof = await invokeServiceCommand('external_io.state_persistence_proof', {
    state: requestedState,
    path: 'C:\\renderer-style-forged-path',
    acknowledgement: 'ignored fixture payload field',
    budgetBytes: 1
  }, trustedContext(db, root, targetPath));

  assert(proof.validation_result.valid === true, `${requestedState} proof should be valid`);
  assert(proof.would_write === true, `${requestedState} proof should write fixture state`);
  assert(proof.write.status === 'written_atomically', `${requestedState} proof should write atomically`);
  assert(proof.write.temp_exists_after_rename === false, `${requestedState} temp file should be removed`);
  assert(proof.readback.matches_payload === true, `${requestedState} readback should match payload`);
  assert(proof.normalized_state === (requestedState === 'enabled' ? 'on' : requestedState), `${requestedState} should normalize`);
  assert(proof.readout.state === proof.normalized_state, `${requestedState} readout should return persisted state`);
  assert(proof.readout.path_allowed === true, `${requestedState} readout should use allowed fixture path`);
  assert(proof.readout.read_allowed === true, `${requestedState} readout should read trusted fixture path`);
  assert(proof.readout.on_is_authorization === false, `${requestedState} should not authorize execution`);
  assert(proof.readout.catch_up_flood === false, `${requestedState} should not catch up flood`);
  assert(proof.readout.immediate_dispatch === false, `${requestedState} should not dispatch immediately`);
  assert(proof.forged_renderer_readout.renderer_payload_ignored === true, 'proof should demonstrate renderer payload ignored');
  assert(proof.forged_renderer_readout.state === 'off', 'renderer forged readout should fall back to safe off');
  assert(fs.existsSync(targetPath), `${requestedState} fixture target should exist`);
  return proof;
}

async function verifyBlockedInputs(db, root) {
  const invalidState = await blockedProof(db, root, 'invalid-state', 'maybe');
  const unsafePath = await invokeServiceCommand('external_io.state_persistence_proof', {
    state: 'on'
  }, {
    ...trustedContext(db, root, path.join(root, 'outside-allowed', 'external-io-state.json')),
    externalIoStateAllowedRoot: path.join(root, 'safe-root')
  });
  const missingAllowedRoot = await invokeServiceCommand('external_io.state_persistence_proof', {
    state: 'on'
  }, {
    db,
    allowExternalIoStatePersistenceProof: true,
    allowExternalIoStateFixtureTarget: true,
    externalIoStateTargetPath: path.join(root, 'missing-root', 'external-io-state.json')
  });

  assert(invalidState.validation_result.issues.includes('invalid_external_io_state'), 'invalid state should be rejected');
  assert(unsafePath.validation_result.issues.includes('target_path_outside_allowed_external_io_root'), 'unsafe path should be rejected');
  assert(missingAllowedRoot.validation_result.issues.includes('trusted_allowed_root_required_for_external_io_state_proof'), 'missing allowed root should be rejected');
  assert(unsafePath.write === null, 'unsafe path should not write');
  assert(missingAllowedRoot.write === null, 'missing allowed root should not write');

  return {
    invalid_state: compactProof(invalidState),
    unsafe_path: compactProof(unsafePath),
    missing_allowed_root: compactProof(missingAllowedRoot)
  };
}

async function blockedProof(db, root, name, state) {
  const targetPath = path.join(root, name, 'external-io-state.json');
  const proof = await invokeServiceCommand('external_io.state_persistence_proof', {
    state
  }, trustedContext(db, root, targetPath));
  assert(proof.would_write === false, `${name} should not write`);
  assert(proof.write === null, `${name} write result should be null`);
  assert(!fs.existsSync(targetPath), `${name} target should not be created`);
  return proof;
}

async function verifyRendererCannotForge(db, root) {
  const rendererTarget = path.join(root, 'renderer-forged', 'external-io-state.json');
  await assertRejects(
    () => invokeServiceCommand('external_io.state_persistence_proof', {
      state: 'on',
      path: rendererTarget
    }, {
      db,
      source: 'renderer',
      allowExternalIoStatePersistenceProof: true,
      allowExternalIoStateFixtureTarget: true,
      externalIoStateTargetPath: rendererTarget,
      externalIoStateAllowedRoot: root
    }),
    'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
    'renderer should not be eligible for External I/O persistence proof'
  );
  assert(!fs.existsSync(rendererTarget), 'renderer-origin External I/O state should not create a file');

  const readout = await invokeServiceCommand('external_io.state_readout', {
    state: 'on',
    path: rendererTarget,
    acknowledgement: 'forged',
    budgetBytes: 1
  }, {
    db,
    source: 'renderer'
  });
  assert(readout.renderer_payload_ignored === true, 'renderer readout should ignore forged payload fields');
  assert(readout.state === 'off', 'renderer readout should not accept forged state');
  assert(readout.provider_backed_posture === 'held_by_external_io', 'renderer forged state should not release providers');
  assert(readout.persisted_state.read_allowed === false, 'renderer readout should not probe forged paths');
  assert(readout.on_is_authorization === false, 'readout should not authorize runtime work');

  return {
    state: readout.state,
    provider_backed_posture: readout.provider_backed_posture,
    renderer_payload_ignored: readout.renderer_payload_ignored,
    read_allowed: readout.persisted_state.read_allowed,
    on_is_authorization: readout.on_is_authorization
  };
}

function verifyCommandRegistration() {
  const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
  const readout = commands.get('external_io.state_readout');
  const proof = commands.get('external_io.state_persistence_proof');
  assert(readout, 'External I/O state readout should be listed');
  assert(readout.classification === 'read-only', 'External I/O state readout should be read-only');
  assert(readout.effects.includes('read-only'), 'External I/O state readout should declare read-only effect');
  assert(readout.renderer_allowed === true, 'External I/O state readout should be renderer eligible');
  assert(proof, 'External I/O state persistence proof should be listed');
  assert(proof.classification === 'metadata-only', 'External I/O state persistence proof should be metadata-only');
  assert(proof.effects.includes('local-data-mutation'), 'External I/O state persistence proof should declare fixture mutation');
  assert(proof.renderer_allowed === false, 'External I/O state persistence proof should not be renderer eligible');
}

function trustedContext(db, root, targetPath) {
  return {
    db,
    allowExternalIoStatePersistenceProof: true,
    allowExternalIoStateFixtureTarget: true,
    externalIoStateTargetPath: targetPath,
    externalIoStateAllowedRoot: root
  };
}

function compactProof(proof) {
  return {
    requested_state: proof.requested_state,
    normalized_state: proof.normalized_state,
    would_write: proof.would_write,
    validation_status: proof.validation_result.status,
    issues: proof.validation_result.issues,
    write_status: proof.write?.status || null,
    readback_matches_payload: proof.readback?.matches_payload ?? null,
    readout_state: proof.readout?.state || null,
    provider_backed_posture: proof.readout?.provider_backed_posture || null,
    on_is_authorization: proof.readout?.on_is_authorization ?? null,
    queue_dispatches: proof.queue_dispatches,
    provider_calls: proof.provider_calls,
    real_config_write: proof.real_config_write
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
