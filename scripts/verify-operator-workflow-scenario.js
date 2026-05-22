const fs = require('node:fs');
const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { auraTempRoot, projectRoot } = require('../src/main/util/tempPaths');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

async function main() {
  const previousLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  const dbPath = path.join(auraTempRoot(), 'operator-workflow-scenario.sqlite');
  assertProjectLocalPath(dbPath, 'operator workflow scenario DB');
  fs.rmSync(dbPath, { force: true });

  const db = openDatabase(dbPath);
  migrate(db);
  seedLookup(db);
  const deps = {
    db,
    databasePath: dbPath,
    zkillClient: fakeZkillClient(),
    esiClient: fakeEsiClient()
  };

  try {
    const scope = await invokeServiceCommand('scope.validate', {
      kind: 'manual_discovery',
      input: {
        scope: 'actor',
        entityType: 'character',
        entityId: 90000002,
        entityName: 'Atlas Scout',
        lookbackSeconds: 604800,
        maxRefs: 2
      }
    }, deps);
    assert(scope.valid === true, 'operator scenario should begin with backend scope validation');

    const discoveryTask = await invokeServiceCommand('manual.discovery', scope.normalized, {
      ...deps,
      asTask: true
    });
    assertTaskSucceeded(discoveryTask, 'manual.discovery task should succeed');
    assert(discoveryTask.result.expansion_attempted === 0, 'manual discovery should not attempt expansion');
    assert(count(db, 'discovered_killmail_refs') === 2, 'manual discovery should queue refs');
    assert(count(db, 'killmails') === 0, 'manual discovery should not create killmail evidence');
    assert(count(db, 'activity_events') === 0, 'manual discovery should not create observations');

    const preEvidenceActorReport = await invokeServiceCommand('report.actor', {
      params: {
        entityType: 'character',
        entityId: 90000002,
        entityName: 'Atlas Scout'
      }
    }, deps);
    assert(preEvidenceActorReport.evidence_basis.evidence_range.killmail_count === 0, 'queue refs must not appear as actor report killmail observations');
    assert(preEvidenceActorReport.evidence_basis.evidence_range.activity_event_count === 0, 'queue refs must not appear as actor report activity observations');

    const queueReport = await invokeServiceCommand('report.queue', {
      type: 'manual_actor',
      id: 'character:90000002'
    }, deps);
    assertIncludes(queueReport.text, 'Classification: discovery refs are staging/provenance metadata, not killmail evidence.');

    const expansionTask = await invokeServiceCommand('manual.expansion', {
      discoveredByType: 'manual_actor',
      discoveredById: 'character:90000002',
      selectedKillmailIds: [9301],
      maxExpansions: 1,
      trigger: 'fixture_test'
    }, {
      ...deps,
      asTask: true
    });
    assertTaskSucceeded(expansionTask, 'manual.expansion task should succeed');
    assert(expansionTask.result.new_esi_expansions === 1, 'manual expansion should create ESI-backed evidence');
    assert(count(db, 'killmails') === 1, 'manual expansion should write one killmail');
    assert(count(db, 'activity_events') > 0, 'manual expansion should write activity observations');

    const hydrationTask = await invokeServiceCommand('metadata.hydration', {
      target: 'actor',
      entityType: 'character',
      entityId: 90000002,
      entityName: 'Atlas Scout'
    }, {
      ...deps,
      asTask: true
    });
    assertTaskSucceeded(hydrationTask, 'metadata.hydration task should succeed');
    assert(count(db, 'metadata_runs') > 0, 'metadata hydration should write metadata run provenance');

    const actorReport = await invokeServiceCommand('report.actor', {
      params: {
        entityType: 'character',
        entityId: 90000002,
        entityName: 'Atlas Scout'
      }
    }, deps);
    assert(actorReport.evidence_basis.evidence_range.killmail_count === 1, 'actor report should derive from stored killmail evidence');
    assert(actorReport.evidence_basis.evidence_range.activity_event_count > 0, 'actor report should derive observations from activity events');
    assert(actorReport.raw_ids.killmail_ids.includes(9301), 'actor report should expose cited raw killmail IDs');

    const assessment = await invokeServiceCommand('assessment.create', {
      artifactType: 'entity_interest',
      entityType: 'character',
      entityId: 90000002,
      entityName: 'Atlas Scout',
      assessmentReason: 'Fixture scenario preserves a scoped actor observation after explicit ESI expansion.',
      evidenceWindowStart: actorReport.evidence_basis.evidence_range.earliest,
      evidenceWindowEnd: actorReport.evidence_basis.evidence_range.latest,
      evidenceScopeType: 'actor',
      evidenceScope: actorReport.scope,
      sourceReportType: 'actor',
      sourceReportParameters: { entityType: 'character', entityId: 90000002 },
      sourceRunIds: actorReport.collection_provenance.collection.run_ids || [],
      sampleKillmailIds: actorReport.raw_ids.killmail_ids,
      appearanceCount: actorReport.evidence_basis.evidence_range.activity_event_count,
      attackerAppearanceCount: 1,
      assessedBy: 'fixture'
    }, deps);
    assert(assessment.citation.status === 'verified', 'assessment artifact should validate cited local killmail evidence');

    await assertRejects(() => invokeServiceCommand('assessment.create', {
      artifactType: 'entity_interest',
      entityType: 'character',
      entityId: 90000002,
      assessmentReason: 'This should fail because the cited killmail is not local.',
      sampleKillmailIds: [123456789]
    }, deps), 'assessment artifacts must reject non-local cited evidence');

    const artifactList = await invokeServiceCommand('assessment.list', {
      entityType: 'character',
      entityId: 90000002
    }, deps);
    assert(artifactList.artifacts.length === 1, 'assessment list should expose saved assessment memory');
    const artifactDetail = await invokeServiceCommand('assessment.get', {
      artifactId: assessment.artifact_id
    }, deps);
    assert(artifactDetail.citation.status === 'verified', 'assessment detail should preserve citation status');

    const corpusHealth = await invokeServiceCommand('report.corpus_health', {}, deps);
    assert(corpusHealth.health.counts.some((row) => row.area === 'killmails' && row.rows === 1), 'corpus health should report local evidence count');
    assert(corpusHealth.boundaries.includes('It does not call zKill or ESI.'), 'corpus health should remain support/readiness, not live work');

    const snapshotPreflight = await invokeServiceCommand('runtime.db_snapshot.preflight', {}, deps);
    assert(snapshotPreflight.read_only === true, 'snapshot preflight should be read-only support work');
    assert(!fs.existsSync(snapshotPreflight.destination_path), 'snapshot preflight should not create a snapshot file');

    const tasks = await invokeServiceCommand('task.list', { limit: 20 }, deps);
    for (const task of [discoveryTask, expansionTask, hydrationTask]) {
      const listed = tasks.find((entry) => entry.task_id === task.task_id);
      assert(listed, `task history should include ${task.type}`);
      assert(listed.status === 'succeeded', `${task.type} should be succeeded in task history`);
    }

    console.log(JSON.stringify({
      status: 'operator workflow scenario verified',
      db_path: dbPath,
      queued_refs: count(db, 'discovered_killmail_refs'),
      killmails: count(db, 'killmails'),
      activity_events: count(db, 'activity_events'),
      assessment_artifacts: count(db, 'assessment_artifacts'),
      tasks_checked: [discoveryTask.task_id, expansionTask.task_id, hydrationTask.task_id]
    }, null, 2));
  } finally {
    closeDatabase(db);
    if (previousLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = previousLive;
    }
  }
}

function fakeZkillClient() {
  return {
    async discoverRefs({ includePreview }) {
      assert(includePreview === true, 'manual discovery should request preview metadata');
      return [
        previewRef(9301, 'hash_9301', 603, 3),
        previewRef(9302, 'hash_9302', 587, 1)
      ];
    }
  };
}

function fakeEsiClient() {
  return {
    async expandKillmail(killmailId) {
      return stripNames({
        ...fixtureKillmail,
        killmail_id: killmailId,
        killmail_time: `2026-05-01T22:${String(killmailId - 9300).padStart(2, '0')}:00Z`,
        solar_system_id: 30000001
      });
    },
    async resolveNames(ids) {
      return ids.map((id) => ({
        id,
        name: nameFor(id),
        category: categoryFor(id)
      })).filter((row) => row.category);
    }
  };
}

function previewRef(killmailId, hash, shipTypeId, attackerCount) {
  return {
    killmail_id: killmailId,
    hash,
    preview: {
      killmail_time: `2026-05-01T21:${String(killmailId - 9300).padStart(2, '0')}:00Z`,
      victim: { ship_type_id: shipTypeId },
      attacker_count: attackerCount
    }
  };
}

function stripNames(killmail) {
  const clone = JSON.parse(JSON.stringify(killmail));
  for (const participant of [clone.victim, ...(clone.attackers || [])]) {
    if (!participant) {
      continue;
    }
    delete participant.character_name;
    delete participant.corporation_name;
    delete participant.alliance_name;
    delete participant.ship_type_name;
  }
  return clone;
}

function nameFor(id) {
  const names = {
    90000001: 'Scenario Victim',
    90000002: 'Atlas Scout',
    90000003: 'Atlas Wingmate',
    98000001: 'Scenario Logistics',
    98000002: 'Signal Cartel Test',
    99000001: 'Quiet Coalition',
    99000002: 'Observed Operators'
  };
  return names[id] || `Resolved ${id}`;
}

function categoryFor(id) {
  if (id >= 98000000 && id < 99000000) {
    return 'corporation';
  }
  if (id >= 99000000) {
    return 'alliance';
  }
  if (id >= 90000000) {
    return 'character';
  }
  return null;
}

function seedLookup(db) {
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
  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 25, 'Frigate', 6, 'Ship', '2026-05-22T00:00:00Z');
}

function assertTaskSucceeded(task, message) {
  assert(task.status === 'succeeded', `${message}: ${task.error?.message || task.status}`);
  assert(task.result, `${message}: missing task result`);
}

async function assertRejects(fn, message) {
  try {
    await fn();
  } catch {
    return;
  }
  throw new Error(message);
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
  if (!String(text || '').includes(expected)) {
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
