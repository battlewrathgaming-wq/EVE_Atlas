# DevHS60 - Runtime Observability Readout

Date: 2026-05-25
Executor: Dev
Milestone: HS60 Runtime Observability Readout

## Readout / Support Paths Audited

- `src/main/support/operatorDebugTracePack.js`
- `scripts/verify-operator-debug-trace-pack.js`
- `src/main/services/runtimeSnapshotService.js`
- `scripts/verify-runtime-db-snapshot.js`
- `src/main/services/taskRunner.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-app-restart-recovery.js`
- `scripts/verify-partial-failures.js`
- `scripts/verify-queue-api-evidence-write.js`
- `scripts/verify-retention-deletion-boundary.js`

## Existing Behavior

- Operator debug trace packs already read local SQLite tables and current in-memory task history without calling zKill or ESI.
- Trace packs already include fetch runs, API request logs, task history summaries, data quality warnings, queue status, readiness, corpus health, and smoke artifact paths.
- Runtime snapshots already classify preflight as read-only and creation as support artifact creation, not pruning/deletion.
- Restart recovery verification already proves durable SQLite state survives while task/session/executor state is fresh after restart.
- Partial failure verification already proves failed provider/persistence paths are reconstructable through queue state, fetch runs, API logs, warnings, and successful Evidence writes.

## Improvement Implemented

Added a compact `runtime_boundary` section to operator debug trace packs.

The section gives support operators a single read-only status surface for:

- durable state basis
- volatile state basis
- support artifact classifications
- restart interpretation
- partial failure indicators
- current volatile task status counts
- boundary reminders for Discovery/Evidence, partial success, retention preflight, and support artifacts

This is a read-only support/readout improvement. It does not alter storage contracts, provider behavior, task execution, retention behavior, renderer UI, or IPC.

## Files Changed

- `src/main/support/operatorDebugTracePack.js`
  - Added `runtime_boundary` to the trace pack model.
  - Added local helpers for fetch-run, queue, API, warning, and task-status indicators.
- `scripts/verify-operator-debug-trace-pack.js`
  - Added assertions for runtime boundary classification, durable/volatile basis, partial-failure indicators, support artifact classification, restart interpretation, and retention/deletion separation.
- `workspace/current.md`
  - Updated HS60 Evidence and Dev Handoff sections.

## Runtime Boundary Fields

`runtime_boundary.classification`:

- support/readout classification, not Evidence/Observation/Assessment.

`durable_state_basis`:

- SQLite Evidence/provenance tables
- Discovery queue status
- Watch definitions and schedule timestamps
- fetch runs
- API request logs
- ingestion audits
- warnings
- Assessment Memory

`volatile_state_basis`:

- current in-memory task history
- in-memory task locks/cancellation controllers
- current Watch executor session/active-task state

`partial_failure_indicators`:

- failed fetch runs
- fetch runs with failed expansions
- fetch runs with warning/error summaries
- pending queue refs
- failed queue refs
- API error count
- warning group count

`support_artifacts`:

- runtime DB snapshot
- operator debug trace pack
- API request logs
- reports

## Verification

Commands run:

```powershell
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:restart-recovery
npm.cmd run verify:partial-failures
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
npm.cmd run verify:all
git status --short --branch
```

Results:

- `verify:operator-debug-trace`: passed.
- `verify:runtime-snapshot`: passed.
- `verify:restart-recovery`: passed.
- `verify:partial-failures`: passed.
- `verify:queue-api-evidence-write`: passed.
- `verify:retention-deletion-boundary`: passed.
- `verify:evidence-rules`: passed.
- `verify:protected-terms`: passed warning-only.
- `verify:all`: passed, 65 scripts.

Protected-term output after handoff/current updates:

- Files scanned: 4.
- Warning count: 174.
- Classes: `atlas-candidate=88`, `cross-project-borrowing=25`, `lab-quarantine-borrowing=61`.
- Confirmation: warning-only; no renames performed; no protected-word JSON updates performed.

## Boundary Confirmations

- No live/API calls were run.
- No user real database was mutated; verification used fixture/in-memory/disposable local databases.
- No production deletion execution was added.
- No schema or migration work occurred.
- No storage-location/file-selector work occurred.
- No UI redesign, renderer layout work, Lab display adoption, or animation occurred.
- No bridge, IPC, service, payload, command, CSS/test-id, or protected-term rename occurred.
- No raw expanded ESI payloads or full participant payloads were added to support artifacts.
- Discovery, Evidence, Report/readout, Assessment Memory, Watch, Marked, retention preflight, and support artifact boundaries were preserved.

## Risks / Deferred Decisions

- The new readout reports compact indicators, not a unified provenance model.
- Partial success is more visible in support traces, but primary operator workflows may still need a future display/status pass.
- Clean body snapshot readiness remains parked for a later packet.
- Production deletion and footprint storage remain outside this packet.

## Recommended Next Packet

Open a bounded operator status/readout packet that uses this `runtime_boundary` data in an existing report or support command response, without renderer redesign or storage contract changes.
