# Overseer HS245: HS244 Patient Packet Identity Review

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Reviewed artifact: `workspace/DataEngineeringHS244-patient-packet-identity-boundaries.md`

## Decision

Accepted.

HS244 gives Atlas the right next-level answer: do not build a broad provider work queue yet, and do not turn `runtime.queue_clock_posture.preview` into architecture authority.

The accepted model is lane-specific, low-data, and recoverable.

## Accepted Direction

Most patient packet posture can remain derived for now from existing local state:

- Watch rows
- Discovery refs
- killmail/Evidence rows
- activity/appearance rows
- fetch runs
- API logs
- ingestion audits
- warnings
- metadata runs
- Hydration candidates/backlog previews
- queue/clock posture preview

Future durable state should be introduced only when Atlas proves a recovery need that cannot be reconstructed from current local facts.

## Accepted Unit-Of-Work Shape

Do not collapse Acquisition and Hydration into one generic provider packet.

Accepted future identity direction:

```txt
Acquisition movement intent/checkpoint:
  Watch/scope/cadence identity for zKill Discovery
  Discovery ref identity for ESI Evidence Expansion

Hydration movement intent/checkpoint:
  Hydration candidate key + lane + basis policy
```

This means:

- zKill Discovery identity is Watch/scope/lookback/cadence/cap/provider-action shaped.
- ESI Evidence Expansion identity is Discovery-ref shaped: `killmail_id` + `killmail_hash` + discovery scope/provenance.
- Hydration identity is readability-candidate shaped: dedupe key + lane + source anchors + freshness/basis policy.

## Boundary Acceptance

Accepted guardrails:

- `discovered_killmail_refs` remains possible leads/provenance and ESI expansion staging, not a sequencer table.
- Discovery refs do not become Evidence/EVEidence.
- ESI Evidence Expansion remains separate from Hydration.
- Hydration remains readability repair, not Evidence/EVEidence creation.
- External I/O on releases work to normal gates; it does not authorize dispatch.
- Restart, storage unlock, or External I/O re-enable must recompute posture and must not catch-up flood.
- View/local-record Hydration should not be starved behind Watch/background Hydration unless a shared gate truly applies.
- High-volume provider attempt logs should not be persisted unless a specific recovery defect proves the need.

## Recommended Next Step

Accepted as optional, not automatic:

```txt
Read-only patient packet identity conformance preview.
```

Purpose:

Map current derived posture into proposed lane-specific identity shapes without creating tables, queues, dispatcher behavior, provider calls, writes, runtime enforcement, support artifacts, or UI.

This would answer:

```txt
If Atlas needed a future durable unit, what identity would each current candidate have, and can it be derived now?
```

## Parked

- broad provider work queue
- shared generic provider packet table
- schema-backed patient packet persistence
- active dispatcher
- provider calls
- ESI Evidence Expansion scheduling
- provider-backed Hydration execution
- durable provider attempt logging
- durable leases/claims
- runtime enforcement activation
- command blocking
- support artifacts for packet state
- pruning/deletion work
- renderer/UI work

## Human / Overseer Decisions Still Needed

Before any implementation:

- Whether to open the optional read-only identity conformance preview.
- Whether patient packet identity should remain parked design context for now.
- Whether future provider cooldown / Retry-After state must become durable.
- Whether Hydration freshness policy needs a durable policy version before provider-backed Hydration execution.
- Whether Watch/background Hydration ever needs durable checkpointing.
- Whether multi-worker or cross-process coordination is in scope.

## Review Notes

This advisory improves Atlas cohesion. It keeps the new posture readout useful without letting it become hidden architecture.

The next Dev packet, if opened, should stay read-only. It should not persist packets. It should only expose derived identity shapes and unknowns.

## Verification

No runtime verification was required for this advisory-only review.

Git/workspace verification should confirm only advisory/resting-state documents changed.
