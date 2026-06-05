# OverseerHS305 HS304 System Radius Authoring Preflight Review

Status: redirect
Date: 2026-06-05
Owner: Overseer

Reviewed runway: `workspace/OverseerHS304-system-radius-authoring-preflight-runway.md`
Reviewed handoff: `workspace/DevHS304-system-radius-authoring-preflight.md`

## Decision

HS304 is not accepted yet.

The implementation shape is aligned and should be revised, not discarded.

## Blocking Finding

`direct_neighbor_count` is currently computed as:

```txt
full included radius result minus center
```

Observed source:

```txt
src/main/services/systemRadiusAuthoringPreflightService.js
```

Current line shape:

```txt
const directNeighborCount = Math.max(0, fullIds.length - 1);
```

That is correct only for radius 1.

For radius 2 or higher, `fullIds.length - 1` means all included non-center systems, not direct neighbors. This reintroduces the HS302 semantic blur between:

```txt
radius-included systems
```

and:

```txt
direct neighbors excluding center
```

## Required Revision

Fix `direct_neighbor_count` so it represents only immediate adjacent systems excluding center.

Suggested approach:

- compute direct neighbors independently from radius 1 local topology;
- exclude center;
- do not let radius 2+ inflate `direct_neighbor_count`;
- keep `direct_neighbor_count_role: diagnostic_detail_only`;
- add verifier coverage for a radius 2 or multi-depth fixture proving:
  - included system count can exceed direct-neighbor count plus one;
  - direct-neighbor count remains immediate-neighbor-only;
  - acceptance IDs remain the full included scope when uncapped.

Use the repo's local topology service style rather than inventing a new topology traversal path if possible.

## Accepted Shape To Preserve

Preserve these HS304 positives:

- read-only command shape;
- renderer-eligible local preflight;
- no provider calls;
- no Watch row writes;
- no Watch dispatch;
- no Discovery/Evidence/Hydration mutation;
- center first and marked `(center)`;
- `Included systems` as the primary operator-facing list;
- capped partial scope not acceptable for stored Watch authority;
- exact accepted `included_system_ids` disclosed only when acceptable.

## Verification Needed After Revision

Rerun the HS304 focused set:

```txt
node --check src\main\services\systemRadiusAuthoringPreflightService.js
node --check scripts\verify-system-radius-authoring-preflight.js
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

## Parked

Keep parked:

- Watch/task result identity;
- multiple-killmail report body design;
- provider/live testing;
- Watch execution behavior changes;
- topology traversal behavior changes;
- schema;
- UI;
- support artifacts;
- active enforcement;
- fourth lane / fast lane.
