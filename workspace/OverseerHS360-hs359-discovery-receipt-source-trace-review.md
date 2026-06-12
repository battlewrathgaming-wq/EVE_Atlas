# OverseerHS360 - HS359 Discovery Receipt Source Trace Review

Status: accepted
Date: 2026-06-07
Role: Overseer
Milestone: Atlas Storage And Runtime Hardening

## Reviewed

- `workspace/EngineeringTraceHS359-discovery-receipt-task-packet-source-trace.md`
- `workspace/current.md`
- `workspace/OverseerHS358-discovery-receipt-model-shaping-note.md`

## Acceptance

HS359 is accepted.

The trace confirms the Discovery receipt seam is real and correctly placed on the Discovery side.

Current Atlas can emit receipt-like facts from:

- `discovery.outcome_derivation.preview`
- `watch.discovery_pickup_packet_proof.preview`
- `discovery.pickup_consumer_fixture.preview`
- current manual Discovery return shapes
- current zKill discovery helper summaries

But current runtime Watch collection still mixes:

- Watch due / task posture
- zKill Discovery
- Discovery ref persistence
- ESI Evidence Expansion
- Evidence/EVEidence writes
- warnings/logs
- Watch run posture

Therefore, current write-capable runtime summaries are useful but are not clean Discovery receipts.

## Accepted Recommendation

Adopt HS359's practical recommendation:

```txt
staged hybrid
```

Meaning:

1. Keep HS356 derived/read-only outcome posture as audit/readout.
2. Next prove a non-durable fixture Discovery receipt shape.
3. Defer durable `discovery_task` / `discovery_task_packet` schema until the receipt shape and lifecycle prove themselves.

This avoids freezing Watch-shaped language into Discovery and avoids building schema before Atlas knows the minimum receipt lifecycle.

## Receipt Direction

Next proof should be Discovery-owned and caller-agnostic.

It should consume fixture/pre-provider pickup packets and fixture provider-return outcomes, then emit:

- one top-level Discovery receipt
- a packet receipt list
- accepted/attempted/completed packet counts
- packet outcome counts
- candidate refs as fixture/plain data only
- missing-basis flags
- boundary flags

It should prove at least:

- `complete_refs_found`
- `complete_no_refs`
- `provider_deferred`
- `acquisition_capped`
- `failed_retryable`
- `failed_terminal`
- mixed packet rollup

## Still Needing Human / Overseer Decision

Before opening Dev, decide:

- whether task and packet use the same outcome vocabulary, or packet outcomes roll up into task receipt fields only
- whether `held_by_external_io` belongs inside packet receipt output now, or remains gate posture until External I/O enforcement is closer
- what minimum fields Watch needs before it may use a receipt to rest/retry/continue cadence

## Parked

- live provider execution changes
- durable Discovery task/packet schema
- dispatcher/lease/provider queue architecture
- Watch schedule advancement from receipt
- Manual/Live adoption
- UI presentation
- Observation interpretation
- Evidence/EVEidence write changes
- Hydration/readability changes

## No Dev Runway

No Dev runway is opened by this review.
