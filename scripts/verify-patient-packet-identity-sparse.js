const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-03T12:00:00.000Z';

async function main() {
  const results = [];

  results.push(await runCase('empty_db_no_candidates', async ({ preview }) => {
    assert(preview.summary.identity_rows === 4, 'empty DB should still emit four lane rows');
    assert(preview.summary.uncomputable_rows === 4, 'empty DB rows should be uncomputable without failure');
    assert(preview.confidence_guard.false_confidence_prevented === true, 'empty DB should disclose sparse identity gaps');
    assert(row(preview, 'zkill_discovery').unknown_or_uncomputable.some((entry) => entry.fact === 'watch_or_explicit_scope_identity'), 'empty DB should disclose missing Watch/scope');
    assert(row(preview, 'esi_evidence_expansion').unknown_or_uncomputable.some((entry) => entry.fact === 'discovery_ref_identity'), 'empty DB should disclose missing Discovery ref');
    assert(row(preview, 'view_local_record').unknown_or_uncomputable.some((entry) => entry.fact === 'view_local_record_hydration_candidate'), 'empty DB should disclose missing view/local Hydration candidate');
    assert(row(preview, 'watch_background').unknown_or_uncomputable.some((entry) => entry.fact === 'watch_background_hydration_candidate'), 'empty DB should disclose missing Watch/background Hydration candidate');
  }));

  results.push(await runCase('valid_radius_watch_scope', async ({ db, preview }) => {
    seedSystemWatch(db, {
      watchId: 1,
      included: '[30000101,30000102]',
      excluded: '[30000103]'
    });
    const next = await preview(db);
    const zkill = row(next, 'zkill_discovery');
    assert(zkill.identity_derivable_now === true, 'valid system/radius Watch should derive identity');
    assert(String(zkill.derived_identity_key).includes('watch|system_radius|1'), 'valid radius identity should be system/radius shaped');
    assert(anchorValue(zkill, 'included_system_scope_status') === 'valid', 'valid radius identity should anchor included scope status');
    assert(anchorValue(zkill, 'excluded_system_scope_status') === 'valid', 'valid radius identity should anchor excluded scope status');
  }, { deferPreview: true }));

  results.push(await runCase('missing_radius_scope_disclosed', async ({ db, preview }) => {
    seedSystemWatch(db, {
      watchId: 1,
      included: '',
      excluded: ''
    });
    const next = await preview(db);
    const zkill = row(next, 'zkill_discovery');
    assert(zkill.identity_confidence === 'derived_with_gaps', 'missing radius scope should derive only with gaps');
    assert(zkill.unknown_or_uncomputable.some((entry) => entry.fact === 'included_system_ids' && entry.reason.includes('no stored')), 'missing included scope should be disclosed');
    assert(zkill.unknown_or_uncomputable.some((entry) => entry.fact === 'excluded_system_ids' && entry.reason.includes('no stored')), 'missing excluded scope should be disclosed');
    assert(anchorValue(zkill, 'included_system_scope_status') === 'not_stored', 'missing included scope status should be anchored');
  }, { deferPreview: true }));

  results.push(await runCase('malformed_radius_scope_disclosed', async ({ db, preview }) => {
    seedSystemWatch(db, {
      watchId: 1,
      included: 'not-json',
      excluded: '{"not":"an array"}'
    });
    const next = await preview(db);
    const zkill = row(next, 'zkill_discovery');
    assert(zkill.identity_confidence === 'derived_with_gaps', 'malformed radius scope should derive only with gaps');
    assert(zkill.unknown_or_uncomputable.some((entry) => entry.fact === 'included_system_ids' && entry.reason.includes('malformed')), 'malformed included scope should be disclosed');
    assert(zkill.unknown_or_uncomputable.some((entry) => entry.fact === 'excluded_system_ids' && entry.reason.includes('malformed')), 'malformed excluded scope should be disclosed');
    assert(anchorValue(zkill, 'included_system_scope_status') === 'malformed', 'malformed included scope status should be anchored');
    assert(anchorValue(zkill, 'excluded_system_scope_status') === 'malformed', 'malformed excluded scope status should be anchored');
  }, { deferPreview: true }));

  results.push(await runCase('pending_discovery_ref_without_hash', async ({ db, preview }) => {
    seedDiscoveryRef(db, {
      killmailId: 930001,
      hash: '',
      status: 'pending'
    });
    const next = await preview(db);
    const expansion = row(next, 'esi_evidence_expansion');
    assert(expansion.identity_derivable_now === false, 'pending Discovery ref without hash should not derive ESI identity');
    assert(expansion.unknown_or_uncomputable.some((entry) => entry.fact === 'discovery_ref_identity'), 'missing hash should be reported as no selectable identity');
  }, { deferPreview: true }));

  results.push(await runCase('failed_discovery_ref_with_hash', async ({ db, preview }) => {
    seedDiscoveryRef(db, {
      killmailId: 930002,
      hash: 'hash_failed_retry',
      status: 'failed',
      failureCount: 1,
      lastError: 'fixture retryable'
    });
    const next = await preview(db);
    const expansion = row(next, 'esi_evidence_expansion');
    assert(expansion.identity_derivable_now === true, 'failed Discovery ref with hash may derive retry identity');
    assert(anchorValue(expansion, 'status') === 'failed', 'failed ref status should remain anchored');
    assert(expansion.source_basis.some((entry) => entry.includes('Discovery-ref shaped')), 'failed ref should remain Discovery staging/provenance');
    assert(expansion.duplicate_prevention_basis.some((entry) => entry.includes('must not become sequencer state')), 'failed ref must not become sequencer state');
  }, { deferPreview: true }));

  results.push(await runCase('cached_evidence_ref_skip_posture', async ({ db, preview }) => {
    seedDiscoveryRef(db, {
      killmailId: 930003,
      hash: 'hash_cached',
      status: 'pending'
    });
    seedKillmail(db, 930003, 'hash_cached');
    const next = await preview(db);
    const expansion = row(next, 'esi_evidence_expansion');
    assert(anchorValue(expansion, 'cached_evidence_exists') === true, 'cached matching Evidence/EVEidence should be disclosed');
    assert(anchorValue(expansion, 'cache_skip_posture') === 'skip_or_treat_as_cached_before_provider_movement', 'cached row should disclose skip/cache posture');
    assert(expansion.duplicate_prevention_basis.some((entry) => entry.includes('provider movement is not required')), 'cached row should not imply required provider movement');
  }, { deferPreview: true }));

  results.push(await runCase('no_hydration_candidates', async ({ db, preview }) => {
    seedDiscoveryRef(db, {
      killmailId: 930004,
      hash: 'hash_no_hydration',
      status: 'pending'
    });
    const next = await preview(db);
    assert(row(next, 'view_local_record').identity_confidence === 'uncomputable', 'no view/local Hydration candidate should be uncomputable');
    assert(row(next, 'watch_background').identity_confidence === 'uncomputable', 'no Watch/background Hydration candidate should be uncomputable');
  }, { deferPreview: true }));

  results.push(await runCase('hydration_candidate_missing_source_anchors', async ({ db, preview }) => {
    const next = await preview(db, {
      hydrationFixturePreview: hydrationFixture([
        hydrationCandidate({
          dedupeKey: 'entity:character:940001',
          lanes: ['view_local_record', 'watch_background'],
          sourceAnchors: []
        })
      ])
    }, { allowPatientPacketIdentityFixtureHydration: true });
    const view = row(next, 'view_local_record');
    const watch = row(next, 'watch_background');
    assert(view.identity_confidence === 'derived_with_gaps', 'missing view/local source anchors should weaken identity confidence');
    assert(watch.identity_confidence === 'derived_with_gaps', 'missing Watch/background source anchors should weaken identity confidence');
    assert(view.unknown_or_uncomputable.some((entry) => entry.fact === 'hydration_source_anchors'), 'view/local missing anchors should be disclosed');
    assert(watch.unknown_or_uncomputable.some((entry) => entry.fact === 'hydration_source_anchors'), 'Watch/background missing anchors should be disclosed');
  }, { deferPreview: true }));

  results.push(await runCase('local_sde_gap_distinct_from_provider_needed_label', async ({ db, preview }) => {
    const next = await preview(db, {
      hydrationFixturePreview: hydrationFixture([
        hydrationCandidate({
          dedupeKey: 'local_sde:inventory_type:999999',
          candidateKind: 'local_sde_lookup',
          entityType: null,
          entityId: null,
          lookupType: 'inventory_type',
          lookupId: 999999,
          labelState: 'local_sde_gap',
          providerNeeded: false,
          lanes: ['view_local_record'],
          sourceAnchors: [{ type: 'local_lookup_table', value: 'type_metadata' }]
        }),
        hydrationCandidate({
          dedupeKey: 'entity:character:940002',
          lanes: ['watch_background'],
          sourceAnchors: [{ type: 'killmail_ids', value: [940002] }]
        })
      ])
    }, { allowPatientPacketIdentityFixtureHydration: true });
    const view = row(next, 'view_local_record');
    const watch = row(next, 'watch_background');
    assert(view.candidate_kind === 'local_sde_lookup', 'view/local row should be able to represent a local SDE gap');
    assert(anchorValue(view, 'provider_needed') === false, 'local SDE gap should not be provider-needed');
    assert(view.duplicate_prevention_basis.some((entry) => entry.includes('local SDE lookup gaps stay local')), 'local SDE gap should stay local readiness posture');
    assert(watch.candidate_kind === 'entity_label', 'Watch/background row should separately represent provider-needed entity label');
    assert(anchorValue(watch, 'provider_needed') === true, 'entity label should remain provider-needed Hydration/readability');
  }, { deferPreview: true }));

  results.push(await runCase('mixed_view_and_watch_hydration_lanes', async ({ db, preview }) => {
    seedActorWatch(db, 1, 940003);
    seedKillmail(db, 940003, 'hash_mixed_hydration');
    seedActivityEvent(db, {
      killmailId: 940003,
      eventKey: '940003:attacker:940003',
      entityId: 940003,
      characterId: 940003,
      corporationId: 980003,
      discoveredByType: 'actor',
      discoveredById: '940003'
    });
    const next = await preview(db);
    const view = row(next, 'view_local_record');
    const watch = row(next, 'watch_background');
    assert(view.identity_derivable_now === true, 'mixed Hydration should derive view/local row');
    assert(watch.identity_derivable_now === true, 'mixed Hydration should derive Watch/background row');
    assert(String(view.derived_identity_key).includes('|view_local_record|'), 'view/local identity should be lane-specific');
    assert(String(watch.derived_identity_key).includes('|watch_background|'), 'Watch/background identity should be lane-specific');
    assert(view.duplicate_prevention_basis.includes('view/local-record identity remains ahead of background lanes'), 'view/local should not be starved by background');
    assert(watch.duplicate_prevention_basis.includes('Watch/background identity remains patient and must not starve view/local-record Hydration'), 'Watch/background should remain patient');
  }, { deferPreview: true }));

  console.log(JSON.stringify({
    status: 'patient packet identity sparse matrix verified',
    cases: results.map((entry) => entry.case),
    required_cases_covered: results.length,
    boundary: {
      read_only: true,
      provider_calls: 0,
      writes: 0,
      packet_tables_created: 0,
      persisted_queue_created: false,
      dispatcher_added: false,
      enforcement_active: false,
      ui_work: false
    }
  }, null, 2));
  console.log('patient packet identity sparse matrix verified');
}

async function runCase(name, verify, options = {}) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const preview = async (database, payload = {}, context = {}) => {
      const before = sideEffectCounts(database);
      const result = await invokeServiceCommand('runtime.patient_packet_identity.preview', {
        now: NOW,
        limit: 12,
        ...payload
      }, {
        db: database,
        ...context
      });
      const after = sideEffectCounts(database);
      assertSame(after, before, `${name} preview should not mutate tables`);
      verifyReadOnlyBoundary(result);
      return result;
    };
    const initialPreview = options.deferPreview ? null : await preview(db);
    await verify({ db, preview: options.deferPreview ? preview : initialPreview, runPreview: preview });
    return { case: name, status: 'passed' };
  } finally {
    closeDatabase(db);
  }
}

function verifyReadOnlyBoundary(preview) {
  assert(preview.read_only === true, 'preview should be read-only');
  assert(preview.mutates_state === false, 'preview should not mutate state');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.dispatches === 0, 'preview should not dispatch');
  assert(preview.packet_tables_created === 0, 'preview should not create packet tables');
  assert(preview.persisted_queue_created === false, 'preview should not create persisted queues');
  assert(preview.active_dispatcher === false, 'preview should not add dispatcher');
  assert(preview.zkill_discovery_executions === 0, 'preview should not execute zKill Discovery');
  assert(preview.esi_evidence_expansion_executions === 0, 'preview should not execute ESI Evidence Expansion');
  assert(preview.hydration_executions === 0, 'preview should not execute Hydration');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.discovery_ref_mutations === 0, 'preview should not mutate Discovery refs');
  assert(preview.watch_mutations === 0, 'preview should not mutate Watch');
  assert(preview.assessment_memory_mutations === 0, 'preview should not mutate Assessment Memory');
  assert(preview.marked_mutations === 0, 'preview should not mutate Marked');
  assert(preview.storage_config_writes === 0, 'preview should not write storage config');
  assert(preview.storage_movements === 0, 'preview should not move storage');
  assert(preview.support_artifacts_created === 0, 'preview should not create support artifacts');
  assert(preview.schema_changes === false, 'preview should not change schema');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate runtime enforcement');
  assert(preview.command_blocking_active === false, 'preview should not block commands');
  assert(preview.pruning_deletion_behavior === false, 'preview should not add pruning/deletion behavior');
  assert(preview.ui_work === false, 'preview should not add UI');
}

function seedActorWatch(db, watchId, entityId) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes
    ) VALUES (?, 'character', ?, ?, 30, 5, 1, 60)
  `).run(watchId, entityId, `Fixture ${entityId}`);
}

function seedSystemWatch(db, input) {
  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    input.watchId,
    input.centerSystemId || 30000100,
    input.centerSystemName || 'Fixture System',
    input.radiusJumps || 2,
    input.included,
    input.excluded,
    input.lookbackHours || 24,
    input.maxSystems || 3,
    input.maxKillmails || 12,
    input.pollInterval || 90
  );
}

function seedDiscoveryRef(db, input) {
  db.prepare(`
    INSERT INTO discovered_killmail_refs (
      killmail_id, killmail_hash, discovered_by_type, discovered_by_id,
      source_scope, source_system_id, source_actor_type, source_actor_id,
      discovered_at, first_seen_run_id, last_seen_run_id, last_seen_at,
      status, failure_count, last_error, priority, preview_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.killmailId,
    input.hash,
    input.discoveredByType || 'actor',
    input.discoveredById || '940000',
    input.sourceScope || input.discoveredById || '940000',
    input.sourceSystemId || null,
    input.sourceActorType || 'character',
    input.sourceActorId || 940000,
    '2026-06-03T11:00:00.000Z',
    'run_sparse_fixture',
    'run_sparse_fixture',
    '2026-06-03T11:00:00.000Z',
    input.status,
    input.failureCount || 0,
    input.lastError || null,
    input.priority || 1,
    '{}'
  );
}

function seedKillmail(db, killmailId, hash) {
  db.prepare(`
    INSERT INTO killmails (
      killmail_id, killmail_hash, killmail_time, solar_system_id,
      raw_esi_payload, raw_payload_checksum, source,
      first_seen_at, last_seen_at, ingested_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    killmailId,
    hash,
    '2026-06-03T11:15:00.000Z',
    30000100,
    '{}',
    `checksum_${killmailId}`,
    'fixture',
    '2026-06-03T11:16:00.000Z',
    '2026-06-03T11:16:00.000Z',
    '2026-06-03T11:16:00.000Z'
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
    ) VALUES (?, ?, 'attacker', 'character', ?, NULL, ?, NULL, ?, NULL, NULL, NULL, 603, NULL, NULL, 1, 100, 30000100, NULL, 10000001, NULL, ?, ?, ?, ?, 'fixture')
  `).run(
    input.eventKey,
    input.killmailId,
    input.entityId,
    input.characterId,
    input.corporationId,
    '2026-06-03T11:15:00.000Z',
    '2026-06-03T11:16:00.000Z',
    input.discoveredByType,
    input.discoveredById
  );
}

function hydrationFixture(candidates) {
  const lanes = ['view_local_record', 'watch_background'].map((laneId) => {
    const laneCandidates = candidates.filter((candidate) => candidate.lanes.includes(laneId));
    return {
      lane_id: laneId,
      candidate_count: laneCandidates.length,
      provider_needed_count: laneCandidates.filter((candidate) => candidate.provider_needed).length,
      local_sde_gap_count: laneCandidates.filter((candidate) => candidate.label_state === 'local_sde_gap').length,
      representatives: laneCandidates,
      waiting_is_failure: false,
      persisted_queue: false
    };
  });
  return {
    summary: {
      total_candidates: candidates.length,
      provider_needed_candidates: candidates.filter((candidate) => candidate.provider_needed).length,
      local_sde_gap_candidates: candidates.filter((candidate) => candidate.label_state === 'local_sde_gap').length
    },
    lanes,
    candidates
  };
}

function hydrationCandidate(input) {
  return {
    dedupe_key: input.dedupeKey,
    candidate_kind: input.candidateKind || 'entity_label',
    entity_type: input.entityType === undefined ? 'character' : input.entityType,
    entity_id: input.entityId === undefined ? 940001 : input.entityId,
    lookup_type: input.lookupType || null,
    lookup_id: input.lookupId || null,
    label_state: input.labelState || 'provider_needed',
    local_label: null,
    provider_needed: input.providerNeeded ?? true,
    lanes: input.lanes,
    source_anchors: input.sourceAnchors || [],
    source_basis: input.sourceBasis || ['fixture_sparse_matrix'],
    hydration_boundary: 'Fixture Hydration candidate remains readability-only.',
    evidence_boundary: 'Fixture Hydration candidate is not Evidence/EVEidence.'
  };
}

function row(preview, lane) {
  const entry = preview.identity_rows.find((candidate) => candidate.lane === lane);
  assert(entry, `${lane} identity row should exist`);
  return entry;
}

function anchorValue(identityRow, type) {
  const entry = identityRow.source_anchors.find((anchor) => anchor.type === type);
  return entry ? entry.value : undefined;
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
