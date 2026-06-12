# OverseerHS365 - Discovery Next Seam Decision Surface

Status: decision surface
Date: 2026-06-07
Role: Overseer
Milestone: Atlas Storage And Runtime Hardening

## Purpose

Record the next-seam choice after HS363 accepted the fixture-only Discovery receipt projection proof.

This is not a Dev runway.

## Current Landing

Accepted proof chain:

```txt
due Watch / accepted scope
-> Discovery pickup packet proof
-> fixture Discovery candidate refs
-> fixture provider-return outcomes
-> canonical Discovery receipt basis
-> requested safe projection
```

Accepted boundary:

- Discovery owns canonical receipt basis.
- Watch is a scheduler and scope-authority source.
- A due Watch emits Discovery pickup intent; it does not acquire candidates itself.
- Candidate refs are possible leads, not Evidence/EVEidence and not task memory.
- `held_by_external_io` is request-level pre-acquisition posture, not a packet outcome.
- Durable Discovery task/packet schema remains parked.

## Decision Options

### Option 1 - Minimum Durable Discovery Receipt Seam

Shape the smallest durable record/read-model that could preserve Discovery receipts or packet outcomes later.

Useful if Atlas is ready to decide what must be stored.

Risk:

- may drift into schema before the existing runtime collector split is understood enough
- may overbuild the receipt machinery

### Option 2 - Non-Durable Runtime Bridge Proof

Prove another read-only/local-only bridge between current runtime surfaces and the accepted receipt basis.

Possible shape:

```txt
existing due/runtime proof surfaces
-> fixture receipt projection
-> caller-readable posture
```

Useful if Atlas wants one more proof before schema.

Risk:

- may become repetitive if it only recomposes proofs already accepted
- may delay the necessary boundary audit of write-capable collectors

### Option 3 - Discovery Boundary Code Audit / Split Readiness

Pause Dev implementation and audit the current write-capable Discovery/Watch collector path against the accepted model.

Audit question:

```txt
What exact code needs to be separated so Watch can emit intent, Discovery can acquire candidates, ESI Evidence Expansion can write Evidence/EVEidence, and Watch can receive/read a bounded receipt?
```

Useful because HS351/HS359 already found the current live-capable Watch collectors still mix:

- Watch posture
- Discovery acquisition
- Discovery ref persistence
- ESI Evidence Expansion
- Evidence writes
- warnings/logs
- fetch-run lifecycle

Risk:

- not forward implementation yet
- may expose several future packets instead of one

## Recommendation

Prefer Option 3 next.

Reason:

HS363 proves the receipt shape can exist. The remaining uncertainty is how the existing live-capable collector path should be separated before Atlas builds durable task/packet storage or moves toward live Watch acquisition.

The next useful work is a boundary/split readiness audit, not another Dev implementation.

## Suggested Advisory Ask

Ask Engineering / Data Engineering to source-trace:

```txt
Watch due intent
-> Discovery acquisition
-> Discovery ref persistence
-> ESI Evidence Expansion
-> Evidence/EVEidence writes
-> Discovery receipt / caller handoff
```

Expected output:

1. Current code path map.
2. Where boundaries are currently mixed.
3. Which functions should remain Watch-owned.
4. Which functions should become Discovery-owned or Discovery-facing.
5. Which functions should remain Evidence Expansion / Evidence-owned.
6. Minimum split needed before any durable receipt/task-packet schema.
7. Minimum split needed before any live Watch provider movement.
8. What should stay parked.

## Resting State

No Dev runway is open.

Next best action:

```txt
Open an advisory/source-trace request for Discovery boundary split readiness.
```

Human decision needed only if the preferred direction changes away from this audit-first posture.
