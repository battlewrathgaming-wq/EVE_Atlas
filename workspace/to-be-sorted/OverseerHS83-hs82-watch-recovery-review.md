# Overseer HS83 - HS82 Watch Recovery Review

Date: 2026-05-26
Role: Atlas Overseer
Status: accepted
Milestone: Atlas Storage And Runtime Hardening

## Decision

HS82 is accepted.

Dev implemented the Watch Recovery Diagnostic And Resumable Intent Readout as a read-only `Watch_offline` extension from existing durable state.

## Accepted Behavior

- `Watch_offline.watches[]` includes `recovery` and `next_safe_action`.
- Recovery derives from existing Watch rows, fetch/API logs, provider warnings, Discovery refs, and Evidence/activity counts.
- Per-Watch readout includes durable intent source, session/armed state, expected next run time, observed movement, reconstructed scope, pending ref count, latest fetch/API activity, provider deferral, orphaned run signal, missed-slot signal, and next safe action.
- Next safe action values are implemented: `arm_required`, `wait`, `drain_pending_refs`, `ready_for_discovery`, `review_orphan`, `recover_missed_slot_when_capacity_allows`, `complete_enough_alpha`.
- System/radius recovery distinguishes valid stored scope, no stored included-system scope, and malformed/unparseable stored scope.
- Valid included-system scope is used for system/radius local queue/evidence counts.
- Missing or malformed stored scope reports limitation instead of guessing exact radius membership.

## Boundary Confirmation

No provider calls, Evidence creation, Discovery ref mutation, Watch row mutation, metadata hydration, Watch arming, sequencer persistence, stale/expired mutation, schema migration, UI work, retention/deletion change, broad provider queue, high-volume request ledger, or exact packet replay was added.

## Review Notes

The earlier concern about silently treating malformed stored radius scope as empty scope is resolved. The scheduler now exposes parse status, and `Watch_offline` reports malformed or not-stored scope distinctly.

The implementation keeps the HS82 timer-led model intact:

```txt
Watch row = durable payload contract
Timer / sequencer = payload-agnostic conductor
Worker = engine that moves the Watch payload
```

The diagnostic does not replay exact packets. It derives missed-slot recovery from expected next run time versus observed movement.

## Verification

- `npm.cmd run verify:watch-offline-readout` passed.
- `npm.cmd run verify:watch-scheduler` passed.
- `npm.cmd run verify:watch-executor` passed.
- `npm.cmd run verify:restart-recovery` passed.
- `npm.cmd run verify:queue-api-evidence-write` passed.
- `npm.cmd run verify:queue-selection` passed.
- `npm.cmd run verify:queue-scope-isolation` passed.
- `npm.cmd run verify:manual-discovery` passed.
- `npm.cmd run verify:hydration` passed.
- `npm.cmd run verify:db-integrity` passed.
- `npm.cmd run verify:service-registry` passed.
- `npm.cmd run verify:migrations` passed.
- `npm.cmd run verify:all` passed, 65 scripts.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery scanned 9 working-set files.
- Warning count: 594.
- Warning classes: cross-project-borrowing 90, lab-quarantine-borrowing 325, atlas-candidate 179.
- `git diff --check` passed.

## Deferred

- Persisted sequencer packet table.
- Durable high-volume request-attempt ledger.
- Exact packet replay.
- Durable Live cooldown/lockout storage.
- Watch timing/backoff mutation for provider capacity deferral.
- Operator-facing UI presentation of the recovery readout.

## Current State

`workspace/current.md` is refreshed to resting state. No Dev runway is open.
