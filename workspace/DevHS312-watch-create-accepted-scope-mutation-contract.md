# DevHS312 Watch Create Accepted Scope Mutation Contract

Status: complete pending Overseer review
Date: 2026-06-05
Executor: Dev

## Summary

Implemented the accepted-scope `watch.create` mutation contract for system/radius Watch authoring.

The accepted-preflight path now stores the operator-accepted `included_system_ids` exactly in `system_watches.included_system_ids`. Center system and radius remain stored as provenance/explanation/management fields. Legacy direct center/radius authoring remains separate and continues to compute topology scope for compatibility.

## Files Changed

- `package.json`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/services/watchCreateMutationSafetyMapService.js`
- `scripts/verify-watch-create-accepted-scope-contract.js`
- `scripts/verify-watch-create-mutation-safety-map.js`
- `workspace/current.md`
- `workspace/DevHS312-watch-create-accepted-scope-mutation-contract.md`

## Implementation

`runWatchCreateService` now extracts accepted system/radius scope from accepted payload shapes:

- `included_system_ids`
- `accepted_included_system_ids`
- `stored_scope_authority.included_system_ids`
- candidate/future acceptance payload aliases
- accepted preflight action/status/source fields

`addSystemRadiusWatch` now:

- validates accepted IDs when the accepted-preflight path is used
- rejects missing, empty, malformed, duplicate, capped/not-acceptable, unknown, invalid, or mismatched accepted-ID payloads
- validates accepted IDs against current local topology membership without replacing accepted order
- stores the exact accepted list in `system_watches.included_system_ids`
- preserves center system ID/name and radius as provenance/management fields
- marks accepted-scope results with `scope_authority.source: accepted_preflight_included_system_ids`
- keeps legacy direct center/radius authoring separate as `legacy_center_radius_authoring`

## Sample Proof

Focused verifier sample:

```json
{
  "created_scope_authority": {
    "source": "accepted_preflight_included_system_ids",
    "included_system_ids": [
      30003597,
      30003601,
      30003599,
      30003598,
      30003596
    ],
    "center_radius_role": "provenance_and_management",
    "topology_recomputed_for_storage": false
  },
  "stored_row": {
    "center_system_id": 30003597,
    "radius_jumps": 1,
    "included_system_ids": [
      30003597,
      30003601,
      30003599,
      30003598,
      30003596
    ],
    "lookback_hours": 48,
    "max_systems_per_run": 5,
    "max_killmails_per_run": 3,
    "is_active": 0,
    "poll_interval_minutes": 45
  },
  "legacy_direct_authoring": {
    "source": "legacy_center_radius_authoring",
    "included_system_ids": [
      30003597
    ],
    "center_radius_role": "legacy_authoring_geometry",
    "topology_recomputed_for_storage": true
  }
}
```

The accepted list order differs from local topology numeric order, so the verifier proves the accepted list is stored exactly rather than replaced by recomputation output.

## Rejection Coverage

Verified rejected cases:

- missing accepted IDs
- empty accepted IDs
- malformed accepted IDs
- mismatched accepted IDs
- capped/not-acceptable status
- unknown center
- invalid radius

## Mutation Boundary

Verified intended mutation is limited to `system_watches`.

Confirmed no:

- Watch execution
- Watch dispatch
- runtime task creation
- provider calls
- Discovery ref mutation
- Evidence/EVEidence writes
- Hydration writes
- schema changes
- topology traversal behavior changes
- renderer/UI behavior
- support artifacts
- runtime enforcement
- durable Watch/task result identity
- relationship tags
- fourth-lane / fast-lane work
- source-owned term renames
- protected-word JSON updates

## Verification

Passed:

```txt
node --check src\main\services\mutatingActionService.js
node --check src\main\watchlist\watchlistRepository.js
node --check src\main\services\watchCreateMutationSafetyMapService.js
node --check scripts\verify-watch-create-accepted-scope-contract.js
node --check scripts\verify-watch-create-mutation-safety-map.js
npm.cmd run verify:watch-create-accepted-scope-contract
npm.cmd run verify:watch-create-mutation-safety-map
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:mutating-services
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:protected-terms` completed with warning-only advisory output: 440 warnings across 9 changed working-set files; no renames or protected-word JSON updates were performed.

`git diff --check` passed with CRLF normalization warnings only.

`git status --short --branch` showed:

```txt
## main...origin/main
 M package.json
 M scripts/verify-watch-create-mutation-safety-map.js
 M src/main/services/mutatingActionService.js
 M src/main/services/watchCreateMutationSafetyMapService.js
 M src/main/watchlist/watchlistRepository.js
 M workspace/current.md
 M workspace/overview.md
?? scripts/verify-watch-create-accepted-scope-contract.js
?? workspace/DevHS312-watch-create-accepted-scope-mutation-contract.md
?? workspace/OverseerHS312-watch-create-accepted-scope-mutation-contract-runway.md
```

## Risks / Open Decisions

- Renderer/operator confirmation flow is not implemented in this packet.
- Watch execution is not run in this packet.
- Durable Watch/task result identity remains parked.

## Recommended Next Action

Overseer should review HS312. If accepted, the next seam can be renderer/operator confirmation for accepted Watch setup, or a focused execution smoke using a real authored Watch only if separately opened.
