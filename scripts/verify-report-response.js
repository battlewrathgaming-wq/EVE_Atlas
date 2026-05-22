const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { buildReportResponse } = require('../src/main/services/reportResponseService');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  seedSystem(db);
  seedEntity(db);
  const runId = seedEvidence(db);

  try {
    const actor = buildReportResponse(db, {
      reportType: 'actor',
      params: {
        entityType: 'character',
        entityId: 90000002,
        entityName: 'Atlas Scout'
      }
    });
    assert(actor.report_type === 'actor', 'actor response should include report type');
    assert(actor.response_mode === 'native-structured', 'actor response should use native structured mode');
    assert(actor.scope.report_type === 'actor', 'actor response should include scope');
    assert(actor.scope.evidence_window.label === 'all stored evidence', 'actor response should include evidence window label');
    assert(actor.evidence_basis.lines.some((line) => line.includes('Stored evidence matching this scope')), 'actor response should include native evidence basis lines');
    assert(actor.collection_provenance.text.includes('Collection provenance'), 'actor response should include collection provenance text');
    assert(actor.observations.sections.some((section) => section.name === 'Actor Role Split'), 'actor response should include observation sections');
    const timeline = actor.observations.sections.find((section) => section.name === 'Recent Timeline');
    assert(timeline.rows.some((row) => row.raw.killmail_id === 7001), 'actor response should include native timeline rows');
    assert(timeline.rows.some((row) => row.values.Killmail === 7001), 'actor response should include rendered timeline values');
    assert(actor.raw_ids.character_ids.includes(90000002), 'actor response should preserve character ID');
    assert(actor.raw_ids.solar_system_ids.includes(30000001), 'actor response should preserve system ID');
    assert(actor.raw_ids.type_ids.includes(603), 'actor response should preserve type ID');
    assert(actor.labels.some((label) => label.label === 'Atlas Scout' && label.id === 90000002), 'actor response should include display label');
    assert(actor.text.includes('AURA Atlas Actor Evidence Report'), 'actor response should retain text output');

    const run = buildReportResponse(db, {
      reportType: 'run',
      params: { runId }
    });
    assert(run.report_type === 'run', 'run response should include run report type');
    assert(run.collection_provenance.text.includes('zKill refs discovered'), 'run response should include collection provenance');
    assert(run.evidence_basis.text.includes('Source: zKill discovery + ESI expanded killmails'), 'run response should include run evidence basis');

    const commands = listServiceCommands();
    assert(commands.some((entry) => entry.command === 'report.actor' && entry.classification === 'read-only'), 'report.actor should be read-only service command');
    const serviceActor = await invokeServiceCommand('report.actor', {
      params: {
        entityType: 'character',
        entityId: 90000002,
        entityName: 'Atlas Scout'
      }
    }, { db });
    assert(serviceActor.raw_ids.character_ids.includes(90000002), 'service report actor should preserve IDs');
  } finally {
    closeDatabase(db);
  }

  console.log('report response contract verified');
}

function seedEvidence(db) {
  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'actor',
    watchId: 'actor:character:90000002'
  });
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{
      raw: {
        ...fixtureKillmail,
        killmail_id: 7001,
        killmail_time: '2026-05-01T20:01:00Z',
        solar_system_id: 30000001
      },
      hash: 'fixture_hash_7001'
    }],
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
  const result = repository.persistEvidencePackage(pkg);
  repository.insertApiRequestLog({
    run_id: run.run_id,
    provider: 'zkill',
    endpoint: 'https://zkillboard.com/api/characterID/90000002/pastSeconds/86400/',
    method: 'GET',
    status_code: 200,
    duration_ms: 1,
    cache_status: 'fixture',
    requested_at: new Date().toISOString()
  });
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: 1,
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten,
    api_calls_zkill: 1,
    api_calls_esi: 1
  }, 'success', null);
  return run.run_id;
}

function seedSystem(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
}

function seedEntity(db) {
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run('character', 90000002, 'Atlas Scout', '2026-05-01T20:01:00Z', '2026-05-01T20:01:00Z');
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
