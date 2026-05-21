# AURA Atlas

Evidence-based capsuleer intelligence.

AURA Atlas is a local-first Electron proof of concept for EVE Online intelligence. It treats zKillboard as discovery only and expanded ESI killmails as the durable source of truth.

## Milestone 1

The current foundation proves the evidence pipeline:

- SQLite schema for killmails, normalized activity events, fetch runs, audits, and API logs.
- zKill discovery utility that extracts only `killmail_id` and `zkb.hash`.
- ESI utility for killmail expansion and ID/name lookup.
- Killmail normalizer that produces activity events from expanded ESI payloads.
- Fixture ingestion and idempotent re-run verification scripts.

## Verification

```powershell
npm run verify:fixture
npm run verify:idempotent
```

The verification scripts use `node:sqlite`, so they do not require installing a SQLite package.

## Standing Storage Rule

AURA Atlas build, test, download, extraction, cache, temp DB, and fixture work should stay under:

```text
F:\Projects\AURA-Atlas
```

Preferred scratch root:

```text
F:\Projects\AURA-Atlas\.tmp
```

Development overrides:

```powershell
$env:AURA_ATLAS_TEST_TMP="F:\Projects\AURA-Atlas\.tmp"
$env:AURA_ATLAS_DB_PATH="F:\Projects\AURA-Atlas\.tmp\aura-atlas-dev.sqlite"
$env:AURA_ATLAS_CACHE_DIR="F:\Projects\AURA-Atlas\.tmp\cache"
$env:AURA_ATLAS_SDE_CACHE_DIR="F:\Projects\AURA-Atlas\.tmp\sde"
```

Use the Windows-native dev launcher to set these automatically:

```powershell
npm run dev
```

## Event Model

`activity_events` records one entity appearance per killmail, role, entity type, and entity ID:

```text
killmail_id:role:entity_type:entity_id
```

This means corporation/alliance appearances are deduped per killmail role. Character attacker/victim rows preserve event-time corporation and alliance IDs, so later analysis can count how many pilots from a corporation appeared without duplicating corporation rows during ingestion.

## Current Slice

Milestone 2 topology foundation now includes:

- runtime DB initialization and repeatable migrations
- fixture-based SDE JSONL topology import
- SDE import provenance
- bidirectional stargate adjacency
- cycle-safe BFS radius calculation
- dry-run system-radius watch planning

Planner verification is offline and produces planned zKill discovery routes only. It makes no API calls.

## Live-Gated Collection

System-radius live collection is available only when explicitly enabled:

```powershell
$env:AURA_ATLAS_LIVE_API="1"
$env:AURA_ATLAS_LIVE_CENTER_SYSTEM_ID="30000001"
```

If the runtime DB does not already contain SDE topology for the target system, provide a local JSONL SDE directory or zip:

```powershell
$env:AURA_ATLAS_LIVE_SDE_JSONL_PATH="F:\Projects\AURA-Atlas\.tmp\sde\eve-online-static-data-jsonl"
```

Conservative defaults:

- radius: `0`
- lookback: `3600` seconds
- max systems: `1`
- max refs per system: `2`
- max ESI expansions: `2`

Live scripts:

```powershell
npm run verify:system-watch-live
npm run verify:system-watch-idempotent-live
```

Both scripts refuse to run unless `AURA_ATLAS_LIVE_API=1`.

Offline collector verification is also available:

```powershell
npm run verify:collector
```

It uses fake zKill/ESI clients to prove global ref dedupe, cached killmail skipping, ESI expansion flow, persistence, and idempotent rerun behavior without network access.
