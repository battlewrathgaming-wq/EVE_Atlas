# Audit: Rigging Checkpoint Review

Date: 2026-05-22
Scope: Backend rigging, IPC/UI preparation, gap state, and recent commits `e059924`, `fa34b9a`, `eda3938`

## Current Behavior

AURA Atlas has completed the first backend rigging checkpoint for initial presentation work.

The current implementation has:

- a service registry and Electron IPC command shell
- read-only report, readiness, scope, queue, task, live-gate, and retention preflight services
- mutating service commands for manual discovery, manual expansion, actor watch, system/radius watch, metadata hydration, SDE imports, and watchlist actions
- detached task invocation for renderer-triggered long work
- task cancellation and HTTP timeout handling
- scoped discovery queue transitions
- watch schedule/status planning and watch run state recording
- compound report/query indexes for common evidence/report scopes
- read-only `app.readiness` and explicit `app.prepare`
- a native structured actor report response while other report types still use the text bridge

`verify:all` is currently documented as the offline confidence gate and includes 40 scripts.

## Pipeline / Flow

The intended renderer path is now:

```txt
renderer
-> atlas:service:invoke
-> service registry
-> scope/live/readiness validation
-> task runner when requested
-> backend worker/service module
-> SQLite evidence/metadata/report surfaces
-> structured response or task handle
```

The renderer should not call repositories, workers, raw SQLite, or CLI scripts directly.

Live collection remains explicit. The scheduler can identify due watches, blocked watches, and backoff state, but it does not yet run a passive collection loop.

## Known Gaps

### Renderer Shell

The backend service surface is ready for a first renderer, but the renderer itself has not been built.

The first UI should consume:

- `app.readiness`
- `app.prepare`
- `scope.defaults`
- `scope.validate`
- `live.gate`
- `report.*`
- `queue.selection`
- `watch.schedule`
- `task.list`
- `task.get`

### Session-Armed Watch Executor

Watch scheduling/status exists, but the executor loop remains open.

The future executor should:

- require explicit session/user arming
- consult `watch.schedule`
- start due watch runs through evidence-creating task services
- record success/failure through `watch.recordRun`
- never start live collection merely because a page loaded

### Process Isolation

Detached tasks avoid blocking the immediate IPC response, but they do not move synchronous SQLite or CPU-heavy work out of the Electron main process.

True worker-thread, utility-process, child-process, or separate backend process isolation remains a future scaling step.

### Retention Execution

Retention policy and preflight exist, but destructive pruning and assessment compaction are not executable yet.

Evidence pruning should wait until assessment preservation/compaction is implemented.

### Structured Reports

The actor report has a native structured model/render split. Other report types still use the text bridge.

This is acceptable for the first renderer if the UI starts with actor-report patterns or treats text-bridged reports as transitional.

## Risks

- Renderer work could accidentally bypass the service boundary if components import backend modules directly.
- The session watch executor could become passive polling if not explicitly session/user armed.
- Detached tasks may feel like true background workers even though CPU-heavy synchronous work can still consume main-process time.
- Report UI could overfit to text-bridged sections before structured report models are migrated.
- Retention UI could be exposed before assessment artifacts exist.

## Verification

Current relevant verification:

- `verify:all`
- `verify:service-registry`
- `verify:app-readiness`
- `verify:mutating-services`
- `verify:background-execution`
- `verify:http-timeouts`
- `verify:watch-scheduler`
- `verify:report-indexes`
- `verify:report-response`
- `verify:queue-scope-isolation`

Live smoke remains separate and gated by `AURA_ATLAS_LIVE_API=1`.

## Recommended Next Steps

1. Build a minimal renderer shell against the service registry, not backend modules.
2. Add a read-only readiness/settings page using `app.readiness` and `app.prepare`.
3. Add task history/progress presentation using `task.list`, `task.get`, and `task.cancel`.
4. Add report presentation using structured responses, starting with the native actor report if practical.
5. Add queue/watch schedule views before live execution controls.
6. Design the session-armed watch executor as its own gap/contract before implementation.
7. Keep process isolation as a future performance milestone after UI smoke and larger batch tests.

## Related Files

- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/gap/to-do/backend-electron-readiness.md`
- `docs/gap/complete`
- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/taskRunner.js`
- `src/main/services/appReadinessService.js`
- `src/main/watchlist/watchScheduler.js`
