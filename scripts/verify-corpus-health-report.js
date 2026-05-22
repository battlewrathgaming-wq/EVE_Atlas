const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { createAssessmentArtifact } = require('../src/main/assessment/assessmentArtifactRepository');
const { buildCorpusHealthReport, buildCorpusHealthReportModel } = require('../src/main/reports/corpusHealthReport');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);

  try {
    const beforeCounts = sideEffectCounts(db);
    const model = buildCorpusHealthReportModel(db);
    const text = buildCorpusHealthReport(db);
    const response = await invokeServiceCommand('report.corpus_health', {}, { db });
    const afterCounts = sideEffectCounts(db);

    assertSame(afterCounts, beforeCounts, 'corpus health report must be read-only');
    assert(model.report_type === 'corpus_health', 'model should identify corpus health report');
    assert(model.counts.some((row) => row.area === 'killmails' && row.rows === 1), 'health report should count killmails');
    assert(model.counts.some((row) => row.area === 'activity_events' && row.rows > 0), 'health report should count activity events');
    assert(model.counts.some((row) => row.area === 'discovered_killmail_refs' && row.rows === 2), 'health report should count queued refs');
    assert(integrityCount(model, 'duplicate activity event keys') === 0, 'activity event primary keys should have no duplicates');
    assert(integrityCount(model, 'orphan activity events without killmail') === 0, 'activity events should have matching killmails');
    assert(integrityCount(model, 'queued refs already expanded') === 1, 'expanded queue refs should be visible');
    assert(integrityCount(model, 'queued refs pending expansion') === 1, 'pending queue refs should be visible');
    assert(integrityCount(model, 'unresolved ship type labels') > 0, 'unresolved local type labels should be reported');
    assert(model.warning_rows.some((row) => row.warning_type === 'FIXTURE_WARNING'), 'data quality warnings should be grouped by type');
    assert(model.freshness.latest_fetch_run.run_id, 'latest fetch run should be reported');
    assert(model.freshness.latest_evidence_time === '2026-05-01T20:01:00Z', 'latest evidence timestamp should be reported');
    assert(model.freshness.latest_metadata_run.run_id === 'metadata_fixture', 'latest metadata run should be reported');
    assert(model.freshness.latest_sde_topology.build_number === 'fixture-build', 'latest topology build should be reported');
    assert(model.freshness.latest_sde_inventory.build_number === 'fixture-build', 'latest inventory build should be reported');
    assertIncludes(text, 'AURA Atlas Evidence Corpus Health');
    assertIncludes(text, 'It does not parse SDE zip files.');
    assertIncludes(text, 'It does not call zKill or ESI.');
    assertIncludes(text, 'It does not infer assessment or operator intent.');
    assert(response.response_mode === 'native-structured', 'service response should be native structured');
    assert(response.health.integrity.length === model.integrity.length, 'service response should include structured integrity checks');
    assert(response.boundaries.includes('It does not call zKill or ESI.'), 'service response should include API boundary');

    const commands = listServiceCommands();
    assert(commands.some((entry) => entry.command === 'report.corpus_health' && entry.classification === 'read-only'), 'corpus health service should be read-only');
  } finally {
    closeDatabase(db);
  }

  console.log('corpus health report verified');
}

function seed(db) {
  db.prepare(`
    INSERT INTO regions (region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?)
  `).run(10000001, 'Test Region', 'fixture-build', '2026-05-01T00:00:00Z');
  db.prepare(`
    INSERT INTO constellations (constellation_id, constellation_name, region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(20000001, 'Test Constellation', 10000001, 'Test Region', 'fixture-build', '2026-05-01T00:00:00Z');
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
  db.prepare(`
    INSERT INTO sde_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      systems_count, constellations_count, regions_count, adjacency_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-01T00:00:00Z', 'checksum', 1, 1, 1, 0);
  db.prepare(`
    INSERT INTO sde_inventory_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      categories_count, groups_count, types_count, type_metadata_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-01T00:00:00Z', 'checksum', 0, 0, 0, 0);
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, first_seen_at, last_seen_at, last_enriched_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('character', 90000001, 'Fixture Pilot', '2026-05-01T00:00:00Z', '2026-05-01T20:01:00Z', '2026-05-01T20:02:00Z');

  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'manual_scan',
    watchId: 'corpus-health'
  });
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [{
      raw: {
        ...fixtureKillmail,
        killmail_id: 7701,
        killmail_time: '2026-05-01T20:01:00Z',
        solar_system_id: 30000001
      },
      hash: 'fixture_hash_7701'
    }],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'corpus-health',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'fixture',
      id: 7701
    }
  });
  const result = repository.persistEvidencePackage(pkg);
  repository.insertApiRequestLog({
    run_id: run.run_id,
    provider: 'zkill',
    endpoint: 'fixture://zkill',
    method: 'GET',
    status_code: 200,
    duration_ms: 1,
    cache_status: 'fixture',
    requested_at: '2026-05-01T20:00:00Z'
  });
  repository.insertWarning(run.run_id, {
    killmail_id: 7701,
    warning_type: 'FIXTURE_WARNING',
    message: 'Fixture warning for health report grouping.',
    created_at: '2026-05-01T20:01:00Z'
  });
  repository.upsertDiscoveredKillmailRefs([
    {
      killmail_id: 7701,
      hash: 'fixture_hash_7701',
      discovered_at: '2026-05-01T20:00:00Z'
    },
    {
      killmail_id: 7702,
      hash: 'fixture_hash_7702',
      discovered_at: '2026-05-01T20:02:00Z'
    }
  ], {
    runId: run.run_id,
    discoveredByType: 'manual_system',
    discoveredById: '30000001',
    sourceSystemId: 30000001
  });
  repository.markDiscoveryRefsExpanded([{ killmail_id: 7701, hash: 'fixture_hash_7701' }]);
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: 2,
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten,
    api_calls_zkill: 1,
    api_calls_esi: 0
  }, 'success');

  const metadataRun = repository.createMetadataRun({
    runId: 'metadata_fixture',
    trigger: 'fixture_test',
    runType: 'report_actor_candidates',
    targetType: 'character',
    targetId: '90000001'
  });
  repository.finalizeMetadataRun(metadataRun.run_id, {
    ids_discovered: 1,
    already_known: 1,
    resolved: 1,
    entities_upserted: 0,
    activity_events_patched: 0,
    api_calls_esi: 0
  }, 'success');

  createAssessmentArtifact(db, {
    artifactType: 'analyst_note',
    assessmentSummary: 'Fixture analyst note for corpus health row counts.',
    assessedBy: 'fixture'
  });
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    metadata_runs: count(db, 'metadata_runs'),
    api_request_logs: count(db, 'api_request_logs')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function integrityCount(model, checkName) {
  return model.integrity.find((row) => row.check === checkName)?.count;
}

function assertIncludes(text, expected) {
  if (!text.includes(expected)) {
    throw new Error(`Expected text to include "${expected}"`);
  }
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message);
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
