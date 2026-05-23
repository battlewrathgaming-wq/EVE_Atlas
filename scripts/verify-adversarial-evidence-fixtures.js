const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');
const { discoverManualRefs } = require('../src/main/workers/manualDiscoveryWorker');
const { buildQueueExpansionSelection } = require('../src/main/services/queueSelectionService');
const { buildActorReport, buildActorReportModel } = require('../src/main/reports/actorReport');
const { buildCorpusHealthReportModel } = require('../src/main/reports/corpusHealthReport');

async function main() {
  verifyMalformedKillmailRejectsBeforeEvidenceMutation();
  verifyIncompleteAndNpcOnlyKillmailsWarnAndRemainReviewable();
  verifyRediscoveryPreservesRawEvidenceAndWarns();
  await verifyInconsistentQueueRefsRemainPossibleEvidence();
  verifyReportsExposeUncertaintyWithoutCreatingAssessmentMemory();
  console.log('adversarial evidence fixtures verified');
}

function verifyMalformedKillmailRejectsBeforeEvidenceMutation() {
  const db = openDatabase(':memory:');
  migrate(db);
  const repository = new EvidenceRepository(db);
  const before = evidenceCounts(db);
  try {
    const run = repository.createFetchRun({
      trigger: 'fixture_test',
      watchType: 'adversarial_malformed',
      watchId: 'missing-killmail-id'
    });
    assertThrows(() => evidencePackageFromExpandedKillmails({
      killmails: [{ raw: { ...fixtureKillmail, killmail_id: null }, hash: 'missing_id_hash' }],
      run: {
        run_id: run.run_id,
        source_type: 'fixture',
        source_id: 'adversarial-missing-id',
        started_at: run.started_at
      },
      discoveredBy: { type: 'fixture', id: 'missing-id' }
    }), /Cannot normalize killmail without killmail_id/, 'malformed killmail without killmail_id should reject before persistence');
    assertSame(evidenceCounts(db), before, 'malformed killmail reject must not mutate evidence tables');
  } finally {
    closeDatabase(db);
  }
}

function verifyIncompleteAndNpcOnlyKillmailsWarnAndRemainReviewable() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedLocalMetadata(db);
  const repository = new EvidenceRepository(db);

  try {
    const incomplete = {
      killmail_id: 12001,
      killmail_time: '2026-05-03T01:00:00Z',
      solar_system_id: 30000001,
      attackers: []
    };
    persistKillmail(repository, incomplete, 'hash_12001', 'adversarial_incomplete');
    assert(count(db, 'killmails') === 1, 'incomplete but identifiable ESI killmail should be stored as raw evidence');
    assert(count(db, 'activity_events') === 0, 'missing participants should not invent activity events');
    assertWarning(db, 12001, 'missing_victim');
    assertWarning(db, 12001, 'missing_attackers');

    const npcOnly = adversarialKillmail(12002, {
      victim: {
        corporation_id: 98000011,
        corporation_name: null,
        alliance_id: 99000011,
        alliance_name: null,
        ship_type_id: 603
      },
      attackers: [
        {
          corporation_id: 98000022,
          corporation_name: null,
          alliance_id: 99000022,
          alliance_name: null,
          ship_type_id: 999999,
          final_blow: true,
          damage_done: 50
        },
        {
          corporation_id: 98000022,
          corporation_name: null,
          alliance_id: 99000022,
          alliance_name: null,
          ship_type_id: 999999,
          damage_done: 25
        }
      ]
    });
    persistKillmail(repository, npcOnly, 'hash_12002', 'adversarial_npc_only');
    assertWarning(db, 12002, 'missing_attacker_character_id');
    assert(countWarnings(db, 12002, 'missing_attacker_character_id') === 2, 'NPC-only attacker rows should leave one warning per missing character ID');
    assert(duplicateEventKeys(db) === 0, 'duplicate corporation/alliance attacker appearances should not duplicate activity event keys');
    assert(countEvents(db, 12002, 'attacker', 'corporation', 98000022) === 1, 'duplicate attacker corporation should collapse to one event');
    assert(countEvents(db, 12002, 'attacker', 'alliance', 99000022) === 1, 'duplicate attacker alliance should collapse to one event');

    const health = buildCorpusHealthReportModel(db);
    assert(integrityCount(health, 'unresolved activity entity labels') > 0, 'corpus health should expose unresolved labels');
    assert(integrityCount(health, 'unresolved ship type labels') > 0, 'corpus health should expose stale or missing SDE type metadata');
    assert(warningCount(health, 'missing_attacker_character_id') === 2, 'corpus health should group NPC-only warnings');
  } finally {
    closeDatabase(db);
  }
}

function verifyRediscoveryPreservesRawEvidenceAndWarns() {
  const db = openDatabase(':memory:');
  migrate(db);
  const repository = new EvidenceRepository(db);
  try {
    const originalRaw = adversarialKillmail(12010, {
      victim: {
        character_id: 90010001,
        character_name: 'Original Victim',
        corporation_id: 98010001,
        corporation_name: 'Original Corp',
        ship_type_id: 603
      },
      attackers: [{
        character_id: 90010002,
        character_name: 'Original Attacker',
        corporation_id: 98010002,
        corporation_name: 'Original Attackers',
        ship_type_id: 587
      }]
    });
    persistKillmail(repository, originalRaw, 'hash_original_12010', 'adversarial_original');
    const original = storedKillmail(db, 12010);

    const changedRaw = {
      ...originalRaw,
      killmail_time: '2099-01-01T00:00:00Z',
      solar_system_id: 30000002,
      victim: {
        ...originalRaw.victim,
        character_name: 'Changed Victim'
      }
    };
    persistKillmail(repository, changedRaw, 'hash_changed_12010', 'adversarial_changed_rediscovery');
    const after = storedKillmail(db, 12010);

    assert(after.killmail_hash === original.killmail_hash, 'raw evidence hash should not be replaced by rediscovery');
    assert(after.killmail_time === original.killmail_time, 'raw evidence time should not be replaced by rediscovery');
    assert(after.solar_system_id === original.solar_system_id, 'raw evidence system should not be replaced by rediscovery');
    assert(after.raw_esi_payload === original.raw_esi_payload, 'rediscovery must not replace raw ESI payload');
    assert(after.raw_payload_checksum === original.raw_payload_checksum, 'rediscovery must not replace raw payload checksum');
    assertWarning(db, 12010, 'KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH');
  } finally {
    closeDatabase(db);
  }
}

async function verifyInconsistentQueueRefsRemainPossibleEvidence() {
  const db = openDatabase(':memory:');
  migrate(db);
  const zkillClient = {
    async discoverRefs() {
      return [
        previewRef(12101, 'hash_12101', 603, 2),
        previewRef(12101, 'hash_12101', 603, 2),
        { killmail_id: 12102, hash: null, preview: { killmail_time: 'bad missing hash' } },
        { killmail_id: null, hash: 'hash_missing_id', preview: { killmail_time: 'bad missing id' } },
        previewRef(12103, 'hash_12103', 999999, 0)
      ];
    }
  };

  try {
    const discovery = await discoverManualRefs({
      scope: 'actor',
      entityType: 'character',
      entityId: 90012101,
      entityName: 'Adversarial Queue Actor',
      lookbackSeconds: 86400,
      maxRefs: 5,
      trigger: 'fixture_test'
    }, { db, zkillClient });

    assert(discovery.zkill_refs_discovered === 5, 'raw zKill ref count should include malformed and duplicate candidates');
    assert(discovery.duplicate_refs_removed === 1, 'duplicate queue refs should be counted and removed');
    assert(discovery.malformed_refs_removed === 2, 'malformed queue refs should be counted and removed');
    assert(discovery.queued_refs_written === 2, 'only unique valid refs should enter possible-evidence queue');
    assert(count(db, 'killmails') === 0, 'manual discovery must not write killmail evidence');
    assert(count(db, 'activity_events') === 0, 'manual discovery must not write activity observations');

    const selection = buildQueueExpansionSelection(db, {
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90012101',
      mode: 'selected',
      killmailIds: [12101, 999999],
      maxExpansions: 5
    });
    assert(selection.evidence_boundary.includes('not killmail evidence'), 'queue selection should repeat non-evidence boundary');
    assert(selection.refs.every((ref) => ref.preview_is_evidence === false), 'queue preview fields must remain non-evidence');
    assert(selection.counts.selected_for_expansion === 1, 'inconsistent selected IDs should select only queued refs');
    assert(selection.refs.some((ref) => ref.killmail_id === 12101 && ref.selected_for_expansion), 'valid selected queued ref should be selected');
  } finally {
    closeDatabase(db);
  }
}

function verifyReportsExposeUncertaintyWithoutCreatingAssessmentMemory() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedLocalMetadata(db);
  const repository = new EvidenceRepository(db);
  try {
    const raw = adversarialKillmail(12201, {
      victim: {
        character_id: 90012201,
        corporation_id: 98012201,
        ship_type_id: 603
      },
      attackers: [{
        character_id: 90012202,
        corporation_id: 98012202,
        alliance_id: 99012202,
        ship_type_id: 999999,
        final_blow: true,
        damage_done: 10
      }]
    });
    persistKillmail(repository, raw, 'hash_12201', 'adversarial_report_uncertainty');
    const report = buildActorReport(db, {
      entityType: 'character',
      entityId: 90012202
    });
    const model = buildActorReportModel(db, {
      entityType: 'character',
      entityId: 90012202
    });

    assert(report.includes('PARTIAL SAMPLE') || report.includes('STORED EVIDENCE SAMPLE'), 'report should mark sample status');
    assert(report.includes('characterID 90012202 [unresolved]'), 'report should expose unresolved actor ID');
    assert(report.includes('typeID 999999 [unresolved]'), 'report should expose unresolved/stale SDE type label');
    assert(report.includes('not proof of current location, intent, staging, ownership, or affiliation'), 'report must avoid proof language');
    assert(model.raw_ids.killmail_ids.includes(12201), 'report model should expose raw killmail IDs for review');
    assert(count(db, 'assessment_artifacts') === 0, 'passive/report fixture paths must not create assessment memory');
  } finally {
    closeDatabase(db);
  }
}

function persistKillmail(repository, raw, hash, sourceId) {
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: sourceId,
    watchId: sourceId
  });
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{ raw, hash }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: sourceId,
      started_at: run.started_at
    },
    discoveredBy: { type: 'fixture', id: sourceId }
  });
  const result = repository.persistEvidencePackage(pkg);
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: pkg.run.discovered_refs,
    already_cached: pkg.run.already_cached,
    expanded_new: pkg.run.expanded_count,
    failed_expansions: pkg.run.failed_count,
    activity_events_written: result.eventsWritten,
    api_calls_zkill: 0,
    api_calls_esi: 0
  }, 'success', pkg.warnings.map((warning) => warning.message).join('; ') || null);
  return { run, pkg, result };
}

function adversarialKillmail(killmailId, overrides = {}) {
  return {
    killmail_id: killmailId,
    killmail_time: `2026-05-03T${String(killmailId % 24).padStart(2, '0')}:00:00Z`,
    solar_system_id: 30000001,
    victim: {
      character_id: 90000001,
      character_name: null,
      corporation_id: 98000001,
      corporation_name: null,
      alliance_id: null,
      alliance_name: null,
      ship_type_id: 603,
      ship_type_name: null,
      ...(overrides.victim || {})
    },
    attackers: overrides.attackers || [{
      character_id: 90000002,
      character_name: null,
      corporation_id: 98000002,
      corporation_name: null,
      alliance_id: 99000002,
      alliance_name: null,
      ship_type_id: 587,
      ship_type_name: null,
      final_blow: true,
      damage_done: 100
    }]
  };
}

function previewRef(killmailId, hash, shipTypeId, attackerCount) {
  return {
    killmail_id: killmailId,
    hash,
    preview: {
      killmail_time: `2026-05-03T${String(killmailId % 24).padStart(2, '0')}:30:00Z`,
      victim: { ship_type_id: shipTypeId },
      attacker_count: attackerCount,
      zkb: { totalValue: 12345 }
    }
  };
}

function seedLocalMetadata(db) {
  db.prepare(`
    INSERT INTO regions (region_id, region_name)
    VALUES (?, ?)
  `).run(10000001, 'Adversarial Region');
  db.prepare(`
    INSERT INTO constellations (constellation_id, constellation_name, region_id, region_name)
    VALUES (?, ?, ?, ?)
  `).run(20000001, 'Adversarial Constellation', 10000001, 'Adversarial Region');
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Adversarial', 20000001, 'Adversarial Constellation', 10000001, 'Adversarial Region', 0.4);
  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 25, 'Frigate', 6, 'Ship', '2026-01-01T00:00:00Z');
}

function storedKillmail(db, killmailId) {
  return db.prepare(`
    SELECT killmail_hash, killmail_time, solar_system_id, raw_esi_payload, raw_payload_checksum
    FROM killmails
    WHERE killmail_id = ?
  `).get(killmailId);
}

function evidenceCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function countEvents(db, killmailId, role, entityType, entityId) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM activity_events
    WHERE killmail_id = ? AND role = ? AND entity_type = ? AND entity_id = ?
  `).get(killmailId, role, entityType, entityId).count;
}

function duplicateEventKeys(db) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM (
      SELECT event_key
      FROM activity_events
      GROUP BY event_key
      HAVING COUNT(*) > 1
    )
  `).get().count;
}

function assertWarning(db, killmailId, warningType) {
  const row = db.prepare(`
    SELECT warning_type
    FROM data_quality_warnings
    WHERE killmail_id = ? AND warning_type = ?
  `).get(killmailId, warningType);
  assert(Boolean(row), `expected warning ${warningType} for killmail ${killmailId}`);
}

function countWarnings(db, killmailId, warningType) {
  return db.prepare(`
    SELECT COUNT(*) AS count
    FROM data_quality_warnings
    WHERE killmail_id = ? AND warning_type = ?
  `).get(killmailId, warningType).count;
}

function integrityCount(health, checkName) {
  return health.integrity.find((row) => row.check === checkName)?.count ?? 0;
}

function warningCount(health, warningType) {
  return health.warning_rows.find((row) => row.warning_type === warningType)?.count ?? 0;
}

function assertThrows(fn, expectedPattern, message) {
  try {
    fn();
  } catch (error) {
    if (!expectedPattern || expectedPattern.test(String(error.message || error))) {
      return;
    }
    throw new Error(`${message}: expected ${expectedPattern}, got ${error.message}`);
  }
  throw new Error(message);
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
