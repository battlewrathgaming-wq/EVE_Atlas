# EngineeringTraceHS426 - Actor Watch Production-Adjacent Adapter Insertion Trace

Status: advisory/source-trace complete  
Date: 2026-06-11  
Role: Engineering / source trace

## 1. Request Restatement

HS426 asks where a future boundary-owned actor Watch controlled adapter could attach near production runtime surfaces, while still remaining disabled from default `actor.watch` and scheduled Watch behavior. The review must identify insertion points, caller return expectations, command-authority implications, provider/fake-client boundaries, verification requirements, and stop conditions before any Dev packet creates a disabled seam.

This is assurance only. It does not authorize runtime redirect, collector retirement, live provider movement, or implementation.

## 2. Files Traced

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/OverseerHS426-actor-watch-production-adjacent-adapter-insertion-trace-request.md`
- `workspace/OverseerHS425-actor-watch-runtime-replacement-decision-surface.md`
- `workspace/OverseerHS424-hs423-actor-watch-controlled-adapter-return-path-review.md`
- `workspace/DevHS423-actor-watch-controlled-adapter-return-path-proof.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/discovery/actorWatchCompatibilitySummary.js`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-watch-actor-controlled-adapter-return-path.js`
- `scripts/verify-watch-actor-controlled-runtime-adapter-fixture.js`

## 3. Direct `actor.watch` Insertion-Point Map

Current direct production path:

```txt
serviceRegistry COMMANDS["actor.watch"]
-> runActorWatchService(db, payload, context)
-> resolveActorInput(...)
-> normalizeActorWatchScope(...)
-> assertLiveAllowed("actor.watch", input, dependencies)
-> collectActorWatch(input, { ...dependencies, db })
-> return compatibility summary object
```

Source basis:

- `src/main/services/serviceRegistry.js:211` defines `actor.watch`.
- `src/main/services/serviceRegistry.js:213` gives it `external-live-api`, `evidence-creation`, and `local-data-mutation` effects.
- `src/main/services/serviceRegistry.js:215` requires `confirm:actor.watch`.
- `src/main/services/serviceRegistry.js:217` routes to `runActorWatchService(...)`.
- `src/main/services/mutatingActionService.js:52` defines `runActorWatchService(...)`.
- `src/main/services/mutatingActionService.js:60` calls `assertLiveAllowed("actor.watch", ...)`.
- `src/main/services/mutatingActionService.js:61` calls `collectActorWatch(...)`.

Recommended production-adjacent insertion posture:

- Do not insert inside `actor.watch`.
- Do not change `runActorWatchService(...)`.
- Do not branch `runActorWatchService(...)` by payload flag.
- Add a separate explicit service command if Dev opens a seam.

Reason:

`actor.watch` is currently a live/evidence-creating command with authority and provider/storage implications. A disabled adapter seam has a different safety profile. Sharing the command or handler would make it easy to confuse disabled proof behavior with production execution.

## 4. Scheduled Watch Insertion-Point Map

Current scheduled actor Watch path:

```txt
WatchSessionExecutor.tick(...)
-> selectDueWatch(schedule.due)
-> dispatchFor(watch)
-> actionGate(dispatch.command, dispatch.payload)
-> taskRunner.runDetachedTask(...)
-> dispatch.runner(dispatch.payload, { ...dependencies, db, signal })
-> recordWatchRunResult(...)
-> return { status: "succeeded", data: { watch, collection: data } }
```

Source basis:

- `src/main/watchlist/watchExecutor.js:88` calls `dispatchFor(watch)`.
- `src/main/watchlist/watchExecutor.js:95` gates the selected dispatch command.
- `src/main/watchlist/watchExecutor.js:103` creates the detached task.
- `src/main/watchlist/watchExecutor.js:111` invokes `dispatch.runner(...)`.
- `src/main/watchlist/watchExecutor.js:115` records Watch success.
- `src/main/watchlist/watchExecutor.js:124` returns task result data.
- `src/main/watchlist/watchExecutor.js:126` preserves the runner return under `data.collection`.
- `src/main/watchlist/watchExecutor.js:286` defines `dispatchFor(...)`.
- `src/main/watchlist/watchExecutor.js:298` returns command `actor.watch`.
- `src/main/watchlist/watchExecutor.js:300` returns runner `collectActorWatch`.

Recommended scheduled insertion posture:

- Do not alter `dispatchFor(...)` in the next seam.
- Do not alter `WatchSessionExecutor.tick(...)`.
- Do not alter `TaskRunner` behavior.
- If scheduled-style compatibility is needed, use the HS423 helper `buildScheduledActorWatchCompatibilityResult(...)` in a verifier or disabled command, not the real executor.

Reason:

Scheduled Watch is cadence/runtime behavior. A disabled adapter seam can prove return shape without creating tasks, dispatching Watch, or mutating Watch cadence.

## 5. Caller / Return-Shape Requirements

Direct caller shape:

- The direct caller must receive the compatibility summary object as the top-level result.
- HS423 proves this with `buildDirectActorWatchCompatibilityReturn(summary) === summary`.

Scheduled-style shape:

- The scheduled wrapper must preserve the same summary under `data.collection`.
- HS423 proves this with `{ status: "succeeded", data: { watch, collection: summary } }`.

Compatibility fields:

The expected field set is centralized in `src/main/discovery/actorWatchCompatibilitySummary.js`:

```txt
run_id
actor
zkill_refs_discovered
duplicate_refs_removed
malformed_refs_removed
unique_refs_after_dedupe
pending_refs_considered
already_cached_killmails
expansion_attempted
expansion_cap_skipped
new_esi_expansions
failed_expansions
persisted_killmails
activity_events_written
api_calls_zkill
api_calls_esi
warnings
planned_zkill_requests
zkill_discovery_skipped
collection_plan
expansion_queue
expansion_queue_summary
```

Source basis:

- `src/main/discovery/actorWatchCompatibilitySummary.js` defines the field list and builders.
- `workspace/DevHS423-actor-watch-controlled-adapter-return-path-proof.md` records field count `22`, `missing: []`, `extra: []`, `matches: true`.
- `workspace/OverseerHS424-hs423-actor-watch-controlled-adapter-return-path-review.md` accepts direct and scheduled-style return proof.

Compatibility-only terms:

- `collection`
- `collection_plan`
- `expansion_queue`
- `expansion_queue_summary`
- `zkill_refs_discovered`
- `zkill_discovery_skipped`

These should remain old-return/debug projection fields only, not future Discovery receipt doctrine.

## 6. Command-Authority / Service-Registry / Enforcement Implications

Adding a disabled adapter seam would touch these surfaces:

- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- a focused `scripts/verify-watch-actor-*` verifier
- likely `package.json` for a focused npm verifier script

Current relevant source facts:

- Existing `watch.actor_controlled_runtime_adapter_fixture.preview` is registered as `metadata-only`, `local-data-mutation`, `renderer: false`: `src/main/services/serviceRegistry.js:864`.
- Existing fixture command routes to `buildWatchActorControlledRuntimeAdapterFixturePreview(...)`: `src/main/services/serviceRegistry.js:869`.
- Enforcement dry-run classifies the existing fixture command as `fixture_only_non_production`: `src/main/services/enforcementDryRunService.js:102`.
- Command authority asserts the existing fixture command is `metadata-only`, declares fixture local mutation, and is not renderer eligible: `scripts/verify-command-authority.js:154` through `:155`, `:238`.
- Service registry asserts the existing fixture command is not renderer eligible and does not redirect actor Watch: `scripts/verify-service-registry.js:307`, `:1028` through `:1029`.
- Passive-side-effect sweep includes the existing fixture command and proves caller/operator DB table counts do not change: `scripts/verify-passive-side-effects.js:196`, `:322`.

Implication:

A new disabled seam should be treated like fixture-only internal mutation if it uses disposable DBs. It should not inherit `actor.watch` authority, live provider effects, renderer eligibility, or evidence-creating classification.

Recommended command posture:

```txt
classification: metadata-only
effects: [local-data-mutation]
renderer: false
authority: none, unless Overseer wants explicit non-renderer confirmation
enforcement dry-run: fixture_only_non_production
external_io_dependency: none
storage_action_class: fixture_disposable_db_mutation
```

Do not classify the disabled seam as:

- `evidence-creating`
- `external-live-api`
- `covered_provider_and_storage_gated`
- renderer eligible
- `actor.watch`
- `watch.executor.*`

## 7. Disabled Seam Naming Recommendation

Recommended name:

```txt
watch.actor_controlled_adapter_disabled.preview
```

Why:

- `watch.actor` keeps it near the actor Watch replacement family.
- `controlled_adapter` ties it to the accepted HS419/HS423 chain.
- `disabled` makes clear it is not default `actor.watch` behavior.
- `.preview` follows existing proof/readout command style.
- It avoids saying `production`, `redirect`, `execute`, `dispatch`, or `collector`.

Acceptable alternate if Overseer wants stronger continuity with existing name:

```txt
watch.actor_controlled_runtime_adapter_disabled.preview
```

Naming cautions:

- Avoid `actor.watch.adapter`, because it sounds like default command replacement.
- Avoid `watch.actor_runtime_redirect.preview`, because it implies redirect.
- Avoid `collector`, because that preserves the old mixed-boundary model.
- Avoid `execute`, because this seam should not be live/provider/operator execution.

## 8. Provider / Fake-Client Injection Boundary

Required boundary for a disabled seam:

- Use injected fake zKill and fake ESI clients only.
- Do not instantiate `HttpClient`, `ZKillDiscoveryClient`, or `EsiClient` inside the seam.
- Do not accept renderer-supplied provider clients or provider endpoint paths.
- Do not call live zKill or ESI.
- Keep disposable DB mutation internal to the proof path, or prove caller/operator DB non-mutation before/after.
- Preserve existing helper ownership:
  - Watch-shaped input / actor scope normalization as compatibility input only.
  - Discovery zKill candidate-lead acquisition through `discoverActorRefs(...)`.
  - Discovery pending candidate rehydration through `pendingActorDiscovery(...)`.
  - Discovery ESI-backed selected-ref package through `buildEvidencePackageFromRefs(...)`.
  - Evidence/EVEidence writer landing only in disposable DBs.
  - Hydration, Observation, and Assessment untouched.

Existing proof basis:

- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js` uses `fixtureZkillClient(...)` and `fixtureEsiClient(...)`.
- It reports `provider_calls: 0` and `live_api_calls: 0`.
- It reports `production_actor_watch_redirected: false`, `runActorWatchService_changed: false`, and `watchExecutor_dispatchFor_changed: false`.
- The service wrapper snapshots caller/operator DB counts and reports unchanged operator corpus state.

## 9. Required Verification For A Future Dev Packet

Required focused verifier:

```txt
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
```

Expected assertions:

- New command is registered under the accepted disabled name.
- New command is non-renderer eligible.
- New command is `metadata-only`.
- New command declares only fixture/local mutation, not external live API or evidence creation.
- New command appears in enforcement dry-run as `fixture_only_non_production`.
- New command appears in passive-side-effect sweep and does not mutate caller/operator DB counts.
- New command returns direct compatibility summary with 22-field parity.
- New command can return scheduled-style wrapper using `data.collection` without invoking `WatchSessionExecutor.tick(...)`.
- `actor.watch` registry entry remains unchanged.
- `runActorWatchService(...)` source remains unchanged.
- `watchExecutor.dispatchFor(...)` source remains unchanged.
- `dispatchFor(actor)` still returns `runner: collectActorWatch`.
- No new path imports `actorWatchCollector.js`.
- No new path calls `collectActorWatch(...)`.
- No live provider clients are instantiated.
- `provider_calls === 0`.
- `live_api_calls === 0`.
- `operator_corpus_non_mutation_proof.unchanged === true`.
- System/radius Watch is untouched.

Recommended existing verification suite to reuse:

```txt
node --check <new service/module/verifier files>
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
```

Important source checks:

```txt
rg -n "require\(.*actorWatchCollector|collectActorWatch\(" <new files>
rg -n "watch.actor_controlled_adapter_disabled.preview|actor.watch|runActorWatchService|dispatchFor|collectActorWatch" src\main\services src\main\discovery src\main\watchlist scripts package.json
```

## 10. Stop Conditions

Block Dev or return to Overseer if any proposed packet would:

- change production `actor.watch`
- change `runActorWatchService(...)`
- change `watchExecutor.dispatchFor(...)`
- change `WatchSessionExecutor.tick(...)`
- change `collectActorWatch(...)`
- import `actorWatchCollector.js` from the new adapter path
- call `collectActorWatch(...)` from the new adapter path
- make the disabled seam renderer eligible
- classify the disabled seam as `evidence-creating`
- add `external-live-api` effect to the disabled seam
- instantiate live `HttpClient`, `ZKillDiscoveryClient`, or `EsiClient`
- call zKill or ESI
- mutate the operator DB
- write operator Discovery refs
- write operator Evidence/EVEidence
- write Hydration/readability metadata
- mutate Watch cadence or Watch run records
- create tasks, queues, leases, dispatcher behavior, or runtime enforcement
- change schema
- touch system/radius Watch behavior
- rename Atlas source terms or update protected-word JSON
- present compatibility summary fields as future Discovery receipt doctrine

## 11. Recommendation

Recommendation: ready for disabled controlled adapter seam.

The source trace supports opening a narrow Dev packet for a new explicit disabled adapter command/service seam, provided it remains separate from production `actor.watch`, scheduled Watch, live providers, and operator corpus writes.

The seam should be non-renderer, fixture-only/non-production, fake-client/disposable-DB backed, and verified as a command-authority/enforcement/passive-side-effect safe surface.

This is not readiness for:

- default actor Watch redirect
- scheduled Watch redirect
- live zKill or ESI movement
- operator corpus writes from the new path
- collector retirement

## 12. Smallest Safe Next Packet

Smallest safe Dev packet:

```txt
Add a disabled actor Watch controlled adapter service command:

Command:
watch.actor_controlled_adapter_disabled.preview

Behavior:
- non-renderer service command only
- fixture-only / disabled from default runtime
- uses fake/injected provider clients only
- may use internal disposable DBs only
- returns the accepted direct compatibility summary shape
- optionally returns scheduled-style wrapper posture in proof output
- proves production actor.watch, runActorWatchService, watchExecutor.dispatchFor, and collectActorWatch remain unchanged

Verification:
- focused disabled-seam verifier
- service registry verifier
- command authority verifier
- passive side-effect verifier
- enforcement dry-run verifier
- existing HS423 return-path verifier
- existing HS419 controlled runtime adapter fixture verifier
```

Do not include:

- runtime redirect
- scheduled redirect
- provider-capable mode
- operator DB mutation
- schema
- dispatcher/queue/lease
- UI
- source-term rename
- system/radius behavior

## 13. Verification / Source Evidence Commands Used

Commands used for this trace:

```txt
Get-Content AGENTS.md
Get-Content workspace\current.md | Select-Object -First 170
rg -n "Status:|Current executor|Active advisory request|Expected advisory artifact|Active Dev runway|HS421|HS422|HS423|Current focus|Resting State" workspace\current.md workspace\overview.md
Get-Content workspace\OverseerHS426-actor-watch-production-adjacent-adapter-insertion-trace-request.md
Get-Content workspace\OverseerHS425-actor-watch-runtime-replacement-decision-surface.md
Get-Content workspace\OverseerHS424-hs423-actor-watch-controlled-adapter-return-path-review.md
Get-Content workspace\DevHS423-actor-watch-controlled-adapter-return-path-proof.md
Get-Content src\main\discovery\actorWatchCompatibilitySummary.js
Get-Content src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js
Get-Content src\main\services\watchActorControlledRuntimeAdapterFixtureService.js
rg -n "actor_controlled_runtime_adapter|actor_controlled_adapter_return_path|actor_compatibility|actor_discovery_route|actor\.watch|EFFECTS|CONFIRMATION|COMMAND_ENFORCEMENT_COVERAGE|fixture_only|metadata-only|passive" src\main\services\serviceRegistry.js src\main\services\enforcementDryRunService.js scripts\verify-command-authority.js scripts\verify-service-registry.js scripts\verify-passive-side-effects.js scripts\verify-enforcement-dry-run.js package.json
Get-Content src\main\services\serviceRegistry.js | Select-Object -Skip 820 -First 60
Get-Content src\main\services\serviceRegistry.js | Select-Object -Skip 118 -First 115
Get-Content src\main\watchlist\watchExecutor.js | Select-Object -Skip 80 -First 60
Get-Content src\main\watchlist\watchExecutor.js | Select-Object -Skip 282 -First 25
Get-Content src\main\services\mutatingActionService.js | Select-Object -Skip 48 -First 17
rg -n "watch.actor_controlled_runtime_adapter_fixture.preview|watch.actor_compatibility_wrapper.preview|actor.watch|watch.executor.arm|watch.executor.tick|buildWatchActorControlledRuntimeAdapterFixturePreview|COMMAND_ENFORCEMENT_COVERAGE|fixture_only_non_production|renderer_allowed|SERVICE_COMMAND_NOT_RENDERER_ELIGIBLE" src\main\services\serviceRegistry.js src\main\services\enforcementDryRunService.js scripts\verify-command-authority.js scripts\verify-service-registry.js scripts\verify-passive-side-effects.js scripts\verify-watch-actor-controlled-adapter-return-path.js scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js
```

No live/provider/API calls were run. No source code, schema, production command behavior, Watch state, Discovery refs, Evidence/EVEidence, Hydration metadata, runtime enforcement, UI, source terms, protected-word JSON, or support artifacts were changed.
