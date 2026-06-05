# Overseer HS290 - Watch / Task Outcome Map Assurance And Scope Request

Status: submitted
Date: 2026-06-05
Project: AURA Atlas
Requester: Atlas Overseer
Suggested reviewer: Engineering / Data Engineering / Security, as appropriate

## Purpose

Scope and pressure-test the parked Watch/task outcome lane before any Dev implementation.

This is assurance and product-mechanics scoping only. Do not implement code.

## Context

HS286 secondary advisory identified a useful parked lane:

```txt
Task origin and durable outcome map for Manual Search and Watch
```

Accepted posture:

- task state is volatile runtime tracking, not durable workflow truth;
- durable truth lives in local rows such as `fetch_runs`, `discovered_killmail_refs`, `killmails`, `activity_events`, `watchlist_entities`, and `system_watches`;
- Manual Discovery and Manual Expansion are better defined than Watch result meaning;
- Watch authoring creates durable intent;
- scheduler/executor movement is controlled runtime behavior;
- Watch output is currently collection provenance plus local Evidence/EVEidence changes;
- no durable `watch_result` or relationship-tag artifact should be implied yet.

Human-shaped direction preserved in the task advisory:

```txt
Evidence records what happened.
Provenance records how Atlas got it.
Watch/task results group what a specific scope/run found.
Observation interprets/group-presents local records.
Assessment remains human judgment.
```

The likely future need is a separate searchable result/readout layer for task outcomes, especially Watch outcomes. This should point to existing `killmail_id`, `run_id`, Watch scope, and provenance rows. It should not mutate killmail meaning.

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/EngineeringDataHS286-secondary-task-creation-watch-mechanics.md`
- `workspace/OverseerHS287-hs286-missing-links-assurance-review.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/r-scanner-sequencer-presentation.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/contracts/scope-definition-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- relevant source under:
  - `src/main/services`
  - `src/main/watchlist`
  - `src/main/workers`
  - `src/main/reports`
  - `src/main/db`
  - `src/main/scopes`
  - `src/main/sde`

## Task

Trace current Watch/task origin and durable outcome mechanics from source, then scope the smallest useful future read-only surface.

Focus on:

1. Manual Discovery origin and durable outputs.
2. Manual Expansion origin and durable outputs.
3. Watch authoring as durable intent.
4. Watch schedule state as readout/posture.
5. Watch executor task creation as volatile runtime movement.
6. Watch collection outputs as durable provenance and Evidence/EVEidence changes.
7. Radius Watch scope snapshot versus recomputed topology.
8. System/radius Discovery ref identity: center-only versus center-plus-radius/watch identity.
9. Whether any source path currently implies `watch_result`, relationship tag, durable task result, or relationship truth.
10. What a future read-only Watch/task outcome map would need to disclose.

## Questions To Answer

1. What user/operator act creates each kind of work?
2. Which service command is invoked?
3. Which parts are volatile task state?
4. Which local rows prove durable acceptance, movement, completion, partial completion, failure, or deferral?
5. What does Manual Discovery output, and what must it not imply?
6. What does Manual Expansion output, and what must it not imply?
7. What does a Watch definition output?
8. What does a Watch executor tick output?
9. What does a Watch collection output?
10. Does the current system have enough source truth to derive a read-only outcome map without schema?
11. Does the system/radius Watch path preserve authored included/excluded systems during execution, or does it recompute scope?
12. Is current `system_radius` Discovery ref identity sufficient for multiple radius Watches sharing a center system?
13. Where could Watch result meaning accidentally accumulate in Evidence/activity rows?
14. What should remain Observation/readout rather than Evidence, Provenance, or Assessment?
15. What is the smallest safe next Dev packet, if any?

## Boundaries

Do not:

- implement code
- edit files
- run live/API calls
- dispatch Watch execution
- create task runs
- create queues, Bucket, Dispatcher, worker, lease, retry, or persisted work
- add schema
- create `watch_result` or `watch_result_items`
- write relationship tags
- mutate Evidence/EVEidence
- mutate Discovery refs
- mutate Watch rows
- mutate Assessment Memory
- add renderer/UI behavior
- activate runtime enforcement or command blocking
- create support artifacts
- reopen fourth lane / fast lane
- rename Atlas terms

## Expected Output

Create advisory artifact:

```txt
workspace/EngineeringDataHS290-watch-task-outcome-map-assurance-scope.md
```

Return a concise summary with:

1. Executive recommendation.
2. Current source-backed origin/outcome map.
3. Durable versus volatile state classification.
4. Manual Discovery and Manual Expansion output boundaries.
5. Watch authoring/schedule/executor/collection boundaries.
6. Radius Watch scope snapshot finding.
7. System/radius queue identity finding.
8. Risks of Watch/result meaning accumulating in Evidence rows.
9. Proposed smallest read-only outcome-map surface, if any.
10. Items to keep parked.
11. Verification/evidence expected before Dev.
12. Human/Overseer decisions needed.

If no Dev packet is ready, say so plainly.
