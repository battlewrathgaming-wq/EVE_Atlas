# OverseerHS309 HS307 System Radius Acceptance Payload Acceptance

Status: accepted
Date: 2026-06-05
Owner: Overseer

Reviewed runway: `workspace/OverseerHS307-system-radius-watch-authoring-acceptance-payload-runway.md`
Reviewed handoff: `workspace/DevHS307-system-radius-watch-authoring-acceptance-payload.md`
Reviewed redirect: `workspace/OverseerHS308-hs307-system-radius-acceptance-payload-review.md`

## Decision

HS307 is accepted after HS308 revision.

The revised preview now honestly discloses the current mutation-contract gap instead of implying that accepted preflight IDs can already be consumed by current `watch.create`.

## Accepted Result

Accepted command:

```txt
watch.system_radius_acceptance_payload.preview
```

Accepted posture:

- local-only
- read-only
- renderer-eligible readout
- no Watch row writes
- no Watch dispatch
- no provider calls
- no task creation
- no schema change
- no `watch.create` behavior change
- no topology traversal behavior change
- no Discovery/Evidence/Hydration mutation
- no UI behavior
- no runtime enforcement
- no support artifact creation
- no fourth-lane / fast-lane work

The preview composes accepted HS304 system/radius authoring preflight output into a candidate future Watch creation mutation-contract payload.

It preserves:

- accepted `included_system_ids` as the future stored-scope authority;
- center system and radius as provenance/explanation only;
- capped, unknown, invalid, missing-topology, and forged/mismatched included-ID cases as not acceptable.

## HS308 Correction Accepted

The revised HS307 output now discloses:

```txt
current_watch_create_compatibility: requires_future_mutation_contract
current_watch_create_consumes_preflight_included_ids: false
future_mutation_contract_required: true
future_payload_directly_executable_now: false
```

The current `watch.create` path remains:

```txt
serviceRegistry watch.create
-> mutatingActionService.runWatchCreateService
-> normalizeSystemRadiusWatchScope
-> watchlistRepository.addSystemRadiusWatch
-> TopologyService.getSystemsWithinRadius
```

That means current `watch.create` still recomputes included systems from center/radius and does not yet consume accepted HS304 preflight IDs.

This is acceptable for HS307 because the packet is a read-only future contract proof, not mutation implementation.

## Verification Reviewed

Reviewed passing evidence:

```txt
node --check src\main\services\systemRadiusAcceptancePayloadService.js
node --check scripts\verify-system-radius-acceptance-payload.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:system-radius-acceptance-payload
npm.cmd run verify:system-radius-authoring-preflight
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:protected-terms` produced warning-only advisory output: 663 warnings across 11 changed working-set files. No renames or protected-word JSON updates were performed.

`git diff --check` passed with CRLF normalization warnings only.

## Resting State

HS307 can rest.

The next possible seam, if Human/Overseer chooses it later, is an actual `watch.create` mutation-contract packet that consumes accepted preflight `included_system_ids` as stored-scope authority.

That future seam is not open now.

## Parked

Keep parked:

- actual Watch row writes;
- actual `watch.create` mutation behavior change;
- Watch execution;
- provider/live testing;
- topology behavior changes beyond the accepted contract;
- Discovery ref identity redesign;
- durable Watch/task result identity;
- relationship tags;
- schema;
- UI;
- support artifacts;
- active enforcement;
- fourth lane / fast lane.
