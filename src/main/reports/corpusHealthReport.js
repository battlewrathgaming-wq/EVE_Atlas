const { printSection, table } = require('./reportUtils');

function buildCorpusHealthReportModel(db) {
  const generatedAt = new Date().toISOString();
  const counts = coreCounts(db);
  const integrity = integrityChecks(db);
  const freshness = freshnessChecks(db);
  const warningRows = warningsByType(db);

  return {
    report_type: 'corpus_health',
    generated_at: generatedAt,
    classification: 'read-only local evidence corpus health; not observation and not assessment',
    counts,
    integrity,
    warning_rows: warningRows,
    freshness,
    boundaries: [
      'This report reads local SQLite tables only.',
      'It does not parse SDE zip files.',
      'It does not call zKill or ESI.',
      'It does not infer assessment or operator intent.'
    ]
  };
}

function renderCorpusHealthReport(model) {
  return [
    'AURA Atlas Evidence Corpus Health',
    `Classification: ${model.classification}`,
    printSection('Core Row Counts', table(model.counts, [
      { label: 'Area', value: (row) => row.area },
      { label: 'Rows', value: (row) => row.rows },
      { label: 'Role', value: (row) => row.role }
    ])),
    printSection('Integrity Checks', table(model.integrity, [
      { label: 'Check', value: (row) => row.check },
      { label: 'Count', value: (row) => row.count },
      { label: 'Status', value: (row) => row.status }
    ])),
    printSection('Data Quality Warnings', table(model.warning_rows, [
      { label: 'Warning Type', value: (row) => row.warning_type },
      { label: 'Count', value: (row) => row.count },
      { label: 'Latest', value: (row) => row.latest || 'none' }
    ])),
    printSection('Operational Freshness', [
      `Latest fetch run: ${model.freshness.latest_fetch_run?.run_id || 'none'}`,
      `Latest fetch status: ${model.freshness.latest_fetch_run?.status || 'none'}`,
      `Latest fetch finished: ${model.freshness.latest_fetch_run?.finished_at || 'none'}`,
      `Latest evidence timestamp: ${model.freshness.latest_evidence_time || 'none'}`,
      `Latest metadata run: ${model.freshness.latest_metadata_run?.run_id || 'none'}`,
      `Latest metadata finished: ${model.freshness.latest_metadata_run?.finished_at || 'none'}`,
      `Latest topology build: ${model.freshness.latest_sde_topology?.build_number || 'none'}`,
      `Latest topology imported: ${model.freshness.latest_sde_topology?.imported_at || 'none'}`,
      `Latest inventory build: ${model.freshness.latest_sde_inventory?.build_number || 'none'}`,
      `Latest inventory imported: ${model.freshness.latest_sde_inventory?.imported_at || 'none'}`
    ].join('\n')),
    printSection('Boundaries', model.boundaries.join('\n'))
  ].join('\n');
}

function buildCorpusHealthReport(db) {
  return renderCorpusHealthReport(buildCorpusHealthReportModel(db));
}

function coreCounts(db) {
  return [
    { area: 'killmails', rows: count(db, 'killmails'), role: 'expanded ESI evidence vault' },
    { area: 'activity_events', rows: count(db, 'activity_events'), role: 'normalized evidence appearances' },
    { area: 'discovered_killmail_refs', rows: count(db, 'discovered_killmail_refs'), role: 'possible evidence queue/provenance' },
    { area: 'watchlist_entities', rows: count(db, 'watchlist_entities'), role: 'actor watch intent metadata' },
    { area: 'system_watches', rows: count(db, 'system_watches'), role: 'system/radius watch intent metadata' },
    { area: 'entities', rows: count(db, 'entities'), role: 'actor label metadata' },
    { area: 'solar_systems', rows: count(db, 'solar_systems'), role: 'system lookup metadata' },
    { area: 'type_metadata', rows: count(db, 'type_metadata'), role: 'static inventory/type metadata' },
    { area: 'assessment_artifacts', rows: count(db, 'assessment_artifacts'), role: 'deliberate assessment memory' },
    { area: 'data_quality_warnings', rows: count(db, 'data_quality_warnings'), role: 'ingestion/quality warnings' },
    { area: 'fetch_runs', rows: count(db, 'fetch_runs'), role: 'collection provenance' },
    { area: 'metadata_runs', rows: count(db, 'metadata_runs'), role: 'metadata provenance' },
    { area: 'api_request_logs', rows: count(db, 'api_request_logs'), role: 'external API audit trail' },
    { area: 'ingestion_audits', rows: count(db, 'ingestion_audits'), role: 'killmail normalization audit trail' }
  ];
}

function integrityChecks(db) {
  return [
    {
      check: 'duplicate activity event keys',
      count: scalar(db, `
        SELECT COUNT(*) FROM (
          SELECT event_key
          FROM activity_events
          GROUP BY event_key
          HAVING COUNT(*) > 1
        )
      `),
      badWhenPositive: true
    },
    {
      check: 'orphan activity events without killmail',
      count: scalar(db, `
        SELECT COUNT(*)
        FROM activity_events ae
        LEFT JOIN killmails km ON km.killmail_id = ae.killmail_id
        WHERE km.killmail_id IS NULL
      `),
      badWhenPositive: true
    },
    {
      check: 'queued refs already expanded',
      count: scalar(db, `
        SELECT COUNT(*)
        FROM discovered_killmail_refs
        WHERE status = 'expanded'
      `),
      badWhenPositive: false
    },
    {
      check: 'queued refs pending expansion',
      count: scalar(db, `
        SELECT COUNT(*)
        FROM discovered_killmail_refs
        WHERE status = 'pending'
      `),
      badWhenPositive: false
    },
    {
      check: 'unresolved activity entity labels',
      count: scalar(db, `
        SELECT COUNT(*)
        FROM activity_events
        WHERE entity_name IS NULL
      `),
      badWhenPositive: false
    },
    {
      check: 'unresolved cached entity labels',
      count: scalar(db, `
        SELECT COUNT(*)
        FROM entities
        WHERE entity_name IS NULL
      `),
      badWhenPositive: false
    },
    {
      check: 'unresolved ship type labels',
      count: scalar(db, `
        SELECT COUNT(DISTINCT ae.ship_type_id)
        FROM activity_events ae
        LEFT JOIN type_metadata tm ON tm.type_id = ae.ship_type_id
        WHERE ae.ship_type_id IS NOT NULL
          AND (tm.type_id IS NULL OR tm.type_name IS NULL)
      `),
      badWhenPositive: false
    },
    {
      check: 'unresolved weapon type labels',
      count: scalar(db, `
        SELECT COUNT(DISTINCT ae.weapon_type_id)
        FROM activity_events ae
        LEFT JOIN type_metadata tm ON tm.type_id = ae.weapon_type_id
        WHERE ae.weapon_type_id IS NOT NULL
          AND (tm.type_id IS NULL OR tm.type_name IS NULL)
      `),
      badWhenPositive: false
    },
    {
      check: 'killmails missing system metadata',
      count: scalar(db, `
        SELECT COUNT(*)
        FROM killmails km
        LEFT JOIN solar_systems ss ON ss.solar_system_id = km.solar_system_id
        WHERE ss.solar_system_id IS NULL
      `),
      badWhenPositive: false
    },
    {
      check: 'activity events missing system metadata',
      count: scalar(db, `
        SELECT COUNT(*)
        FROM activity_events ae
        LEFT JOIN solar_systems ss ON ss.solar_system_id = ae.solar_system_id
        WHERE ss.solar_system_id IS NULL
      `),
      badWhenPositive: false
    }
  ].map((row) => ({
    check: row.check,
    count: row.count,
    status: row.badWhenPositive && row.count > 0 ? 'attention' : 'ok'
  }));
}

function warningsByType(db) {
  return db.prepare(`
    SELECT warning_type, COUNT(*) AS count, MAX(created_at) AS latest
    FROM data_quality_warnings
    GROUP BY warning_type
    ORDER BY count DESC, warning_type
  `).all();
}

function freshnessChecks(db) {
  return {
    latest_fetch_run: db.prepare(`
      SELECT run_id, watch_type, status, started_at, finished_at
      FROM fetch_runs
      ORDER BY started_at DESC
      LIMIT 1
    `).get() || null,
    latest_evidence_time: scalar(db, 'SELECT MAX(killmail_time) FROM killmails'),
    latest_metadata_run: db.prepare(`
      SELECT run_id, run_type, status, started_at, finished_at
      FROM metadata_runs
      ORDER BY started_at DESC
      LIMIT 1
    `).get() || null,
    latest_sde_topology: db.prepare(`
      SELECT build_number, imported_at, systems_count, adjacency_count
      FROM sde_imports
      ORDER BY imported_at DESC
      LIMIT 1
    `).get() || null,
    latest_sde_inventory: db.prepare(`
      SELECT build_number, imported_at, type_metadata_count
      FROM sde_inventory_imports
      ORDER BY imported_at DESC
      LIMIT 1
    `).get() || null
  };
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function scalar(db, sql) {
  const row = db.prepare(sql).get();
  if (!row) {
    return null;
  }
  return Object.values(row)[0];
}

module.exports = {
  buildCorpusHealthReport,
  buildCorpusHealthReportModel,
  renderCorpusHealthReport
};
