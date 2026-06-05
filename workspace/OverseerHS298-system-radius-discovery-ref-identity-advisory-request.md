# OverseerHS298 System/Radius Discovery Ref Identity Advisory Request

Status: submitted
Date: 2026-06-05
Project: AURA Atlas
Requester: Atlas Overseer
Suggested reviewer: Engineering / Data Engineering / Security, as appropriate
Expected artifact: `workspace/EngineeringDataHS298-system-radius-discovery-ref-identity-advisory.md`

## Purpose

Pressure-test the current system/radius Discovery ref identity before Atlas builds any durable Watch/task result semantics.

This is advisory and source-trace only. Do not implement code.

## Context

HS292 accepted a read-only Watch/task outcome map preview.

HS296 accepted the Watch scope authority execution correction:

```txt
system/radius Watch execution consumes accepted stored included_system_ids
```

The remaining parked uncertainty from HS290/HS291/HS293/HS297 is:

```txt
system/radius Discovery ref identity is currently center-only
```

Accepted boundary:

```txt
Discovery outputs possible leads.
Evidence Expansion outputs Evidence/EVEidence.
Hydration outputs readability repair.
Watch/task result readouts group what a specific scope/run found.
Observation interprets/group-presents local records.
Assessment remains human judgment.
```

Potential risk:

- multiple radius Watches can share the same center system;
- authored included system sets can differ by radius, exclusions, or deliberate accepted scope;
- durable `discovered_killmail_refs` currently identify system/radius refs by center-oriented source identity;
- future Watch/task result readouts may need to distinguish which Watch scope/run produced or selected a ref without mutating Evidence/EVEidence.

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/EngineeringDataHS290-watch-task-outcome-map-assurance-scope.md`
- `workspace/OverseerHS291-hs290-watch-task-outcome-map-assurance-review.md`
- `workspace/OverseerHS293-hs292-watch-task-outcome-map-preview-review.md`
- `workspace/OverseerHS297-hs296-watch-scope-authority-execution-correction-review.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/watch-scope-authority.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- relevant source under:
  - `src/main/workers/systemRadiusCollector.js`
  - `src/main/workers/systemRadiusPlanner.js`
  - `src/main/watchlist/watchExecutor.js`
  - `src/main/watchlist/watchScheduler.js`
  - `src/main/watchlist/watchlistRepository.js`
  - `src/main/db/schema.sql`
  - `src/main/db/evidenceRepository.js`
  - `src/main/services/watchTaskOutcomeMapPreviewService.js`
  - `src/main/services/watchScopeAuthorityConformanceService.js`
  - `scripts/verify-watch-task-outcome-map-preview.js`
  - `scripts/verify-watch-scope-authority-conformance.js`

## Task

Trace current system/radius Discovery ref identity from source and answer whether it is sufficient for the next safe Atlas phase.

Focus on:

1. What identity fields are written to `discovered_killmail_refs` for system/radius collection today.
2. Whether `discovered_by_type`, `discovered_by_id`, `source_scope`, `source_system_id`, `first_seen_run_id`, `last_seen_run_id`, `run_id`, or Watch schedule fields can distinguish:
   - center-only scope;
   - center + radius;
   - accepted stored included system set;
   - Watch row identity;
   - run/window identity.
3. Whether HS296 stored-scope execution changes the identity risk.
4. Whether multiple active system/radius Watches with the same center could collide or blur Discovery provenance.
5. Whether Manual system/radius Discovery differs from Watch system/radius Discovery.
6. Whether current identity is acceptable while durable Watch/task results remain parked.
7. What would be required before durable `watch_result` / `watch_result_items` could safely point at Discovery refs.
8. Whether a read-only diagnostic/conformance proof is enough, or whether schema/identity redesign is eventually needed.

## Questions To Answer

1. What is the current durable identity key for a queued/ref row?
2. What system/radius fields are included today?
3. What fields are absent but may be needed later?
4. Can two different accepted Watch scopes share or overwrite the same ref identity?
5. Does `fetch_runs` preserve enough provenance to reconstruct scope without changing ref identity?
6. Is center-only identity safe for current local Discovery/Evidence behavior?
7. Is center-only identity safe for future Watch/task result readouts?
8. If not, what is the smallest future-safe identity model?
9. Should the next step be:
   - keep center-only and disclose limitation;
   - add read-only diagnostic proof;
   - revise source_scope/run provenance only;
   - schema/identity migration later;
   - other?
10. What must remain parked?

## Boundaries

Do not:

- implement code
- edit project source
- run live/API/provider calls
- dispatch Watch execution
- create task runs
- mutate Discovery refs
- mutate Evidence/EVEidence
- mutate Watch rows
- mutate Assessment Memory
- add schema
- create `watch_result` or `watch_result_items`
- write relationship tags
- alter runtime enforcement
- create support artifacts
- add UI/renderer work
- reopen fourth lane / fast lane
- rename Atlas terms

## Expected Output

Create:

```txt
workspace/EngineeringDataHS298-system-radius-discovery-ref-identity-advisory.md
```

Return a concise summary with:

1. Executive recommendation.
2. Current source-backed identity map.
3. Collision/blur cases.
4. Durable versus derivable provenance.
5. Current safety assessment.
6. Future Watch/task result readiness assessment.
7. Smallest future-safe model, if any.
8. Suggested smallest next Dev packet, if any.
9. Parked items.
10. Human/Overseer decisions needed.

If no Dev packet is ready, say so plainly.
