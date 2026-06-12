const fs = require('node:fs');
const path = require('node:path');
const { buildActorWatchTransportFailureParityProof } = require('../src/main/discovery/actorWatchTransportFailureParityProof');
const { listServiceCommands } = require('../src/main/services/serviceRegistry');

async function main() {
  verifySourceBoundaries();
  verifyProductionCommandMetadata();

  const proof = await buildActorWatchTransportFailureParityProof();
  verifyProof(proof);

  console.log(JSON.stringify({
    status: 'Actor Watch transport/failure parity proof validated',
    action: proof.action,
    real_http_client: proof.real_http_client,
    fake_fetch_impl_only: proof.fake_fetch_impl_only,
    manual_synthetic_api_logs: proof.manual_synthetic_api_logs,
    provider_calls: proof.provider_calls,
    live_api_calls: proof.live_api_calls,
    scheduled_actor_watch_current_runner: proof.scheduled_actor_watch_current_runner,
    scheduled_actor_watch_runner_call_target: proof.scheduled_actor_watch_runner_call_target,
    collectActorWatch_status: proof.collectActorWatch_status,
    success: sampleCase(proof.cases.success_transport_logging),
    capacity: sampleCase(proof.cases.retry_after_capacity_deferred),
    terminal: sampleCase(proof.cases.terminal_esi_failed_expansion),
    invalid_json: sampleCase(proof.cases.invalid_json_failure),
    cancelled: sampleFatal(proof.cases.cancelled_fatal_finalization),
    timeout: sampleFatal(proof.cases.timeout_fatal_finalization),
    zkill_failure: sampleCase(proof.cases.zkill_discovery_failure_warning)
  }, null, 2));
  console.log('Actor Watch transport/failure parity proof validated');
}

function verifyProof(proof) {
  assert(proof.action === 'watch.actor_transport_failure_parity_proof', 'proof action should match');
  assert(proof.fixture_only === true, 'proof should be fixture-only');
  assert(proof.fixture_owned_db_only === true, 'proof should use fixture-owned DB only');
  assert(proof.real_http_client === true, 'proof should use real HttpClient');
  assert(proof.real_zkill_client === true, 'proof should use real ZKillDiscoveryClient');
  assert(proof.real_esi_client === true, 'proof should use real EsiClient');
  assert(proof.fake_fetch_impl_only === true, 'proof should use fake fetchImpl only');
  assert(proof.manual_synthetic_api_logs === false, 'proof should not manually insert synthetic API logs');
  assert(proof.provider_calls === 0, 'proof should not call providers');
  assert(proof.live_api_calls === 0, 'proof should not make live/API calls');
  assert(proof.production_actor_watch_redirected === false, 'proof should not redirect production actor.watch');
  assert(proof.runActorWatchService_production_call_target_changed === false, 'proof should not change runActorWatchService call target');
  assert(proof.watchExecutor_dispatchFor_changed === false, 'proof should not change watchExecutor.dispatchFor');
  assert(proof.scheduled_actor_watch_current_runner === 'runScheduledActorWatch', 'proof should disclose current scheduled actor Watch runner');
  assert(proof.scheduled_actor_watch_runner_call_target === 'runActorWatchDirectBody', 'proof should disclose scheduled runner direct body target');
  assert(proof.collectActorWatch_status === 'legacy_compatibility_available_retirement_candidate', 'proof should disclose collectActorWatch parked legacy status');
  assert(proof.collect_actor_watch_imported === false, 'proof should not import collectActorWatch');
  assert(proof.collect_actor_watch_called === false, 'proof should not call collectActorWatch');
  assert(proof.hydration_writes === 0, 'proof should not write Hydration');
  assert(proof.observation_report_paths_touched === false, 'proof should not touch Observation/report paths');
  assert(proof.system_radius_behavior_changed === false, 'proof should not change system/radius');
  assert(proof.schema_changes === 0, 'proof should not change schema');
  assert(proof.dispatcher_queue_lease_behavior_changed === false, 'proof should not change dispatcher/queue/lease');
  assert(proof.runtime_enforcement_active === false, 'proof should not activate enforcement');
  assert(proof.ui_work === false, 'proof should not touch UI');
  for (const field of ['provider', 'endpoint', 'status_code', 'retry_count', 'rate_limited', 'error_message']) {
    assert(proof.api_log_fields_proven.includes(field), `proof should name API log field ${field}`);
  }
  assert(proof.compatibility_summary_field_parity.matches === true, 'success compatibility field parity should match');

  verifySuccess(proof.cases.success_transport_logging);
  verifyCapacity(proof.cases.retry_after_capacity_deferred);
  verifyTerminal(proof.cases.terminal_esi_failed_expansion);
  verifyInvalidJson(proof.cases.invalid_json_failure);
  verifyFatal(proof.cases.cancelled_fatal_finalization, 'HTTP_CANCELLED');
  verifyFatal(proof.cases.timeout_fatal_finalization, 'HTTP_TIMEOUT');
  verifyZkillFailure(proof.cases.zkill_discovery_failure_warning);
}

function verifySuccess(caseProof) {
  verifyNonFatalBoundary(caseProof, 'success');
  assert(caseProof.fetch_run_finalized_success === true, 'success case should finalize success');
  assert(caseProof.persisted_killmails === 1, 'success case should persist one killmail');
  assert(caseProof.activity_events_written > 0, 'success case should write activity events');
  assert(caseProof.api_request_log_summary.length === 2, 'success case should log zKill and ESI');
  assert(hasLog(caseProof, { provider: 'zkill', status_code: 200, retry_count: 0, rate_limited: false }), 'success case should log zKill 200');
  assert(hasLog(caseProof, { provider: 'esi', status_code: 200, retry_count: 0, rate_limited: false }), 'success case should log ESI 200');
}

function verifyCapacity(caseProof) {
  verifyNonFatalBoundary(caseProof, 'capacity');
  assert(caseProof.fetch_run_finalized_success === true, 'capacity case should finalize success with warning posture');
  assert(caseProof.provider_capacity_deferred_count === 1, 'capacity case should become provider_capacity_deferred');
  assert(caseProof.failed_refs_count === 0, 'capacity case should not become terminal failed expansion');
  assert(caseProof.persisted_killmails === 0, 'capacity case should not persist killmail');
  assert(hasLog(caseProof, { provider: 'esi', status_code: 429, retry_count: 1, rate_limited: true, has_error_message: true }), 'capacity case should log final ESI 429 with retry_count and rate_limited');
}

function verifyTerminal(caseProof) {
  verifyNonFatalBoundary(caseProof, 'terminal');
  assert(caseProof.fetch_run_finalized_success === true, 'terminal ESI failure should finalize success with failed expansion posture');
  assert(caseProof.failed_refs_count === 1, 'terminal ESI failure should become failed_expansion');
  assert(caseProof.evidence_warning_count === 1, 'terminal ESI failure should record warning');
  assert(hasLog(caseProof, { provider: 'esi', status_code: 500, retry_count: 0, rate_limited: false, has_error_message: true }), 'terminal case should log ESI 500');
}

function verifyInvalidJson(caseProof) {
  verifyNonFatalBoundary(caseProof, 'invalid json');
  assert(caseProof.fetch_run_finalized_success === true, 'invalid JSON should finalize success with failed expansion posture');
  assert(caseProof.failed_refs_count === 1, 'invalid JSON should become failed_expansion');
  assert(hasLog(caseProof, { provider: 'esi', status_code: null, retry_count: 0, rate_limited: false, has_error_message: true }), 'invalid JSON should log ESI parse failure posture');
}

function verifyFatal(caseProof, code) {
  assert(caseProof.fatal_error_rethrown === true, `${code} case should rethrow fatal error`);
  assert(caseProof.fatal_error_code === code || (code === 'HTTP_TIMEOUT' && caseProof.fatal_error_code === 'TimeoutError'), `${code} case should expose fatal code`);
  assert(caseProof.fetch_run_finalized_failed === true, `${code} case should finalize fetch run failed`);
  assert(caseProof.fetch_run_row.status === 'failed', `${code} fetch run row should be failed`);
  assert(caseProof.evidence_writes === 0, `${code} case should not write Evidence/EVEidence`);
  assert(caseProof.hydration_writes === 0, `${code} case should not write Hydration`);
  assert(caseProof.api_request_log_summary.some((entry) => entry.provider === 'esi' && entry.has_error_message), `${code} case should log ESI error message`);
}

function verifyZkillFailure(caseProof) {
  verifyNonFatalBoundary(caseProof, 'zKill failure');
  assert(caseProof.fetch_run_finalized_success === true, 'zKill failure should finalize success with warning posture');
  assert(caseProof.collection_warning_count >= 1, 'zKill failure should become collection warning');
  assert(caseProof.compatibility_summary.warnings.some((message) => message.includes('zKill discovery failed')), 'zKill failure warning should be present in compatibility summary');
  assert(caseProof.refs_written_to_fixture_discovery_memory === 0, 'zKill failure should not write Discovery refs');
  assert(caseProof.persisted_killmails === 0, 'zKill failure should not create Evidence/EVEidence');
  assert(hasLog(caseProof, { provider: 'zkill', status_code: 500, retry_count: 0, rate_limited: false, has_error_message: true }), 'zKill failure should log zKill 500');
}

function verifyNonFatalBoundary(caseProof, label) {
  assert(caseProof.fatal_error_rethrown === false, `${label} case should not rethrow fatal error`);
  assert(caseProof.provider_calls === 0, `${label} case should not call providers`);
  assert(caseProof.live_api_calls === 0, `${label} case should not make live/API calls`);
  assert(caseProof.boundary_flags.fake_fetch_impl_only === true, `${label} case should use fake fetch only`);
  assert(caseProof.boundary_flags.manual_synthetic_api_logs === false, `${label} case should not manually insert API logs`);
  assert(caseProof.boundary_flags.live_provider_called === false, `${label} case should not call live provider`);
  assert(caseProof.boundary_flags.mixed_collector_invoked === false, `${label} case should not invoke mixed collector`);
  assert(caseProof.boundary_flags.production_actor_watch_redirected === false, `${label} case should not redirect actor.watch`);
  assert(caseProof.boundary_flags.hydration_written === false, `${label} case should not write Hydration`);
  assert(caseProof.boundary_flags.observation_path_touched === false, `${label} case should not touch Observation/report`);
  assert(caseProof.boundary_flags.schema_changed === false, `${label} case should not change schema`);
  assert(caseProof.api_request_logs.every((row) => row.endpoint.includes('zkillboard.com') || row.endpoint.includes('esi.evetech.net')), `${label} case should preserve provider endpoint fields`);
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
  const proofBody = read('src/main/discovery/actorWatchTransportFailureParityProof.js');
  assert(!/require\(.*actorWatchCollector/.test(proofBody), 'new proof body should not import actorWatchCollector');
  assert(!/collectActorWatch\(/.test(proofBody), 'new proof body should not call collectActorWatch');
  assert(/new HttpClient/.test(proofBody), 'new proof body should construct real HttpClient');
  assert(/new ZKillDiscoveryClient/.test(proofBody), 'new proof body should construct real ZKillDiscoveryClient');
  assert(/new EsiClient/.test(proofBody), 'new proof body should construct real EsiClient');
  assert(!/insertApiRequestLog\(/.test(proofBody), 'new proof body should not manually insert API logs');

  const mutatingActionService = read('src/main/services/mutatingActionService.js');
  assert(
    /runActorWatchDirectBody\(input, \{ \.\.\.dependencies, db \}\)/.test(mutatingActionService),
    'production runActorWatchService should call runActorWatchDirectBody'
  );

  const watchExecutor = read('src/main/watchlist/watchExecutor.js');
  assert(
    /runner: runScheduledActorWatch/.test(watchExecutor),
    'scheduled actor Watch should use runScheduledActorWatch runner'
  );
  assert(
    /return runActorWatchDirectBody\(payload, dependencies\);/.test(watchExecutor),
    'runScheduledActorWatch should delegate to runActorWatchDirectBody'
  );
}

function hasLog(caseProof, expected) {
  return caseProof.api_request_log_summary.some((entry) => {
    for (const [key, value] of Object.entries(expected)) {
      if (entry[key] !== value) {
        return false;
      }
    }
    return true;
  });
}

function sampleCase(caseProof) {
  return {
    fatal_error_rethrown: caseProof.fatal_error_rethrown,
    fetch_run_status: caseProof.fetch_run_row?.status,
    persisted_killmails: caseProof.persisted_killmails,
    failed_refs_count: caseProof.failed_refs_count,
    provider_capacity_deferred_count: caseProof.provider_capacity_deferred_count,
    collection_warning_count: caseProof.collection_warning_count,
    evidence_warning_count: caseProof.evidence_warning_count,
    api_request_log_summary: caseProof.api_request_log_summary
  };
}

function sampleFatal(caseProof) {
  return {
    fatal_error_rethrown: caseProof.fatal_error_rethrown,
    fatal_error_code: caseProof.fatal_error_code,
    fetch_run_status: caseProof.fetch_run_row?.status,
    evidence_writes: caseProof.evidence_writes,
    api_request_log_summary: caseProof.api_request_log_summary
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
