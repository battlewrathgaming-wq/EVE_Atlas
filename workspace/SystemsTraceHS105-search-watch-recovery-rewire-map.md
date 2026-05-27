# Systems Trace HS105: Search / Watch / Recovery Rewire Map

Role: Atlas Systems Auditor
Date: 2026-05-27
Status: Supplementary no-edit trace

This note condenses the current implementation trace for the proposed two-clock Recovery Sequencer model. It does not implement code, change schema, create a Dev runway, or change product direction.

## Summary

Atlas already has the right conceptual split for manual search:

```txt
manual.discovery -> Discovery refs only
queue.selection -> read-only selected ref preview
manual.expansion -> explicit selected ESI expansion
```

The main rewire target is Watch/radius execution. Today, scheduled Watch collectors can still perform discovery and ESI expansion in the same run. Future Recovery Sequencer work should split those clocks:

```txt
Fanout/acquisition clock: discover or refresh candidate refs.
Recovery wheel: release selected expansion/hydration work slowly.
```

Key rule:

```txt
Fanout creates candidate work.
Recovery spends provider calls.
Fanout does not drain its own fanout.
```

## Current Manual / Live Search Path

Renderer path:

- `src/renderer/actions.js`
  - `manualDiscoveryPreflight()` calls `scope.validate` and `live.gate`.
  - `runManualDiscovery()` calls `service.invoke('manual.discovery')`.

Backend path:

- `src/main/services/serviceRegistry.js`
  - `manual.discovery` routes to `runManualDiscoveryService`.
- `src/main/services/mutatingActionService.js`
  - `runManualDiscoveryService()` normalizes scope, checks Live gate, then calls `discoverManualRefs()`.
- `src/main/workers/manualDiscoveryWorker.js`
  - creates a `manual_discovery` fetch run
  - calls zKill only
  - writes `discovered_killmail_refs`
  - writes no `killmails`
  - writes no `activity_events`
  - finalizes with zero ESI expansion

Trace finding:

Manual/live discovery is already close to the first-clock model. It asks a narrow provider question and stores returned candidates without ESI fanout.

## Current Queue / Enrich Path

Renderer path:

- `src/renderer/queueWatch.js`
  - `manualExpansionPreflight()` calls `scope.validate`, `queue.selection`, and `live.gate`.
  - `runManualExpansion()` calls `service.invoke('manual.expansion')` only after confirmation and selected refs exist.

Backend path:

- `src/main/services/serviceRegistry.js`
  - `queue.selection` routes to read-only `buildQueueExpansionSelection`.
  - `manual.expansion` routes to `runManualExpansionService`.
- `src/main/services/queueSelectionService.js`
  - previews selectable `pending` / `failed` Discovery refs
  - reports expected ESI calls
  - writes nothing
- `src/main/workers/manualExpansionWorker.js`
  - creates a `manual_expand` fetch run
  - selects queued refs under cap
  - marks selected refs
  - calls `buildEvidencePackageFromRefs()`
  - persists successful ESI-expanded Evidence/EVEidence
  - marks expanded/cached/failed queue states

Trace finding:

`manual.expansion` is the current second-clock stand-in. It is explicit and selected, but it still executes as an immediate manual drain path rather than a paced Recovery Sequencer release loop.

## Current Watch / Radius Path

Renderer path:

- `src/renderer/queueWatch.js`
  - `watch.executor.arm` arms the session and may dispatch one due Watch.
  - renderer does not directly invoke `actor.watch` or `system.radius.watch`.

Backend path:

- `src/main/watchlist/watchExecutor.js`
  - starts disarmed
  - dispatches at most one due Watch per tick
  - dispatches actor Watch to `collectActorWatch`
  - dispatches system/radius Watch to `collectSystemRadiusWatch`
- `src/main/workers/actorWatchCollector.js`
  - drains pending actor refs if present
  - otherwise calls zKill discovery
  - writes Discovery refs
  - selects refs
  - calls ESI expansion under cap
  - persists Evidence/EVEidence
- `src/main/workers/systemRadiusCollector.js`
  - drains pending system/radius refs if present
  - otherwise calls zKill discovery per planned system
  - writes Discovery refs
  - selects refs
  - calls ESI expansion under cap
  - persists Evidence/EVEidence

Trace finding:

Watch/radius currently fuses the two clocks. It has good gates and caps, but a due Watch can still discover and enrich in one dispatched run.

## Rewire Point

Least disruptive future direction:

1. Keep `manual.discovery` as the immediate/narrow first-clock path.
2. Keep `queue.selection` as the read-only selection preview.
3. Treat `manual.expansion` as the compatibility surface for future Recovery Sequencer release.
4. Split Watch collectors so due Watch/radius acquisition can stop after Discovery refs are written.
5. Move pending-ref drain and selected ESI expansion out of Watch collectors into the Recovery Sequencer path.

Candidate future service split:

```txt
manual.discovery
watch.discovery
queue.selection / recovery.selection
recovery.release
metadata.hydration / readability.recovery
```

The exact names are not accepted terms. They are placeholders for function-boundary discussion only.

## Boundary Cautions

- Do not make `discovered_killmail_refs` the Sequencer table.
- Do not treat queued refs as Evidence/EVEidence.
- Do not let Live search perform automatic downstream fanout.
- Do not let Watch/radius acquisition drain its own fanout.
- Do not merge ESI evidence expansion with metadata hydration.
- Do not imply completeness from a discovery run.
- Waiting/provider deferral remains non-failure.
- R-Scanner / R-scan remains presentation language, not backend source authority.

## Verification Targets For Future Dev

Relevant existing non-live checks:

```powershell
npm.cmd run verify:manual-discovery
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:live-api-gate
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-offline-readout
npm.cmd run verify:partial-failures
npm.cmd run verify:hydration
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
```

Future proof should show:

- manual discovery queues refs and performs zero ESI expansion
- queue selection remains read-only
- recovery release expands only explicitly selected refs
- due Watch discovery can complete without ESI expansion
- pending refs are visible as recoverable work, not silently drained by acquisition
- provider deferral leaves work recoverable and does not mark Evidence failure
- hydration remains readability-only and separate from Evidence recovery

## No Code Changed

This supplementary documentation added only this workspace trace note. It did not change source code, schema, runtime behavior, docs authority, or provider behavior.
