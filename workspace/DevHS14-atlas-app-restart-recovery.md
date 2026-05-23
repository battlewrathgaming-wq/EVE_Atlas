# DevHS14: Atlas App Restart Recovery

Status: Complete
Date: 2026-05-23
Role: Dev
Milestone: Aggressive Testing And Operator Bug Hunting

## Scope

Executed the HS14 runway in `workspace/current.md`: app restart/reinitialization recovery after running, cancelled, and failed task scenarios without live APIs, GUI smoke, private runtime DB export, or destructive operations.

I did not read or interact with the planner scoping document. The only planner-derived requirement honored was the accepted `Mark`/`Watch` distinction already copied into `workspace/current.md`.

## Changes

- Added `scripts/verify-app-restart-recovery.js`.
- Added `verify:restart-recovery` to `package.json`.
- Wired `verify:restart-recovery` into the core/all verification group.
- Updated current-state docs to list the new verification and record the restart/reinitialization recovery truth.

## Evidence Covered

The new verifier uses a project-local file-backed DB under `.tmp/app-restart-recovery` and asserts:

- fresh `TaskRunner` instances do not inherit stale running-task locks
- cancelled in-memory task history is not presented as persisted after reinitialization
- fresh task runners can run same-scope work after simulated restart without mutating persisted evidence state
- failed service-wrapped manual expansion leaves a failed fetch run, scoped ESI API log, pending queue ref, and no partial killmail/activity evidence
- support trace packs after reinitialization honestly show persisted fetch/API/queue state while task history is empty unless supplied by the current in-memory runner
- fresh `WatchSessionExecutor` instances start disarmed, with no active task ID and no silent due-watch dispatch
- restart/recovery inspection does not call zKill/ESI, expand evidence, hydrate metadata, create assessment artifacts, or execute watches
- readiness/debug trace surfaces preserve the closed live API gate and do not mutate persisted state
- support artifacts remain bounded and exclude raw ESI payload dumps

## Verification

```txt
npm.cmd run verify:restart-recovery
Result: passed
```

```txt
npm.cmd run verify:all
Result: passed
All verification group passed with 61 scripts.
```

Electron smoke was not run because this packet changed offline verification and current-state docs only.

No live API work, real SDE network download, private runtime DB export, or destructive operation was run.

## Files Changed

```txt
scripts/verify-app-restart-recovery.js
scripts/verify-group.js
package.json
docs/current-state/current-evidence-pipeline.md
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS14-atlas-app-restart-recovery.md
```

## Findings

No product bug was found during this packet.

The current architecture is explicit and testable: task history, active locks, and session-armed watch executor state are volatile process/session state; evidence rows, queue refs, fetch runs, API logs, warnings, and support traces remain persisted/reviewable. Restart/reinitialization does not silently resume collection or claim persisted task history.

## Deferred

- Live API success smoke without explicit operator authorization.
- Real SDE network download.
- Operator Investigation Desk UX.
- Roadmap conversion.

## Recommended Next Packet

From the Dev side, the non-live aggressive-testing milestone slices are ready for Overseer closure review. Any live success smoke should remain a separate human-authorized packet with a narrow target/window. Roadmap conversion should be treated as Overseer planning/closure work, not Dev implementation scope.
