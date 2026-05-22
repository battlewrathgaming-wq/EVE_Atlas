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
- report presentation now includes explicit empty-state/status language and row counts for actor observation sections
- scope controls UI loads backend defaults and validates manual discovery, manual expansion, actor watch, and system/radius watch inputs through `scope.validate`
- queue/watch status UI previews discovery queue selections through `queue.selection` and watch due/blocked/backoff/session/live-gate state through `watch.schedule`
- session-armed watch executor is implemented as volatile app-session state with explicit Arm/Disarm controls, one due-watch dispatch per tick, and task-backed execution
- assessment artifact persistence is implemented for deliberate assessment memory; executable evidence pruning remains blocked
- Reports view can now save, list, and inspect deliberate assessment memory from a loaded actor report context without mutating evidence
- `docs/gap/to-do` has no active presentation-validation gap; completed rigging items are in `docs/gap/complete`
- Electron visual smoke now runs through `npm.cmd run smoke:electron`, writes screenshots/results under `F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke`, and verifies startup creates no evidence/fetch runs
- Electron was updated to `v42.2.0` so the app runtime supports the backend `node:sqlite` dependency
- `verify:electron-runtime` now checks that Electron itself can use `node:sqlite`, closing the gap between desktop Node verification and Electron runtime behavior
- first controlled evidence-creating UI path exists for `manual.discovery`, using scope validation, live gate preflight, explicit confirmation, and detached task execution
- manual expansion UI exists in Queue / Watches with preflight, selected ref IDs, ESI call estimate, confirmation, and detached task execution
- assessment workflow UI exists in Reports with loaded actor context, reason/summary requirement, score-reason guard, visible evidence/assessment boundary, and saved artifact detail inspection
- retention preflight can preview the assessment memory that would survive future typed-actor evidence compaction without creating artifacts or deleting evidence
- controlled live operational smoke covered manual discovery and session-armed watch dispatch against a disposable DB
- controlled actor operation workflow is complete through deterministic fixture verification
- controlled area operation workflow is complete through deterministic fixture verification
- live expansion smoke completed one explicit ESI killmail expansion from queued possible evidence into stored evidence
- actor report metadata hydration UI is implemented as readability-only metadata work
- renderer modularization implementation is complete; `src/renderer/app.js` is now an orchestrator loaded after surface modules
- native structured radius report response is implemented; radius report UI is the next presentation target
- radius report presentation UI is implemented through structured `report.radius` responses without renderer-side report inference
- watch authoring UI is implemented as metadata-only actor and system/radius intent creation, separate from collection execution
- report-scoped metadata hydration now supports radius reports using report-relevant entity IDs and metadata-only runs
- local scale/stability smoke is implemented with a disposable `.tmp` DB: 120 killmails, 840 activity events, 80 queued refs, actor/corporation/radius/queue/metadata reports all completed under 50 ms in the first measured run
- assessment from area context has a no-build decision for this milestone: radius reports remain observation surfaces, and future assessment must be deliberate through a selected entity or explicit analyst note
- local system resolution is now a shared local-SDE resolver used by manual discovery and live system-watch runners; system names resolve to durable solar system IDs before scoped zKill routes are planned
- scoped zKill discovery has a live-gated smoke harness that performs system-name resolution, plans the `/systemID/{id}/pastSeconds/{seconds}/` route, queues discovery refs only, reports trace/freshness context, and makes zero ESI expansion calls
- assessment artifact citation validation is implemented: cited sample killmail IDs must exist locally, entity-focused citations must match cited activity events, and artifacts store creation-time citation status/details
- compaction preview can now be converted into a validated `evidence_compaction` assessment artifact only through explicit assessment creation; `retention.preflight` remains read-only and evidence deletion remains blocked
- scoped system/radius discover-refs-only work is exposed through the existing Actions pane with system-name input, backend local resolution, live gate preflight, visible confirmation, and zero automatic expansion
- live scoped zKill smoke now writes reviewable `.tmp` JSON artifacts for refusal/failure/success paths, including topology/evidence counts, route, API counts, queued ref summary, and non-evidence boundary wording
- evidence-rule regression checks now protect core boundaries in `verify:all`: immutable raw killmail persistence, manual discovery as queue-only possible evidence, queue non-evidence wording, assessment citation validation, hydration without evidence mutation, and non-destructive retention preflight
- Readiness view now exposes local corpus health and runtime DB snapshot safety through structured service calls. Corpus health is read-only; snapshot creation requires visible confirmation and does not restore, prune, compact, delete evidence, or call live APIs.
- Offline operator workflow scenario smoke now exercises the renderer-like service/task loop: scope validation, manual discovery, queue report, selected expansion, metadata hydration, actor report, assessment creation, corpus health, snapshot preflight, and task history.
- assessment compaction writes are intentionally deferred; compaction remains read-only preview and evidence deletion remains blocked
- runtime process isolation has been reviewed and deliberately deferred; detached tasks remain acceptable for the next milestone
- current recommended first future isolation target, if measured pressure appears, is SDE import / SDE sync-compare
- standalone Aura core extraction has a completed brief: clone Atlas doctrine and selected utilities, not Atlas persistence/watch/report semantics
- backend/UI boundary handoff accepted at `041a0f6`; renderer still uses the preload service bridge and service registry rather than backend imports
- `verify:all` and `smoke:electron` were rerun during overseer boundary review and passed
- task wrapping, detached execution, cancellation, and HTTP timeout handling are verified
- live API gates and user-defined scope validation are centralized
- queue selection, queue status isolation, and retention preflight are implemented
- watch schedule/status planning and watch run state recording are implemented
- report response contracts and common report-scope indexes are implemented
- offline `verify:all` passes with 44 scripts
- latest handover checkpoint reviewed at `34fe33e`
- latest backend/UI boundary checkpoint reviewed at `041a0f6`
- latest controlled workflow checkpoint reviewed at `202af64`

Current lane:

- treat the initial presentation shell as a proven baseline, not the final UI structure
- keep watch execution separated through explicit manual actions or the session-armed executor; authoring remains metadata-only
- keep session-armed watch execution separate from passive page-load behavior
- keep metadata hydration report-scoped and readability-only; static inventory types remain local-SDE metadata
- keep retention/destructive evidence pruning blocked; compaction remains read-only preview
- continue deferring worker-thread/process isolation until measured scale pressure appears
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
- `assessment.compact_from_evidence` preflight includes a read-only `assessment_preview` snapshot for typed actor scopes
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
- reports pane can create assessment memory from actor report context through `assessment.create`, then list/inspect artifacts through `assessment.list` and `assessment.get`
- reports pane shows a status callout for loaded actor reports with sample status, evidence window, killmail count, activity event count, and layer boundary wording
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
- `verify:live-scoped-zkill`
- `verify:live-actor-smoke`
- `verify:live-radius-smoke`

Live smoke groups refuse to run unless `AURA_ATLAS_LIVE_API=1` is set.

## Not Yet Implemented

- broader visual/product polish beyond the initial shell
- additional renderer controls for metadata hydration, actor watch, and system/radius watch execution outside the session executor
- broader controlled actor/area operation workflow from UI scope to evidence/observation/assessment review
- controlled actor operation workflow is documented and verified offline with `Atlas Scout [characterID: 90000002]`, manual discovery, manual expansion, actor watch, reports, queue state, and renderer boundary checks
- controlled area operation workflow is documented and verified offline with `Atlas Prime [solarSystemID: 30000001]`, local topology radius planning, capped collection, radius report observations, and multi-system presence wording
- live expansion smoke passed against `Mr Jesterman [characterID: 1329523328]`: 5 queued refs, 1 ESI killmail expansion, 1 stored killmail, 8 activity events, 4 refs left pending in a disposable DB
- actor report metadata hydration UI is implemented as a readability-only, live-gated, metadata-only task that excludes static type IDs from ESI hydration
- structured report expansion is partially complete: radius now has a native structured backend response, and renderer presentation is next
- retention compaction writes are deferred by decision: `assessment.compact_from_evidence` remains preview-only until a real retention/pruning need exists
- renderer modularization/component boundary review before `src/renderer/app.js` absorbs more workflow orchestration
- renderer modularization implementation is complete: shared helpers, readiness, scopes, tasks, queue/watch, actions, reports, and app orchestration are separate renderer scripts
- executable retention/deprecation actions and actual assessment compaction writes
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
- current assessment report workflow slice - actor report context can create/list/inspect assessment artifacts through the service bridge with explicit boundary confirmation and no evidence mutation
- current report presentation polish slice - Reports view now has a clearer unloaded state, loaded actor status summary, and observation row counts while retaining backend report authority
- current compaction preservation preflight slice - read-only typed-actor compaction preview shows what assessment memory would survive, with no evidence deletion or artifact insertion
- current Aura core extraction brief - standalone Aura should begin as a pure parser/compute service shell with fixture tests, borrowing Atlas rigging without inheriting Atlas evidence-memory implementation
- `041a0f6` - backend UI boundary handoff audit
- `55928c9` - renderer modularization review
- `2bafcef` - controlled actor operation workflow
- `576c313` - controlled area operation workflow
- `690c3b5` - live expansion smoke
- `126c02f` - actor metadata hydration UI
- `202af64` - controlled workflow follow-up decisions
- current backend/UI boundary handshake - service/preload boundary remains healthy; next milestone should prove a narrow controlled actor/area operation workflow rather than broad dashboard expansion
- current renderer modularization review - defer file split for one narrow operator-proof slice, with explicit triggers for modularization before broader workflow expansion
- current renderer modularization implementation - split renderer surfaces into separate scripts and updated renderer-shell verification to scan all renderer modules
- current native structured radius response - `report.radius` returns backend-owned structured scope, evidence basis, observations, provenance, warnings, raw IDs, and retained text output
- current radius report presentation UI - Reports pane can load area/radius observations through `report.radius` without collection or text parsing
- current watch authoring UI - Queue / Watches pane can create actor and system/radius watches through `watch.create` without running collection
- current report-scoped hydration expansion - radius reports can hydrate report-relevant entity IDs without evidence mutation or type-ID ESI lookup
- current local scale/stability smoke - synthetic fixture corpus confirmed report paths remain fast and detached tasks remain acceptable; prepared-corpus Electron smoke is deferred because the current visual smoke contract intentionally asserts zero evidence at startup
- current assessment from area context review - do not add broad radius assessment creation yet; future path should be selected-entity assessment or explicit area analyst note with source radius snapshot and boundary confirmation
- current scoped zKill/live trace pass - local system resolver and scoped route builder verified offline; live smoke path now prints DB path, resolved system, route, live gate estimate, queued refs, API counts, preview time range, and the non-evidence freshness boundary
- current assessment citation validation/status pass - assessment memory now records citation status/details and rejects missing cited killmail IDs or actor-scope citation mismatches without mutating evidence
- current compaction preview interlock pass - read-only preview can produce an assessment-create payload, and explicit artifact creation validates citation status while preserving killmail/activity counts
- current scoped discovery UI decision - use the existing Actions pane and `manual.discovery` service for system/radius queue-only discovery, including local system-name resolution and non-observation wording
- current live scoped zKill smoke artifact pass - refusal path verified locally and success/failure paths now write structured review artifacts under `.tmp/live-scoped-zkill-smoke`
- current evidence-rule regression pass - `verify:all` now runs 48 scripts including an evidence-boundary manifest and report-candidate hydration checks that assert raw ESI payloads and evidence IDs do not change during metadata hydration
- current controlled actor workflow - fixture path proves actor scope to queued refs, ESI expansion, stored evidence, actor report, queue state, and optional assessment UI path without passive collection
- current controlled area workflow - fixture path proves local topology radius scope to capped collection, stored evidence, radius report observations, and repeated/multi-system presence language without ownership/staging claims
- current live expansion smoke - typed actor name resolved through ESI, zKill refs queued as possible evidence, one selected ref expanded through ESI, and reports confirmed partial sample boundaries
- current metadata hydration UI - actor report can preview candidate entity IDs, estimate ESI name calls, run metadata-only hydration, and refresh labels without evidence mutation
- current structured report expansion decision - radius backend response is complete; implementation now waits for renderer presentation
- current retention compaction write decision - no compaction artifact write this milestone; preview remains read-only and evidence deletion remains blocked
- current controlled workflow checkpoint - no blocker; next milestone proceeds with local scale/stability smoke after renderer modularization, radius presentation, watch authoring, and radius hydration

These commits move the earlier rigging gaps into an initial presentation checkpoint. The main remaining risk is no longer missing service vocabulary; it is preserving the service/evidence boundary while adding further executable UI actions and future retention actions without turning passive status views or preflights into hidden collection/destructive triggers.
