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
- `actor_watches`
- `system_watches`
- `watchlist_entities`
- `fetch_runs`
- `api_request_logs`
- `ingestion_audits`
- `data_quality_warnings`
- `entities`
- local SDE lookup tables
- `metadata_runs`
- `assessment_artifacts`

## Current Collection Lanes

Routine lanes:

- system radius watch
- actor watch

Manual lane:

- manual discovery queues refs without ESI expansion
- manual expansion explicitly expands queued refs

Assessment lane:

- assessment artifacts are deliberate memory products
- assessment artifacts may cite stored killmails
- citation status is validated or explicitly labelled
- assessment artifacts are not evidence and do not replace raw killmail records

## Current Verification

- `verify:fixture`
- `verify:idempotent`
- `verify:collector`
- `verify:actor-watch`
- `verify:manual-discovery`
- `verify:system-resolution`
- `verify:hydration`
- `verify:queue-report`
- `verify:queue-selection`
- `verify:queue-scope-isolation`
- `verify:retention-preflight`
- `verify:assessment-artifacts`
- `verify:evidence-rules`
- `verify:adversarial-fixtures`
- `verify:metadata-status`
- `verify:corpus-health`
- `verify:db-integrity`
- `verify:scope-controls`
- `verify:controlled-workflow`
- `verify:local-scale-smoke`
- `verify:large-scale`
- `verify:restart-recovery`
- `verify:task-concurrency`
- `verify:all`

`verify:all` currently runs the offline verification set. Live smoke checks are intentionally separate and require `AURA_ATLAS_LIVE_API=1`.

## Current Scope Controls

User-facing scope defaults and validation now live in shared backend helpers.

Current consumers include:

- manual discovery CLI
- manual expansion CLI
- manual discovery renderer action
- live actor watch runner
- live system/radius watch runner
- scoped zKill live smoke harness

This gives CLI, future IPC handlers, and future UI controls a common backend source for defaults and guardrails.

## Current Live Boundary

Live API calls are intentionally gated.

`verify:live-scoped-zkill` refuses to run unless `AURA_ATLAS_LIVE_API=1` is set. The refusal path writes a reviewable artifact under `.tmp/live-scoped-zkill-smoke` and repeats the evidence boundary:

```txt
queued refs and zKill preview fields are discovery/provenance metadata,
not killmail evidence
```

The success path remains explicit live work and should be reviewed from its generated artifact before being treated as an accepted smoke result.

The accepted success-smoke review is recorded in `docs/audits/audit-2026-05-22-live-scoped-discovery-success-smoke-review.md`. The reviewed run used one scoped zKill request for `ZTS-4D`, zero ESI requests, and wrote no evidence rows.

## Current Corpus Health

`report:corpus-health` and `report.corpus_health` provide a read-only local database health report. The report summarizes evidence row counts, queue state, watch/metadata/assessment counts, duplicate/orphan checks, unresolved label checks, warning groups, and freshness of fetch runs, metadata runs, and SDE imports.

The corpus health report is an operational readiness report. It is not an observation report and not an assessment artifact.

## Current Snapshot Safety

`runtime.db_snapshot.preflight` reports the runtime DB path, destination path, file size, WAL/SHM state, core table counts, latest fetch run, latest evidence timestamp, and assessment artifact counts without writing files.

`runtime.db_snapshot.create` is an explicit exclusive action that writes a SQLite snapshot under the approved project `.tmp` area by default. Verification opens the snapshot and confirms core counts plus raw ESI payload/checksum preservation. Evidence pruning remains blocked.
