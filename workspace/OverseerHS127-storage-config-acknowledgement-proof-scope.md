# OverseerHS127 - Storage Config Acknowledgement Proof Scope

Status: accepted shaping artifact
Date: 2026-05-31
Role: Overseer

## Request Answered

Human accepted the HS125/HS126 finding:

```text
bounded action based on discovery
```

This artifact shapes the next Atlas storage/runtime seam before Dev implementation.

## Current Landing

Atlas now has:

- `storage.authority_preflight`
- `storage.setup_gate_readout`
- `storage.setup_gate_readout.action_class_matrix`
- `support.gate_stack_readout`
- service registry effect metadata
- command-authority verification
- passive-side-effect verification

These are enough for readout and proof.

They are not enough for real lockout enforcement.

## Gap Named

Before Atlas enforces storage lockout, Atlas must know what storage authority means.

The next gap is:

```text
selected storage and fallback acknowledgement
```

Atlas needs to answer:

- What counts as explicit selected storage?
- What counts as app-local/current-file fallback?
- When has the operator knowingly accepted the fallback?
- Where is that acknowledgement recorded?
- When does acknowledgement expire or become invalid?
- How does this posture appear in readout before any enforcement?

## Product Rule

Atlas is a portable briefcase tool.

Storage setup should be explicit and recoverable.

Atlas should not silently clog a machine or hide write destinations in OS-specific settings.

The operator should be able to see:

- where Atlas intends to write
- whether that destination was explicitly selected
- whether fallback storage is merely available or knowingly accepted
- whether storage is missing, invalid, degraded, or over budget
- what Atlas will not do until storage trust is sufficient

## Authority Boundaries

This scope does not decide final implementation details.

It accepts only the need for a proof/readout model.

Do not implement real storage config writes yet unless Human/Overseer explicitly opens that as a write-capable packet.

Do not implement enforcement yet.

## Proposed Storage Authority Model

### selected_storage

Meaning:

```text
The operator has explicitly chosen an Atlas storage location.
```

Readout should show:

- selected root or DB path basis
- source: explicit user selection / accepted config / fixture
- validation status
- writable/readable posture when known
- budget configuration when known

### app_local_fallback_available

Meaning:

```text
Atlas can use the current/app-local location, but the operator has not accepted real writes there.
```

Readout should show:

- fallback path basis
- acknowledgement status: not acknowledged
- real/alpha collection blocked
- local read may be available if safe
- setup/config action available

### app_local_fallback_acknowledged

Meaning:

```text
The operator has knowingly accepted app-local/current-file storage as the active Atlas storage location.
```

Readout should show:

- fallback path basis
- acknowledgement status: acknowledged
- acknowledgement provenance if available
- validation status
- budget posture
- whether this is treated as selected storage or a distinct fallback mode

This is a key Human/Overseer decision.

### acknowledgement_invalidated

Meaning:

```text
The previous acknowledgement no longer safely applies.
```

Possible invalidation triggers:

- app path changed
- storage path changed
- config version changed
- selected/fallback path missing
- path no longer writable/readable
- budget config missing or invalid
- operator clears acknowledgement

Readout should show invalidation reason without guessing.

## Proof Needs

The next Dev proof should be read-only or fixture-only.

It should demonstrate how Atlas would classify:

- no storage selected
- explicit configured storage selected
- app-local fallback available but unacknowledged
- app-local fallback acknowledged
- acknowledgement invalidated
- selected storage missing/unavailable
- selected storage invalid/degraded
- budget unconfigured
- budget warning / strong warning / hard-lock

It should expose enough fields for later enforcement without enforcing.

## Candidate Readout Fields

Recommended shape:

```text
storage_authority:
  mode
  selected: true/false
  fallback_available: true/false
  fallback_acknowledged: true/false
  acknowledgement_status
  acknowledgement_basis
  acknowledgement_invalid_reason
  config_source
  config_version
  storage_root
  database_path
  path_basis
  validation_status
  budget_source
  budget_bytes
  read_allowed
  write_allowed_if_enforced_later
  provider_movement_allowed_if_enforced_later
```

Field names are advisory for the proof. Dev should follow existing local style where possible.

## Open Human / Overseer Decisions

Before write-capable config work:

- final portable config filename
- final portable config location
- whether fallback acknowledgement is persisted in the same config file
- whether app-local fallback acknowledged becomes equivalent to selected storage
- whether budget must be set before real provider-backed work
- whether budget can be unset with warning, or must be explicit
- how much path detail is safe to show in renderer/UI

These do not need to be fully decided for a read-only/fixture proof, but the proof should make the missing decisions visible.

## Guardrails

- No code implementation from this artifact alone.
- No real storage config writes.
- No storage migration, copy, move, relocation, restore, or deletion.
- No real lockout enforcement.
- No provider calls.
- No Evidence/EVEidence writes.
- No hydration writes.
- No renderer/UI redesign.
- No source/bridge term rename.
- No treating app-local fallback as accepted storage without explicit acknowledgement state.
- No arbitrary renderer path probing.
- No use of `workspace/to-be-sorted/` as active input.

## Recommended Dev Packet

If accepted, open:

```text
HS128 storage config acknowledgement proof
```

Expected handoff:

```text
workspace/DevHS128-storage-config-acknowledgement-proof.md
```

Preferred Dev scope:

- read-only or fixture-only proof
- add storage authority/config acknowledgement readout shape
- integrate with or sit alongside `storage.setup_gate_readout`
- prove acknowledged/unacknowledged fallback states
- prove selected storage and missing/degraded storage states
- prove budget-config readout is visible
- prove renderer payloads cannot select/probe arbitrary paths
- no real config write yet
- no enforcement

## Disposition

Accepted as Overseer shaping material.

No Dev runway opened by this artifact alone.
