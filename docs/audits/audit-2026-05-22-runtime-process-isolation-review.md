# Audit: Runtime Process Isolation Review

Date: 2026-05-22
Scope: Electron main-process backend services, task runner, SQLite access, heavier offline workflow checks, and process-isolation timing.

## Review Summary

Recommendation: keep the current main-process service model with detached task execution for the next milestone.

Do not introduce worker threads, utility processes, child processes, or a separate local service yet.

The current risk is known and bounded:

- detached tasks avoid long IPC waits
- synchronous SQLite and CPU work still execute in the Electron main process
- live/network-heavy work is mostly network-wait-heavy and already task-wrapped
- broader isolation should wait for a measured bottleneck or a concrete UI responsiveness problem

## Measurement Signal

The current heavier offline workflow group was run as the review signal:

```txt
npm.cmd run verify:bulk
elapsed_ms: 3415
```

The broader offline suite and Electron smoke also passed after the current checkpoint:

```txt
npm.cmd run verify:all
scripts: 44
result: passed

npm.cmd run smoke:electron
result: passed
```

These checks do not prove unlimited scale, but they are enough to avoid a speculative process split before the first usable UI milestone.

## Workload Classification

### Network-Wait-Heavy

- manual discovery
- manual expansion
- actor watch collection
- system/radius watch collection
- metadata hydration
- session-armed watch executor dispatch

Current model is acceptable because task wrapping, HTTP timeouts, live gates, and cancellation signals already exist.

### Synchronous SQLite-Heavy

- evidence persistence
- report queries over larger local corp/system/radius scopes
- queue selection/reporting
- assessment artifact listing as the table grows

Current model is acceptable for the next milestone, but these are the first places to watch if UI responsiveness drops.

### CPU/Import-Heavy

- SDE topology import
- SDE inventory import
- future SDE sync/compare

These are the strongest future candidates for process isolation because they are explicit, bounded, and not part of normal report rendering.

### UI-Sensitive

- app startup/readiness
- queue/watch status refresh
- task list/detail refresh
- report rendering
- session arm/disarm feedback

These should stay thin and service-backed. Passive UI views must not perform hidden collection or heavy import work.

## Decision

For the next milestone:

- keep one SQLite write authority in the Electron main-process backend
- keep renderer access limited to the preload service bridge
- keep long or mutating work task-wrapped
- keep live/API work gated and explicit
- keep SDE import as an explicit command, not report-time lookup
- defer runtime isolation until a measured UI stall, import bottleneck, or SQLite contention problem appears

First future isolation target, if needed:

```txt
SDE import / future SDE sync-compare
```

Second future candidate:

```txt
large report generation or evidence compaction over large local corp/radius scopes
```

## Guardrails

If process isolation is introduced later:

- do not duplicate evidence-writing logic casually
- preserve one clear SQLite write owner or introduce an explicit write queue
- preserve task progress, cancellation, warnings, and audit logs
- keep all runtime/cache/temp paths under `F:\Projects\AURA-Atlas` and `.tmp`
- do not let renderer call isolated workers directly
- keep IPC/service contracts stable for the UI

## Remaining Risk

The current model can still block the Electron main process during large synchronous SQLite writes or CPU-heavy imports.

That is acceptable for the next milestone because:

- the UI is still early and controlled
- evidence-creating actions are explicit
- SDE import is not part of normal reporting
- current heavier offline checks pass quickly
- introducing process boundaries now would increase ownership complexity before there is pressure to justify it

## Related Files

- `docs/gap/complete/runtime-process-isolation-review.md`
- `docs/gap/complete/background-worker-execution.md`
- `docs/gap/complete/http-timeouts-and-cancellation.md`
- `src/main/services/taskRunner.js`
- `src/main/services/serviceRegistry.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/db/database.js`
- `scripts/verify-bulk-synthetic.js`
- `scripts/verify-actor-bulk-workflow.js`
- `scripts/verify-controlled-workflow.js`
