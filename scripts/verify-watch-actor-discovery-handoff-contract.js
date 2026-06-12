const fs = require('node:fs');
const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const {
  buildWatchActorDiscoveryHandoffContractPreview
} = require('../src/main/services/watchActorDiscoveryHandoffContractService');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');

async function main() {
  verifySourceBoundaries();
  verifyCommandMetadata();

  const db = openDatabase(':memory:');
  migrate(db);
  try {
    const direct = await buildWatchActorDiscoveryHandoffContractPreview(db, {
      now: '2026-06-12T00:00:00.000Z'
    });
    verifyPreview(direct);

    const viaService = await invokeServiceCommand('watch.actor_discovery_handoff_contract.preview', {
      now: '2026-06-12T00:00:00.000Z'
    }, { db });
    verifyPreview(viaService);

    console.log(JSON.stringify({
      status: 'Actor Watch / Discovery handoff contract projection verified',
      action: viaService.action,
      request_models: [
        viaService.direct_projection.request.model,
        viaService.scheduled_projection.request.model
      ],
      receipt_models: [
        viaService.direct_projection.receipt.model,
        viaService.scheduled_projection.receipt.model
      ],
      direct_source: viaService.direct_projection.request.source,
      scheduled_source: viaService.scheduled_projection.request.source,
      compatibility_field_count: viaService.compatibility_posture.field_count,
      direct_outcome: viaService.direct_projection.receipt.outcome.code,
      scheduled_outcome: viaService.scheduled_projection.receipt.outcome.code,
      operator_corpus_unchanged: viaService.operator_corpus_non_mutation_proof.unchanged
    }, null, 2));
    console.log('Actor Watch / Discovery handoff contract projection verified');
  } finally {
    closeDatabase(db);
  }
}

function verifyPreview(preview) {
  assert(preview.action === 'watch.actor_discovery_handoff_contract.preview', 'preview action should match');
  assert(preview.read_only === true, 'preview should declare read-only posture');
  assert(preview.fixture_only === true, 'preview should be fixture-only');
  assert(preview.provider_calls === 0, 'preview should not call providers');
  assert(preview.live_api_calls === 0, 'preview should not make live/API calls');
  assert(preview.operator_corpus_mutated === false, 'preview should not mutate operator corpus');
  assert(preview.runtime_behavior_changed === false, 'preview should not change runtime behavior');
  assert(preview.actor_watch_redirected_by_this_proof === false, 'preview should not redirect direct actor.watch');
  assert(preview.scheduled_actor_watch_redirected_by_this_proof === false, 'preview should not redirect scheduled actor Watch');
  assert(preview.collect_actor_watch_retired === false, 'preview should not retire collectActorWatch');
  assert(preview.system_radius_behavior_changed === false, 'preview should not change system/radius Watch');
  assert(preview.watch_execution === false, 'preview should not execute Watch');
  assert(preview.watch_dispatches === 0, 'preview should not dispatch Watch');
  assert(preview.tasks_created === 0, 'preview should not create tasks');
  assert(preview.discovered_killmail_refs_written === 0, 'preview should not write Discovery refs');
  assert(preview.evidence_writes === 0, 'preview should not write Evidence/EVEidence');
  assert(preview.hydration_writes === 0, 'preview should not write Hydration');
  assert(preview.schema_changes === 0, 'preview should not change schema');
  assert(preview.dispatcher_queue_lease_behavior_changed === false, 'preview should not change dispatcher/queue/lease behavior');
  assert(preview.runtime_enforcement_active === false, 'preview should not activate enforcement');
  assert(preview.ui_work === false, 'preview should not do UI work');
  assert(preview.source_terms_renamed === false, 'preview should not rename source terms');
  assert(preview.protected_word_json_updated === false, 'preview should not update protected-word JSON');
  assert(preview.operator_corpus_non_mutation_proof.unchanged === true, 'preview should prove caller DB unchanged');

  verifyRequest(preview.direct_projection.request, 'direct_actor_watch');
  verifyRequest(preview.scheduled_projection.request, 'scheduled_actor_watch');
  verifyReceipt(preview.direct_projection.receipt, preview.direct_projection.request);
  verifyReceipt(preview.scheduled_projection.receipt, preview.scheduled_projection.request);

  assert(preview.direct_projection.request.basis.watch_id === null, 'direct request should not invent watch_id');
  assert(preview.direct_projection.request.basis.scope_key === null, 'direct request should not invent scope_key');
  assert(preview.direct_projection.request.basis.direct_request_basis, 'direct request should disclose direct basis');
  assert(preview.scheduled_projection.request.basis.watch_id === 'fixture-watch-452', 'scheduled request should carry fixture watch_id basis');
  assert(preview.scheduled_projection.request.basis.scope_key.startsWith('character:'), 'scheduled request should carry scope_key basis');
  assert(preview.scheduled_projection.caller_projection.current_return_shape === '{ status, data: { watch, collection } }', 'scheduled projection should preserve current wrapper shape');

  assert(preview.contract_projection_shape.request_model === 'actor_watch_discovery_request', 'request model should be explicit');
  assert(preview.contract_projection_shape.receipt_model === 'actor_watch_discovery_receipt', 'receipt model should be explicit');
  assert(preview.contract_projection_shape.compatibility_summary_nested === true, 'compatibility summary should be nested');
  assert(preview.contract_projection_shape.compatibility_summary_is_future_contract === false, 'compatibility summary must not be future contract');
  assert(preview.compatibility_posture.field_count === 22, 'compatibility summary should keep 22 fields');
  assert(preview.compatibility_posture.field_parity.matches === true, 'compatibility summary should preserve field parity');
  assert(preview.compatibility_posture.compatibility_only === true, 'compatibility fields should be labeled compatibility-only');
  assert(preview.compatibility_posture.temporary_debug_fields.includes('collection'), 'compatibility posture should label collection as temporary/debug');
  assert(preview.ownership_split.watch_owned_request_fields.includes('basis.watch_id'), 'ownership split should include Watch-owned watch_id');
  assert(preview.ownership_split.discovery_owned_receipt_fields.includes('compatibility_summary'), 'ownership split should include compatibility summary as Discovery receipt compatibility field');
}

function verifyRequest(request, source) {
  assert(request.model === 'actor_watch_discovery_request', `${source} request should use actor_watch_discovery_request model`);
  assert(request.source === source, `${source} request source should match`);
  assert(request.command === 'actor.watch', `${source} request should identify actor.watch command`);
  assert(request.actor.entity_type === 'character', `${source} request should carry actor entity type`);
  assert(Number.isInteger(request.actor.entity_id), `${source} request should carry actor entity id`);
  assert(request.actor.entity_name, `${source} request should carry actor entity name`);
  assert(Number.isInteger(request.window.lookback_seconds), `${source} request should carry lookback seconds`);
  assert(Number.isInteger(request.caps.max_refs), `${source} request should carry max refs`);
  assert(Number.isInteger(request.caps.max_expansions), `${source} request should carry max expansions`);
}

function verifyReceipt(receipt, request) {
  assert(receipt.model === 'actor_watch_discovery_receipt', 'receipt should use actor_watch_discovery_receipt model');
  assert(receipt.run_id, 'receipt should carry run_id');
  assert(receipt.actor.entity_id === request.actor.entity_id, 'receipt actor should match request actor');
  assert(receipt.request_window.lookback_seconds === request.window.lookback_seconds, 'receipt request window should match request');
  assert(receipt.caps.max_expansions === request.caps.max_expansions, 'receipt caps should match request');
  assert(receipt.candidate_ref_counts.discovered === 3, 'receipt should project discovered candidate count');
  assert(receipt.candidate_ref_counts.unique_after_dedupe === 3, 'receipt should project unique candidate count');
  assert(receipt.pending_ref_counts.considered === 0, 'fresh fixture receipt should project no pending refs');
  assert(receipt.pending_ref_counts.zkill_discovery_skipped === false, 'fresh fixture should not skip zKill');
  assert(receipt.selection_counts.selected_for_expansion === 2, 'receipt should project selected refs');
  assert(receipt.selection_counts.cap_skipped === 1, 'receipt should project cap skipped refs');
  assert(receipt.evidence_landing_counts.persisted_killmails === 2, 'receipt should project landed killmail count');
  assert(receipt.evidence_landing_counts.activity_events_written > 0, 'receipt should project landed activity events');
  assert(receipt.api_counts.zkill === 1, 'receipt should project zKill API count');
  assert(receipt.api_counts.esi === 2, 'receipt should project ESI API count');
  assert(receipt.outcome.code === 'complete_refs_found', 'receipt should derive complete_refs_found for fresh fixture');
  assert(receipt.outcome.derived_projection_only === true, 'receipt outcome should be marked projection-only');
  assert(receipt.compatibility_summary, 'receipt should nest compatibility summary');
  assert(Object.keys(receipt.compatibility_summary).length === 22, 'nested compatibility summary should preserve 22 fields');
  assert(receipt.compatibility_summary.collection_plan.compatibility_only === true, 'nested collection plan should remain compatibility-only');
}

function verifyCommandMetadata() {
  const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
  const command = commands.get('watch.actor_discovery_handoff_contract.preview');
  assert(command, 'handoff contract preview command should be registered');
  assert(command.classification === 'read-only', 'handoff contract preview should be read-only');
  assert(command.effects.includes('read-only'), 'handoff contract preview should declare read-only effect');
  assert(command.renderer_allowed === true, 'handoff contract preview should be renderer eligible as read-only');
}

function verifySourceBoundaries() {
  const service = read('src/main/services/watchActorDiscoveryHandoffContractService.js');
  assert(!/collectActorWatch\(/.test(service), 'handoff contract service should not call collectActorWatch');
  assert(!/collectSystemRadiusWatch\(/.test(service), 'handoff contract service should not call system/radius collector');
  assert(!/require\(.*watchExecutor|new WatchSessionExecutor|\.tick\(/.test(service), 'handoff contract service should not invoke WatchSessionExecutor');
  assert(!/new TaskRunner|TaskRunner\.|\.createTask\(/.test(service), 'handoff contract service should not invoke TaskRunner');
  assert(!/persistEvidencePackage\(/.test(service), 'handoff contract service should not persist Evidence/EVEidence');
  assert(/buildActorWatchProductionLikeFakeClientDirectProof/.test(service), 'handoff contract service should use fixture/fake-client proof basis');
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
