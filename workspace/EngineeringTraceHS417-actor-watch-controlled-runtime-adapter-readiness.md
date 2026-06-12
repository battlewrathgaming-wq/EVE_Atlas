# EngineeringTraceHS417 - Actor Watch Controlled Runtime Adapter Readiness

Status: advisory/source trace only  
Role: Engineering / Source Trace  
Date: 2026-06-08

## 1. Executive Recommendation

Atlas is not ready for default `actor.watch` redirect, scheduled Watch redirect, or `collectActorWatch(...)` retirement.

Atlas is ready for a narrower Dev seam: a controlled no-provider actor Watch runtime-adapter fixture/proof that uses the Discovery-owned route-body shape with injected fake provider clients and a disposable fixture DB to prove the mutation choreography currently owned by `collectActorWatch(...)`.

Why this is the right next seam:

- HS415 proved the Discovery-owned actor route body can compose helper surfaces without invoking `collectActorWatch(...)`.
- HS415 did not prove real repository write sequencing, `fetch_runs`, API-log summaries, candidate-ref status mutation, Evidence/EVEidence writer landing, warning persistence, or failure finalization.
- Those missing behaviors are exactly the behaviors a runtime adapter must preserve before it can replace the old mixed collector.

Recommended posture:

```txt
Next safe seam: no-provider controlled runtime-adapter fixture using disposable DB writes.
Not next: production actor.watch redirect.
Not next: scheduled Watch redirect.
Not next: live zKill/ESI provider movement.
Not next: collector retirement.
```

## 2. Current Actor Watch Runtime Path Summary

Direct command path today:

```txt
serviceRegistry['actor.watch']
-> runActorWatchService(db, payload, context)
-> resolveActorInput(...)
-> normalizeActorWatchScope(...)
-> assertLiveAllowed('actor.watch', ...)
-> collectActorWatch(input, { ...dependencies, db })
```

Scheduled Watch path today:

```txt
WatchSessionExecutor.tick(...)
-> dispatchFor(actor watch)
-> { command: 'actor.watch', runner: collectActorWatch }
-> actionGate('actor.watch', payload)
-> taskRunner.runDetachedTask(...)
-> collectActorWatch(...)
-> recordWatchRunResult(...)
```

`collectActorWatch(...)` currently owns the live-capable end-to-end behavior:

- creates `EvidenceRepository`
- plans actor scope via `planActorWatch(...)`
- creates and finalizes `fetch_runs`
- constructs `HttpClient`, `ZKillDiscoveryClient`, and `EsiClient`
- drains pending Discovery refs before fresh zKill acquisition
- calls zKill when no pending refs exist
- writes candidate refs with `upsertDiscoveredKillmailRefs(...)`
- selects refs and marks selected
- calls Discovery-owned ESI-backed package helper
- maps ESI expansion failures back onto candidates
- marks failed, expanded, and cached refs
- lands Evidence/EVEidence through `persistEvidencePackage(...)`
- inserts collection warnings
- reads `api_request_logs` counts
- returns the old caller-facing summary shape
- finalizes failed runs on error

Source:

- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/db/evidenceRepository.js`

## 3. Current HS415 Discovery Route-Body Path Summary

HS415 added:

- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js`
- `src/main/services/watchActorDiscoveryRouteBodyFixtureService.js`
- command `watch.actor_discovery_route_body_fixture.preview`

Current HS415 path:

```txt
watch.actor_discovery_route_body_fixture.preview
-> buildWatchActorDiscoveryRouteBodyFixturePreview(...)
-> buildActorWatchDiscoveryRouteBodyFixture(...)
-> planActorWatch(...)
-> pendingActorDiscovery(...) or discoverActorRefs(...)
-> selectExpansionCandidates(...)
-> buildEvidencePackageFromRefs(...)
-> markFailedExpansionCandidates(...)
-> summarizeExpansionQueue(...)
-> old caller-facing compatibility result
```

Important HS415 limits:

- uses fake fixture zKill/ESI clients
- uses a fake repository surface with `hasKillmail(...)` only
- does not call provider clients
- does not write `discovered_killmail_refs`
- does not call `persistEvidencePackage(...)`
- does not write `fetch_runs`
- does not write `api_request_logs`
- does not insert warnings
- does not mutate Watch cadence/run rows
- does not invoke or import `collectActorWatch(...)`

Source:

- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js`
- `src/main/services/watchActorDiscoveryRouteBodyFixtureService.js`
- `scripts/verify-watch-actor-discovery-route-body-fixture.js`

## 4. Behavior Parity Matrix

| Old mixed collector behavior | HS415 / fixture representation | Missing before runtime adapter |
| --- | --- | --- |
| Actor input resolution before execution | Not owned by HS415; `runActorWatchService(...)` still resolves actor input before old collector | Adapter needs a clear boundary: consume normalized actor scope or include resolver path without changing `runActorWatchService(...)` |
| Actor planning / caps / lookback | Represented through `planActorWatch(...)`; HS416 notes planner ownership may need later cleanup | Acceptable for next proof; planner ownership can remain parked |
| Live gate / action gate | Not represented by HS415; old command still gates in `runActorWatchService(...)` and scheduled executor | Controlled adapter proof should not bypass existing gate if wired later; next proof can stay explicit fixture-only |
| `fetch_runs` create/finalize | Not represented; HS415 reports `fetch_run_writes: 0` | Must be proven with disposable DB before runtime replacement |
| Pending Discovery ref drain | Represented with injected `pendingRefs` and `pendingActorDiscovery(...)` | Needs proof against real repository `pendingDiscoveryRefs(...)` in disposable DB |
| Fresh zKill acquisition | Represented with fake client through `discoverActorRefs(...)` | No live provider movement yet; fake client proof is enough for no-provider adapter |
| Candidate-ref write | Not performed; HS415 reports `discovered_killmail_refs_written: 0` | Must be proven in disposable DB with `upsertDiscoveredKillmailRefs(...)` |
| Local cache skip | Represented with fake repository `hasKillmail(...)` | Needs proof against real `EvidenceRepository.hasKillmail(...)` |
| Selection / cap / malformed / duplicate posture | Represented through Discovery helper surfaces | Strong enough for next seam |
| Selected-ref status mutation | Represented only as `would_mark_*` posture | Must be proven with real selected/expanded/cached/failed repository methods in disposable DB |
| ESI-backed selected-ref expansion | Represented with fake ESI client through `buildEvidencePackageFromRefs(...)` | Enough for no-provider adapter; not enough for live provider readiness |
| Provider capacity/retry/terminal failure posture | Represented by fixture ESI failures | Needs repository status/finalization proof, not live provider proof |
| Evidence/EVEidence writer landing | Represented as package-ready boundary; writer not invoked | Must be proven through `persistEvidencePackage(...)` in disposable DB before runtime replacement |
| API request logs and provider call counts | HS415 reports real API calls/logs as zero; fake invocation counters are separate | For no-provider adapter, expected real counts are zero; later live path must prove log counts from `HttpClient` |
| Collection warnings | Compatibility warnings are returned but not persisted | Must be proven with `insertWarning(...)` or deliberately excluded from next controlled proof |
| Old caller-facing result shape | Represented by HS415 compatibility result | Strong enough for next seam, but fields remain compatibility-only |
| Error finalization | Not meaningfully proven; HS415 catches fixture expansion failures inside package helper but does not finalize failed runs | Must be proven in disposable DB before runtime replacement |
| Scheduled Watch success/failure | Not represented; scheduled path remains old collector | Keep parked; do not include in next seam |

## 5. Write / Provider / Cadence Boundary Risk Analysis

Write risk:

- The next unsafe jump would be calling the HS415 route body from production `actor.watch`; it would silently lose durable writes because HS415 is read-only.
- The other unsafe jump would be cloning `collectActorWatch(...)`; it would preserve behavior but preserve the mixed ownership model.
- A controlled fixture DB adapter can test the missing write choreography without touching operator data.

Provider risk:

- HS415 uses fake zKill and fake ESI clients. That is good for route proof but not live readiness.
- Next seam should continue with injected clients and no live/API/provider calls.
- Real zKill/ESI should remain parked until repository write choreography is proven and the adapter surface is stable.

Cadence risk:

- Scheduled actor Watch currently records success/failure around `collectActorWatch(...)`.
- HS415 does not mutate Watch cadence or run state.
- The next seam should not change `watchExecutor.dispatchFor(...)` or scheduled Watch behavior. Let direct controlled adapter behavior prove itself first.

Evidence boundary risk:

- Candidate refs must remain Discovery leads/provenance.
- ESI-backed selected-ref expansion remains Discovery-owned and is not Hydration.
- Evidence/EVEidence begins only when `persistEvidencePackage(...)` lands expanded killmail memory.
- A disposable writer proof is appropriate; operator Evidence writes are not.

Command-surface risk:

- Existing verifiers still assert that `actor.watch` remains registered as evidence-creating and routes through `runActorWatchService(...)`.
- The next packet should add a separate proof/adapter command or verifier-only path. It should not mutate `actor.watch`.

## 6. Recommendation For The Smallest Next Seam

Recommended seam:

```txt
Actor Watch controlled runtime adapter fixture proof
```

Classification:

- Dev-ready if scoped narrowly.
- No-provider.
- Disposable DB only.
- Explicit proof command or focused verifier.
- No production `actor.watch` redirect.
- No scheduled Watch redirect.
- No collector retirement.

What it should prove:

```txt
normalized actor Watch input
-> Discovery-owned route body / production successor
-> fake zKill and fake ESI clients
-> real EvidenceRepository methods against disposable DB
-> candidate refs written / selected / expanded / cached / failed as appropriate
-> Evidence/EVEidence writer landing in disposable DB
-> fetch_run lifecycle finalized
-> old compatibility summary returned
-> collectActorWatch not invoked
```

This is more useful than another read-only proof because HS415 already proved no-mutation composition. The unproven area is controlled mutation choreography.

It is safer than a source-code refactor because the next risk is behavioral, not just file ownership.

## 7. Bounded Implementation Packet Outline

If Overseer opens Dev, the bounded packet should be:

```txt
HS418 - Actor Watch Controlled Runtime Adapter Fixture Proof
```

Suggested scope:

- Add a new proof service or helper, not a production redirect.
- Use a disposable `:memory:` DB in the verifier/proof.
- Seed fixture pending refs, cached killmails, and empty cases as needed.
- Use injected fake zKill and fake ESI clients.
- Compose the Discovery-owned route body or extract a production-successor helper from HS415 if necessary.
- Use real `EvidenceRepository` methods against the disposable DB:
  - `createFetchRun(...)`
  - `pendingDiscoveryRefs(...)`
  - `upsertDiscoveredKillmailRefs(...)`
  - `markDiscoveryRefsSelected(...)`
  - `markDiscoveryRefsFailed(...)`
  - `persistEvidencePackage(...)`
  - `markDiscoveryRefsExpanded(...)`
  - `markDiscoveryRefsCached(...)`
  - `insertWarning(...)`
  - `finalizeFetchRun(...)`
- Return the old caller-facing compatibility summary.
- Prove `collectActorWatch(...)` is not imported, invoked, redirected, or retired.

The packet must explicitly not:

- change `actor.watch`
- change `runActorWatchService(...)`
- change `watchExecutor.dispatchFor(...)`
- call live zKill or ESI
- write operator DB rows
- mutate Watch cadence
- add dispatcher/queue/lease behavior
- change schema
- touch renderer UI
- change runtime enforcement

## 8. If Not Dev-Ready

If Overseer does not want controlled disposable writes yet, the only useful non-Dev alternative is a narrow source trace of `fetch_runs` / `discovered_killmail_refs` / Evidence writer sequencing inside `collectActorWatch(...)`.

However, from reviewed source, the remaining gap is now practical proof rather than another abstract trace. The next useful evidence is a disposable DB adapter proof.

## 9. Parked Items

Keep parked:

- default `actor.watch` redirect
- `runActorWatchService(...)` replacement
- scheduled `watchExecutor.dispatchFor(...)` replacement
- scheduled Watch cadence mutation from the new path
- `collectActorWatch(...)` retirement
- live zKill calls
- live ESI calls
- operator DB Discovery ref writes through the new adapter
- operator DB Evidence/EVEidence writes through the new adapter
- Hydration metadata writes
- durable Discovery task/packet schema
- dispatcher / queue / lease / sequencer behavior
- system/radius Watch replacement
- renderer UI
- runtime enforcement / command blocking changes
- support artifacts
- source-term rename
- protected-word JSON updates

## 10. Verification Evidence Expected For The Next Packet

Expected focused checks:

```txt
node --check <new controlled adapter fixture/proof file>
node --check <new verifier file>
node --check src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js
node --check src\main\services\watchActorDiscoveryRouteBodyFixtureService.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\services\mutatingActionService.js
node --check src\main\watchlist\watchExecutor.js
npm.cmd run verify:watch-actor-discovery-route-body-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
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

Expected proof evidence:

- no `collectActorWatch(...)` import or invocation in the new adapter proof
- production `actor.watch` still routes to `runActorWatchService(...)`
- `runActorWatchService(...)` still calls `collectActorWatch(...)`
- `watchExecutor.dispatchFor(actor)` still returns `runner: collectActorWatch`
- fake zKill/ESI invocation counters are nonzero where expected
- real provider call counts remain zero
- disposable DB `fetch_runs` lifecycle is created/finalized
- disposable DB candidate refs are written and status-mutated as expected
- disposable DB Evidence/EVEidence writer landing succeeds for selected expanded fixture payloads
- cached refs skip ESI-backed expansion and are marked cached
- failed expansion marks failed and finalizes counts/warnings correctly
- operator DB is not mutated
- no Hydration, Watch cadence, schema, UI, support artifact, runtime enforcement, or protected-term changes occur

## Verification / Evidence Used For This Advisory

Reviewed:

- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/OverseerHS417-actor-watch-controlled-runtime-adapter-readiness-request.md`
- `workspace/OverseerHS416-hs415-actor-watch-discovery-route-body-fixture-proof-review.md`
- `workspace/DevHS415-actor-watch-discovery-route-body-fixture-proof.md`
- `workspace/EngineeringTraceHS413-actor-watch-redirect-readiness-recheck.md`
- `workspace/OverseerHS414-hs413-actor-watch-redirect-readiness-recheck-review.md`
- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js`
- `src/main/services/watchActorDiscoveryRouteBodyFixtureService.js`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/discovery/candidateRefMemory.js`
- `src/main/discovery/expansionQueueSelection.js`
- `src/main/discovery/esiBackedExpansionPackage.js`
- `src/main/db/evidenceRepository.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-watch-actor-discovery-route-body-fixture.js`
- relevant `serviceRegistry`, command authority, and Watch executor verifier references located with `rg`

Source trace commands used:

```txt
rg -n "actor_discovery_route_body_fixture|actor\.watch|runActorWatchService|watchActorDiscoveryRouteBodyFixture|collectActorWatch|classification|effects|handler" src\main\services\serviceRegistry.js scripts\verify-watch-actor-discovery-route-body-fixture.js scripts\verify-service-registry.js scripts\verify-command-authority.js scripts\verify-watch-executor.js package.json
rg -n "createFetchRun|upsertDiscoveredKillmailRefs|markDiscoveryRefsSelected|persistEvidencePackage|markDiscoveryRefsExpanded|markDiscoveryRefsCached|finalizeFetchRun|apiCountsForRun|buildActorCollectionPlanSummary|buildCompatibilityResult|candidateRefStatusMutationPosture|evidenceWriterBoundary|table_mutation_proof|watch.actor_discovery_route_body_fixture" src\main\workers\actorWatchCollector.js src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js src\main\services\watchActorDiscoveryRouteBodyFixtureService.js src\main\db\evidenceRepository.js
```

No code was implemented. No provider/API/live calls were run. No production `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, `collectActorWatch(...)`, operator Discovery refs, Evidence/EVEidence, Hydration metadata, Watch cadence, schema, dispatcher/queue/lease behavior, runtime enforcement, UI, support artifact, source terms, protected-word JSON, or `workspace/current.md` were changed.
