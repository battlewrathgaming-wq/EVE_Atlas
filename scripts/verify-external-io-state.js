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
    const configWrite = await verifyOperatorConfigWrite(db, root);
    const blocked = await verifyBlockedInputs(db, root);
    const renderer = await verifyRendererCannotForge(db, root);
    verifyCommandRegistration();

    const realConfigExistedAfter = fs.existsSync(realConfigPath);
    assert(realConfigExistedAfter === realConfigExistedBefore, 'real project External I/O config existence should not change');

    console.log(JSON.stringify({
      status: 'external io state persistence proof verified',
      sample_off: compactProof(offProof),
      sample_on: compactProof(onProof),
      sample_operator_config_write: compactConfigWrite(configWrite),
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

async function verifyOperatorConfigWrite(db, root) {
  const targetPath = path.join(root, 'operator-config', 'config', 'external-io-state.json');
  const result = await invokeServiceCommand('external_io.state_config_write', {
    state: 'enabled',
    path: 'C:\\renderer-style-forged-config-path',
    acknowledgement: 'ignored config payload field',
    budgetBytes: 1
  }, {
    db,
    allowExternalIoStateConfigWrite: true,
    allowExternalIoStateConfigFixtureTarget: true,
    externalIoStateConfigWriteTargetPath: targetPath,
    externalIoStateConfigAllowedRoot: path.join(root, 'operator-config')
  });

  assert(result.validation_result.valid === true, 'operator config write should be valid in trusted context');
  assert(result.would_write === true, 'operator config write should write trusted target');
  assert(result.write.status === 'written_atomically', 'operator config write should write atomically');
  assert(result.write.temp_exists_after_rename === false, 'operator config temp file should not remain');
  assert(result.readback.matches_payload === true, 'operator config readback should match payload');
  assert(result.normalized_state === 'on', 'enabled should normalize to on');
  assert(result.real_config_write === false, 'fixture verification should not write real project config');
  assert(result.readout.state === 'on', 'config readout should return written state');
  assert(result.readout.provider_backed_posture === 'released_to_normal_gates', 'on should release only to normal gates');
  assert(result.readout.on_is_authorization === false, 'on should not be authorization');
  assert(result.readout.catch_up_flood === false, 'on should not create catch-up flood');
  assert(result.readout.immediate_dispatch === false, 'on should not immediately dispatch');
  assert(result.provider_calls === 0, 'operator config write should not call providers');
  assert(result.queue_dispatches === 0, 'operator config write should not dispatch queues');
  assert(result.evidence_writes === 0, 'operator config write should not write Evidence/EVEidence');
  assert(result.hydration_writes === 0, 'operator config write should not write Hydration');
  assert(result.schema_changes === 0, 'operator config write should not change schema');
  assert(result.forged_renderer_readout.renderer_payload_ignored === true, 'operator config write should demonstrate renderer payload ignored');
  assert(fs.existsSync(targetPath), 'operator config fixture target should exist');

  const readback = await invokeServiceCommand('external_io.state_config_readback', {
    state: 'off',
    path: 'C:\\renderer-forged-readback-path'
  }, {
    db,
    source: 'renderer',
    externalIoStateReadPath: targetPath,
    externalIoStateAllowedRoot: path.join(root, 'operator-config')
  });
  assert(readback.read_only === true, 'operator config readback should be read-only');
  assert(readback.state === 'on', 'trusted readback should read persisted config state');
  assert(readback.renderer_payload_ignored === true, 'renderer readback should ignore forged payload state/path');
  assert(readback.provider_calls === 0, 'operator config readback should not call providers');
  assert(readback.filesystem_writes === 0, 'operator config readback should not write files');

  await assertRejects(
    () => invokeServiceCommand('external_io.state_config_write', {
      state: 'on',
      path: targetPath
    }, {
      db,
      source: 'renderer',
      allowExternalIoStateConfigWrite: true,
      allowExternalIoStateConfigFixtureTarget: true,
      externalIoStateConfigWriteTargetPath: targetPath,
      externalIoStateConfigAllowedRoot: root
    }),
    'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
    'renderer should not be eligible for External I/O config write'
  );

  return result;
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
  assert(readout.persisted_state.path !== rendererTarget, 'renderer readout should not accept forged path');
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
  const configReadback = commands.get('external_io.state_config_readback');
  const configWrite = commands.get('external_io.state_config_write');
  assert(readout, 'External I/O state readout should be listed');
  assert(readout.classification === 'read-only', 'External I/O state readout should be read-only');
  assert(readout.effects.includes('read-only'), 'External I/O state readout should declare read-only effect');
  assert(readout.renderer_allowed === true, 'External I/O state readout should be renderer eligible');
  assert(proof, 'External I/O state persistence proof should be listed');
  assert(proof.classification === 'metadata-only', 'External I/O state persistence proof should be metadata-only');
  assert(proof.effects.includes('local-data-mutation'), 'External I/O state persistence proof should declare fixture mutation');
  assert(proof.renderer_allowed === false, 'External I/O state persistence proof should not be renderer eligible');
  assert(configReadback, 'External I/O state config readback should be listed');
  assert(configReadback.classification === 'read-only', 'External I/O state config readback should be read-only');
  assert(configReadback.renderer_allowed === true, 'External I/O state config readback should be renderer eligible');
  assert(configWrite, 'External I/O state config write should be listed');
  assert(configWrite.classification === 'metadata-only', 'External I/O state config write should be metadata-only');
  assert(configWrite.effects.includes('local-data-mutation'), 'External I/O state config write should declare local mutation');
  assert(configWrite.renderer_allowed === false, 'External I/O state config write should not be renderer eligible');
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

function compactConfigWrite(result) {
  return {
    action: result.action,
    default_config_path: result.default_config_path,
    target_path_basis: result.target_path_basis,
    requested_state: result.requested_state,
    normalized_state: result.normalized_state,
    would_write: result.would_write,
    validation_status: result.validation_result.status,
    write_status: result.write?.status || null,
    readback_matches_payload: result.readback?.matches_payload ?? null,
    readout_state: result.readout?.state || null,
    provider_backed_posture: result.readout?.provider_backed_posture || null,
    on_is_authorization: result.readout?.on_is_authorization ?? null,
    catch_up_flood: result.readout?.catch_up_flood ?? null,
    queue_dispatches: result.queue_dispatches,
    provider_calls: result.provider_calls,
    real_config_write: result.real_config_write
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
