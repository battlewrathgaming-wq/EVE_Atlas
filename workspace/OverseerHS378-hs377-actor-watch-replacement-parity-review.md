# OverseerHS378 - HS377 Actor Watch Replacement Parity Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS377-actor-watch-replacement-parity-proof-runway.md`
- `workspace/DevHS377-actor-watch-replacement-parity-proof.md`
- `src/main/services/watchActorReplacementParityService.js`
- `scripts/verify-watch-actor-replacement-parity.js`
- related registry / command authority / passive side-effect / enforcement dry-run updates

## Finding

No blocking issue found.

HS377 satisfies the actor-only, fixture-only, read-only proof request. It proves expected actor Watch behavior can be represented through the boundary-owned route without redirecting `actor.watch`, invoking `collectActorWatch`, writing rows, calling providers, changing system/radius behavior, or retiring mixed collectors.

## Accepted Result

Accepted command:

```txt
watch.actor_replacement_parity.preview
```

Accepted verifier:

```txt
verify:watch-actor-replacement-parity
```

The proof represents:

- actor Watch target identity, lookback, max refs, and max expansions
- zKill target type/id as future Discovery acquisition posture, with no provider call
- candidate refs as possible leads, not Evidence/EVEidence
- malformed, duplicate, no-ref, capped, provider-deferred, selected-ref, and local-cache-skip fixture postures
- Discovery ESI-backed killmail/detail expansion intake as a Discovery provider lane, not Hydration
- Evidence/EVEidence writer as the final landing boundary only
- Watch receipt/cadence posture as represented but not mutated

## Boundary Confirmation

Confirmed preserved:

- no `actor.watch` redirect
- no `runActorWatchService` runtime behavior change
- no `watchExecutor.dispatchFor` runtime behavior change
- no `collectActorWatch` or `collectSystemRadiusWatch` invocation
- no `WatchSessionExecutor.tick` or `TaskRunner.runDetachedTask` invocation
- no provider calls, zKill calls, or ESI calls
- no Discovery ref writes
- no Evidence/EVEidence writes
- no Hydration/metadata writes
- no API log, warning, or `fetch_runs` writes
- no Watch row mutation
- no schema, queue, dispatcher, lease, worker, runtime enforcement, command blocking, UI, support artifact, source-term rename, protected-word JSON update, mixed collector redirect, or mixed collector retirement
- no system/radius behavior change

## Verification

Overseer reran:

```txt
npm.cmd run verify:watch-actor-replacement-parity
npm.cmd run verify:watch-mixed-collector-replacement-route
npm.cmd run verify:watch-discovery-acquisition-split-fixture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- focused HS377 verifier passed
- route / acquisition split / acquisition-to-Evidence handoff verifier chain passed
- command authority, passive side effects, enforcement dry-run, and service registry passed
- protected-term verifier exited 0 with warning-only advisory output; no renames or protected-word JSON updates were performed
- `git diff --check` exited 0 with line-ending warnings only
- repo remains `main...origin/main [ahead 19]` with the expected uncommitted Discovery/Watch proof chain

## Notes

- `verify:service-registry` timed out at 120 seconds when run in parallel with other checks, then passed when rerun alone with a longer timeout.
- `actor_only: true` is treated as the command/proof classification. The actual actor fixture selection is separately represented and verified through `selected_actor_watch_source`.

## Resting State

HS377 is accepted. No new Dev runway is opened by this review.

Recommended next decision seam:

1. design the smallest actor-route compatibility wrapper step, still no providers and no collector retirement, or
2. prove the Discovery ESI-backed expansion intake/error posture more directly before runtime replacement, or
3. pause Dev and perform a boundary/audit cleanup pass across Discovery / Watch now that the actor parity proof has landed.
