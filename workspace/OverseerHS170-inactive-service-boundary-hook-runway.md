# OverseerHS170 - Inactive Service-Boundary Hook Runway

Status: active Dev runway
Date: 2026-06-01
Role: Atlas Overseer

## Decision

Overseer accepts opening the first inactive service-boundary integration hook.

Decision answers:

- Touching `invokeServiceCommand` is allowed for this packet only if behavior is preserved.
- The hook should run for every known command that reaches the accepted boundary.
- Missing canonical fact classes are telemetry/readout only for this seam.
- Trusted/internal confirmation bypass remains unchanged.
- Unknown/unclassified fail-closed remains inactive policy intent only.

## Rationale

HS168 found Atlas is not ready for active runtime blocking, but is ready for a narrower seam: a non-blocking service-boundary hook.

The smallest useful implementation is not full fact sourcing. It is boundary plumbing proof:

- call the inactive evaluator/adapter path from the live boundary
- do not block
- do not change dispatch
- do not call providers
- do not read/write config unless already supplied in trusted context
- do not create records or support artifacts
- optionally report the preview to a trusted observer for tests

## Expected Dev Packet

Expected handoff:

```txt
workspace/DevHS170-inactive-service-boundary-hook.md
```

The packet should update `workspace/current.md` Evidence / Dev Handoff and create the Dev handoff when complete.
