# AURA Atlas Current Work

Status: Idle after accepted Watch_offline readout support
Last updated: 2026-05-25

## Active Milestone

Milestone: Watch_offline Readout Support

Source of intent:

- Human direction on 2026-05-25: proceed with the readout support first, then focus on read/write hardening.
- Human naming and architecture direction on 2026-05-25: use `Watch_offline` for this line, avoid `Watcher`, ignore UX for now, and keep aggregation off the renderer where practical.
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/OverseerHS54-watch-recovery-offline-readout-scope.md`
- `workspace/OverseerHS55-watch-recovery-offline-readout-audit.md`
- `workspace/DevHS56-watch_offline-readout-support.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Current focus: HS56 is accepted. Atlas now has a backend/main-process read-only `Watch_offline` support model for post-restart/offline Watch truth. No Dev packet is currently open.

## Executor

Current executor: none; awaiting Human / Overseer selection for the read/write hardening line.

Expected handoff filename: none until a new packet is opened.

## Accepted HS56 Understanding

HS56 added the renderer-eligible read-only service command:

```txt
watch.offline_readout
```

Accepted model:

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

Accepted per-Watch fields:

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

Accepted implementation notes:

- `Watch_offline` aggregation lives in backend/main-process support code, not renderer-owned interpretation.
- `session_armed` remains volatile and comes from `WatchSessionExecutor` status.
- `collection_active` is true only when the executor reports an active task id.
- `time_eligible`, `eligible_if_armed`, and `next_eligible_at` are derived from existing scheduler state and block reasons.
- Local context counts are read-only and local. Actor counts use matching actor refs/events. System/radius counts use matching center-system refs/events only, avoiding broad radius joins.
- Readout generation does not arm the executor, dispatch a tick, create a task, start collection, call zKill, call ESI, write Evidence, hydrate metadata, or mutate Watch state.
- No renderer files were changed.

Core post-restart truth remains:

```txt
Configured Watch exists.
Session is unarmed because runtime restarted.
No collection is active.
Local context is still available.
Operator can arm when ready.
```

## Next Focus

Next selected line: read/write hardening.

Do not open a broad implementation packet from that phrase alone. The next packet should first scope a bounded hardening target, likely one of:

- Watch authoring/readout write-boundary consistency
- Watch schedule row mutation and run-result recording under partial failure
- queue state mutation/recovery under partial failure
- Evidence write idempotency and provenance completeness
- deletion/retention policy execution and footprint behavior

The next packet should preserve the accepted `Watch_offline` readout shape unless Human / Overseer explicitly reopens it.

## Guardrails

- No implementation is authorized by this idle state.
- No UI redesign or offline pane design is authorized.
- No live/private/API calls unless explicitly authorized by the Human.
- Do not persist `sessionArmed`.
- Do not start collection on startup, passive page load, or readout generation.
- Do not use `Watcher` as a class, user-facing state, or service concept.
- Do not promote `Radar` into Atlas backend, bridge, service, payload, or state-model terminology.
- Preserve Atlas meanings for Watch, Marked, Evidence, Discovery, External API, Assessment Memory, provenance, and storage.
- Treat `eligible_if_armed` as a technical field, not final human-facing copy.

## Stop Conditions

Return to Human / Overseer before opening work if:

- read/write hardening scope spans multiple persistence domains at once
- implementation would require live/private provider calls
- implementation would mutate the user's real local database
- a proposed fix would rename bridge, IPC, service, payload, command, or schema meaning
- Watch due/armed/running/blocked meanings need product wording decisions first
- retention/deletion behavior needs Human policy confirmation
- protected-term output suggests new terminology authority decisions are needed

## Required Verification

HS56 was accepted with:

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

Local Overseer verification result: all focused checks passed, and `verify:all` passed 63 scripts including `verify:watch-offline-readout`. `verify:protected-terms` passed warning-only with 456 expected advisory warnings across changed code/handoff files.

## Evidence

Accepted handoff:

```txt
workspace/DevHS56-watch_offline-readout-support.md
```

Accepted implementation files:

```txt
src/main/watchlist/watchOfflineReadout.js
src/main/services/mutatingActionService.js
src/main/services/serviceRegistry.js
scripts/verify-watch-offline-readout.js
scripts/verify-group.js
package.json
```

## Dev Handoff

No Dev packet is open.

The next Dev packet should be a bounded read/write hardening packet selected by Human / Overseer and should name:

- exact persistence/write boundary under review
- allowed files and non-goals
- expected failure/recovery cases
- required offline verification commands
- whether `verify:all` is required
