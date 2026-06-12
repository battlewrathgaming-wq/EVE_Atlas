# OverseerHS394 - HS393 Actor Watch Redirect Readiness Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS393-actor-watch-runtime-redirect-readiness-request.md`
- `workspace/EngineeringTraceHS393-actor-watch-runtime-redirect-readiness.md`
- source trace references for `actor.watch`, `runActorWatchService(...)`, `collectActorWatch(...)`, `watchExecutor.dispatchFor(...)`, and accepted compatibility-wrapper proof surfaces

## Decision

HS393 is accepted.

Atlas is ready with constraints for a narrow Dev packet that adds an explicit no-provider actor Watch compatibility-wrapper command/path.

Atlas is not ready to redirect the existing `actor.watch` command by default, and is not ready to change scheduled Watch dispatch through `watchExecutor.dispatchFor(...)`.

## Accepted Findings

Current direct actor Watch runtime remains:

```txt
actor.watch -> runActorWatchService(...) -> collectActorWatch(...)
```

Current scheduled actor Watch runtime remains:

```txt
watchExecutor.dispatchFor(actor) -> command actor.watch + runner collectActorWatch
```

The old mixed collector still bundles Watch intent/cadence, zKill acquisition, Discovery ref persistence, ESI-backed killmail/detail expansion, Evidence/EVEidence writes, run posture, warnings, and support logging. It should not become the future boundary-owned model.

The next safe step is not a default redirect. The next safe step is a new explicit no-provider compatibility-wrapper command that:

- consumes the old actor Watch payload shape
- calls already-proven boundary-owned fixture/adapter surfaces
- returns old caller-facing compatibility result shape
- proves no provider calls, writes, Watch mutation, collector invocation, schema, UI, or runtime enforcement
- leaves `actor.watch`, `runActorWatchService(...)`, `watchExecutor.dispatchFor(...)`, and `collectActorWatch(...)` unchanged

## Terminology Decision

Use compatibility-wrapper language only as a temporary bridge surface.

Accepted classifications:

- `actor.watch`: current Atlas command / temporary compatibility surface, not future doctrine.
- `collectActorWatch`, `actorWatchCollector`, `collector`, `collection`: legacy mixed-boundary terms; acceptable only as source-trace or explicit legacy labels unless boundary-qualified.
- `Discovery collector`: acceptable only if it means Discovery-owned acquisition movement; it must not preserve old Watch collector ownership.
- `expansion`: acceptable only when boundary-qualified, such as `Discovery ESI-backed killmail/detail expansion`.
- old result fields such as `zkill_refs_discovered`, `expansion_attempted`, `persisted_killmails`, and `activity_events_written`: adapter parity fields only, not future receipt doctrine.

## Parked

Keep parked:

- default `actor.watch` redirect
- scheduled `watchExecutor.dispatchFor(...)` redirect
- live zKill
- live ESI
- durable Discovery ref writes through the replacement path
- Evidence/EVEidence writes through actor replacement runtime
- Watch cadence/state mutation from replacement receipt
- system/radius Watch
- mixed collector retirement
- schema
- runtime enforcement activation / command blocking
- renderer UI
- support artifacts
- source-term renames
- protected-word JSON updates

## Next Packet

Open HS395: explicit no-provider actor Watch compatibility-wrapper command proof.

Suggested command:

```txt
watch.actor_compatibility_wrapper.preview
```

This name is accepted as a temporary bridge/proof command, not future product doctrine.

