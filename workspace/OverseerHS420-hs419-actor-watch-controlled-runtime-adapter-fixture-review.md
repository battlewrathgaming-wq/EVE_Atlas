# OverseerHS420 - HS419 Actor Watch Controlled Runtime Adapter Fixture Review

Status: accepted
Date: 2026-06-08

## Reviewed

- `workspace/OverseerHS419-actor-watch-controlled-runtime-adapter-fixture-proof-runway.md`
- `workspace/DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`
- `scripts/verify-watch-actor-controlled-runtime-adapter-fixture.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`

## Decision

HS419 is accepted.

Atlas has now proven, in fixture-only disposable DB form, that an actor Watch-shaped controlled runtime adapter path can exercise the mutation choreography that previously lived inside the mixed actor Watch collector without changing production actor Watch runtime.

## Accepted Result

The proof demonstrates:

- disposable `:memory:` DB mutation only
- injected fake zKill and ESI clients only
- no operator corpus mutation
- no live/provider/API calls
- no production `actor.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no `collectActorWatch(...)` invocation or retirement
- no Watch cadence/run-record mutation
- no Hydration, Observation, Assessment, UI, schema, dispatcher, enforcement, support artifact, source-term rename, or protected-word JSON update

The fixture proves real repository choreography in disposable DBs:

- `createFetchRun(...)`
- `upsertDiscoveredKillmailRefs(...)`
- `pendingDiscoveryRefs(...)`
- `markDiscoveryRefsSelected(...)`
- `persistEvidencePackage(...)`
- `markDiscoveryRefsExpanded(...)`
- `markDiscoveryRefsCached(...)`
- `markDiscoveryRefsFailed(...)`
- `insertWarning(...)`
- `finalizeFetchRun(...)`

The fixture cases cover:

- fresh actor candidate acquisition
- pending candidate drain
- local Evidence/EVEidence cache skip
- ESI-backed expansion failure posture

## Source Sanity Check

Command:

```txt
rg -n "watch.actor_controlled_runtime_adapter_fixture|actorWatchControlledRuntimeAdapterFixture|collectActorWatch|actorWatchCollector" src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js src\main\services\watchActorControlledRuntimeAdapterFixtureService.js scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js src\main\services\serviceRegistry.js src\main\services\enforcementDryRunService.js
```

Result:

- new fixture module, service wrapper, verifier, registry, and enforcement dry-run references are present
- `collectActorWatch` appears only in explicit proof labels/assertions
- no `collectActorWatch(...)` invocation was added
- no import from `actorWatchCollector.js` was added

Command:

```txt
rg -n "operator_db_written|disposable_db_only|:memory:|createFetchRun|upsertDiscoveredKillmailRefs|persistEvidencePackage|finalizeFetchRun" src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js src\main\services\watchActorControlledRuntimeAdapterFixtureService.js scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js
```

Result:

- proof uses disposable `:memory:` DBs
- proof reports no operator DB write
- proof exercises the expected repository choreography surface

## Verification

Ran during Overseer review:

```txt
node --check src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js
node --check src\main\services\watchActorControlledRuntimeAdapterFixtureService.js
node --check scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
git diff --check
git status --short --branch
```

Results:

- syntax checks passed
- focused verifier passed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- git status remains noisy: `main...origin/main [ahead 19]` with the broad milestone stack and HS419 files

## Parked

Still not opened:

- production `actor.watch` redirect
- scheduled Watch redirect
- `runActorWatchService(...)` replacement
- `watchExecutor.dispatchFor(...)` replacement
- `collectActorWatch(...)` retirement
- live zKill/ESI provider movement
- durable Discovery receipt/task/packet persistence
- Watch cadence mutation from Discovery receipt
- dispatcher/queue/lease/runtime enforcement/UI work

## Warm Start

Next session should start with orientation rather than immediate Dev.

Recommended first question:

```txt
Given HS419 is accepted, is Atlas ready for a narrow controlled runtime adapter seam, or should we first source-trace the compatibility summary / caller return path so production actor Watch replacement does not revive mixed collector ownership?
```

No new runway is open from this review.
