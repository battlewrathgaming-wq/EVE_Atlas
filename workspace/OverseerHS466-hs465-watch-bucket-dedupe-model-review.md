# OverseerHS466 - HS465 Watch Bucket / Dedupe Model Review

Status: accepted; ADR promoted  
Date: 2026-06-12  
Reviewed artifact: `workspace/EngineeringSourceTraceHS465-watch-bucket-dedupe-model.md`

## Review Result

HS465 is accepted.

The source trace confirms the proposed model is sound as architecture, but current Atlas schema/code does not yet implement the full durable bucket model.

Accepted direction:

```txt
Watch emits at most one open run stub per Watch
-> durable/blind bucket may hold due work even while External I/O is closed
-> Discovery/dispatcher gates provider movement
-> Discovery dedupes candidate refs and returns settled factual receipt
-> Evidence/EVEidence remains singular landed killmail truth
-> provenance preserves overlapping Watch intent
```

## Accepted Findings

- HS463 proves only a read-only `watch_run_stub` projection.
- There is no durable Watch bucket table today.
- There is no product Watch run table today.
- There is no one-open-stub-per-`watch_id` constraint today.
- There is no explicit `watch_run_id -> candidate refs` relationship today.
- `fetch_runs` must not become the Watch work bucket.
- `discovered_killmail_refs` must not become the pre-acquisition Watch work bucket.
- Current candidate-ref memory partially supports overlapping intent, but center-system identity is not enough for future Watch-run provenance.
- Current Evidence/EVEidence dedupes singular killmail truth by `killmail_id`.
- The current schedule path still treats live/API disabled as a Watch blocking condition; the accepted direction moves External I/O gating to Discovery pickup/provider movement later.

## ADR Promotion

Promoted the accepted architecture direction into:

```txt
docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md
```

The ADR records the direction and defers implementation details. It does not claim durable bucket schema or runtime behavior exists today.

## Boundary Check

No implementation is opened by this review or ADR.

Still closed:

- durable bucket schema
- durable Watch run schema
- dispatcher/lease/retry implementation
- live/provider movement
- External I/O enforcement relocation
- Watch cadence mutation changes
- `discovered_killmail_refs` schema changes
- Evidence/EVEidence writer changes
- Observation inbox/report implementation
- `collectActorWatch(...)` retirement
- system/radius collector replacement
- UI behavior

## Next Decision Point

The next practical seam should source-test or prove bucket identity without provider movement.

Safest next options:

1. Read-only projection: show valid Watch-run stubs as proposed bucket candidates and prove one-open-stub / overlap semantics with fixture rows.
2. Write-capable fixture proof: disposable schema/table proving one-open-stub, mismatch integrity, and overlap-preserving relationship behavior.
3. Pause and review ADR-0007 wording before any further movement.

Recommended next direction: start with the read-only projection unless the Human/Overseer deliberately chooses a disposable write fixture.

