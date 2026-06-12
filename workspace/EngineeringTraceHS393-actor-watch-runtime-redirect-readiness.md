# EngineeringTraceHS393 - Actor Watch Runtime Redirect Readiness

## Recommendation

Ready with constraints.

Atlas is ready for a narrow Dev packet that activates an explicit, no-provider actor Watch compatibility-wrapper path. Atlas is not ready to redirect the existing `actor.watch` command by default, and is not ready to change scheduled Watch dispatch through `watchExecutor.dispatchFor(...)`.

The safest next step is not "replace actor Watch runtime." It is:

```txt
new explicit actor Watch compatibility-wrapper command / path
-> consumes the old actor.watch payload shape
-> calls the already-proven boundary-owned fixture/adapter surfaces
-> returns the old caller-facing compatibility result shape
-> proves no providers, writes, Watch mutation, collector invocation, schema, UI, or runtime enforcement
```

The existing `actor.watch` command should remain unchanged for the first packet because it is currently registered and governed as an evidence-creating, provider-capable command. Redirecting it to a fixture/no-provider compatibility result would preserve shape but not preserve current runtime meaning.

## Source Trace Findings

Current direct actor Watch runtime entry point:

- `src/main/services/serviceRegistry.js:208` registers `actor.watch` as `evidence-creating` with `EXTERNAL_LIVE_API`, `EVIDENCE_CREATION`, and `LOCAL_DATA_MUTATION` effects.
- `src/main/services/serviceRegistry.js:213` routes the command to `runActorWatchService(...)`.
- `src/main/services/mutatingActionService.js:52` resolves actor input and normalizes actor Watch scope.
- `src/main/services/mutatingActionService.js:60` applies `assertLiveAllowed('actor.watch', input, dependencies)`.
- `src/main/services/mutatingActionService.js:61` calls `collectActorWatch(input, { ...dependencies, db })`.

Current scheduled actor Watch runtime entry point:

- `src/main/watchlist/watchExecutor.js:88` selects a due Watch and calls `dispatchFor(watch)`.
- `src/main/watchlist/watchExecutor.js:103` creates a detached task.
- `src/main/watchlist/watchExecutor.js:115` and `src/main/watchlist/watchExecutor.js:130` record Watch run success/failure after runner completion/failure.
- `src/main/watchlist/watchExecutor.js:286` defines `dispatchFor(watch)`.
- `src/main/watchlist/watchExecutor.js:298` emits command `actor.watch`.
- `src/main/watchlist/watchExecutor.js:300` sets `runner: collectActorWatch`.

Current old mixed collector behavior:

- `src/main/workers/actorWatchCollector.js:13` defines `collectActorWatch`.
- `src/main/workers/actorWatchCollector.js:21` creates a `fetch_runs` row.
- `src/main/workers/actorWatchCollector.js:48` writes Discovery candidate refs.
- `src/main/workers/actorWatchCollector.js:59` enters ESI-backed killmail/detail expansion through `buildEvidencePackageFromRefs`.
- `src/main/workers/actorWatchCollector.js:78` persists Evidence/EVEidence through `EvidenceRepository.persistEvidencePackage`.
- `src/main/workers/actorWatchCollector.js:132` and `src/main/workers/actorWatchCollector.js:145` finalize the fetch run.

Current compatibility proof path:

- `src/main/services/watchActorCompatibilityWrapperContractService.js:5` defines `watch.actor_compatibility_wrapper_contract.preview`.
- `src/main/services/watchActorCompatibilityWrapperContractService.js:106` lists runtime redirect, `runActorWatchService` replacement, `watchExecutor.dispatchFor` replacement, live provider movement, Evidence landing, and Watch cadence mutation as parked.
- `src/main/services/watchActorCompatibilityWrapperContractService.js:232` names the scheduled actor dispatch shape as command `actor.watch`.
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js:5` defines the accepted adapter fixture preview.
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js:188` constructs the old caller-facing fixture result.
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js:280` maps old result fields into represented, approximate, not represented, and parked categories.
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js:305` still lists real persisted killmail/activity counts from `EvidenceRepository.persistEvidencePackage` as not represented in the adapter fixture.

Command/runtime metadata still carries old wording:

- `src/main/services/enforcementDryRunService.js:13` classifies `actor.watch` as provider-required scheduled/direct Watch collection that can write Evidence/EVEidence.
- `src/main/services/serviceRegistry.js:1617` maps `actor.watch` to `direct_actor_watch_collection` in Watch runtime fact sourcing.

## Exact Files And Functions Implicated

Would be touched by an actual `actor.watch` redirect:

- `src/main/services/mutatingActionService.js`
  - `runActorWatchService(...)`
- `src/main/services/serviceRegistry.js`
  - `actor.watch` command registration/handler
  - command authority/effects if semantics change
- `src/main/services/enforcementDryRunService.js`
  - `actor.watch` command coverage if semantics change
- `src/main/services/runtimeEnforcementBoundaryService.js` or registry runtime helpers
  - `watchRuntimeCommandKind(...)` wording if semantics change

Would be touched by a scheduled actor Watch redirect:

- `src/main/watchlist/watchExecutor.js`
  - `dispatchFor(watch)`
  - `WatchSessionExecutor.tick(...)`
  - task result shape and `recordWatchRunResult(...)` behavior

Should not be touched in the first safe packet:

- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- schema files
- renderer/UI
- provider clients
- Watch scheduler cadence mutation logic

Could be reused for a new explicit no-provider compatibility path:

- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js`
- `src/main/services/watchActorCompatibilityWrapperContractService.js`
- `src/main/services/watchActorReplacementParityService.js`
- `src/main/services/discoveryAcquisitionToEvidenceHandoffFixtureService.js`
- `src/main/services/discoveryEsiExpansionIntakePostureService.js`
- `src/main/services/evidenceWriterLandingPackageFixtureService.js`, only as proof basis, not as runtime corpus mutation.

## Old Behavior To Preserve

Old callers currently expect the actor Watch result shape returned by `collectActorWatch`, including:

- `run_id`
- `actor`
- `zkill_refs_discovered`
- `duplicate_refs_removed`
- `malformed_refs_removed`
- `unique_refs_after_dedupe`
- `pending_refs_considered`
- `already_cached_killmails`
- `expansion_attempted`
- `expansion_cap_skipped`
- `new_esi_expansions`
- `failed_expansions`
- `persisted_killmails`
- `activity_events_written`
- `api_calls_zkill`
- `api_calls_esi`
- `warnings`
- `planned_zkill_requests`
- `zkill_discovery_skipped`
- `collection_plan`
- `expansion_queue`
- `expansion_queue_summary`

The HS383 adapter fixture maps many of these fields, but not all with real runtime meaning. In particular, real provider call counts, real `fetch_runs` lifecycle, real persisted killmail/activity counts, real old collector warnings, durable Discovery ref marking, and Watch cadence mutation are not represented by the adapter fixture.

For scheduled actor Watch, the executor also expects a runner that either returns data or throws, after which it records Watch success/failure. Replacing this path before Discovery receipt/cadence behavior is live-proven would blur "adapter result shape" with "Watch run completion."

## New Boundary-Owned Route To Call

The accepted future route is:

```txt
Watch accepted actor intent / cadence
-> Discovery zKill candidate-lead acquisition
-> Discovery ESI-backed killmail/detail expansion intake
-> Evidence/EVEidence writer boundary
-> Watch receipt/cadence decision posture
```

Strong proof surfaces already accepted:

- HS374: `watch.mixed_collector_replacement_route.preview`
  - proves current Watch payload shapes can map to the future boundary-owned route without invoking mixed collectors.
- HS377: `watch.actor_replacement_parity.preview`
  - proves actor Watch behavior can be represented through the boundary-owned route.
- HS379: `discovery.esi_expansion_intake_posture.preview`
  - proves selected candidate refs can be classified for a future Discovery-owned ESI-backed killmail/detail expansion lane.
- HS381: `watch.actor_compatibility_wrapper_contract.preview`
  - proves what direct and scheduled actor Watch paths would supply to a future wrapper.
- HS383: `watch.actor_compatibility_wrapper_adapter_fixture.preview`
  - proves an old caller-facing result shape can be constructed from boundary-owned fixture outputs.
- HS387-HS392: Evidence/EVEidence writer fixture, conflict hardening, and mixed clean/conflict package proof
  - prove the writer landing package enough for fixture confidence, including conflict dependent-row suppression.

Still fixture-only and not live/provider ready:

- zKill candidate-lead acquisition as real Discovery runtime service.
- durable Discovery ref writes through the replacement path.
- ESI-backed killmail/detail expansion as real Discovery runtime service.
- Evidence/EVEidence writer landing through the actor replacement chain.
- Watch receipt/cadence mutation from Discovery/Evidence outcomes.
- scheduled executor redirect.
- system/radius Watch replacement.

## Smallest Safe Next Dev Packet

Recommended first packet:

```txt
Add an explicit no-provider actor Watch compatibility-wrapper activation path.
```

Shape:

- New explicit command or internal service path, not the existing `actor.watch` default handler.
- Input: old actor Watch payload shape after actor identity is explicit or resolvable.
- Output: old caller-facing compatibility result shape, using HS383 adapter mapping.
- Classification: read-only / no-provider / no-write, unless Overseer deliberately chooses a different effect class.
- Verifier proves:
  - `actor.watch` handler remains unchanged.
  - `runActorWatchService(...)` remains unchanged.
  - `watchExecutor.dispatchFor(...)` remains unchanged.
  - `collectActorWatch(...)` is not invoked.
  - no provider clients are invoked.
  - no table counts change.
  - system/radius is untouched.

Do not make the first packet a default `actor.watch` redirect.

Why:

- Current `actor.watch` is still command-authority/effects classified as provider/evidence-creating.
- Current old callers may rely on real provider and write behavior.
- A no-provider adapter result would be semantically different even if the field names match.
- Scheduled executor result handling is tied to Watch run success/failure mutation.

## Wrapper Versus New Explicit Command

Recommendation: add a new explicit command first.

A compatibility wrapper is the correct migration mechanism, but it should not take over the existing `actor.watch` command as its first runtime appearance. A new explicit command lets Atlas prove the wrapper as callable runtime code while keeping old `actor.watch` behavior and scheduled dispatch stable.

Suggested command naming should avoid making old mixed terms doctrine. A safe shape would be along the lines of:

```txt
watch.actor_compatibility_wrapper.preview
```

or another Overseer-selected name that clearly marks it as a no-provider compatibility surface.

Do not use the new command to imply live Discovery, ESI expansion, Evidence landing, Watch completion, or collector retirement.

## Terminology Drift Risks

Term classifications:

- `actor.watch`
  - temporary compatibility surface / current Atlas-owned command.
  - Keep as current command identity; do not treat it as future architecture doctrine.

- `collectActorWatch`, `actorWatchCollector`, `collector`, `collection`
  - old mixed-boundary terminology to avoid adopting.
  - Harmless only as source-trace names or explicit legacy labels.

- `direct_actor_watch_collection`, `scheduled_or_direct_watch_collection`
  - old mixed-boundary terminology to avoid adopting in future command/effects language.

- `compatibility wrapper`
  - temporary compatibility surface.
  - Safe if it explicitly means old shape bridging into boundary-owned internals.

- `expansion`
  - acceptable only when boundary-qualified.
  - Safe: `Discovery ESI-backed killmail/detail expansion`.
  - Risky: generic `expansion` as an owner or as a Watch-owned behavior.

- `Discovery collector`
  - acceptable boundary-qualified term only if it means Discovery-owned acquisition movement.
  - Do not use it to preserve old Watch collector ownership.

- Old result fields such as `zkill_refs_discovered`, `expansion_attempted`, `persisted_killmails`, and `activity_events_written`
  - temporary compatibility surface.
  - Useful for adapter parity, but not future receipt doctrine.

- `Evidence/EVEidence writer`
  - acceptable boundary-qualified term.
  - Means final landed memory, not Discovery completion.

## Gaps And Risks

Blocking risks for default `actor.watch` redirect:

- The compatibility adapter is fixture-only.
- Live zKill and live ESI replacement lanes are not implemented.
- Durable Discovery ref state through replacement path is not proven.
- Evidence writer landing is proven separately, but not integrated into actor replacement runtime.
- Old command metadata still says `actor.watch` is provider/evidence-creating.
- Scheduled Watch executor mutates Watch run success/failure after runner completion and should not consume fixture adapter results as if they were real Watch completion.

Non-blocking for a new explicit no-provider wrapper command:

- The old result shape is already mapped enough to prove compatibility posture.
- Non-invocation and no-mutation proof patterns exist.
- Service registry, command authority, passive side-effect, and enforcement dry-run verification patterns are already established for these proof surfaces.

## Parked Items

Keep parked:

- default `actor.watch` redirect
- scheduled `watchExecutor.dispatchFor(...)` redirect
- live zKill
- live ESI
- durable Discovery ref writes through the replacement path
- Evidence/EVEidence writes through actor replacement runtime
- Watch cadence/state mutation from replacement receipt
- system/radius Watch
- mixed collector retirement
- schema
- runtime enforcement activation / command blocking
- renderer UI
- support artifacts
- source-term renames
- protected-word JSON updates

## Rollback / Compatibility Checks For Dev

Dev should include checks that prove:

- `actor.watch` still resolves to `runActorWatchService(...)` if the first packet uses a new explicit command.
- `runActorWatchService(...)` still calls `collectActorWatch(...)`.
- `watchExecutor.dispatchFor(actor)` still returns command `actor.watch` and `runner: collectActorWatch`.
- New wrapper command does not import or invoke `actorWatchCollector.js`.
- New wrapper command returns adapter-style old caller-facing fields.
- New wrapper command clearly marks fixture/no-provider/no-write posture.
- Table counts are unchanged before/after.
- No zKill, ESI, Hydration, Evidence, Watch cadence, schema, task runner, or renderer boundary is touched.

If Overseer later authorizes an actual `actor.watch` redirect, Dev should add a stricter rollback check that can restore old `actor.watch -> runActorWatchService -> collectActorWatch` behavior cleanly. That is not the recommended first packet.

## Acceptance Criteria And Verification Commands

Acceptance criteria for the recommended next packet:

- Actor-only.
- New explicit compatibility-wrapper path exists.
- Existing `actor.watch` default runtime remains unchanged.
- Scheduled Watch dispatch remains unchanged.
- `collectActorWatch(...)` is not invoked by the new wrapper path.
- System/radius Watch is untouched.
- Candidate refs remain possible leads, not Evidence/EVEidence.
- Discovery ESI-backed killmail/detail expansion remains Discovery-owned provider movement, not Hydration.
- Evidence/EVEidence writer boundary is represented only; no corpus write occurs.
- No provider calls, live/API movement, DB writes, Watch mutation, schema, runtime enforcement, command blocking, UI, support artifact, source-term rename, or protected-word JSON update occurs.
- Old result compatibility gaps remain visible.

Expected verification commands:

```txt
node --check src\main\services\[new-wrapper-service].js
node --check scripts\verify-[new-wrapper-command].js
npm.cmd run verify:[new-wrapper-command]
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:watch-executor
npm.cmd run verify:mutating-services
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If the packet touches `actor.watch`, `runActorWatchService(...)`, or `watchExecutor.dispatchFor(...)`, add explicit focused assertions for old behavior preservation or stop and route back to Overseer.

## Human / Overseer Decisions Needed

Overseer should decide:

- whether the next Dev packet is a new explicit no-provider compatibility-wrapper command, as recommended here
- what command name should be used so old mixed terminology does not become doctrine
- whether `actor.watch` should remain untouched until live Discovery lanes exist
- whether command metadata should stay old/current for `actor.watch` until a real redirect is authorized

No Dev runway is opened by this artifact.

