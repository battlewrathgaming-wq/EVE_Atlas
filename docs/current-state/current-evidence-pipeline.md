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
- `verify:scope-controls`
- `verify:controlled-workflow`
- `verify:all`

`verify:all` currently runs the offline verification set. Live smoke checks are intentionally separate and require `AURA_ATLAS_LIVE_API=1`.

## Current Scope Controls

User-facing scope defaults and validation now live in shared backend helpers.

Current consumers include:

- manual discovery CLI
- manual expansion CLI
- live actor watch runner
- live system/radius watch runner

This gives CLI, future IPC handlers, and future UI controls a common backend source for defaults and guardrails.
