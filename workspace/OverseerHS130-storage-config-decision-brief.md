# OverseerHS130 - Storage Config Decision Brief

Status: decision brief / no Dev runway
Date: 2026-05-31
Role: Overseer

## Why This Exists

HS128 proved `storage.setup_gate_readout.storage_authority` as a read-only surface.

The next implementation seam cannot safely become write-capable until Atlas decides what storage config means.

This brief captures the decisions needed before any persisted config or acknowledgement packet.

## Current Proof State

Atlas can now read out:

- selected storage
- app-local/current-file fallback available
- app-local/current-file fallback acknowledged
- acknowledgement invalidated
- selected storage missing/unavailable
- selected storage invalid/degraded
- budget source and budget bytes
- future write/provider allowance posture

These are proof/readout fields only.

They are not persisted storage authority.

## Decision Cluster

### 1. Portable Config Home

Question:

```text
Where should Atlas store its own storage-authority config?
```

Accepted Human direction so far:

- Atlas should behave like a portable briefcase.
- Avoid hidden Windows/user settings as the primary authority.
- Storage setup should be explicit and recoverable.

Recommended default for discussion:

```text
project/app-local config file under an Atlas-owned config folder
```

Example shape, not accepted filename:

```text
<Atlas app/root>/config/storage-authority.json
```

Do not treat this as final without Human/Overseer acceptance.

### 2. Config Contents

The first persisted config likely needs:

- schema/version
- selected storage root or DB path basis
- storage mode
- fallback acknowledgement status
- acknowledgement provenance
- budget bytes
- created/updated timestamps
- invalidation basis

It should not contain:

- provider credentials
- raw Evidence/EVEidence
- Discovery refs
- Assessment content
- broad runtime state

### 3. Fallback Acknowledgement Meaning

Question:

```text
Does acknowledged app-local/current-file fallback become selected storage?
```

Current recommendation:

```text
Treat it as accepted storage for action posture, but keep its mode visibly distinct.
```

Reason:

- Dev/runtime can allow writes when explicitly acknowledged.
- Operator can still see this is app-local fallback, not a separately chosen external storage root.

### 4. Acknowledgement Invalidation

Acknowledgement should become invalid if:

- app/root path changes
- DB path changes
- config version changes incompatibly
- selected/fallback path becomes missing
- selected/fallback path becomes unreadable/unwritable
- budget config becomes invalid
- operator clears acknowledgement

Future readout should show the invalidation reason.

### 5. Budget Requirement

Question:

```text
Must the operator set a budget before real provider-backed work?
```

Current recommendation:

```text
Budget should be explicit before real/alpha provider-backed acquisition and Evidence/EVEidence writes.
```

Local read-only inspection may remain available without budget if storage can be opened safely.

### 6. Renderer Authority

Renderer may request setup/readout views.

Renderer must not:

- choose arbitrary storage paths through readout payload
- forge acknowledgement
- override trusted config facts
- probe arbitrary filesystem paths
- set budget through a readout command

Any future path picker/write command should be main-process-owned, explicit, validated, and separately authorized.

## Recommended Next Packet

Do not open until Human/Overseer accepts the needed decisions.

Likely next packet after decision:

```text
HS131 storage config authority write proof
```

Preferred first write-capable scope:

- create or update a portable storage authority config file in the accepted location
- persist selected storage / fallback acknowledgement / budget bytes
- validate readback
- prove renderer cannot write arbitrary paths
- no storage enforcement yet
- no DB move/migration
- no provider calls

If Human/Overseer does not want write-capable config yet, choose instead:

```text
HS131 enforcement dry-run / command-effect mapping
```

But that would still be read-only and should not enforce.

## Guardrails

- This brief does not authorize Dev work.
- This brief does not choose the final config filename/location.
- This brief does not authorize persisted config writes.
- This brief does not authorize lockout enforcement.
- This brief does not authorize DB/storage movement.
- This brief does not authorize provider calls.
- This brief does not change Atlas terminology.

## Human Decisions Needed

Before write-capable config:

1. Accept or change the portable config home pattern.
2. Decide whether acknowledged fallback is accepted storage with distinct fallback mode.
3. Decide whether budget is mandatory before real provider-backed work.
4. Decide whether the first write-capable packet may persist config, or should remain a dry-run/readout proof.

## Disposition

Decision brief only.

No Dev runway opened.
