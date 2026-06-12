# EngineeringTraceHS413 - Actor Watch Redirect Readiness Re-Check

Status: advisory/source trace only  
Role: Engineering / Source Trace Advisor  
Date: 2026-06-07

## 1. Executive Finding

Decision: ready only for a narrower slice, not ready for default `actor.watch` runtime redirect.

HS411 closed an important helper-home gap: `buildEvidencePackageFromRefs(...)` now lives under `src/main/discovery/esiBackedExpansionPackage.js`, and actor/system/manual callers import it from Discovery. Together with the accepted zKill acquisition, pending-ref rehydration, expansion selection, ESI-backed package, and Evidence writer surfaces, the old actor Watch collector now contains fewer unique primitives.

That does not yet make the current actor Watch entry point safely redirectable. The current runtime still uses `actor.watch -> runActorWatchService(...) -> collectActorWatch(...)`, and scheduled actor Watch still uses `watchExecutor.dispatchFor(actor) -> actor.watch` with `runner: collectActorWatch`. The mixed collector remains the only live-capable orchestrator that creates `fetch_runs`, drains pending Discovery refs, optionally calls zKill, writes candidate refs, selects refs, marks ref status, runs ESI-backed expansion, lands Evidence/EVEidence, inserts warnings, reads API logs, builds the legacy result shape, finalizes the run, and participates in scheduled Watch success/failure recording.

Recommended next packet: create/prove a no-provider actor-route runtime adapter body that composes the Discovery-owned helper surfaces and returns the compatibility result shape without invoking `collectActorWatch`. Do not redirect `actor.watch` by default until that route body is proven.

## 2. Current Actor Watch Behavior Trace

Direct actor Watch entry point:

```txt
serviceRegistry['actor.watch']
-> runActorWatchService(db, payload, context)
-> resolveActorInput(...)
-> normalizeActorWatchScope(...)
-> assertLiveAllowed('actor.watch', ...)
-> collectActorWatch(input, { ...dependencies, db })
```

Source:

- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/workers/actorWatchCollector.js`

Scheduled actor Watch entry point:

```txt
WatchSessionExecutor.tick(...)
-> buildWatchScheduleStatus(...)
-> selectDueWatch(...)
-> dispatchFor(watch)
-> { command: 'actor.watch', payload, runner: collectActorWatch }
-> actionGate('actor.watch', payload)
-> taskRunner.runDetachedTask(...)
-> dispatch.runner(dispatch.payload, ...)
-> recordWatchRunResult(...)
```

Source:

- `src/main/watchlist/watchExecutor.js`

`collectActorWatch(...)` currently does all of the following in one function:

- requires a DB and creates `EvidenceRepository`
- plans actor target, lookback, caps, and zKill request through `planActorWatch(...)`
- creates a `fetch_runs` row
- creates `HttpClient`, `ZKillDiscoveryClient`, and `EsiClient`
- queries pending Discovery refs by actor scope
- either rehydrates pending refs through `pendingActorDiscovery(...)` or calls zKill through `discoverActorRefs(...)`
- writes new candidate refs through `upsertDiscoveredKillmailRefs(...)`
- selects refs through `selectExpansionCandidates(...)`
- marks selected refs through `markDiscoveryRefsSelected(...)`
- expands selected refs through Discovery-owned `buildEvidencePackageFromRefs(...)`
- maps failed expansion warnings back to candidates
- marks failed refs through `markDiscoveryRefsFailed(...)`
- lands Evidence/EVEidence through `persistEvidencePackage(...)`
- marks refs expanded/cached
- reads provider call counts from `api_request_logs`
- inserts actor collection warnings
- returns the old caller-facing summary fields
- finalizes the `fetch_runs` row on success or failure

That is still mixed collector runtime behavior, even though several called helpers now have clearer homes.

## 3. New Discovery-Owned Equivalent Surfaces

Now available and source-backed:

- zKill candidate-lead acquisition: `src/main/discovery/zkillCandidateAcquisition.js`
  - `discoverActorRefs(...)`
  - `discoverSystemRefs(...)`
- pending candidate-ref rehydration: `src/main/discovery/candidateRefMemory.js`
  - `pendingActorDiscovery(...)`
  - `pendingSystemRadiusDiscovery(...)`
- selected-ref expansion selection: `src/main/discovery/expansionQueueSelection.js`
  - `selectExpansionCandidates(...)`
  - `markFailedExpansionCandidates(...)`
  - `summarizeExpansionQueue(...)`
- ESI-backed killmail/detail expansion package preparation: `src/main/discovery/esiBackedExpansionPackage.js`
  - `buildEvidencePackageFromRefs(...)`
- Evidence/EVEidence writer landing: `src/main/db/evidenceRepository.js`
  - `persistEvidencePackage(...)`
- Evidence/EVEidence normalization: `src/main/normalization/killmailNormalizer.js`
  - `normalizeKillmail(...)`
- no-provider package builder / compatibility export: `src/main/workers/killmailIngestionWorker.js`
  - compatibility re-export of `buildEvidencePackageFromRefs(...)`
  - `evidencePackageFromExpandedKillmails(...)` for fixture package building

These are strong ingredients. They are not yet one redirectable actor-route body.

Not found:

- `src/main/services/runActorWatchService.js` does not exist as a separate file. `runActorWatchService(...)` is defined in `src/main/services/mutatingActionService.js`.
- `src/main/discovery/expansionQueue.js` does not exist. The current expansion helper surface is `src/main/discovery/expansionQueueSelection.js`.

## 4. Remaining Mixed-Collector Dependencies

Still reliant on `collectActorWatch(...)` or old mixed semantics:

- Direct `actor.watch` command execution.
- Scheduled actor Watch dispatch runner.
- Real `fetch_runs` lifecycle for actor Watch.
- Real zKill provider movement in actor Watch.
- Durable `discovered_killmail_refs` write from actor Watch acquisition.
- Pending-ref drain decision inside actor Watch runtime.
- Ref selected/expanded/cached/failed status mutation sequencing.
- Evidence/EVEidence writer invocation within actor Watch runtime.
- API request count summary from `api_request_logs`.
- Actor collection warning persistence.
- Legacy result shape construction with fields such as `zkill_refs_discovered`, `expansion_attempted`, `persisted_killmails`, `activity_events_written`, `api_calls_zkill`, and `api_calls_esi`.
- Scheduled Watch success/failure recording still wraps the old runner.

Current proof surfaces intentionally avoid these runtime effects:

- `watch.actor_replacement_parity.preview` is fixture/read-only and does not invoke collectors.
- `watch.actor_compatibility_wrapper_adapter_fixture.preview` builds an old caller-facing fixture shape but does not perform runtime writes.
- `watch.actor_compatibility_wrapper.preview` is explicit preview only and discloses that `actor.watch` still routes to `collectActorWatch`.

## 5. Redirect Readiness Decision

Decision: ready only for a narrower slice.

Why not ready for default redirect:

- There is no source-proven Discovery-owned actor runtime body that replaces `collectActorWatch(...)` end to end.
- Existing accepted wrapper services are preview/fixture-only and explicitly non-authoritative for runtime behavior.
- The compatibility wrapper currently delegates to fixture surfaces and reports zero writes/provider calls. It is not a live-capable replacement path.
- The current direct runtime gate, command metadata, scheduled dispatch runner, and existing verification scripts still expect `actor.watch` to call `runActorWatchService(...)`, and `runActorWatchService(...)` to call `collectActorWatch(...)`.
- Ref status mutation and writer landing sequencing remain orchestrated by the old collector, not by a boundary-owned runtime service.

What is ready:

- A no-provider / injected-client actor-route body proof can be opened.
- That proof can compose current Discovery-owned helper homes without invoking `collectActorWatch(...)`.
- That proof can preserve the old caller-facing compatibility result shape in fixture or injected dependency form.

Precise missing bend:

```txt
old actor Watch payload / normalized actor scope
-> boundary-owned actor route body
-> Discovery zKill candidate acquisition helper
-> Discovery candidate-ref memory/write policy surface
-> Discovery ESI-backed selected-ref expansion package helper
-> Evidence writer boundary call or represented call
-> old caller-facing compatibility result
```

The helpers exist, but that orchestration surface is not yet implemented/proven outside `collectActorWatch(...)`.

## 6. Smallest Safe Next Dev Packet

Recommended next packet, if Overseer opens one:

```txt
Actor Watch Discovery-owned route body fixture / injected-client proof
```

Smallest shape:

- Add a new explicit actor-route service/helper, not a default `actor.watch` redirect.
- Consume the same normalized actor input shape used by `collectActorWatch(...)`.
- Use injected/fake `zkillClient` and `esiClient`; no live provider calls.
- Use disposable DB or fixture-local DB only if writes are part of the proof.
- Compose current Discovery-owned helpers:
  - `discoverActorRefs(...)`
  - `pendingActorDiscovery(...)` if pending-ref drain is included
  - `selectExpansionCandidates(...)`
  - `buildEvidencePackageFromRefs(...)`
- Either represent writer landing without invoking it, or invoke `EvidenceRepository.persistEvidencePackage(...)` only against disposable fixture DB if the packet explicitly authorizes that proof.
- Produce the old caller-facing result shape through the existing compatibility map.
- Prove `collectActorWatch(...)` is not imported or invoked by the new route body.
- Leave `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, and scheduled Watch untouched.

Preferred first version:

- no-provider
- no default redirect
- no scheduled dispatch change
- no collector retirement
- fixture/injected clients
- explicit preview/proof command or direct verifier-only helper

## 7. Acceptance Criteria For That Packet

The packet should prove:

- `collectActorWatch(...)` is not invoked.
- `runActorWatchService(...)` is not changed unless the packet explicitly scopes a non-default alternate path.
- `watchExecutor.dispatchFor(actor)` remains unchanged.
- zKill and ESI calls are fake/injected only.
- Candidate refs remain Discovery leads/provenance, not Evidence/EVEidence.
- ESI-backed expansion remains Discovery-owned and not Hydration.
- Evidence/EVEidence begins only at writer landing.
- Local cache skip is preserved.
- pending-ref drain behavior is either represented accurately or explicitly parked.
- selected/expanded/cached/failed ref status mutation is either fixture-proven or explicitly parked.
- the old caller-facing result shape remains available for compatibility.
- old result fields are labeled compatibility fields, not future receipt doctrine.
- no system/radius Watch behavior changes.
- no schema, dispatcher, lease, runtime enforcement, UI, support artifact, or protected-term changes.

## 8. Verification Commands / Evidence Expected

Expected focused checks for the next packet:

```txt
node --check <new actor route body file>
node --check <new verifier or preview service file>
node --check src\main\workers\actorWatchCollector.js
node --check src\main\services\mutatingActionService.js
node --check src\main\watchlist\watchExecutor.js
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

If the proof includes disposable DB writes, expected evidence should include table-count before/after for:

- `discovered_killmail_refs`
- `killmails`
- `activity_events`
- `fetch_runs`
- `api_request_logs`
- `data_quality_warnings`
- `watchlist_entities`

If the proof is read-only/injected only, expected evidence should prove those counts remain unchanged.

## 9. Parked Risks And Future Work

Keep parked:

- default `actor.watch` redirect
- scheduled actor Watch redirect
- `collectActorWatch(...)` retirement
- live zKill calls
- live ESI calls
- runtime Evidence/EVEidence writes through actor replacement path
- Watch cadence mutation from replacement receipt
- durable Discovery task/packet schema
- dispatcher / queue / lease / sequencer behavior
- system/radius Watch replacement
- Hydration writes
- Observation/report changes
- renderer UI
- runtime enforcement activation / command blocking
- support artifacts
- source-term renames
- protected-word JSON updates

Main future risk:

If Atlas redirects `actor.watch` directly to the existing compatibility wrapper preview, it would convert a live-capable command into a read-only fixture command and silently lose expected behavior. If Atlas redirects directly to a quick clone of `collectActorWatch(...)`, it preserves behavior but also preserves the mixed collector model. The next safe bridge is a new boundary-owned actor route body proof that composes the now-extracted helpers without changing the production entry point.

## Verification / Evidence Used

Reviewed:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS413-actor-watch-redirect-readiness-recheck-request.md`
- `workspace/OverseerHS412-hs411-discovery-esi-backed-expansion-package-helper-extraction-review.md`
- `workspace/DevHS411-discovery-esi-backed-expansion-package-helper-extraction.md`
- `workspace/OverseerHS396-hs395-actor-watch-compatibility-wrapper-command-review.md`
- `workspace/OverseerHS394-hs393-actor-watch-redirect-readiness-review.md`
- `workspace/OverseerHS384-hs383-actor-watch-compatibility-wrapper-adapter-fixture-review.md`
- `workspace/OverseerHS378-hs377-actor-watch-replacement-parity-review.md`
- `workspace/OverseerHS375-hs374-mixed-collector-replacement-route-review.md`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/actorWatchPlanner.js`
- `src/main/services/mutatingActionService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/discovery/candidateRefMemory.js`
- `src/main/discovery/esiBackedExpansionPackage.js`
- `src/main/discovery/expansionQueueSelection.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/db/evidenceRepository.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/watchActorCompatibilityWrapperRuntimePreviewService.js`
- `src/main/services/watchActorCompatibilityWrapperAdapterFixtureService.js`
- `src/main/services/watchActorReplacementParityService.js`
- relevant verifier references under `scripts/`

Source trace commands used:

```txt
rg --files src\main | rg "runActorWatchService|actorWatch|watchExecutor|esiBackedExpansionPackage|expansionQueue|serviceRegistry|mutatingActionService"
rg -n "actor\.watch|watch\.actor_compatibility_wrapper|runActorWatchService|collectActorWatch|watchActorCompatibilityWrapper|actor_replacement|mixed_collector" src\main\services src\main\watchlist scripts package.json
rg -n "'actor\.watch'|watch\.actor_compatibility_wrapper|runActorWatchService|buildWatchActorCompatibilityWrapperPreview|buildWatchActorReplacementParityPreview" src\main\services\serviceRegistry.js scripts\verify-service-registry.js scripts\verify-command-authority.js scripts\verify-watch-actor-compatibility-wrapper-runtime-preview.js scripts\verify-watch-executor.js
rg -n "pendingDiscoveryRefs|upsertDiscoveredKillmailRefs|markDiscoveryRefsSelected|markDiscoveryRefsExpanded|markDiscoveryRefsCached|markDiscoveryRefsFailed|persistEvidencePackage|createFetchRun|finalizeFetchRun|insertWarning|insertApiRequestLog" src\main\db\evidenceRepository.js
rg -n "verify:watch-actor|verify:actor-watch|verify:watch-executor|verify:mutating-services|verify:discovery|verify:evidence" package.json
```

No code was implemented. No provider/API/live calls were run. No Discovery refs, Evidence/EVEidence, Hydration metadata, Watch cadence/state, schema, command metadata, dispatcher/queue/lease, collector retirement, source terms, protected-word JSON, or `workspace/current.md` were changed.
