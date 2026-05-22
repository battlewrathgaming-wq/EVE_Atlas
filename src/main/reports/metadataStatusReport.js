const { printSection, table } = require('./reportUtils');

function buildMetadataStatusReport(db) {
  const topology = latestRow(db, 'sde_imports');
  const inventory = latestRow(db, 'sde_inventory_imports');
  const counts = tableCounts(db);
  const entityRows = entityCounts(db);
  const recentMetadataRuns = db.prepare(`
    SELECT run_id, run_type, target_type, target_id, status, started_at, finished_at,
           ids_discovered, already_known, requested_from_esi, resolved, unresolved,
           entities_upserted, activity_events_patched, api_calls_esi
    FROM metadata_runs
    ORDER BY started_at DESC
    LIMIT 5
  `).all();

  return [
    'AURA Atlas Metadata Status',
    'Classification: shared universe and entity metadata readiness; not evidence.',
    printSection('Shared Universe Lookup', [
      `Topology imported: ${topology ? 'yes' : 'no'}`,
      `Topology build: ${topology?.build_number || 'unknown'}`,
      `Topology source: ${topology?.source_url || 'none'}`,
      `Topology imported at: ${topology?.imported_at || 'none'}`,
      `Topology file checksum: ${topology?.file_checksum || 'none'}`,
      `Inventory imported: ${inventory ? 'yes' : 'no'}`,
      `Inventory build: ${inventory?.build_number || 'unknown'}`,
      `Inventory source: ${inventory?.source_url || 'none'}`,
      `Inventory imported at: ${inventory?.imported_at || 'none'}`,
      `Inventory file checksum: ${inventory?.file_checksum || 'none'}`
    ].join('\n')),
    printSection('Lookup Table Counts', table(counts, [
      { label: 'Table', value: (row) => row.table },
      { label: 'Rows', value: (row) => row.rows },
      { label: 'Expected Role', value: (row) => row.role }
    ])),
    printSection('Entity Metadata Counts', table(entityRows, [
      { label: 'Entity Type', value: (row) => row.entity_type },
      { label: 'Rows', value: (row) => row.count },
      { label: 'Named Rows', value: (row) => row.named_count },
      { label: 'Last Enriched', value: (row) => row.last_enriched_at || 'none' }
    ])),
    printSection('Recent Metadata Runs', table(recentMetadataRuns, [
      { label: 'Run', value: (row) => row.run_id },
      { label: 'Type', value: (row) => row.run_type },
      { label: 'Target', value: (row) => `${row.target_type || 'unknown'}:${row.target_id || 'unknown'}` },
      { label: 'Status', value: (row) => row.status },
      { label: 'ESI', value: (row) => row.api_calls_esi },
      { label: 'Resolved', value: (row) => row.resolved },
      { label: 'Patched Events', value: (row) => row.activity_events_patched }
    ])),
    printSection('Readiness', readinessLines(topology, inventory, counts).join('\n'))
  ].join('\n');
}

function latestRow(db, tableName) {
  return db.prepare(`
    SELECT *
    FROM ${tableName}
    ORDER BY id DESC
    LIMIT 1
  `).get();
}

function tableCounts(db) {
  return [
    { table: 'regions', rows: count(db, 'regions'), role: 'shared geography lookup' },
    { table: 'constellations', rows: count(db, 'constellations'), role: 'shared geography lookup' },
    { table: 'solar_systems', rows: count(db, 'solar_systems'), role: 'shared system lookup' },
    { table: 'system_adjacency', rows: count(db, 'system_adjacency'), role: 'shared topology lookup' },
    { table: 'type_metadata', rows: count(db, 'type_metadata'), role: 'shared inventory/type lookup' },
    { table: 'entities', rows: count(db, 'entities'), role: 'shared actor label cache' },
    { table: 'metadata_runs', rows: count(db, 'metadata_runs'), role: 'metadata audit trail' }
  ];
}

function entityCounts(db) {
  return db.prepare(`
    SELECT entity_type,
           COUNT(*) AS count,
           SUM(CASE WHEN entity_name IS NOT NULL THEN 1 ELSE 0 END) AS named_count,
           MAX(last_enriched_at) AS last_enriched_at
    FROM entities
    GROUP BY entity_type
    ORDER BY entity_type
  `).all();
}

function readinessLines(topology, inventory, counts) {
  const byTable = new Map(counts.map((row) => [row.table, row.rows]));
  const lines = [];
  const topologyReady = topology &&
    byTable.get('regions') > 0 &&
    byTable.get('constellations') > 0 &&
    byTable.get('solar_systems') > 0 &&
    byTable.get('system_adjacency') > 0;
  const inventoryReady = inventory && byTable.get('type_metadata') > 0;

  lines.push(`Topology lookup ready: ${topologyReady ? 'yes' : 'no'}`);
  lines.push(`Inventory/type lookup ready: ${inventoryReady ? 'yes' : 'no'}`);
  lines.push('Static SDE metadata is shared by all actor, corporation, alliance, system, and radius reports.');
  lines.push('SDE zip files are import material only; runtime reports should use SQLite lookup tables.');
  lines.push('SDE sync/compare/update is a backlog feature; current updates are manual/import-driven.');
  lines.push('Entity names are hydrated labels, not evidence facts.');
  return lines;
}

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

module.exports = {
  buildMetadataStatusReport
};
