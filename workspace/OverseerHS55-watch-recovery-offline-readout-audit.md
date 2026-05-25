# OverseerHS55 - Watch Recovery / Offline Readout Audit

Date: 2026-05-25
Role: Atlas Engineering Audit / Overseer Review
Status: complete read-only audit

## Request Received

The Human asked Atlas Engineering Audit / Overseer Review to execute the active read-only packet in `workspace/current.md`, producing `workspace/OverseerHS55-watch-recovery-offline-readout-audit.md`. Scope: verify post-restart Watch/offline readout state for configured watches, due watches, session armed / `session_not_armed`, blocked reasons, last checked / next eligible, backoff / last error, persisted versus volatile state, existing service/renderer exposure, local/offline context, and operator-facing versus diagnostic-only readout needs.

No implementation, offline pane design, live/API checks, collection, persistence mutation, backend/schema/IPC/service/payload/UI changes, or term renames were authorized.

## Executive Findings

Atlas already has enough backend/service state to honestly say:

```txt
Configured Watch exists.
Session is unarmed because runtime restarted.
No collection is active.
Local context is still available.
Operator can arm when ready.
```

It can also show schedule state, blocked reasons, next poll, backoff, last polled, last success, last error, live API gate state, and local queue/evidence/readiness context without live/API calls.

The main display-readiness gap is that `watch.schedule` treats "due" as runnable-due after gates. When session is unarmed, a time-eligible Watch is returned as `blocked` with `session_not_armed`, not as `due`. A future operator readout can infer "would be eligible if armed" when blocked reasons exclude `not_due`, `backoff`, and `inactive`, but that state is not explicit today.

## Files And Code Paths Reviewed

Source of intent and authority:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/OverseerHS54-watch-recovery-offline-readout-scope.md`
- `workspace/critical/critical-terms.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`

Implementation and verification:

- `src/main/db/schema.sql`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/taskRunner.js`
- `src/main/services/appReadinessService.js`
- `src/main/reports/corpusHealthReport.js`
- `src/main/support/operatorDebugTracePack.js`
- `src/renderer/queueWatch.js`
- `src/renderer/readiness.js`
- `src/renderer/reports.js`
- `src/renderer/tasks.js`
- `src/renderer/actions.js`
- `src/renderer/index.html`
- `scripts/verify-watch-scheduler.js`
- `scripts/verify-watch-executor.js`
- `scripts/verify-app-restart-recovery.js`
- `scripts/verify-background-execution.js`
- `scripts/verify-renderer-shell.js`
- `package.json`

## Persisted Versus Volatile State

| State | Persisted? | Source | Current exposure | Intended readout |
| --- | --- | --- | --- | --- |
| Actor Watch definition | Yes | `watchlist_entities` | `watch.list`, `watch.schedule`, renderer Watch list | Operator-facing summary |
| System/radius Watch definition | Yes | `system_watches` | `watch.list`, `watch.schedule`, renderer Watch list | Operator-facing summary |
| Active/inactive Watch config | Yes | `is_active` in watch tables | `watch.list`; `watch.schedule` exposes `inactive` as blocked reason but omits raw `is_active` | Operator-facing as active/paused; diagnostic details optional |
| Due/runnable status | Derived, not persisted | `watch.schedule` from timestamps plus gates | `due`, `blocked`, `scheduler_state`, `blocked_reasons` | Operator-facing, but needs clearer "eligible if armed" distinction |
| Time eligibility / next eligible | Partly persisted, partly derived | `next_poll_at`, `backoff_until`, `now` | next poll/backoff shown; no explicit `time_eligible` field | Operator-facing |
| Session armed | No | `WatchSessionExecutor.sessionArmed` memory | `watch.executor.status`; schedule can accept a preview `sessionArmed` payload | Operator-facing |
| `session_not_armed` | Derived, not persisted | `watch.schedule`; executor `tick`/status | `blocked_reasons`, executor `last_blocked_reason`, tick `reason` | Operator-facing, normal post-restart state |
| Active task | No | `TaskRunner` memory and executor `activeTaskId` | `watch.executor.status`, `task.list`, `task.get` | Point-of-need; "none" operator-facing |
| Last checked | Volatile only for executor tick; generated time only for schedule | `lastTick`, schedule `now` | renderer shows `Generated` and executor `Last Tick` | Needs label decision: operator-facing "readout refreshed" vs diagnostic "last tick" |
| Last polled | Yes | watch rows | `watch.schedule`, renderer Watch rows | Operator-facing |
| Last success/error | Yes | watch rows | `watch.schedule`, renderer Watch rows | Operator-facing summary; details diagnostic |
| Backoff | Yes | `backoff_until` | `watch.schedule`, renderer Watch rows | Operator-facing summary |
| Last dispatch | No | executor memory | `watch.executor.status` | Diagnostic / point-of-need |
| Task history / locks | No | `TaskRunner` memory | `task.list`, `task.get`, debug trace summarizes current runner only | Diagnostic; do not imply persisted history |
| Queue refs related to watch targets | Yes | `discovered_killmail_refs` | `queue.selection`, `report.queue`, debug trace queue status; not directly joined into Watch row | Operator-facing if scoped; service join missing |
| Local Evidence/report context | Yes | `killmails`, `activity_events`, reports, corpus health | `report.actor`, `report.radius`, `report.corpus_health`, readiness counts | Operator-facing local context |
| External API gate | No policy env/state persisted in DB | env + service gate | `app.readiness`, `live.gate`, `watch.schedule` `live_api_enabled` | Operator-facing gate state |

## Post-Restart Watch State Findings

- Fresh `WatchSessionExecutor` starts with `sessionArmed=false`, `activeTaskId=null`, and `lastBlockedReason='session_not_armed'`.
- Restart does not persist or restore active task IDs, active locks, intervals, cancellation state, task history, last dispatch, or session armed state.
- Watch definitions and schedule metadata survive restart because they live in `watchlist_entities` and `system_watches`.
- A passive post-restart status/tick does not dispatch collection; `tick` returns blocked with `reason: 'session_not_armed'`.
- If a Watch is active and otherwise time-eligible, `watch.schedule` with `sessionArmed:false` returns it under `blocked` with `blocked_reasons: ['session_not_armed', ...]`, not under `due`.
- Backoff and future `next_poll_at` remain visible as blocked reasons (`backoff`, `not_due`).
- Last success, last error, last polled, backoff, next poll, lookback, caps, and source identity are available from schedule rows.
- There is no persisted "last checked after restart" for passive readout. The available fields are schedule `now` / renderer "Generated" and volatile executor `last_tick`.

## Existing Service / Renderer Exposure

Services:

- `watch.list`: renderer-eligible read-only list of actor and system/radius Watch rows.
- `watch.schedule`: renderer-eligible read-only schedule/status service; exposes `now`, `session_armed`, `live_api_enabled`, `due`, `blocked`, and full `watches` list with `scheduler_state`, `blocked_reasons`, next poll/backoff/last success/error/source/caps.
- `watch.executor.status`: renderer-eligible read-only volatile executor state with `session_armed`, `active_task_id`, poll interval, last tick, last dispatch, last blocked reason, and schedule.
- `watch.executor.arm`: renderer-eligible explicit evidence-creating command requiring confirmation; can dispatch at most one due Watch.
- `watch.executor.disarm`: renderer-eligible runtime-control command.
- `task.list` / `task.get`: renderer-eligible read-only current in-memory task history.
- `app.readiness`, `live.gate`, `report.corpus_health`, `report.actor`, `report.radius`, `queue.selection`, and `report.queue` expose local/offline context without live calls.

Renderer:

- Queue / Watch surface calls `watch.schedule`, `watch.executor.status`, `watch.executor.arm`, `watch.executor.disarm`, `watch.create`, and `watch.list`.
- The Watch surface renders generated time, session armed, live API enabled, due count, blocked count, total watches, Watch source, scheduler state, blocked reason badges, next poll, backoff, last polled, last success, last error, lookback, and run caps.
- The executor panel renders session armed, active task, poll interval, last tick, last dispatch, last blocked reason, latest tick status, and latest tick reason.
- The renderer does not directly call `actor.watch` or `system.radius.watch`; those are not renderer-eligible and execution routes through session arming.
- Current renderer has preview checkboxes for `watch.schedule` `sessionArmed` and `liveApiEnabled`. These can preview gate outcomes, but they are not the actual executor state. The actual session state comes from `watch.executor.status`.

## Local / Offline Context Availability

Available without live/API calls:

- Configured Watch rows and schedule state.
- Readiness counts and live API disabled/enabled state.
- Corpus health counts and freshness.
- Queue preview and queue report over local `discovered_killmail_refs`.
- Actor/radius reports over stored local Evidence.
- Assessment Memory list/details.
- Current in-memory task list/details.
- Debug trace pack can summarize local DB and current task history, but writing the pack is a support artifact action and was not run in this audit.

Not directly combined today:

- Watch rows do not include scoped queue counts or local Evidence/report context inline.
- A future readout would need to call existing local services separately, or a bounded service addition could aggregate existing read-only Watch, queue, and evidence context.

## Operator-Facing Versus Diagnostic-Only Needs

Operator-facing:

- Watch exists/configured.
- Watch source and type.
- Active/inactive configuration.
- Session is unarmed after restart; this is normal and not an error.
- No collection is active.
- External API/live provider access is disabled/enabled/gated.
- Schedule is blocked/due/not due/in backoff.
- Next poll / next eligible where known.
- Last polled / last success / last error as simple recency.
- Local context remains available.
- Arm Watch is explicit.

Diagnostic-only or point-of-need:

- Raw watch IDs.
- Raw scope keys.
- `active_task_id`.
- Last dispatch object.
- Poll interval in milliseconds.
- Full task progress/warnings/results.
- Raw queue/ref status internals.
- Fetch/API logs and debug trace pack details.

## Display-Readiness Findings

- Ambient posture and explicit status/action can be supported by existing state, but the future display should keep them separate.
- Ambient posture can safely say local/offline/unarmed only if it does not imply live feed or hidden collection.
- Explicit status can name `session_not_armed`, External API gate, blocked reasons, no active task, and Arm action.
- Existing services support the truth model, but not a polished operator readout model.
- `due` currently means runnable-due after gates, not merely time-eligible. Future material should avoid saying "due" without explaining gate context.
- `blocked` is semantically correct but too broad for first-read display; `session_not_armed`, `live_api_disabled`, `not_due`, `backoff`, and `inactive` need different presentation weights.
- The renderer's schedule preview checkboxes could confuse previewed state with actual executor state unless future copy distinguishes "preview gate inputs" from "actual session state."

## Missing Fields / Ambiguous Labels

- Missing explicit `time_eligible` or `eligible_if_armed` field.
- Missing explicit `next_eligible_at` field that resolves `next_poll_at` versus `backoff_until`.
- Missing explicit `collection_active` boolean. It can be inferred from `active_task_id`, but operator copy should not rely on inference.
- Missing clear persisted/volatile marker in the renderer Watch panel.
- Missing Watch-scoped local context summary: pending/failed/expanded refs and local evidence counts for that Watch target.
- `Last Tick` is diagnostic and volatile; future operator copy may want "Readout refreshed" instead.
- `Due Watches` count is 0 when session is unarmed even if a Watch would run after arming; this is technically correct but display-risky.

## Risks

- Due state could be mistaken for active collection if the UI does not distinguish runnable, blocked, and running.
- Unarmed state could be mistaken for an error or broken Watch.
- Local/offline context can be hidden behind Watch gating, even though reports/queue/readiness remain usable.
- Task runner volatility could be mistaken for lost Watch configuration after restart.
- Backoff/last error can overwhelm first-read display if raw diagnostic details lead.
- Preview checkboxes for schedule gates can be mistaken for the real executor state.
- Any copy that implies live feed, background collection, hidden monitoring, or startup watching would violate the Watch meaning guardrails.

## HS54 Acceptance Criteria Coverage

1. Identifies all relevant persisted Watch state available after restart: satisfied.
2. Identifies all relevant volatile state intentionally lost on restart: satisfied.
3. Confirms whether `session_not_armed` is exposed clearly enough: exposed in service state and verification, but needs operator-facing treatment.
4. Confirms no collection starts on app startup or passive page load: satisfied by code inspection and verification.
5. Confirms due Watches can remain visible without implying active Watch execution: partly satisfied; blocked Watch rows are visible, but time-eligible-if-armed is implicit.
6. Confirms last checked / next eligible / backoff / error availability: partly satisfied; next poll, backoff, last polled/success/error are available; explicit next eligible and persisted last checked are missing.
7. Identifies local context showable while offline/unarmed: satisfied.
8. Separates operator-facing readout needs from diagnostic-only state: satisfied.
9. Lists missing fields, ambiguous labels, and confusing service boundaries: satisfied.
10. Produces bounded future Dev packet recommendation: satisfied below.

## Recommended Bounded Future Dev Packet

Open one small read-only service/display-support packet only if Human/Overseer wants implementation:

```txt
DevHS##-watch-recovery-readout-support
```

Scope:

- Add a read-only Watch recovery/readout model or extend `watch.schedule` with explicit derived fields only.
- Candidate fields: `time_eligible`, `eligible_if_armed`, `next_eligible_at`, `collection_active`, `state_layer` or `state_basis`, and optionally local queue/evidence counts scoped to the Watch target.
- Keep `sessionArmed` volatile and never persisted.
- Do not start collection, call live APIs, alter Watch execution, rename commands, or design the UI pane.
- Verification: `verify:watch-scheduler`, `verify:watch-executor`, `verify:restart-recovery`, `verify:background-execution`, `verify:renderer-shell`, `verify:protected-terms`; add/update a focused readout fixture if fields are added.

No Dev packet is strictly required to preserve safety; it is worth opening only to reduce operator ambiguity in future UIUX/Lab material work.

## Required Human Decisions

- Should future operator copy say "eligible if armed" or use another Atlas-owned phrase?
- Should a Watch recovery readout aggregate local queue/evidence context, or should future UI compose existing services client-side?
- Should `External API` remain the operator-facing phrase in this Watch readout, or be passed to Lab/presentation for later translation while preserving gate meaning?
- How much backoff/error detail belongs in first-read operator state versus diagnostic drawer/detail?

## Verification Run

Required offline verification:

```txt
npm.cmd run verify:watch-scheduler - passed
npm.cmd run verify:watch-executor - passed
npm.cmd run verify:restart-recovery - passed
npm.cmd run verify:background-execution - passed
npm.cmd run verify:live-api-gate - passed
npm.cmd run verify:renderer-shell - passed
npm.cmd run verify:protected-terms - passed; working set clean, scanned 0 files, warning count 0
git status --short --branch - clean before handoff creation
```

`verify:all` was not run because the audit did not find a cross-cutting renderer/service safety regression beyond the focused Watch/readout issues above, and the required focused renderer/service checks passed.

## Guardrail Confirmation

- No implementation was performed.
- No offline pane was designed.
- No live/API checks were run.
- No collection was started.
- No persistence changes were performed.
- No backend, schema, IPC, service, payload, command, or UI changes were made.
- No protected-term updates or renames were performed.
- This handoff file is the only intended workspace change from this audit.
