# Overseer HS253: HS252 Queue / Clock Semantics Acceptance

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Reviewed artifact: `workspace/DataEngineeringHS252-queue-clock-current-work-semantics-review.md`

## Decision

Accepted.

HS252 answered the advisory request and confirmed the useful concern: `runtime.queue_clock_posture.preview` is safe as read-only posture, but `zkill_discovery.provider_backed_work` can blur current work with provider capability when no pending Discovery refs, no explicit manual discovery scope, and no due/eligible Watch acquisition intent are present.

This is not a safety breach. The existing preview still reports:

- provider calls: `0`
- queue dispatches: `0`
- no Evidence/EVEidence writes
- no Hydration writes
- no Discovery ref mutation
- no runtime enforcement
- no command blocking

The issue is semantic: later dispatcher, enforcement, UI, or operator readout work must not inherit a count that sounds like current provider-backed work when Atlas only knows that provider capability exists.

## Accepted Meanings

Accepted for the next proof:

- current local work: existing local facts/candidates Atlas can inspect without inventing scope
- current provider-backed work: explicit local/Watch/manual intent where the next movement would contact a provider if later authorized by all gates
- provider capability only: a known provider action exists, but no current work item or explicit scope exists
- manual discovery intent: present only when explicit manual scope/target input exists
- Watch acquisition intent: derived from durable Watch rows/scope/cadence, separate from manual discovery and separate from Watch/background Hydration

Provider capability must not inflate summary current-work counts.

## Accepted Next Packet

Open a Dev packet for a read-only queue/clock no-intent semantics matrix.

Preferred shape:

- verifier-first
- fixture-only
- no live/API/provider calls
- no schema or persistence
- no dispatcher
- no runtime enforcement
- no UI
- narrow service readout/count correction only if the verifier proves the ambiguity

## Parked

- active dispatch
- provider calls
- provider-backed execution
- packet persistence
- schema-backed queues
- broad provider work queue
- making `discovered_killmail_refs` the sequencer
- runtime enforcement activation
- command blocking
- pruning/deletion execution
- support artifacts for packet state
- renderer/UI work

## Verification Basis

HS252 reported:

```txt
npm.cmd run verify:queue-clock-posture
npm.cmd run verify:patient-packet-identity-sparse
git status --short --branch
```

No live/API/provider calls were run.

