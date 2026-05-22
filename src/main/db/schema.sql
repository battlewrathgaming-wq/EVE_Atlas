PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS killmails (
  killmail_id INTEGER PRIMARY KEY,
  killmail_hash TEXT NOT NULL,
  killmail_time TEXT NOT NULL,
  solar_system_id INTEGER NOT NULL,
  raw_esi_payload TEXT NOT NULL,
  raw_payload_checksum TEXT NOT NULL,
  source TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  ingested_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_events (
  event_key TEXT PRIMARY KEY,
  killmail_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('attacker', 'victim')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('character', 'corporation', 'alliance')),
  entity_id INTEGER NOT NULL,
  entity_name TEXT,
  character_id INTEGER,
  character_name TEXT,
  corporation_id INTEGER,
  corporation_name TEXT,
  alliance_id INTEGER,
  alliance_name TEXT,
  ship_type_id INTEGER,
  ship_type_name TEXT,
  weapon_type_id INTEGER,
  final_blow INTEGER NOT NULL DEFAULT 0,
  damage_done INTEGER,
  solar_system_id INTEGER NOT NULL,
  solar_system_name TEXT,
  region_id INTEGER,
  region_name TEXT,
  killmail_time TEXT NOT NULL,
  ingested_at TEXT NOT NULL,
  discovered_by_type TEXT,
  discovered_by_id INTEGER,
  normalizer_version TEXT NOT NULL,
  FOREIGN KEY (killmail_id) REFERENCES killmails(killmail_id)
);

CREATE TABLE IF NOT EXISTS system_watches (
  watch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  center_system_id INTEGER NOT NULL,
  center_system_name TEXT NOT NULL,
  radius_jumps INTEGER NOT NULL DEFAULT 1,
  included_system_ids TEXT NOT NULL DEFAULT '[]',
  excluded_system_ids TEXT NOT NULL DEFAULT '[]',
  lookback_hours INTEGER NOT NULL DEFAULT 24,
  max_systems_per_run INTEGER NOT NULL DEFAULT 10,
  max_killmails_per_run INTEGER NOT NULL DEFAULT 50,
  is_active INTEGER NOT NULL DEFAULT 1,
  poll_interval_minutes INTEGER NOT NULL DEFAULT 60,
  last_polled_at TEXT,
  next_poll_at TEXT,
  last_success_at TEXT,
  last_error_at TEXT,
  backoff_until TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS watchlist_entities (
  watch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('character', 'corporation', 'alliance')),
  entity_id INTEGER NOT NULL,
  entity_name TEXT NOT NULL,
  lookback_days INTEGER NOT NULL DEFAULT 30,
  max_killmails_per_run INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1,
  poll_interval_minutes INTEGER NOT NULL DEFAULT 60,
  last_polled_at TEXT,
  next_poll_at TEXT,
  last_success_at TEXT,
  last_error_at TEXT,
  backoff_until TEXT,
  notes TEXT,
  UNIQUE (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS entities (
  entity_type TEXT NOT NULL CHECK (entity_type IN ('character', 'corporation', 'alliance')),
  entity_id INTEGER NOT NULL,
  entity_name TEXT,
  current_corporation_id INTEGER,
  current_corporation_name TEXT,
  current_alliance_id INTEGER,
  current_alliance_name TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  last_enriched_at TEXT,
  PRIMARY KEY (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS solar_systems (
  solar_system_id INTEGER PRIMARY KEY,
  solar_system_name TEXT NOT NULL,
  constellation_id INTEGER,
  constellation_name TEXT,
  region_id INTEGER,
  region_name TEXT,
  security_status REAL
);

CREATE TABLE IF NOT EXISTS regions (
  region_id INTEGER PRIMARY KEY,
  region_name TEXT NOT NULL,
  source_sde_build TEXT,
  imported_at TEXT
);

CREATE TABLE IF NOT EXISTS constellations (
  constellation_id INTEGER PRIMARY KEY,
  constellation_name TEXT NOT NULL,
  region_id INTEGER,
  region_name TEXT,
  source_sde_build TEXT,
  imported_at TEXT,
  FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

CREATE TABLE IF NOT EXISTS system_adjacency (
  from_system_id INTEGER NOT NULL,
  to_system_id INTEGER NOT NULL,
  connection_type TEXT NOT NULL DEFAULT 'stargate',
  PRIMARY KEY (from_system_id, to_system_id, connection_type)
);

CREATE TABLE IF NOT EXISTS sde_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_number TEXT,
  variant TEXT NOT NULL,
  source_url TEXT,
  etag TEXT,
  last_modified TEXT,
  imported_at TEXT NOT NULL,
  file_checksum TEXT,
  latest_metadata_checksum TEXT,
  changes_metadata_checksum TEXT,
  systems_count INTEGER NOT NULL DEFAULT 0,
  constellations_count INTEGER NOT NULL DEFAULT 0,
  regions_count INTEGER NOT NULL DEFAULT 0,
  adjacency_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS type_metadata (
  type_id INTEGER PRIMARY KEY,
  type_name TEXT,
  group_id INTEGER,
  group_name TEXT,
  category_id INTEGER,
  category_name TEXT,
  last_fetched TEXT
);

CREATE TABLE IF NOT EXISTS sde_inventory_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_number TEXT,
  variant TEXT NOT NULL,
  source_url TEXT,
  imported_at TEXT NOT NULL,
  file_checksum TEXT,
  categories_count INTEGER NOT NULL DEFAULT 0,
  groups_count INTEGER NOT NULL DEFAULT 0,
  types_count INTEGER NOT NULL DEFAULT 0,
  type_metadata_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS entity_dispositions (
  entity_type TEXT NOT NULL CHECK (entity_type IN ('character', 'corporation', 'alliance')),
  entity_id INTEGER NOT NULL,
  entity_name TEXT,
  disposition TEXT NOT NULL CHECK (disposition IN ('friendly', 'neutral', 'hostile', 'ignored')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS fetch_runs (
  run_id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  watch_type TEXT NOT NULL,
  watch_id TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  discovered_refs INTEGER NOT NULL DEFAULT 0,
  already_cached INTEGER NOT NULL DEFAULT 0,
  expanded_new INTEGER NOT NULL DEFAULT 0,
  failed_expansions INTEGER NOT NULL DEFAULT 0,
  activity_events_written INTEGER NOT NULL DEFAULT 0,
  api_calls_zkill INTEGER NOT NULL DEFAULT 0,
  api_calls_esi INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  error_summary TEXT
);

CREATE TABLE IF NOT EXISTS metadata_runs (
  run_id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  run_type TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  candidates_considered INTEGER NOT NULL DEFAULT 0,
  ids_discovered INTEGER NOT NULL DEFAULT 0,
  already_known INTEGER NOT NULL DEFAULT 0,
  requested_from_esi INTEGER NOT NULL DEFAULT 0,
  resolved INTEGER NOT NULL DEFAULT 0,
  unresolved INTEGER NOT NULL DEFAULT 0,
  entities_upserted INTEGER NOT NULL DEFAULT 0,
  types_upserted INTEGER NOT NULL DEFAULT 0,
  activity_events_patched INTEGER NOT NULL DEFAULT 0,
  api_calls_esi INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  warning_summary TEXT,
  error_summary TEXT
);

CREATE TABLE IF NOT EXISTS discovered_killmail_refs (
  killmail_id INTEGER NOT NULL,
  killmail_hash TEXT NOT NULL,
  discovered_by_type TEXT NOT NULL,
  discovered_by_id TEXT NOT NULL,
  source_scope TEXT,
  source_system_id INTEGER,
  source_actor_type TEXT,
  source_actor_id INTEGER,
  discovered_at TEXT NOT NULL,
  first_seen_run_id TEXT,
  last_seen_run_id TEXT,
  last_seen_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'expanded', 'cached', 'failed', 'superseded')),
  selected_for_expansion_at TEXT,
  expanded_at TEXT,
  failed_at TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  preview_json TEXT,
  PRIMARY KEY (killmail_id, killmail_hash, discovered_by_type, discovered_by_id)
);

CREATE TABLE IF NOT EXISTS api_request_logs (
  request_id TEXT PRIMARY KEY,
  run_id TEXT,
  run_type TEXT NOT NULL DEFAULT 'collection' CHECK (run_type IN ('collection', 'metadata', 'unscoped')),
  provider TEXT NOT NULL CHECK (provider IN ('zkill', 'esi')),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  cache_status TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  rate_limited INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  requested_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingestion_audits (
  run_id TEXT NOT NULL,
  killmail_id INTEGER NOT NULL,
  raw_payload_checksum TEXT NOT NULL,
  normalized_event_count INTEGER NOT NULL,
  attacker_count INTEGER NOT NULL,
  victim_present INTEGER NOT NULL,
  warnings TEXT NOT NULL DEFAULT '[]',
  normalizer_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (run_id, killmail_id),
  FOREIGN KEY (run_id) REFERENCES fetch_runs(run_id),
  FOREIGN KEY (killmail_id) REFERENCES killmails(killmail_id)
);

CREATE TABLE IF NOT EXISTS data_quality_warnings (
  warning_id TEXT PRIMARY KEY,
  run_id TEXT,
  killmail_id INTEGER,
  warning_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES fetch_runs(run_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_events_killmail_time ON activity_events(killmail_time);
CREATE INDEX IF NOT EXISTS idx_activity_events_entity ON activity_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_system ON activity_events(solar_system_id);
CREATE INDEX IF NOT EXISTS idx_killmails_time ON killmails(killmail_time);
CREATE INDEX IF NOT EXISTS idx_solar_systems_region ON solar_systems(region_id);
CREATE INDEX IF NOT EXISTS idx_solar_systems_constellation ON solar_systems(constellation_id);
CREATE INDEX IF NOT EXISTS idx_constellations_region ON constellations(region_id);
CREATE INDEX IF NOT EXISTS idx_type_metadata_category ON type_metadata(category_name);
CREATE INDEX IF NOT EXISTS idx_type_metadata_group ON type_metadata(group_id);
CREATE INDEX IF NOT EXISTS idx_type_metadata_type_name ON type_metadata(type_name);
CREATE INDEX IF NOT EXISTS idx_discovered_refs_status_scope ON discovered_killmail_refs(status, discovered_by_type, discovered_by_id);
CREATE INDEX IF NOT EXISTS idx_discovered_refs_actor ON discovered_killmail_refs(source_actor_type, source_actor_id);
CREATE INDEX IF NOT EXISTS idx_discovered_refs_system ON discovered_killmail_refs(source_system_id);

CREATE VIEW IF NOT EXISTS ship_types AS
SELECT *
FROM type_metadata
WHERE category_name = 'Ship';
