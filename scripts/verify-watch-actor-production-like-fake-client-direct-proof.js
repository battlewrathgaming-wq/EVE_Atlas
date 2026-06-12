const fs = require('node:fs');
const path = require('node:path');
const {
  buildActorWatchProductionLikeFakeClientDirectProof
} = require('../src/main/discovery/actorWatchProductionLikeFakeClientDirectProof');
const { listServiceCommands } = require('../src/main/services/serviceRegistry');

async function main() {
  verifySourceBoundaries();
  verifyProductionCommandMetadata();

  const proof = await buildActorWatchProductionLikeFakeClientDirectProof();
  verifyProof(proof);

  console.log(JSON.stringify({
    status: 'Actor Watch production-like fake-client direct proof validated',
    action: proof.action,
    production_like_direct_body: proof.production_like_direct_body,
    fixture_owned_db_only: proof.fixture_owned_db_only,
    provider_calls: proof.provider_calls,
    live_api_calls: proof.live_api_calls,
    production_actor_watch_redirected: proof.production_actor_watch_redirected,
    production_direct_redirect_status: proof.production_direct_redirect_status,
    scheduled_runtime_status: proof.scheduled_runtime_status,
    fresh: sampleCase(proof.cases.fresh_direct_actor_watch),
    pending: sampleCase(proof.cases.pending_direct_actor_watch),
    cached: sampleCase(proof.cases.cached_direct_actor_watch),
    failed: sampleCase(proof.cases.failed_direct_actor_watch),
    api_request_count_posture: proof.api_request_count_posture
  }, null, 2));
  console.log('Actor Watch production-like fake-client direct proof validated');
}

function verifyProof(proof) {
  assert(proof.action === 'watch.actor_production_like_fake_client_direct_proof', 'proof action should match');
  assert(proof.production_like_direct_body === true, 'proof should declare production-like direct body');
  assert(proof.fixture_only === true, 'proof should be fixture-only');
  assert(proof.fixture_owned_db_only === true, 'proof should use fixture-owned DBs only');
  assert(proof.uses_injected_fake_clients_only === true, 'proof should use injected fake clients only');
  assert(proof.provider_calls === 0, 'proof should not call providers');
  assert(proof.live_api_calls === 0, 'proof should not make live/API calls');
  assert(proof.production_actor_watch_redirected === false, 'proof should not redirect production actor.watch');
  assert(proof.runActorWatchService_production_call_target_changed === false, 'proof should not change runActorWatchService production call target');
  assert(proof.watchExecutor_dispatchFor_changed === false, 'proof should not change watchExecutor.dispatchFor');
  assert(proof.production_direct_redirect_status.actor_watch_redirected_after_hs440 === true, 'proof should disclose direct actor.watch is redirected after HS440');
  assert(proof.production_direct_redirect_status.runActorWatchService_call_target === 'runActorWatchDirectBody', 'proof should disclose HS440 direct body call target');
  assert(proof.scheduled_runtime_status.scheduled_actor_watch_redirected_after_hs446 === true, 'proof should disclose scheduled actor Watch is redirected after HS446');
  assert(proof.scheduled_runtime_status.current_runner === 'runScheduledActorWatch', 'proof should disclose scheduled actor Watch runner');
  assert(proof.scheduled_runtime_status.legacy_collectActorWatch_still_available === true, 'proof should disclose collectActorWatch remains available');
  assert(proof.scheduled_runtime_status.system_radius_current_runner === 'collectSystemRadiusWatch', 'proof should disclose system/radius remains legacy');
  assert(proof.collector_retired === false, 'proof should not retire legacy collector');
  assert(proof.hydration_writes === 0, 'proof should not write Hydration');
  assert(proof.observation_report_paths_touched === false, 'proof should not touch Observation/report paths');
  assert(proof.schema_changes === 0, 'proof should not change schema');
  assert(proof.dispatcher_queue_lease_behavior_changed === false, 'proof should not change dispatcher/queue/lease behavior');
  assert(proof.runtime_enforcement_active === false, 'proof should not activate enforcement');
  assert(proof.command_blocking_active === false, 'proof should not activate command blocking');
  assert(proof.ui_work === false, 'proof should not touch UI');
  assert(proof.api_request_count_posture.represented === true, 'proof should represent API request count posture');
  assert(proof.api_request_count_posture.fixture_synthetic_logs === true, 'proof should disclose synthetic fixture API logs');
  assert(proof.api_request_count_posture.http_client_logging_parity_proven === false, 'proof should not claim HttpClient logging parity');
  assert(proof.compatibility_summary_field_parity.matches === true, 'compatibility summary field parity should match');
  assert(proof.compatibility_summary_field_parity.actual.length === 22, 'compatibility summary should expose 22 fields');

  verifyFresh(proof.cases.fresh_direct_actor_watch);
  verifyPending(proof.cases.pending_direct_actor_watch);
  verifyCached(proof.cases.cached_direct_actor_watch);
  verifyFailed(proof.cases.failed_direct_actor_watch);
}

function verifyFresh(caseProof) {
  verifyCaseBoundary(caseProof, 'fresh');
  assert(caseProof.live_gate_posture.action === 'actor.watch', 'fresh case should represent actor.watch live gate');
  assert(caseProof.live_gate_posture.production_provider_attempt_entered === false, 'fresh case should not enter production provider attempt control');
  assert(caseProof.fake_zkill_client_invocations === 1, 'fresh case should invoke fake zKill once');
  assert(caseProof.fake_esi_client_invocations === 2, 'fresh case should invoke fake ESI twice');
  assert(caseProof.refs_written_to_fixture_discovery_memory === 3, 'fresh case should write discovered refs to fixture Discovery memory');
  assert(caseProof.selected_refs_count === 2, 'fresh case should select two refs');
  assert(caseProof.expanded_refs_count === 2, 'fresh case should expand two refs');
  assert(caseProof.persisted_killmails === 2, 'fresh case should land two killmails');
  assert(caseProof.activity_events_written > 0, 'fresh case should write activity events');
  assert(caseProof.discovery_ref_status_counts.expanded === 2, 'fresh case should mark expanded refs');
  assert(caseProof.discovery_ref_status_counts.pending === 1, 'fresh case should leave cap-skipped pending ref');
  assert(caseProof.api_request_log_posture.zkill === 1, 'fresh case should represent one zKill API count');
  assert(caseProof.api_request_log_posture.esi === 2, 'fresh case should represent two ESI API counts');
}

function verifyPending(caseProof) {
  verifyCaseBoundary(caseProof, 'pending');
  assert(caseProof.zkill_discovery_skipped === true, 'pending case should skip zKill discovery');
  assert(caseProof.fake_zkill_client_invocations === 0, 'pending case should not invoke fake zKill');
  assert(caseProof.fake_esi_client_invocations === 2, 'pending case should invoke fake ESI twice');
  assert(caseProof.pending_refs_considered === 2, 'pending case should consider pending refs');
  assert(caseProof.refs_written_to_fixture_discovery_memory === 0, 'pending case should not write fresh zKill refs');
  assert(caseProof.discovery_ref_status_counts.expanded === 2, 'pending case should mark pending refs expanded');
  assert(caseProof.api_request_log_posture.zkill === 0, 'pending case should represent zero zKill API count');
  assert(caseProof.api_request_log_posture.esi === 2, 'pending case should represent two ESI API counts');
}

function verifyCached(caseProof) {
  verifyCaseBoundary(caseProof, 'cached');
  assert(caseProof.fake_zkill_client_invocations === 1, 'cached case should invoke fake zKill once');
  assert(caseProof.fake_esi_client_invocations === 1, 'cached case should invoke fake ESI once for uncached ref');
  assert(caseProof.cached_refs_count >= 1, 'cached case should count cached ref');
  assert(caseProof.discovery_ref_status_counts.cached === 1, 'cached case should mark cached ref');
  assert(caseProof.persisted_killmails === 1, 'cached case should land only uncached killmail');
  assert(caseProof.api_request_log_posture.zkill === 1, 'cached case should represent one zKill API count');
  assert(caseProof.api_request_log_posture.esi === 1, 'cached case should represent one ESI API count');
}

function verifyFailed(caseProof) {
  verifyCaseBoundary(caseProof, 'failed');
  assert(caseProof.fake_zkill_client_invocations === 1, 'failed case should invoke fake zKill once');
  assert(caseProof.fake_esi_client_invocations === 1, 'failed case should invoke fake ESI once');
  assert(caseProof.failed_refs_count === 1, 'failed case should count failed expansion');
  assert(caseProof.discovery_ref_status_counts.failed === 1, 'failed case should mark failed ref');
  assert(caseProof.evidence_warning_count === 1, 'failed case should record Evidence/EVEidence warning posture');
  assert(caseProof.persisted_killmails === 0, 'failed case should not land killmails');
  assert(caseProof.api_request_log_posture.zkill === 1, 'failed case should represent one zKill API count');
  assert(caseProof.api_request_log_posture.esi === 1, 'failed case should represent one ESI API count');
}

function verifyCaseBoundary(caseProof, label) {
  assert(caseProof.provider_calls === 0, `${label} case should not call providers`);
  assert(caseProof.live_api_calls === 0, `${label} case should not make live/API calls`);
  assert(caseProof.fetch_run_finalized === true, `${label} case should finalize fetch run`);
  assert(caseProof.compatibility_summary_field_parity.matches === true, `${label} case should preserve compatibility summary fields`);
  assert(caseProof.boundary_flags.fake_clients_only === true, `${label} case should use fake clients only`);
  assert(caseProof.boundary_flags.mixed_collector_invoked === false, `${label} case should not invoke mixed collector`);
  assert(caseProof.boundary_flags.production_actor_watch_redirected === false, `${label} case should not redirect actor.watch`);
  assert(caseProof.boundary_flags.operator_db_written === false, `${label} case should not write operator DB`);
  assert(caseProof.boundary_flags.hydration_written === false, `${label} case should not write Hydration`);
  assert(caseProof.boundary_flags.observation_path_touched === false, `${label} case should not touch Observation/report path`);
  assert(caseProof.boundary_flags.schema_changed === false, `${label} case should not change schema`);
  assert(caseProof.disposable_table_mutation_proof.operator_corpus_mutated === false, `${label} case should not mutate operator corpus`);
  assert(caseProof.disposable_table_mutation_proof.deltas.fetch_runs >= 1, `${label} case should write fetch run rows in fixture DB`);
  assert(caseProof.disposable_table_mutation_proof.deltas.api_request_logs >= 1, `${label} case should represent API count posture in fixture DB`);
}

function verifyProductionCommandMetadata() {
  const actorWatch = listServiceCommands().find((entry) => entry.command === 'actor.watch');
  assert(actorWatch, 'production actor.watch command should be registered');
  assert(actorWatch.classification === 'evidence-creating', 'production actor.watch should remain evidence-creating');
  assert(actorWatch.effects.includes('external-live-api'), 'production actor.watch should retain external-live-api effect');
  assert(actorWatch.effects.includes('evidence-creation'), 'production actor.watch should retain Evidence/EVEidence creation effect');
  assert(actorWatch.renderer_allowed === false, 'production actor.watch should remain non-renderer');
}

function verifySourceBoundaries() {
  const proofBody = read('src/main/discovery/actorWatchProductionLikeFakeClientDirectProof.js');
  assert(!/require\(.*actorWatchCollector/.test(proofBody), 'new proof body should not import actorWatchCollector');
  assert(!/collectActorWatch\(/.test(proofBody), 'new proof body should not call collectActorWatch');

  const mutatingActionService = read('src/main/services/mutatingActionService.js');
  assert(/runActorWatchService/.test(mutatingActionService), 'production runActorWatchService should remain present');
  const preHs440LegacyCall = /collectActorWatch\(input, \{ \.\.\.dependencies, db \}\)/.test(mutatingActionService);
  const postHs440DirectCall = /runActorWatchDirectBody\(input, \{ \.\.\.dependencies, db \}\)/.test(mutatingActionService);
  assert(
    preHs440LegacyCall || postHs440DirectCall,
    'production runActorWatchService should remain either pre-HS440 legacy or post-HS440 direct body while this fake-client proof stays valid'
  );

  const watchExecutor = read('src/main/watchlist/watchExecutor.js');
  assert(!/require\(.*actorWatchCollector/.test(watchExecutor), 'post-HS446 scheduled actor Watch should not import actorWatchCollector');
  assert(!/runner: collectActorWatch/.test(watchExecutor), 'post-HS446 scheduled actor Watch should not dispatch collectActorWatch');
  assert(/runner: runScheduledActorWatch/.test(watchExecutor), 'post-HS446 scheduled actor Watch should dispatch runScheduledActorWatch');
  assert(/runner: collectSystemRadiusWatch/.test(watchExecutor), 'system/radius Watch should remain on collectSystemRadiusWatch');

  const actorCollector = read('src/main/workers/actorWatchCollector.js');
  assert(/function collectActorWatch/.test(actorCollector), 'collectActorWatch should remain available for now');
}

function sampleCase(caseProof) {
  return {
    fake_zkill_client_invocations: caseProof.fake_zkill_client_invocations,
    fake_esi_client_invocations: caseProof.fake_esi_client_invocations,
    refs_written_to_fixture_discovery_memory: caseProof.refs_written_to_fixture_discovery_memory,
    pending_refs_considered: caseProof.pending_refs_considered,
    selected_refs_count: caseProof.selected_refs_count,
    expanded_refs_count: caseProof.expanded_refs_count,
    cached_refs_count: caseProof.cached_refs_count,
    failed_refs_count: caseProof.failed_refs_count,
    persisted_killmails: caseProof.persisted_killmails,
    activity_events_written: caseProof.activity_events_written,
    api_request_log_posture: caseProof.api_request_log_posture,
    discovery_ref_status_counts: caseProof.discovery_ref_status_counts,
    fetch_run_finalized: caseProof.fetch_run_finalized
  };
}

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
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
