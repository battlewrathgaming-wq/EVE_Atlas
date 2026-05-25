# OverseerHS54 - Watch Recovery / Offline Readout Scope

Date: 2026-05-25
Role: Atlas Overseer
Status: scope of works / acceptance criteria

## Purpose

Define the next bounded Atlas work area after HS53: post-restart Watch recovery and offline/local readout.

This is a scope of works, not implementation approval. It should guide a future audit, UIUX/material pass, or Dev runway only after Human/Overseer explicitly opens one.

## Background

HS53 confirmed:

- Watch definitions, schedule timestamps, backoff, and last success/error persist in SQLite.
- Task runner state, active locks, cancellation state, interval timer, active task pointer, and `sessionArmed` are volatile.
- After restart, Watches may be due but remain blocked by `session_not_armed` until the operator explicitly arms the session again.
- Watch execution is session-armed, live-gated, capped, and task-wrapped.

Human design context:

- Post-restart unarmed is a common state.
- It should not read as an error.
- It is a normal offline/local posture.
- Atlas should have useful local context to show while Watch is not armed.
- Future display work may use a quiet offline pane or readout, but this scope does not design or implement that pane.

## Scope Of Works

### 1. Verify Post-Restart Watch State

Confirm what Atlas can know after restart without arming Watch:

- configured watches
- due watches
- blocked reason, especially `session_not_armed`
- last checked / last success
- next eligible / next poll
- backoff / last error
- active/inactive watch configuration
- queued Discovery refs related to watches, if exposed
- local Evidence/report context related to the watch target, if already available

### 2. Map Persisted Vs Volatile State

Produce a simple map:

| State | Persisted? | Source | Intended readout |
| --- | --- | --- | --- |
| Watch definition | yes/no | table/service | operator-facing / diagnostic |
| Due status | yes/no | schedule/service | operator-facing |
| Session armed | no | executor memory | operator-facing |
| Active task | no | task runner memory | point-of-need |
| Last success/error | yes/no | watch row/fetch run | point-of-need |

### 3. Confirm Existing Service / Renderer Exposure

Identify whether existing services and renderer surfaces expose enough to state:

```txt
Configured Watch exists.
Schedule may be due.
Session is unarmed because runtime restarted.
No collection is active.
Local context is still available.
Operator can arm when ready.
```

Do not implement missing exposure in this scope. Record missing fields or ambiguous labels as future packet candidates.

### 4. Define Offline/Local Readout Needs

List what a future display/material pass should be able to show without enabling collection:

- Watch exists.
- Watch is due, idle, blocked, or in backoff.
- Blocked due to session not armed.
- External API/live gate state, if relevant.
- Last checked / next eligible, where known.
- Known local context remains available.
- No collection is active.
- Arm Watch is an explicit action, not startup behavior.

This should end at display-readiness, not UI implementation.

### 5. Identify Risks And Gaps

At minimum, check for:

- due state being mistaken for active collection
- unarmed state being mistaken for error or broken Watch
- local/offline context being hidden when Watch is not armed
- task runner volatility being confused with lost watch configuration
- backoff/error state being too diagnostic for first-read display
- copy that implies live feed, background collection, or hidden monitoring

## Non-Goals

- Do not implement UI.
- Do not design a complete offline pane.
- Do not change Watch scheduler or executor behavior.
- Do not persist `sessionArmed`.
- Do not start collection on startup.
- Do not run live/API checks.
- Do not change backend, schema, persistence, bridge, IPC, service, payload, command, or renderer behavior from this scope alone.
- Do not rename Watch, Marked, Evidence, Discovery, External API, or Assessment Memory.

## Acceptance Criteria

A future audit/material packet satisfies this scope when:

1. It identifies all relevant persisted Watch state available after restart.
2. It identifies all relevant volatile state that is intentionally lost on restart.
3. It confirms whether `session_not_armed` or equivalent block reason is exposed clearly enough.
4. It confirms no collection starts on app startup or passive page load.
5. It confirms due Watches can remain visible without implying active Watch execution.
6. It confirms last checked / next eligible / backoff / error state availability, or records the missing fields.
7. It identifies what local context can be shown while offline/unarmed without live calls.
8. It separates operator-facing readout needs from diagnostic-only state.
9. It lists any missing state fields, ambiguous labels, or confusing service boundaries.
10. It produces either:
    - a no-Dev-needed finding, or
    - one bounded future Dev packet recommendation with exact files/services/verification.

## Meaning Guardrails

- `Watch` means active routine checking under accepted gates/cadence/lookback.
- `Marked` means attention/interest and does not imply Watch.
- Due does not mean running.
- Configured does not mean armed.
- Armed is session-local and explicit.
- Offline/unarmed does not mean broken.
- Local context may be available without live/API access.
- External API disabled means provider access is gated, not that local memory is unusable.

## Candidate Verification

Use offline checks only unless Human explicitly authorizes live/API work:

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

If implementation is later opened, also consider:

```powershell
npm.cmd run smoke:electron
```

No live smoke is implied by this scope.

## Suggested Future Packet Names

Audit/material packet:

```txt
workspace/OverseerHS55-watch-recovery-offline-readout-audit.md
```

Dev packet, only if later accepted:

```txt
workspace/DevHS##-watch-recovery-offline-readout.md
```

## Recommended Next Step

Open a read-only Watch Recovery / Offline Readout Audit if the Human wants this to move from scope to active work.

Keep UI/material production open-ended until the state inventory is verified and the shared display/material workflow is ready to consume it.
