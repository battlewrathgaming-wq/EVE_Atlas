const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildDiscoveryAcquisitionToEvidenceHandoffFixturePreview } = require('../src/main/services/discoveryAcquisitionToEvidenceHandoffFixtureService');
const { invokeServiceCommand } = require('../src/main/services/serviceRegistry');

const NOW = '2026-06-07T16:00:00.000Z';
const ACCEPTED_IDS = [30003597, 30003599, 30003601, 30003602];

async function main() {
  const originalLive = process.env.AURA_ATLAS_LIVE_API;
  process.env.AURA_ATLAS_LIVE_API = '1';
  try {
    await verifyCase('actor acquisition to Evidence handoff', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, verifyActorHandoff);
    await verifyCase('system/radius acquisition to Evidence handoff', insertSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 2,
      fixtureOutcomes: ['complete_refs_found', 'complete_no_refs', 'provider_deferred', 'failed_retryable']
    }, verifySystemHandoff);
    await verifyCase('duplicate candidate disclosure', insertSystemOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 4,
      fixtureOutcomes: [
        {
          outcome: 'complete_refs_found',
          candidate_ref_handles: [duplicateCandidate(30003597)]
        },
        {
          outcome: 'complete_refs_found',
          candidate_ref_handles: [duplicateCandidate(30003599)]
        },
        'complete_no_refs',
        'complete_no_refs'
      ]
    }, verifyDuplicateDisclosure);
    await verifyCase('no refs outcome', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['complete_no_refs']
    }, (proof) => verifyNoCandidateReason(proof, 'complete_no_refs'));
    await verifyCase('provider deferred outcome', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['provider_deferred']
    }, (proof) => verifyNoCandidateReason(proof, 'provider_deferred'));
    await verifyCase('acquisition capped outcome', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['acquisition_capped']
    }, verifyAcquisitionCapped);
    await verifyCase('retryable failure outcome', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['failed_retryable']
    }, (proof) => verifyNoCandidateReason(proof, 'failed_retryable'));
    await verifyCase('terminal failure outcome', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      fixtureOutcomes: ['failed_terminal']
    }, (proof) => verifyNoCandidateReason(proof, 'failed_terminal'));
    await verifyCase('held by External I/O before acquisition', insertActorOnly, {
      sessionArmed: true,
      liveApiEnabled: true,
      externalIoState: 'off'
    }, verifyHeldByExternalIo);
    await verifyServiceCommand();

    console.log(JSON.stringify({
      status: 'Discovery acquisition to Evidence handoff fixture validated',
      command: 'discovery.acquisition_to_evidence_handoff_fixture.preview',
      sample_actor_handoff: await sample(insertActorOnly, {
        sessionArmed: true,
        liveApiEnabled: true,
        maxHandoffCandidates: 1,
        fixtureOutcomes: ['complete_refs_found']
      }),
      sample_system_radius_handoff: await sample(insertSystemOnly, {
        sessionArmed: true,
        liveApiEnabled: true,
        maxHandoffCandidates: 2,
        fixtureOutcomes: ['complete_refs_found', 'complete_no_refs', 'provider_deferred', 'failed_retryable']
      }),
      sample_duplicate_handoff: await sample(insertSystemOnly, {
        sessionArmed: true,
        liveApiEnabled: true,
        maxHandoffCandidates: 4,
        fixtureOutcomes: [
          { outcome: 'complete_refs_found', candidate_ref_handles: [duplicateCandidate(30003597)] },
          { outcome: 'complete_refs_found', candidate_ref_handles: [duplicateCandidate(30003599)] },
          'complete_no_refs',
          'complete_no_refs'
        ]
      }),
      sample_held_handoff: await sample(insertActorOnly, {
        sessionArmed: true,
        liveApiEnabled: true,
        externalIoState: 'off'
      })
    }, null, 2));
  } finally {
    if (originalLive === undefined) {
      delete process.env.AURA_ATLAS_LIVE_API;
    } else {
      process.env.AURA_ATLAS_LIVE_API = originalLive;
    }
  }
  console.log('Discovery acquisition to Evidence handoff fixture validated');
}

async function verifyCase(label, insertRows, input, verifier) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const before = sideEffectCounts(db);
    const proof = buildDiscoveryAcquisitionToEvidenceHandoffFixturePreview(db, { now: NOW, ...input });
    const after = sideEffectCounts(db);
    verifyBoundary(proof, label);
    verifier(proof);
    assertSame(after, before, `${label} should not mutate local rows`);
    assert(proof.table_mutation_proof.unchanged === true, `${label} should include unchanged table proof`);
  } finally {
    closeDatabase(db);
  }
}

async function verifyServiceCommand() {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertActorOnly(db);
    const before = sideEffectCounts(db);
    const result = await invokeServiceCommand('discovery.acquisition_to_evidence_handoff_fixture.preview', {
      now: NOW,
      sessionArmed: true,
      liveApiEnabled: true,
      maxHandoffCandidates: 1,
      fixtureOutcomes: ['complete_refs_found']
    }, { db });
    const after = sideEffectCounts(db);
    verifyActorHandoff(result);
    assertSame(after, before, 'service command should not mutate local rows');
  } finally {
    closeDatabase(db);
  }
}

async function sample(insertRows, input) {
  const db = openDatabase(':memory:');
  migrate(db);
  try {
    insertRows(db);
    const proof = buildDiscoveryAcquisitionToEvidenceHandoffFixturePreview(db, { now: NOW, ...input });
    return {
      acquisition_request: proof.acquisition_request,
      provider_facing_packets: proof.provider_facing_packets,
      normalized_candidate_refs: proof.normalized_candidate_refs,
      candidate_dedupe_posture: proof.candidate_dedupe_posture,
      canonical_discovery_receipt_basis: proof.canonical_discovery_receipt_basis,
      watch_summary_projection: proof.watch_summary_projection,
      evidence_expansion_handoff: proof.evidence_expansion_handoff,
      mirror_check: proof.mirror_check,
      table_mutation_proof: proof.table_mutation_proof
    };
  } finally {
    closeDatabase(db);
  }
}

function verifyActorHandoff(proof) {
  assert(proof.acquisition_request.source_kind === 'watch_actor', 'actor request should preserve watch_actor source');
  assert(proof.provider_facing_packets.length === 1, 'actor should emit one provider-facing packet');
  assert(proof.normalized_candidate_refs.length === 2, 'actor fixture should normalize two candidate refs');
  assert(proof.evidence_expansion_handoff.selected_candidate_count === 1, 'actor should select one handoff candidate with max 1');
  assert(proof.evidence_expansion_handoff.not_selected_candidates.some((row) => row.reason === 'max_handoff_candidates_reached'), 'actor should disclose not-selected candidate reason');
  assert(proof.evidence_expansion_handoff.handoff_candidates[0].handoff_lane === 'esi_evidence_expansion', 'handoff lane should be ESI Evidence Expansion');
  assert(proof.evidence_expansion_handoff.handoff_candidates[0].esi_call_performed === false, 'handoff should not call ESI');
  assert(proof.evidence_expansion_handoff.handoff_candidates[0].evidence_written === false, 'handoff should not write Evidence');
  assert(proof.watch_summary_projection.packet_outcome_counts.complete_refs_found === 1, 'actor watch summary should count refs found');
  verifyMirrorCheck(proof);
}

function verifySystemHandoff(proof) {
  assert(proof.acquisition_request.source_kind === 'watch_system_radius', 'system request should preserve watch_system_radius source');
  assert(proof.provider_facing_packets.length === ACCEPTED_IDS.length, 'system should emit one provider-facing packet per accepted system');
  assertSame(proof.acquisition_request.accepted_scope_basis.accepted_system_ids, ACCEPTED_IDS, 'system request should preserve accepted IDs');
  assert(proof.acquisition_request.accepted_scope_basis.center_radius_used_as_execution_authority === false, 'center/radius should not be execution authority');
  assert(proof.normalized_candidate_refs.length === 1, 'mixed system fixture should normalize one candidate ref from refs-found packet');
  assert(proof.evidence_expansion_handoff.selected_candidate_count === 1, 'system should select available unique candidate');
  assert(proof.watch_summary_projection.packet_outcome_counts.complete_refs_found === 1, 'system summary should count refs found');
  assert(proof.watch_summary_projection.packet_outcome_counts.complete_no_refs === 1, 'system summary should count no refs');
  assert(proof.watch_summary_projection.packet_outcome_counts.provider_deferred === 1, 'system summary should count provider deferred');
  assert(proof.watch_summary_projection.packet_outcome_counts.failed_retryable === 1, 'system summary should count retryable failure');
  verifyMirrorCheck(proof);
}

function verifyDuplicateDisclosure(proof) {
  assert(proof.normalized_candidate_refs.length === 2, 'duplicate fixture should normalize two candidate appearances');
  assert(proof.candidate_dedupe_posture.unique_candidate_count === 1, 'duplicate fixture should keep one unique candidate');
  assert(proof.candidate_dedupe_posture.duplicate_candidate_count === 1, 'duplicate fixture should disclose one duplicate');
  assert(proof.evidence_expansion_handoff.selected_candidate_count === 1, 'duplicate fixture should select one unique handoff candidate');
  assert(proof.evidence_expansion_handoff.not_selected_candidates.some((row) => row.reason === 'duplicate_candidate_ref'), 'duplicate fixture should disclose duplicate not-selected reason');
}

function verifyNoCandidateReason(proof, reason) {
  assert(proof.normalized_candidate_refs.length === 0, `${reason} should normalize no candidates`);
  assert(proof.evidence_expansion_handoff.selected_candidate_count === 0, `${reason} should select no handoff candidates`);
  assert(proof.evidence_expansion_handoff.not_selected_candidates.some((row) => row.reason === reason), `${reason} should be disclosed as not-selected reason`);
}

function verifyAcquisitionCapped(proof) {
  assert(proof.fixture_zkill_outcome_summary.packet_outcome_counts.acquisition_capped === 1, 'capped fixture should count acquisition_capped');
  assert(proof.fixture_zkill_outcome_summary.cap_basis.capped_packet_count === 1, 'capped fixture should disclose cap basis');
  assert(proof.watch_summary_projection.cap_basis.full_coverage_claimed === false, 'capped fixture should not claim full coverage');
  assert(proof.evidence_expansion_handoff.selected_candidate_count >= 1, 'capped refs-found fixture can still hand off found candidate');
}

function verifyHeldByExternalIo(proof) {
  assert(proof.acquisition_request.request_posture === 'held_by_external_io', 'held request should stay request-level');
  assert(proof.provider_facing_packets.length === 0, 'held request should emit no provider-facing packets');
  assert(proof.normalized_candidate_refs.length === 0, 'held request should normalize no candidates');
  assert(proof.fixture_zkill_outcome_summary.packet_outcomes_emitted === false, 'held request should emit no packet outcomes');
  assert(Object.keys(proof.fixture_zkill_outcome_summary.packet_outcome_counts).length === 0, 'held request should have empty packet outcome counts');
  assert(proof.evidence_expansion_handoff.selected_candidate_count === 0, 'held request should select no handoff candidates');
  assert(proof.evidence_expansion_handoff.not_selected_candidates.some((row) => row.reason === 'held_by_external_io_before_acquisition'), 'held reason should be disclosed');
}

function verifyBoundary(proof, label) {
  assert(proof.read_only === true, `${label} should be read-only`);
  assert(proof.mutates_state === false, `${label} should not mutate state`);
  assert(proof.fixture_only === true, `${label} should be fixture-only`);
  assert(proof.provider_calls === 0, `${label} should not call providers`);
  assert(proof.live_api_calls === 0, `${label} should not make live/API calls`);
  assert(proof.zkill_calls === 0, `${label} should not call zKill`);
  assert(proof.esi_calls === 0, `${label} should not call ESI`);
  assert(proof.watch_execution === false, `${label} should not execute Watch`);
  assert(proof.watch_dispatches === 0, `${label} should not dispatch Watch`);
  assert(proof.mixed_collectors_invoked === false, `${label} should not invoke mixed collectors`);
  assert(proof.collect_actor_watch_invoked === false, `${label} should not invoke collectActorWatch`);
  assert(proof.collect_system_radius_watch_invoked === false, `${label} should not invoke collectSystemRadiusWatch`);
  assert(Array.isArray(proof.task_runner_methods_called) && proof.task_runner_methods_called.length === 0, `${label} should not call TaskRunner methods`);
  assert(proof.tasks_created === 0, `${label} should not create tasks`);
  assert(proof.queue_created === false, `${label} should not create queue`);
  assert(proof.dispatcher_created === false, `${label} should not create dispatcher`);
  assert(proof.leases_created === 0, `${label} should not create leases`);
  assert(proof.watch_mutations === 0, `${label} should not mutate Watch rows`);
  assert(proof.discovery_refs_written === false, `${label} should not write Discovery refs`);
  assert(proof.discovered_killmail_refs_written === 0, `${label} should not write discovered_killmail_refs`);
  assert(proof.discovery_refs_mutated === 0, `${label} should not mutate Discovery refs`);
  assert(proof.evidence_writes === 0, `${label} should not write Evidence/EVEidence`);
  assert(proof.evidence_written === false, `${label} should not write Evidence/EVEidence`);
  assert(proof.esi_evidence_expansion_run === false, `${label} should not run ESI Evidence Expansion`);
  assert(proof.evidence_handoff_only === true, `${label} should be handoff-only`);
  assert(proof.hydration_writes === 0, `${label} should not write Hydration`);
  assert(proof.metadata_writes === 0, `${label} should not write metadata`);
  assert(proof.api_request_log_writes === 0, `${label} should not write API logs`);
  assert(proof.data_quality_warning_writes === 0, `${label} should not write warnings`);
  assert(proof.fetch_run_writes === 0, `${label} should not write fetch_runs`);
  assert(proof.schema_changes === 0, `${label} should not change schema`);
  assert(proof.durable_task_packet_schema_created === false, `${label} should not create durable task/packet schema`);
  assert(proof.support_artifacts_created === 0, `${label} should not create support artifacts`);
  assert(proof.runtime_enforcement_active === false, `${label} should not activate enforcement`);
  assert(proof.command_blocking_active === false, `${label} should not activate command blocking`);
  assert(proof.ui_work === false, `${label} should not do UI work`);
  assert(proof.boundary_flags.mixed_collectors_retired_or_redirected === false, `${label} should not retire or redirect collectors`);
  assert(proof.canonical_discovery_receipt_basis.boundary_flags.discovery_owns_receipt_basis === true, `${label} should keep Discovery as receipt owner`);
  assert(proof.canonical_discovery_receipt_basis.boundary_flags.candidate_refs_are_not_evidence === true, `${label} should not treat candidates as Evidence`);
}

function verifyMirrorCheck(proof) {
  assert(proof.mirror_check.represented_fixture_shapes.includes('zkill_request_basis'), 'mirror check should include zKill request basis');
  assert(proof.mirror_check.represented_fixture_shapes.includes('candidate_ref_extraction_basis'), 'mirror check should include candidate extraction basis');
  assert(proof.mirror_check.represented_fixture_shapes.includes('dedupe_basis'), 'mirror check should include dedupe basis');
  assert(proof.mirror_check.represented_fixture_shapes.includes('esi_evidence_expansion_handoff_basis'), 'mirror check should include ESI Evidence Expansion handoff basis');
  assert(proof.mirror_check.parked_or_unproven_shapes.includes('real_esi_evidence_expansion'), 'mirror check should park real ESI Evidence Expansion');
  assert(proof.mirror_check.parked_or_unproven_shapes.includes('mixed_collector_retirement_or_redirect'), 'mirror check should park mixed collector retirement/redirect');
  assert(proof.mirror_check.mixed_collectors_called_to_prove_this === false, 'mirror check should not call mixed collectors');
}

function duplicateCandidate(systemId) {
  return {
    killmail_id: 900370001,
    killmail_hash: 'hs370_duplicate_hash',
    source_lane: 'watch',
    source_kind: 'system_radius',
    scope_key: 'system:30003597:radius:1',
    candidate_system_id: systemId
  };
}

function insertActorOnly(db) {
  insertActorWatch(db, { watchId: 1 });
}

function insertSystemOnly(db) {
  insertSystemWatch(db, { watchId: 1, includedSystemIds: JSON.stringify(ACCEPTED_IDS) });
}

function insertActorWatch(db, input = {}) {
  db.prepare(`
    INSERT INTO watchlist_entities (
      watch_id, entity_type, entity_id, entity_name,
      lookback_days, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.watchId,
    input.entityType || 'character',
    input.entityId || 90000001,
    input.entityName || 'Evidence Handoff Fixture Pilot',
    14,
    input.maxKillmailsPerRun || 5,
    input.isActive ?? 1,
    60,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS370 acquisition handoff fixture'
  );
}

function insertSystemWatch(db, input = {}) {
  db.prepare(`
    INSERT INTO system_watches (
      watch_id, center_system_id, center_system_name, radius_jumps,
      included_system_ids, excluded_system_ids,
      lookback_hours, max_systems_per_run, max_killmails_per_run,
      is_active, poll_interval_minutes,
      last_polled_at, next_poll_at, last_success_at, last_error_at,
      backoff_until, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.watchId,
    30003597,
    'Hare',
    1,
    input.includedSystemIds,
    '[]',
    24,
    35,
    input.maxKillmailsPerRun || 8,
    input.isActive ?? 1,
    45,
    null,
    input.nextPollAt || null,
    null,
    null,
    input.backoffUntil || null,
    'HS370 acquisition handoff fixture'
  );
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
    ingestion_audits: count(db, 'ingestion_audits'),
    assessment_artifacts: count(db, 'assessment_artifacts'),
    watchlist_entities: count(db, 'watchlist_entities'),
    system_watches: count(db, 'system_watches')
  };
}

function count(db, tableName) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get()?.count || 0);
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
