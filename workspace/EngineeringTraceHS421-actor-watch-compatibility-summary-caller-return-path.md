# EngineeringTraceHS421 - Actor Watch Compatibility Summary / Caller Return Path

Status: advisory/source-trace complete  
Date: 2026-06-11  
Role: Engineering / source trace

## 1. Request Restatement

HS421 asks whether Atlas can move production actor Watch replacement toward the boundary-owned model while still returning the caller-facing `actor.watch` compatibility summary that current callers expect, without calling back into `collectActorWatch(...)` or reviving mixed Watch/Discovery/Evidence ownership.

This is a return-path and compatibility-shape trace only. It is not runtime redirect authorization.

## 2. Files Traced

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/OverseerHS421-actor-watch-compatibility-summary-caller-return-path-request.md`
- `workspace/OverseerHS420-hs419-actor-watch-controlled-runtime-adapter-fixture-review.md`
- `workspace/DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md`
- `src/main/services/mutatingActionService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`
- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js`
- `src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js`
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js`
- `src/main/services/watchActorCompatibilityWrapperContractService.js`
- `scripts/verify-watch-actor-controlled-runtime-adapter-fixture.js`
- `scripts/verify-watch-actor-discovery-route-body-fixture.js`
- `scripts/verify-watch-actor-compatibility-wrapper-runtime-preview.js`
- `scripts/verify-watch-actor-compatibility-wrapper-adapter-fixture.js`
- `scripts/verify-watch-actor-compatibility-wrapper-contract.js`
- `scripts/verify-watch-executor.js`

## 3. Current Production `actor.watch` Return Path

Current direct command path:

```txt
serviceRegistry COMMANDS["actor.watch"]
-> runActorWatchService(db, payload, context)
-> resolveActorInput(...)
-> normalizeActorWatchScope(...)
-> assertLiveAllowed("actor.watch", ...)
-> collectActorWatch(input, { ...dependencies, db })
-> returns summary object
```

Source basis:

- `src/main/services/serviceRegistry.js:211` registers `actor.watch` as evidence-creating and non-renderer.
- `src/main/services/serviceRegistry.js:217` routes `actor.watch` to `runActorWatchService(...)`.
- `src/main/services/mutatingActionService.js:52` defines `runActorWatchService(...)`.
- `src/main/services/mutatingActionService.js:61` returns `collectActorWatch(input, { ...dependencies, db })`.
- `src/main/workers/actorWatchCollector.js:15` defines `collectActorWatch(...)`.
- `src/main/workers/actorWatchCollector.js:106` builds the production summary object.
- `src/main/workers/actorWatchCollector.js:144` returns that summary.

Current scheduled actor Watch path:

```txt
WatchSessionExecutor.tick(...)
-> dispatchFor(watch)
-> { command: "actor.watch", payload, runner: collectActorWatch }
-> taskRunner.runDetachedTask(...)
-> dispatch.runner(...)
-> returns { status: "succeeded", data: { watch, collection: data } }
```

Source basis:

- `src/main/watchlist/watchExecutor.js:88` calls `dispatchFor(watch)`.
- `src/main/watchlist/watchExecutor.js:103` creates the detached Watch task.
- `src/main/watchlist/watchExecutor.js:115` records Watch success after the runner returns.
- `src/main/watchlist/watchExecutor.js:124` returns task data.
- `src/main/watchlist/watchExecutor.js:126` stores the collector result under `data.collection`.
- `src/main/watchlist/watchExecutor.js:286` defines `dispatchFor(...)`.
- `src/main/watchlist/watchExecutor.js:298` sets actor dispatch command to `actor.watch`.
- `src/main/watchlist/watchExecutor.js:300` sets actor dispatch runner to `collectActorWatch`.

## 4. Caller / Consumer Map

Direct service caller:

- Receives the raw summary returned by `collectActorWatch(...)`.
- The command is non-renderer, so this is currently a trusted/internal service surface rather than a renderer UI call.
- The return shape is therefore a compatibility contract for service callers, verifiers, task/debug readouts, and any future adapter that wants to replace the mixed collector without changing caller expectations.

Scheduled Watch executor:

- Does not inspect the summary fields for cadence success.
- It treats successful runner completion as success and records Watch run result separately.
- It preserves the summary as payload under `task.result.data.collection`.
- This means scheduler correctness is not tightly coupled to fields such as `zkill_refs_discovered` or `new_esi_expansions`, but operator/debug/task consumers may still observe them.

Verifier/debug consumers:

- `scripts/verify-watch-executor.js` asserts that actor Watch dispatch currently names `actor.watch` and uses the actor collector path.
- Support/debug task summaries appear generic; no reviewed source proved deep business dependence on individual actor summary fields outside compatibility/verifier surfaces.

Not proven from reviewed source:

- A renderer-visible product UI consuming production `actor.watch` summary directly.
- A product report path deriving Observation meaning from the actor Watch summary object itself.

## 5. Compatibility Summary Fields And Source Basis

The current production summary includes:

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

- Production summary construction: `src/main/workers/actorWatchCollector.js:106`.
- Production fetch-run finalization uses a smaller durable run summary: `src/main/workers/actorWatchCollector.js:134`.
- Production `collection_plan` construction: `src/main/workers/actorWatchCollector.js:155`.
- API count source is `api_request_logs`: `src/main/workers/actorWatchCollector.js:170`.

Fields that are product/runtime important enough to preserve in the first adapter return:

- `run_id`
- `actor`
- candidate counts: `zkill_refs_discovered`, `duplicate_refs_removed`, `malformed_refs_removed`, `unique_refs_after_dedupe`, `pending_refs_considered`
- local/cache and expansion counts: `already_cached_killmails`, `expansion_attempted`, `expansion_cap_skipped`, `new_esi_expansions`, `failed_expansions`
- writer outcomes: `persisted_killmails`, `activity_events_written`
- provider/accounting counts: `api_calls_zkill`, `api_calls_esi`
- `warnings`
- `collection_plan`
- `expansion_queue_summary`

Fields that should remain compatibility-only, not future ownership doctrine:

- `zkill_refs_discovered`
- `zkill_discovery_skipped`
- `expansion_queue`
- `collection_plan`
- `expansion_queue_summary`
- any use of `collection` as the name for boundary-owned Discovery movement

These fields can remain as caller-facing compatibility output while the internal model uses Watch intent, Discovery candidate-lead acquisition, Discovery ESI-backed killmail/detail expansion, and Evidence/EVEidence writer landing.

## 6. Fields Already Proven By Fixture / Advisory Chain

HS383 / HS395 prove the read-only compatibility shape can be composed without invoking the collector:

- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js:188` builds an adapter result.
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js:280` maps old result fields.
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js:282` lists fields represented by the adapter fixture.
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js:298` lists approximate fields.
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js:303` lists fields not represented yet.
- `src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js:40` marks legacy mixed collector language as compatibility-only.
- `scripts/verify-watch-actor-compatibility-wrapper-runtime-preview.js:140` through `:144` assert existing runtime remains `runActorWatchService -> collectActorWatch` and scheduled actor Watch remains `collectActorWatch`.

HS415 proves route-body composition without durable writes:

- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js:57` builds the compatibility result.
- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js:175` exposes `old_caller_facing_compatibility_result`.
- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js:178` marks old fields compatibility-only.
- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js:256` defines the compatibility result field set.
- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js:333` discloses zeroed fields where writer/API logging was not invoked.
- `scripts/verify-watch-actor-discovery-route-body-fixture.js:155` verifies the expected compatibility field presence.

HS419 proves the mutation-capable pieces that HS383/HS415 parked:

- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js:106` declares real repository methods proven.
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js:210` calls `persistEvidencePackage(...)` in disposable DBs.
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js:350` builds a compatibility summary matching the production field shape.
- `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js:11` adds caller/operator DB non-mutation proof.
- `scripts/verify-watch-actor-controlled-runtime-adapter-fixture.js:53` through `:56` assert no production runtime changes and no collector invocation.
- `scripts/verify-watch-actor-controlled-runtime-adapter-fixture.js:69` includes `persistEvidencePackage` in the proven repository methods.
- `scripts/verify-watch-actor-controlled-runtime-adapter-fixture.js:138` through `:140` assert compatibility summary presence and zero real API call counts in fixture mode.
- `scripts/verify-watch-actor-controlled-runtime-adapter-fixture.js:157` through `:168` sample the main compatibility summary fields.

Accepted HS420 result confirms HS419 did not change production `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, or `collectActorWatch(...)`.

## 7. Missing Proof Or Missing Source Clarity

The boundary-owned route can produce the required caller-facing shape without importing or invoking `collectActorWatch(...)`; this is proven in fixture form by HS415 and HS419.

Still missing before controlled production-adjacent replacement:

1. A single source-owned compatibility-summary builder.
   - Today the production collector and HS419 fixture each build a similar summary object separately.
   - This is acceptable for proof, but risky for runtime replacement because future fields could drift.

2. A verifier that compares the production summary field set to the boundary-owned adapter summary field set.
   - Existing verifiers check many fields, but a direct field-set parity assertion against `collectActorWatch`'s summary contract is not yet isolated as the return-path seam.

3. A caller-return-path proof at both direct and scheduled wrappers.
   - Direct path should prove the future adapter returns the summary as the top-level result where `actor.watch` currently does.
   - Scheduled path should prove the runner result still lands under `task.result.data.collection` or an explicitly accepted compatibility key.

4. Real provider/API count behavior is not proven outside fixtures.
   - HS419 correctly reports zero real provider calls because fake clients avoid `api_request_logs`.
   - A live-capable future adapter must revalidate how provider counts are sourced before claiming production parity.

5. Warning text parity is only partially proven.
   - HS383 already marked warnings approximate.
   - HS419 proves warnings can be recorded in disposable DBs, but exact old text equivalence should be treated as semantic equivalence unless Overseer requires byte-for-byte parity.

Not proven from reviewed source:

- That any external/UI caller requires byte-for-byte ordering of fields.
- That `expansion_queue` should remain long-term product output rather than temporary compatibility/debug material.

## 8. Boundary Risks And Terminology Risks

Boundary risks:

- Returning `expansion_queue` can make Discovery candidate-ref working memory look like a product contract. Keep it compatibility/debug-only.
- Returning `zkill_refs_discovered` can preserve zKill-specific language at the outer caller boundary. This is acceptable as compatibility, but should not become the internal Discovery receipt vocabulary.
- Returning `new_esi_expansions` and `persisted_killmails` in the same summary can blur Discovery ESI-backed expansion with Evidence/EVEidence writer landing unless labels remain count-only and source-backed.
- Scheduled Watch currently treats runner success as Watch success. A future Discovery receipt model should not let Watch inspect Discovery memory directly to decide cadence.
- `collection` in `task.result.data.collection` is old mixed-path wording. It is harmless as a temporary wrapper field, but risky as long-term doctrine.

Terminology posture:

- `actor.watch`: acceptable existing command / temporary compatibility surface.
- `collectActorWatch`: old mixed-boundary implementation name; do not adopt as future doctrine.
- `collection`, `collection_plan`, `actor_collection`: old/mixed compatibility language; safe only as caller compatibility or diagnostic output.
- `Discovery`, `Evidence/EVEidence`, `Hydration`, `Observation`, `Assessment`: preserve current Atlas boundaries exactly.

No required return-path behavior forces boundary blur if the adapter treats the old summary as a compatibility projection over boundary-owned facts.

## 9. Recommendation

Recommendation: ready for a narrow controlled runtime adapter runway, with constraints.

The source supports the conclusion that Atlas can return the current caller-facing actor Watch summary shape through the boundary-owned route without calling or importing `collectActorWatch(...)`.

This does not mean Atlas is ready for default `actor.watch` redirect, scheduled Watch redirect, live provider movement, or collector retirement. It means the next Dev packet can safely target the return-path seam if it stays narrow and proves compatibility explicitly.

Do not choose "needs another proof first" as a blocker if the next packet itself is the narrow no-provider return-path proof. Do choose "needs source cleanup first" if Overseer wants the compatibility-summary builder extracted before any adapter command shape is introduced.

## 10. Smallest Safe Next Packet

Smallest safe next packet:

```txt
Create a no-provider actor Watch controlled adapter return-path proof that:
1. extracts or centralizes the compatibility summary builder used by the boundary-owned adapter path,
2. proves the adapter summary has the same required top-level fields as current production `collectActorWatch(...)`,
3. proves direct caller return shape is the summary object,
4. proves scheduled-style wrapping would preserve the result under `data.collection` without calling `WatchSessionExecutor.tick(...)`,
5. imports/calls no `collectActorWatch(...)`,
6. uses injected fake clients or disposable fixture data only,
7. writes no operator DB rows,
8. performs no live zKill/ESI calls,
9. changes no production `actor.watch`, `runActorWatchService(...)`, or `watchExecutor.dispatchFor(...)`.
```

Suggested acceptance criteria:

- Production `actor.watch` remains unchanged.
- `collectActorWatch(...)` remains uninvoked and unimported by the new adapter path.
- Field-set parity is asserted for the compatibility summary.
- Boundary-owned internal facts remain Watch / Discovery zKill / Discovery ESI-backed expansion / Evidence writer separated.
- The old terms `collection`, `collection_plan`, and `expansion_queue` are marked compatibility-only.
- System/radius Watch remains untouched.

## 11. Parked

Remain parked:

- default production `actor.watch` redirect
- scheduled Watch redirect
- `runActorWatchService(...)` replacement
- `watchExecutor.dispatchFor(...)` replacement
- `collectActorWatch(...)` retirement
- live zKill calls
- live ESI-backed killmail/detail expansion
- operator corpus Discovery ref writes from a new path
- operator Evidence/EVEidence writes from a new path
- Watch cadence mutation from Discovery receipt
- durable Discovery task/packet schema
- dispatcher / queue / lease work
- runtime enforcement / command blocking
- UI work
- source-term rename or protected-word JSON update

## 12. Verification / Source Evidence Commands Used

Commands used for source trace:

```txt
Get-Content workspace\OverseerHS421-actor-watch-compatibility-summary-caller-return-path-request.md
rg -n "HS421|HS420|HS419|actor Watch|compatibility summary|caller return|Active" workspace\current.md workspace\overview.md
Get-ChildItem -Name workspace | Select-String "HS41|HS42|actor-watch|compatibility|runtime-adapter"
Get-Content workspace\OverseerHS420-hs419-actor-watch-controlled-runtime-adapter-fixture-review.md
Get-Content workspace\DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md
Get-Content src\main\workers\actorWatchCollector.js
Get-Content src\main\services\mutatingActionService.js
Get-Content src\main\watchlist\watchExecutor.js
Get-Content src\main\services\serviceRegistry.js
Get-Content src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js
Get-Content src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js
Get-Content src\main\services\watchActorControlledRuntimeAdapterFixtureService.js
Get-Content src\main\services\watchActorCompatibilityWrapperRuntimePreviewService.js
Get-Content src\main\services\watchActorCompatibilityWrapperAdapterFixtureService.js
Get-Content src\main\services\watchActorCompatibilityWrapperContractService.js
Get-Content scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js
Get-Content scripts\verify-watch-actor-discovery-route-body-fixture.js
Get-Content scripts\verify-watch-actor-compatibility-wrapper-runtime-preview.js
Get-Content scripts\verify-watch-actor-compatibility-wrapper-adapter-fixture.js
Get-Content scripts\verify-watch-actor-compatibility-wrapper-contract.js
Get-Content scripts\verify-watch-executor.js
rg -n "async function collectActorWatch|const summary = \{|return summary|finalizeFetchRun|function buildActorCollectionPlanSummary|function apiCountsForRun" src\main\workers\actorWatchCollector.js
rg -n "async function runActorWatchService|return collectActorWatch|actor\.watch|handler: \(\{ db, payload" src\main\services\mutatingActionService.js src\main\services\serviceRegistry.js
rg -n "dispatchFor\(|command: 'actor.watch'|runner: collectActorWatch|data: \{|collection: data|recordWatchRunResult|TaskRunner|runDetachedTask" src\main\watchlist\watchExecutor.js scripts\verify-watch-executor.js
rg -n "function buildCompatibilitySummary|compatibility_summary|repository_methods_proven|persistEvidencePackage|fake_zkill_client_invocations|operator_corpus_non_mutation_proof|collect_actor_watch_invoked|runActorWatchService_changed|watchExecutor_dispatchFor_changed" src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js src\main\services\watchActorControlledRuntimeAdapterFixtureService.js scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js
rg -n "buildCompatibilityResult|old_caller_facing_compatibility_result|oldResultCompatibilityMap|represented_as_zero|verifyCompatibilityShape|compatibility_only|not_claimed" src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js scripts\verify-watch-actor-discovery-route-body-fixture.js
rg -n "buildAdapterResult|oldResultCompatibilityMap|not_represented_yet|represented_by_adapter_fixture|represented_only_approximately|legacy_term_posture|existing_runtime_preserved|verifyCompatibilityShape|verifyAdapterShape|verifyContractShape" src\main\services\watchActorCompatibilityWrapperAdapterFixtureService.js src\main\services\watchActorCompatibilityWrapperRuntimePreviewService.js src\main\services\watchActorCompatibilityWrapperContractService.js scripts\verify-watch-actor-compatibility-wrapper-runtime-preview.js scripts\verify-watch-actor-compatibility-wrapper-adapter-fixture.js scripts\verify-watch-actor-compatibility-wrapper-contract.js
Get-Content AGENTS.md
Get-Content workspace\critical\README.md
Get-Content workspace\critical\critical-terms.md
Get-Content workspace\current.md | Select-Object -First 130
Get-Content workspace\overview.md | Select-Object -First 310
```

No provider/live/API calls were run. No source code, schema, production command behavior, Watch state, Discovery refs, Evidence/EVEidence, Hydration metadata, runtime enforcement, UI, protected terms, or support artifacts were changed.
