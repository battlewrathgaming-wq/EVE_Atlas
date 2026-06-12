# DevHS415 - Actor Watch Discovery-owned Route Body Fixture Proof

Status: complete; pending Overseer review
Date: 2026-06-08
Executor: Dev

## Scope

Implemented the HS415 fixture-only route-body proof:

```txt
actor Watch-shaped intent
-> Discovery-owned route body
-> injected fixture zKill/ESI clients
-> Discovery candidate acquisition / pending rehydration / expansion helper surfaces
-> old caller-facing compatibility result
```

This is not a production `actor.watch` redirect. Watch remains an intent/cadence/provenance source in this proof; Discovery owns the acquisition and ESI-backed expansion route-body work.

## Files Changed

HS415-specific additions/edits:

- `src/main/discovery/actorWatchDiscoveryRouteBodyFixture.js`
- `src/main/services/watchActorDiscoveryRouteBodyFixtureService.js`
- `scripts/verify-watch-actor-discovery-route-body-fixture.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS415-actor-watch-discovery-route-body-fixture-proof.md`

Repo status also contains a broad pre-existing unaccepted milestone stack from earlier HS work. I did not revert or clean unrelated files.

## Service / Command

Added read-only renderer-eligible command:

```txt
watch.actor_discovery_route_body_fixture.preview
```

Classification:

- `classification: read-only`
- `effects: [read-only]`
- enforcement dry-run metadata: `read_only_non_enforcing_proof`
- External I/O dependency: none
- fixture/no-provider proof posture

## Route Body Shape

The new Discovery route body composes existing Discovery-owned helper surfaces:

- `discoverActorRefs(...)`
- `pendingActorDiscovery(...)`
- `selectExpansionCandidates(...)`
- `markFailedExpansionCandidates(...)`
- `summarizeExpansionQueue(...)`
- `buildEvidencePackageFromRefs(...)`

The proof uses injected fixture clients only:

- fixture zKill client records fake invocation count and returns fixture candidate refs
- fixture ESI client records fake invocation count and returns fixture expanded killmail data or fixture errors
- fake repository surface only exposes `hasKillmail(...)` for local cache skip proof

Pending Discovery refs are preferred before fresh fixture zKill acquisition.

## Compatibility Result Shape

The returned proof includes an old caller-facing compatibility summary with fields such as:

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
- `persisted_killmails: 0`
- `activity_events_written: 0`
- `api_calls_zkill: 0`
- `api_calls_esi: 0`
- `warnings`
- `planned_zkill_requests`
- `zkill_discovery_skipped`
- `collection_plan`
- `expansion_queue`
- `expansion_queue_summary`

The proof explicitly marks those old result fields as compatibility-only. It does not claim the preview is the future Discovery receipt doctrine.

## Source / Import Proof

Ran:

```txt
rg -n "actorWatchDiscoveryRouteBodyFixture|watch.actor_discovery_route_body_fixture|collectActorWatch\(" src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js src\main\services\watchActorDiscoveryRouteBodyFixtureService.js scripts\verify-watch-actor-discovery-route-body-fixture.js src\main\services\serviceRegistry.js
```

Result:

- new route body and service command references are visible
- `collectActorWatch(` did not appear in the new route body, service wrapper, registry handler, or focused verifier
- no import from `actorWatchCollector.js` was added by HS415

## Sample Proof Output

Focused verifier status:

```txt
Actor Watch Discovery-owned route body fixture proof validated
```

Representative fresh route sample:

```txt
action: watch.actor_discovery_route_body_fixture.preview
route_body_fixture_only: true
fake_zkill_client_invocations: 1
fake_esi_client_invocations: 2
provider_calls: 0
live_api_calls: 0
discovery_refs_written: false
discovered_killmail_refs_written: 0
evidence_writer_invoked: false
evidence_landing_performed: false
evidence_writes: 0
hydration_writes: 0
watch_mutations: 0
watch_dispatches: 0
schema_changes: 0
table_mutation_proof.unchanged: true
```

Representative pending route sample:

```txt
helpers include pendingActorDiscovery
pending_refs_considered: 1
zkill_discovery_skipped: true
fake_zkill_client_invocations: 0
fake_esi_client_invocations: 1
table_mutation_proof.unchanged: true
```

## Boundary Confirmation

Confirmed:

- no production `actor.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no `collectActorWatch(...)` invocation or retirement
- no provider/live/API call
- no real/operator Discovery ref write
- no real/operator Evidence/EVEidence write from the route proof
- no Hydration write
- no Watch cadence mutation
- no schema change
- no dispatcher, task queue, lease, or worker behavior change
- no system/radius behavior change
- no renderer UI work
- no support artifact work
- no source-term rename
- no protected-word JSON update

## Verification

Ran:

```txt
node --check src\main\discovery\actorWatchDiscoveryRouteBodyFixture.js
node --check src\main\services\watchActorDiscoveryRouteBodyFixtureService.js
node --check scripts\verify-watch-actor-discovery-route-body-fixture.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\services\mutatingActionService.js
node --check src\main\watchlist\watchExecutor.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
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

Results:

- all listed syntax checks passed
- all listed npm verification commands passed
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling
- `npm.cmd run verify:enforcement-dry-run` remained complete: 114 commands covered, 0 gaps
- `npm.cmd run verify:protected-terms` completed with warning-only advisory output: 801 warnings across the broad current working set; no source-term rename or protected-word JSON update was performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS415-touched files and this handoff artifact

## Risks / Parked Work

- The route body is fixture-only and not a live-capable production replacement.
- `collectActorWatch(...)` remains the live-capable actor Watch orchestrator.
- Production `actor.watch` redirect remains parked.
- Scheduled Watch redirect remains parked.
- Collector retirement remains parked.
- Live zKill/ESI movement remains parked.
- Durable Discovery refs, Evidence/EVEidence writes, Watch receipt/cadence mutation, dispatcher/queue/schema/UI/enforcement work remain parked.

## Recommended Next Action

Overseer review HS415. If accepted, the next seam should decide whether to continue toward a controlled actor Watch runtime adapter path or first extract more Discovery-owned route/helper surfaces before any production redirect is attempted.
