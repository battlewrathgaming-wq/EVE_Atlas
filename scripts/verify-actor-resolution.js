const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { resolveActorIdentity } = require('../src/main/resolution/actorResolver');
const { liveActorInput } = require('./live-actor-watch-runner');

async function main() {
  await verifyIdBypassesEsi();
  await verifyTypedNameResolution();
  await verifyNoTypedMatchFails();
  await verifyMultipleTypedMatchesFail();
  await verifySystemLikeNameDoesNotResolveAsActor();
  await verifyLiveActorInputFromName();
  console.log('actor resolution verified');
}

async function verifyIdBypassesEsi() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedEntity(db, 'character', 90000002, 'Atlas Scout');
  const actor = await resolveActorIdentity(db, {
    entityType: 'character',
    entityId: 90000002
  }, {
    esiClient: {
      async resolveIds() {
        throw new Error('ID resolution should not call ESI');
      }
    }
  });
  assert(actor.entity_id === 90000002, 'ID resolution should preserve ID');
  assert(actor.entity_name === 'Atlas Scout', 'ID resolution should use cached local label');
  closeDatabase(db);
}

async function verifyTypedNameResolution() {
  const db = openDatabase(':memory:');
  migrate(db);
  const actor = await resolveActorIdentity(db, {
    entityType: 'character',
    entityName: 'Mr Jesterman'
  }, {
    esiClient: fakeEsi({
      characters: [{ id: 1329523328, name: 'Mr Jesterman' }]
    })
  });
  assert(actor.entity_id === 1329523328, 'typed name should resolve character ID');
  assert(actor.entity_name === 'Mr Jesterman', 'typed name should preserve resolved label');
  const cached = db.prepare(`
    SELECT entity_name
    FROM entities
    WHERE entity_type = ? AND entity_id = ?
  `).get('character', 1329523328);
  assert(cached.entity_name === 'Mr Jesterman', 'typed name resolution should cache entity label');
  closeDatabase(db);
}

async function verifyNoTypedMatchFails() {
  const db = openDatabase(':memory:');
  migrate(db);
  let failed = false;
  try {
    await resolveActorIdentity(db, {
      entityType: 'character',
      entityName: 'No Such Pilot'
    }, {
      esiClient: fakeEsi({ corporations: [{ id: 98000001, name: 'No Such Pilot' }] })
    });
  } catch (error) {
    failed = error.message.includes('No character found');
  }
  assert(failed, 'missing typed category should fail clearly');
  closeDatabase(db);
}

async function verifyMultipleTypedMatchesFail() {
  const db = openDatabase(':memory:');
  migrate(db);
  let failed = false;
  try {
    await resolveActorIdentity(db, {
      entityType: 'corporation',
      entityName: 'Example Corp'
    }, {
      esiClient: fakeEsi({
        corporations: [
          { id: 98000001, name: 'Example Corp' },
          { id: 98000002, name: 'Example Corp Holdings' }
        ]
      })
    });
  } catch (error) {
    failed = error.message.includes('Multiple corporation matches');
  }
  assert(failed, 'multiple typed matches should fail without choosing');
  closeDatabase(db);
}

async function verifySystemLikeNameDoesNotResolveAsActor() {
  const db = openDatabase(':memory:');
  migrate(db);
  let failed = false;
  try {
    await resolveActorIdentity(db, {
      entityType: 'character',
      entityName: 'Jita'
    }, {
      esiClient: fakeEsi({
        systems: [{ id: 30000142, name: 'Jita' }]
      })
    });
  } catch (error) {
    failed = error.message.includes('No character found');
  }
  assert(failed, 'system-like names should not resolve as actors from non-actor categories');
  closeDatabase(db);
}

async function verifyLiveActorInputFromName() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedEntity(db, 'character', 1329523328, 'Mr Jesterman');
  await withEnv({
    AURA_ATLAS_LIVE_ACTOR_TYPE: 'character',
    AURA_ATLAS_LIVE_ACTOR_NAME: 'Mr Jesterman',
    AURA_ATLAS_LIVE_ACTOR_LOOKBACK_SECONDS: '86400',
    AURA_ATLAS_LIVE_ACTOR_MAX_REFS: '10',
    AURA_ATLAS_LIVE_ACTOR_MAX_EXPANSIONS: '2'
  }, async () => {
    const input = await liveActorInput(db);
    assert(input.entityId === 1329523328, 'live actor input should resolve cached name to ID');
    assert(input.entityName === 'Mr Jesterman', 'live actor input should preserve resolved name');
  });
  closeDatabase(db);
}

function fakeEsi(result) {
  return {
    async resolveIds(names) {
      assert(Array.isArray(names) && names.length === 1, 'resolver should request one typed name');
      return result;
    }
  };
}

function seedEntity(db, entityType, entityId, entityName) {
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(entityType, entityId, entityName, '2026-05-21T00:00:00Z', '2026-05-21T00:00:00Z');
}

async function withEnv(values, callback) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    process.env[key] = value;
  }
  try {
    await callback();
  } finally {
    for (const key of Object.keys(values)) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
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
