# OverseerHS451 - HS450 Actor Watch / Discovery Handoff Trace Review

Status: accepted
Date: 2026-06-12
Reviewed artifact: `workspace/EngineeringTraceHS450-actor-watch-discovery-handoff-boundary.md`
Request: `workspace/OverseerHS450-actor-watch-discovery-handoff-source-trace-request.md`

## Review Result

HS450 is accepted.

The trace answered the active question: actor Watch and Discovery can communicate through the current redirected path, but the contract is still implicit and compatibility-shaped.

Current accepted posture:

- direct actor Watch calls `runActorWatchDirectBody(...)`
- scheduled actor Watch calls `runScheduledActorWatch(...)`, which delegates to `runActorWatchDirectBody(...)`
- the current route performs Discovery-owned acquisition, pending-ref recovery, selected-ref ESI-backed expansion, and Evidence/EVEidence landing
- direct callers receive the 22-field compatibility summary
- scheduled callers receive `{ watch, collection: summary }`
- `collection` and related terms are compatibility language, not future Discovery receipt doctrine

## Accepted Boundary Clarification

Watch owns:

- intent
- cadence
- accepted actor target
- task emission
- scheduled task/result wrapping
- receipt consumption

Discovery owns:

- provider-facing acquisition
- candidate refs
- pending ref recovery
- selected-ref ESI-backed expansion
- candidate status movement
- Evidence/EVEidence landing handoff/result basis

The current 22-field summary is acceptable as a compatibility surface. It should now be wrapped/projected into clearer boundary language before further Watch trimming or collector retirement.

## Accepted Next Seam

Open the next proof as:

```txt
read-only actor Watch / Discovery handoff contract projection proof
```

Purpose:

- name `actor_watch_discovery_request`
- name `actor_watch_discovery_receipt`
- project current direct and scheduled actor Watch outputs into that shape
- keep the 22-field compatibility summary under `compatibility_summary`
- prove Watch-owned fields and Discovery-owned fields are separable
- avoid runtime movement, provider calls, schema, and collector retirement

## Parked

- `collectActorWatch(...)` remaining-caller / retirement-readiness trace
- mixed collector retirement
- system/radius Watch redirect
- durable Discovery receipt/task/packet persistence
- dispatcher / queue / lease behavior
- live/provider verification
- Hydration, Observation, Assessment, UI, enforcement, schema, and source-term changes
