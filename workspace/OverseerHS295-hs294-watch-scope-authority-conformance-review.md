# OverseerHS295 HS294 Watch Scope Authority Conformance Review

Status: accepted
Date: 2026-06-05
Reviewer: Overseer

## Reviewed

- `workspace/OverseerHS294-watch-scope-authority-conformance-runway.md`
- `workspace/DevHS294-watch-scope-authority-conformance.md`
- `src/main/services/watchScopeAuthorityConformanceService.js`
- `scripts/verify-watch-scope-authority-conformance.js`
- related service registry, command authority, enforcement dry-run, passive side-effect, package, and workspace-current updates

## Acceptance

HS294 is accepted.

Atlas now has a read-only/local-only Watch scope authority conformance preview:

```txt
watch.scope_authority_conformance.preview
```

Accepted result:

```txt
current conformance status: gap
```

This is the correct outcome for the packet. The preview proves the accepted model and names the current execution mismatch without correcting execution behavior.

## Accepted Findings

- SDE source material is import/source provenance only.
- Runtime geometry substrate is local topology lookup tables.
- Stored `system_watches.included_system_ids` is the accepted Watch scope authority after Watch acceptance.
- Center system and radius are provenance/explanation after Watch acceptance.
- Recomputed topology is diagnostic comparison only under the accepted model.
- Discovery refs remain possible leads / provenance, not Evidence/EVEidence.
- Evidence/EVEidence remains ESI-expanded killmail records only.

Current source posture:

- `watchlistRepository.addSystemRadiusWatch`: conforms for local topology lookup authoring/preflight geometry.
- `watchScheduler.buildWatchScheduleStatus`: conforms for readout parsing of stored included/excluded scope.
- `watchOfflineReadout.buildWatchOfflineReadout`: partial; uses stored scope for local context when valid, with center fallback only as diagnostic/readout posture.
- `watchExecutor.dispatchFor`: gap; system-radius execution payload is built from center/radius/caps rather than stored included IDs.
- `systemRadiusCollector.collectSystemRadiusWatch`: gap; collection replans from input/topology unless fixture planner output is injected.
- `systemRadiusPlanner.planSystemRadiusWatch`: partial; recompute remains useful for authoring/preflight or diagnostic comparison, but not accepted execution authority.
- system/radius Discovery ref identity remains center-only and separate from Watch scope authority.

## Boundary Check

Accepted boundaries:

- no zKill, ESI, SDE download, or provider calls
- no Watch dispatch
- no Watch arm/tick
- no task creation
- no queue dispatch
- no writes to Watch rows, Discovery refs, Evidence/EVEidence, Hydration, metadata, API logs, Assessment Memory, or support artifacts
- no schema changes
- no execution correction
- no `watch_result`, `watch_result_items`, relationship tags, or relationship truth
- no renderer/UI work beyond read-only command registration
- no runtime enforcement or command blocking
- no fourth lane / fast lane work

## Verification

Overseer re-ran:

```txt
node --check src\main\services\watchScopeAuthorityConformanceService.js
node --check scripts\verify-watch-scope-authority-conformance.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-enforcement-dry-run.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:watch-scope-authority-conformance
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
```

Result:

- All syntax checks passed.
- `verify:watch-scope-authority-conformance` passed and proved table counts unchanged.
- Registry, command authority, enforcement dry-run, and passive side-effect checks passed.
- `verify:protected-terms` passed with warning-only advisory output; no renames or protected-word JSON updates were performed.
- `git diff --check` passed with CRLF normalization warnings only.

## Accepted Next Correction Seam

If this line continues, the next mechanical seam is:

```txt
system/radius Watch execution should consume accepted stored included_system_ids
```

Likely correction surface:

```txt
watchExecutor.dispatchFor
systemRadiusCollector.collectSystemRadiusWatch
systemRadiusPlanner.planSystemRadiusWatch
```

The correction should preserve recompute as authoring/preflight or diagnostic comparison only.

## Parked

Do not infer these from HS294:

- durable `watch_result` or `watch_result_items`
- relationship tags or relationship truth
- Discovery ref identity changes
- schema migration
- provider movement
- Watch dispatch behavior beyond the named correction seam
- renderer UI behavior
- active runtime enforcement
- support artifacts
- fourth lane / fast lane

## Resting State

HS294 can rest as accepted proof. Atlas now knows the current gap before building durable Watch result semantics.

No new Dev runway is opened by this review.
