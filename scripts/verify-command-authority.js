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
    assert(commands.get('metadata.hydration')?.effects.includes('metadata-readability'), 'metadata.hydration should declare readability metadata effect');
    assert(commands.get('metadata.hydration_backlog.preview')?.classification === 'read-only', 'metadata.hydration_backlog.preview should be read-only');
    assert(commands.get('metadata.hydration_backlog.preview')?.effects.includes('read-only'), 'metadata.hydration_backlog.preview should declare read-only effect');
    assert(commands.get('runtime.db_snapshot.create')?.effects.includes('support-artifact'), 'snapshot create should declare support artifact effect');
    assert(commands.get('support.debug_trace_pack')?.effects.includes('support-artifact'), 'trace pack should declare support artifact effect');
    assert(commands.get('storage.authority_preflight')?.classification === 'read-only', 'storage authority preflight should be read-only');
    assert(commands.get('storage.authority_preflight')?.effects.includes('read-only'), 'storage authority preflight should declare read-only effect');
    assert(commands.get('storage.setup_gate_readout')?.classification === 'read-only', 'storage setup gate readout should be read-only');
    assert(commands.get('storage.setup_gate_readout')?.effects.includes('read-only'), 'storage setup gate readout should declare read-only effect');
    assert(commands.get('storage.authority_config.write_proof')?.classification === 'metadata-only', 'storage config write proof should be metadata-only');
    assert(commands.get('storage.authority_config.write_proof')?.effects.includes('local-data-mutation'), 'storage config write proof should declare local mutation effect');
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
    assert(commands.get('task.cancel')?.classification === 'runtime-control', 'task.cancel should be runtime-control');
    assert(commands.get('task.cancel')?.effects.includes('runtime-control'), 'task.cancel should declare runtime control effect');

    assert(commands.get('manual.expansion')?.authority.confirmation_required === true, 'manual.expansion should require confirmation');
    assert(commands.get('manual.expansion')?.authority.token === CONFIRMATION.MANUAL_EXPANSION, 'manual.expansion should expose its confirmation token');

    const rendererCommands = listServiceCommands({ forRenderer: true });
    const rendererNames = new Set(rendererCommands.map((entry) => entry.command));
    assert(rendererNames.has('manual.expansion'), 'manual.expansion should be renderer eligible');
    assert(rendererNames.has('storage.authority_preflight'), 'storage authority preflight should be renderer eligible');
    assert(rendererNames.has('storage.setup_gate_readout'), 'storage setup gate readout should be renderer eligible');
    assert(!rendererNames.has('storage.authority_config.write_proof'), 'storage config write proof should not be renderer eligible');
    assert(!rendererNames.has('storage.authority_config.acknowledgement_persistence_proof'), 'storage acknowledgement persistence proof should not be renderer eligible');
    assert(rendererNames.has('storage.enforcement_dry_run.command_effect_map'), 'enforcement dry-run map should be renderer eligible as read-only');
    assert(rendererNames.has('storage.composed_gate_policy.preview'), 'composed gate policy preview should be renderer eligible as read-only');
    assert(rendererNames.has('support.gate_stack_readout'), 'gate stack readout should be renderer eligible');
    assert(rendererNames.has('support.artifact_path_authority.preview'), 'support artifact path authority should be renderer eligible as read-only');
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
