# OverseerHS458 - HS456 collectActorWatch Retirement-Readiness Review

Status: accepted with next cleanup seam  
Date: 2026-06-12  
Reviewed artifact: `workspace/EngineeringTraceHS456-collect-actor-watch-remaining-caller-retirement-readiness.md`

## Review Result

HS456 is accepted.

The trace answers the request and matches the clarified boundary:

- Watch owns schedule, work buckets, cadence interpretation, and whether a settled receipt satisfies the emitted Watch work.
- Discovery owns repeatable provider-facing handling, dedupe, recovery, defer/cap/failure posture, candidate refs, ESI-backed expansion, and factual receipt basis.
- Discovery may be capture-rich internally, but callers should receive bounded projections.
- `collectActorWatch(...)` is no longer the active direct or scheduled actor Watch runtime path.
- `collectActorWatch(...)` is not retirement-ready because live scripts, verifier seed paths, availability assertions, and stale compatibility readouts still depend on it.

## Accepted Clarification

The current primitive is:

```txt
Watch scheduled work bucket
-> Discovery repeatable handling/recovery
-> settled factual receipt
-> Watch bucket/cadence interpretation
```

This means Watch does not send go/stop commands into Discovery internals. Watch emits eligible work from its own schedule/bucket and waits for a settled factual receipt. Discovery handles provider movement and recovery until it can report a settled posture.

Discovery may report provider timing facts, such as retry/defer/next provider eligibility. Discovery must not decide Watch cadence, Watch backoff, Watch armed state, or Watch completion as a scheduler decision.

## Findings

No blocking issue in HS456 itself.

The main implementation risk is now stale workspace/runtime readout language:

- `watch.actor_compatibility_wrapper.preview` still describes direct and scheduled actor Watch as using `collectActorWatch(...)`.
- related verifier assertions still expect those stale facts.
- some contract/fixture/readout surfaces still name `collectActorWatch(...)` as current runner rather than legacy retire candidate.

Those stale surfaces are now more dangerous than the old collector itself because they can re-seed future work with the wrong model.

## Accepted Disposition

`collectActorWatch(...)` remains parked legacy/compatibility code for now.

Do not retire it yet.

Do not redirect live runner behavior yet.

Do not migrate broad verifier seed paths yet.

First correct stale compatibility readouts/assertions so they reflect current runtime truth:

- direct actor Watch uses `runActorWatchService(...) -> runActorWatchDirectBody(...)`
- scheduled actor Watch uses `watchExecutor.dispatchFor(actor) -> runScheduledActorWatch(...) -> runActorWatchDirectBody(...)`
- `collectActorWatch(...)` remains available only as legacy/compatibility/retirement candidate

## Next Recommended Packet

Open a narrow Dev packet to correct stale compatibility runtime-preview/readout facts and matching assertions.

The packet should not retire `collectActorWatch(...)`, change provider behavior, change Watch cadence, change Discovery behavior, call providers, mutate Evidence/EVEidence, or add schema.

## Verification Expected

At minimum:

```txt
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:service-registry
```

If Dev touches contract readout surfaces too:

```txt
npm.cmd run verify:watch-actor-compatibility-wrapper-contract
```

No live/provider verification should be run.

