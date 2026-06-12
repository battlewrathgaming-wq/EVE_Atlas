# OverseerHS430 - Actor Watch Disabled Seam Next Decision Surface

Status: decision surface
Date: 2026-06-11
Role: Overseer

## Current Landing

HS428 is accepted by HS429.

Atlas now has a disabled, non-renderer, proof-only actor Watch controlled adapter seam:

```txt
watch.actor_controlled_adapter_disabled.preview
```

It proves the boundary-owned actor Watch adapter can sit near service surfaces without redirecting production `actor.watch`, scheduled Watch, providers, or operator corpus writes.

## Stable Pillars

- Watch remains intent / cadence / accepted-scope authority.
- Discovery remains provider-facing acquisition utility.
- Discovery refs remain possible leads / Discovery memory, not Evidence/EVEidence.
- Evidence/EVEidence remains expanded ESI killmail memory.
- Hydration remains readability repair.
- Observation remains local story/readout transformation.
- Assessment remains human judgment.
- The disabled seam is proof-only and non-production.

## Still Not Open

- default production `actor.watch` redirect
- scheduled Watch redirect
- `runActorWatchService(...)` replacement
- `watchExecutor.dispatchFor(...)` replacement
- `collectActorWatch(...)` retirement
- live zKill / ESI movement through the new path
- operator Discovery ref writes through the new path
- operator Evidence/EVEidence writes through the new path
- durable Discovery task/packet persistence
- Watch cadence mutation from Discovery receipt
- dispatcher / queue / lease / runtime enforcement activation
- renderer UI

## Candidate Next Seams

### 1. Redirect-Readiness Source Trace

Trace whether production `actor.watch` redirect is now structurally ready, what exact code would change, what verification would be mandatory, and what stop conditions still block redirect.

This is recommended before any Dev redirect packet.

### 2. Broader Discovery Replacement Stack Review

Pause actor Watch movement and review HS351-HS429 as a stack, focusing on whether accumulated proof seams are coherent enough before crossing into production runtime replacement.

This is useful if context load or broad working-tree noise becomes the bigger risk.

### 3. Production Redirect Runway Later

Open only after a redirect-readiness trace is accepted.

This remains parked for now.

## Recommendation

Recommended next seam: redirect-readiness source trace.

Reason: the disabled seam is now in place, but production redirect is a sharper boundary than proof-only command registration. Atlas should inspect exact replacement mechanics before authorizing Dev to touch `actor.watch` or `runActorWatchService(...)`.

## Human Decision Needed

Choose one:

- continue assurance with redirect-readiness trace
- pause for broader stack review
- rest here
