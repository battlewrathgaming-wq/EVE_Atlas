# OverseerHS172 - Runtime Hook Coverage Fact Runway

Status: active Dev runway
Date: 2026-06-01
Role: Atlas Overseer

## Decision

Open the next smallest runtime-enforcement seam: source one canonical read-only fact class inside the inactive service-boundary hook.

The selected fact class is command classification coverage.

## Rationale

HS170 proved the live service boundary can call an inactive preview hook without behavior change. The hook still relies on supplied context facts.

Before adding telemetry, storage facts, External I/O facts, task facts, or active blocking, Atlas should prove that one harmless canonical fact can be sourced inside the hook:

- command coverage is already an in-memory classification map
- it does not require DB reads
- it does not require config reads
- it does not call providers
- it does not write state
- it reduces missing fact ambiguity for every known command

## Expected Dev Packet

Expected handoff:

```txt
workspace/DevHS172-runtime-hook-coverage-fact.md
```

The packet should update `workspace/current.md` Evidence / Dev Handoff and create the Dev handoff when complete.
