# DevHS59 - Storage / Runtime Read-Write Boundary

Date: 2026-05-25
Executor: Dev
Milestone: HS59 Storage / Runtime Read-Write Boundary

## Boundary Map

### Persistent State

SQLite state that survives restart:

- `killmails`: expanded ESI killmail Evidence, raw ESI payload, checksum, first/last seen timestamps.
- `activity_events`: Atlas-derived Evidence events from expanded killmails.
- `discovered_killmail_refs`: Discovery queue/provenance refs with source scope, status, selection, expansion, and failure fields.
- `fetch_runs`: collection/provenance run summaries.
- `api_request_logs`: scoped provider request logs.
- `ingestion_audits`: run-to-killmail audit rows, payload checksum, normalizer counts.
- `data_quality_warnings`: run/killmail warning records.
- `metadata_runs`, `entities`, `type_metadata`, `solar_systems`, SDE tables: local readability and lookup state.
- `watchlist_entities`, `system_watches`: Watch definitions, cadence, lookback, last success/error, backoff, and next poll state.
- `assessment_artifacts`: deliberate Assessment Memory, not Evidence.

### Volatile State

In-memory state that does not survive restart:

- `TaskRunner.tasks`
- task active locks
- task cancellation controllers
- Watch executor `sessionArmed`
- Watch executor interval timer
- Watch executor active task ID
- last tick, last dispatch, and last blocked reason

After restart, Atlas must review durable state through SQLite rows, reports, readiness, and support trace artifacts. It must not present old task/session state as durable truth.

### Support Artifacts

- Runtime DB snapshots are explicit support artifacts created under approved project-local temp paths.
- Operator debug trace packs are support/debug artifacts; they read local SQLite tables and current in-memory task history.
- Trace packs exclude raw expanded ESI payloads and full participant payloads by default.
- These artifacts are not Evidence, Observation, or Assessment Memory.

## Write Boundaries

- `manual.discovery`: live-gated zKill discovery; writes Discovery refs and run/API provenance, not Evidence.
- `queue.selection`: read-only queue preview; no Evidence writes.
- `manual.expansion` / `Enrich selected`: live-gated ESI expansion; writes expanded ESI Evidence, activity events, ingestion audits, run/API provenance, and queue status transitions.
- `actor.watch` / `system.radius.watch`: session/gate-controlled Watch execution; may drain queued refs or discover refs, then write Evidence through the same expansion/persistence path.
- `metadata.hydration`: readability-only metadata updates; does not write raw Evidence.
- `assessment.create`: writes deliberate Assessment Memory; not Evidence and not deletion.
- `retention.preflight`: read-only destructive preview; no deletion execution.
- `runtime.db_snapshot.preflight`: read-only snapshot preview.
- `runtime.db_snapshot.create`: explicit support artifact creation; no Evidence pruning/deletion.
- `support.debug_trace_pack`: explicit support artifact; excludes raw Evidence payloads.

## Existing Verification Sufficiency

No new focused verifier was added for HS59 because the existing accepted verifier set already proves each required boundary:

- Discovery refs remain queue/provenance until ESI expansion writes Evidence:
  - `verify:queue-api-evidence-write`
  - `verify:evidence-rules`
  - `verify:manual-discovery` via `verify:all` history, not rerun as HS59 minimum
- Partial ESI/API failure remains reconstructable through queue state, fetch runs, API logs, warnings, and successful Evidence writes:
  - `verify:queue-api-evidence-write`
  - `verify:partial-failures`
- Restart-style recovery preserves durable queue/watch/evidence/provenance state while volatile task/session state is not treated as durable:
  - `verify:restart-recovery`
- Retention preflight and runtime snapshot behavior stay distinct from Evidence deletion/pruning:
  - `verify:retention-deletion-boundary`
  - `verify:runtime-snapshot`
- DB integrity/idempotency and Evidence meaning remain guarded:
  - `verify:db-integrity`
  - `verify:evidence-rules`

Adding another script would duplicate HS57/HS58/restart coverage rather than prove a new source-owned gap.

## Files Changed

- `docs/current-state/current-evidence-pipeline.md`
  - Added current storage/runtime boundary summary.
- `workspace/current.md`
  - Updated Evidence / Dev Handoff section for HS59.
- `workspace/DevHS59-storage-runtime-readwrite-boundary.md`
  - Created this handoff.

No production code changed.

## Verification Run

Commands run:

```powershell
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:partial-failures
npm.cmd run verify:restart-recovery
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:db-integrity
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
git status --short --branch
```

Results:

- `verify:queue-api-evidence-write`: passed.
- `verify:partial-failures`: passed.
- `verify:restart-recovery`: passed.
- `verify:retention-deletion-boundary`: passed.
- `verify:runtime-snapshot`: passed.
- `verify:db-integrity`: passed.
- `verify:evidence-rules`: passed.
- `verify:protected-terms`: passed, warning-only.

Protected-term output:

- Files scanned: 3.
- Warning count: 153.
- Classes: `lab-quarantine-borrowing=86`, `atlas-candidate=59`, `cross-project-borrowing=8`.
- Confirmation: warning-only; no renames performed; no protected-word JSON updates performed.

## Boundary Confirmations

- No live/API calls were run.
- No user real database was mutated.
- No production deletion execution was added.
- No schema/migration/storage-location/file-selector work was performed.
- No bridge, IPC, service, payload, command, CSS/test-id, or protected-word JSON rename/update was performed.
- No UI redesign or renderer layout work was performed.

## Risks / Remaining Decisions

- Persistent provenance is split across several tables. This is currently reviewable but still not a unified record model.
- Volatile task/session state is intentionally not durable; operator surfaces must continue to show this honestly after restart.
- Production deletion scope and footprint storage remain policy decisions from HS58.
- Storage-location/file-selector hardening remains out of scope.

## Recommended Next Packet

Open a bounded runtime observability packet that improves operator-facing partial-success/restart status using existing reports/support trace data, without changing storage contracts or adding live IO.
