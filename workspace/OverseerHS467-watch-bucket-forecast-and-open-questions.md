# OverseerHS467 - Watch Bucket Forecast And Open Questions

Status: pause / forecast  
Date: 2026-06-12  
Executor: Overseer  

## Purpose

Pause after ADR-0007 and make the next Watch bucket / Discovery boundary choices visible without opening Dev work.

No implementation is authorized by this note.

## Stable Landing

Accepted architecture direction:

```txt
External I/O gates Discovery pickup/provider movement, not Watch emission.
One Watch may have at most one open emitted run stub.
Bucket identity is Watch-run based, not system based.
Deduplicate the killmail; preserve the fact that multiple Watch intents found it.
```

Accepted evidence:

- HS463 proves a read-only system/radius Watch-run stub projection.
- HS465 source trace confirms the architecture is sound but not yet implemented by current durable tables.
- ADR-0007 records the decision direction and explicitly defers schema/runtime implementation.

## What Is Not Yet True

Atlas does not yet have:

- a durable Watch work bucket table
- a product Watch run table
- one-open-stub-per-`watch_id` enforcement
- explicit `watch_run_id -> candidate refs` relationship
- External I/O gating moved from Watch due/dispatch posture to Discovery pickup/provider movement
- durable receipt projection from Discovery back to Watch
- Observation inbox/query over Watch run outcomes

## Open Questions To Clarify Before Dev

1. Should the next proof be read-only projection or disposable write fixture?

Read-only projection is lower risk and can show expected identities, conflicts, and overlap without schema.

Disposable write fixture is more useful for proving constraints, but it starts shaping future schema.

2. What is the minimum Watch bucket state?

Candidate minimal fields:

```txt
watch_run_id
watch_id
watch_type
status
accepted_scope_snapshot
window/lookback
caps
emitted_at
settled_at
receipt_summary
```

This is not accepted schema. It is only the current question surface.

3. What status words belong to Watch bucket state?

Likely Watch-owned:

```txt
open
settled
cancelled
superseded
blocked_integrity
```

Likely Discovery-owned receipt posture:

```txt
refs_found
no_refs_found
acquisition_capped
provider_deferred
held_by_external_io
failed_retryable
failed_terminal
partial_recoverable
```

4. Should `held_by_external_io` be a bucket status or Discovery receipt posture?

Current leaning:

```txt
held_by_external_io is Discovery/provider movement posture, not Watch emission failure.
```

Watch bucket row can remain open/eligible while Discovery is held.

5. How much provenance should the bucket snapshot preserve?

The snapshot should preserve enough to prove what the Watch asked at emission time, without becoming Evidence or Observation.

6. Where should overlap be recorded?

ADR-0007 says provenance preserves overlap, but the exact durable relationship surface is not yet decided.

## Forecasted Next Seams

Recommended order:

1. Read-only Watch bucket identity projection.
   Show one-open-stub, overlap, duplicate, conflict, and integrity cases with fixture data. No schema or writes.

2. Disposable write fixture for Watch bucket constraints.
   Only after the projection lands. Prove one-open-stub and integrity conflict behavior without touching operator data.

3. Discovery pickup from bucket candidates.
   Still no providers. Show how Discovery would claim/open/hold work while External I/O is closed.

4. Receipt projection back to Watch.
   Show settled factual receipt shape without cadence mutation.

5. Watch cadence interpretation.
   Only after receipt shape is stable.

## Guardrails

Do not jump directly to:

- provider movement
- durable production schema
- dispatcher implementation
- lease/retry system
- Watch cadence mutation
- collector retirement
- Observation inbox UI

Do not use:

- `fetch_runs` as Watch bucket
- `discovered_killmail_refs` as Watch bucket
- Evidence/EVEidence as Watch state
- system ID as bucket identity

## Warm Start Recommendation

Next session should start by deciding:

```txt
Read-only projection first, or disposable write fixture first?
```

Overseer recommendation:

```txt
Read-only projection first.
```

Reason:

It keeps us in proof mode while clarifying identity and overlap before schema pressure appears.

