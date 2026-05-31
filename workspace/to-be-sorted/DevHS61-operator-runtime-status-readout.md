# DevHS61 - Operator Runtime Status Readout

Date: 2026-05-25
Executor: Dev
Milestone: HS61 Operator Runtime Status Readout

## Chosen Surface

Chosen existing read-only surface: `app.readiness`.

Rationale:

- It already answers local runtime/status questions.
- It is read-only and local.
- It can be inspected without opening the full operator debug trace artifact.
- It avoids renderer redesign and avoids adding a new service command.

The full operator debug trace pack still includes the same runtime boundary model. HS61 refactored the HS60 model into a shared support helper so both surfaces use one source-owned meaning.

## Files Reviewed

- `workspace/DevHS60-runtime-observability-readout.md`
- `src/main/support/operatorDebugTracePack.js`
- `src/main/services/appReadinessService.js`
- `scripts/verify-app-readiness.js`
- `scripts/verify-operator-debug-trace-pack.js`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/services/reportResponseService.js`
- `scripts/verify-runtime-db-snapshot.js`
- `scripts/verify-report-response.js`

## Files Changed

- `src/main/support/runtimeBoundaryStatus.js`
  - Added shared runtime boundary model builder.
- `src/main/support/operatorDebugTracePack.js`
  - Reused shared runtime boundary model instead of local duplicate helpers.
- `src/main/services/appReadinessService.js`
  - Added `runtime_boundary` to the read-only readiness response.
- `scripts/verify-app-readiness.js`
  - Added assertions for the compact runtime boundary in readiness.
- `docs/current-state/current-evidence-pipeline.md`
  - Recorded the implemented readiness/runtime-boundary surface.
- `workspace/current.md`
  - Updated HS61 Evidence and Dev Handoff sections.

## Runtime Status Fields Exposed

`app.readiness.runtime_boundary` now includes:

- `classification`
  - runtime/support readout; not Evidence, Observation, or Assessment.
- `durable_state_basis`
  - SQLite evidence/provenance tables, Discovery queue status, Watch definitions/schedule timestamps, fetch runs, API logs, ingestion audits, warnings, and Assessment Memory.
- `volatile_state_basis`
  - in-memory task history, task locks/cancellation controllers, and current Watch executor session/active-task state.
- `support_artifacts`
  - runtime DB snapshots, operator debug trace packs, API request logs, and reports classified as support/readout artifacts.
- `restart_interpretation`
  - durable SQLite rows remain reviewable after restart; in-memory task/session state is fresh.
- `partial_failure_indicators`
  - failed fetch runs, failed expansions, warning/error summaries, pending/failed queue refs, API errors, warning groups.
- `current_volatile_task_counts`
  - current in-memory task statuses.
- `boundaries`
  - Discovery/Evidence, partial success, retention preflight, and support artifact reminders.

## Verification

Commands run:

```powershell
npm.cmd run verify:app-readiness
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

- `verify:app-readiness`: passed.
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

- Files scanned: 7.
- Warning count: 280.
- Classes: `atlas-candidate=149`, `cross-project-borrowing=43`, `lab-quarantine-borrowing=88`.
- Confirmation: warning-only; no renames performed; no protected-word JSON updates performed.

## Boundary Confirmations

- No live/API calls were run.
- No user real database was mutated; verification used in-memory/disposable fixture databases.
- No production deletion execution was added.
- No schema or migration work occurred.
- No storage-location/file-selector work occurred.
- No UI redesign, renderer layout work, Lab display adoption, or animation occurred.
- No raw expanded ESI payloads or full participant payloads were exposed.
- No service command rename, payload rename, IPC rename, CSS/test-id change, or protected-word JSON update occurred.
- Existing readiness fields were preserved; a new read-only `runtime_boundary` field was added.

## Risks / Deferred Decisions

- `app.readiness.runtime_boundary` is compact support status, not a full provenance model.
- It surfaces current default in-memory task state; a custom task runner can still be supplied in direct backend tests/support code.
- Renderer presentation is intentionally unchanged.
- Clean body snapshot readiness remains parked for a later packet.

## Recommended Next Packet

Open a bounded packet to make partial-success status clearer in one existing report response, likely run or corpus health, using existing fetch run/API log/queue status records without adding new storage or UI redesign.
