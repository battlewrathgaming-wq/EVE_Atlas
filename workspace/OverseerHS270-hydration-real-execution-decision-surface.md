# Overseer HS270 - Hydration Real Execution Decision Surface

Status: decision surface
Date: 2026-06-05
Project: AURA Atlas

## Purpose

Record the resting decision surface after HS268 / HS269 before Atlas opens any real provider-backed selected-ID Hydration execution.

This is not a Dev runway.

## What Is Now Proven

Atlas has proven the selected-ID Hydration chain up to fixture-only execution:

```text
explicit operator act
-> local-first request posture
-> non-durable pickup contract
-> fixture-only execution revalidation
-> fixture provider response validation
-> Hydration readability write transaction
```

Accepted commands:

- `metadata.hydration_request_posture.preview`
- `metadata.hydration_pickup_contract.preview`
- `metadata.hydration_selected_id_execution_fixture_proof`

Accepted write proof:

- `metadata_runs`
- optional sanitized `api_request_logs`
- selected `entities` row
- matching `activity_events` readability label columns

Accepted non-writes:

- no Evidence/EVEidence mutation
- no Discovery mutation
- no Watch / Marked / Assessment Memory mutation
- no queue / dispatcher / worker / lease / retry state
- no schema change
- no runtime enforcement activation
- no renderer UI work
- fourth lane stays parked

## What Is Not Proven Yet

Atlas has not proven real provider-backed selected-ID Hydration execution.

Unproven items:

- real ESI name lookup call under selected-ID execution control
- live/provider gate attempt recording for this command shape
- External I/O + live gate + storage write gate composition at execution time
- provider Retry-After / capacity behavior for selected-ID Hydration
- real provider response sanitization beyond fixture response validation
- exact product command name for real operator execution
- renderer/operator trigger path
- user-facing copy or UI behavior

## Decision Point

Opening real provider-backed selected-ID Hydration execution is now possible to discuss, but it should not happen automatically.

The next seam should be chosen deliberately because this is the first step from fixture proof toward real external contact.

## Candidate Next Seams

### Option 1 - Real Execution Gate Advisory

Ask Engineering / Security to review whether real selected-ID Hydration execution can safely use existing `metadata.hydration` / `HttpClient` / `EsiClient` paths, or whether another pure gate/preflight proof is needed.

Best when:

- we want assurance before any live-capable code exists
- we want to avoid turning fixture proof into accidental product behavior

### Option 2 - Read-Only Real Execution Preflight

Add a read-only command that composes the exact current real execution facts for selected-ID Hydration:

```text
local-first posture
pickup contract
External I/O
live/provider gate
storage write posture
selected-ID supported type
expected write path
```

No provider calls or writes.

Best when:

- we want one more local proof before live-capable execution
- we need operator/debug visibility into why execution would be held or blocked

### Option 3 - Real Provider-Backed Execution Packet

Implement real selected-ID provider-backed Hydration execution.

This should be opened only if Human / Overseer accepts the external-contact boundary and Dev receives tight stops.

Best when:

- the project is ready to move from fixture proof to live-capable behavior
- provider contact, attempt logging, and storage write gates are explicitly accepted

## Recommended Next Move

Recommended: Option 1 or Option 2, not Option 3.

Reason:

HS268 proved the write lifecycle. The remaining uncertainty is not whether Atlas can write readability repair. The remaining uncertainty is the real external-contact boundary and gate composition for this selected-ID command shape.

The safest next move is either:

```text
Engineering/Security advisory on real execution gate fit
```

or:

```text
read-only selected-ID real execution preflight
```

## Parked

- real provider-backed execution until explicitly chosen
- renderer UI
- durable pickup/request persistence
- background Hydration
- queue/dispatcher/worker/lease/retry machinery
- Watch/background Hydration pickup
- schema changes
- runtime enforcement activation
- fourth lane

