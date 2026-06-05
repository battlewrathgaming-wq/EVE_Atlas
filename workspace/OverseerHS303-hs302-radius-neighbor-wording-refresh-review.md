# OverseerHS303 HS302 Radius Neighbor Wording Refresh Review

Status: accepted
Date: 2026-06-05
Owner: Overseer
Reviewed runway: `workspace/OverseerHS302-radius-neighbor-wording-refresh-runway.md`
Reviewed handoff: `workspace/DevHS302-radius-neighbor-wording-refresh.md`

## Decision

Accepted.

HS302 completed the intended wording/verifier-label refresh without changing runtime topology behavior.

## Accepted Result

Accepted semantics now rest locally:

```txt
radius 0 = center only
radius 1 = center plus direct neighbors
direct neighbor count excludes center
radius scope includes center
```

User-facing guidance:

```txt
System Hare with a radius of 1 jump:

Included systems:
Hare (center)
Babirmoult
Heluene
Ogaria
Oruse
```

Accepted wording posture:

- Use `included systems` for radius scope counts.
- Put the center first and mark it as `(center)`.
- Use `direct neighbors` only for adjacent systems excluding the center.
- Keep direct-neighbor counts for diagnostic/detail wording.
- Preserve `stargate` only when discussing imported local topology connection type or source data.

## Scope Review

Changed:

- `docs/terms/system-radius-watch.md`
- `docs/roadmap/system-radius-watch.md`
- `scripts/verify-radius.js`
- `workspace/current.md`
- `workspace/DevHS302-radius-neighbor-wording-refresh.md`

Confirmed:

- verifier expected IDs did not change;
- runtime traversal behavior did not change;
- docs now state radius includes center;
- docs distinguish direct neighbors from included radius scope;
- stale verifier label no longer says radius 1 returns only direct neighbors.

## Boundary Review

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

## Verification Reviewed

Overseer reran:

```txt
node --check scripts\verify-radius.js
node --check scripts\verify-system-radius-planner.js
npm.cmd run verify:radius
npm.cmd run verify:planner
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- All focused checks passed.
- `verify:protected-terms` passed with warning-only advisory output; no renames or protected-word JSON changes were made.
- `git diff --check` passed with CRLF normalization warnings only.

## Resting State

HS302 can rest.

Atlas radius/neighbors wording is now coherent enough for the current phase.

## Parked

Do not open without a new bounded decision:

- topology traversal changes
- imported connection type rename
- UI copy system-wide rewrite
- provider/live validation
- Watch execution changes
- Discovery ref identity redesign
- durable Watch result semantics
- support artifacts
- fourth lane / fast lane
