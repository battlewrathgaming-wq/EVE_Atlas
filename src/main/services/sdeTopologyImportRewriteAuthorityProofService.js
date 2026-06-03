const path = require('node:path');
const { buildStorageSetupGateReadout } = require('./storageSetupGateReadoutService');

const COMMAND = 'sde.topology_import_rewrite_authority.proof';
const SUPPORTED_LOCAL_SOURCE_EXTENSIONS = new Set(['.zip', '.jsonl']);
const DEFAULT_PROJECTED_BYTES = Object.freeze({
  source_bytes: 128 * 1024,
  temp_extract_bytes: 256 * 1024,
  staged_table_bytes: 64 * 1024,
  db_growth_bytes: 64 * 1024,
  wal_shm_headroom_bytes: 128 * 1024
});

function buildSdeTopologyImportRewriteAuthorityProof(db, input = {}, context = {}) {
  const trustedFixture = context.allowSdeTopologyImportRewriteAuthorityFixture === true;
  const sourceAuthority = sourceAuthorityFor(input, context, trustedFixture);
  const projectedGrowth = projectedGrowthFor(input, context);
  const storageCases = buildStorageCases(projectedGrowth);
  const rewriteAllowed = trustedFixture &&
    sourceAuthority.decision === 'accepted' &&
    storageCases.configured_ready_budget_ok.rewrite_authority.decision === 'allow_fixture_rewrite';

  const proof = {
    action: COMMAND,
    classification: 'fixture/offline topology import rewrite authority proof',
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
      model: 'fixture_transactional_staged_promotion',
      real_importer_changed: false,
      promotion_requires_complete_stage: true,
      provenance_written_after_complete_promotion_only: true,
      failed_stage_preserves_previous_visible_topology: true,
      cleanup_required_for_partial_stage: true,
      retry_rerun_posture: 'explicit_operator_or_test_rerun_required',
      automatic_retry: false
    },
    rewrite_result: null,
    failure_result: null,
    boundary: boundary()
  };

  if (!rewriteAllowed) {
    return {
      ...proof,
      proof_state: 'blocked_before_fixture_rewrite',
      blocked_reasons: blockedReasons({ trustedFixture, sourceAuthority, storageCases })
    };
  }

  const before = topologyCounts(db);
  seedReadyTopologyIfEmpty(db);
  const readyBefore = topologyCounts(db);
  const success = applyFixtureTopologyRewrite(db, fixtureTopologyRows('success'), {
    buildNumber: 'fixture-topology-success',
    sourceUrl: sourceAuthority.safe_display,
    fileChecksum: 'fixture-success-checksum'
  });
  const afterSuccess = topologyCounts(db);
  const provenanceAfterSuccess = latestTopologyProvenance(db);

  const beforeFailure = topologyCounts(db);
  let failureError = null;
  let failureCleanup = null;
  try {
    applyFixtureTopologyRewrite(db, fixtureTopologyRows('failure'), {
      buildNumber: 'fixture-topology-failure',
      sourceUrl: sourceAuthority.safe_display,
      fileChecksum: 'fixture-failure-checksum',
      failAt: 'after_stage_before_promotion'
    });
  } catch (error) {
    failureError = error;
    failureCleanup = error.cleanup || null;
  }
  const afterFailure = topologyCounts(db);
  const provenanceAfterFailure = latestTopologyProvenance(db);

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
      provenance_written_after_complete_promotion: provenanceAfterSuccess?.build_number === 'fixture-topology-success',
      visible_topology_ready: topologyReady(afterSuccess)
    },
    failure_result: {
      status: 'fixture_failure_caught',
      error_code: failureError?.code || null,
      error_message: failureError?.message || null,
      before: beforeFailure,
      after: afterFailure,
      previous_visible_topology_preserved: sameVisibleTopology(beforeFailure, afterFailure),
      partial_promoted_topology_ready: false,
      provenance_after_failure: compactProvenance(provenanceAfterFailure),
      failure_provenance_written: provenanceAfterFailure?.build_number === 'fixture-topology-failure',
      staged_material_cleanup: failureCleanup
    }
  };
}

function applyFixtureTopologyRewrite(db, rows, options = {}) {
  const cleanup = {
    temp_tables_created: ['temp_hs224_regions', 'temp_hs224_constellations', 'temp_hs224_solar_systems', 'temp_hs224_system_adjacency'],
    temp_tables_dropped: false,
    partial_stage_left_visible: false
  };
  let pendingError = null;
  dropTempTables(db);
  createTempTables(db);
  try {
    insertStagedRows(db, rows);
    const stagedCounts = stagedTopologyCounts(db);
    if (!topologyReady(stagedCounts)) {
      const error = new Error('fixture staged topology incomplete');
      error.code = 'SDE_TOPOLOGY_STAGE_INCOMPLETE';
      throw error;
    }
    if (options.failAt === 'after_stage_before_promotion') {
      const error = new Error('fixture topology rewrite interrupted before promotion');
      error.code = 'SDE_TOPOLOGY_FIXTURE_INTERRUPTED_BEFORE_PROMOTION';
      throw error;
    }

    runTransaction(db, () => {
      db.exec(`
        DELETE FROM system_adjacency;
        DELETE FROM solar_systems;
        DELETE FROM constellations;
        DELETE FROM regions;
      `);
      const importedAt = now();
      db.prepare(`
        INSERT INTO regions (region_id, region_name, source_sde_build, imported_at)
        SELECT region_id, region_name, ?, ? FROM temp_hs224_regions
      `).run(options.buildNumber || null, importedAt);
      db.prepare(`
        INSERT INTO constellations (
          constellation_id, constellation_name, region_id, region_name, source_sde_build, imported_at
        )
        SELECT constellation_id, constellation_name, region_id, region_name, ?, ? FROM temp_hs224_constellations
      `).run(options.buildNumber || null, importedAt);
      db.exec(`
        INSERT INTO solar_systems (
          solar_system_id, solar_system_name, constellation_id, constellation_name,
          region_id, region_name, security_status
        )
        SELECT solar_system_id, solar_system_name, constellation_id, constellation_name,
          region_id, region_name, security_status FROM temp_hs224_solar_systems;

        INSERT INTO system_adjacency (from_system_id, to_system_id, connection_type)
        SELECT from_system_id, to_system_id, connection_type FROM temp_hs224_system_adjacency;
      `);

      if (options.failAt === 'after_promotion_before_provenance') {
        const error = new Error('fixture topology rewrite interrupted before provenance');
        error.code = 'SDE_TOPOLOGY_FIXTURE_INTERRUPTED_BEFORE_PROVENANCE';
        throw error;
      }

      db.prepare(`
        INSERT INTO sde_imports (
          build_number, variant, source_url, etag, last_modified, imported_at,
          file_checksum, latest_metadata_checksum, changes_metadata_checksum,
          systems_count, constellations_count, regions_count, adjacency_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        options.buildNumber || null,
        'fixture-staged-jsonl',
        options.sourceUrl || 'fixture://hs224-topology',
        null,
        null,
        now(),
        options.fileChecksum || null,
        null,
        null,
        stagedCounts.solar_systems,
        stagedCounts.constellations,
        stagedCounts.regions,
        stagedCounts.system_adjacency
      );
    });
    return {
      status: 'fixture_topology_rewrite_promoted',
      promoted_counts: topologyCounts(db),
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
  const trusted = context.sdeTopologySourceAuthority || input.trustedSourceAuthority || {};
  const trustedPath = trusted.path || trusted.sourcePath || context.trustedSdeTopologySourcePath || null;
  const trustedBasis = trusted.basis || context.trustedSdeTopologySourceBasis || null;
  if (rendererClaim && !trustedPath) {
    return authorityDecision('blocked', 'renderer_source_path_non_authoritative', {
      renderer_payload_ignored: true,
      supplied_by: 'renderer_payload',
      safe_display: null
    });
  }
  if (!trustedPath) {
    return authorityDecision('blocked', 'source_path_required', {
      supplied_by: 'none',
      safe_display: null
    });
  }
  if (isRemoteReference(trustedPath)) {
    return authorityDecision('blocked', 'remote_source_rejected_for_local_topology_import', {
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
  return authorityDecision('accepted', 'trusted_fixture_local_source_authority', {
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
    remote_url: authorityDecision('blocked', 'remote_source_rejected_for_local_topology_import', {
      external_io_required_for_download_path: true,
      local_import_uses_remote_url: false
    }),
    trusted_local_fixture_source: authorityDecision(
      context.allowSdeTopologyImportRewriteAuthorityFixture === true ? 'accepted' : 'blocked',
      context.allowSdeTopologyImportRewriteAuthorityFixture === true
        ? 'trusted_fixture_local_source_authority'
        : 'trusted_fixture_source_authority_required',
      {
        path_inspected: false,
        arbitrary_file_inspection: false
      }
    )
  };
}

function buildStorageCases(projectedGrowth) {
  const basePath = path.join('F:', 'Projects', 'AURA-Atlas', '.tmp', 'hs224-fixture', 'atlas.sqlite');
  const cases = {
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

  Object.values(cases).forEach((entry) => {
    entry.database_path = basePath;
  });
  return cases;
}

function storageCase(options, projectedGrowth) {
  const readout = buildStorageSetupGateReadout({
    storagePreflight: fixturePreflight(options),
    storageAuthority: {
      mode: options.mode,
      selected: options.selected === true,
      validation_status: options.validationStatus,
      database_path: 'fixture://hs224-atlas.sqlite',
      storage_root: 'fixture://hs224-storage',
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
    rewrite_authority: topologyRewriteAuthorityFor(readout, projectedGrowth),
    storage_setup_enforced_now: false
  };
}

function topologyRewriteAuthorityFor(readout, projectedGrowth) {
  const issues = [];
  if (readout.storage.state !== 'configured_ready') {
    issues.push(readout.storage.state === 'missing_unavailable_blocked'
      ? 'storage_missing_unavailable_blocks_topology_rewrite'
      : readout.storage.state === 'invalid_degraded_setup_required'
        ? 'storage_invalid_degraded_blocks_topology_rewrite'
        : 'storage_not_ready_blocks_topology_rewrite');
  }
  if (readout.budget.state === 'budget_unconfigured') {
    issues.push('budget_unconfigured_blocks_topology_rewrite');
  }
  if (readout.budget.state === 'budget_hard_lock') {
    issues.push('budget_hard_lock_blocks_topology_rewrite');
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
  const supplied = context.projectedSdeTopologyGrowthBytes || input.projectedGrowthBytes || {};
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
    source: supplied === context.projectedSdeTopologyGrowthBytes ? 'trusted_context' : 'fixture_default_or_input',
    projection_is_authorization: false
  };
}

function createTempTables(db) {
  db.exec(`
    CREATE TEMP TABLE temp_hs224_regions (
      region_id INTEGER PRIMARY KEY,
      region_name TEXT NOT NULL
    );
    CREATE TEMP TABLE temp_hs224_constellations (
      constellation_id INTEGER PRIMARY KEY,
      constellation_name TEXT NOT NULL,
      region_id INTEGER,
      region_name TEXT
    );
    CREATE TEMP TABLE temp_hs224_solar_systems (
      solar_system_id INTEGER PRIMARY KEY,
      solar_system_name TEXT NOT NULL,
      constellation_id INTEGER,
      constellation_name TEXT,
      region_id INTEGER,
      region_name TEXT,
      security_status REAL
    );
    CREATE TEMP TABLE temp_hs224_system_adjacency (
      from_system_id INTEGER NOT NULL,
      to_system_id INTEGER NOT NULL,
      connection_type TEXT NOT NULL DEFAULT 'stargate',
      PRIMARY KEY (from_system_id, to_system_id, connection_type)
    );
  `);
}

function insertStagedRows(db, rows) {
  const region = db.prepare('INSERT INTO temp_hs224_regions (region_id, region_name) VALUES (?, ?)');
  const constellation = db.prepare(`
    INSERT INTO temp_hs224_constellations (constellation_id, constellation_name, region_id, region_name)
    VALUES (?, ?, ?, ?)
  `);
  const system = db.prepare(`
    INSERT INTO temp_hs224_solar_systems (
      solar_system_id, solar_system_name, constellation_id, constellation_name,
      region_id, region_name, security_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const adjacency = db.prepare(`
    INSERT INTO temp_hs224_system_adjacency (from_system_id, to_system_id, connection_type)
    VALUES (?, ?, ?)
  `);
  for (const entry of rows.regions) {
    region.run(entry.region_id, entry.region_name);
  }
  for (const entry of rows.constellations) {
    constellation.run(entry.constellation_id, entry.constellation_name, entry.region_id, entry.region_name);
  }
  for (const entry of rows.systems) {
    system.run(
      entry.solar_system_id,
      entry.solar_system_name,
      entry.constellation_id,
      entry.constellation_name,
      entry.region_id,
      entry.region_name,
      entry.security_status
    );
  }
  for (const entry of rows.adjacency) {
    adjacency.run(entry.from_system_id, entry.to_system_id, entry.connection_type || 'stargate');
  }
}

function dropTempTables(db) {
  db.exec(`
    DROP TABLE IF EXISTS temp_hs224_system_adjacency;
    DROP TABLE IF EXISTS temp_hs224_solar_systems;
    DROP TABLE IF EXISTS temp_hs224_constellations;
    DROP TABLE IF EXISTS temp_hs224_regions;
  `);
}

function seedReadyTopologyIfEmpty(db) {
  if (topologyReady(topologyCounts(db))) {
    return;
  }
  runTransaction(db, () => {
    db.prepare('INSERT OR REPLACE INTO regions (region_id, region_name, source_sde_build, imported_at) VALUES (?, ?, ?, ?)')
      .run(10000001, 'Old Region', 'fixture-old', now());
    db.prepare(`
      INSERT OR REPLACE INTO constellations (
        constellation_id, constellation_name, region_id, region_name, source_sde_build, imported_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(20000001, 'Old Constellation', 10000001, 'Old Region', 'fixture-old', now());
    db.prepare(`
      INSERT OR REPLACE INTO solar_systems (
        solar_system_id, solar_system_name, constellation_id, constellation_name,
        region_id, region_name, security_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(30000001, 'Old Atlas Gate', 20000001, 'Old Constellation', 10000001, 'Old Region', 0.5);
    db.prepare(`
      INSERT OR IGNORE INTO system_adjacency (from_system_id, to_system_id, connection_type)
      VALUES (?, ?, ?)
    `).run(30000001, 30000002, 'stargate');
    db.prepare(`
      INSERT OR IGNORE INTO system_adjacency (from_system_id, to_system_id, connection_type)
      VALUES (?, ?, ?)
    `).run(30000002, 30000001, 'stargate');
    db.prepare(`
      INSERT INTO sde_imports (
        build_number, variant, source_url, imported_at, file_checksum,
        systems_count, constellations_count, regions_count, adjacency_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('fixture-old', 'fixture-seed', 'fixture://old-topology', now(), 'fixture-old-checksum', 1, 1, 1, 2);
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

function fixtureTopologyRows(kind) {
  const prefix = kind === 'failure' ? 'Failure' : 'Success';
  return {
    regions: [
      { region_id: 11000001, region_name: `${prefix} Region` }
    ],
    constellations: [
      { constellation_id: 21000001, constellation_name: `${prefix} Constellation`, region_id: 11000001, region_name: `${prefix} Region` }
    ],
    systems: [
      { solar_system_id: 31000001, solar_system_name: `${prefix} Gate`, constellation_id: 21000001, constellation_name: `${prefix} Constellation`, region_id: 11000001, region_name: `${prefix} Region`, security_status: 0.4 },
      { solar_system_id: 31000002, solar_system_name: `${prefix} Edge`, constellation_id: 21000001, constellation_name: `${prefix} Constellation`, region_id: 11000001, region_name: `${prefix} Region`, security_status: 0.3 }
    ],
    adjacency: [
      { from_system_id: 31000001, to_system_id: 31000002, connection_type: 'stargate' },
      { from_system_id: 31000002, to_system_id: 31000001, connection_type: 'stargate' }
    ]
  };
}

function topologyCounts(db) {
  return {
    regions: count(db, 'regions'),
    constellations: count(db, 'constellations'),
    solar_systems: count(db, 'solar_systems'),
    system_adjacency: count(db, 'system_adjacency'),
    sde_imports: count(db, 'sde_imports')
  };
}

function stagedTopologyCounts(db) {
  return {
    regions: count(db, 'temp_hs224_regions'),
    constellations: count(db, 'temp_hs224_constellations'),
    solar_systems: count(db, 'temp_hs224_solar_systems'),
    system_adjacency: count(db, 'temp_hs224_system_adjacency')
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function topologyReady(counts = {}) {
  return counts.regions > 0 &&
    counts.constellations > 0 &&
    counts.solar_systems > 0 &&
    counts.system_adjacency > 0;
}

function sameVisibleTopology(before = {}, after = {}) {
  return before.regions === after.regions &&
    before.constellations === after.constellations &&
    before.solar_systems === after.solar_systems &&
    before.system_adjacency === after.system_adjacency &&
    before.sde_imports === after.sde_imports;
}

function latestTopologyProvenance(db) {
  return db.prepare('SELECT * FROM sde_imports ORDER BY id DESC LIMIT 1').get() || null;
}

function compactProvenance(row) {
  return row ? {
    build_number: row.build_number,
    variant: row.variant,
    source_url: row.source_url,
    systems_count: row.systems_count,
    constellations_count: row.constellations_count,
    regions_count: row.regions_count,
    adjacency_count: row.adjacency_count
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
      path: 'fixture://hs224-atlas.sqlite',
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
    'Fixture/offline topology import rewrite authority proof only.',
    'Renderer source paths are non-authoritative and are ignored.',
    'Trusted local source authority is accepted only from explicit trusted fixture context.',
    'Remote source references are rejected for local topology import; provider-backed download/build remains parked.',
    'Storage and explicit budget posture must allow projected topology rewrite before fixture promotion.',
    'Provenance is inserted only after complete staged promotion.',
    'Failed staged fixture rewrite preserves previous visible topology lookup readiness and requires explicit rerun.',
    'This proof does not mutate real operator lookup tables, inspect real operator source paths, call providers, create support artifacts, activate enforcement, block commands, change schema, or do UI work.'
  ];
}

module.exports = {
  COMMAND,
  buildSdeTopologyImportRewriteAuthorityProof,
  applyFixtureTopologyRewrite,
  sourceAuthorityFor,
  topologyCounts
};
