# Current State: Evidence Pipeline

Date: 2026-05-24

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

The structured corpus health response now includes a compact `partial_success` support status. It uses existing local `fetch_runs`, `discovered_killmail_refs`, `api_request_logs`, and `data_quality_warnings` rows to count failed runs, failed expansions, warning/error summaries, pending and failed queue refs, API error logs, and warning groups. This status is a read-only coverage warning: it does not call live providers, does not create Evidence, and must not be read as complete local evidence coverage when partial indicators are present.

## Current Snapshot Safety

`runtime.db_snapshot.preflight` reports the runtime DB path, destination path, file size, WAL/SHM state, core table counts, latest fetch run, latest evidence timestamp, and assessment artifact counts without writing files.

`runtime.db_snapshot.create` is an explicit exclusive action that writes a SQLite snapshot under the approved project `.tmp` area by default. Verification opens the snapshot and confirms core counts plus raw ESI payload/checksum preservation. Evidence pruning remains blocked.

Runtime DB snapshot destination authority is backend-owned. Atlas can persist a validated snapshot destination directory and snapshot/support-artifact budget through versioned runtime snapshot settings. Invalid persisted destination or budget settings degrade visibly and fall back to the project `.tmp` snapshot location rather than being silently used. Snapshot filenames are generated by backend snapshot logic, and renderer-origin snapshot requests cannot provide arbitrary destination file paths.

Snapshot preflight reports current destination usage, projected snapshot size from the active DB plus journal files, configured budget, remaining budget after the projected write, and any over-budget blocker. Snapshot creation is blocked when projected usage exceeds the configured budget. Atlas does not auto-prune or delete old snapshots/support artifacts to satisfy the budget.

## Current Storage / Runtime Boundary

Persistent SQLite state includes Evidence rows, Discovery queue refs, Watch definitions and schedule timestamps, provider/run provenance, API request logs, ingestion audits, warnings, metadata runs, entities, local SDE lookups, and Assessment Memory.

Volatile runtime state includes task history, task locks, cancellation controllers, Watch executor armed state, active task ID, interval timer, last tick, last dispatch, and last blocked reason. After restart, Atlas must reconstruct operator review state from SQLite rows and support artifacts rather than treating in-memory task/session state as durable.

Support artifacts such as runtime DB snapshots and operator debug trace packs are diagnostics. They are not Evidence, Observation, or Assessment Memory. Trace packs exclude raw expanded ESI payloads by default.

Write boundaries remain command-owned: Discovery queues refs only; Enrich selected writes expanded ESI Evidence; metadata hydration updates readability labels; Assessment creation writes deliberate memory; retention preflight stays read-only; runtime snapshot creation writes a local support artifact without pruning or deleting Evidence.

`app.readiness` exposes a compact `runtime_boundary` support readout for ordinary readiness/status inspection. The same source-owned model is used by operator debug trace packs. It separates durable SQLite state from volatile task/session state, summarizes partial-failure indicators, and classifies snapshots, trace packs, logs, and reports as support/readout artifacts rather than Evidence, Observation, or Assessment Memory.

## Current Retention / Deletion State

Deletion is not an active product capability.

Implemented retention-related behavior is limited to:

- read-only retention preflight
- read-only evidence compaction preview
- explicit assessment artifact creation from validated preview context
- verification that evidence counts and raw killmail payloads are preserved

Blocked/deferred behavior:

- executable evidence pruning
- destructive retention actions
- automatic compaction
- deleting evidence because assessment memory exists

Retention policy clarification:

- explicit user-selected deletion, if implemented later, must delete the selected deletable records
- retained deletion footprint is rejected
- if explicit deletion execution is implemented later, selected deletable active data should be deleted without a retained footprint
- deletion preflight remains read-only and now reports no-footprint policy, rejected footprint fields, affected Evidence row counts, related Assessment Memory references where practical, and snapshot/backup disclosure
- snapshots/backups are separate historical support artifacts and may retain records removed from active storage unless separately deleted
- Assessment Memory is mutable, disposable, and stale after Evidence deletion; it is not Evidence, not hidden retention, and not a deletion blocker

Any future deletion policy work must start with a bounded design/audit packet before Dev implementation.

## Forward Design Input

Runtime, connection, queue, Watch, enrichment, and record-integrity hardening are now identified as a forward-looking audit lane.

Design input and audit questions are captured in:

- `workspace/OverseerHS52-runtime-record-integrity-design-input.md`

That note is directional only. It does not change implemented behavior, accepted deletion policy, schema authority, or Dev scope.
