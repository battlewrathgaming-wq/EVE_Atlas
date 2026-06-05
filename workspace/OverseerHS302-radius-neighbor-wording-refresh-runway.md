# OverseerHS302 Radius Neighbor Wording Refresh Runway

Status: open
Date: 2026-06-05
Owner: Overseer
Executor: Dev
Expected handoff: `workspace/DevHS302-radius-neighbor-wording-refresh.md`

## Purpose

Tighten Atlas radius/topology wording so operator-facing and verifier text does not confuse:

```txt
radius scope including center
```

with:

```txt
direct neighbors excluding center
```

This follows the Hare validation note accepted in HS301.

## Accepted Semantics

Atlas radius semantics:

```txt
radius 0 = center only
radius 1 = center + direct neighbors
direct neighbor count = adjacent systems excluding center
```

Human validation note:

```txt
Hare radius 1 includes 5 systems.
Hare has 4 direct neighbors.
```

Preferred operator-facing wording:

- Use `neighbors` / `direct neighbors` when describing adjacency/counts.
- Use `radius includes center` where count semantics matter.
- Use `stargate` only when specifically discussing imported local topology connection type or source data.

## Task

Perform a small wording/verifier-label refresh.

Likely files:

- `docs/terms/system-radius-watch.md`
- `docs/roadmap/system-radius-watch.md`
- `scripts/verify-radius.js`
- `scripts/verify-system-radius-planner.js`

Focus:

- Make plain docs say radius uses local topology lookup tables and that radius scopes include the center.
- Preserve `stargate` when referring to imported source data / connection type, if needed.
- Change misleading verifier assertion text such as `radius 1 should return direct neighbors` when the expected list includes center.
- Prefer `center and direct neighbors` or `center plus neighbors` for radius-1 included scope.
- Do not change runtime behavior.

## Boundaries

Do not:

- change topology traversal behavior
- change schema
- change imported connection type values
- rename `system_adjacency.connection_type = stargate`
- change Discovery refs, Evidence/EVEidence, Watch rows, or Hydration
- call providers or use live/API verification
- alter Watch scope authority
- add UI/renderer behavior
- create support artifacts
- open durable Watch result semantics
- reopen fourth lane / fast lane

## Acceptance Criteria

- Docs explain that Atlas radius includes the center system.
- Docs distinguish direct neighbors from radius-included systems.
- Verifier labels no longer imply that radius-1 included scope is only direct neighbors.
- Runtime expectations remain unchanged.
- Existing radius/topology verifier checks still pass.
- No provider calls, schema, source identity, Watch execution, UI, support artifact, or durable result work is added.

## Verification

Run focused checks:

```txt
node --check scripts\verify-radius.js
node --check scripts\verify-system-radius-planner.js
npm.cmd run verify:radius
npm.cmd run verify:planner
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If package script names differ, use the repo's clearly equivalent existing commands and name them in the handoff.

## Stop Conditions

Stop and hand back if:

- the wording change implies runtime behavior change;
- imported `stargate` connection type needs a rename;
- topology traversal behavior appears incorrect;
- live/provider validation is needed;
- broader UI/product copy work becomes necessary.
