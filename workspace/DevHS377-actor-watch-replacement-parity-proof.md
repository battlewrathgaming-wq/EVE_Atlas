# DevHS377 - Actor Watch Replacement Parity Proof

Status: complete
Date: 2026-06-07
Role: Dev

## Scope

Implemented the actor-only, fixture-only, read-only replacement parity proof requested by HS377.

New command:

```txt
watch.actor_replacement_parity.preview
```

Focused verifier:

```txt
verify:watch-actor-replacement-parity
```

The proof shows current actor Watch behavior can be represented through the future boundary-owned route without redirecting `actor.watch`, invoking `collectActorWatch`, writing rows, creating tasks, calling providers, changing runtime dispatch, or retiring mixed collectors.

## Files Changed

```txt
src/main/services/watchActorReplacementParityService.js
src/main/services/serviceRegistry.js
src/main/services/enforcementDryRunService.js
scripts/verify-watch-actor-replacement-parity.js
scripts/verify-command-authority.js
scripts/verify-service-registry.js
scripts/verify-passive-side-effects.js
package.json
workspace/current.md
workspace/DevHS377-actor-watch-replacement-parity-proof.md
```

## Command Shape

`watch.actor_replacement_parity.preview` reports:

- selected actor Watch source
- current actor entry point shape: `actor.watch`
- current legacy collector: `collectActorWatch`
- future boundary-owned route stages from the HS374 route basis
- semantic parity map for current actor Watch behavior
- represented behavior items
- explicitly missing or parked behavior items
- compatibility-wrapper posture: candidate only, not implemented
- retire posture: `collectActorWatch` candidate only, not retired
- non-invocation proof
- no-mutation proof
- proof basis from HS374, HS376, and HS370

## Coverage

The verifier covers:

- refs found and selected
- no refs
- malformed candidate ref
- duplicate candidate ref
- acquisition capped
- provider deferred
- selected ref becoming Discovery ESI-backed expansion intake
- fixture local cache skip posture

Represented actor behavior:

- actor target identity: entity type, ID, and optional name
- lookback seconds
- max refs
- max expansions
- zKill target type and ID, without provider calls
- candidate ref extraction from `killmail_id` and hash
- malformed candidate posture
- duplicate candidate posture
- no-ref posture
- acquisition capped posture
- provider deferred posture
- Discovery ESI-backed expansion intake posture
- Evidence/EVEidence writer final landing placeholder
- Watch receipt/cadence placeholder

Explicitly parked:

- live zKill provider movement
- durable Discovery ref writes
- live/provider ESI-backed expansion
- retryable/terminal ESI-backed expansion failure execution posture
- Evidence/EVEidence landing writes
- Watch cadence mutation
- compatibility wrapper implementation
- `collectActorWatch` retirement

## Sample Output Summary

Refs-found selected sample:

```txt
actor_only: true
current actor command: actor.watch
legacy collector: collectActorWatch
lookback_seconds: 1209600
max_refs: 5
max_expansions: 5
zKill target: character 90000001
candidate refs: 2 fixture refs
selected ESI-backed expansion intake candidates: 1
local cache skip posture: represented from fixture cachedKillmailIds
Evidence/EVEidence writes: 0
provider calls: 0
watch mutations: 0
```

Deferred sample:

```txt
provider_deferred_posture.represented: true
deferred_count: 1
candidate refs: 0
selected ESI-backed expansion intake candidates: 0
```

No-ref sample:

```txt
no_ref_posture.represented: true
candidate refs: 0
selected ESI-backed expansion intake candidates: 0
```

## Boundary Confirmation

Confirmed:

- actor-only scope; system/radius is not selected or changed
- `actor.watch` was not redirected
- `runActorWatchService` runtime behavior was not changed
- `watchExecutor.dispatchFor` runtime behavior was not changed
- `collectActorWatch` was not invoked
- `collectSystemRadiusWatch` was not invoked
- `WatchSessionExecutor.tick` was not invoked
- `TaskRunner.runDetachedTask` was not invoked
- no live Watch dispatch
- no task creation
- no zKill calls
- no ESI calls
- no `discovered_killmail_refs` writes
- no Evidence/EVEidence writes
- no live/provider ESI-backed expansion
- no Hydration/metadata writes
- no API logs or warnings
- no `fetch_runs` writes
- no Watch cadence or Watch row mutation
- no schema
- no queues, dispatcher, leases, workers, or runtime provider work
- no system/radius Watch behavior change
- no renderer/UI work
- no enforcement or command blocking
- no source-term rename
- no protected-word JSON update
- no mixed collector retirement

Candidate refs remain possible leads, not Evidence/EVEidence. Discovery ESI-backed expansion is represented as a Discovery-serviced provider lane, not Hydration. Evidence/EVEidence remains the final landing boundary only.

## Verification

Passed:

```txt
node --check src\main\services\watchActorReplacementParityService.js
node --check scripts\verify-watch-actor-replacement-parity.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check src\main\services\enforcementDryRunService.js
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:watch-mixed-collector-replacement-route
npm.cmd run verify:watch-discovery-acquisition-split-fixture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Final checks run after handoff/current updates:

```txt
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

## Risks / Notes

- This is still a preview/proof command, not runtime replacement.
- It demonstrates semantic parity and missing/parked posture; it does not make `actor.watch` use the new route.
- Retryable/terminal ESI-backed expansion failure is identified as a future Discovery ESI-backed lane proof because HS377 does not execute ESI expansion.
- Existing mixed collectors remain present and unchanged.

## Recommended Next Action

Overseer review HS377, then consider the smallest compatibility-wrapper or actor-route replacement design packet that can move `actor.watch` toward the boundary-owned route without live provider movement, Discovery ref writes, Evidence/EVEidence writes, or collector retirement in the same step.
