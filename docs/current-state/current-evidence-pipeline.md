# Current State: Evidence Pipeline

Date: 2026-05-22

## What Exists

AURA Atlas currently supports the core evidence pipeline:

```txt
zKill discovery refs
-> ESI expanded killmail
-> killmails
-> activity_events
-> reports
```

The expanded ESI killmail is the durable evidence record. zKill is discovery only.

## Current Storage

Implemented storage includes:

- `killmails`
- `activity_events`
- `discovered_killmail_refs`
- `fetch_runs`
- `api_request_logs`
- `ingestion_audits`
- `data_quality_warnings`
- `entities`
- local SDE lookup tables
- `metadata_runs`

## Current Collection Lanes

Routine lanes:

- system radius watch
- actor watch

Manual lane:

- manual discovery queues refs without ESI expansion
- manual expansion explicitly expands queued refs

## Current Verification

- `verify:fixture`
- `verify:idempotent`
- `verify:collector`
- `verify:actor-watch`
- `verify:manual-discovery`
- `verify:db-integrity`

