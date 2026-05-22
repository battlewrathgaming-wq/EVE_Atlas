const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');
const { buildActorMetadataReadinessReport } = require('../src/main/reports/actorMetadataReadinessReport');

function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedActor(db);
  persistLiveLikeActorEvidence(db);

  const missing = buildActorMetadataReadinessReport(db, {
    entityType: 'character',
    entityName: 'Atlas Scout'
  });
  assertIncludes(missing, 'AURA Atlas Actor Metadata Readiness Report');
  assertIncludes(missing, 'Actor: Atlas Scout [characterID: 90000002]');
  assertIncludes(missing, 'Classification: metadata readiness is a local lookup diagnostic, not evidence and not hydration.');
  assertIncludes(missing, 'Basis: 2 expanded killmails / 2 actor activity events matching actor/time scope');
  assertIncludes(missing, 'Missing system labels: 1');
  assertIncludes(missing, 'Missing ship/type labels: 1');
  assertIncludes(missing, 'Missing event-time corporation labels: 1');
  assertIncludes(missing, 'Missing event-time alliance labels: 1');
  assertIncludes(missing, 'solarSystemID 31001765 [unresolved]');
  assertIncludes(missing, 'typeID 29984 [unresolved]');
  assertIncludes(missing, 'corporationID 98323701 [unresolved]');
  assertIncludes(missing, 'allianceID 99006113 [unresolved]');
  assertIncludes(missing, 'Import or refresh local SDE topology');
  assertIncludes(missing, 'Run explicit report-scoped entity hydration');

  seedMetadata(db);
  const ready = buildActorMetadataReadinessReport(db, {
    entityType: 'character',
    entityId: 90000002
  });
  assertIncludes(ready, 'Missing system labels: 0');
  assertIncludes(ready, 'Missing ship/type labels: 0');
  assertIncludes(ready, 'Missing event-time corporation labels: 0');
  assertIncludes(ready, 'Missing event-time alliance labels: 0');
  assertIncludes(ready, 'Ready for readable actor report: yes');
  assertIncludes(ready, 'No missing local labels detected for this actor report scope.');

  closeDatabase(db);
  console.log('actor metadata readiness verified');
}

function seedActor(db) {
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run('character', 90000002, 'Atlas Scout', '2026-05-01T20:01:00Z', '2026-05-01T20:02:00Z');
}

function persistLiveLikeActorEvidence(db) {
  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'actor',
    watchId: 'actor:character:90000002'
  });
  const packageToPersist = evidencePackageFromExpandedKillmails({
    killmails: [
      { raw: liveLikeKillmail(7001), hash: 'metadata_ready_hash_7001' },
      { raw: liveLikeKillmail(7002), hash: 'metadata_ready_hash_7002' }
    ],
    run: {
      run_id: run.run_id,
      source_type: 'actor',
      source_id: 'character:90000002',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'actor',
      id: 90000002
    }
  });
  const result = repository.persistEvidencePackage(packageToPersist);
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: 2,
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten
  }, 'success', null);
}

function liveLikeKillmail(killmailId) {
  const clone = JSON.parse(JSON.stringify({
    ...fixtureKillmail,
    killmail_id: killmailId,
    killmail_time: `2026-05-01T20:0${killmailId - 7000}:00Z`,
    solar_system_id: 31001765,
    victim: {
      character_id: 90000101,
      corporation_id: 98000001,
      alliance_id: 99000001,
      ship_type_id: 587,
      damage_taken: 4120
    },
    attackers: [{
      character_id: 90000002,
      corporation_id: 98323701,
      alliance_id: 99006113,
      ship_type_id: 29984,
      weapon_type_id: 2488,
      damage_done: 2600,
      final_blow: true,
      security_status: -1.2
    }]
  }));
  return clone;
}

function seedMetadata(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(31001765, 'J122728', 21000324, 'B-R00001', 11000001, 'Unknown Regions', -0.99);
  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(29984, 'Tengu', 963, 'Strategic Cruiser', 6, 'Ship', '2026-05-22T00:00:00Z');
  db.prepare(`
    UPDATE activity_events
    SET corporation_name = ?, alliance_name = ?
    WHERE corporation_id = ? AND alliance_id = ?
  `).run('Wormhole Operators', 'Observed Alliance', 98323701, 99006113);
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected metadata readiness report to include "${expected}"`);
  }
}

main();
