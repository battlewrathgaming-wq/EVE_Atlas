# OverseerHS345 HS344 Source Trace Acceptance

Status: accepted
Date: 2026-06-06
Role: Overseer

## Reviewed

- `workspace/EngineeringTraceHS344-user-intent-to-discovery-bus-source-trace.md`

## Result

Accepted as advisory source-code trace.

HS344 was intentionally blind to `workspace/current.md`, `workspace/overview.md`, recent HS handoffs, chat summaries, and external shaping material. It inspected source and offline verifiers only.

## Accepted Findings

The current code has two distinct Watch paths:

1. Implemented runtime path:
   - `watch.executor.tick`
   - `watchExecutor.dispatchFor(...)`
   - `actor.watch` / `system.radius.watch`
   - direct collectors
   - zKill / ESI / persistence once live gates allow.

2. Newer proof path:
   - packet plan / dry-run
   - task envelope
   - fixture task
   - Discovery bus input
   - stub candidate refs.

The proof path is clean and pre-live, but it is not yet the real runtime provider path.

## Accepted Risk

Before live Watch testing, Atlas should prove the real system/radius execution input path preserves accepted stored system IDs through the implemented collector/planner path.

Specific risk from HS344:

```txt
watchExecutor.dispatchFor(...) builds a payload with accepted IDs,
but runSystemRadiusWatchService normalizes through normalizeSystemRadiusWatchScope,
which does not include accepted IDs in its returned object.
```

That makes the next important pre-live seam:

```txt
dispatchFor -> runSystemRadiusWatchService / collector injection -> planSystemRadiusWatch
```

The proof should assert:

- accepted stored `included_system_ids` survive into `planSystemRadiusWatch`;
- `acceptedScopeSource` remains `stored_watch_scope`;
- center/radius are not recomputed as execution authority;
- invalid stored scope blocks before task/provider movement;
- fake provider clients prevent live provider calls;
- no durable Discovery refs or Evidence writes occur unless separately authorized in a fixture-only write proof.

## Accepted Boundary

This advisory does not authorize live Watch execution, provider movement, Discovery ref writes, Evidence/EVEidence writes, schema changes, UI work, runtime enforcement, support artifacts, durable Watch result identity, or relationship tags.

## Recommended Next Decision

Human / Overseer should choose between:

1. Harden/prove the existing direct collector path before live testing.
2. Require the new Discovery bus/intake shape to become runtime architecture before provider testing.

Overseer recommendation: first prove the existing direct collector path’s accepted-scope propagation offline. This is the smallest concrete risk found by source trace and does not force an architecture pivot yet.
