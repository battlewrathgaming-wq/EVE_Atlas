# OverseerHS346 - Watch Due / Discovery Pickup Acceptance

Status: accepted
Date: 2026-06-06
Role: Overseer
Milestone: Atlas Storage And Runtime Hardening

## Accepted Advisory

```txt
workspace/EngineeringTraceHS346-watch-due-and-discovery-pickup-surfaces.md
```

## Accepted Clarification

```txt
Watch is a scheduler and scope-authority source.
Discovery is the acquisition utility.
A due Watch emits Discovery pickup intent; it does not acquire candidates itself.
```

## Accepted Findings

- The Watch Due / Scheduler Surface decides whether a Watch is due, held, not due, active/running, or blocked.
- The Discovery Pickup Surface starts after a Watch is due and should produce candidate acquisition packet data only.
- For system/radius Watch, stored accepted `included_system_ids` are execution authority.
- Center system and radius remain provenance/explanation after acceptance.
- One accepted system ID should become one Discovery pickup packet.
- Existing proof surfaces are clean but still lack a first-class N-per-system Discovery pickup packet proof.
- Current runtime collectors are mixed and combine Discovery acquisition, durable Discovery ref writes, ESI Evidence Expansion, Evidence persistence, logs/warnings, and fetch-run lifecycle.

## Accepted Risk

The existing direct runtime path is still mixed:

```txt
watch.executor.tick -> dispatchFor -> actor.watch/system.radius.watch -> collectors -> providers/persistence
```

That path should not be live/provider-tested until the Discovery pickup packet boundary is explicit and accepted.

## Accepted Next Seam

```txt
selected due Watch -> Discovery pickup packet plan
```

This becomes HS347.

## Parked

- Runtime collector splitting.
- Durable Discovery ref writing.
- ESI Evidence Expansion dispatch.
- Direct collector accepted-scope patching, unless HS347 proves the boundary cannot be established without it.
- Manual/User-driven Discovery adoption of the same pickup shape.
- Live/provider Watch testing.

## Boundary

This acceptance does not authorize live Watch execution, provider movement, Discovery ref writes, Evidence/EVEidence writes, Hydration writes, Observation work, schema changes, UI work, runtime enforcement, support artifacts, durable Watch result identity, relationship tags, or fourth-lane behavior.
