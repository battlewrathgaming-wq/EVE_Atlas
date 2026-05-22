const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedSystem(db);

  try {
    assertMutatingCommandsListed();
    await assertLiveGateBlocks(db);
    await withLiveApi(async () => {
      await verifyManualDiscoveryAndExpansionThroughService(db);
      await verifyWatchServices(db);
    });
  } finally {
    closeDatabase(db);
  }

  console.log('mutating service commands verified');
}

function assertMutatingCommandsListed() {
  const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
  assert(commands.get('manual.discovery')?.classification === 'evidence-creating', 'manual.discovery should be evidence-creating');
  assert(commands.get('manual.expansion')?.classification === 'evidence-creating', 'manual.expansion should be evidence-creating');
  assert(commands.get('actor.watch')?.classification === 'evidence-creating', 'actor.watch should be evidence-creating');
  assert(commands.get('system.radius.watch')?.classification === 'evidence-creating', 'system.radius.watch should be evidence-creating');
  assert(commands.get('metadata.hydration')?.classification === 'metadata-only', 'metadata.hydration should be metadata-only');
  assert(commands.get('sde.import.topology')?.classification === 'exclusive', 'sde.import.topology should be exclusive');
  assert(commands.get('sde.import.inventory')?.classification === 'exclusive', 'sde.import.inventory should be exclusive');
  assert(commands.get('watch.create')?.classification === 'metadata-only', 'watch.create should be metadata-only');
  assert(commands.get('watch.update')?.classification === 'metadata-only', 'watch.update should be metadata-only');
  assert(commands.get('watch.list')?.classification === 'read-only', 'watch.list should be read-only');
}

async function assertLiveGateBlocks(db) {
  await withEnv({ AURA_ATLAS_LIVE_API: null }, async () => {
    const task = await invokeServiceCommand('manual.discovery', {
      scope: 'actor',
      entityType: 'character',
      entityId: 90000002
    }, { db, asTask: true, zkillClient: fakeZkillClient([]) });
    assert(task.status === 'failed', 'manual.discovery task should fail while live API gate is disabled');
    assert(task.error.code === 'LIVE_API_DISABLED', 'manual.discovery task should report live gate blocker');
  });
}

async function verifyManualDiscoveryAndExpansionThroughService(db) {
  const zkillCalls = [];
  const esiCalls = [];
  const zkillClient = fakeZkillClient([
    ref(91001, 'hash_91001'),
    ref(91002, 'hash_91002')
  ], zkillCalls);
  const esiClient = {
    async expandKillmail(killmailId) {
      esiCalls.push(killmailId);
      return {
        ...fixtureKillmail,
        killmail_id: killmailId,
        killmail_time: `2026-05-02T10:0${killmailId - 91000}:00Z`,
        solar_system_id: 30000001
      };
    }
  };

  const discoveryTask = await invokeServiceCommand('manual.discovery', {
    scope: 'actor',
    entityType: 'character',
    entityId: 90000002,
    entityName: 'Atlas Service Scout',
    lookbackSeconds: 86400,
    maxRefs: 2
  }, { db, asTask: true, zkillClient });
  assert(discoveryTask.status === 'succeeded', 'manual.discovery service task should succeed');
  assert(discoveryTask.classification === 'evidence-creating', 'manual.discovery task should carry evidence-creating classification');
  assert(zkillCalls.length === 1, 'manual.discovery service should call zKill once');
  assert(esiCalls.length === 0, 'manual.discovery service must not call ESI');
  assert(count(db, 'discovered_killmail_refs') === 2, 'manual.discovery service should queue refs');
  assert(count(db, 'killmails') === 0, 'manual.discovery service should not write killmails');

  const expansionTask = await invokeServiceCommand('manual.expansion', {
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000002',
    maxExpansions: 1
  }, { db, asTask: true, esiClient });
  assert(expansionTask.status === 'succeeded', 'manual.expansion service task should succeed');
  assert(expansionTask.classification === 'evidence-creating', 'manual.expansion task should carry evidence-creating classification');
  assertSame(esiCalls, [91001], 'manual.expansion service should expand one queued ref under cap');
  assert(count(db, 'killmails') === 1, 'manual.expansion service should write one killmail');
  assert(count(db, 'activity_events') > 0, 'manual.expansion service should write activity events');

  const queueRows = db.prepare(`
    SELECT status
    FROM discovered_killmail_refs
    WHERE discovered_by_type = 'manual_actor'
    ORDER BY killmail_id
  `).all().map((row) => row.status);
  assertSame(queueRows, ['expanded', 'pending'], 'manual.expansion should only update selected scoped queue ref');
}

async function verifyWatchServices(db) {
  const fetchRunsBeforeWatchAuthoring = count(db, 'fetch_runs');
  const created = await invokeServiceCommand('watch.create', {
    entityType: 'character',
    entityId: 90000002,
    entityName: 'Atlas Service Scout',
    lookbackDays: 14,
    maxKillmailsPerRun: 10
  }, { db, asTask: true });
  assert(created.status === 'succeeded', 'watch.create service task should succeed');
  assert(created.classification === 'metadata-only', 'watch.create task should carry metadata-only classification');

  const listed = await invokeServiceCommand('watch.list', {}, { db });
  assert(listed.watches.length === 1, 'watch.list should return created watch');
  assert(listed.watches[0].entity_name === 'Atlas Service Scout', 'watch.list should include watch label');
  assert(Array.isArray(listed.system_watches), 'watch.list should include system watch rows');

  const systemWatch = await invokeServiceCommand('watch.create', {
    watchType: 'system_radius',
    centerSystemId: 30000001,
    radiusJumps: 0,
    lookbackSeconds: 86400,
    maxSystems: 1,
    maxExpansions: 2,
    pollIntervalMinutes: 90,
    notes: 'Metadata-only system watch fixture'
  }, { db, asTask: true });
  assert(systemWatch.status === 'succeeded', 'system watch.create service task should succeed');
  assert(systemWatch.classification === 'metadata-only', 'system watch.create task should carry metadata-only classification');

  const afterSystem = await invokeServiceCommand('watch.list', {}, { db });
  assert(afterSystem.system_watches.length === 1, 'watch.list should return created system watch');
  assert(afterSystem.system_watches[0].center_system_id === 30000001, 'system watch should preserve center system ID');
  assert(count(db, 'fetch_runs') === fetchRunsBeforeWatchAuthoring, 'watch authoring should not create collection runs');
}

function seedSystem(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
}

function fakeZkillClient(refs, calls = []) {
  return {
    async discoverRefs(request) {
      calls.push(request);
      return refs;
    }
  };
}

function ref(killmailId, hash) {
  return {
    killmail_id: killmailId,
    hash,
    preview: {
      killmail_time: '2026-05-02T10:00:00Z',
      victim: { ship_type_id: 587 },
      attacker_count: 1,
      zkb: { totalValue: 1000 }
    }
  };
}

async function withLiveApi(callback) {
  return withEnv({ AURA_ATLAS_LIVE_API: '1' }, callback);
}

async function withEnv(values, callback) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === null) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
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
