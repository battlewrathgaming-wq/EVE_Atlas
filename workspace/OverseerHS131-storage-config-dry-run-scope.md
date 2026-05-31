# OverseerHS131 - Storage Config Persistence Dry-Run Scope

Status: accepted shaping artifact
Date: 2026-05-31
Role: Overseer

## Request Answered

Human accepted the HS130 recommendations and selected one more dry run before persisted storage config.

Accepted decisions:

- Atlas is file-portable.
- Atlas should avoid hidden/user-device-invasive storage authority.
- Config home pattern:

```text
<Atlas app/root>/config/storage-authority.json
```

- Acknowledged app-local/current-file fallback counts as accepted storage for action posture, but remains visibly distinct as fallback mode.
- Budget is mandatory before real provider-backed acquisition or EVEidence writes.
- Next packet should be dry-run only, not a persisted config write.

## Purpose

Prove the shape of the future storage authority config write before Atlas writes any config file.

The dry run should answer:

```text
If Atlas were allowed to persist storage authority, exactly what would it write, where would it write it, why is that path allowed, and how would the result read back?
```

## Accepted Dry-Run Target

Future config path pattern:

```text
<Atlas app/root>/config/storage-authority.json
```

This is accepted as the dry-run target pattern.

Do not write the file in HS131.

## Dry-Run Config Shape

The simulated config payload should include enough for later persistence:

- schema/version
- selected storage mode
- selected storage root or DB path basis
- fallback acknowledgement status
- fallback acknowledgement provenance
- budget bytes
- path basis
- validation status
- created/updated timestamp placeholder or simulated timestamp
- invalidation basis if applicable

It should not include:

- provider credentials
- raw Evidence/EVEidence
- Discovery refs
- Assessment content
- broad runtime state

## States To Prove

The dry run should cover:

- explicit selected storage with budget
- app-local fallback available but unacknowledged
- app-local fallback acknowledged with budget
- acknowledgement invalidated
- no storage selected
- selected storage missing/unavailable
- selected storage invalid/degraded
- budget missing while provider-backed work would be requested

## Required Readout

The dry-run readout should expose:

- dry_run: true
- would_write: true/false
- target_path
- target_path_basis
- path_allowed: true/false
- path_block_reason
- payload
- readback_simulation
- validation_result
- renderer_payload_ignored: true/false where relevant
- enforcement_state: not_implemented_readout_only

## Renderer / Path Safety

Renderer payloads must not be able to:

- choose arbitrary config paths
- choose arbitrary storage roots through dry-run readout
- forge fallback acknowledgement
- forge budget bytes
- probe filesystem paths

Any future real picker/write command must be main-process-owned, explicit, validated, and separately authorized.

## Budget Rule

For real/alpha provider-backed acquisition or EVEidence writes:

```text
budget must be explicit
```

The dry run should show budget missing as a blocking posture for provider-backed writes, while preserving safe local read-only inspection where applicable.

## Recommended Dev Packet

Open:

```text
HS131 storage config persistence dry-run
```

Expected handoff:

```text
workspace/DevHS131-storage-config-persistence-dry-run.md
```

Preferred scope:

- fixture/offline dry run only
- no real config file writes
- no persisted acknowledgement
- no storage enforcement
- no DB move/migration
- no provider calls
- no Evidence/EVEidence writes
- no hydration writes
- prove target path pattern and payload shape
- prove simulated readback
- prove renderer cannot forge path/acknowledgement/budget through readout payload

## Guardrails

- This artifact does not authorize real config writing.
- This artifact does not authorize lockout enforcement.
- This artifact does not authorize DB/storage movement.
- This artifact does not authorize provider calls.
- This artifact does not authorize UI work.
- This artifact does not change Atlas terminology.

## Disposition

Accepted shaping material.

Dev runway may be opened from this scope.
