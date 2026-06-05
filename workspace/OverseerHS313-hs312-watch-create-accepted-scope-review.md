# OverseerHS313 HS312 Watch Create Accepted Scope Review

Status: accepted
Date: 2026-06-05
Owner: Overseer

Reviewed runway: `workspace/OverseerHS312-watch-create-accepted-scope-mutation-contract-runway.md`
Reviewed handoff: `workspace/DevHS312-watch-create-accepted-scope-mutation-contract.md`

## Decision

HS312 is accepted.

The accepted-preflight `watch.create` path now performs the intended print-and-lock mutation:

```txt
preflight concrete system list -> accepted included_system_ids -> stored system_watches.included_system_ids
```

## Accepted Result

Accepted behavior:

- `watch.create` can consume accepted system/radius included IDs from accepted preflight/acceptance payload shapes.
- `watch.create` stores the accepted IDs exactly in `system_watches.included_system_ids`.
- Center system and radius are preserved as provenance/explanation/management fields.
- The accepted-preflight path reports `scope_authority.source: accepted_preflight_included_system_ids`.
- The accepted-preflight path reports `topology_recomputed_for_storage: false`.
- Legacy direct center/radius authoring remains separate as `legacy_center_radius_authoring`.

Important nuance:

The accepted-preflight path may validate accepted IDs against local topology at authoring time, but it does not replace or reorder the accepted list. The stored accepted list remains the Watch scope authority for later execution.

## Boundary Accepted

Accepted mutation surface:

```txt
system_watches
```

Confirmed unopened:

- Watch execution;
- Watch dispatch;
- runtime task creation;
- provider calls;
- Discovery ref mutation;
- Evidence/EVEidence writes;
- Hydration writes;
- schema changes;
- topology traversal behavior changes;
- renderer/UI behavior;
- support artifacts;
- runtime enforcement;
- durable Watch/task result identity;
- relationship tags;
- fourth lane / fast lane;
- source-owned term renames;
- protected-word JSON updates.

## Verification Reviewed

Reviewed passing evidence:

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

Overseer reran:

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
```

Focused proof showed:

- stored IDs: `[30003597,30003601,30003599,30003598,30003596]`
- stored IDs preserve accepted order
- `scope_authority.source: accepted_preflight_included_system_ids`
- `center_radius_role: provenance_and_management`
- `topology_recomputed_for_storage: false`
- legacy direct authoring remains separate with `topology_recomputed_for_storage: true`
- only `system_watches` changed during authoring proof

`verify:protected-terms` produced warning-only advisory output: 440 warnings across 9 changed working-set files. No renames or protected-word JSON updates were performed.

`git diff --check` passed with CRLF normalization warnings only.

## Resting State

HS312 can rest.

The Watch authoring spine now has:

```txt
authoring preflight -> accepted payload -> watch.create stored accepted scope
```

Likely future seams, not open now:

- renderer/operator confirmation path for accepted Watch setup;
- Watch execution smoke using a real authored Watch;
- Watch/task result identity;
- support artifact or runtime enforcement follow-up only if newly relevant.

## Parked

Keep parked:

- Watch execution;
- provider/live testing;
- Discovery ref identity redesign;
- durable Watch/task result identity;
- relationship tags;
- schema;
- UI;
- support artifacts;
- active enforcement;
- fourth lane / fast lane.
