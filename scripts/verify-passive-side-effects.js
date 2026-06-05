const fs = require('node:fs');
const path = require('node:path');
const fixtureKillmail = require('../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { EvidenceRepository } = require('../src/main/db/evidenceRepository');
const { createAssessmentArtifact } = require('../src/main/assessment/assessmentArtifactRepository');
const { evidencePackageFromExpandedKillmails } = require('../src/main/workers/killmailIngestionWorker');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');
const { buildMetadataStatusReport } = require('../src/main/reports/metadataStatusReport');
const { buildActorMetadataReadinessReport } = require('../src/main/reports/actorMetadataReadinessReport');
const { buildCorporationMetadataReadinessReport } = require('../src/main/reports/corporationMetadataReadinessReport');
const { auraTempRoot, projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const previous = captureEnv();
  const root = path.join(auraTempRoot(), 'passive-side-effects');
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
  process.env.AURA_ATLAS_TEST_TMP = root;
  process.env.AURA_ATLAS_CACHE_DIR = path.join(root, 'cache');
  process.env.AURA_ATLAS_SDE_CACHE_DIR = path.join(root, 'sde');
  delete process.env.AURA_ATLAS_LIVE_API;

  try {
    await verifySeededDb(root);
    await verifyEmptyDb(root);
    console.log('passive side-effect sweep verified');
  } finally {
    restoreEnv(previous);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function verifySeededDb(root) {
  const dbPath = path.join(root, 'seeded-passive.sqlite');
  const db = openDatabase(dbPath);
  migrate(db);
  const seed = seedDb(db);
  const context = { db, databasePath: dbPath };

  try {
    const passiveCalls = [
      ['app.readiness', () => invokeServiceCommand('app.readiness', {}, context)],
      ['report.corpus_health', () => invokeServiceCommand('report.corpus_health', {}, context)],
      ['queue.selection', () => invokeServiceCommand('queue.selection', {
        discoveredByType: 'manual_actor',
        discoveredById: 'character:90000002',
        maxExpansions: 1
      }, context)],
      ['watch.schedule', () => invokeServiceCommand('watch.schedule', {}, context)],
      ['report.actor', () => invokeServiceCommand('report.actor', {
        params: {
          entityType: 'character',
          entityId: 90000002,
          entityName: 'Atlas Scout'
        }
      }, context)],
      ['report.radius', () => invokeServiceCommand('report.radius', {
        params: {
          center: 30000001,
          radiusJumps: 1
        }
      }, context)],
      ['report.queue', () => invokeServiceCommand('report.queue', {
        type: 'manual_actor',
        id: 'character:90000002'
      }, context)],
      ['report.run', () => invokeServiceCommand('report.run', {
        params: { runId: seed.runId }
      }, context)],
      ['report.system', () => invokeServiceCommand('report.system', {
        params: { system: 30000001 }
      }, context)],
      ['report.corporation', () => invokeServiceCommand('report.corporation', {
        params: {
          entityId: 98000002,
          entityName: 'Signal Cartel Test'
        }
      }, context)],
      ['report.build:actor', () => invokeServiceCommand('report.build', {
        reportType: 'actor',
        params: {
          entityType: 'character',
          entityId: 90000002,
          entityName: 'Atlas Scout'
        }
      }, context)],
      ['metadata.status report', () => buildMetadataStatusReport(db)],
      ['metadata.actor report', () => buildActorMetadataReadinessReport(db, {
        entityType: 'character',
        entityId: 90000002,
        entityName: 'Atlas Scout'
      })],
      ['metadata.corporation report', () => buildCorporationMetadataReadinessReport(db, {
        entityId: 98000002,
        entityName: 'Signal Cartel Test'
      })],
      ['external_io.state_readout', () => invokeServiceCommand('external_io.state_readout', {
        state: 'on',
        path: path.join(root, 'renderer-forged-external-io-state.json')
      }, {
        ...context,
        source: 'renderer'
      })],
      ['metadata.hydration_backlog.preview', () => invokeServiceCommand('metadata.hydration_backlog.preview', {}, context)],
      ['metadata.hydration_execution_policy.preview', () => invokeServiceCommand('metadata.hydration_execution_policy.preview', {}, context)],
      ['metadata.hydration_candidates.preview', () => invokeServiceCommand('metadata.hydration_candidates.preview', {}, context)],
      ['metadata.hydration_attention_lens.preview', () => invokeServiceCommand('metadata.hydration_attention_lens.preview', {}, context)],
      ['metadata.hydration_attention_runtime.preview', () => invokeServiceCommand('metadata.hydration_attention_runtime.preview', {}, context)],
      ['metadata.hydration_request_posture.preview', () => invokeServiceCommand('metadata.hydration_request_posture.preview', {
        idType: 'character',
        idValue: 90000002,
        operatorAct: true,
        sourceSurface: 'passive-sweep'
      }, context)],
      ['metadata.hydration_pickup_contract.preview', () => invokeServiceCommand('metadata.hydration_pickup_contract.preview', {
        idType: 'character',
        idValue: 90000002,
        operatorAct: true,
        sourceSurface: 'passive-sweep'
      }, context)],
      ['metadata.hydration_selected_id_real_execution_preflight.preview', () => invokeServiceCommand('metadata.hydration_selected_id_real_execution_preflight.preview', {
        idType: 'character',
        idValue: 90000002,
        operatorAct: true,
        sourceSurface: 'passive-sweep'
      }, context)],
      ['metadata.local_sde_readiness.preview', () => invokeServiceCommand('metadata.local_sde_readiness.preview', {}, context)],
      ['metadata.local_sde_source_posture.preview', () => invokeServiceCommand('metadata.local_sde_source_posture.preview', {}, context)],
      ['runtime.db_snapshot.preflight', () => invokeServiceCommand('runtime.db_snapshot.preflight', {}, context)],
      ['storage.authority_preflight', () => invokeServiceCommand('storage.authority_preflight', {}, context)],
      ['storage.authority_config.readback', () => invokeServiceCommand('storage.authority_config.readback', {
        storageAuthority: {
          mode: 'app_local_fallback_acknowledged',
          acknowledgement_status: 'acknowledged',
          budget_bytes: 1
        },
        configPath: path.join(root, 'renderer-forged-storage-authority.json')
      }, {
        ...context,
        source: 'renderer'
      })],
      ['storage.setup_gate_readout', () => invokeServiceCommand('storage.setup_gate_readout', {}, context)],
      ['storage.enforcement_dry_run.command_effect_map', () => invokeServiceCommand('storage.enforcement_dry_run.command_effect_map', {}, context)],
      ['storage.composed_gate_policy.preview', () => invokeServiceCommand('storage.composed_gate_policy.preview', {}, context)],
      ['support.gate_stack_readout', () => invokeServiceCommand('support.gate_stack_readout', {}, context)],
      ['support.artifact_path_authority.preview', () => invokeServiceCommand('support.artifact_path_authority.preview', {}, context)],
      ['support.artifact_creation_policy.preview', () => invokeServiceCommand('support.artifact_creation_policy.preview', {}, context)],
      ['support.artifact_contents_contract.preview', () => invokeServiceCommand('support.artifact_contents_contract.preview', {}, context)],
      ['support.artifact_writer_conformance_gap_map.preview', () => invokeServiceCommand('support.artifact_writer_conformance_gap_map.preview', {}, context)],
      ['support.trace_log_redaction_policy.preview', () => invokeServiceCommand('support.trace_log_redaction_policy.preview', {}, context)],
      ['support.api_request_log_redaction_readiness.preview', () => invokeServiceCommand('support.api_request_log_redaction_readiness.preview', {}, context)],
      ['runtime.enforcement_boundary.preview', () => invokeServiceCommand('runtime.enforcement_boundary.preview', {}, context)],
      ['runtime.enforcement_active_semantics.preview', () => invokeServiceCommand('runtime.enforcement_active_semantics.preview', {}, context)],
      ['runtime.enforcement_hook_telemetry.readout', () => invokeServiceCommand('runtime.enforcement_hook_telemetry.readout', {}, context)],
      ['runtime.queue_clock_posture.preview', () => invokeServiceCommand('runtime.queue_clock_posture.preview', {}, context)],
      ['runtime.patient_packet_identity.preview', () => invokeServiceCommand('runtime.patient_packet_identity.preview', {}, context)],
      ['task.list', () => invokeServiceCommand('task.list', { limit: 10 }, context)],
      ['assessment.list', () => invokeServiceCommand('assessment.list', {
        entityType: 'character',
        entityId: 90000002
      }, context)],
      ['assessment.get', () => invokeServiceCommand('assessment.get', {
        artifactId: seed.artifactId
      }, context)]
    ];

    for (const [label, call] of passiveCalls) {
      await assertNoTableEffects(db, label, call);
    }

    await assertSupportTracePackOnlyWritesFile(db, context, root);
  } finally {
    closeDatabase(db);
  }
}

async function verifyEmptyDb(root) {
  const dbPath = path.join(root, 'empty-passive.sqlite');
  const db = openDatabase(dbPath);
  migrate(db);
  const context = { db, databasePath: dbPath };

  try {
    const passiveCalls = [
      ['empty app.readiness', () => invokeServiceCommand('app.readiness', {}, context)],
      ['empty report.corpus_health', () => invokeServiceCommand('report.corpus_health', {}, context)],
      ['empty queue.selection', () => invokeServiceCommand('queue.selection', { maxExpansions: 1 }, context)],
      ['empty watch.schedule', () => invokeServiceCommand('watch.schedule', {}, context)],
      ['empty task.list', () => invokeServiceCommand('task.list', { limit: 5 }, context)],
      ['empty external_io.state_readout', () => invokeServiceCommand('external_io.state_readout', {
        state: 'on',
        path: path.join(root, 'empty-renderer-forged-external-io-state.json')
      }, {
        ...context,
        source: 'renderer'
      })],
      ['empty metadata.hydration_backlog.preview', () => invokeServiceCommand('metadata.hydration_backlog.preview', {}, context)],
      ['empty metadata.hydration_execution_policy.preview', () => invokeServiceCommand('metadata.hydration_execution_policy.preview', {}, context)],
      ['empty metadata.hydration_candidates.preview', () => invokeServiceCommand('metadata.hydration_candidates.preview', {}, context)],
      ['empty metadata.hydration_attention_lens.preview', () => invokeServiceCommand('metadata.hydration_attention_lens.preview', {}, context)],
      ['empty metadata.hydration_attention_runtime.preview', () => invokeServiceCommand('metadata.hydration_attention_runtime.preview', {}, context)],
      ['empty metadata.hydration_request_posture.preview', () => invokeServiceCommand('metadata.hydration_request_posture.preview', {
        idType: 'character',
        idValue: 90000002,
        operatorAct: true,
        sourceSurface: 'passive-sweep'
      }, context)],
      ['empty metadata.hydration_pickup_contract.preview', () => invokeServiceCommand('metadata.hydration_pickup_contract.preview', {
        idType: 'character',
        idValue: 90000002,
        operatorAct: true,
        sourceSurface: 'passive-sweep'
      }, context)],
      ['empty metadata.hydration_selected_id_real_execution_preflight.preview', () => invokeServiceCommand('metadata.hydration_selected_id_real_execution_preflight.preview', {
        idType: 'character',
        idValue: 90000002,
        operatorAct: true,
        sourceSurface: 'passive-sweep'
      }, context)],
      ['empty metadata.local_sde_readiness.preview', () => invokeServiceCommand('metadata.local_sde_readiness.preview', {}, context)],
      ['empty metadata.local_sde_source_posture.preview', () => invokeServiceCommand('metadata.local_sde_source_posture.preview', {}, context)],
      ['empty runtime.db_snapshot.preflight', () => invokeServiceCommand('runtime.db_snapshot.preflight', {}, context)],
      ['empty storage.authority_preflight', () => invokeServiceCommand('storage.authority_preflight', {}, context)],
      ['empty storage.authority_config.readback', () => invokeServiceCommand('storage.authority_config.readback', {
        configPath: path.join(root, 'empty-renderer-forged-storage-authority.json')
      }, {
        ...context,
        source: 'renderer'
      })],
      ['empty storage.setup_gate_readout', () => invokeServiceCommand('storage.setup_gate_readout', {}, context)],
      ['empty storage.enforcement_dry_run.command_effect_map', () => invokeServiceCommand('storage.enforcement_dry_run.command_effect_map', {}, context)],
      ['empty storage.composed_gate_policy.preview', () => invokeServiceCommand('storage.composed_gate_policy.preview', {}, context)],
      ['empty support.gate_stack_readout', () => invokeServiceCommand('support.gate_stack_readout', {}, context)],
      ['empty support.artifact_path_authority.preview', () => invokeServiceCommand('support.artifact_path_authority.preview', {}, context)],
      ['empty support.artifact_creation_policy.preview', () => invokeServiceCommand('support.artifact_creation_policy.preview', {}, context)],
      ['empty support.artifact_contents_contract.preview', () => invokeServiceCommand('support.artifact_contents_contract.preview', {}, context)],
      ['empty support.artifact_writer_conformance_gap_map.preview', () => invokeServiceCommand('support.artifact_writer_conformance_gap_map.preview', {}, context)],
      ['empty support.trace_log_redaction_policy.preview', () => invokeServiceCommand('support.trace_log_redaction_policy.preview', {}, context)],
      ['empty support.api_request_log_redaction_readiness.preview', () => invokeServiceCommand('support.api_request_log_redaction_readiness.preview', {}, context)],
      ['empty runtime.enforcement_boundary.preview', () => invokeServiceCommand('runtime.enforcement_boundary.preview', {}, context)],
      ['empty runtime.enforcement_active_semantics.preview', () => invokeServiceCommand('runtime.enforcement_active_semantics.preview', {}, context)],
      ['empty runtime.enforcement_hook_telemetry.readout', () => invokeServiceCommand('runtime.enforcement_hook_telemetry.readout', {}, context)],
      ['empty runtime.queue_clock_posture.preview', () => invokeServiceCommand('runtime.queue_clock_posture.preview', {}, context)],
      ['empty runtime.patient_packet_identity.preview', () => invokeServiceCommand('runtime.patient_packet_identity.preview', {}, context)],
      ['empty assessment.list', () => invokeServiceCommand('assessment.list', {}, context)]
    ];

    for (const [label, call] of passiveCalls) {
      await assertNoTableEffects(db, label, call);
    }

    await assertNoTableEffects(db, 'empty report.actor', () => invokeServiceCommand('report.actor', {
        params: {
          entityType: 'character',
          entityId: 90000002
        }
      }, context));
  } finally {
    closeDatabase(db);
  }
}

async function assertSupportTracePackOnlyWritesFile(db, context, root) {
  const outputDir = path.join(root, 'trace-pack-output');
  const beforeFiles = fileCount(outputDir);
  const result = await assertNoTableEffects(db, 'support.debug_trace_pack', () => invokeServiceCommand('support.debug_trace_pack', {
    outputDir
  }, context));
  const afterFiles = fileCount(outputDir);
  assert(afterFiles === beforeFiles + 1, 'support.debug_trace_pack should write exactly one support artifact file');
  assert(fs.existsSync(result.output_path), 'support.debug_trace_pack should return an existing output path');
  assert(result.pack.classification.includes('support/debug artifact'), 'trace pack should label itself as support/debug');
}

async function assertNoTableEffects(db, label, call) {
  const before = sideEffectCounts(db);
  const result = await call();
  const after = sideEffectCounts(db);
  assertSame(after, before, `${label} changed passive table counts`);
  return result;
}

function seedDb(db) {
  db.prepare(`
    INSERT INTO regions (region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?)
  `).run(10000001, 'Test Region', 'fixture-build', '2026-05-01T00:00:00Z');
  db.prepare(`
    INSERT INTO constellations (constellation_id, constellation_name, region_id, region_name, source_sde_build, imported_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(20000001, 'Test Constellation', 10000001, 'Test Region', 'fixture-build', '2026-05-01T00:00:00Z');
  for (const [systemId, systemName] of [
    [30000001, 'Atlas Prime'],
    [30000002, 'Atlas Second']
  ]) {
    db.prepare(`
      INSERT INTO solar_systems (
        solar_system_id, solar_system_name, constellation_id, constellation_name,
        region_id, region_name, security_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(systemId, systemName, 20000001, 'Test Constellation', 10000001, 'Test Region', 0.4);
  }
  db.prepare(`
    INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type)
    VALUES (?, ?, ?), (?, ?, ?)
  `).run(30000001, 30000002, 'stargate', 30000002, 30000001, 'stargate');
  db.prepare(`
    INSERT INTO sde_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      systems_count, constellations_count, regions_count, adjacency_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-01T00:00:00Z', 'checksum', 2, 1, 1, 2);
  db.prepare(`
    INSERT INTO type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)
  `).run(
    603, 'Merlin', 25, 'Frigate', 6, 'Ship', '2026-05-01T00:00:00Z',
    587, 'Rifter', 25, 'Frigate', 6, 'Ship', '2026-05-01T00:00:00Z'
  );
  db.prepare(`
    INSERT INTO sde_inventory_imports (
      build_number, variant, source_url, imported_at, file_checksum,
      categories_count, groups_count, types_count, type_metadata_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('fixture-build', 'jsonl', 'fixtures/sde-jsonl', '2026-05-01T00:00:00Z', 'checksum', 1, 1, 2, 2);
  db.prepare(`
    INSERT INTO entities (
      entity_type, entity_id, entity_name, current_corporation_id, current_corporation_name,
      current_alliance_id, current_alliance_name, first_seen_at, last_seen_at, last_enriched_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'character', 90000002, 'Atlas Scout', 98000002, 'Signal Cartel Test',
    99000002, 'Observed Operators', '2026-05-01T00:00:00Z', '2026-05-01T20:01:00Z', '2026-05-01T20:02:00Z'
  );
  db.prepare(`
    INSERT INTO watchlist_entities (
      entity_type, entity_id, entity_name, lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes, next_poll_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('character', 90000002, 'Atlas Scout', 30, 5, 1, 60, '2026-05-01T19:00:00Z', 'fixture actor watch');
  db.prepare(`
    INSERT INTO system_watches (
      center_system_id, center_system_name, radius_jumps, included_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes, next_poll_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(30000001, 'Atlas Prime', 1, JSON.stringify([30000001, 30000002]), 24, 2, 5, 1, 60, '2026-05-01T19:00:00Z', 'fixture system watch');

  const repository = new EvidenceRepository(db);
  const run = repository.createFetchRun({
    trigger: 'fixture_test',
    watchType: 'manual_scan',
    watchId: 'passive-side-effects'
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
      source_id: 'passive-side-effects',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'manual_actor',
      id: 'character:90000002'
    }
  });
  const persisted = repository.persistEvidencePackage(pkg);
  repository.upsertDiscoveredKillmailRefs([
    {
      killmail_id: 7701,
      hash: 'fixture_hash_7701',
      discovered_at: '2026-05-01T20:00:00Z',
      preview: {
        killmail_time: '2026-05-01T20:01:00Z',
        victim: { ship_type_id: 603 },
        attacker_count: 2
      }
    },
    {
      killmail_id: 7702,
      hash: 'fixture_hash_7702',
      discovered_at: '2026-05-01T20:02:00Z',
      preview: {
        killmail_time: '2026-05-01T20:02:00Z',
        victim: { ship_type_id: 587 },
        attacker_count: 1
      }
    }
  ], {
    runId: run.run_id,
    discoveredByType: 'manual_actor',
    discoveredById: 'character:90000002',
    sourceActorType: 'character',
    sourceActorId: 90000002,
    sourceScope: 'fixture actor passive sweep'
  });
  repository.markDiscoveryRefsExpanded([{ killmail_id: 7701, hash: 'fixture_hash_7701' }]);
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
    warning_type: 'PASSIVE_FIXTURE_WARNING',
    message: 'Fixture warning for passive surface sweep.',
    created_at: '2026-05-01T20:01:00Z'
  });
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: 2,
    expanded_new: persisted.killmailsWritten,
    activity_events_written: persisted.eventsWritten,
    api_calls_zkill: 1,
    api_calls_esi: 0
  }, 'success');

  const metadataRun = repository.createMetadataRun({
    runId: 'metadata_passive_fixture',
    trigger: 'fixture_test',
    runType: 'report_actor_candidates',
    targetType: 'character',
    targetId: '90000002'
  });
  repository.finalizeMetadataRun(metadataRun.run_id, {
    ids_discovered: 1,
    already_known: 1,
    requested_from_esi: 0,
    resolved: 1,
    entities_upserted: 0,
    activity_events_patched: 0,
    api_calls_esi: 0
  }, 'success');

  const artifact = createAssessmentArtifact(db, {
    artifactType: 'entity_interest',
    entityType: 'character',
    entityId: 90000002,
    entityName: 'Atlas Scout',
    assessmentReason: 'Fixture passive sweep assessment memory.',
    sampleKillmailIds: [7701],
    assessedBy: 'fixture'
  });

  return {
    runId: run.run_id,
    artifactId: artifact.artifact_id
  };
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    actor_watches: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function fileCount(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  return fs.readdirSync(dirPath, { withFileTypes: true }).filter((entry) => entry.isFile()).length;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nBefore: ${JSON.stringify(expected)}\nAfter: ${JSON.stringify(actual)}`);
  }
}

function captureEnv() {
  return {
    AURA_ATLAS_TEST_TMP: process.env.AURA_ATLAS_TEST_TMP,
    AURA_ATLAS_CACHE_DIR: process.env.AURA_ATLAS_CACHE_DIR,
    AURA_ATLAS_SDE_CACHE_DIR: process.env.AURA_ATLAS_SDE_CACHE_DIR,
    AURA_ATLAS_LIVE_API: process.env.AURA_ATLAS_LIVE_API
  };
}

function restoreEnv(previous) {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
