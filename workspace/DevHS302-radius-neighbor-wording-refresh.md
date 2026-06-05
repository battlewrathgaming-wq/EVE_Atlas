# DevHS302 Radius Neighbor Wording Refresh

Status: complete pending Overseer review
Date: 2026-06-05
Executor: Dev

## Scope

Executed the HS302 wording/verifier-label refresh only.

Goal:

```txt
Distinguish radius-included systems from direct neighbors.
```

Accepted semantics preserved:

- radius 0 = center only
- radius 1 = center plus direct neighbors
- direct neighbor count excludes center
- radius scope includes center

## Files Changed

- `docs/terms/system-radius-watch.md`
- `docs/roadmap/system-radius-watch.md`
- `scripts/verify-radius.js`
- `workspace/current.md`
- `workspace/DevHS302-radius-neighbor-wording-refresh.md`

## Implementation

Updated plain docs so radius wording now says:

- Atlas radius scopes include the center system.
- A radius of 1 jump means the center plus direct neighbors.
- Direct neighbor counts exclude the center.
- User-facing presentation should stay simple: selected system, radius, included systems.
- The center appears first and is marked as `(center)`.
- Counts are labeled as included systems, not neighbors.
- Direct-neighbor counts are reserved for diagnostic/detail wording.

Preferred shape:

```txt
System Hare with a radius of 1 jump:

Included systems:
Hare (center)
Babirmoult
Heluene
Ogaria
Oruse
```

Updated the stale verifier assertion label:

```txt
radius 1 should return direct neighbors
```

to:

```txt
radius 1 should return center and direct neighbors
```

The expected fixture IDs did not change.

## Runtime Behavior

No runtime behavior was changed.

Confirmed no:

- topology traversal behavior change
- schema change
- imported connection type rename
- `system_adjacency.connection_type = stargate` rename
- Watch scope authority change
- Discovery ref mutation
- Evidence/EVEidence write
- Watch row mutation
- Hydration change
- provider call or live/API verification
- UI/renderer behavior
- support artifact creation
- durable Watch result semantics
- fourth lane / fast lane work

## Verification

Passed:

```txt
node --check scripts\verify-radius.js
node --check scripts\verify-system-radius-planner.js
npm.cmd run verify:radius
npm.cmd run verify:planner
npm.cmd run verify:protected-terms
```

`verify:protected-terms` completed with warning-only advisory output: 356 warnings across 5 changed working-set files; no renames or protected-word JSON updates were performed.

```txt
git diff --check
git status --short --branch
```

`git diff --check` passed with CRLF normalization warnings only.

`git status --short --branch` showed:

```txt
## main...origin/main
 M docs/roadmap/system-radius-watch.md
 M docs/terms/system-radius-watch.md
 M scripts/verify-radius.js
 M workspace/current.md
?? workspace/DevHS302-radius-neighbor-wording-refresh.md
```

## Risks / Open Decisions

None introduced. This was wording and verifier-label maintenance only.

## Recommended Next Action

Overseer should review HS302. If accepted, Atlas can use:

```txt
radius included scope = center plus systems within radius
direct neighbors = adjacent systems excluding center
```
