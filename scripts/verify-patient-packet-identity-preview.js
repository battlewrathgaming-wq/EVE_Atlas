const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const { buildCommandCoverageReport } = require('../src/main/services/enforcementDryRunService');
const { projectRoot } = require('../src/main/util/tempPaths');

async function main() {
  const db = openDatabase(':memory:');
  migrate(db);

  try {
    seedFixture(db);
    const before = sideEffectCounts(db);
    const preview = await invokeServiceCommand('runtime.patient_packet_identity.preview', {
      now: '2026-06-03T11:00:00.000Z',
      limit: 8,
      external_io: {
        state: 'on',
        path: 'C:\\renderer-forged-external-io.json'
      },
      storage: {
        storagePreflight: fixturePreflight(path.join(projectRoot(), '.tmp', 'patient-packet-identity', 'atlas.sqlite')),
        storageAuthority: {
          mode: 'selected_storage',
          selected: true,
          config_source: 'fixture_selected_storage',
          config_version: 1,
          budget_source: 'fixture_configured',
          budget_bytes: 4096
        }
      }
    }, {
      db,
      source: 'renderer',
      allowStorageSetupGateFixtureInput: true,
      storageBudgetBytes: 4096
    });
    const after = sideEffectCounts(db);

    verifyReadOnlyBoundary(preview);
    verifyIdentityRows(preview);
    verifyRegistrationAndCoverage();
    assertSame(after, before, 'patient packet identity preview should not mutate persistent tables');

    console.log(JSON.stringify({
      status: 'patient packet identity preview verified',
      action: preview.action,
      summary: preview.summary,
      identities: Object.fromEntries(preview.identity_rows.map((row) => [
        row.lane,
        {
          candidate_kind: row.candidate_kind,
          identity_derivable_now: row.identity_derivable_now,
          persistence_recommendation: row.persistence_recommendation,
          gate_posture: row.gate_posture_summary.posture,
          not_execution_authority: row.not_execution_authority
        }
      ])),
      no_catch_up_posture: preview.no_catch_up_posture,
      mutation_check: {
        before,
        after,
        unchanged: JSON.stringify(before) === JSON.stringify(after)
      },
      boundary: preview.boundary
    }, null, 2));
  } finally {
    closeDatabase(db);
  }

  console.log('patient packet identity preview verified');
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.action === 'runtime.patient_packet_identity.preview', 'preview action should be named');
  assert(preview.read_only === true, 'preview should be read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.dispatches === 0, 'preview should not dispatch work');
  assert(preview.packet_tables_created === 0, 'preview should not create packet tables');
  assert(preview.persisted_queue_created === false, 'preview should not create persisted queues');
  assert(preview.active_dispatcher === false, 'preview should not add dispatcher');
  assert(preview.zkill_discovery_executions === 0, 'preview should not execute zKill Discovery');
  assert(preview.esi_evidence_expansion_executions === 0, 'preview should not execute ESI Evidence Expansion');
  assert(preview.hydration_executions === 0, 'preview should not execute Hydration');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration output');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.watch_mutations === 0, 'preview should not mutate or arm Watch');
  assert(preview.assessment_memory_mutations === 0, 'preview should not mutate Assessment Memory');
  assert(preview.marked_mutations === 0, 'preview should not mutate Marked');
  assert(preview.storage_config_writes === 0, 'preview should not write storage config');
  assert(preview.storage_movements === 0, 'preview should not move storage');
  assert(preview.support_artifacts_created === 0, 'preview should not create support artifacts');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.command_blocking_active === false, 'preview should not block commands');
  assert(preview.pruning_deletion_behavior === false, 'preview should not add pruning/deletion behavior');
  assert(preview.ui_work === false, 'preview should not add UI');
}

function verifyIdentityRows(preview) {
  assert(preview.summary.identity_rows === 4, 'preview should emit four required identity rows');
  assert(preview.summary.derivable_now === 4, 'fixture should derive all four identities');
  assert(preview.summary.acquisition_and_hydration_separate === true, 'Acquisition and Hydration should stay separate');
  assert(preview.summary.all_derived_for_now === true, 'all rows should recommend derived_for_now');
  assert(preview.summary.packet_persistence_recommended === false, 'no row should recommend packet persistence');
  assert(preview.summary.all_not_execution_authority === true, 'all rows should be non-authority');

  const zkill = row(preview, 'zkill_discovery');
  assert(zkill.clock === 'acquisition', 'zKill identity should be acquisition clock');
  assert(zkill.candidate_kind === 'zkill_discovery_movement_intent', 'zKill identity should be movement intent shaped');
  assert(String(zkill.derived_identity_key).includes('watch|actor|1'), 'zKill identity should include Watch identity');
  assert(String(zkill.derived_identity_key).includes('cadence:60'), 'zKill identity should include cadence');
  assert(zkill.source_anchors.some((entry) => entry.type === 'scope_key'), 'zKill identity should include scope anchor');

  const expansion = row(preview, 'esi_evidence_expansion');
  assert(expansion.clock === 'acquisition', 'ESI expansion identity should be acquisition clock');
  assert(expansion.candidate_kind === 'discovery_ref_esi_expansion_candidate', 'ESI expansion should be Discovery-ref shaped');
  assert(String(expansion.derived_identity_key).includes('killmail:910001'), 'ESI expansion identity should include killmail_id');
  assert(String(expansion.derived_identity_key).includes('hash:hash_pending'), 'ESI expansion identity should include killmail_hash');
  assert(expansion.source_basis.some((entry) => entry.includes('Discovery-ref shaped')), 'ESI expansion should declare Discovery-ref basis');

  const view = row(preview, 'view_local_record');
  assert(view.clock === 'hydration_recovery', 'view/local identity should be Hydration Recovery clock');
  assert(String(view.derived_identity_key).includes('hydration_recovery|view_local_record|entity:character:90000005'), 'view/local identity should include candidate key and lane');
  assert(view.duplicate_prevention_basis.includes('view/local-record identity remains ahead of background lanes'), 'view/local identity should not be starved behind background');

  const watch = row(preview, 'watch_background');
  assert(watch.clock === 'hydration_recovery', 'Watch/background identity should be Hydration Recovery clock');
  assert(String(watch.derived_identity_key).includes('hydration_recovery|watch_background|entity:character:90000005'), 'Watch/background identity should include same candidate key with different lane');
  assert(watch.duplicate_prevention_basis.includes('Watch/background identity remains patient and must not starve view/local-record Hydration'), 'Watch/background identity should be patient');

  for (const identity of preview.identity_rows) {
    assert(identity.not_persisted === true, `${identity.lane} should not be persisted`);
    assert(identity.not_executable === true, `${identity.lane} should not be executable`);
    assert(identity.not_execution_authority === true, `${identity.lane} should not be execution authority`);
    assert(identity.provider_calls === 0, `${identity.lane} should not call providers`);
    assert(identity.writes === 0, `${identity.lane} should not write`);
    assert(identity.persistence_recommendation === 'derived_for_now', `${identity.lane} should be derived_for_now`);
    assert(identity.no_catch_up_posture.restart_creates_request_debt === false, `${identity.lane} should not create restart debt`);
    assert(identity.no_catch_up_posture.external_io_reenable_creates_request_debt === false, `${identity.lane} should not create External I/O release debt`);
    assert(identity.boundary_statement.includes('not execution authority'), `${identity.lane} should state non-authority boundary`);
  }
}

function verifyRegistrationAndCoverage() {
  const command = listServiceCommands().find((entry) => entry.command === 'runtime.patient_packet_identity.preview');
  assert(command, 'patient packet identity command should be registered');
  assert(command.classification === 'read-only', 'patient packet identity command should be read-only');
  assert(command.effects.includes('read-only'), 'patient packet identity command should declare read-only effect');
  assert(command.renderer_allowed === true, 'patient packet identity command should be renderer eligible as a readout');
  const coverage = buildCommandCoverageReport(listServiceCommands());
  assert(coverage.status === 'complete', `coverage should stay complete; gaps: ${coverage.gap_commands.join(', ')}`);
  const row = coverage.commands.find((entry) => entry.command === 'runtime.patient_packet_identity.preview');
  assert(row?.runtime_context === 'patient_packet_identity_readout', 'patient packet identity command should have coverage metadata');
  assert(row?.enforcement_status === 'read_only_non_enforcing_proof', 'patient packet identity command should remain non-enforcing proof');
}

function seedFixture(db) {
  seedActorWatch(db, 1, 90000005, 'Hydration Pilot');
  seedQueueRef(db, {
    killmailId: 910001,
    hash: 'hash_pending',
    status: 'pending',
    discoveredByType: 'actor',
    discoveredById: '90000005',
    sourceActorType: 'character',
    sourceActorId: 90000005
  });
  seedKillmail(db, 920001, 30000101);
  seedActivityEvent(db, {
    killmailId: 920001,
    eventKey: '920001:attacker:90000005',
    entityId: 90000005,
    characterId: 90000005,
    corporationId: 98000005,
    shipTypeId: 603,
    solarSystemId: 30000101,
    discoveredByType: 'actor',
    discoveredById: '90000005'
  });
}

function seedActorWatch(db, watchId, entityId, name) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    watchId,
    'character',
    entityId,
    name,
    30,
    5,
    1,
    60,
    null,
    null,
    null,
    null,
    null,
    'patient packet identity fixture'
  );
}

function seedQueueRef(db, input) {
  db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
      source_scope, source_system_id, source_actor_type, source_actor_id,
      discovered_at, first_seen_run_id, last_seen_run_id, last_seen_at,
      status, priority, preview_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.killmailId,
    input.hash,
    input.discoveredByType,
    input.discoveredById,
    input.discoveredById,
    input.sourceSystemId || null,
    input.sourceActorType || null,
    input.sourceActorId || null,
    '2026-06-03T10:00:00.000Z',
    'run_patient_packet_identity_fixture',
    'run_patient_packet_identity_fixture',
    '2026-06-03T10:00:00.000Z',
    input.status,
    1,
    '{}'
  );
}

function seedKillmail(db, killmailId, solarSystemId) {
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id,
      raw_esi_payload, raw_payload_checksum, source,
      first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    killmailId,
    `hash_${killmailId}`,
    '2026-06-03T10:30:00.000Z',
    solarSystemId,
    '{}',
    `checksum_${killmailId}`,
    'fixture',
    '2026-06-03T10:31:00.000Z',
    '2026-06-03T10:31:00.000Z',
    '2026-06-03T10:31:00.000Z'
  );
}

function seedActivityEvent(db, input) {
  db.prepare(`
    INSERT INTO activity_events (
      event_key, killmail_id, role, entity_type, entity_id, entity_name,
      character_id, character_name, corporation_id, corporation_name,
      alliance_id, alliance_name, ship_type_id, ship_type_name,
      weapon_type_id, final_blow, damage_done,
      solar_system_id, solar_system_name, region_id, region_name,
      killmail_time, ingested_at, discovered_by_type, discovered_by_id,
      normalizer_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.eventKey,
    input.killmailId,
    'attacker',
    'character',
    input.entityId,
    null,
    input.characterId,
    null,
    input.corporationId,
    null,
    null,
    null,
    input.shipTypeId,
    null,
    null,
    1,
    500,
    input.solarSystemId,
    null,
    10000001,
    null,
    '2026-06-03T10:30:00.000Z',
    '2026-06-03T10:31:00.000Z',
    input.discoveredByType,
    input.discoveredById,
    'fixture'
  );
}

function fixturePreflight(dbPath) {
  return {
    action: 'storage.authority_preflight',
    read_only: true,
    mutates_state: false,
    database: {
      path: dbPath,
      source: 'configured',
      mode: 'configured',
      mode_flags: {
        configured: true,
        fallback: false,
        missing: false,
        outside_policy: false,
        demo_fixture: false
      },
      parent: {
        path: path.dirname(dbPath),
        exists: true,
        is_directory: true
      },
      exists: true,
      total_bytes: 128
    },
    snapshot: {
      settings: {
        status: 'ready'
      }
    },
    byte_usage: {
      database_bytes: 128,
      known_controlled_locations_bytes: 256
    }
  };
}

function sideEffectCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
    fetch_runs: count(db, 'fetch_runs'),
    api_request_logs: count(db, 'api_request_logs'),
    data_quality_warnings: count(db, 'data_quality_warnings'),
    metadata_runs: count(db, 'metadata_runs'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function row(preview, lane) {
  const entry = preview.identity_rows.find((candidate) => candidate.lane === lane);
  assert(entry, `${lane} identity row should exist`);
  return entry;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
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
