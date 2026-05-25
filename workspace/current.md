# AURA Atlas Current Work

Status: Idle after accepted Watch recovery / offline readout audit
Last updated: 2026-05-25

## Active Milestone

Milestone: Watch Recovery / Offline Readout State Audit

Source of intent:

- Human direction on 2026-05-25 to focus on post-restart Watch readout as a common state.
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/OverseerHS54-watch-recovery-offline-readout-scope.md`
- `workspace/OverseerHS55-watch-recovery-offline-readout-audit.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Current focus: HS55 is accepted as a read-only audit. Atlas is not currently authorized for implementation. Future work should be selected deliberately from the accepted findings below.

## Executor

Current executor: none; awaiting Human / Overseer selection.

Expected handoff filename: none until a new packet is opened.

## Accepted HS55 Understanding

The audit confirmed Atlas can already state the core post-restart Watch truth without live/API calls or collection:

```txt
Configured Watch exists.
Session is unarmed because runtime restarted.
No collection is active.
Local context is still available.
Operator can arm when ready.
```

Accepted findings:

- Watch definitions, active/inactive config, last polled, last success/error, next poll, backoff, and local queue/evidence context are persisted or locally available.
- `sessionArmed`, active task, last tick, last dispatch, and task runner state are intentionally volatile after restart.
- A passive restart/status path does not start collection.
- `session_not_armed` is available through existing scheduler/executor state and is a normal post-restart block reason, not an error.
- `due` currently means runnable after gates; a time-eligible Watch blocked by unarmed session appears as blocked, not due.
- Local/offline context remains available while Watch execution is unarmed.
- Current services expose enough truth for future display work, but not a polished operator readout model.

## Remaining Work Options

No work is active by default.

Recommended optional future packet:

```txt
DevHS##-watch-recovery-readout-support
```

Candidate scope:

- Add or refine a read-only Watch recovery/readout model using derived fields only.
- Candidate fields: `time_eligible`, `eligible_if_armed`, `next_eligible_at`, `collection_active`, `state_layer` / `state_basis`, and optionally Watch-scoped local queue/evidence counts.
- Keep `sessionArmed` volatile and never persisted.
- Do not start collection, call live APIs, alter Watch execution, rename commands, or design the UI pane.

Open Human / Overseer decisions:

- Whether to use "eligible if armed" as the Atlas-owned operator phrase, or choose different wording.
- Whether local queue/evidence context should be aggregated by a read-only service or composed in the renderer from existing services.
- How much backoff/error detail belongs in first-read operator state versus a diagnostic/detail surface.
- Whether to open the optional readout-support packet now or leave Watch recovery findings parked for UIUX/Lab material work.

## Guardrails

- No implementation is authorized by this idle state.
- No UI implementation or offline pane design is authorized.
- No backend, schema, persistence, bridge, IPC, service, payload, command, or contract changes are authorized.
- Do not persist `sessionArmed`.
- Do not start collection on app startup or passive page load.
- No live/private/API calls unless explicitly authorized by the Human.
- Preserve Atlas meanings for Watch, Marked, Evidence, Discovery, External API, Assessment Memory, and provenance.

## Stop Conditions

Return to Human / Overseer before opening work if:

- implementation would require live/private provider calls
- a packet would mutate the user's real local database
- Watch due/armed/running/blocked meanings need product wording decisions first
- display work risks implying live feed, background collection, hidden monitoring, or startup watching
- UIUX/Lab advice starts to rename Atlas-owned backend or bridge meaning

## Required Verification

HS55 reported the following offline verification:

```powershell
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:restart-recovery
npm.cmd run verify:background-execution
npm.cmd run verify:live-api-gate
npm.cmd run verify:renderer-shell
npm.cmd run verify:protected-terms
git status --short --branch
```

Reported result: all focused checks passed. `verify:protected-terms` scanned no changed files before handoff creation and returned warning count 0. `verify:all` was not required because the audit did not find a cross-cutting renderer/service safety regression.

## Evidence

Accepted handoff:

```txt
workspace/OverseerHS55-watch-recovery-offline-readout-audit.md
```

Accepted prior scope:

```txt
workspace/OverseerHS54-watch-recovery-offline-readout-scope.md
```

## Dev Handoff

No Dev packet is open.

If the optional readout-support packet is selected later, the Dev handoff should require:

- exact files/code paths changed
- derived readout fields added or clarified
- proof `sessionArmed` remains volatile
- proof no collection starts on startup/passive load
- proof no live/API calls are introduced
- focused verification command results
- protected-term warning output
