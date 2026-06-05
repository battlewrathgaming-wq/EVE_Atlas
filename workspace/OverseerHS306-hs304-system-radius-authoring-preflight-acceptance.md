# OverseerHS306 HS304 System Radius Authoring Preflight Acceptance

Status: accepted
Date: 2026-06-05
Owner: Overseer

Reviewed runway: `workspace/OverseerHS304-system-radius-authoring-preflight-runway.md`
Reviewed Dev handoff: `workspace/DevHS304-system-radius-authoring-preflight.md`
Reviewed redirect: `workspace/OverseerHS305-hs304-system-radius-authoring-preflight-review.md`

## Decision

HS304 is accepted after HS305 revision.

## Accepted Result

Atlas now has a local-only read-only authoring/preflight readout:

```txt
watch.system_radius_authoring_preflight.preview
```

The readout proves the operator-facing system/radius Watch setup shape without creating a Watch:

```txt
System Hare with a radius of 1 jump:

Included systems:
Hare (center)
Babirmoult
Heluene
Ogaria
Oruse
```

Accepted behavior:

- selected center system resolves from local topology;
- radius scope includes the center system;
- included systems are listed with center first and marked `(center)`;
- `included_system_count` is the primary count;
- `direct_neighbor_count` is diagnostic/detail only;
- `direct_neighbor_count` represents immediate adjacent systems excluding center;
- radius 2+ does not inflate direct-neighbor count into all non-center included systems;
- exact `included_system_ids_for_acceptance` / `would_store_included_system_ids` are exposed only when the scope is acceptable;
- capped partial scope is not acceptable without operator adjustment;
- missing topology, unknown system, invalid radius, and capped scope are distinct states.

## HS305 Correction Accepted

HS305 found that the first pass computed `direct_neighbor_count` as full radius result minus center. Dev corrected this by computing direct neighbors independently from radius 1 local topology.

The verifier now proves:

```txt
radius 2 included_system_count = 6
direct_neighbor_count = 4
included_system_count > direct_neighbor_count + 1
```

That preserves the HS302 distinction between:

```txt
radius-included systems
```

and:

```txt
direct neighbors excluding center
```

## Boundary Confirmation

Accepted boundaries preserved:

- no provider calls;
- no live/API verification;
- no Watch dispatch;
- no Watch row writes;
- no task creation;
- no Discovery ref mutation;
- no Evidence/EVEidence writes;
- no Hydration or metadata writes;
- no schema changes;
- no durable `watch_result` or `watch_result_items`;
- no relationship tags;
- no Discovery ref identity changes;
- no topology traversal behavior changes;
- no imported `system_adjacency.connection_type = stargate` rename;
- no renderer/UI behavior beyond existing read-only command registration;
- no runtime enforcement or command blocking;
- no support artifacts;
- no fourth lane / fast lane.

## Verification

Overseer reran:

```txt
node --check src\main\services\systemRadiusAuthoringPreflightService.js
node --check scripts\verify-system-radius-authoring-preflight.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:system-radius-authoring-preflight
npm.cmd run verify:planner
npm.cmd run verify:radius
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Notes:

- `verify:service-registry` timed out once while run in parallel, then passed when rerun by itself with more time.
- `verify:protected-terms` completed warning-only with no renames and no protected-word JSON updates.
- `git diff --check` passed with CRLF normalization warnings only.

## Resting State

HS304 can rest.

This gives future Watch authoring UI / creation flow work a local read-only preflight basis, but it does not authorize Watch creation, UI work, provider movement, or durable Watch/result semantics.

## Parked

Keep parked:

- Watch/task result identity;
- multiple-killmail report body design;
- Observation grouping;
- provider/live testing;
- Watch execution behavior changes;
- topology traversal behavior changes;
- schema;
- UI;
- support artifacts;
- active enforcement;
- fourth lane / fast lane.
