const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { HttpClient } = require('../src/main/api/httpClient');
const {
  CONFIRMATION,
  invokeServiceCommand,
  listServiceCommands,
  registerIpcServiceHandlers
} = require('../src/main/services/serviceRegistry');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
    assert(commands.get('manual.discovery')?.effects.includes('local-data-mutation'), 'manual.discovery should declare queue/local mutation effect');
    assert(commands.get('manual.discovery')?.effects.includes('external-live-api'), 'manual.discovery should declare live provider effect');
    assert(!commands.get('manual.discovery')?.effects.includes('evidence-creation'), 'manual.discovery must not claim evidence creation');
    assert(commands.get('manual.expansion')?.effects.includes('evidence-creation'), 'manual.expansion should declare evidence creation');
    assert(commands.get('external_io.state_readout')?.classification === 'read-only', 'external_io.state_readout should be read-only');
    assert(commands.get('external_io.state_readout')?.effects.includes('read-only'), 'external_io.state_readout should declare read-only effect');
    assert(commands.get('external_io.state_persistence_proof')?.classification === 'metadata-only', 'external_io.state_persistence_proof should be metadata-only');
    assert(commands.get('external_io.state_persistence_proof')?.effects.includes('local-data-mutation'), 'external_io.state_persistence_proof should declare fixture local mutation effect');
    assert(commands.get('external_io.state_config_readback')?.classification === 'read-only', 'external_io.state_config_readback should be read-only');
    assert(commands.get('external_io.state_config_readback')?.effects.includes('read-only'), 'external_io.state_config_readback should declare read-only effect');
    assert(commands.get('external_io.state_config_write')?.classification === 'metadata-only', 'external_io.state_config_write should be metadata-only');
    assert(commands.get('external_io.state_config_write')?.effects.includes('local-data-mutation'), 'external_io.state_config_write should declare local mutation effect');
    assert(commands.get('metadata.hydration')?.effects.includes('metadata-readability'), 'metadata.hydration should declare readability metadata effect');
    assert(commands.get('metadata.hydration_backlog.preview')?.classification === 'read-only', 'metadata.hydration_backlog.preview should be read-only');
    assert(commands.get('metadata.hydration_backlog.preview')?.effects.includes('read-only'), 'metadata.hydration_backlog.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_execution_policy.preview')?.classification === 'read-only', 'metadata.hydration_execution_policy.preview should be read-only');
    assert(commands.get('metadata.hydration_execution_policy.preview')?.effects.includes('read-only'), 'metadata.hydration_execution_policy.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_candidates.preview')?.classification === 'read-only', 'metadata.hydration_candidates.preview should be read-only');
    assert(commands.get('metadata.hydration_candidates.preview')?.effects.includes('read-only'), 'metadata.hydration_candidates.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_attention_lens.preview')?.classification === 'read-only', 'metadata.hydration_attention_lens.preview should be read-only');
    assert(commands.get('metadata.hydration_attention_lens.preview')?.effects.includes('read-only'), 'metadata.hydration_attention_lens.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_attention_runtime.preview')?.classification === 'read-only', 'metadata.hydration_attention_runtime.preview should be read-only');
    assert(commands.get('metadata.hydration_attention_runtime.preview')?.effects.includes('read-only'), 'metadata.hydration_attention_runtime.preview should declare read-only effect');
    assert(commands.get('metadata.local_sde_readiness.preview')?.classification === 'read-only', 'metadata.local_sde_readiness.preview should be read-only');
    assert(commands.get('metadata.local_sde_readiness.preview')?.effects.includes('read-only'), 'metadata.local_sde_readiness.preview should declare read-only effect');
    assert(commands.get('metadata.local_sde_source_posture.preview')?.classification === 'read-only', 'metadata.local_sde_source_posture.preview should be read-only');
    assert(commands.get('metadata.local_sde_source_posture.preview')?.effects.includes('read-only'), 'metadata.local_sde_source_posture.preview should declare read-only effect');
    assert(commands.get('metadata.hydration_write_fixture_proof')?.classification === 'metadata-only', 'metadata.hydration_write_fixture_proof should be metadata-only');
    assert(commands.get('metadata.hydration_write_fixture_proof')?.effects.includes('metadata-readability'), 'metadata.hydration_write_fixture_proof should declare readability metadata effect');
    assert(commands.get('sde.topology_import_rewrite_authority.proof')?.classification === 'metadata-only', 'sde topology authority proof should be metadata-only');
    assert(commands.get('sde.topology_import_rewrite_authority.proof')?.effects.includes('local-data-mutation'), 'sde topology authority proof should declare fixture local mutation effect');
    assert(commands.get('sde.inventory_import_rewrite_authority.proof')?.classification === 'metadata-only', 'sde inventory authority proof should be metadata-only');
    assert(commands.get('sde.inventory_import_rewrite_authority.proof')?.effects.includes('local-data-mutation'), 'sde inventory authority proof should declare fixture local mutation effect');
    assert(commands.get('runtime.db_snapshot.create')?.effects.includes('support-artifact'), 'snapshot create should declare support artifact effect');
    assert(commands.get('support.debug_trace_pack')?.effects.includes('support-artifact'), 'trace pack should declare support artifact effect');
    assert(commands.get('storage.authority_preflight')?.classification === 'read-only', 'storage authority preflight should be read-only');
    assert(commands.get('storage.authority_preflight')?.effects.includes('read-only'), 'storage authority preflight should declare read-only effect');
    assert(commands.get('storage.setup_gate_readout')?.classification === 'read-only', 'storage setup gate readout should be read-only');
    assert(commands.get('storage.setup_gate_readout')?.effects.includes('read-only'), 'storage setup gate readout should declare read-only effect');
    assert(commands.get('storage.authority_config.write_proof')?.classification === 'metadata-only', 'storage config write proof should be metadata-only');
    assert(commands.get('storage.authority_config.write_proof')?.effects.includes('local-data-mutation'), 'storage config write proof should declare local mutation effect');
    assert(commands.get('storage.authority_config.readback')?.classification === 'read-only', 'storage config readback should be read-only');
    assert(commands.get('storage.authority_config.readback')?.effects.includes('read-only'), 'storage config readback should declare read-only effect');
    assert(commands.get('storage.authority_config.write')?.classification === 'metadata-only', 'storage config write should be metadata-only');
    assert(commands.get('storage.authority_config.write')?.effects.includes('local-data-mutation'), 'storage config write should declare local mutation effect');
    assert(commands.get('storage.authority_config.acknowledgement_persistence_proof')?.classification === 'metadata-only', 'storage acknowledgement persistence proof should be metadata-only');
    assert(commands.get('storage.authority_config.acknowledgement_persistence_proof')?.effects.includes('local-data-mutation'), 'storage acknowledgement persistence proof should declare local mutation effect');
    assert(commands.get('storage.enforcement_dry_run.command_effect_map')?.classification === 'read-only', 'enforcement dry-run map should be read-only');
    assert(commands.get('storage.enforcement_dry_run.command_effect_map')?.effects.includes('read-only'), 'enforcement dry-run map should declare read-only effect');
    assert(commands.get('storage.composed_gate_policy.preview')?.classification === 'read-only', 'composed gate policy preview should be read-only');
    assert(commands.get('storage.composed_gate_policy.preview')?.effects.includes('read-only'), 'composed gate policy preview should declare read-only effect');
    assert(commands.get('support.gate_stack_readout')?.classification === 'read-only', 'gate stack readout should be read-only');
    assert(commands.get('support.gate_stack_readout')?.effects.includes('read-only'), 'gate stack readout should declare read-only effect');
    assert(commands.get('support.artifact_path_authority.preview')?.classification === 'read-only', 'support artifact path authority should be read-only');
    assert(commands.get('support.artifact_path_authority.preview')?.effects.includes('read-only'), 'support artifact path authority should declare read-only effect');
    assert(commands.get('support.artifact_creation_policy.preview')?.classification === 'read-only', 'support artifact creation policy should be read-only');
    assert(commands.get('support.artifact_creation_policy.preview')?.effects.includes('read-only'), 'support artifact creation policy should declare read-only effect');
    assert(commands.get('support.artifact_contents_contract.preview')?.classification === 'read-only', 'support artifact contents contract should be read-only');
    assert(commands.get('support.artifact_contents_contract.preview')?.effects.includes('read-only'), 'support artifact contents contract should declare read-only effect');
    assert(commands.get('support.artifact_writer_conformance_gap_map.preview')?.classification === 'read-only', 'support artifact writer gap map should be read-only');
    assert(commands.get('support.artifact_writer_conformance_gap_map.preview')?.effects.includes('read-only'), 'support artifact writer gap map should declare read-only effect');
    assert(commands.get('support.trace_log_redaction_policy.preview')?.classification === 'read-only', 'trace/log redaction policy should be read-only');
    assert(commands.get('support.trace_log_redaction_policy.preview')?.effects.includes('read-only'), 'trace/log redaction policy should declare read-only effect');
    assert(commands.get('support.api_request_log_redaction_readiness.preview')?.classification === 'read-only', 'API request log redaction readiness should be read-only');
    assert(commands.get('support.api_request_log_redaction_readiness.preview')?.effects.includes('read-only'), 'API request log redaction readiness should declare read-only effect');
    assert(commands.get('runtime.enforcement_boundary.preview')?.classification === 'read-only', 'runtime enforcement boundary preview should be read-only');
    assert(commands.get('runtime.enforcement_boundary.preview')?.effects.includes('read-only'), 'runtime enforcement boundary preview should declare read-only effect');
    assert(commands.get('runtime.enforcement_active_semantics.preview')?.classification === 'read-only', 'runtime active semantics preview should be read-only');
    assert(commands.get('runtime.enforcement_active_semantics.preview')?.effects.includes('read-only'), 'runtime active semantics preview should declare read-only effect');
    assert(commands.get('runtime.enforcement_hook_telemetry.readout')?.classification === 'read-only', 'runtime hook telemetry readout should be read-only');
    assert(commands.get('runtime.enforcement_hook_telemetry.readout')?.effects.includes('read-only'), 'runtime hook telemetry readout should declare read-only effect');
    assert(commands.get('task.cancel')?.classification === 'runtime-control', 'task.cancel should be runtime-control');
    assert(commands.get('task.cancel')?.effects.includes('runtime-control'), 'task.cancel should declare runtime control effect');

    assert(commands.get('manual.expansion')?.authority.confirmation_required === true, 'manual.expansion should require confirmation');
    assert(commands.get('manual.expansion')?.authority.token === CONFIRMATION.MANUAL_EXPANSION, 'manual.expansion should expose its confirmation token');

    const rendererCommands = listServiceCommands({ forRenderer: true });
    const rendererNames = new Set(rendererCommands.map((entry) => entry.command));
    assert(rendererNames.has('manual.expansion'), 'manual.expansion should be renderer eligible');
    assert(rendererNames.has('external_io.state_readout'), 'external_io.state_readout should be renderer eligible');
    assert(rendererNames.has('external_io.state_config_readback'), 'external_io.state_config_readback should be renderer eligible');
    assert(!rendererNames.has('external_io.state_config_write'), 'external_io.state_config_write should not be renderer eligible');
    assert(!rendererNames.has('external_io.state_persistence_proof'), 'external_io.state_persistence_proof should not be renderer eligible');
    assert(rendererNames.has('metadata.hydration_execution_policy.preview'), 'metadata.hydration_execution_policy.preview should be renderer eligible');
    assert(rendererNames.has('metadata.hydration_candidates.preview'), 'metadata.hydration_candidates.preview should be renderer eligible');
    assert(rendererNames.has('metadata.hydration_attention_lens.preview'), 'metadata.hydration_attention_lens.preview should be renderer eligible');
    assert(rendererNames.has('metadata.hydration_attention_runtime.preview'), 'metadata.hydration_attention_runtime.preview should be renderer eligible');
    assert(rendererNames.has('metadata.local_sde_readiness.preview'), 'metadata.local_sde_readiness.preview should be renderer eligible');
    assert(rendererNames.has('metadata.local_sde_source_posture.preview'), 'metadata.local_sde_source_posture.preview should be renderer eligible');
    assert(!rendererNames.has('metadata.hydration_write_fixture_proof'), 'metadata.hydration_write_fixture_proof should not be renderer eligible');
    assert(!rendererNames.has('sde.topology_import_rewrite_authority.proof'), 'sde topology authority proof should not be renderer eligible');
    assert(!rendererNames.has('sde.inventory_import_rewrite_authority.proof'), 'sde inventory authority proof should not be renderer eligible');
    assert(rendererNames.has('storage.authority_preflight'), 'storage authority preflight should be renderer eligible');
    assert(rendererNames.has('storage.setup_gate_readout'), 'storage setup gate readout should be renderer eligible');
    assert(!rendererNames.has('storage.authority_config.write_proof'), 'storage config write proof should not be renderer eligible');
    assert(rendererNames.has('storage.authority_config.readback'), 'storage config readback should be renderer eligible');
    assert(!rendererNames.has('storage.authority_config.write'), 'storage config write should not be renderer eligible');
    assert(!rendererNames.has('storage.authority_config.acknowledgement_persistence_proof'), 'storage acknowledgement persistence proof should not be renderer eligible');
    assert(rendererNames.has('storage.enforcement_dry_run.command_effect_map'), 'enforcement dry-run map should be renderer eligible as read-only');
    assert(rendererNames.has('storage.composed_gate_policy.preview'), 'composed gate policy preview should be renderer eligible as read-only');
    assert(rendererNames.has('support.gate_stack_readout'), 'gate stack readout should be renderer eligible');
    assert(rendererNames.has('support.artifact_path_authority.preview'), 'support artifact path authority should be renderer eligible as read-only');
    assert(rendererNames.has('support.artifact_creation_policy.preview'), 'support artifact creation policy should be renderer eligible as read-only');
    assert(rendererNames.has('support.artifact_contents_contract.preview'), 'support artifact contents contract should be renderer eligible as read-only');
    assert(rendererNames.has('support.artifact_writer_conformance_gap_map.preview'), 'support artifact writer gap map should be renderer eligible as read-only');
    assert(rendererNames.has('support.trace_log_redaction_policy.preview'), 'trace/log redaction policy should be renderer eligible as read-only');
    assert(rendererNames.has('support.api_request_log_redaction_readiness.preview'), 'API request log redaction readiness should be renderer eligible as read-only');
    assert(rendererNames.has('runtime.enforcement_boundary.preview'), 'runtime enforcement boundary preview should be renderer eligible as read-only');
    assert(rendererNames.has('runtime.enforcement_active_semantics.preview'), 'runtime active semantics preview should be renderer eligible as read-only');
    assert(rendererNames.has('runtime.enforcement_hook_telemetry.readout'), 'runtime hook telemetry readout should be renderer eligible as read-only');
    assert(rendererNames.has('runtime.db_snapshot.create'), 'snapshot create should be renderer eligible');
    assert(!rendererNames.has('sde.import.topology'), 'SDE import should not be renderer eligible');
    assert(!rendererNames.has('watch.executor.tick'), 'watch executor tick should not be renderer eligible');
    assert(!rendererNames.has('retention.preflight'), 'retention preflight should not be renderer eligible in this packet');

    await assertRejects(
      () => invokeServiceCommand('manual.expansion', { killmailIds: [9301] }, { db, enforceAuthority: true }),
      'SERVICE_CONFIRMATION_REQUIRED',
      'manual.expansion should reject direct authority-enforced invocation without confirmation'
    );
    await assertRejects(
      () => invokeServiceCommand('runtime.db_snapshot.create', {}, { db, enforceAuthority: true, databasePath: ':memory:' }),
      'SERVICE_CONFIRMATION_REQUIRED',
      'snapshot create should reject direct authority-enforced invocation without confirmation'
    );

    const ipcMain = fakeIpcMain();
    registerIpcServiceHandlers(ipcMain, () => ({
      db,
      databasePath: path.join(auraTempRoot(), 'command-authority.sqlite')
    }));
    const invoke = ipcMain.handlers.get('atlas:service:invoke');
    const list = ipcMain.handlers.get('atlas:service:list');
    const ipcList = await list();
    assert(ipcList.every((entry) => entry.renderer_allowed === true), 'IPC service list should expose renderer-eligible commands only');

    await assertRejects(
      () => invoke(null, { command: 'sde.import.topology', payload: { path: 'fixture.jsonl' } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject non-eligible commands'
    );
    await assertRejects(
      () => invoke(null, { command: 'external_io.state_persistence_proof', payload: { state: 'on' } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject External I/O persistence proof'
    );
    await assertRejects(
      () => invoke(null, { command: 'external_io.state_config_write', payload: { state: 'on' } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject External I/O config write'
    );
    await assertRejects(
      () => invoke(null, { command: 'storage.authority_config.write', payload: { storageAuthority: { mode: 'selected_storage' } } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject storage authority config write'
    );
    await assertRejects(
      () => invoke(null, { command: 'metadata.hydration_write_fixture_proof', payload: { entityIds: [90000001] } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject Hydration write fixture proof'
    );
    await assertRejects(
      () => invoke(null, { command: 'sde.topology_import_rewrite_authority.proof', payload: { sourcePath: 'fixture.zip' } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject SDE topology authority proof'
    );
    await assertRejects(
      () => invoke(null, { command: 'sde.inventory_import_rewrite_authority.proof', payload: { sourcePath: 'fixture.zip' } }),
      'SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE',
      'renderer IPC should reject SDE inventory authority proof'
    );
    await assertRejects(
      () => invoke(null, { command: 'manual.discovery', payload: { scope: 'actor', entityType: 'character', entityId: 90000002 } }),
      'SERVICE_CONFIRMATION_REQUIRED',
      'renderer IPC should reject confirmed-action command without token'
    );
    await assertRejects(
      () => invoke(null, {
        command: 'manual.discovery',
        payload: {
          scope: 'actor',
          entityType: 'character',
          entityId: 90000002,
          confirmation: CONFIRMATION.MANUAL_DISCOVERY
        }
      }),
      'LIVE_API_DISABLED',
      'renderer IPC with confirmation should proceed to live gate enforcement'
    );

    await verifyHttpNonRetryableStatus();
  } finally {
    closeDatabase(db);
  }

  console.log('command authority verified');
}

async function verifyHttpNonRetryableStatus() {
  let attempts = 0;
  const client = new HttpClient({
    userAgent: 'AURA Atlas authority verification',
    maxAttempts: 3,
    fetchImpl: async () => {
      attempts += 1;
      return {
        ok: false,
        status: 400,
        headers: {
          get: () => null
        },
        text: async () => JSON.stringify({ error: 'bad request' })
      };
    }
  });
  await assertRejects(
    () => client.json('test-provider', 'https://example.invalid/non-retryable'),
    'HTTP_STATUS_ERROR',
    'non-retryable HTTP statuses should reject'
  );
  assert(attempts === 1, `non-retryable HTTP status should not be retried; got ${attempts} attempts`);
}

function fakeIpcMain() {
  return {
    handlers: new Map(),
    handle(channel, handler) {
      this.handlers.set(channel, handler);
    }
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
