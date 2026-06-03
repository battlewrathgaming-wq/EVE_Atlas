const path = require('node:path');
const { openDatabase, migrate, closeDatabase } = require('../src/main/db/database');
const { invokeServiceCommand, listServiceCommands } = require('../src/main/services/serviceRegistry');
const {
  sourceAuthorityFor,
  inventoryCounts
} = require('../src/main/services/sdeInventoryImportRewriteAuthorityProofService');
const { auraTempRoot } = require('../src/main/util/tempPaths');

async function main() {
  verifySourceAuthorityCases();
  await verifyCommandProof();
  verifyCommandRegistration();
  console.log(JSON.stringify({
    status: 'SDE inventory import/rewrite authority proof verified',
    command: 'sde.inventory_import_rewrite_authority.proof'
  }, null, 2));
}

function verifySourceAuthorityCases() {
  const renderer = sourceAuthorityFor({ sourcePath: 'C:\\renderer\\forged-inventory.zip' }, {}, false);
  assert(renderer.decision === 'blocked', 'renderer-only source path should block');
  assert(renderer.reason === 'renderer_source_path_non_authoritative', 'renderer source path should be non-authoritative');
  assert(renderer.renderer_payload_ignored === true, 'renderer source path should be ignored');

  const missing = sourceAuthorityFor({}, {}, true);
  assert(missing.reason === 'source_path_required', 'missing source should block inventory rewrite');

  const remote = sourceAuthorityFor({}, {
    allowSdeInventoryImportRewriteAuthorityFixture: true,
    sdeInventorySourceAuthority: {
      path: 'https://example.invalid/sde-inventory.zip',
      basis: 'trusted_fixture_context',
      fixture_authority: true
    }
  }, true);
  assert(remote.decision === 'blocked', 'remote source should be rejected for local inventory import');
  assert(remote.reason === 'remote_source_rejected_for_local_inventory_import', 'remote source rejection reason should be explicit');

  const trusted = sourceAuthorityFor({
    sourcePath: 'C:\\renderer\\forged-inventory.zip'
  }, trustedContext(), true);
  assert(trusted.decision === 'accepted', 'trusted fixture inventory source should be accepted');
  assert(trusted.reason === 'trusted_fixture_local_inventory_source_authority', 'trusted inventory source reason should be explicit');
  assert(trusted.renderer_payload_ignored === true, 'trusted inventory source should ignore renderer path claims');
  assert(trusted.path_inspected === false, 'trusted inventory source proof should not inspect paths');
}

async function verifyCommandProof() {
  const blockedDb = openDatabase(':memory:');
  migrate(blockedDb);
  try {
    const blocked = await invokeServiceCommand('sde.inventory_import_rewrite_authority.proof', {}, {
      db: blockedDb,
      databasePath: path.join(auraTempRoot(), 'hs226-blocked.sqlite')
    });
    assert(blocked.proof_state === 'blocked_before_fixture_rewrite', 'proof should block without trusted fixture context');
    assert(blocked.blocked_reasons.includes('trusted_fixture_context_required'), 'blocked proof should require trusted fixture context');
    assert(blocked.real_operator_lookup_table_writes === 0, 'blocked proof should not write operator lookup tables');
  } finally {
    closeDatabase(blockedDb);
  }

  const db = openDatabase(':memory:');
  migrate(db);
  const beforeEvidence = evidenceTableCounts(db);
  try {
    const proof = await invokeServiceCommand('sde.inventory_import_rewrite_authority.proof', {
      sourcePath: 'C:\\renderer\\forged-inventory.zip',
      storageAuthority: { mode: 'selected_storage_missing_unavailable' },
      storageBudgetBytes: 1
    }, {
      db,
      databasePath: path.join(auraTempRoot(), 'hs226-proof.sqlite'),
      ...trustedContext()
    });

    assert(proof.proof_state === 'fixture_rewrite_authority_proven', 'trusted fixture proof should run');
    assert(proof.fixture_offline_only === true, 'proof should be fixture/offline only');
    assert(proof.provider_calls === 0, 'proof should not call providers');
    assert(proof.sde_downloads === 0, 'proof should not download SDE');
    assert(proof.provider_backed_builds === 0, 'proof should not run provider-backed sde.build-lookups');
    assert(proof.real_operator_source_path_inspections === 0, 'proof should not inspect real operator source paths');
    assert(proof.real_operator_lookup_table_writes === 0, 'proof should not mutate real operator lookup tables');
    assert(proof.topology_import_behavior_changed === false, 'proof should not change topology import behavior');
    assert(proof.combined_topology_inventory_behavior === false, 'proof should not combine topology and inventory behavior');
    assert(proof.config_writes === 0, 'proof should not write config');
    assert(proof.support_artifacts_created === 0, 'proof should not create support artifacts');
    assert(proof.schema_changes === 0, 'proof should not change schema');
    assert(proof.runtime_enforcement_active === false, 'proof should not activate runtime enforcement');
    assert(proof.command_blocking_active === false, 'proof should not activate command blocking');

    assert(proof.source_authority.renderer_source_path_used === false, 'renderer source path should not be used');
    assert(proof.source_authority.selected_authority.decision === 'accepted', 'trusted fixture inventory source should be accepted');
    assert(proof.source_authority.selected_authority.renderer_payload_ignored === true, 'renderer source path should be ignored even with trusted context');
    assert(proof.source_authority.cases.remote_url.reason === 'remote_source_rejected_for_local_inventory_import', 'remote URL rejection should be represented');
    assert(proof.source_authority.cases.no_source_path.reason === 'source_path_required', 'no-source block should be represented');

    assert(proof.projected_growth.total_projected_bytes > 0, 'projected growth should be represented');
    assert(proof.projected_growth.includes_temp_cache_db_growth === true, 'projection should include temp/cache/DB growth');
    assert(proof.storage_budget_authority.configured_ready_budget_ok.rewrite_authority.decision === 'allow_fixture_rewrite', 'configured storage and budget should allow fixture rewrite');
    assert(proof.storage_budget_authority.storage_missing_unavailable.rewrite_authority.issues.includes('storage_missing_unavailable_blocks_inventory_rewrite'), 'missing storage should block rewrite');
    assert(proof.storage_budget_authority.storage_invalid_degraded.rewrite_authority.issues.includes('storage_invalid_degraded_blocks_inventory_rewrite'), 'degraded storage should block rewrite');
    assert(proof.storage_budget_authority.budget_unconfigured.rewrite_authority.issues.includes('budget_unconfigured_blocks_inventory_rewrite'), 'unconfigured budget should block rewrite');
    assert(proof.storage_budget_authority.budget_hard_lock.rewrite_authority.issues.includes('budget_hard_lock_blocks_inventory_rewrite'), 'hard-lock budget should block rewrite');

    assert(proof.rewrite_result.status === 'fixture_inventory_rewrite_promoted', 'success case should promote fixture inventory');
    assert(proof.rewrite_result.visible_inventory_ready === true, 'successful promotion should leave inventory ready');
    assert(proof.rewrite_result.provenance_written_after_complete_promotion === true, 'provenance should be written after complete promotion');
    assert(proof.rewrite_result.provenance_after_success.build_number === 'fixture-inventory-success', 'success provenance should record build');

    assert(proof.failure_result.status === 'fixture_failure_caught', 'failure case should be caught');
    assert(proof.failure_result.error_code === 'SDE_INVENTORY_FIXTURE_INTERRUPTED_BEFORE_PROMOTION', 'failure should happen before promotion');
    assert(proof.failure_result.previous_visible_inventory_preserved === true, 'failed rewrite should preserve visible inventory');
    assert(proof.failure_result.partial_promoted_inventory_ready === false, 'failed stage should not become ready visible inventory');
    assert(proof.failure_result.failure_provenance_written === false, 'failed rewrite should not write inventory provenance');
    assert(proof.failure_result.staged_material_cleanup.temp_tables_dropped === true, 'failed staged material cleanup should be represented');
    assert(proof.recovery_model.automatic_retry === false, 'retry/rerun should not be automatic');
    assert(proof.recovery_model.retry_rerun_posture === 'explicit_operator_or_test_rerun_required', 'retry posture should be explicit');

    const after = inventoryCounts(db);
    assert(after.sde_inventory_imports === proof.failure_result.after.sde_inventory_imports, 'reported counts should match fixture DB');
    assertSame(evidenceTableCounts(db), beforeEvidence, 'fixture proof should not mutate Evidence/EVEidence or Assessment tables');
  } finally {
    closeDatabase(db);
  }
}

function verifyCommandRegistration() {
  const commands = new Map(listServiceCommands().map((entry) => [entry.command, entry]));
  const command = commands.get('sde.inventory_import_rewrite_authority.proof');
  assert(command, 'sde inventory import/rewrite authority proof should be registered');
  assert(command.classification === 'metadata-only', 'proof command should be metadata-only fixture mutation');
  assert(command.effects.includes('local-data-mutation'), 'proof command should declare local fixture mutation');
  assert(command.effects.includes('metadata-readability'), 'proof command should declare metadata readability fixture effect');
  assert(command.renderer_allowed === false, 'proof command should not be renderer eligible');
}

function trustedContext() {
  return {
    allowSdeInventoryImportRewriteAuthorityFixture: true,
    sdeInventorySourceAuthority: {
      path: path.join(auraTempRoot(), 'hs226-source', 'sde-inventory-fixture.zip'),
      basis: 'trusted_fixture_context',
      fixture_authority: true
    },
    projectedSdeInventoryGrowthBytes: {
      source_bytes: 2048,
      temp_extract_bytes: 4096,
      staged_table_bytes: 2048,
      db_growth_bytes: 4096,
      wal_shm_headroom_bytes: 2048
    }
  };
}

function evidenceTableCounts(db) {
  return {
    killmails: count(db, 'killmails'),
    activity_events: count(db, 'activity_events'),
    entities: count(db, 'entities'),
    assessment_artifacts: count(db, 'assessment_artifacts')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function assertSame(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: ${JSON.stringify({ actual, expected })}`);
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
