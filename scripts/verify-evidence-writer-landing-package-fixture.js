const {
  invokeServiceCommand,
  listServiceCommands
} = require('../src/main/services/serviceRegistry');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { buildEvidenceWriterLandingPackageFixturePreview } = require('../src/main/services/evidenceWriterLandingPackageFixtureService');

async function main() {
  const direct = buildEvidenceWriterLandingPackageFixturePreview();
  assertProof(direct);

  const command = listServiceCommands().find((entry) => entry.command === 'evidence.writer_landing_package_fixture.preview');
  assert(command, 'fixture command should be registered');
  assert(command.classification === 'metadata-only', 'fixture command should be metadata-only');
  assert(command.effects.includes('local-data-mutation'), 'fixture command should declare fixture local mutation');
  assert(command.renderer_allowed === false, 'fixture command should not be renderer eligible');

  const contextDb = openDatabase(':memory:');
  migrate(contextDb);
  let service;
  try {
    service = await invokeServiceCommand('evidence.writer_landing_package_fixture.preview', {
      ignored: 'fixture command must ignore caller payload for safety'
    }, { db: contextDb });
    assertProof(service);
    assert(service.input_ignored_for_safety === true, 'service proof should disclose ignored caller input');
  } finally {
    closeDatabase(contextDb);
  }

  console.log(JSON.stringify({
    status: 'Evidence writer landing package fixture validated',
    command: 'evidence.writer_landing_package_fixture.preview',
    sample_clean: direct.cases.clean_payload,
    sample_conflict: direct.cases.duplicate_conflicting_killmail,
    sample_mixed: direct.cases.mixed_clean_plus_conflict_package,
    sample_malformed: direct.cases.malformed_missing_solar_system_id_rollback,
    tables_proven_unchanged: direct.tables_proven_unchanged,
    provider_invocation: direct.provider_invocation
  }, null, 2));
  console.log('Evidence writer landing package fixture validated');
}

function assertProof(proof) {
  assert(proof.action === 'evidence.writer_landing_package_fixture.preview', 'proof should expose command action');
  assert(proof.proof_status === 'fixture_writer_landing_package_proven', 'proof status should be complete');
  assert(proof.fixture_only === true, 'proof should be fixture-only');
  assert(proof.disposable_db.posture === 'internal_memory_db_only', 'proof should use internal memory DB');
  assert(proof.disposable_db.operator_corpus_mutated === false, 'proof must not mutate operator corpus');
  assert(proof.disposable_db.context_db_used === false, 'proof must not use caller DB');
  assert(proof.provider_invocation.provider_not_invoked === true, 'providers must not be invoked');
  assert(proof.provider_invocation.zkill === 0, 'zKill calls should be zero');
  assert(proof.provider_invocation.esi === 0, 'ESI calls should be zero');
  assert(proof.provider_invocation.live_api === 0, 'live API calls should be zero');
  assert(proof.foreign_key_check.ok === true, 'fixture DB should pass foreign key check');

  assert(proof.tables_proven_unchanged.discovered_killmail_refs === true, 'Discovery refs should be unchanged');
  assert(proof.tables_proven_unchanged.api_request_logs === true, 'API logs should be unchanged');
  assert(proof.tables_proven_unchanged.watch_tables === true, 'Watch tables should be unchanged');
  assert(proof.tables_proven_unchanged.hydration_metadata_tables === true, 'Hydration/metadata tables should be unchanged');
  assert(proof.tables_proven_unchanged.assessment_tables === true, 'Assessment tables should be unchanged');

  const clean = proof.cases.clean_payload;
  assert(clean.proof_status === 'clean_payload_landed', 'clean payload should land');
  assert(clean.persist_result.killmailsWritten === 1, 'clean payload should write one killmail');
  assert(clean.persist_result.eventsWritten === 7, 'clean payload should write expected activity events');
  assert(clean.deltas.killmails === 1, 'clean delta should include one killmail');
  assert(clean.deltas.activity_events === 7, 'clean delta should include seven activity events');
  assert(clean.deltas.entities >= 6, 'clean payload should write entity support rows');
  assert(clean.deltas.ingestion_audits === 1, 'clean payload should write one audit');
  assert(clean.deltas.data_quality_warnings === 0, 'clean payload should not create warnings');
  assert(clean.readback.raw_payload_checksum_matches === true, 'clean raw payload checksum should match readback');
  assert(clean.readback.raw_payload_killmail_id === 100138701, 'clean raw payload should preserve killmail id');

  const rerun = proof.cases.idempotent_rerun;
  assert(rerun.proof_status === 'same_payload_rerun_idempotent', 'rerun should be idempotent');
  assert(rerun.persist_result.killmailsWritten === 0, 'rerun should not write another killmail');
  assert(rerun.persist_result.eventsWritten === 0, 'rerun should not write duplicate activity events');
  assert(rerun.deltas.killmails === 0, 'rerun killmail count should not change');
  assert(rerun.deltas.activity_events === 0, 'rerun activity count should not change');
  assert(rerun.raw_payload_checksum_comparison.matches === true, 'rerun checksum should match existing payload');

  const cache = proof.cases.local_cache_existing;
  assert(cache.proof_status === 'local_cache_existing_before_provider_movement', 'cache case should report local Evidence exists');
  assert(cache.already_cached === true, 'cache case should be already cached');
  assert(cache.provider_invoked === false, 'cache case should not invoke provider');
  assert(cache.package_built === false, 'cache case should not build package');
  assert(cache.persist_invoked === false, 'cache case should not persist');
  assert(cache.deltas.killmails === 0, 'cache case should not write killmail');

  const conflict = proof.cases.duplicate_conflicting_killmail;
  assert(conflict.proof_status === 'duplicate_conflicting_killmail_behavior_disclosed', 'conflict should be disclosed');
  assert(conflict.persist_result.killmailsWritten === 0, 'conflict should not create another killmail row');
  assert(conflict.persist_result.eventsWritten === 0, 'conflict should not write conflicting incoming activity rows');
  assert(conflict.raw_payload_checksum_comparison.existing_raw_payload_preserved === true, 'conflict should preserve existing raw killmail row');
  assert(conflict.raw_payload_checksum_comparison.incoming_checksum_differs === true, 'conflict incoming checksum should differ');
  assert(conflict.warning_classifications.includes('KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH'), 'conflict should emit checksum mismatch warning');
  assert(conflict.conflict_behavior_classification === 'existing_killmail_raw_row_preserved_and_conflicting_dependent_rows_suppressed', 'conflict behavior should report hardened dependent-row suppression');
  assert(conflict.deltas.activity_events === 0, 'conflict should not add activity event rows');
  assert(conflict.deltas.entities === 0, 'conflict should not add conflict-only entity rows');
  assert(conflict.deltas.ingestion_audits === 0, 'conflict should not add incoming conflict audit rows');
  assert(conflict.deltas.data_quality_warnings === 1, 'conflict should add only the conflict warning');
  assert(conflict.dependent_row_suppression.activity_events > 0, 'conflict should report suppressed activity rows');
  assert(conflict.dependent_row_suppression.entities > 0, 'conflict should report suppressed conflict-only entity rows');
  assert(conflict.dependent_row_suppression.ingestion_audits === 1, 'conflict should report suppressed incoming audit row');
  assert(conflict.readback.incoming_conflict_event_keys_present.length === 0, 'conflicting incoming event keys must not be present');

  const mixed = proof.cases.mixed_clean_plus_conflict_package;
  assert(mixed.proof_status === 'mixed_clean_plus_conflict_package_proven', 'mixed clean/conflict package should be proven');
  assert(mixed.classification === 'clean_rows_landed_conflict_dependent_rows_suppressed', 'mixed package should land clean rows and suppress conflict-derived rows');
  assert(mixed.persist_result.killmailsWritten === 1, 'mixed package should write one clean killmail');
  assert(mixed.persist_result.eventsWritten === 7, 'mixed package should write only the clean activity rows');
  assert(mixed.deltas.killmails === 1, 'mixed package should add the clean killmail only');
  assert(mixed.deltas.activity_events === 7, 'mixed package should add clean activity events only');
  assert(mixed.deltas.entities >= 6, 'mixed package should add clean-backed entity rows');
  assert(mixed.deltas.ingestion_audits === 1, 'mixed package should add the clean audit only');
  assert(mixed.deltas.data_quality_warnings === 1, 'mixed package should add only the conflict warning');
  assert(mixed.clean_killmail.readback.killmail_id === 100138708, 'mixed clean killmail should be readable');
  assert(mixed.clean_killmail.raw_payload_checksum_matches === true, 'mixed clean raw checksum should match readback');
  assert(mixed.clean_killmail.activity_event_count === 7, 'mixed clean activity event count should land');
  assert(mixed.clean_killmail.ingestion_audits.length === 1, 'mixed clean audit should land');
  assert(mixed.conflicting_killmail.raw_payload_checksum_comparison.existing_raw_payload_preserved === true, 'mixed conflict should preserve existing raw killmail row');
  assert(mixed.conflicting_killmail.raw_payload_checksum_comparison.incoming_checksum_differs === true, 'mixed conflict incoming checksum should differ');
  assert(mixed.conflicting_killmail.warning_classifications.includes('KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH'), 'mixed conflict should emit checksum mismatch warning');
  assert(mixed.conflicting_killmail.incoming_conflict_event_keys_present.length === 0, 'mixed conflicting incoming event keys must not be present');
  assert(mixed.conflicting_killmail.ingestion_audits.length === 1, 'mixed conflict should retain only the original audit');
  assert(mixed.persist_result.conflictDependentRowsSuppressed.activity_events > 0, 'mixed package should report suppressed conflict activity rows');
  assert(mixed.persist_result.conflictDependentRowsSuppressed.entities > 0, 'mixed package should report suppressed conflict-only entities');
  assert(mixed.persist_result.conflictDependentRowsSuppressed.ingestion_audits === 1, 'mixed package should report suppressed conflict audit');

  const partial = proof.cases.partial_missing_attackers;
  assert(partial.proof_status === 'partial_payload_landed_with_warning', 'partial payload should land with warning');
  assert(partial.persist_result.killmailsWritten === 1, 'partial payload should write killmail');
  assert(partial.warning_classifications.includes('missing_attackers'), 'partial payload should warn for missing attackers');

  const malformedId = proof.cases.malformed_missing_killmail_id;
  assert(malformedId.proof_status === 'normalizer_rejected_before_writer_landing', 'missing killmail_id should be rejected before writer');
  assert(malformedId.package_built === false, 'missing killmail_id should not build package');
  assert(malformedId.persist_invoked === false, 'missing killmail_id should not persist');
  assert(malformedId.rollback_or_no_partial_write_evidence === true, 'missing killmail_id should leave no landing rows');
  assert(malformedId.deltas.killmails === 0, 'missing killmail_id should write no killmail');
  assert(malformedId.deltas.activity_events === 0, 'missing killmail_id should write no activity events');

  const malformedDurable = proof.cases.malformed_missing_solar_system_id_rollback;
  assert(malformedDurable.proof_status === 'writer_transaction_rolled_back_required_field_failure', 'missing durable field should roll back writer transaction');
  assert(malformedDurable.deltas.killmails === 0, 'rollback should write no killmail');
  assert(malformedDurable.deltas.activity_events === 0, 'rollback should write no activity events');
  assert(malformedDurable.deltas.entities === 0, 'rollback should write no entities');
  assert(malformedDurable.deltas.ingestion_audits === 0, 'rollback should write no audits');
  assert(malformedDurable.deltas.data_quality_warnings === 0, 'rollback should write no warnings');

  assert(proof.boundary.some((line) => line.includes('Fixture-only writer landing proof')), 'boundary should identify fixture proof');
  assert(proof.boundary.some((line) => line.includes('zKill, ESI, providers')), 'boundary should explicitly exclude providers');
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
