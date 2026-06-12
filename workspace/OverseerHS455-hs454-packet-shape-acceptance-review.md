# OverseerHS455 - HS454 Packet Shape Acceptance Review

Status: accepted with changes
Date: 2026-06-12
Reviewed artifact: `workspace/PacketShapeHS454-actor-watch-discovery-request-receipt-acceptance.md`

## Review Result

HS454 is accepted as advisory acceptance pressure.

The packet-shape recommendation is:

```txt
accept with changes
```

Atlas can use the HS452 projection as an actor Watch handoff language candidate:

```txt
actor_watch_discovery_request
actor_watch_discovery_receipt
```

But it should not be promoted to final reusable Discovery doctrine, durable packet schema, dispatcher authority, or collector-retirement authority yet.

## Accepted Now

Accept:

- the request/receipt concept is correct for actor Watch handoff shaping
- `compatibility_summary` must remain nested and temporary/debug only
- Watch can consume a factual receipt without inspecting Discovery memory
- Discovery should report factual handling, not caller satisfaction
- Discovery should remain capture-rich internally; performance and caller clarity should be protected at deliberate projection boundaries, not by starving Discovery of factual basis
- zKill candidate refs remain Discovery/provenance, not Evidence/EVEidence
- ESI-backed killmail expansion remains Evidence/EVEidence creation, not Hydration
- direct and scheduled actor Watch can share the same projected handoff language

## Changes Required Before Stronger Adoption

Before durable packet persistence, dispatcher work, or collector retirement uses this shape as authority, Atlas needs clearer fields for:

- packet/request identity or idempotency key
- contract/version posture
- caller origin versus dispatch origin
- provider/acquisition route
- local pending-ref policy
- acquisition outcome versus expansion outcome versus Evidence landing outcome
- typed warnings/errors
- Retry-After / deferred / next eligible posture where applicable

The current `source` field is acceptable for actor Watch proof, but likely needs a future split:

```txt
caller_origin
dispatch_origin
```

## Projection Doctrine

Discovery's internal or canonical receipt basis may stay rich:

- provider route
- candidate refs
- pending refs
- selection posture
- ESI-backed expansion posture
- warnings
- provenance
- API posture
- Evidence/EVEidence landing basis

Callers should consume bounded projections shaped for their needs.

For example:

- Watch receives enough to record handled/not handled, cadence outcome, caps, warnings, and next-safe posture
- Manual / Live / Marked / Assessment can receive different projections later without redefining Discovery ownership

This preserves Discovery as the capture-rich provider-facing utility while preventing caller-specific terms from taking over Discovery's source model.

## Accepted Limitation

The model names remain actor-Watch-specific. They should not be reused as the generic form for Manual, Live, Marked, or Assessment-originated requests.

Future generic naming is parked:

```txt
discovery_request
discovery_receipt
request_kind
```

## Recommended Next Seam

The next safe step is not Dev implementation.

Open a source trace for:

```txt
remaining collectActorWatch caller / retirement-readiness trace
```

Use HS452 and HS454 as review lenses:

- current actor Watch handoff has a usable projected request/receipt shape
- compatibility output remains temporary
- collector retirement is not authorized until remaining callers and expectations are mapped

## Parked

- generic Discovery packet naming
- durable task/packet/receipt schema
- dispatcher/queue/lease design
- provider route registry
- system/radius request/receipt generalization
- Manual / Live / Marked / Assessment-originated request contracts
- collector retirement
- live/provider testing
