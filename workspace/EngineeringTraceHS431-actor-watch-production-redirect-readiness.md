# EngineeringTraceHS431 - Actor Watch Production Redirect Readiness

Status: advisory/source-trace only  
Date: 2026-06-11  
Role: Engineering / source trace  

## 1. Request Restatement

HS431 asks whether Atlas is structurally ready to redirect production `actor.watch` after the accepted disabled adapter seam, or whether another proof is needed first.

The review separates direct operator `actor.watch` from scheduled actor Watch runtime, because the source shows they enter different code paths today.

Conclusion: **production redirect is not ready yet**. Atlas should open a **production-like fake-client redirect proof first**, not a direct production redirect runway.

## 2. Files Traced

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS431-actor-watch-production-redirect-readiness-trace-request.md`
- `workspace/OverseerHS430-actor-watch-disabled-seam-next-decision-surface.md`
- `workspace/OverseerHS429-hs428-actor-watch-controlled-adapter-disabled-seam-review.md`
- `workspace/DevHS428-actor-watch-controlled-adapter-disabled-seam.md`
- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/services/watchActorControlledAdapterDisabledService.js`
- `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `src/main/discovery/actorWatchCompatibilitySummary.js`
- `src/main/db/evidenceRepository.js`
- `src/main/discovery/expansionQueueSelection.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-actor-controlled-adapter-disabled-seam.js`

## 3. Direct `actor.watch` Redirect Change Map

Direct `actor.watch` currently enters through service registry and `runActorWatchService(...)`.

Source trace:

- `src/main/services/serviceRegistry.js:212` registers `actor.watch`.
- `src/main/services/serviceRegistry.js:218` routes to `runActorWatchService(db, payload, context)`.
- `src/main/services/mutatingActionService.js:5` imports `collectActorWatch`.
- `src/main/services/mutatingActionService.js:52` defines `runActorWatchService(...)`.
- `src/main/services/mutatingActionService.js:60` performs `assertLiveAllowed('actor.watch', input, dependencies)`.
- `src/main/services/mutatingActionService.js:61` calls `collectActorWatch(input, { ...dependencies, db })`.

A direct redirect would therefore touch `src/main/services/mutatingActionService.js` at minimum. The safer shape is to preserve the existing direct command envelope:

- keep service registry command identity and authority stable
- keep actor input resolution and scope normalization stable
- keep `assertLiveAllowed('actor.watch', ...)` in the same command path
- replace the final call to `collectActorWatch(...)` with a production-capable, boundary-owned actor Watch route body

Changing the service registry handler directly would be riskier because it could bypass current normalization and live-gate behavior unless duplicated carefully.

## 4. Scheduled Watch Redirect Change Map

Scheduled actor Watch does not currently use the service registry handler as its execution body. It dispatches directly from Watch runtime to the collector.

Source trace:

- `src/main/watchlist/watchExecutor.js:3` imports `collectActorWatch`.
- `src/main/watchlist/watchExecutor.js:88` obtains `dispatch = dispatchFor(watch)`.
- `src/main/watchlist/watchExecutor.js:286` defines `dispatchFor(watch)`.
- `src/main/watchlist/watchExecutor.js:298` sets actor dispatch command to `actor.watch`.
- `src/main/watchlist/watchExecutor.js:300` sets actor dispatch runner to `collectActorWatch`.

A scheduled redirect would touch `src/main/watchlist/watchExecutor.js`, specifically the actor arm of `dispatchFor(watch)` and the collector import.

It may also affect tests/verifiers that assume scheduled actor Watch still invokes the old mixed collector.

## 5. Separation Analysis: Direct vs Scheduled

Direct `actor.watch` redirect can technically happen without scheduled Watch redirect because the direct path and scheduled path are separate:

- direct path: `serviceRegistry -> runActorWatchService -> collectActorWatch`
- scheduled path: `WatchSessionExecutor.tick -> dispatchFor(watch) -> collectActorWatch`

Scheduled actor Watch can remain parked while direct `actor.watch` is redirected, but only as an explicit transitional state. In that state:

- direct operator actor Watch would use the new boundary-owned body
- scheduled actor Watch would still use the legacy mixed collector
- `collectActorWatch(...)` would remain imported and available for scheduled legacy path

That split is acceptable only if Overseer accepts temporary behavior divergence and verification proves the direct path no longer calls `collectActorWatch(...)` while scheduled actor Watch still does.

## 6. Provider / Client Injection Readiness

The disabled seam does not prove production provider/client construction.

HS428 proves a disabled command can sit near service surfaces without provider calls or operator writes:

- `src/main/services/watchActorControlledAdapterDisabledService.js:22` marks `fixture_only: true`.
- `src/main/services/watchActorControlledAdapterDisabledService.js:27` reports `provider_calls: 0`.
- `src/main/services/watchActorControlledAdapterDisabledService.js:29` reports `operator_corpus_mutated: false`.
- `src/main/services/watchActorControlledAdapterDisabledService.js:34` and `:35` report no `collectActorWatch` import/invocation.

That is useful, but production redirect would need a real provider/client boundary:

- injected fake clients for proof
- production zKill and ESI clients only after explicit live authorization
- no renderer-supplied provider clients
- signal/timeout/db/run logging behavior equivalent to today
- preservation of provider API logging expectations

Current source does not prove that the boundary-owned route body can replace the old collector while using the caller/operator DB and production-like injected clients.

## 7. Operator DB Mutation And Write-Boundary Readiness

Production redirect would cross a larger boundary than HS428 proved.

The old collector currently performs durable write choreography:

- `src/main/workers/actorWatchCollector.js:50` upserts discovered candidate refs.
- `src/main/workers/actorWatchCollector.js:60` marks selected refs.
- `src/main/workers/actorWatchCollector.js:78` marks failed refs.
- `src/main/workers/actorWatchCollector.js:80` persists the Evidence package.
- `src/main/workers/actorWatchCollector.js:81` marks expanded refs.
- `src/main/workers/actorWatchCollector.js:85` marks cached refs.
- `src/main/workers/actorWatchCollector.js:134` finalizes successful fetch runs.
- `src/main/workers/actorWatchCollector.js:147` finalizes failed fetch runs.
- `src/main/workers/actorWatchCollector.js:173` reads API request log counts.

Repository write surfaces include:

- `src/main/db/evidenceRepository.js:33` inserts `fetch_runs`.
- `src/main/db/evidenceRepository.js:104` inserts `data_quality_warnings`.
- `src/main/db/evidenceRepository.js:109` inserts `api_request_logs`.
- `src/main/db/evidenceRepository.js:116` inserts `discovered_killmail_refs`.
- `src/main/db/evidenceRepository.js:200` persists Evidence package data.
- `src/main/db/evidenceRepository.js:418` upserts discovered killmail refs.
- `src/main/db/evidenceRepository.js:462`, `:484`, `:506`, and `:530` mutate candidate-ref status.

The disabled seam intentionally proves operator non-mutation, so it cannot prove production-like mutation parity. Before redirect, Atlas needs a proof that the new route can write the same classes of rows under fake clients, with the same boundary meanings:

- candidate refs remain possible leads / Discovery memory
- ESI-expanded killmail data becomes Evidence/EVEidence only at writer landing
- Hydration is not invoked
- Observation is not treated as writer landing

## 8. Compatibility Summary And Caller Shape

Caller-shape parity is the strongest part of the current proof stack.

`actorWatchCompatibilitySummary` defines the caller-facing summary shape, and HS428 projects it through a disabled seam:

- `src/main/discovery/actorWatchCompatibilitySummary.js:26` builds the compatibility summary.
- `src/main/services/watchActorControlledAdapterDisabledService.js:37` returns a direct compatibility summary.
- `src/main/services/watchActorControlledAdapterDisabledService.js:38` includes a direct summary proof.
- `src/main/services/watchActorControlledAdapterDisabledService.js:40` carries field parity.

The future redirect must preserve the old caller-facing fields semantically, not just by name. Required stable areas include:

- actor and scope identity
- fetch run identity/status posture
- candidate refs discovered/upserted
- selected/expanded/cached/failed counts
- Evidence/EVEidence landing counts
- warnings/errors
- API request count basis
- cap posture
- dry-run/live posture

The compatibility summary must remain a compatibility surface, not future Discovery receipt doctrine.

## 9. Command Authority / External I/O / Storage Gate Posture

Production `actor.watch` must keep its current command posture after redirect.

Source trace:

- `src/main/services/serviceRegistry.js:212` registers production `actor.watch`.
- `scripts/verify-watch-actor-controlled-adapter-disabled-seam.js:15` asserts production `actor.watch` remains `evidence-creating`.
- `scripts/verify-watch-actor-controlled-adapter-disabled-seam.js:16` asserts it retains `external-live-api`.
- `scripts/verify-watch-actor-controlled-adapter-disabled-seam.js:17` asserts it retains `evidence-creation`.
- `src/main/services/enforcementDryRunService.js:13` covers `actor.watch` as provider-required scheduled/direct Watch collection with provider and storage gates.
- `src/main/services/enforcementDryRunService.js:103` separately classifies the disabled seam as fixture-only non-production.

Redirect must not downgrade production `actor.watch` into a metadata/readout/fixture posture. It must remain:

- non-renderer
- confirmation-gated
- External I/O aware
- provider-gated
- storage/write-gated
- Evidence/EVEidence-creating when live-authorized
- covered by enforcement dry-run posture

The disabled preview command must remain separate and proof-only.

## 10. Verification Required For A Future Redirect Packet

A future redirect packet would need verification that proves direct redirect without widening boundaries.

Minimum verification evidence:

- `node --check` for touched JavaScript files.
- Existing disabled seam verifier still passes.
- Actor compatibility return-path verifier still passes.
- Controlled runtime adapter fixture verifier still passes.
- Service registry and command authority verifiers still pass.
- Passive side-effect and enforcement dry-run verifiers still pass.
- Direct `actor.watch` no longer imports or invokes `collectActorWatch(...)` after the redirect packet.
- Scheduled actor Watch still imports/uses `collectActorWatch(...)` if scheduled redirect is parked.
- No provider/live/API calls occur in fake-client proof.
- No Hydration writes occur.
- No renderer/UI path is introduced.
- No system/radius Watch behavior changes.
- No schema, dispatcher, queue, lease, runtime enforcement, or cadence mutation changes.

The next proof should also compare old mixed collector behavior and new route behavior against the same fake inputs where practical.

## 11. Risks And Stop Conditions

Stop conditions before any production redirect:

- Redirect would use `watch.actor_controlled_adapter_disabled.preview` or fixture preview output as production authority.
- Redirect bypasses `runActorWatchService(...)` normalization or `assertLiveAllowed(...)`.
- Redirect changes command authority, confirmation posture, effects, or enforcement classification.
- Redirect touches scheduled Watch unintentionally.
- Redirect invokes live zKill or ESI before explicit authorization.
- Redirect writes operator DB rows without a prior production-like fake-client proof.
- Redirect blurs candidate refs with Evidence/EVEidence.
- Redirect treats ESI-backed expansion as Hydration.
- Redirect treats compatibility summary as future Discovery receipt doctrine.
- Redirect drops fetch-run finalization, warning insertion, API request logging, candidate status mutation, cache/idempotency behavior, or Evidence writer behavior.
- Redirect retires or removes `collectActorWatch(...)` before scheduled legacy use is addressed.

Remaining risks even after a fake-client proof:

- API request logging may differ if fake clients do not exercise the same `HttpClient` logging path.
- Failure semantics need explicit parity for retryable provider failures vs terminal writer/payload failures.
- Direct/scheduled divergence can become technical debt if not tracked as temporary.

## 12. Recommendation

Classification: **needs production-like fake-client redirect proof first**.

Atlas is not ready for a direct production `actor.watch` redirect runway yet.

The model is coherent, and HS428 is valuable, but HS428 proves a disabled non-production seam. It does not prove the route can replace `collectActorWatch(...)` for production-like operator DB mutation, provider/client injection, fetch-run lifecycle, candidate status mutation, Evidence/EVEidence landing, warning handling, or API log posture.

HS431 does not indicate a need for a broad stack review before the next move. The next seam can stay narrow if it is framed as proof, not redirect.

## 13. Smallest Safe Next Packet

Recommended next packet: **production-like fake-client direct redirect proof**.

Shape:

- no production `actor.watch` redirect
- no scheduled Watch redirect
- no `watchExecutor.dispatchFor(...)` change
- no `collectActorWatch(...)` retirement
- no live providers
- no operator corpus writes
- use a disposable or explicitly fixture-owned DB
- use injected fake zKill and ESI clients
- exercise a function shaped like the future direct `runActorWatchService(...)` replacement body
- preserve current actor input resolution / normalization / live gate expectations in the proof surface
- prove the route writes production-like rows to the fixture DB
- prove caller compatibility summary field parity
- prove no Hydration, Observation, UI, schema, dispatcher, queue, lease, or runtime enforcement changes

Acceptance criteria for that packet:

- new boundary-owned body does not import or call `collectActorWatch(...)`
- fake-client route produces candidate refs, selected refs, expanded/cached/failed status mutations, fetch-run finalization, Evidence/EVEidence writer landing, warning posture, and API count posture where applicable
- old mixed collector behavior is preserved semantically for the proven cases
- production `actor.watch` registry metadata remains unchanged
- scheduled actor Watch remains explicitly parked on the legacy collector

After that proof is accepted, Overseer can decide whether a direct `actor.watch` redirect runway is appropriate or whether one more failure-path proof is needed.

## 14. Parked Items

- default production `actor.watch` redirect
- scheduled actor Watch redirect
- `watchExecutor.dispatchFor(...)` replacement
- `WatchSessionExecutor.tick(...)` changes
- `TaskRunner` changes
- `collectActorWatch(...)` retirement
- live zKill or ESI movement through the new path
- operator Discovery ref writes through the new path
- operator Evidence/EVEidence writes through the new path
- Hydration writes
- Observation/report behavior
- system/radius Watch replacement
- schema changes
- durable Discovery task/packet persistence
- dispatcher / queue / lease behavior
- runtime enforcement activation
- renderer UI
- source-term rename or protected-word updates

