const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { createAssessmentArtifact } = require('../src/main/assessment/assessmentArtifactRepository');
const { buildEvidencePruneExecutionFixtureProof } = require('../src/main/services/retentionActionService');
const { listServiceCommands } = require('../src/main/services/serviceRegistry');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');

async function main() {
  verifyNoProductCommand();
  verifyFixtureGuardAndDigestStops();
  verifyStalePreviewStopsBeforeDeletion();
  verifyRollbackLeavesFixtureCountsUnchanged();
  verifySuccessfulFixtureDeleteContract();
  console.log('retention prune fixture proof verified');
}

function verifyNoProductCommand() {
  const commands = listServiceCommands();
  assert(!commands.some((entry) => entry.command === 'retention.evidence_prune_execution.fixture_proof'), 'fixture proof should not be exposed as a service command');
  assert(!commands.some((entry) => entry.command === 'evidence.prune_scope'), 'product Evidence prune command should not exist');
}

function verifyFixtureGuardAndDigestStops() {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);

  try {
    const before = tableCounts(db);
    const untrusted = buildEvidencePruneExecutionFixtureProof(db, {
      scope: selectedScope()
    });
    assert(untrusted.status === 'blocked', 'fixture proof should block without fixtureOnly context');
    assert(untrusted.reason === 'fixture_only_context_required', 'fixture proof should name missing fixture-only context');
    assertSame(tableCounts(db), before, 'missing fixture context must not mutate rows');

    const preview = buildEvidencePruneExecutionFixtureProof(db, {
      fixtureOnly: true,
      candidateKillmailIds: [9102],
      scope: selectedScope()
    });
    assert(preview.status === 'preview_ready', 'fixture proof preview should be available');
    assert(preview.execution_attempted === false, 'preview should not execute deletion');
    assert(preview.source_of_candidate_ids === 'server_retention_preflight', 'candidate IDs should come from retention preflight');
    assert(preview.supplied_candidate_ids_ignored === true, 'renderer/payload candidate IDs should be ignored');
    assert(preview.preview.candidate_killmail_ids.length === 1 && preview.preview.candidate_killmail_ids[0] === 9101, 'server-side preflight should select the scoped killmail only');
    assertSame(tableCounts(db), before, 'preview must not mutate rows');

    const mismatch = buildEvidencePruneExecutionFixtureProof(db, {
      fixtureOnly: true,
      execute: true,
      scope: selectedScope(),
      confirmation: {
        previewDigest: 'not-the-current-digest'
      }
    });
    assert(mismatch.status === 'blocked', 'digest mismatch should block');
    assert(mismatch.reason === 'preview_digest_mismatch', 'digest mismatch should name reason');
    assertSame(tableCounts(db), before, 'digest mismatch must stop before deletion');

    const empty = buildEvidencePruneExecutionFixtureProof(db, {
      fixtureOnly: true,
      execute: true,
      scope: {
        killmailId: 99999999
      },
      confirmation: {
        previewDigest: preview.preview_digest
      }
    });
    assert(empty.status === 'blocked', 'empty scope should stop cleanly');
    assert(empty.reason === 'empty_scope_no_candidates', 'empty scope should name no-candidate reason');
    assertSame(tableCounts(db), before, 'empty scope must not mutate rows');
  } finally {
    closeDatabase(db);
  }
}

function verifyStalePreviewStopsBeforeDeletion() {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);

  try {
    const preview = buildEvidencePruneExecutionFixtureProof(db, {
      fixtureOnly: true,
      scope: selectedScope()
    });
    const before = tableCounts(db);
    const repository = new EvidenceRepository(db);
    repository.insertWarning('run_retention_fixture', {
      killmail_id: 9101,
      warning_type: 'late_fixture_warning',
      message: 'fixture warning added after preview to prove stale digest detection',
      created_at: '2026-05-01T20:05:00Z'
    });
    const changed = tableCounts(db);
    assert(changed.data_quality_warnings === before.data_quality_warnings + 1, 'fixture setup should add a stale-preview warning');

    const stale = buildEvidencePruneExecutionFixtureProof(db, {
      fixtureOnly: true,
      execute: true,
      scope: selectedScope(),
      confirmation: {
        previewDigest: preview.preview_digest
      }
    });
    assert(stale.status === 'blocked', 'stale preview should block');
    assert(stale.reason === 'stale_or_changed_preview', 'stale preview should name stale/changed reason');
    assertSame(tableCounts(db), changed, 'stale preview must stop before deletion');
  } finally {
    closeDatabase(db);
  }
}

function verifyRollbackLeavesFixtureCountsUnchanged() {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);

  try {
    const preview = buildEvidencePruneExecutionFixtureProof(db, {
      fixtureOnly: true,
      scope: selectedScope()
    });
    const before = tableCounts(db);
    const rollback = buildEvidencePruneExecutionFixtureProof(db, {
      fixtureOnly: true,
      execute: true,
      scope: selectedScope(),
      confirmation: {
        previewDigest: preview.preview_digest
      },
      injectedFailureStage: 'after_activity_events'
    });
    assert(rollback.status === 'fixture_delete_rolled_back', 'injected failure should roll back');
    assert(rollback.deletion_executed === false, 'rollback result should not claim deletion executed');
    assert(rollback.reason.includes('injected_fixture_failure'), 'rollback should expose injected fixture failure');
    assertSame(tableCounts(db), before, 'rollback must leave all fixture counts unchanged');
  } finally {
    closeDatabase(db);
  }
}

function verifySuccessfulFixtureDeleteContract() {
  const db = openDatabase(':memory:');
  migrate(db);
  seed(db);

  try {
    const preview = buildEvidencePruneExecutionFixtureProof(db, {
      fixtureOnly: true,
      candidateKillmailIds: [9102],
      scope: selectedScope()
    });
    const before = tableCounts(db);
    const selectedActivityEvents = countWhere(db, 'activity_events', 'killmail_id = 9101');

    const result = buildEvidencePruneExecutionFixtureProof(db, {
      fixtureOnly: true,
      execute: true,
      candidateKillmailIds: [9102],
      scope: selectedScope(),
      confirmation: {
        previewDigest: preview.preview_digest
      }
    });
    const after = tableCounts(db);

    assert(result.status === 'fixture_delete_succeeded', 'fixture proof should delete selected fixture Evidence rows');
    assert(result.deletion_executed === true, 'success should report deletion executed in fixture data');
    assert(result.renderer_eligible === false, 'fixture proof should not be renderer eligible');
    assert(result.product_deletion_command === false, 'fixture proof should not be a product deletion command');
    assert(result.source_of_candidate_ids === 'server_retention_preflight', 'success should use server preflight candidates');
    assert(result.supplied_candidate_ids_ignored === true, 'payload candidate IDs should remain ignored on success');
    assert(result.deleted_counts.killmails === 1, 'success should delete one selected killmail');
    assert(result.deleted_counts.activity_events === selectedActivityEvents, 'success should delete selected activity rows');
    assert(result.deleted_counts.ingestion_audits === 1, 'success should delete selected ingestion audit');
    assert(result.deleted_counts.data_quality_warnings === 1, 'success should delete only selected killmail-linked warning');

    assert(after.killmails === before.killmails - 1, 'selected killmail should be removed');
    assert(after.activity_events === before.activity_events - selectedActivityEvents, 'selected activity rows should be removed');
    assert(after.ingestion_audits === before.ingestion_audits - 1, 'selected ingestion audit should be removed');
    assert(after.data_quality_warnings === before.data_quality_warnings - 1, 'only one killmail-linked warning should be removed');
    assert(after.killmail_linked_data_quality_warnings === before.killmail_linked_data_quality_warnings - 1, 'only selected linked warning should be removed');
    assert(after.run_level_data_quality_warnings === before.run_level_data_quality_warnings, 'run-level warning should remain');
    assert(countWhere(db, 'data_quality_warnings', 'killmail_id = 9102') === 1, 'other killmail-linked warning in mixed run should remain');
    assert(countWhere(db, 'data_quality_warnings', 'killmail_id IS NULL') === 1, 'run-level mixed-run warning should remain');

    assert(after.discovered_killmail_refs === before.discovered_killmail_refs, 'Discovery refs should not mutate');
    assert(after.assessment_artifacts === before.assessment_artifacts, 'Assessment Memory should not mutate');
    assert(after.fetch_runs === before.fetch_runs, 'fetch runs should not mutate');
    assert(after.api_request_logs === before.api_request_logs, 'API request logs should not mutate');
    assert(after.watchlist_entities === before.watchlist_entities, 'Watch/Marked-adjacent actor rows should not mutate');
    assert(after.system_watches === before.system_watches, 'system Watch rows should not mutate');
    assert(after.entities === before.entities, 'entities should not mutate');
    assert(after.metadata_runs === before.metadata_runs, 'metadata runs should not mutate');
    assert(after.type_metadata === before.type_metadata, 'type metadata should not mutate');
    assert(after.solar_systems === before.solar_systems, 'system lookup rows should not mutate');

    assert(result.post_delete_integrity.selected_orphans.activity_events === 0, 'selected activity orphans should be gone');
    assert(result.post_delete_integrity.selected_orphans.ingestion_audits === 0, 'selected ingestion orphans should be gone');
    assert(result.post_delete_integrity.selected_orphans.killmail_linked_warnings === 0, 'selected warning rows should be gone');
    assert(result.post_delete_integrity.foreign_key_check === 'passed', 'foreign key check should pass after fixture delete');
    assert(result.support_artifact_disclosure.active_record_prune_would_clean_support_artifacts === false, 'success result should disclose no support artifact cleanup');
    assert(result.no_footprint_policy.no_retained_deletion_footprint === true, 'success result should preserve no-footprint policy');
    assert(result.no_footprint_policy.retained_footprint_created_by_preview === false, 'success result should not create footprint');
    assert(!JSON.stringify(result).includes('raw_esi_payload'), 'result must not include raw Evidence payloads');
    assert(!JSON.stringify(result).includes('attackers'), 'result must not include full participant arrays');
  } finally {
    closeDatabase(db);
  }
}

function selectedScope() {
  return {
    killmailId: 9101
  };
}

function seed(db) {
  db.prepare(`
    INSERT INTO solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
  db.prepare(`
    INSERT INTO type_metadata (type_id, type_name, category_id, category_name, group_id, group_name, last_fetched)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(603, 'Merlin', 6, 'Ship', 25, 'Frigate', '2026-05-01T00:00:00Z');

  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    runId: 'run_retention_fixture',
    trigger: 'fixture_test',
    watchType: 'manual_expand',
    watchId: 'retention-prune-fixture'
  });
  const pkg = evidencePackageFromExpandedKillmails({
    killmails: [
      {
        raw: expandedKillmail(9101, 'hash_9101', 90000001),
        hash: 'hash_9101'
      },
      {
        raw: expandedKillmail(9102, 'hash_9102', 90000011),
        hash: 'hash_9102'
      }
    ],
    run: {
      run_id: run.run_id,
      source_type: 'fixture',
      source_id: 'retention-prune-fixture',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'fixture',
      id: 9101
    }
  });
  const result = repository.persistEvidencePackage(pkg);
  repository.insertWarning(run.run_id, {
    killmail_id: 9101,
    warning_type: 'selected_fixture_warning',
    message: 'fixture warning tied to selected evidence',
    created_at: '2026-05-01T20:02:00Z'
  });
  repository.insertWarning(run.run_id, {
    killmail_id: 9102,
    warning_type: 'other_fixture_warning',
    message: 'fixture warning tied to other mixed-run evidence',
    created_at: '2026-05-01T20:03:00Z'
  });
  repository.insertWarning(run.run_id, {
    warning_type: 'run_level_fixture_warning',
    message: 'fixture run-level warning must not be deleted by selected killmail prune',
    created_at: '2026-05-01T20:04:00Z'
  });
  repository.insertApiRequestLog({
    run_id: run.run_id,
    provider: 'esi',
    endpoint: 'https://esi.evetech.net/latest/killmails/9101/hash_9101/',
    method: 'GET',
    status_code: 200,
    duration_ms: 1,
    cache_status: 'fixture',
    requested_at: '2026-05-01T20:00:00Z'
  });
  repository.upsertDiscoveredKillmailRefs([
    {
      killmail_id: 9101,
      hash: 'hash_9101',
      discovered_at: '2026-05-01T19:58:00Z',
      preview: {
        killmail_time: '2026-05-01T20:01:00Z'
      }
    },
    {
      killmail_id: 9102,
      hash: 'hash_9102',
      discovered_at: '2026-05-01T19:59:00Z',
      preview: {
        killmail_time: '2026-05-01T20:02:00Z'
      }
    }
  ], {
    runId: run.run_id,
    discoveredByType: 'manual_system',
    discoveredById: '30000001',
    sourceSystemId: 30000001
  });
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: 2,
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten,
    api_calls_zkill: 0,
    api_calls_esi: 2
  }, 'success');

  createAssessmentArtifact(db, {
    artifactType: 'analyst_note',
    assessmentReason: 'Fixture Assessment Memory cites selected Evidence and must not be mutated by fixture deletion proof.',
    sampleKillmailIds: [9101],
    assessedBy: 'fixture'
  });

  db.prepare(`
    INSERT INTO watchlist_entities (
      entity_type, entity_id, entity_name, is_active, next_poll_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run('character', 90000001, 'Fixture Pilot', 1, '2026-05-02T00:00:00Z', 'fixture attention row');
  db.prepare(`
    INSERT INTO system_watches (
      center_system_id, center_system_name, radius_jumps, included_system_ids,
      excluded_system_ids, is_active, next_poll_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 1, '[30000001]', '[]', 1, '2026-05-02T00:00:00Z', 'fixture direct system watch');
}

function expandedKillmail(killmailId, hash, victimCharacterId) {
  const clone = JSON.parse(JSON.stringify(fixtureKillmail));
  clone.killmail_id = killmailId;
  clone.killmail_time = killmailId === 9101 ? '2026-05-01T20:01:00Z' : '2026-05-01T20:02:00Z';
  clone.solar_system_id = 30000001;
  clone.victim.character_id = victimCharacterId;
  clone.victim.corporation_id = 98000001;
  clone.victim.alliance_id = 99000001;
  clone.victim.ship_type_id = 603;
  clone.attackers = (clone.attackers || []).slice(0, 2).map((attacker, index) => ({
    ...attacker,
    character_id: victimCharacterId + 1 + index,
    corporation_id: 98000002,
    alliance_id: 99000002,
    ship_type_id: 587,
    final_blow: index === 0
  }));
  clone.__fixture_hash = hash;
  return clone;
}

function tableCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    ingestion_audits: count(db, 'ingestion_audits'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    killmail_linked_data_quality_warnings: countWhere(db, 'data_quality_warnings', 'killmail_id IS NOT NULL'),
    run_level_data_quality_warnings: countWhere(db, 'data_quality_warnings', 'killmail_id IS NULL'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches'),
    entities: count(db, 'entities'),
    metadata_runs: count(db, 'metadata_runs'),
    type_metadata: count(db, 'type_metadata'),
    solar_systems: count(db, 'solar_systems')
  };
}

function count(db, tableName) {
  return countWhere(db, tableName, '1 = 1');
}

function countWhere(db, tableName, whereSql) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName} WHERE ${whereSql}`).get().count;
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
