# DevHS419 - Actor Watch Controlled Runtime Adapter Fixture Proof

Status: complete for Overseer review

## Scope

Executed HS419 only: prove mutation choreography for a controlled actor Watch adapter path in disposable DBs with injected fake clients, without changing production `actor.watch`.

This proof is fixture-only and non-production. It does not redirect runtime actor Watch, invoke or retire `collectActorWatch(...)`, call providers, mutate the operator corpus, change schema, or touch UI/enforcement/support behavior.

## Files Changed

- `package.json`
- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`
- `src/main/services/watchActorControlledRuntimeAdapterFixtureService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-actor-controlled-runtime-adapter-fixture.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/current.md`
- `workspace/DevHS419-actor-watch-controlled-runtime-adapter-fixture-proof.md`

## Implementation

Added `watch.actor_controlled_runtime_adapter_fixture.preview`.

Command posture:

- fixture-only
- non-renderer eligible
- registered as `metadata-only`
- classified in enforcement dry-run as `fixture_only_non_production`
- uses disposable `:memory:` DBs for mutation proof cases
- snapshots any caller DB before/after and proves the operator corpus is unchanged

Added Discovery-owned fixture helper:

- `src/main/discovery/actorWatchControlledRuntimeAdapterFixture.js`

The helper composes current Discovery/Evidence repository paths with injected fake clients:

- `discoverActorRefs(...)`
- `pendingActorDiscovery(...)`
- `selectExpansionCandidates(...)`
- `markFailedExpansionCandidates(...)`
- `summarizeExpansionQueue(...)`
- `buildEvidencePackageFromRefs(...)`
- `EvidenceRepository.createFetchRun(...)`
- `EvidenceRepository.upsertDiscoveredKillmailRefs(...)`
- `EvidenceRepository.markDiscoveryRefsSelected(...)`
- `EvidenceRepository.persistEvidencePackage(...)`
- `EvidenceRepository.markDiscoveryRefsExpanded(...)`
- `EvidenceRepository.markDiscoveryRefsCached(...)`
- `EvidenceRepository.markDiscoveryRefsFailed(...)`
- `EvidenceRepository.insertWarning(...)`
- `EvidenceRepository.finalizeFetchRun(...)`

The helper does not import `actorWatchCollector.js` and does not invoke `collectActorWatch(...)`.

## Fixture Cases

Fresh actor candidate acquisition:

- fake zKill invoked once
- fake ESI invoked twice
- 3 disposable Discovery refs written
- 2 refs selected
- 2 refs expanded
- 2 killmails persisted
- 12 activity events written
- run finalized
- 1 pending candidate remains

Pending candidate drain:

- seeded pending refs in disposable DB
- fake zKill not invoked
- 2 refs selected, expanded, and persisted
- run finalized

Local Evidence/EVEidence cache skip:

- seeded existing disposable killmail
- fake zKill invoked once
- cached ref marked cached
- uncached ref selected, expanded, and persisted
- fake ESI invoked only for uncached ref

Expansion failure:

- fake ESI failure is contained in disposable DB
- selected ref marked failed
- warning posture recorded
- no killmail or activity-event landing from the failed expansion
- run finalized

## Sample Proof Output

Focused verifier result:

```txt
Actor Watch controlled runtime adapter fixture proof validated
```

Fresh case sample:

```txt
fake_zkill_client_invocations: 1
fake_esi_client_invocations: 2
refs_written: 3
selected_count: 2
expanded_count: 2
persisted_killmails: 2
activity_events_written: 12
finalized: true
status_counts:
  expanded: 2
  pending: 1
disposable table deltas:
  fetch_runs: 1
  discovered_killmail_refs: 3
  killmails: 2
  activity_events: 12
  entities: 6
  ingestion_audits: 2
  api_request_logs: 0
```

Operator non-mutation proof:

```txt
operator_db_written: false
disposable_db_only: true
proof_db_path: :memory:
unchanged: true
```

## Source Proof

Command:

```txt
rg -n "watch.actor_controlled_runtime_adapter_fixture|actorWatchControlledRuntimeAdapterFixture|collectActorWatch" src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js src\main\services\watchActorControlledRuntimeAdapterFixtureService.js scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js src\main\services\serviceRegistry.js
```

Result:

- new fixture module, service wrapper, verifier, and service command references are present
- `collectActorWatch` appears only in explicit proof labels/assertions such as not imported / not invoked / unchanged
- no `collectActorWatch(...)` call was added
- no import from `actorWatchCollector.js` was added

## Verification

Passed:

```txt
node --check src\main\discovery\actorWatchControlledRuntimeAdapterFixture.js
node --check src\main\services\watchActorControlledRuntimeAdapterFixtureService.js
node --check scripts\verify-watch-actor-controlled-runtime-adapter-fixture.js
node --check src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js
node --check src\main\services\watchActorDiscoveryRouteBodyFixtureService.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\services\mutatingActionService.js
node --check src\main\watchlist\watchExecutor.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
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
```

Final hygiene after this handoff write passed:

```txt
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- `npm.cmd run verify:protected-terms` completed with exit code 0 and warning-only advisory output: 825 warnings across the broad current working set; no source-term rename or protected-word JSON update was performed.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS419 files.

## Boundary Confirmation

Confirmed:

- no production `actor.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no `collectActorWatch(...)` invocation or retirement
- no live/provider/API call
- no operator DB write
- no operator Discovery ref write
- no operator Evidence/EVEidence write
- no Hydration write
- no Watch cadence or run-record mutation
- no schema, dispatcher, queue, lease, enforcement, command blocking, UI, support artifact, source-term rename, or protected-word JSON update

## Remaining Parked

- production actor Watch redirect
- scheduled Watch redirect
- `runActorWatchService(...)` replacement
- `watchExecutor.dispatchFor(...)` replacement
- `collectActorWatch(...)` retirement
- live zKill/ESI provider movement
- durable Discovery receipt/task/packet persistence
- Watch cadence mutation from Discovery receipt
- dispatcher/queue/lease/runtime enforcement/UI work

## Recommended Next Action

Overseer should review whether the disposable mutation choreography is sufficient to open a narrow controlled runtime adapter seam, or whether one more source trace should inspect how the compatibility summary would be returned without reviving mixed collector ownership.
