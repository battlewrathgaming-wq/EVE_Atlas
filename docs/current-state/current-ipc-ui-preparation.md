# Current State: IPC And UI Preparation

Date: 2026-05-22

## Progress Snapshot

Recorded: 2026-05-22 13:32:29 +01:00

Recent backend/UI-readiness work completed:

- service registry and IPC command shell are in place
- initial Electron renderer shell is in place and uses only the preload service bridge
- frameless draggable shell with user-controlled persisted always-on-top state is in place
- readiness/settings screen shows runtime paths, SDE topology, SDE inventory, live API state, User-Agent, backend messages, and next local action
- task progress/cancellation UI shows task history, selected task details, progress events, warnings, result/error payloads, and cancel action for running tasks
- task wrapping, detached execution, cancellation, and HTTP timeout handling are verified
- live API gates and user-defined scope validation are centralized
- queue selection, queue status isolation, and retention preflight are implemented
- watch schedule/status planning and watch run state recording are implemented
- report response contracts and common report-scope indexes are implemented
- offline `verify:all` passes with 40 scripts

Current lane:

- accept the backend rigging checkpoint as the first renderer-ready service baseline
- build out the initial renderer shell against service responses instead of repositories or CLI scripts
- keep the session-armed watch executor loop separate from passive page load behavior
- defer true worker-thread/process isolation until heavier batch/runtime testing proves it is needed

## What Exists

AURA Atlas is currently backend-first and CLI-verifiable.

The project now has the first Electron IPC service shell around backend services. The renderer/UI should call a controlled backend interface rather than repositories, workers, or SQLite directly.

Current implemented shell:

- `atlas:service:list`
- `atlas:service:invoke`
- `window.atlasServices` preload bridge for renderer service calls
- `window.atlasWindow` preload bridge for frameless shell controls
- `app.readiness` service command
- `app.prepare` service command for explicit runtime path preparation
- `scope.defaults` service command
- `scope.validate` service command
- `live.gate` service command
- mutating service commands for manual discovery, manual expansion, actor watch, system/radius watch, metadata hydration, SDE import, and watchlist actions
- `report.build` service command
- report-specific service commands for actor, corporation, queue, radius, run, and system reports
- `queue.selection` service command
- `task.list` service command
- `task.get` service command
- task-wrapped service invocation with `asTask: true`
- detached/background task invocation with `asTask: true` and `detachedTask: true`
- shared message taxonomy for readiness, live gate, and task responses
- task locking for read-only, metadata, evidence-creating, destructive, and exclusive work
- retention/destructive action preflight for confirmation and impact summaries
- scoped discovery queue transitions so manual, actor, and system/radius queue rows do not overwrite each other's status
- UI language contract for evidence, observation, assessment, queue preview, scope, and warning wording
- bounded HTTP request timeouts and task cancellation signals for live/API-backed work
- watch scheduling/status services for due, blocked, inactive, backoff, session-gated, and live-gated actor/system watches
- metadata-only watch run state recording for success/failure, next poll, and backoff timing
- compound report/query indexes for common evidence scopes and queue diagnostics
- read-only readiness inspection separated from explicit runtime path preparation
- initial renderer panes for readiness, task history, and queue report output
- readiness pane exposes explicit `app.prepare` only when backend readiness reports missing runtime paths
- task pane uses only `task.list`, `task.get`, and `task.cancel` service calls
- frameless window controls for minimize, close, and always-on-top
- native structured actor report response with text rendering retained for CLI/export

## Backend Actions Ready For IPC Wrapping

Implemented backend actions include:

- read app readiness/settings
- prepare approved runtime/cache/SDE directories
- resolve typed actor names
- validate user-defined scopes
- run manual discovery
- run manual expansion
- run actor watch collection
- run system/radius watch collection
- run queue preflight/report
- run report products
- run metadata readiness reports
- run scoped hydration commands
- run diagnostics reports
- inspect watch schedule/backoff status
- record watch run success/failure timing after a controlled task
- invoke evidence-creating and metadata-mutating commands through the service/task boundary

## Scope Defaults And Guardrails

Scope validation/defaults are centralized in backend helpers.

This is intended to be the shared source for:

- CLI arguments
- future IPC request validation
- future UI form defaults

The UI should submit explicit user choices, but backend scope helpers remain the authority for allowed values and conservative defaults.

## Verification Shape

Offline verification now includes:

- individual feature checks
- grouped `verify:all`
- a controlled disposable DB workflow check
- app readiness verification
- service registry / IPC handler verification
- scope defaults/validation verification
- live API gate verification
- report response verification
- queue expansion selection verification
- queue scope isolation verification
- message taxonomy verification
- retention preflight verification
- mutating service verification
- background execution verification
- HTTP timeout/cancellation verification
- watch scheduler/backoff verification
- report index/query-plan verification
- renderer shell service-boundary verification
- frameless shell/window-control verification through `verify:renderer-shell`
- readiness/settings screen verification through `verify:renderer-shell` and `verify:app-readiness`
- task progress/cancellation UI verification through `verify:renderer-shell` and `verify:task-runner`
- native actor report response verification
- task runner verification

Live smoke grouping exists separately:

- `verify:live-smoke`
- `verify:live-actor-smoke`
- `verify:live-radius-smoke`

Live smoke groups refuse to run unless `AURA_ATLAS_LIVE_API=1` is set.

## Not Yet Implemented

- UI controls for scope selection
- dedicated readiness/settings screen polish
- session-armed watch executor loop
- executable retention/deprecation actions and assessment compaction
- true worker-thread/process isolation for CPU-heavy or synchronous SQLite-heavy tasks

## Current Review Notes

Latest reviewed commits:

- `e059924` - watch scheduler status service
- `fa34b9a` - report performance indexes
- `eda3938` - readiness inspection/preparation separation
- current renderer shell slice - preload service bridge and initial presentation shell
- current frameless shell slice - draggable window chrome and persisted always-on-top state
- current readiness screen slice - explicit readiness/settings presentation through service responses
- current task UI slice - task inspection, progress, warnings, result/error preview, and cancellation controls

These commits move the earlier rigging gaps into a usable backend baseline for initial presentation work. The main remaining risk is not missing service vocabulary; it is wiring a renderer that uses these services without bypassing them, and deciding how session-armed watch execution should trigger due watches safely.
