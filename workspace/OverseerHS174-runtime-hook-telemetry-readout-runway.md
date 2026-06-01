# OverseerHS174 - Runtime Hook Telemetry Readout Runway

Status: active Dev runway
Date: 2026-06-01
Role: Atlas Overseer

## Decision

Open a bounded runtime hook telemetry/readout seam.

This packet should not add active enforcement, blocking, DB persistence, config reads, provider calls, or broad fact sourcing. It should make the inactive hook's preview output easier to inspect and verify.

## Rationale

HS170 proved the inactive hook can run at the live service boundary.

HS172 proved the hook can source one safe canonical fact class: command classification coverage.

Before sourcing riskier fact classes, Atlas should make hook preview evidence easier to inspect in a read-only way. This lets future packets reason from visible telemetry instead of guessing what the boundary is seeing.

## Expected Dev Packet

Expected handoff:

```txt
workspace/DevHS174-runtime-hook-telemetry-readout.md
```

The packet should update `workspace/current.md` Evidence / Dev Handoff and create the Dev handoff when complete.
