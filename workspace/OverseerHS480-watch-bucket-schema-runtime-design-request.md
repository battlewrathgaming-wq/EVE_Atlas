# OverseerHS480 - Watch Bucket Schema Runtime Design Request

Status: open  
Date: 2026-06-12  
Executor: Architecture / Data Engineering Review  
Expected artifact: `workspace/ArchitectureDataHS480-watch-bucket-schema-runtime-design.md`

## Purpose

Design the product-safe schema/runtime shape that should carry the proven Watch bucket / Discovery pickup seam.

This is advisory/design only. Do not implement code.

The design should be informed by provider-sourced schema, policy, cadence, retry, and guidance material gathered by the Human/advisory thread. Use that material to pressure the Atlas model; do not merely rubber-stamp the fixture chain.

## Accepted Fixture Basis

Atlas has proven the seam in non-production form:

```txt
HS470 Watch bucket identity projection
HS472 Watch bucket pickup posture bridge
HS476 Watch bucket disposable persistence fixture
HS478 Discovery pickup consumer hold contract
```

Accepted principles:

- Watch owns intent, accepted scope, cadence, due checks, and receipt interpretation.
- Watch emits at most one open run/work stub per Watch.
- Missed intervals collapse into one current eligible run.
- External I/O gates Discovery/provider movement, not Watch emission.
- Discovery pickup must be able to see future pickup eligibility or External I/O hold without starting movement.
- `held_by_external_io` is provider movement hold, not Watch failure and not persisted Watch bucket status.
- `fetch_runs` is not the Watch bucket.
- `discovered_killmail_refs` is not the pre-acquisition Watch bucket.
- Evidence/EVEidence is not Watch scheduler/completion/inbox state.
- Overlapping Watch scopes must preserve multiple Watch intent while deduplicating landed killmail truth later.

## Design Questions

Answer practically:

1. What product schema, if any, should carry Watch bucket/open-run state?
2. What fields are truly needed for alpha, and what should stay out?
3. How should one-open-stub per Watch be represented and enforced?
4. How should Watch run identity be represented without overcommitting to final ID generation doctrine?
5. How should External I/O hold, provider retry, retry-after, and next provider eligibility be represented without becoming Watch cadence authority?
6. What provider facts need to be durable for restart recovery?
7. What provider facts should stay transient?
8. What receipt/outcome fields must cross back to Watch?
9. What fields or rows should Discovery consume without starting provider movement?
10. What should be explicitly deferred: dispatcher, lease, queue, provider packets, candidate refs, Evidence writes, UI, or other pieces?
11. What existing schema/code should be reused, and what must explicitly not be reused?
12. What migration or compatibility risks exist with current Watch actor/system paths?
13. What risks appear when moving from fixture semantics to production storage?
14. What acceptance criteria should the first schema/runtime Dev packet use?

## Provider Reality Lens

Use provider-sourced input to pressure these areas:

- cadence / retry / retry-after implications
- restart, External I/O re-enable, storage unlock, and missed-slot flood prevention
- provider-specific capacity or wait posture
- what Atlas should record as provider facts versus Watch facts
- what should never trigger catch-up flood behavior
- what must be visible in receipts for safe recovery
- what should remain advisory/readout-only until live movement is opened

## Boundary

Do not:

- implement code
- update schema
- create a Dev runway
- call providers
- start Discovery pickup
- create leases, queues, or dispatcher runtime
- write candidate refs
- write Evidence/EVEidence
- mutate Watch rows or cadence
- design UI
- rename source terms
- update protected-word JSON

This is a design/advisory artifact only.

## Expected Output

Return:

1. Executive recommendation.
2. Proposed product schema/runtime shape.
3. Minimal alpha fields and states.
4. Fields/states to reject or defer.
5. Watch-owned facts versus Discovery/provider-owned facts.
6. Restart/recovery model.
7. External I/O / provider hold model.
8. Receipt/outcome model back to Watch.
9. Existing schema/code fit and non-reuse warnings.
10. Migration/compatibility risks.
11. Smallest next Dev packet recommendation.
12. Acceptance criteria for that packet.
13. Open Human/Overseer decisions.

