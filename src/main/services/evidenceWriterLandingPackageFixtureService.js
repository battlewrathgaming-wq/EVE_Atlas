const fixtureKillmail = require('../../../fixtures/killmail-1001.json');
const { openDatabase, migrate, closeDatabase } = require('../db/database');
const { EvidenceRepository } = require('../db/evidenceRepository');
const { evidencePackageFromExpandedKillmails } = require('../workers/killmailIngestionWorker');

const ACTION = 'evidence.writer_landing_package_fixture.preview';
const FIXTURE_NOW = '2026-06-07T18:00:00.000Z';

function buildEvidenceWriterLandingPackageFixturePreview(input = {}) {
  const db = openDatabase(':memory:');
  migrate(db);
  const repository = new EvidenceRepository(db);
  const providerInvocation = { zkill: 0, esi: 0, live_api: 0 };

  try {
    const cases = {
      clean_payload: runCleanPayloadCase(db, repository),
      idempotent_rerun: runIdempotentRerunCase(db, repository),
      local_cache_existing: runLocalCacheExistingCase(db, repository),
      duplicate_conflicting_killmail: runDuplicateConflictCase(db, repository),
      mixed_clean_plus_conflict_package: runMixedCleanConflictPackageCase(db, repository),
      partial_missing_attackers: runPartialPayloadCase(db, repository),
      malformed_missing_killmail_id: runMalformedMissingKillmailIdCase(db, repository),
      malformed_missing_solar_system_id_rollback: runMalformedMissingDurableFieldRollbackCase(db, repository)
    };
    const finalCounts = snapshot(db);
    const unchanged = unchangedTables(finalCounts);
    const foreignKeyCheck = db.prepare('PRAGMA foreign_key_check').all();

    return {
      action: ACTION,
      proof_status: 'fixture_writer_landing_package_proven',
      generated_at: new Date().toISOString(),
      fixture_only: true,
      disposable_db: {
        posture: 'internal_memory_db_only',
        path: ':memory:',
        operator_corpus_mutated: false,
        context_db_used: false,
        requested_context_db_ignored: true
      },
      fixture_run_context: {
        fixed_now: FIXTURE_NOW,
        source_type: 'discovery_fixture',
        source_id: 'hs387_selected_ready_candidate',
        uses_current_package_builder: 'evidencePackageFromExpandedKillmails',
        uses_current_writer: 'EvidenceRepository.persistEvidencePackage'
      },
      candidate_basis_used: selectedCandidateBasis(),
      payload_basis_used: {
        provider: 'esi_fixture_payload',
        live_provider_payload_used: false,
        injected_payloads_only: true,
        clean_payload_killmail_id: 100138701,
        conflict_payload_killmail_id: 100138703,
        mixed_clean_payload_killmail_id: 100138708,
        mixed_conflict_payload_killmail_id: 100138707
      },
      cases,
      provider_invocation: {
        ...providerInvocation,
        provider_not_invoked: true
      },
      tables_proven_unchanged: unchanged,
      final_fixture_counts: finalCounts.counts,
      foreign_key_check: {
        ok: foreignKeyCheck.length === 0,
        rows: foreignKeyCheck
      },
      boundary: boundary(),
      risks_and_parked_work: [
        'This command is a disposable fixture proof around the production writer boundary.',
        'Duplicate/conflicting killmail dependent-row suppression is hardened in the writer and proven here.',
        'Runtime Discovery ESI-backed execution, actor.watch redirect, mixed collector retirement, Watch cadence updates, schema, queues, dispatcher, UI, and enforcement remain parked.'
      ],
      input_ignored_for_safety: Object.keys(input || {}).length > 0
    };
  } finally {
    closeDatabase(db);
  }
}

function runCleanPayloadCase(db, repository) {
  const before = snapshot(db);
  const run = createFixtureRun(repository, 'hs387_clean_payload');
  const raw = expandedKillmail(100138701, {
    killmail_time: '2026-06-07T18:01:00Z',
    solar_system_id: 30000142
  });
  const pkg = buildPackage([entry(raw, 'hs387_clean_hash')], run);
  const result = repository.persistEvidencePackage(pkg);
  repository.finalizeFetchRun(run.run_id, {
    discovered_refs: 1,
    expanded_new: result.killmailsWritten,
    activity_events_written: result.eventsWritten,
    api_calls_zkill: 0,
    api_calls_esi: 0
  }, 'success');
  const after = snapshot(db);
  const readback = readKillmail(db, raw.killmail_id);
  return {
    proof_status: 'clean_payload_landed',
    candidate_basis: selectedCandidateBasis(raw.killmail_id, 'hs387_clean_hash'),
    persist_result: result,
    deltas: deltas(before, after),
    readback: {
      killmail: readback,
      raw_payload_checksum_matches: readback.raw_payload_checksum === pkg.killmails[0].raw_payload_checksum,
      raw_payload_killmail_id: JSON.parse(readback.raw_esi_payload).killmail_id,
      activity_events: rowsForKillmail(db, raw.killmail_id),
      ingestion_audits: auditsForKillmail(db, raw.killmail_id),
      warnings: warningsForKillmail(db, raw.killmail_id)
    },
    expected: {
      killmails_written: 1,
      activity_events_written: 7,
      entities_present: true,
      warnings_expected: 0
    }
  };
}

function runIdempotentRerunCase(db, repository) {
  const run1 = createFixtureRun(repository, 'hs387_idempotent_first');
  const raw = expandedKillmail(100138702, {
    killmail_time: '2026-06-07T18:02:00Z',
    solar_system_id: 30000142
  });
  const firstPackage = buildPackage([entry(raw, 'hs387_idempotent_hash')], run1);
  repository.persistEvidencePackage(firstPackage);

  const before = snapshot(db);
  const run2 = createFixtureRun(repository, 'hs387_idempotent_second');
  const secondPackage = buildPackage([entry(raw, 'hs387_idempotent_hash')], run2);
  const result = repository.persistEvidencePackage(secondPackage);
  const after = snapshot(db);

  return {
    proof_status: 'same_payload_rerun_idempotent',
    persist_result: result,
    deltas: deltas(before, after),
    classification: result.killmailsWritten === 0 && result.eventsWritten === 0
      ? 'same_payload_rerun_did_not_duplicate_killmail_or_activity_events'
      : 'unexpected_duplicate_rows_detected',
    raw_payload_checksum_comparison: {
      existing: readKillmail(db, raw.killmail_id).raw_payload_checksum,
      incoming: secondPackage.killmails[0].raw_payload_checksum,
      matches: readKillmail(db, raw.killmail_id).raw_payload_checksum === secondPackage.killmails[0].raw_payload_checksum
    }
  };
}

function runLocalCacheExistingCase(db, repository) {
  const raw = expandedKillmail(100138702, {
    killmail_time: '2026-06-07T18:02:00Z',
    solar_system_id: 30000142
  });
  const before = snapshot(db);
  const alreadyCached = repository.hasKillmail(raw.killmail_id);
  const after = snapshot(db);
  return {
    proof_status: alreadyCached ? 'local_cache_existing_before_provider_movement' : 'local_cache_missing',
    candidate_basis: selectedCandidateBasis(raw.killmail_id, 'hs387_idempotent_hash'),
    already_cached: alreadyCached,
    provider_invoked: false,
    package_built: false,
    persist_invoked: false,
    deltas: deltas(before, after),
    posture: 'current pre-provider cache skip basis is repository.hasKillmail(killmail_id)'
  };
}

function runDuplicateConflictCase(db, repository) {
  const original = expandedKillmail(100138703, {
    killmail_time: '2026-06-07T18:03:00Z',
    solar_system_id: 30000142
  });
  const originalRun = createFixtureRun(repository, 'hs387_conflict_original');
  const originalPackage = buildPackage([entry(original, 'hs387_original_hash')], originalRun);
  repository.persistEvidencePackage(originalPackage);
  const existingBefore = readKillmail(db, original.killmail_id);

  const before = snapshot(db);
  const conflict = expandedKillmail(100138703, {
    killmail_time: '2026-06-07T19:03:00Z',
    solar_system_id: 30000143,
    victim: {
      ...fixtureKillmail.victim,
      character_id: 900138703,
      character_name: 'Conflicting Victim'
    },
    attackers: [
      {
        ...fixtureKillmail.attackers[0],
        character_id: 900138704,
        character_name: 'Conflicting Attacker',
        corporation_id: 980138704,
        corporation_name: 'Conflicting Corp',
        alliance_id: 990138704,
        alliance_name: 'Conflicting Alliance'
      }
    ]
  });
  const conflictRun = createFixtureRun(repository, 'hs387_conflict_incoming');
  const conflictPackage = buildPackage([entry(conflict, 'hs387_conflicting_hash')], conflictRun);
  const result = repository.persistEvidencePackage(conflictPackage);
  const after = snapshot(db);
  const existingAfter = readKillmail(db, original.killmail_id);
  const warningRows = warningsForKillmail(db, original.killmail_id);
  const eventRows = rowsForKillmail(db, original.killmail_id);

  return {
    proof_status: 'duplicate_conflicting_killmail_behavior_disclosed',
    persist_result: result,
    deltas: deltas(before, after),
    raw_payload_checksum_comparison: {
      existing_before: existingBefore.raw_payload_checksum,
      incoming: conflictPackage.killmails[0].raw_payload_checksum,
      existing_after: existingAfter.raw_payload_checksum,
      existing_raw_payload_preserved: existingAfter.raw_payload_checksum === existingBefore.raw_payload_checksum,
      incoming_checksum_differs: conflictPackage.killmails[0].raw_payload_checksum !== existingBefore.raw_payload_checksum
    },
    warning_classifications: warningRows.map((row) => row.warning_type),
    conflict_behavior_classification: result.eventsWritten > 0
      ? 'existing_killmail_raw_row_preserved_but_conflicting_incoming_activity_events_inserted'
      : 'existing_killmail_raw_row_preserved_and_conflicting_dependent_rows_suppressed',
    dependent_row_suppression: result.conflictDependentRowsSuppressed || null,
    readback: {
      killmail: existingAfter,
      warning_rows: warningRows,
      activity_event_count_for_killmail: eventRows.length,
      incoming_conflict_event_keys_present: eventRows
        .filter((row) => row.entity_name && row.entity_name.includes('Conflicting'))
        .map((row) => row.event_key)
    },
    recommended_follow_up: result.eventsWritten > 0
      ? 'Open writer hardening packet to decide whether conflicting incoming participant rows should be suppressed or terminally rejected.'
      : 'Current writer suppresses conflicting incoming dependent rows while preserving the stored raw killmail row and conflict warning.'
  };
}

function runMixedCleanConflictPackageCase(db, repository) {
  const existingConflict = expandedKillmail(100138707, {
    killmail_time: '2026-06-07T18:07:00Z',
    solar_system_id: 30000142,
    victim: {
      ...fixtureKillmail.victim,
      character_id: 900138707,
      character_name: 'Mixed Original Victim',
      corporation_id: 980138707,
      corporation_name: 'Mixed Original Corp',
      alliance_id: 990138707,
      alliance_name: 'Mixed Original Alliance'
    },
    attackers: [
      {
        ...fixtureKillmail.attackers[0],
        character_id: 900138717,
        character_name: 'Mixed Original Attacker',
        corporation_id: 980138717,
        corporation_name: 'Mixed Original Attackers',
        alliance_id: 990138717,
        alliance_name: 'Mixed Original Coalition'
      }
    ]
  });
  const originalRun = createFixtureRun(repository, 'hs391_mixed_conflict_original');
  const originalPackage = buildPackage([entry(existingConflict, 'hs391_mixed_original_hash')], originalRun);
  repository.persistEvidencePackage(originalPackage);
  const existingBefore = readKillmail(db, existingConflict.killmail_id);

  const clean = expandedKillmail(100138708, {
    killmail_time: '2026-06-07T18:08:00Z',
    solar_system_id: 30000144,
    victim: {
      ...fixtureKillmail.victim,
      character_id: 900138708,
      character_name: 'Mixed Clean Victim',
      corporation_id: 980138708,
      corporation_name: 'Mixed Clean Corp',
      alliance_id: 990138708,
      alliance_name: 'Mixed Clean Alliance'
    },
    attackers: [
      {
        ...fixtureKillmail.attackers[0],
        character_id: 900138718,
        character_name: 'Mixed Clean Attacker',
        corporation_id: 980138718,
        corporation_name: 'Mixed Clean Attackers',
        alliance_id: 990138718,
        alliance_name: 'Mixed Clean Coalition'
      },
      {
        ...fixtureKillmail.attackers[1],
        character_id: 900138719,
        character_name: 'Mixed Clean Wing',
        corporation_id: 980138718,
        corporation_name: 'Mixed Clean Attackers',
        alliance_id: 990138718,
        alliance_name: 'Mixed Clean Coalition'
      }
    ]
  });
  const conflict = expandedKillmail(100138707, {
    killmail_time: '2026-06-07T19:07:00Z',
    solar_system_id: 30000145,
    victim: {
      ...fixtureKillmail.victim,
      character_id: 900138727,
      character_name: 'Mixed Conflicting Victim',
      corporation_id: 980138727,
      corporation_name: 'Mixed Conflicting Corp',
      alliance_id: 990138727,
      alliance_name: 'Mixed Conflicting Alliance'
    },
    attackers: [
      {
        ...fixtureKillmail.attackers[0],
        character_id: 900138728,
        character_name: 'Mixed Conflicting Attacker',
        corporation_id: 980138728,
        corporation_name: 'Mixed Conflicting Attackers',
        alliance_id: 990138728,
        alliance_name: 'Mixed Conflicting Coalition'
      }
    ]
  });
  const before = snapshot(db);
  const mixedRun = createFixtureRun(repository, 'hs391_mixed_clean_conflict');
  const mixedPackage = buildPackage([
    entry(clean, 'hs391_mixed_clean_hash'),
    entry(conflict, 'hs391_mixed_conflicting_hash')
  ], mixedRun);
  const result = repository.persistEvidencePackage(mixedPackage);
  const after = snapshot(db);
  const existingAfter = readKillmail(db, existingConflict.killmail_id);
  const cleanRows = rowsForKillmail(db, clean.killmail_id);
  const conflictRows = rowsForKillmail(db, existingConflict.killmail_id);
  const warningRows = warningsForKillmail(db, existingConflict.killmail_id);

  return {
    proof_status: 'mixed_clean_plus_conflict_package_proven',
    persist_result: result,
    deltas: deltas(before, after),
    clean_killmail: {
      killmail_id: clean.killmail_id,
      hash: 'hs391_mixed_clean_hash',
      readback: readKillmail(db, clean.killmail_id),
      raw_payload_checksum_matches: readKillmail(db, clean.killmail_id).raw_payload_checksum === mixedPackage.killmails[0].raw_payload_checksum,
      activity_event_count: cleanRows.length,
      activity_events: cleanRows,
      ingestion_audits: auditsForKillmail(db, clean.killmail_id),
      warnings: warningsForKillmail(db, clean.killmail_id)
    },
    conflicting_killmail: {
      killmail_id: existingConflict.killmail_id,
      raw_payload_checksum_comparison: {
        existing_before: existingBefore.raw_payload_checksum,
        incoming: mixedPackage.killmails[1].raw_payload_checksum,
        existing_after: existingAfter.raw_payload_checksum,
        existing_raw_payload_preserved: existingAfter.raw_payload_checksum === existingBefore.raw_payload_checksum,
        incoming_checksum_differs: mixedPackage.killmails[1].raw_payload_checksum !== existingBefore.raw_payload_checksum
      },
      readback: existingAfter,
      warning_classifications: warningRows.map((row) => row.warning_type),
      incoming_conflict_event_keys_present: conflictRows
        .filter((row) => row.entity_name && row.entity_name.includes('Mixed Conflicting'))
        .map((row) => row.event_key),
      activity_event_count_for_killmail: conflictRows.length,
      ingestion_audits: auditsForKillmail(db, existingConflict.killmail_id)
    },
    classification: result.killmailsWritten === 1 && result.eventsWritten === cleanRows.length && result.conflictDependentRowsSuppressed?.activity_events > 0
      ? 'clean_rows_landed_conflict_dependent_rows_suppressed'
      : 'unexpected_mixed_package_posture'
  };
}

function runPartialPayloadCase(db, repository) {
  const before = snapshot(db);
  const run = createFixtureRun(repository, 'hs387_partial_missing_attackers');
  const raw = expandedKillmail(100138704, {
    killmail_time: '2026-06-07T18:04:00Z',
    solar_system_id: 30000142,
    attackers: []
  });
  const pkg = buildPackage([entry(raw, 'hs387_partial_hash')], run);
  const result = repository.persistEvidencePackage(pkg);
  const after = snapshot(db);
  return {
    proof_status: 'partial_payload_landed_with_warning',
    persist_result: result,
    deltas: deltas(before, after),
    warning_classifications: warningsForKillmail(db, raw.killmail_id).map((row) => row.warning_type),
    readback: {
      killmail: readKillmail(db, raw.killmail_id),
      activity_events: rowsForKillmail(db, raw.killmail_id),
      ingestion_audits: auditsForKillmail(db, raw.killmail_id),
      warnings: warningsForKillmail(db, raw.killmail_id)
    }
  };
}

function runMalformedMissingKillmailIdCase(db, repository) {
  const before = snapshot(db);
  let error = null;
  try {
    const run = {
      run_id: 'hs387_malformed_no_killmail_id_unpersisted',
      started_at: FIXTURE_NOW
    };
    const raw = expandedKillmail(100138705, {
      killmail_time: '2026-06-07T18:05:00Z',
      solar_system_id: 30000142
    });
    delete raw.killmail_id;
    buildPackage([entry(raw, 'hs387_malformed_hash')], run);
  } catch (caught) {
    error = caught;
  }
  const after = snapshot(db);
  return {
    proof_status: error ? 'normalizer_rejected_before_writer_landing' : 'unexpected_package_built',
    error_message: error?.message || null,
    package_built: false,
    persist_invoked: false,
    deltas: deltas(before, after),
    rollback_or_no_partial_write_evidence: landingDeltasAreZero(before, after)
  };
}

function runMalformedMissingDurableFieldRollbackCase(db, repository) {
  const before = snapshot(db);
  let error = null;
  try {
    const run = createFixtureRun(repository, 'hs387_malformed_no_system_id');
    const raw = expandedKillmail(100138706, {
      killmail_time: '2026-06-07T18:06:00Z'
    });
    delete raw.solar_system_id;
    const pkg = buildPackage([entry(raw, 'hs387_missing_system_hash')], run);
    repository.persistEvidencePackage(pkg);
  } catch (caught) {
    error = caught;
  }
  const after = snapshot(db);
  return {
    proof_status: error ? 'writer_transaction_rolled_back_required_field_failure' : 'unexpected_missing_required_field_landed',
    error_message: error?.message || null,
    deltas: deltas(before, after),
    rollback_or_no_partial_write_evidence: landingDeltasAreZero(before, after),
    fixture_run_context_written_before_writer_transaction: true
  };
}

function createFixtureRun(repository, suffix) {
  return repository.createFetchRun({
    runId: `hs387_${suffix}`,
    trigger: 'hs387_fixture',
    watchType: 'discovery_evidence_writer_fixture',
    watchId: 'fixture:selected-ready'
  });
}

function buildPackage(killmails, run) {
  return evidencePackageFromExpandedKillmails({
    killmails,
    run: {
      run_id: run.run_id,
      source_type: 'discovery_fixture',
      source_id: 'hs387_selected_ready_candidate',
      started_at: run.started_at
    },
    discoveredBy: {
      type: 'discovery_fixture',
      id: 387
    }
  });
}

function entry(raw, hash) {
  return { raw, hash };
}

function expandedKillmail(killmailId, overrides = {}) {
  return {
    ...fixtureKillmail,
    killmail_id: killmailId,
    killmail_time: overrides.killmail_time || fixtureKillmail.killmail_time,
    solar_system_id: overrides.solar_system_id ?? fixtureKillmail.solar_system_id,
    victim: overrides.victim === undefined ? fixtureKillmail.victim : overrides.victim,
    attackers: overrides.attackers === undefined ? fixtureKillmail.attackers : overrides.attackers
  };
}

function selectedCandidateBasis(killmailId = 100138701, killmailHash = 'hs387_clean_hash') {
  return {
    source_surface: 'Discovery ESI-backed expansion intake fixture',
    posture: 'selected_ready_for_future_esi_expansion',
    killmail_id: killmailId,
    killmail_hash: killmailHash,
    source_kind: 'watch_actor',
    scope_key: 'actor:character:90000001',
    receipt_id: 'fixture_receipt_hs387',
    packet_id: 'fixture_packet_hs387_0',
    candidate_refs_are_possible_leads: true,
    candidate_refs_are_evidence: false
  };
}

function snapshot(db) {
  return {
    counts: {
      killmails: count(db, 'killmails'),
      activity_events: count(db, 'activity_events'),
      entities: count(db, 'entities'),
      ingestion_audits: count(db, 'ingestion_audits'),
      data_quality_warnings: count(db, 'data_quality_warnings'),
      discovered_killmail_refs: count(db, 'discovered_killmail_refs'),
      api_request_logs: count(db, 'api_request_logs'),
      fetch_runs: count(db, 'fetch_runs'),
      metadata_runs: count(db, 'metadata_runs'),
      watchlist_entities: count(db, 'watchlist_entities'),
      system_watches: count(db, 'system_watches'),
      assessment_artifacts: count(db, 'assessment_artifacts')
    }
  };
}

function deltas(before, after) {
  const output = {};
  for (const [key, value] of Object.entries(after.counts)) {
    output[key] = value - (before.counts[key] || 0);
  }
  return output;
}

function landingDeltasAreZero(before, after) {
  const delta = deltas(before, after);
  return [
    'killmails',
    'activity_events',
    'entities',
    'ingestion_audits',
    'data_quality_warnings',
    'discovered_killmail_refs',
    'api_request_logs',
    'metadata_runs',
    'watchlist_entities',
    'system_watches',
    'assessment_artifacts'
  ].every((key) => delta[key] === 0);
}

function unchangedTables(snapshotResult) {
  return {
    discovered_killmail_refs: snapshotResult.counts.discovered_killmail_refs === 0,
    api_request_logs: snapshotResult.counts.api_request_logs === 0,
    watch_tables: snapshotResult.counts.watchlist_entities === 0 && snapshotResult.counts.system_watches === 0,
    hydration_metadata_tables: snapshotResult.counts.metadata_runs === 0,
    assessment_tables: snapshotResult.counts.assessment_artifacts === 0
  };
}

function readKillmail(db, killmailId) {
  return db.prepare(`
    SELECT killmail_id, killmail_hash, killmail_time, solar_system_id,
           raw_esi_payload, raw_payload_checksum, source
    FROM killmails
    WHERE killmail_id = ?
  `).get(killmailId);
}

function rowsForKillmail(db, killmailId) {
  return db.prepare(`
    SELECT event_key, role, entity_type, entity_id, entity_name, solar_system_id, killmail_time
    FROM activity_events
    WHERE killmail_id = ?
    ORDER BY event_key
  `).all(killmailId);
}

function auditsForKillmail(db, killmailId) {
  return db.prepare(`
    SELECT run_id, killmail_id, raw_payload_checksum, normalized_event_count,
           attacker_count, victim_present, warnings
    FROM ingestion_audits
    WHERE killmail_id = ?
    ORDER BY run_id
  `).all(killmailId);
}

function warningsForKillmail(db, killmailId) {
  return db.prepare(`
    SELECT run_id, killmail_id, warning_type, message
    FROM data_quality_warnings
    WHERE killmail_id = ?
    ORDER BY warning_type, run_id
  `).all(killmailId);
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function boundary() {
  return [
    'Fixture-only writer landing proof; not a production writer rewrite.',
    'Uses injected expanded ESI killmail payloads only; zKill, ESI, providers, and live/API movement are not invoked.',
    'Candidate refs remain Discovery possible leads until expanded payloads land through the Evidence/EVEidence writer.',
    'Hydration, Observation/report output, Assessment Memory, Watch cadence/run state, Discovery refs, schema, runtime adapter, collector retirement, queues, dispatchers, leases, workers, enforcement, support artifacts, UI, source-term rename, and protected-word JSON updates remain untouched.'
  ];
}

module.exports = {
  buildEvidenceWriterLandingPackageFixturePreview
};
