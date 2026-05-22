const fs = require('node:fs');
const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot, projectRoot } = require('../src/main/util/tempPaths');
const { discoverManualRefs } = require('../src/main/workers/manualDiscoveryWorker');
const { expandManualRefs } = require('../src/main/workers/manualExpansionWorker');
const { collectActorWatch } = require('../src/main/workers/actorWatchCollector');
const { collectSystemRadiusWatch } = require('../src/main/workers/systemRadiusCollector');
const { buildActorReport } = require('../src/main/reports/actorReport');
const { buildCorporationObservationReport } = require('../src/main/reports/corporationObservationReport');
const { buildRadiusReport } = require('../src/main/reports/radiusReport');
const { buildQueueReport } = require('../src/main/reports/queueReport');
const { buildActorMetadataReadinessReport } = require('../src/main/reports/actorMetadataReadinessReport');

async function main() {
  const tempRoot = auraTempRoot();
  const dbPath = path.join(tempRoot, 'controlled-workflow.sqlite');
  assertProjectLocalPath(dbPath, 'controlled workflow DB');
  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { force: true });
  }

  const db = openDatabase(dbPath);
  migrate(db);
  seedTopology(db);

  try {
    const manualDiscovery = await discoverManualRefs({
      scope: 'actor',
      entityType: 'character',
      entityId: 90000002,
      entityName: 'Atlas Scout',
      lookbackSeconds: 604800,
      maxRefs: 2,
      trigger: 'fixture_test'
    }, { db, zkillClient: manualZkillClient() });
    assert(manualDiscovery.new_esi_expansions === 0, 'manual discovery should not expand');
    assert(count(db, 'killmails') === 0, 'manual discovery should not write killmails');

    const manualExpansion = await expandManualRefs({
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      maxExpansions: 1,
      trigger: 'fixture_test'
    }, { db, esiClient: esiClient() });
    assert(manualExpansion.new_esi_expansions === 1, 'manual expansion should write one killmail');

    const actorWatch = await collectActorWatch({
      entityType: 'character',
      entityId: 90000002,
      entityName: 'Atlas Scout',
      lookbackSeconds: 604800,
      maxRefs: 3,
      maxExpansions: 1,
      trigger: 'fixture_test',
      watchId: 'controlled-actor-watch'
    }, { db, zkillClient: actorZkillClient(), esiClient: esiClient() });
    assert(actorWatch.new_esi_expansions === 1, 'actor watch should expand one uncached ref');

    const radius = await collectSystemRadiusWatch({
      centerSystemId: 30000001,
      radiusJumps: 0,
      lookbackSeconds: 86400,
      maxSystems: 1,
      maxRefsPerSystem: 2,
      maxExpansions: 1,
      maxRadius: 2,
      maxTopologySystems: 5,
      trigger: 'fixture_test',
      watchId: 'controlled-radius-watch'
    }, { db, zkillClient: systemZkillClient(), esiClient: esiClient() });
    assert(radius.new_esi_expansions === 1, 'radius watch should expand one uncached ref');

    const actorReport = buildActorReport(db, {
      entityType: 'character',
      entityId: 90000002,
      entityName: 'Atlas Scout'
    });
    const corporationReport = buildCorporationObservationReport(db, {
      entityId: 98000002,
      entityName: 'Signal Cartel Test'
    });
    const radiusReport = buildRadiusReport(db, 'Atlas Prime', { radiusJumps: 0 });
    const queueReport = buildQueueReport(db, { type: 'manual_actor', id: 'character:90000002' });
    const metadataReport = buildActorMetadataReadinessReport(db, {
      entityType: 'character',
      entityId: 90000002,
      entityName: 'Atlas Scout'
    });

    assertIncludes(actorReport, 'Evidence Basis');
    assertIncludes(actorReport, 'Manual discovery route(s): manual_actor');
    assertIncludes(corporationReport, 'Corporation Role Split');
    assertIncludes(radiusReport, 'AURA Atlas Radius Watch Evidence Report');
    assertIncludes(queueReport, 'At-a-glance values are zKill discovery preview metadata only.');
    assertIncludes(metadataReport, 'AURA Atlas Actor Metadata Readiness Report');
    assert(count(db, 'killmails') === 3, 'controlled workflow should persist three killmails');
    assert(count(db, 'activity_events') === 21, 'controlled workflow should persist three fixture event sets');
    assertNoDuplicateEventKeys(db);

    console.log(JSON.stringify({
      status: 'controlled workflow verified',
      db_path: dbPath,
      killmails: count(db, 'killmails'),
      activity_events: count(db, 'activity_events'),
      discovery_refs: count(db, 'discovered_killmail_refs'),
      fetch_runs: count(db, 'fetch_runs')
    }, null, 2));
  } finally {
    closeDatabase(db);
  }
}

function manualZkillClient() {
  return {
    async discoverRefs({ includePreview }) {
      assert(includePreview === true, 'manual discovery should request preview metadata');
      return [
        previewRef(9101, 'hash_9101', 603, 3),
        previewRef(9102, 'hash_9102', 587, 1)
      ];
    }
  };
}

function actorZkillClient() {
  return {
    async discoverRefs() {
      return [
        { killmail_id: 9101, hash: 'hash_9101' },
        { killmail_id: 9102, hash: 'hash_9102' },
        { killmail_id: 9103, hash: 'hash_9103' }
      ];
    }
  };
}

function systemZkillClient() {
  return {
    async discoverRefs() {
      return [
        { killmail_id: 9103, hash: 'hash_9103' },
        { killmail_id: 9104, hash: 'hash_9104' }
      ];
    }
  };
}

function esiClient() {
  return {
    async expandKillmail(killmailId) {
      return syntheticKillmail(killmailId);
    }
  };
}

function syntheticKillmail(killmailId) {
  return {
    ...fixtureKillmail,
    killmail_id: killmailId,
    killmail_time: `2026-05-01T21:${String(killmailId - 9100).padStart(2, '0')}:00Z`,
    solar_system_id: 30000001
  };
}

function previewRef(killmailId, hash, shipTypeId, attackerCount) {
  return {
    killmail_id: killmailId,
    hash,
    preview: {
      killmail_time: `2026-05-01T20:${String(killmailId - 9100).padStart(2, '0')}:00Z`,
      victim: { ship_type_id: shipTypeId },
      attacker_count: attackerCount
    }
  };
}

function seedTopology(db) {
  db.prepare(`
    INSERT INTO regions (region_id, region_name)
    VALUES (?, ?)
  `).run(10000001, 'Test Region');
  db.prepare(`
    INSERT INTO constellations (constellation_id, constellation_name, region_id, region_name)
    VALUES (?, ?, ?, ?)
  `).run(20000001, 'Test Constellation', 10000001, 'Test Region');
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
}

function assertNoDuplicateEventKeys(db) {
  const duplicate = db.prepare(`
    SELECT event_key, COUNT(*) AS count
    FROM activity_events
    GROUP BY event_key
    HAVING COUNT(*) > 1
    LIMIT 1
  `).get();
  assert(!duplicate, `duplicate event key found: ${duplicate?.event_key}`);
}

function assertProjectLocalPath(targetPath, label) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedProject = projectRoot();
  const relative = path.relative(resolvedProject, resolvedTarget);
  const isInsideProject = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  if (!isInsideProject) {
    throw new Error(`${label} must stay under ${resolvedProject}`);
  }
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected output to include "${expected}"`);
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
