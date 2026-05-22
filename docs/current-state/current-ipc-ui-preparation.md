# Current State: IPC And UI Preparation

Date: 2026-05-22

## Progress Snapshot

Recorded: 2026-05-22 post-checkpoint review

Recent backend/UI-readiness work completed:

- service registry and IPC command shell are in place
- initial Electron renderer shell is in place and uses only the preload service bridge
- frameless draggable shell with user-controlled persisted always-on-top state is in place
- readiness/settings screen shows runtime paths, SDE topology, SDE inventory, live API state, User-Agent, backend messages, and next local action
- task progress/cancellation UI shows task history, selected task details, progress events, warnings, result/error payloads, and cancel action for running tasks
- actor-first report UI renders native structured `report.actor` responses with evidence, observation, provenance, warnings, raw IDs, and text export separated
- scope controls UI loads backend defaults and validates manual discovery, manual expansion, actor watch, and system/radius watch inputs through `scope.validate`
- queue/watch status UI previews discovery queue selections through `queue.selection` and watch due/blocked/backoff/session/live-gate state through `watch.schedule`
- session-armed watch executor is implemented as volatile app-session state with explicit Arm/Disarm controls, one due-watch dispatch per tick, and task-backed execution
- assessment artifact persistence is implemented for deliberate assessment memory; executable evidence pruning remains blocked
- `docs/gap/to-do` has no active presentation-validation gap; completed rigging items are in `docs/gap/complete`
- Electron visual smoke now runs through `npm.cmd run smoke:electron`, writes screenshots/results under `F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke`, and verifies startup creates no evidence/fetch runs
- Electron was updated to `v42.2.0` so the app runtime supports the backend `node:sqlite` dependency
- `verify:electron-runtime` now checks that Electron itself can use `node:sqlite`, closing the gap between desktop Node verification and Electron runtime behavior
- first controlled evidence-creating UI path exists for `manual.discovery`, using scope validation, live gate preflight, explicit confirmation, and detached task execution
- manual expansion UI exists in Queue / Watches with preflight, selected ref IDs, ESI call estimate, confirmation, and detached task execution
- controlled live operational smoke covered manual discovery and session-armed watch dispatch against a disposable DB
- runtime process isolation has been reviewed and deliberately deferred; detached tasks remain acceptable for the next milestone
- current recommended first future isolation target, if measured pressure appears, is SDE import / SDE sync-compare
- task wrapping, detached execution, cancellation, and HTTP timeout handling are verified
- live API gates and user-defined scope validation are centralized
- queue selection, queue status isolation, and retention preflight are implemented
- watch schedule/status planning and watch run state recording are implemented
- report response contracts and common report-scope indexes are implemented
- offline `verify:all` passes with 44 scripts
- latest handover checkpoint reviewed at `34fe33e`

Current lane:

- accept the initial presentation shell as the first renderer baseline
- keep the current renderer mostly read-only until evidence-creating controls are deliberately wired through task services, live gates, and explicit user action
- use the completed contracts as the source for future retention/assessment work
- keep the session-armed watch executor loop separate from passive page load behavior
- keep the implemented watch executor aligned with `docs/contracts/session-armed-watch-executor-contract.md`
- keep retention/destructive evidence pruning blocked until compaction/preflight/deletion verification exists
- defer true worker-thread/process isolation; current review recommends the detached task model for the next milestone
- run visual/app smoke through `npm.cmd run smoke:electron` or `npm start` rather than direct `file:///F:/...` navigation; the Codex in-app browser blocks direct file navigation by policy

## What Exists

AURA Atlas is currently backend-first, service-boundary-first, and renderer-smoke-verifiable.

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
- assessment artifact services for deliberate assessment memory creation/listing/inspection separate from evidence
- scoped discovery queue transitions so manual, actor, and system/radius queue rows do not overwrite each other's status
- UI language contract for evidence, observation, assessment, queue preview, scope, and warning wording
- session-armed watch executor contract covering arm/disarm semantics, polling cadence, dispatch gates, task execution, completion recording, and restart behavior
- assessment compaction contract covering artifact storage shape, score/reason requirements, retention by data class, and blockers before evidence pruning
- bounded HTTP request timeouts and task cancellation signals for live/API-backed work
- watch scheduling/status services for due, blocked, inactive, backoff, session-gated, and live-gated actor/system watches
- metadata-only watch run state recording for success/failure, next poll, and backoff timing
- session-armed watch executor services for status, arm, disarm, and one-tick dispatch of due watches through task execution
- compound report/query indexes for common evidence scopes and queue diagnostics
- read-only readiness inspection separated from explicit runtime path preparation
- initial renderer panes for readiness, task history, and queue report output
- readiness pane exposes explicit `app.prepare` only when backend readiness reports missing runtime paths
- task pane uses only `task.list`, `task.get`, and `task.cancel` service calls
- report pane presents actor reports from backend response sections without recomputing evidence in the renderer
- scope pane exposes lookback, caps, radius, system, actor, and queue selection inputs before future live actions
- queue/watch pane exposes queued discovery refs, non-evidence preview fields, expected ESI calls, selected/skipped/cached/failed state, and passive watch schedule status
- queue/watch pane exposes explicit session Arm/Disarm controls and executor state without arming on page load
- actions pane exposes manual discovery as the first controlled execution path; it queues zKill refs only and routes execution through task services
- frameless window controls for minimize, close, and always-on-top
- native structured actor report response with text rendering retained for CLI/export
- Electron visual smoke harness captures readiness, scopes, tasks, queue/watch, and reports screenshots from the real app window

The current renderer is intentionally an initial shell. It proves service consumption, status presentation, scoped previews, and actor-report rendering. It is not yet the final interaction model for live collection or assessment workflows.

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
- create/list/get deliberate assessment artifacts
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
- Electron runtime verification for `node:sqlite`
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
- watch executor verification
- report index/query-plan verification
- renderer shell service-boundary verification
- frameless shell/window-control verification through `verify:renderer-shell`
- readiness/settings screen verification through `verify:renderer-shell` and `verify:app-readiness`
- task progress/cancellation UI verification through `verify:renderer-shell` and `verify:task-runner`
- actor report presentation verification through `verify:renderer-shell` and `verify:report-response`
- scope controls UI verification through `verify:renderer-shell` and `verify:scope-controls`
- queue/watch status UI verification through `verify:renderer-shell`, `verify:queue-selection`, `verify:queue-report`, and `verify:watch-scheduler`
- native actor report response verification
- task runner verification

Live smoke grouping exists separately:

- `verify:live-smoke`
- `verify:live-actor-smoke`
- `verify:live-radius-smoke`

Live smoke groups refuse to run unless `AURA_ATLAS_LIVE_API=1` is set.

## Not Yet Implemented

- broader visual/product polish beyond the initial shell
- additional renderer controls for manual expansion, metadata hydration, actor watch, and system/radius watch execution outside the session executor
- executable retention/deprecation actions and assessment compaction
- executable evidence compaction/pruning actions
- true worker-thread/process isolation for CPU-heavy or synchronous SQLite-heavy tasks
- broader manual visual polish beyond the automated Electron smoke harness

## Current Review Notes

Latest reviewed commits:

- `e059924` - watch scheduler status service
- `fa34b9a` - report performance indexes
- `eda3938` - readiness inspection/preparation separation
- `2574906` - initial renderer service shell
- `99306be` - frameless widget shell controls
- `fabb07c` - readiness settings screen
- `4e8486d` - task progress UI
- `fca00e1` - actor report presentation
- `f8c1b51` - scope controls UI
- `28a8aef` - queue and watch status views
- `07b2804` - session armed watch executor contract
- `ef495bf` - assessment compaction contract
- `26f37a7` - retired backend electron readiness note
- `77085a4` - Electron visual smoke
- `e7e9e4c` - Electron runtime hardening
- `9009558` - manual discovery UI action
- `90ad081` - session armed watch executor
- `8ac493c` - assessment artifact persistence
- `1417981` - runtime isolation review
- `34fe33e` - dev runtime-isolation handover note
- current visual smoke slice - real Electron smoke harness, Electron runtime update, renderer global collision fix
- current controlled action slice - manual discovery UI through validation, live gate, explicit confirmation, and detached task execution
- current renderer shell slice - preload service bridge and initial presentation shell
- current frameless shell slice - draggable window chrome and persisted always-on-top state
- current readiness screen slice - explicit readiness/settings presentation through service responses
- current task UI slice - task inspection, progress, warnings, result/error preview, and cancellation controls
- current actor report slice - first structured report presentation surface
- current scope controls slice - backend-defaulted, backend-validated scope payload preview
- current queue/watch slice - passive discovery queue selection preview and watch schedule status
- current session-armed executor slice - volatile user-armed watch execution with explicit Arm/Disarm, one due-watch dispatch per tick, task-backed collection, and success/failure schedule recording
- current assessment artifact slice - deliberate assessment memory persistence separate from evidence, with service access and survival verification
- current runtime isolation review - keep current main-process service model for now; first future isolation target would be SDE import or SDE sync/compare if measured pressure appears
- current retention design slice - evidence compaction contract before destructive pruning
- current handover outcome - tracked presentation-validation checklist complete; next milestone should choose operational workflow hardening rather than speculative runtime refactor
- current live operational smoke - explicit manual discovery and session-armed watch executor smoke completed with one zKill call per successful path, zero ESI calls, and zero evidence writes in the selected one-hour ZTS-4D window
- current manual expansion UI slice - explicit queue-ref expansion path added; report-scoped hydration UI deferred for separate metadata-only wording

These commits move the earlier rigging gaps into an initial presentation checkpoint. The main remaining risk is no longer missing service vocabulary; it is preserving the service/evidence boundary while adding further executable UI actions and future retention actions without turning passive status views or preflights into hidden collection/destructive triggers.
