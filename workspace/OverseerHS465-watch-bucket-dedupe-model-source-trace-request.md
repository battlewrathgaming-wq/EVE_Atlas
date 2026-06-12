# OverseerHS465 - Watch Bucket / Dedupe Model Source Trace Request

Status: open  
Date: 2026-06-12  
Executor: Engineering / Source Trace  
Expected artifact: `workspace/EngineeringSourceTraceHS465-watch-bucket-dedupe-model.md`

## Purpose

Source-test the proposed Watch bucket and dedupe model before Atlas promotes it into an ADR or Dev runway.

This is advisory/source trace only. Do not implement code.

## Proposed Decision Shape To Test

```txt
Watch emission:
- Watch owns due checks, cadence, one-open-run rule, emitted stub identity, and receipt interpretation.
- External I/O does not block Watch emission.
- If a Watch is due and has no open stub, Watch may emit one durable work stub.
- If a Watch already has an open stub, Watch must not emit another.
- Missed intervals collapse into one current eligible run.
- Watch is not a historical catch-up generator.

External I/O:
- External I/O gates Discovery pickup / provider packet dispatch.
- If External I/O is closed, Discovery rests and does not dispatch provider packets.
- Bucket rows may exist while External I/O is closed.
- Re-opening External I/O must not create catch-up flooding.

Bucket identity:
- Bucket identity is Watch-run based, not system based.
- Same system in multiple Watch scopes is valid overlapping intent.
- Same watch_id + same open run is duplicate; upsert/ignore.
- Same watch_id + different open run is conflict until resolved.
- Same watch_run_id with mismatched scope/provenance is integrity error.

Dedupe layers:
- Bucket dedupe prevents duplicate open Watch work.
- Discovery ref dedupe prevents duplicate candidate refs for the same provider identity, usually killmail_id + hash.
- Evidence/EVEidence dedupe prevents duplicate landed killmail truth, likely by killmail_id or killmail_id + hash depending on current writer rules.
- Provenance overlap must be preserved.

Core dedupe principle:
Deduplicate the killmail; preserve the fact that multiple Watch intents found it.
```

## Core Question

Can current Atlas schema/code support a durable, blind Watch work bucket where Watch emits one open stub per due Watch regardless of External I/O, while Discovery/dispatcher gates provider movement and returns settled factual receipts?

## Questions To Answer

1. What current tables, fields, repositories, or services could represent Watch-run stub identity?
2. Is there already any table that should or should not become the durable Watch work bucket?
3. Can Atlas enforce or derive "one open stub per watch_id" today?
4. Where should `watch_run_id` live if added later?
5. Can current `discovered_killmail_refs` preserve multiple Watch/provenance relationships to the same `killmail_id/hash`, or does current uniqueness collapse that overlap?
6. How does current candidate-ref dedupe work today?
7. How does current Evidence/EVEidence dedupe work today?
8. Does current Evidence writer preserve singular killmail truth while allowing multiple discovery/provenance relationships?
9. Where does External I/O currently gate provider movement, and would moving Watch emission ahead of that gate conflict with existing services?
10. What current code would be most affected by introducing durable Watch bucket rows later?
11. What should be ADR-worthy now, and what remains only implementation design?
12. What should be rejected or deferred?

## Files / Areas To Inspect

Start from:

```txt
workspace/current.md
workspace/overview.md
workspace/EngineeringSourceTraceHS462-watch-system-advisory.md
workspace/DevHS463-system-radius-watch-run-stub-projection.md
workspace/OverseerHS464-hs463-system-radius-watch-run-stub-review.md
src/main/db/schema.sql
src/main/db/evidenceRepository.js
src/main/watchlist/watchExecutor.js
src/main/watchlist/watchlistRepository.js
src/main/workers/systemRadiusCollector.js
src/main/workers/actorWatchCollector.js
src/main/discovery/candidateRefMemory.js
src/main/discovery/actorWatchDirectBody.js
src/main/discovery/zkillCandidateAcquisition.js
src/main/discovery/esiBackedExpansionPackage.js
src/main/services/externalIo*
src/main/services/*gate*
src/main/services/*watch*
```

Use focused source trace. Do not bulk-read unrelated UI or report files unless needed for a specific relationship/provenance question.

## Boundary

Do not:

- implement schema
- create a bucket table
- create or mutate Watch rows
- change Discovery refs
- change Evidence/EVEidence writes
- change External I/O behavior
- call providers
- run live/API calls
- change dispatcher/queue/lease behavior
- change UI
- change source terms or protected-word JSON
- open Dev work

## Expected Output

Return a concise advisory artifact with:

1. Executive recommendation.
2. Current schema/code fit.
3. Gaps or blockers.
4. Current candidate-ref dedupe behavior.
5. Current Evidence/EVEidence dedupe behavior.
6. Provenance-overlap support or risk.
7. External I/O gate interaction.
8. Recommended ADR decision wording, if ready.
9. What should remain deferred.
10. Smallest next Dev proof, if any.
11. Verification/source evidence used.

