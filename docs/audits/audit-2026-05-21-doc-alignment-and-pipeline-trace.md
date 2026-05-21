# Audit: Documentation Alignment And Pipeline Trace

Date: 2026-05-21
Scope: Current PoC alignment with AURA Atlas tenets after evidence pipeline, SDE topology, live radius smoke, metadata hydration, and first read-side reports.

## Current Behavior

AURA Atlas currently follows the intended evidence-first pipeline:

```txt
zKill discovery refs
-> ESI expanded killmail
-> killmails evidence table
-> activity_events normalization
-> local metadata lookup/hydration
-> CLI reports
```

The strongest alignment points are:

- zKill is used for discovery refs rather than tactical truth.
- Expanded ESI killmails are stored in `killmails.raw_esi_payload`.
- Activity reports are derived from `killmails` and `activity_events`.
- SDE topology and inventory metadata are imported into SQLite lookup tables.
- Runtime reports query SQLite lookup tables rather than parsing the SDE zip.
- IDs remain the durable keys; reports display names as labels with IDs.
- Live API scripts are gated by `AURA_ATLAS_LIVE_API=1`.
- Radius reporting now separates evidence scope from collection provenance.
- System radius collection now returns a run-local expansion queue with selected/skipped candidates and skip reasons.

## Pipeline / Flow

Collection flow:

1. Planner computes system scope from local SDE topology.
2. zKill discovery requests fetch refs containing `killmail_id` and `zkb.hash`.
3. Refs are deduped by killmail ID.
4. Already-cached killmails are skipped before expansion.
5. A global expansion cap is applied to remaining uncached refs.
6. A run-local expansion queue records selected and skipped candidates.
7. ESI expanded killmails are fetched for selected candidates.
8. Killmail evidence and activity events are persisted transactionally.
9. Fetch runs, API logs, ingestion audits, and warnings are written.

Read-side flow:

1. Reports resolve scope using local IDs/topology.
2. Reports query `killmails`, `activity_events`, `solar_systems`, `regions`, `constellations`, `system_adjacency`, `entities`, and `type_metadata`.
3. Reports display labels through metadata joins while preserving IDs.
4. Provenance is shown through `fetch_runs`, `metadata_runs`, and `api_request_logs`.

## Alignment Findings

### Aligned: Evidence Pipeline

The normalizer stores raw ESI payloads, checksums, normalized events, audits, and warnings. Activity events are keyed by:

```txt
killmail_id:role:entity_type:entity_id
```

This matches the `activity-event` schema document and keeps character, corporation, and alliance appearances rebuildable from stored evidence.

### Aligned: Local SDE Lookup

SDE geography and inventory metadata are imported into local SQLite tables. Runtime report checks verify that report files do not import SDE zip/importer modules.

### Aligned: Radius Report Scope

`report:radius` now filters intelligence sections by included systems plus evidence time window. Collection run data appears as provenance. This matches the tenet:

> Evidence scope drives intelligence reports. Collection provenance explains how evidence entered the corpus.

### Aligned: Staged Collection And Expansion Queue

System radius collection now exposes a collection plan summary and expansion queue in run output.

The queue records durable explanation fields such as `killmail_id`, `hash`, `source_system_id`, `priority`, `already_cached`, `selected_for_expansion`, and `skip_reason`.

Current verified skip reasons include:

- `cached`
- `duplicate`
- `cap_skipped`
- `malformed`

`failed` remains represented in expansion failure counts and should be added to queue rows when failure-level queue reporting is implemented.

## Outliers

### Outlier 1: Killmail Upsert Can Mutate Raw Evidence

Severity: High

Status: Fixed on 2026-05-21. See `docs/failures/failure-0002-raw-killmail-upsert-mutation.md`.

Earlier code used `ON CONFLICT(killmail_id) DO UPDATE` for `killmails`, including:

- `killmail_hash`
- `killmail_time`
- `solar_system_id`
- `raw_esi_payload`
- `raw_payload_checksum`

This conflicted with the immutable evidence tenet and the rule to store expanded ESI killmails once. Rediscovery should normally update provenance such as `last_seen_at`, not rewrite the original evidence payload.

Implemented cleanup:

- Killmail conflict behavior preserves existing raw payload/checksum.
- Rediscovery updates only `last_seen_at`.
- If a different payload/checksum appears for the same `killmail_id`, a `KILLMAIL_PAYLOAD_CHECKSUM_MISMATCH` warning is written.
- `verify:idempotent` proves raw payload immutability.

Related file:

- `src/main/db/evidenceRepository.js`

### Outlier 2: System And Operator Reports Still Mix Scope With Provenance

Severity: Medium

Status: Fixed on 2026-05-21.

Earlier `report:system` and `report:operators` inferred report status and wording primarily from zKill request logs matching the system route. Their intelligence sections queried stored evidence by system, but their headers and footers described "latest matching run" and discovery windows as if collection provenance defined the report basis.

Implemented cleanup:

- Both reports now accept explicit evidence-window handling like `report:radius`.
- Stored evidence counts are stated first.
- zKill/API/run counts are moved into collection provenance language.
- Phrases like "from refs discovered in latest matching run" were removed from intelligence report basis text.

Related files:

- `src/main/reports/systemReport.js`
- `src/main/reports/operatorReport.js`

### Outlier 3: Metadata Hydration Uses Fetch Run Counters For Non-Fetch Semantics

Severity: Medium

Status: Fixed on 2026-05-21. See `docs/schemas/metadata-run.md`.

Earlier metadata hydration recorded a `fetch_runs` row with `watch_type = metadata_hydration`, but mapped metadata concepts onto collection fields:

- `discovered_refs` = IDs discovered
- `already_cached` = already known IDs
- `expanded_new` = resolved names
- `failed_expansions` = unresolved names
- `activity_events_written` = display-name patch count

This was useful for immediate traceability, but the field names were semantically misleading and could confuse audit/reporting later.

Implemented cleanup:

- Added a dedicated `metadata_runs` table.
- Report candidate hydration writes metadata-specific counters to `metadata_runs`.
- API request logs link by shared trace `run_id` and identify whether that trace belongs to `collection`, `metadata`, or `unscoped` work through `run_type`.
- `fetch_runs` is reserved for evidence collection runs.
- `verify:hydration` proves hydration does not create a `fetch_runs` row.

Related file:

- `src/main/metadata/reportHydrator.js`

### Outlier 4: Entity Hydration Can Hydrate Inventory Types From Live ESI

Severity: Low / Medium

Status: Fixed on 2026-05-21.

Earlier metadata hydration collected `ship_type_id` values and could resolve unknown inventory types through ESI `/universe/names/`. This did not mutate evidence IDs, but it weakened the "local SDE first for static metadata" doctrine if SDE inventory import had not been run.

Implemented cleanup:

- Report-scoped hydration no longer collects `ship_type_id` for live ESI name resolution.
- Inventory type responses from live ESI are ignored by the report hydrator.
- Ship/type labels remain sourced from local SDE `type_metadata`.
- `verify:hydration` fails if fixture ship type IDs are sent to live-name resolution.

Related file:

- `src/main/metadata/reportHydrator.js`

### Outlier 5: Display Names Are Patched Onto Activity Events

Severity: Low

Hydration patches nullable display-name columns on `activity_events`. This is allowed by the current schema docs, but it is close to the evidence boundary and should remain carefully framed as cached display metadata.

Recommended cleanup:

- Keep ID columns immutable.
- Continue patching only null label fields.
- Consider moving display labels fully to metadata joins later if evidence-table purity becomes more important.

Related file:

- `src/main/metadata/reportHydrator.js`

## Known Gaps

- Actor watch collection has not been implemented yet.
- UI is intentionally deferred.
- `report:system`, `report:operators`, and `report:radius` now share the evidence-scope/provenance reporting model.
- Metadata hydration now has a dedicated `metadata_runs` table.
- Raw killmail immutability is now enforced for repository upserts; future schema migrations should preserve this invariant.

## Risks

- Future persistence changes that reintroduce silent raw evidence replacement would damage audit confidence.
- Reports that foreground collection routes could make intelligence scope feel narrower or more complete than the stored evidence supports.
- Future metadata operations should use `metadata_runs` or a similarly explicit enrichment-run table rather than `fetch_runs`.
- Live metadata hydration for inventory type names could bypass the SDE-first static metadata strategy.

## Verification

Current verification supporting this audit:

- `npm.cmd run verify:fixture`
- `npm.cmd run verify:idempotent`
- `npm.cmd run verify:sde-fixture`
- `npm.cmd run verify:sde-real-local`
- `npm.cmd run verify:sde-inventory`
- `npm.cmd run verify:radius`
- `npm.cmd run verify:planner`
- `npm.cmd run verify:collector`
- `npm.cmd run verify:reports`
- `npm.cmd run verify:operators`
- `npm.cmd run verify:radius-report`
- `npm.cmd run verify:hydration`
- `npm.cmd run verify:metadata-lookup`

## Related Files

- `docs/tenets/tenets.md`
- `docs/schemas/killmail-evidence.md`
- `docs/schemas/activity-event.md`
- `src/main/db/evidenceRepository.js`
- `src/main/normalization/killmailNormalizer.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/reports/radiusReport.js`
- `src/main/reports/systemReport.js`
- `src/main/reports/operatorReport.js`
- `src/main/metadata/reportHydrator.js`
