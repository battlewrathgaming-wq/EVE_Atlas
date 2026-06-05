# DevHS304 System Radius Authoring Preflight

Status: complete pending Overseer review
Date: 2026-06-05
Executor: Dev

## Scope

Implemented the bounded local-only read-only preflight/readout proof for authoring a system/radius Watch scope:

```txt
watch.system_radius_authoring_preflight.preview
```

The command proves the operator-facing shape:

```txt
System Hare with a radius of 1 jump:

Included systems:
Hare (center)
Babirmoult
Heluene
Ogaria
Oruse
```

## Files Changed

- `src/main/services/systemRadiusAuthoringPreflightService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-system-radius-authoring-preflight.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS304-system-radius-authoring-preflight.md`

## Command / Readout Shape

The new readout returns:

- selected center system ID/name
- requested radius
- local topology posture
- operator-facing heading
- `Included systems` list
- center first and marked `(center)`
- included system count
- direct-neighbor count as diagnostic/detail only
- exact `included_system_ids_for_acceptance`
- exact `would_store_included_system_ids`
- capped/guardrail posture
- missing topology posture
- unknown system posture
- invalid radius posture
- whether scope is acceptable for Watch authoring
- table mutation proof

The command is registered as read-only and renderer-eligible. Enforcement dry-run coverage classifies it as:

```txt
local_db_inspection / none / system_radius_authoring_preflight_readout / read_only_non_enforcing_proof
```

## Sample Output

Focused verifier sample:

```json
{
  "heading": "System Hare with a radius of 1 jump:",
  "included_system_count": 5,
  "direct_neighbor_count": 4,
  "direct_neighbor_count_role": "diagnostic_detail_only",
  "included_systems": [
    "Hare (center)",
    "Babirmoult",
    "Heluene",
    "Ogaria",
    "Oruse"
  ],
  "included_system_ids_for_acceptance": [
    30003597,
    30003601,
    30003599,
    30003598,
    30003596
  ],
  "acceptable_for_watch_authoring": true
}
```

HS305 revision proof:

```json
{
  "radius_2": {
    "included_system_count": 6,
    "direct_neighbor_count": 4,
    "included_systems": [
      "Hare (center)",
      "Babirmoult",
      "Heluene",
      "Ogaria",
      "Oruse",
      "Second Hop"
    ],
    "included_system_ids_for_acceptance": [
      30003597,
      30003601,
      30003599,
      30003598,
      30003596,
      30003650
    ]
  }
}
```

`direct_neighbor_count` now comes from an independent radius-1 local topology read and excludes the center, so radius 2+ does not inflate it into all non-center included systems.

Capped proof:

- status: `capped_scope_not_acceptable_without_adjustment`
- issue: `included_system_scope_capped_by_max_systems`
- full included count: `5`
- returned capped count: `3`
- partial capped IDs are not exposed as acceptable stored scope.

Invalid/posture proof:

- unknown system: `unknown_system`
- invalid radius: `invalid_radius`
- missing topology: `missing_topology`

## Boundary Confirmation

Confirmed no:

- provider calls
- live/API verification
- Watch dispatch
- Watch row writes
- task creation
- Discovery ref mutation
- Evidence/EVEidence writes
- Hydration or metadata writes
- schema changes
- durable `watch_result` or `watch_result_items`
- relationship tags
- Discovery ref identity changes
- topology traversal behavior changes
- imported `system_adjacency.connection_type = stargate` rename
- renderer/UI behavior beyond existing read-only command registration
- runtime enforcement or command blocking
- support artifacts
- fourth lane / fast lane work

## Verification

Passed:

```txt
node --check src\main\services\systemRadiusAuthoringPreflightService.js
node --check scripts\verify-system-radius-authoring-preflight.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check src\main\workers\systemRadiusPlanner.js
node --check scripts\verify-system-radius-planner.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:system-radius-authoring-preflight
npm.cmd run verify:planner
npm.cmd run verify:radius
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
```

`verify:protected-terms` completed with warning-only advisory output: 660 warnings across 11 changed working-set files; no renames or protected-word JSON updates were performed.

```txt
git diff --check
git status --short --branch
```

`git diff --check` passed with CRLF normalization warnings only.

`git status --short --branch` showed:

```txt
## main...origin/main
 M package.json
 M scripts/verify-command-authority.js
 M scripts/verify-enforcement-dry-run.js
 M scripts/verify-passive-side-effects.js
 M scripts/verify-service-registry.js
 M src/main/services/enforcementDryRunService.js
 M src/main/services/serviceRegistry.js
 M workspace/current.md
?? scripts/verify-system-radius-authoring-preflight.js
?? src/main/services/systemRadiusAuthoringPreflightService.js
?? workspace/DevHS304-system-radius-authoring-preflight.md
?? workspace/OverseerHS305-hs304-system-radius-authoring-preflight-review.md
```

## Risks / Open Decisions

- The command is a read-only proof surface, not Watch creation.
- Capped scope is deliberately not acceptable without operator adjustment because partial capped IDs should not become an accidental stored Watch authority.
- Watch/task result identity remains parked.

## Recommended Next Action

Overseer should review HS304. If accepted, this readout can be used as the local preflight basis before future Watch authoring UI or creation flow work.
