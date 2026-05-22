const baseKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { collectActorWatch } = require('../src/main/workers/actorWatchCollector');
const { buildActorReport } = require('../src/main/reports/actorReport');
const { buildQueueReport } = require('../src/main/reports/queueReport');
const { buildRunReport } = require('../src/main/reports/runReport');
const { addWatchlistEntity } = require('../src/main/watchlist/watchlistRepository');
const { resolveActorIdentity } = require('../src/main/resolution/actorResolver');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedLookupData(db);

  const atlasScout = await resolveActorIdentity(db, {
    entityType: 'character',
    entityName: 'Atlas Scout'
  });
  const atlasWing = await resolveActorIdentity(db, {
    entityType: 'character',
    entityName: 'Atlas Wing'
  });

  addWatchlistEntity(db, {
    entityType: atlasScout.entity_type,
    entityId: atlasScout.entity_id,
    entityName: atlasScout.entity_name,
    notes: 'Bulk actor workflow fixture'
  });

  const firstScoutRun = await collectActorWatch({
    entityType: atlasScout.entity_type,
    entityId: atlasScout.entity_id,
    entityName: atlasScout.entity_name,
    lookbackSeconds: 604800,
    maxRefs: 4,
    maxExpansions: 2,
    trigger: 'fixture_test',
    watchId: 'bulk:atlas-scout'
  }, {
    db,
    zkillClient: zkillFor({
      90000002: [
        { killmail_id: 5001, hash: 'bulk_hash_5001' },
        { killmail_id: 5002, hash: 'bulk_hash_5002' },
        { killmail_id: 5003, hash: 'bulk_hash_5003' },
        { killmail_id: 5004, hash: 'bulk_hash_5004' }
      ]
    }),
    esiClient: esiForBulkKillmails()
  });

  const secondScoutRun = await collectActorWatch({
    entityType: atlasScout.entity_type,
    entityId: atlasScout.entity_id,
    entityName: atlasScout.entity_name,
    lookbackSeconds: 604800,
    maxRefs: 4,
    maxExpansions: 2,
    trigger: 'fixture_test',
    watchId: 'bulk:atlas-scout'
  }, {
    db,
    zkillClient: {
      async discoverRefs() {
        throw new Error('second scout run should drain pending queue before rediscovery');
      }
    },
    esiClient: esiForBulkKillmails()
  });

  const wingRun = await collectActorWatch({
    entityType: atlasWing.entity_type,
    entityId: atlasWing.entity_id,
    entityName: atlasWing.entity_name,
    lookbackSeconds: 604800,
    maxRefs: 2,
    maxExpansions: 1,
    trigger: 'fixture_test',
    watchId: 'bulk:atlas-wing'
  }, {
    db,
    zkillClient: zkillFor({
      90000003: [
        { killmail_id: 6001, hash: 'bulk_hash_6001' },
        { killmail_id: 6002, hash: 'bulk_hash_6002' }
      ]
    }),
    esiClient: esiForBulkKillmails()
  });

  assert(firstScoutRun.zkill_refs_discovered === 4, 'first scout run should discover four refs');
  assert(firstScoutRun.expansion_attempted === 2, 'first scout run should apply two-killmail cap');
  assert(firstScoutRun.expansion_cap_skipped === 2, 'first scout run should leave two refs pending');
  assert(firstScoutRun.zkill_discovery_skipped === false, 'first scout run should perform discovery');

  assert(secondScoutRun.zkill_discovery_skipped === true, 'second scout run should drain queue without zKill');
  assert(secondScoutRun.pending_refs_considered === 2, 'second scout run should consider two pending refs');
  assert(secondScoutRun.expansion_attempted === 2, 'second scout run should expand queued refs under cap');
  assert(secondScoutRun.new_esi_expansions === 2, 'second scout run should persist next two queued killmails');

  assert(wingRun.zkill_refs_discovered === 2, 'wing run should discover its own refs');
  assert(wingRun.expansion_attempted === 1, 'wing run should use its own expansion cap');
  assert(wingRun.expansion_cap_skipped === 1, 'wing run should leave one actor-specific pending ref');

  const scoutReport = buildActorReport(db, {
    entityType: 'character',
    entityId: 90000002
  });
  assertIncludes(scoutReport, 'Actor: Atlas Scout [characterID: 90000002]');
  assertIncludes(scoutReport, 'Basis: 4 expanded killmails / 4 actor activity events matching actor/time scope');
  assertIncludes(scoutReport, 'attacker');
  assertIncludes(scoutReport, 'victim');
  assertIncludes(scoutReport, 'Atlas Prime [solarSystemID: 30000001]');
  assertIncludes(scoutReport, 'Atlas Reach [solarSystemID: 30000002]');
  assertIncludes(scoutReport, 'Merlin [typeID: 603]');
  assertIncludes(scoutReport, 'Rifter [typeID: 587]');
  assertIncludes(scoutReport, 'not proof of current location, intent, staging, ownership, or affiliation');

  const scoutQueueReport = buildQueueReport(db, {
    type: 'actor',
    id: 90000002,
    limit: 10
  });
  assertIncludes(scoutQueueReport, 'Scope: actor:90000002');
  assertIncludes(scoutQueueReport, 'Pending refs: 0');
  assertIncludes(scoutQueueReport, 'expanded');

  const wingQueueReport = buildQueueReport(db, {
    type: 'actor',
    id: 90000003,
    limit: 10
  });
  assertIncludes(wingQueueReport, 'Scope: actor:90000003');
  assertIncludes(wingQueueReport, 'Pending refs: 1');

  const secondScoutRunReport = buildRunReport(db, secondScoutRun.run_id);
  assertIncludes(secondScoutRunReport, 'AURA Atlas Run Report - PENDING REF EXPANSION');
  assertIncludes(secondScoutRunReport, 'Collection target: Atlas Scout [characterID: 90000002]');
  assertIncludes(secondScoutRunReport, 'zKill requests: 0');
  assertIncludes(secondScoutRunReport, 'Discovery Queue State');
  assertIncludes(secondScoutRunReport, 'Scope: actor:90000002');
  assertIncludes(secondScoutRunReport, 'Queued refs for scope: 4');
  assertIncludes(secondScoutRunReport, 'Pending refs after run: 0');
  assertIncludes(secondScoutRunReport, 'Next pending/failed refs: none');

  const wingRunReport = buildRunReport(db, wingRun.run_id);
  assertIncludes(wingRunReport, 'Scope: actor:90000003');
  assertIncludes(wingRunReport, 'Queued refs for scope: 2');
  assertIncludes(wingRunReport, 'Pending refs after run: 1');
  assertIncludes(wingRunReport, 'Next pending/failed refs: 6002 (pending)');

  assert(count(db, 'killmails') === 5, 'bulk workflow should persist five expanded killmails');
  assert(count(db, 'fetch_runs') === 3, 'bulk workflow should record three actor collection runs');
  assert(count(db, 'discovered_killmail_refs') === 6, 'bulk workflow should track six discovered refs');
  assert(noDuplicateEventKeys(db), 'bulk workflow should not duplicate activity event keys');
  assert(queueStatus(db, 5001) === 'expanded', 'scout first ref should be expanded');
  assert(queueStatus(db, 5004) === 'expanded', 'scout drained ref should be expanded');
  assert(queueStatus(db, 6002) === 'pending', 'wing cap-skipped ref should remain pending');

  closeDatabase(db);
  console.log('bulk actor workflow verified');
}

function seedLookupData(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)
  `).run(
    30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4,
    30000002, 'Atlas Reach', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.3
  );
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
  `).run(
    'character', 90000002, 'Atlas Scout', '2026-05-01T20:01:00Z', '2026-05-01T20:04:00Z',
    'character', 90000003, 'Atlas Wing', '2026-05-01T20:05:00Z', '2026-05-01T20:06:00Z'
  );
}

function zkillFor(refsByActorId) {
  return {
    async discoverRefs({ targetType, targetId, pastSeconds, maxRefs }) {
      assert(targetType === 'character', 'bulk actor workflow should use character discovery');
      assert(pastSeconds === 604800, 'bulk actor workflow should preserve lookback');
      return (refsByActorId[targetId] || []).slice(0, maxRefs);
    }
  };
}

function esiForBulkKillmails() {
  return {
    async expandKillmail(killmailId) {
      return bulkKillmail(killmailId);
    }
  };
}

function bulkKillmail(killmailId) {
  const scenarios = {
    5001: {
      time: '2026-05-01T20:01:00Z',
      system: 30000001,
      victim: participant('Observed Victim', 90000101, 'Victim Logistics', 98000001, 'Quiet Coalition', 99000001, 587, 'Rifter'),
      attackers: [participant('Atlas Scout', 90000002, 'Signal Cartel Test', 98000002, 'Observed Operators', 99000002, 603, 'Merlin', true)]
    },
    5002: {
      time: '2026-05-01T20:02:00Z',
      system: 30000002,
      victim: participant('Atlas Scout', 90000002, 'Signal Cartel Test', 98000002, 'Observed Operators', 99000002, 587, 'Rifter'),
      attackers: [participant('Other Hunter', 90000102, 'Hunter Corp', 98000003, 'Hunter Alliance', 99000003, 602, 'Kestrel', true)]
    },
    5003: {
      time: '2026-05-01T20:03:00Z',
      system: 30000002,
      victim: participant('Observed Victim Two', 90000103, 'Victim Logistics', 98000001, 'Quiet Coalition', 99000001, 602, 'Kestrel'),
      attackers: [participant('Atlas Scout', 90000002, 'Signal Cartel Test', 98000002, 'Observed Operators', 99000002, 603, 'Merlin', true)]
    },
    5004: {
      time: '2026-05-01T20:04:00Z',
      system: 30000001,
      victim: participant('Observed Victim Three', 90000104, 'Victim Logistics', 98000001, 'Quiet Coalition', 99000001, 587, 'Rifter'),
      attackers: [participant('Atlas Scout', 90000002, 'Signal Cartel Test', 98000002, 'Observed Operators', 99000002, 603, 'Merlin', false)]
    },
    6001: {
      time: '2026-05-01T20:05:00Z',
      system: 30000002,
      victim: participant('Observed Victim Four', 90000105, 'Victim Logistics', 98000001, 'Quiet Coalition', 99000001, 587, 'Rifter'),
      attackers: [participant('Atlas Wing', 90000003, 'Signal Cartel Test', 98000002, 'Observed Operators', 99000002, 602, 'Kestrel', true)]
    },
    6002: {
      time: '2026-05-01T20:06:00Z',
      system: 30000001,
      victim: participant('Observed Victim Five', 90000106, 'Victim Logistics', 98000001, 'Quiet Coalition', 99000001, 587, 'Rifter'),
      attackers: [participant('Atlas Wing', 90000003, 'Signal Cartel Test', 98000002, 'Observed Operators', 99000002, 602, 'Kestrel', true)]
    }
  };
  const scenario = scenarios[killmailId];
  if (!scenario) {
    throw new Error(`No bulk fixture killmail for ${killmailId}`);
  }
  return {
    ...baseKillmail,
    killmail_id: killmailId,
    killmail_time: scenario.time,
    solar_system_id: scenario.system,
    victim: scenario.victim,
    attackers: scenario.attackers
  };
}

function participant(characterName, characterId, corporationName, corporationId, allianceName, allianceId, shipTypeId, shipTypeName, finalBlow = false) {
  return {
    character_id: characterId,
    character_name: characterName,
    corporation_id: corporationId,
    corporation_name: corporationName,
    alliance_id: allianceId,
    alliance_name: allianceName,
    ship_type_id: shipTypeId,
    ship_type_name: shipTypeName,
    weapon_type_id: 2488,
    damage_done: finalBlow ? 2600 : 1200,
    damage_taken: finalBlow ? undefined : 4120,
    final_blow: finalBlow,
    security_status: -0.4
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function noDuplicateEventKeys(db) {
  const rows = db.prepare(`
    SELECT event_key, COUNT(*) AS count
    FROM activity_events
    GROUP BY event_key
    HAVING COUNT(*) > 1
  `).all();
  return rows.length === 0;
}

function queueStatus(db, killmailId) {
  return db.prepare(`
    SELECT status
    FROM discovered_killmail_refs
    WHERE killmail_id = ?
  `).get(killmailId)?.status;
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected text to include "${expected}"`);
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
