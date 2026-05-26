# Overseer HS82 - HS81 Systems Advisory Review

Date: 2026-05-26
Role: Atlas Overseer
Status: accepted
Milestone: Atlas Storage And Runtime Hardening

## Decision

Accept the Systems Designer HS81 recommendation.

Atlas should focus next on Watch restart recovery and resumable intent, not durable request-control counting.

## Accepted Direction

The next Dev packet should be:

```txt
Watch Recovery Diagnostic And Resumable Intent Readout
```

This is a read-only recovery diagnostic from existing durable tables. It should prove Atlas can restart, explain Watch state, prefer local pending work before fresh provider work, and avoid provider hammering through Watch cadence and disarmed startup.

## Accepted Model

```txt
Watch config = durable intent
Fetch/API logs = recent execution evidence
Discovery refs = returned zKill work awaiting ESI/cache handling
Evidence = completed truth
Watch recovery readout = derived operator state
```

## Rejected For Next Step

- broad provider work queue
- high-volume request-attempt ledger
- making `discovered_killmail_refs` the sequencer
- direct Live radius
- treating waiting as failure
- coupling hydration to request-control
- UI redesign
- schema migration unless Dev proves the read-only diagnostic cannot be built from existing state

## Deferred

- persisted sequencer packet table
- stale/expired Discovery ref mutation
- durable Live cooldown/lockout storage
- full provider orchestration
- operator-facing full timeline/story UI

## Decisions Accepted For Dev

- Watch restart remains disarmed by default.
- Live cooldown/lockout may remain volatile for alpha.
- Provider-capacity deferral should appear in the recovery readout first; Watch timing/backoff mutation is deferred.
- Radius recovery should use included-system scope where available, or explicitly report when it cannot.

## Verification Correction

The Systems advisory named `verify:app-restart-recovery`, but Atlas package scripts expose:

```powershell
npm.cmd run verify:restart-recovery
```

Use the package command in the Dev runway.

## Expected Dev Packet

Open HS82 in `workspace/current.md` with expected handoff:

```txt
workspace/DevHS82-watch-recovery-diagnostic-readout.md
```
