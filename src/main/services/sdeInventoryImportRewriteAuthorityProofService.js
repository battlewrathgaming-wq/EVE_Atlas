const path = require('node:path');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');

const COMMAND = 'sde.inventory_import_rewrite_authority.proof';
const SUPPORTED_LOCAL_SOURCE_EXTENSIONS = new Set(['.zip', '.jsonl']);
const DEFAULT_PROJECTED_BYTES = Object.freeze({
  source_bytes: 192 * 1024,
  temp_extract_bytes: 384 * 1024,
  staged_table_bytes: 96 * 1024,
  db_growth_bytes: 96 * 1024,
  wal_shm_headroom_bytes: 128 * 1024
});

function buildSdeInventoryImportRewriteAuthorityProof(db, input = {}, context = {}) {
  const trustedFixture = context.allowSdeInventoryImportRewriteAuthorityFixture === true;
  const sourceAuthority = sourceAuthorityFor(input, context, trustedFixture);
  const projectedGrowth = projectedGrowthFor(input, context);
  const storageCases = buildStorageCases(projectedGrowth);
  const rewriteAllowed = trustedFixture &&
    sourceAuthority.decision === 'accepted' &&
    storageCases.configured_ready_budget_ok.rewrite_authority.decision === 'allow_fixture_rewrite';

  const proof = {
    action: COMMAND,
    classification: 'fixture/offline inventory import rewrite authority proof',
    fixture_offline_only: true,
    trusted_fixture_context_required: true,
    trusted_fixture_context_present: trustedFixture,
    renderer_payload_ignored: rendererPayloadHasSourceClaims(input),
    read_only_operator_state: true,
    mutates_fixture_db_only: rewriteAllowed,
    provider_calls: 0,
    sde_downloads: 0,
    provider_backed_builds: 0,
    real_operator_source_path_inspections: 0,
    real_operator_lookup_table_writes: 0,
    support_artifacts_created: 0,
    config_writes: 0,
    schema_changes: 0,
    topology_import_behavior_changed: false,
    combined_topology_inventory_behavior: false,
    runtime_enforcement_active: false,
    command_blocking_active: false,
    source_authority: {
      renderer_supplied_source_path: rendererSourcePath(input),
      renderer_source_path_used: false,
      selected_authority: sourceAuthority,
      cases: sourceAuthorityCases(context)
    },
    projected_growth: projectedGrowth,
    storage_budget_authority: storageCases,
    recovery_model: {
      model: 'fixture_transactional_staged_inventory_promotion',
      real_importer_changed: false,
      promotion_requires_complete_stage: true,
      provenance_written_after_complete_promotion_only: true,
      failed_stage_preserves_previous_visible_inventory: true,
      cleanup_required_for_partial_stage: true,
      retry_rerun_posture: 'explicit_operator_or_test_rerun_required',
      automatic_retry: false
    },
    rewrite_result: null,
    failure_result: null,
    boundary: boundary()
  };

  ensureInventorySupportTables(db);

  if (!rewriteAllowed) {
    return {
      ...proof,
      proof_state: 'blocked_before_fixture_rewrite',
      blocked_reasons: blockedReasons({ trustedFixture, sourceAuthority, storageCases })
    };
  }

  const before = inventoryCounts(db);
  seedReadyInventoryIfEmpty(db);
  const readyBefore = inventoryCounts(db);
  const success = applyFixtureInventoryRewrite(db, fixtureInventoryRows('success'), {
    buildNumber: 'fixture-inventory-success',
    sourceUrl: sourceAuthority.safe_display,
    fileChecksum: 'fixture-success-checksum'
  });
  const afterSuccess = inventoryCounts(db);
  const provenanceAfterSuccess = latestInventoryProvenance(db);

  const beforeFailure = inventoryCounts(db);
  let failureError = null;
  let failureCleanup = null;
  try {
    applyFixtureInventoryRewrite(db, fixtureInventoryRows('failure'), {
      buildNumber: 'fixture-inventory-failure',
      sourceUrl: sourceAuthority.safe_display,
      fileChecksum: 'fixture-failure-checksum',
      failAt: 'after_stage_before_promotion'
    });
  } catch (error) {
    failureError = error;
    failureCleanup = error.cleanup || null;
  }
  const afterFailure = inventoryCounts(db);
  const provenanceAfterFailure = latestInventoryProvenance(db);

  return {
    ...proof,
    proof_state: 'fixture_rewrite_authority_proven',
    initial_counts_before_seed: before,
    rewrite_result: {
      status: success.status,
      before: readyBefore,
      after: afterSuccess,
      promoted_counts: success.promoted_counts,
      provenance_after_success: compactProvenance(provenanceAfterSuccess),
      provenance_written_after_complete_promotion: provenanceAfterSuccess?.build_number === 'fixture-inventory-success',
      visible_inventory_ready: inventoryReady(afterSuccess)
    },
    failure_result: {
      status: 'fixture_failure_caught',
      error_code: failureError?.code || null,
      error_message: failureError?.message || null,
      before: beforeFailure,
      after: afterFailure,
      previous_visible_inventory_preserved: sameVisibleInventory(beforeFailure, afterFailure),
      partial_promoted_inventory_ready: false,
      provenance_after_failure: compactProvenance(provenanceAfterFailure),
      failure_provenance_written: provenanceAfterFailure?.build_number === 'fixture-inventory-failure',
      staged_material_cleanup: failureCleanup
    }
  };
}

function applyFixtureInventoryRewrite(db, rows, options = {}) {
  ensureInventorySupportTables(db);
  const cleanup = {
    temp_tables_created: ['temp_hs226_categories', 'temp_hs226_groups', 'temp_hs226_type_metadata'],
    temp_tables_dropped: false,
    partial_stage_left_visible: false
  };
  let pendingError = null;
  dropTempTables(db);
  createTempTables(db);
  try {
    insertStagedRows(db, rows);
    const stagedCounts = stagedInventoryCounts(db);
    if (!inventoryReady(stagedCounts)) {
      const error = new Error('fixture staged inventory incomplete');
      error.code = 'SDE_INVENTORY_STAGE_INCOMPLETE';
      throw error;
    }
    if (options.failAt === 'after_stage_before_promotion') {
      const error = new Error('fixture inventory rewrite interrupted before promotion');
      error.code = 'SDE_INVENTORY_FIXTURE_INTERRUPTED_BEFORE_PROMOTION';
      throw error;
    }

    runTransaction(db, () => {
      db.exec(`
        DELETE FROM type_metadata;
        DELETE FROM sde_inventory_groups;
        DELETE FROM sde_inventory_categories;
      `);
      const importedAt = now();
      db.exec(`
        INSERT INTO sde_inventory_categories (category_id, category_name, published)
        SELECT category_id, category_name, published FROM temp_hs226_categories;

        INSERT INTO sde_inventory_groups (group_id, group_name, category_id, published)
        SELECT group_id, group_name, category_id, published FROM temp_hs226_groups;

        INSERT INTO type_metadata (
          type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
        )
        SELECT type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
        FROM temp_hs226_type_metadata;
      `);

      if (options.failAt === 'after_promotion_before_provenance') {
        const error = new Error('fixture inventory rewrite interrupted before provenance');
        error.code = 'SDE_INVENTORY_FIXTURE_INTERRUPTED_BEFORE_PROVENANCE';
        throw error;
      }

      db.prepare(`
        INSERT INTO sde_inventory_imports (
          build_number, variant, source_url, etag, last_modified, imported_at, file_checksum,
          categories_count, groups_count, types_count, type_metadata_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        options.buildNumber || null,
        'fixture-staged-jsonl',
        options.sourceUrl || 'fixture://hs226-inventory',
        null,
        null,
        importedAt,
        options.fileChecksum || null,
        stagedCounts.sde_inventory_categories,
        stagedCounts.sde_inventory_groups,
        stagedCounts.type_metadata,
        stagedCounts.type_metadata
      );
    });
    return {
      status: 'fixture_inventory_rewrite_promoted',
      promoted_counts: inventoryCounts(db),
      cleanup
    };
  } catch (error) {
    pendingError = error;
    throw error;
  } finally {
    dropTempTables(db);
    Object.assign(cleanup, cleanupResult(db, cleanup));
    if (pendingError) {
      pendingError.cleanup = cleanup;
    }
  }
}

function sourceAuthorityFor(input = {}, context = {}, trustedFixture) {
  const rendererClaim = rendererSourcePath(input);
  const trusted = context.sdeInventorySourceAuthority || input.trustedSourceAuthority || {};
  const trustedPath = trusted.path || trusted.sourcePath || context.trustedSdeInventorySourcePath || null;
  const trustedBasis = trusted.basis || context.trustedSdeInventorySourceBasis || null;
  if (rendererClaim && !trustedPath) {
    return authorityDecision('blocked', 'renderer_source_path_non_authoritative', {
      renderer_payload_ignored: true,
      supplied_by: 'renderer_payload'
    });
  }
  if (!trustedPath) {
    return authorityDecision('blocked', 'source_path_required', {
      supplied_by: 'none'
    });
  }
  if (isRemoteReference(trustedPath)) {
    return authorityDecision('blocked', 'remote_source_rejected_for_local_inventory_import', {
      supplied_by: 'trusted_context',
      safe_display: redactPath(trustedPath)
    });
  }
  const ext = path.extname(String(trustedPath)).toLowerCase();
  const supported = !ext || SUPPORTED_LOCAL_SOURCE_EXTENSIONS.has(ext);
  if (!supported) {
    return authorityDecision('blocked', 'unsupported_local_source_shape', {
      supplied_by: 'trusted_context',
      safe_display: redactPath(trustedPath),
      supported_shapes: ['SDE JSONL zip', 'SDE JSONL directory', 'single JSONL fixture']
    });
  }
  if (!trustedFixture || trusted.fixture_authority !== true || trustedBasis !== 'trusted_fixture_context') {
    return authorityDecision('blocked', 'trusted_fixture_source_authority_required', {
      supplied_by: 'trusted_context',
      safe_display: redactPath(trustedPath),
      trusted_fixture_context_present: trustedFixture,
      renderer_payload_ignored: Boolean(rendererClaim)
    });
  }
  return authorityDecision('accepted', 'trusted_fixture_local_inventory_source_authority', {
    supplied_by: 'trusted_fixture_context',
    safe_display: redactPath(trustedPath),
    supported_shapes: ['SDE JSONL zip', 'SDE JSONL directory', 'single JSONL fixture'],
    path_inspected: false,
    arbitrary_file_inspection: false,
    renderer_payload_ignored: Boolean(rendererClaim)
  });
}

function sourceAuthorityCases(context = {}) {
  return {
    renderer_supplied_source_path: authorityDecision('blocked', 'renderer_source_path_non_authoritative', {
      renderer_payload_ignored: true,
      path_used: false
    }),
    no_source_path: authorityDecision('blocked', 'source_path_required'),
    remote_url: authorityDecision('blocked', 'remote_source_rejected_for_local_inventory_import', {
      external_io_required_for_download_path: true,
      local_import_uses_remote_url: false
    }),
    trusted_local_fixture_source: authorityDecision(
      context.allowSdeInventoryImportRewriteAuthorityFixture === true ? 'accepted' : 'blocked',
      context.allowSdeInventoryImportRewriteAuthorityFixture === true
        ? 'trusted_fixture_local_inventory_source_authority'
        : 'trusted_fixture_source_authority_required',
      {
        path_inspected: false,
        arbitrary_file_inspection: false
      }
    )
  };
}

function buildStorageCases(projectedGrowth) {
  return {
    configured_ready_budget_ok: storageCase({
      label: 'configured_ready_budget_ok',
      mode: 'selected_storage',
      validationStatus: 'valid',
      selected: true,
      exists: true,
      parentExists: true,
      budgetBytes: projectedGrowth.total_projected_bytes + 1024 * 1024,
      usageBytes: 1024
    }, projectedGrowth),
    storage_missing_unavailable: storageCase({
      label: 'storage_missing_unavailable',
      mode: 'selected_storage_missing_unavailable',
      validationStatus: 'missing_unavailable',
      selected: true,
      exists: false,
      parentExists: false,
      budgetBytes: projectedGrowth.total_projected_bytes + 1024 * 1024,
      usageBytes: 1024
    }, projectedGrowth),
    storage_invalid_degraded: storageCase({
      label: 'storage_invalid_degraded',
      mode: 'selected_storage_invalid_degraded',
      validationStatus: 'invalid_degraded',
      selected: true,
      exists: true,
      parentExists: true,
      outsidePolicy: true,
      budgetBytes: projectedGrowth.total_projected_bytes + 1024 * 1024,
      usageBytes: 1024
    }, projectedGrowth),
    budget_unconfigured: storageCase({
      label: 'budget_unconfigured',
      mode: 'selected_storage',
      validationStatus: 'valid',
      selected: true,
      exists: true,
      parentExists: true,
      budgetBytes: null,
      usageBytes: 1024
    }, projectedGrowth),
    budget_hard_lock: storageCase({
      label: 'budget_hard_lock',
      mode: 'selected_storage',
      validationStatus: 'valid',
      selected: true,
      exists: true,
      parentExists: true,
      budgetBytes: 1024,
      usageBytes: 4096
    }, projectedGrowth)
  };
}

function storageCase(options, projectedGrowth) {
  const readout = buildStorageSetupGateReadout({
    storagePreflight: fixturePreflight(options),
    storageAuthority: {
      mode: options.mode,
      selected: options.selected === true,
      validation_status: options.validationStatus,
      database_path: 'fixture://hs226-atlas.sqlite',
      storage_root: 'fixture://hs226-storage',
      budget_bytes: options.budgetBytes,
      config_source: 'fixture_storage_authority'
    },
    storageBudgetBytes: options.budgetBytes
  }, {
    allowStorageSetupGateFixtureInput: true
  });
  return {
    label: options.label,
    setup_gate_state: readout.storage.state,
    matrix_state: readout.action_class_matrix.storage_state,
    budget_state: readout.budget.state,
    budget_bytes: readout.budget.budget_bytes,
    usage_bytes: readout.budget.usage_bytes,
    projected_growth_bytes: projectedGrowth.total_projected_bytes,
    rewrite_authority: inventoryRewriteAuthorityFor(readout, projectedGrowth),
    storage_setup_enforced_now: false
  };
}

function inventoryRewriteAuthorityFor(readout, projectedGrowth) {
  const issues = [];
  if (readout.storage.state !== 'configured_ready') {
    issues.push(readout.storage.state === 'missing_unavailable_blocked'
      ? 'storage_missing_unavailable_blocks_inventory_rewrite'
      : readout.storage.state === 'invalid_degraded_setup_required'
        ? 'storage_invalid_degraded_blocks_inventory_rewrite'
        : 'storage_not_ready_blocks_inventory_rewrite');
  }
  if (readout.budget.state === 'budget_unconfigured') {
    issues.push('budget_unconfigured_blocks_inventory_rewrite');
  }
  if (readout.budget.state === 'budget_hard_lock') {
    issues.push('budget_hard_lock_blocks_inventory_rewrite');
  }
  if (Number.isFinite(Number(readout.budget.budget_bytes)) && readout.budget.budget_bytes <= projectedGrowth.total_projected_bytes) {
    issues.push('projected_growth_exceeds_available_fixture_budget');
  }
  return {
    decision: issues.length ? 'block_fixture_rewrite' : 'allow_fixture_rewrite',
    issues,
    readiness_is_authorization: false,
    storage_readout_is_authorization: false
  };
}

function projectedGrowthFor(input = {}, context = {}) {
  const supplied = context.projectedSdeInventoryGrowthBytes || input.projectedGrowthBytes || {};
  const normalized = {
    source_bytes: positiveNumber(supplied.source_bytes ?? supplied.sourceBytes, DEFAULT_PROJECTED_BYTES.source_bytes),
    temp_extract_bytes: positiveNumber(supplied.temp_extract_bytes ?? supplied.tempExtractBytes, DEFAULT_PROJECTED_BYTES.temp_extract_bytes),
    staged_table_bytes: positiveNumber(supplied.staged_table_bytes ?? supplied.stagedTableBytes, DEFAULT_PROJECTED_BYTES.staged_table_bytes),
    db_growth_bytes: positiveNumber(supplied.db_growth_bytes ?? supplied.dbGrowthBytes, DEFAULT_PROJECTED_BYTES.db_growth_bytes),
    wal_shm_headroom_bytes: positiveNumber(supplied.wal_shm_headroom_bytes ?? supplied.walShmHeadroomBytes, DEFAULT_PROJECTED_BYTES.wal_shm_headroom_bytes)
  };
  return {
    ...normalized,
    total_projected_bytes: Object.values(normalized).reduce((sum, value) => sum + value, 0),
    includes_temp_cache_db_growth: true,
    source: supplied === context.projectedSdeInventoryGrowthBytes ? 'trusted_context' : 'fixture_default_or_input',
    projection_is_authorization: false
  };
}

function ensureInventorySupportTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sde_inventory_categories (
      category_id INTEGER PRIMARY KEY,
      category_name TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sde_inventory_groups (
      group_id INTEGER PRIMARY KEY,
      group_name TEXT NOT NULL,
      category_id INTEGER,
      published INTEGER NOT NULL DEFAULT 0
    );
  `);
}

function createTempTables(db) {
  db.exec(`
    CREATE TEMP TABLE temp_hs226_categories (
      category_id INTEGER PRIMARY KEY,
      category_name TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 0
    );
    CREATE TEMP TABLE temp_hs226_groups (
      group_id INTEGER PRIMARY KEY,
      group_name TEXT NOT NULL,
      category_id INTEGER,
      published INTEGER NOT NULL DEFAULT 0
    );
    CREATE TEMP TABLE temp_hs226_type_metadata (
      type_id INTEGER PRIMARY KEY,
      type_name TEXT,
      group_id INTEGER,
      group_name TEXT,
      category_id INTEGER,
      category_name TEXT,
      last_fetched TEXT
    );
  `);
}

function insertStagedRows(db, rows) {
  const category = db.prepare('INSERT INTO temp_hs226_categories (category_id, category_name, published) VALUES (?, ?, ?)');
  const group = db.prepare('INSERT INTO temp_hs226_groups (group_id, group_name, category_id, published) VALUES (?, ?, ?, ?)');
  const type = db.prepare(`
    INSERT INTO temp_hs226_type_metadata (
      type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const entry of rows.categories) {
    category.run(entry.category_id, entry.category_name, entry.published);
  }
  for (const entry of rows.groups) {
    group.run(entry.group_id, entry.group_name, entry.category_id, entry.published);
  }
  for (const entry of rows.types) {
    type.run(entry.type_id, entry.type_name, entry.group_id, entry.group_name, entry.category_id, entry.category_name, entry.last_fetched || now());
  }
}

function dropTempTables(db) {
  db.exec(`
    DROP TABLE IF EXISTS temp_hs226_type_metadata;
    DROP TABLE IF EXISTS temp_hs226_groups;
    DROP TABLE IF EXISTS temp_hs226_categories;
  `);
}

function seedReadyInventoryIfEmpty(db) {
  ensureInventorySupportTables(db);
  if (inventoryReady(inventoryCounts(db))) {
    return;
  }
  runTransaction(db, () => {
    db.prepare('INSERT OR REPLACE INTO sde_inventory_categories (category_id, category_name, published) VALUES (?, ?, ?)')
      .run(6, 'Old Ship', 1);
    db.prepare('INSERT OR REPLACE INTO sde_inventory_groups (group_id, group_name, category_id, published) VALUES (?, ?, ?, ?)')
      .run(25, 'Old Frigate', 6, 1);
    db.prepare(`
      INSERT OR REPLACE INTO type_metadata (
        type_id, type_name, group_id, group_name, category_id, category_name, last_fetched
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(587, 'Old Rifter', 25, 'Old Frigate', 6, 'Old Ship', now());
    db.prepare(`
      INSERT INTO sde_inventory_imports (
        build_number, variant, source_url, imported_at, file_checksum,
        categories_count, groups_count, types_count, type_metadata_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('fixture-old', 'fixture-seed', 'fixture://old-inventory', now(), 'fixture-old-checksum', 1, 1, 1, 1);
  });
}

function runTransaction(db, callback) {
  db.exec('BEGIN');
  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function fixtureInventoryRows(kind) {
  const prefix = kind === 'failure' ? 'Failure' : 'Success';
  return {
    categories: [
      { category_id: 6, category_name: `${prefix} Ship`, published: 1 },
      { category_id: 7, category_name: `${prefix} Module`, published: 1 }
    ],
    groups: [
      { group_id: 25, group_name: `${prefix} Frigate`, category_id: 6, published: 1 },
      { group_id: 53, group_name: `${prefix} Weapon`, category_id: 7, published: 1 }
    ],
    types: [
      { type_id: 587, type_name: `${prefix} Rifter`, group_id: 25, group_name: `${prefix} Frigate`, category_id: 6, category_name: `${prefix} Ship` },
      { type_id: 2001, type_name: `${prefix} Laser`, group_id: 53, group_name: `${prefix} Weapon`, category_id: 7, category_name: `${prefix} Module` }
    ]
  };
}

function inventoryCounts(db) {
  ensureInventorySupportTables(db);
  return {
    sde_inventory_categories: count(db, 'sde_inventory_categories'),
    sde_inventory_groups: count(db, 'sde_inventory_groups'),
    type_metadata: count(db, 'type_metadata'),
    sde_inventory_imports: count(db, 'sde_inventory_imports')
  };
}

function stagedInventoryCounts(db) {
  return {
    sde_inventory_categories: count(db, 'temp_hs226_categories'),
    sde_inventory_groups: count(db, 'temp_hs226_groups'),
    type_metadata: count(db, 'temp_hs226_type_metadata')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function inventoryReady(counts = {}) {
  return counts.sde_inventory_categories > 0 &&
    counts.sde_inventory_groups > 0 &&
    counts.type_metadata > 0;
}

function sameVisibleInventory(before = {}, after = {}) {
  return before.sde_inventory_categories === after.sde_inventory_categories &&
    before.sde_inventory_groups === after.sde_inventory_groups &&
    before.type_metadata === after.type_metadata &&
    before.sde_inventory_imports === after.sde_inventory_imports;
}

function latestInventoryProvenance(db) {
  return db.prepare('SELECT * FROM sde_inventory_imports ORDER BY id DESC LIMIT 1').get() || null;
}

function compactProvenance(row) {
  return row ? {
    build_number: row.build_number,
    variant: row.variant,
    source_url: row.source_url,
    categories_count: row.categories_count,
    groups_count: row.groups_count,
    types_count: row.types_count,
    type_metadata_count: row.type_metadata_count
  } : null;
}

function cleanupResult(db, cleanup) {
  const remaining = cleanup.temp_tables_created.filter((tableName) => tempTableExists(db, tableName));
  return {
    ...cleanup,
    temp_tables_dropped: remaining.length === 0,
    remaining_temp_tables: remaining
  };
}

function tempTableExists(db, tableName) {
  return Boolean(db.prepare(`
    SELECT name FROM sqlite_temp_master WHERE type = 'table' AND name = ?
  `).get(tableName));
}

function blockedReasons({ trustedFixture, sourceAuthority, storageCases }) {
  return [
    trustedFixture ? null : 'trusted_fixture_context_required',
    sourceAuthority.decision === 'accepted' ? null : sourceAuthority.reason,
    ...(storageCases.configured_ready_budget_ok.rewrite_authority.issues || [])
  ].filter(Boolean);
}

function authorityDecision(decision, reason, extra = {}) {
  return {
    decision,
    reason,
    path_inspected: extra.path_inspected === true,
    arbitrary_file_inspection: extra.arbitrary_file_inspection === true,
    renderer_payload_ignored: extra.renderer_payload_ignored === true,
    supplied_by: extra.supplied_by || null,
    safe_display: extra.safe_display || null,
    supported_shapes: extra.supported_shapes || [],
    external_io_required_for_download_path: extra.external_io_required_for_download_path === true,
    local_import_uses_remote_url: extra.local_import_uses_remote_url === true,
    trusted_fixture_context_present: extra.trusted_fixture_context_present === true,
    path_used: extra.path_used === true
  };
}

function fixturePreflight(options) {
  return {
    action: 'storage.authority_preflight',
    read_only: true,
    database: {
      source: 'configured',
      mode: options.exists === false ? 'missing' : options.outsidePolicy ? 'outside_policy' : 'configured',
      path: 'fixture://hs226-atlas.sqlite',
      exists: options.exists === true,
      parent: {
        exists: options.parentExists === true,
        is_directory: options.parentExists === true
      },
      mode_flags: {
        outside_policy: options.outsidePolicy === true,
        demo_fixture: false
      }
    },
    snapshot: {
      settings: {
        status: 'missing'
      }
    },
    byte_usage: {
      database_bytes: Number(options.usageBytes || 0),
      known_controlled_locations_bytes: 0
    }
  };
}

function rendererPayloadHasSourceClaims(input = {}) {
  return Boolean(rendererSourcePath(input) || input.sourceAuthority || input.source_authority);
}

function rendererSourcePath(input = {}) {
  return input.sourcePath || input.source_path || input.path || null;
}

function isRemoteReference(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

function redactPath(value) {
  if (!value) {
    return null;
  }
  if (isRemoteReference(value)) {
    return String(value).replace(/\/\/.*$/, '//<remote-source>');
  }
  const base = path.basename(String(value));
  return base ? `<local-source>/${base}` : '<local-source>';
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function now() {
  return new Date().toISOString();
}

function boundary() {
  return [
    'Fixture/offline inventory import rewrite authority proof only.',
    'Renderer source paths are non-authoritative and are ignored.',
    'Trusted local inventory source authority is accepted only from explicit trusted fixture context.',
    'Remote source references are rejected for local inventory import; provider-backed download/build remains parked.',
    'Storage and explicit budget posture must allow projected inventory rewrite before fixture promotion.',
    'Provenance is inserted only after complete staged promotion.',
    'Failed staged fixture rewrite preserves previous visible inventory/type lookup readiness and requires explicit rerun.',
    'This proof does not mutate real operator lookup tables, inspect real operator source paths, call providers, create support artifacts, activate enforcement, block commands, change schema, change topology behavior, or do UI work.'
  ];
}

module.exports = {
  COMMAND,
  buildSdeInventoryImportRewriteAuthorityProof,
  applyFixtureInventoryRewrite,
  sourceAuthorityFor,
  inventoryCounts
};
