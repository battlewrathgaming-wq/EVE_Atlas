# Current State: IPC And UI Preparation

Date: 2026-05-22

## What Exists

AURA Atlas is currently backend-first and CLI-verifiable.

The project now has the first Electron IPC service shell around backend services. The renderer/UI should call a controlled backend interface rather than repositories, workers, or SQLite directly.

Current implemented shell:

- `atlas:service:list`
- `atlas:service:invoke`
- `app.readiness` service command
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
- native structured actor report response with text rendering retained for CLI/export

## Backend Actions Ready For IPC Wrapping

Implemented backend actions include:

- read app readiness/settings
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
- native actor report response verification
- task runner verification

Live smoke grouping exists separately:

- `verify:live-smoke`
- `verify:live-actor-smoke`
- `verify:live-radius-smoke`

Live smoke groups refuse to run unless `AURA_ATLAS_LIVE_API=1` is set.

## Not Yet Implemented

- renderer shell
- UI controls for scope selection
- session-armed watch executor loop
- long-running retention/deprecation policy
- true worker-thread/process isolation for CPU-heavy or synchronous SQLite-heavy tasks
