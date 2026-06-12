# EngineeringTraceHS456 - collectActorWatch Remaining Caller / Retirement-Readiness

Status: advisory/source trace only  
Date: 2026-06-12  
Executor: Engineering / Source Trace  
Request: `workspace/OverseerHS456-collect-actor-watch-remaining-caller-retirement-readiness-trace-request.md`

## 1. Request Answered

HS456 asks whether `collectActorWatch(...)` is now only a legacy/compatibility surface after direct and scheduled actor Watch moved to the Discovery-owned direct body, or whether active callers still depend on it.

Answer: `collectActorWatch(...)` is no longer proven to be the active direct or scheduled actor Watch runtime path. Direct `actor.watch` now routes through `runActorWatchService(...) -> runActorWatchDirectBody(...)`, and scheduled actor Watch routes through `dispatchFor(actor) -> runScheduledActorWatch(...) -> runActorWatchDirectBody(...)`.

However, `collectActorWatch(...)` is not retirement-ready. It remains imported/called by active verification scripts and by the live actor Watch runner. Several proof/readout surfaces also still assert old runtime facts that are stale after HS440/HS446. Retirement today would break verifiers, live smoke paths, and some compatibility-readout expectations before Atlas has a clean replacement proof for those caller classes.

Recommendation: defer retirement. Open no runtime change from this trace. The safest next action is a focused cleanup/migration decision surface: first correct stale compatibility readouts/assertions, then replace active non-live verifier callers with the Discovery-owned body or the accepted actor Watch request/receipt projection, and treat the live actor runner as a separate replacement/parking decision.

## 2. Source Files Inspected

- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS456-collect-actor-watch-remaining-caller-retirement-readiness-trace-request.md`
- `workspace/OverseerHS453-hs452-actor-watch-discovery-handoff-contract-review.md`
- `workspace/DevHS452-actor-watch-discovery-handoff-contract-projection.md`
- `workspace/OverseerHS455-hs454-packet-shape-acceptance-review.md`
- `src/main/workers/actorWatchCollector.js`
- `src/main/discovery/actorWatchDirectBody.js`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js`
- `src/main/services/serviceRegistry.js`
- `scripts/live-actor-watch-runner.js`
- `scripts/live-actor-workflow-smoke.js`
- `scripts/verify-actor-watch-live.js`
- `scripts/verify-actor-resolution.js`
- `scripts/verify-actor-watch.js`
- `scripts/verify-actor-bulk-workflow.js`
- `scripts/verify-actor-report.js`
- `scripts/verify-controlled-workflow.js`
- `scripts/verify-corporation-observation-report.js`
- `scripts/verify-corporation-metadata-readiness.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-watch-actor-compatibility-wrapper-runtime-preview.js`
- `scripts/verify-watch-actor-*.js` through focused `rg`
- `scripts/verify-discovery-*.js` through focused `rg`
- `scripts/verify-group.js`
- `package.json`

## 3. Complete Caller / Import Map

### Current Runtime Actor Watch

| Surface | Current trace | Classification | Retirement impact |
| --- | --- | --- | --- |
| `src/main/services/mutatingActionService.js` | imports `runActorWatchDirectBody`; `runActorWatchService(...)` calls `runActorWatchDirectBody(input, { ...dependencies, db })` | active product runtime, replaced | does not require `collectActorWatch(...)` |
| `src/main/watchlist/watchExecutor.js` | imports `runActorWatchDirectBody`; `dispatchFor(actor)` returns `runner: runScheduledActorWatch`; `runScheduledActorWatch(...)` delegates to `runActorWatchDirectBody(...)` | active scheduled runtime, replaced | does not require `collectActorWatch(...)` |
| `src/main/workers/actorWatchCollector.js` | defines/exports `collectActorWatch(...)` | legacy worker body | deletion would break remaining scripts/verifiers |

### Direct Import / Call Sites

| File | Import/call | Classification | Notes |
| --- | --- | --- | --- |
| `scripts/live-actor-watch-runner.js` | imports and calls `collectActorWatch(...)` | active/parked live script; real blocker | Used for live actor Watch runner posture; replacement or explicit parking needed before retirement. |
| `scripts/verify-actor-watch.js` | imports and calls `collectActorWatch(...)` | active verifier; blocker | Exercises actor queue/ref/expansion behavior through the old collector. |
| `scripts/verify-actor-bulk-workflow.js` | imports and calls `collectActorWatch(...)` multiple times | active verifier; blocker | Seeds actor bulk/report workflows through old collector. |
| `scripts/verify-actor-report.js` | imports and calls `collectActorWatch(...)` | active verifier; blocker | Seeds actor report and cached report behavior. |
| `scripts/verify-controlled-workflow.js` | imports and calls `collectActorWatch(...)` | active verifier; blocker | Cross-workflow verifier still uses old actor collector. |
| `scripts/verify-corporation-observation-report.js` | imports and calls `collectActorWatch(...)` | active verifier; blocker | Uses actor collector to seed corporation observation/report data. |
| `scripts/verify-corporation-metadata-readiness.js` | imports and calls `collectActorWatch(...)` | active verifier; blocker | Uses actor collector to seed corporation metadata readiness. |

### Indirect Script Dependencies

| File | Dependency | Classification | Notes |
| --- | --- | --- | --- |
| `scripts/verify-actor-watch-live.js` | imports `runLiveActorWatch` from `scripts/live-actor-watch-runner.js` | active optional live verifier; blocker if live runner remains | Does not import collector directly, but breaks if live runner cannot import it. |
| `scripts/live-actor-workflow-smoke.js` | imports `runLiveActorWatch` from `scripts/live-actor-watch-runner.js` | active optional live smoke; blocker if live runner remains | Same indirect dependency. |
| `scripts/verify-actor-resolution.js` | imports `liveActorInput` from `scripts/live-actor-watch-runner.js` | indirect/stale coupling risk | Does not call the collector, but module import currently pulls in `actorWatchCollector.js`. |

### Verifier / Proof Assertions That Mention Availability Or Non-Invocation

| Surface | Classification | Notes |
| --- | --- | --- |
| `scripts/verify-watch-actor-direct-redirect.js` and related HS440/HS446 verifiers found by `rg` | active verifier/proof surfaces | These generally assert the new path does not import/call `collectActorWatch(...)` and that the collector remains available. They are not runtime callers, but deletion would require assertion updates. |
| `scripts/verify-watch-actor-production-like-fake-client-direct-proof.js` | active proof verifier | Exposes `legacy_collectActorWatch_still_available: true`; retirement needs verifier correction. |
| `scripts/verify-watch-actor-controlled-adapter-return-path.js` and controlled-adapter verifiers | fixture/proof verifiers | Assert non-import/non-invocation; not blockers to runtime replacement, but may block physical deletion until updated. |
| `scripts/verify-discovery-acquisition-to-evidence-handoff-fixture.js` | fixture verifier | Asserts `collect_actor_watch_invoked === false`; not a caller. |
| `scripts/verify-discovery-esi-expansion-intake-posture.js` | fixture verifier | Asserts `collect_actor_watch_invoked === false`; not a caller. |

### Service Commands / Readouts

| Service | Classification | Notes |
| --- | --- | --- |
| `watch.actor_compatibility_wrapper.preview` via `src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js` | stale readout / assurance blocker | Still says direct runtime is `runActorWatchService -> collectActorWatch` and scheduled runner is `collectActorWatch`. This is stale after HS440/HS446. It does not call the collector, but it exposes old runtime behavior as current. |
| `scripts/verify-service-registry.js` | active verifier with stale assertions | Still asserts `existing_runtime_preserved.runActorWatchService_still_calls === 'collectActorWatch'` and `scheduled_actor_watch_current_runner === 'collectActorWatch'`. |
| `scripts/verify-watch-actor-compatibility-wrapper-runtime-preview.js` | active/stale compatibility verifier | Still asserts scheduled actor Watch should use `collectActorWatch`. |
| `watch.actor_compatibility_wrapper_contract.preview` and adapter fixture preview | fixture/readout | Mention `collectActorWatch` as retire candidate or non-invoked old collector; mostly compatibility context, not runtime authority. |

## 4. Classification Summary

- Active product runtime callers: none found for direct/scheduled actor Watch.
- Active live/script callers: `scripts/live-actor-watch-runner.js` and its indirect live verifiers/smokes.
- Active non-live verifier callers: `verify-actor-watch`, `verify-actor-bulk`, `verify-actor-report`, `verify-controlled-workflow`, `verify-corporation-observation-report`, and `verify-corporation-metadata-readiness`.
- Fixture/proof references: many `watch.actor` proof services and verifiers assert non-invocation or availability; these are not runtime callers but may fail if the function/file disappears.
- Stale compatibility readouts: `watchActorCompatibilityWrapperRuntimePreviewService` and matching verifier assertions still describe pre-HS440/HS446 runtime facts.
- Historical workspace/docs references: not blockers by themselves.

## 5. Functionality Still Unique To `collectActorWatch(...)`

Most behavior is no longer conceptually unique, but some caller surfaces are still only wired to the old function:

- The live actor Watch runner path still starts from `collectActorWatch(...)`.
- Several regression verifiers still seed local DB state and reports through `collectActorWatch(...)`.
- `collectActorWatch(...)` accepts `dependencies.plannerOutput || planActorWatch(input)`, while `runActorWatchDirectBody(...)` currently plans internally. No active external caller using `plannerOutput` was found in the focused search, but this is a small testability seam to verify before removal.
- `collectActorWatch(...)` exports `discoverActorRefs` from the old worker module. Current Discovery code owns the real helper in `src/main/discovery/zkillCandidateAcquisition.js`; any import of the worker export should be treated as stale coupling.
- The old collector uses `buildEvidencePackageFromRefs(...)` from `esiBackedExpansionPackage`; the direct body uses `buildEvidencePackageFromRefsForDirectWatch(...)`. That is duplicate landing-package behavior and should not be ignored during retirement planning, even though direct actor Watch already works through the direct body.

## 6. Functionality Already Replaced

The Discovery-owned direct body already represents the major actor Watch behavior:

- actor scope planning through `planActorWatch(...)`
- fetch run creation/finalization
- pending candidate-ref recovery through `pendingDiscoveryRefs(...)` and `pendingActorDiscovery(...)`
- zKill candidate acquisition through `discoverActorRefs(...)`
- candidate ref upsert through `upsertDiscoveredKillmailRefs(...)`
- expansion candidate selection and cap/cache/failure classification
- selected-ref ESI-backed expansion
- Evidence/EVEidence package persistence through `persistEvidencePackage(...)`
- candidate status updates: selected, expanded, cached, failed
- data-quality warning insertion
- API count summarization
- 22-field compatibility summary via `buildActorWatchCompatibilitySummary(...)`

Direct service and scheduled executor now use this route. From a product runtime perspective, `collectActorWatch(...)` appears legacy for actor Watch, but surrounding scripts and stale proof surfaces prevent retirement.

## 7. Compatibility Summary Dependency Assessment

There are dependencies on the old 22-field summary shape, but they are not a reason to keep the mixed collector specifically. `runActorWatchDirectBody(...)` returns the same caller-facing compatibility summary through `buildActorWatchCompatibilitySummary(...)`.

Blocking risk is practical, not architectural:

- active verifiers import the old collector and inspect fields such as `collection_plan`, `expansion_queue`, `expansion_queue_summary`, warnings, and expansion counts
- compatibility preview services expose the old result shape as temporary/debug posture
- HS454 says `compatibility_summary` should remain temporary/debug, not future durable doctrine

Therefore the summary shape should be migrated as a compatibility return/proof surface, not treated as a reason for Watch or the old collector to own Discovery internals.

## 8. Capture-Rich Discovery Basis Versus Caller Projection

No remaining direct caller was found that requires Discovery itself to become sparse. The risk is the opposite: old compatibility/verifier surfaces expose internal collection details directly to callers.

Examples:

- `expansion_queue` and `expansion_queue_summary` expose selection/cache/failure posture.
- compatibility wrapper previews return represented/approximate/not-represented old result fields.
- active report verifiers use old collector output to seed later report/reportability checks.

This is acceptable as temporary debug/proof material, but not as a future Watch contract. The stable direction should remain:

- Discovery remains capture-rich internally.
- Watch receives a bounded actor-Watch-specific factual receipt projection, not Discovery-owned cadence advice.
- Manual/Live/Marked/Assessment callers can later receive their own projections without redefining Discovery.

## 9. Settled-Posture Reporting Assessment

The remaining callers do not appear to depend on live step-by-step streaming from Discovery. They call a function and receive a completed summary after the run has reached a settled posture.

The old collector summary does include internal step facts after completion, but that is not the same as requiring per-step caller reporting. This aligns with the HS456 reporting model if the replacement path returns only after the emitted work item is settled and includes bounded factual receipt posture such as:

- refs found or no refs
- capped
- cached
- failed retryable / failed terminal where distinguishable
- provider capacity deferred
- partial handled posture
- warnings and provider timing facts where relevant
- provider/route-safe timing facts such as `retry_after_until` or `next_provider_eligible_at`

Watch scheduling decisions should remain outside Discovery. Provider timing facts may cross the boundary; Watch cadence policy should not. Discovery can say that a provider route is not safely usable until a factual time; it should not decide the next Watch cadence, whether Watch should back off, whether the Watch run is scheduler-complete, or whether the Watch should remain armed. Watch interprets the receipt against Watch state, configured cadence, task status, and current time.

## 10. Retirement Blockers

`collectActorWatch(...)` should not be retired until these are resolved:

1. Active verifier imports/calls are migrated or explicitly retired.
2. `scripts/live-actor-watch-runner.js` is replaced, parked, or explicitly declared obsolete.
3. Indirect live runner consumers are updated so merely importing actor resolution does not require the old collector module.
4. Stale compatibility-wrapper runtime preview fields are corrected to post-HS440/HS446 reality.
5. Stale verifier assertions in `scripts/verify-service-registry.js` and `scripts/verify-watch-actor-compatibility-wrapper-runtime-preview.js` are corrected or retired.
6. Proof/verifier surfaces that assert `collectActorWatch(...)` remains available are updated if physical deletion is proposed.
7. The duplicated ESI expansion package behavior between old collector and direct body is reviewed before deletion so no failure/cap/cache behavior is accidentally lost.
8. System/radius Watch remains out of scope. No conclusion here authorizes changes to `collectSystemRadiusWatch(...)`.

## 11. Safe Next Action Recommendation

Recommended next action: defer collector retirement and route a small Overseer decision surface for cleanup/migration, not Dev retirement.

Best staged order:

1. Correct stale compatibility readouts and verifier assertions that still claim direct/scheduled actor Watch uses `collectActorWatch(...)`.
2. Migrate active non-live verifier callers from `collectActorWatch(...)` to the Discovery-owned direct body or to the accepted actor Watch request/receipt projection.
3. Decide separately whether `scripts/live-actor-watch-runner.js` is current, parked, or to be replaced by a live runner that enters through the current service/direct body path.
4. After those are complete, run a fresh retirement-readiness trace focused on actual imports, function availability assertions, and duplicate expansion-package behavior.

Smallest useful Dev packet, if Overseer opens one later: update stale compatibility runtime-preview readouts and corresponding assertions to reflect that direct and scheduled actor Watch now use `runActorWatchDirectBody(...)`, and ensure any caller projection language is factual receipt posture only. That packet should not retire the collector, change provider behavior, or give Discovery authority over Watch cadence/backoff/completion decisions.

## 12. Verification / Evidence Used

Commands/evidence used:

```txt
rg -n "collectActorWatch|actorWatchCollector|plannerOutput" .
rg -n "watchActorCompatibilityWrapper|compatibility_wrapper|actor_watch.*collectActorWatch|collect_actor_watch" src scripts package.json workspace/OverseerHS456-collect-actor-watch-remaining-caller-retirement-readiness-trace-request.md
Get-Content workspace/OverseerHS456-collect-actor-watch-remaining-caller-retirement-readiness-trace-request.md
Get-Content src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js
Get-Content src/main/services/mutatingActionService.js
Get-Content src/main/watchlist/watchExecutor.js
Get-Content src/main/discovery/actorWatchDirectBody.js
Get-Content src/main/workers/actorWatchCollector.js
Test-Path workspace/EngineeringTraceHS456-collect-actor-watch-remaining-caller-retirement-readiness.md
```

No live/API/provider calls were run. No schema, runtime, Watch, Discovery, Evidence/EVEidence, Hydration, Observation, Assessment, dispatcher, UI, source terms, or protected-word files were changed.

## 13. Parked Items

- Actual retirement of `collectActorWatch(...)`.
- Live actor Watch runner replacement.
- Migration of all old proof surfaces to a durable actor Watch receipt contract.
- Physical deletion of `src/main/workers/actorWatchCollector.js`.
- System/radius Watch collector replacement or retirement.
- Durable generic Discovery receipt/task schema.
- Dispatcher, queue, lease, runtime enforcement, UI, support artifacts, or provider behavior changes.
