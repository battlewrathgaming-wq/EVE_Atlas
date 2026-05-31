# DevHS56: Watch_offline Readout Support

Date: 2026-05-25
Role: Dev
Milestone: Watch_offline Readout Support

## Scope

Implemented the bounded read-only `Watch_offline` support layer requested by `workspace/current.md`.

This is backend/main-process aggregation only. No renderer UI redesign, offline pane, live/API call path, collection behavior, persistence policy, schema, migration, command rename, IPC rename, payload rename, or contract rename was introduced.

## Files Changed

- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-watch-offline-readout.js`
- `scripts/verify-group.js`
- `package.json`
- `workspace/DevHS56-watch_offline-readout-support.md`

## Read-Only Readout Shape

New renderer-eligible read-only command:

```txt
watch.offline_readout
```

Returned model:

```txt
model: Watch_offline
classification: read-only watch offline readout
generated_at
session_armed
collection_active
active_task_id
live_api_enabled
local_context_available
summary
watches[]
state_basis[]
```

Per-watch fields:

```txt
watch_type
watch_id
scope_key
scheduler_state
session_armed
collection_active
time_eligible
eligible_if_armed
next_eligible_at
blocked_reasons
local_context_available
local_context.queue
local_context.evidence
last_polled_at
last_success_at
last_error_at
backoff_until
next_poll_at
source
state_basis[]
```

## Derived Fields And Basis

- `session_armed`: copied from volatile `WatchSessionExecutor` status.
- `collection_active`: `true` only when executor status has an `active_task_id`.
- `time_eligible`: true when `not_due`, `backoff`, and `inactive` are absent from scheduler blocked reasons.
- `eligible_if_armed`: true only when the Watch is time-eligible, the session is not armed, no collection is active, and the only block is `session_not_armed`.
- `next_eligible_at`: `backoff_until` when in backoff, otherwise `next_poll_at` when not due or scheduled.
- `blocked_reasons`: copied from existing `watch.schedule` output.
- `state_basis`: explicit explanation of which existing state produced the readout.
- `local_context_available`: derived from cheap local counts only.
- `local_context.queue`: count of local `discovered_killmail_refs` scoped to the Watch.
- `local_context.evidence`: count of local `activity_events` and distinct killmails scoped to the Watch.

Actor local context counts use matching actor discovery refs plus activity events for the watched entity. System/radius local context counts use matching system-radius discovery refs plus activity events for the center system only; broader radius evidence aggregation is intentionally omitted to avoid risky joins or report rewrites.

## Post-Restart Behavior

The new readout preserves the core truth:

```txt
Configured Watch exists.
Session is unarmed because runtime restarted.
No collection is active.
Local context is still available.
Operator can arm when ready.
```

`sessionArmed` remains volatile. It is read from executor memory and is not persisted.

Readout generation calls the existing scheduler and local SQLite read queries only. It does not arm the executor, dispatch a tick, create a task, start collection, call zKill, call ESI, write evidence, hydrate metadata, or mutate Watch state.

## Renderer Involvement

No renderer files were changed.

The new service command is renderer-eligible so future presentation can consume backend-owned readout truth, but the renderer does not own `Watch_offline` interpretation in this packet.

## Guardrail Confirmation

- No UI redesign.
- No offline pane design.
- No live/private/API calls added.
- No collection on startup or passive readout generation.
- `sessionArmed` remains volatile and unpersisted.
- No schema or migration changes.
- No command, IPC, payload, persistence, or contract renames.
- No `Watcher` class/state/service concept introduced.
- `Radar` was not promoted into Atlas backend, bridge, service, payload, or state-model terminology.
- Watch, Marked, Evidence, Discovery, External API, Assessment Memory, provenance, and storage meanings were preserved.

## Verification Run

```powershell
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:restart-recovery
npm.cmd run verify:background-execution
npm.cmd run verify:live-api-gate
npm.cmd run verify:renderer-shell
npm.cmd run verify:protected-terms
npm.cmd run verify:all
git status --short --branch
```

Result:

```txt
PASS - verify:watch-offline-readout
PASS - verify:watch-scheduler
PASS - verify:watch-executor
PASS - verify:restart-recovery
PASS - verify:background-execution
PASS - verify:live-api-gate
PASS - verify:renderer-shell
PASS - verify:protected-terms; warning-only advisory output
PASS - verify:all; 63 scripts, includes verify:watch-offline-readout
STATUS - ## main...origin/main with HS56 changed files and new handoff artifact
```

Final protected-term output:

```txt
files scanned: 6
warning count: 456
warning classes: atlas-candidate=237, lab-quarantine-borrowing=180, cross-project-borrowing=39
confirmation: warning-only; no renames performed; no protected-word JSON updates performed
```

Primary noisy classes were expected around accepted `readout` wording, Watch terms, service-command strings, and existing verification group labels.

## Recommended Next Packet

Proceed to the planned read/write hardening packet. Suggested focus: tighten how Watch authoring, Watch schedule rows, queue state, and run-result recording preserve restart/recovery truth under partial failure without changing the `Watch_offline` readout shape unless Overseer explicitly reopens it.
