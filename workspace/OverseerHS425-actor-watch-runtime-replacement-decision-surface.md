# OverseerHS425 - Actor Watch Runtime Replacement Decision Surface

Status: decision surface
Date: 2026-06-11
Role: Overseer

## Current Landing

HS423 is accepted by HS424.

Atlas has now proven, in fixture/proof form, that the boundary-owned actor Watch adapter path can:

- compose the current caller-facing compatibility summary shape
- return that summary directly for direct caller posture
- wrap that summary under `data.collection` for scheduled-style compatibility posture
- avoid importing or invoking `collectActorWatch(...)`
- leave production `actor.watch`, `runActorWatchService(...)`, and `watchExecutor.dispatchFor(...)` unchanged

## Stable Pillars

- Watch is intent, cadence, and accepted-scope authority.
- Discovery is provider-facing acquisition utility, including zKill candidate acquisition and ESI-backed selected-ref expansion.
- Discovery refs are possible leads / Discovery memory, not Evidence/EVEidence.
- Evidence/EVEidence is expanded ESI killmail memory.
- Hydration is readability repair.
- Observation is local story/readout transformation.
- Assessment is human judgment.
- Old actor Watch output names may remain compatibility/debug projection fields only.

## Still Not Open

- default production `actor.watch` redirect
- scheduled Watch redirect
- `runActorWatchService(...)` replacement
- `watchExecutor.dispatchFor(...)` replacement
- `collectActorWatch(...)` retirement
- live zKill / ESI movement
- operator Discovery ref writes from a new runtime path
- operator Evidence/EVEidence writes from a new runtime path
- durable Discovery task/packet persistence
- Watch cadence mutation from Discovery receipt
- dispatcher / queue / lease / runtime enforcement
- renderer UI

## Candidate Next Seams

### 1. Production-Adjacent Adapter Insertion Trace

Source-trace where the controlled adapter would attach later:

- direct `actor.watch` service path
- scheduled `dispatchFor(...)` runner path
- task result wrapper expectations
- command authority / service registry implications
- verification needed before a disabled adapter can exist near production surfaces

This is safest if we want one more assurance pass before another Dev packet.

### 2. Disabled Controlled Adapter Command / Service Seam

Create a non-default, disabled/proof-only service seam that can call the boundary-owned actor Watch adapter with fake/provider-injected dependencies, return the accepted compatibility summary, and remain separate from production `actor.watch`.

This is a Dev seam, but it must not redirect production or scheduled Watch.

### 3. Stop And Review Discovery Replacement Stack

Pause actor Watch movement and do a stack-level review of HS351-HS424 before any production-adjacent work.

This is useful if the large working set or context load is becoming the main risk.

## Recommendation

Recommended next seam: Candidate 1, a production-adjacent adapter insertion trace.

Reason: HS423 proves return shape. Before Dev places another seam near production service/runtime surfaces, Atlas should verify the exact insertion points and stop conditions one more time. This keeps the next movement boring, narrow, and honest.

## Human Decision Needed

Choose one:

- continue assurance first with production-adjacent insertion trace
- proceed to a disabled controlled adapter command/service seam
- pause for stack review / housekeeping
