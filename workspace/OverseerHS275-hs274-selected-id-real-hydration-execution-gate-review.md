# Overseer HS275 - HS274 Selected-ID Real Hydration Execution Gate Review

Status: accepted
Date: 2026-06-05
Project: AURA Atlas
Reviewed by: Atlas Overseer

## Reviewed

- Request: `workspace/OverseerHS274-selected-id-real-hydration-execution-gate-advisory-request.md`
- Advisory artifact: `workspace/EngineeringSecurityHS274-selected-id-real-hydration-execution-gate-advisory.md`

## Result

HS274 is accepted. No blocking issue found in the advisory.

Accepted classification:

```txt
ready only for a smaller real-execution proof
```

Atlas is not ready for full product live behavior, renderer-triggered real Hydration, background Hydration, Bucket/Dispatcher machinery, broad live testing, runtime enforcement, command blocking, schema work, or UI behavior.

## Accepted Recommendation

The next implementation step, if Human/Overseer explicitly accepts provider contact, should be the smallest trusted real provider-backed selected-ID Hydration execution proof.

Recommended packet shape:

```txt
explicit selected unresolved ID
-> rebuild local-first request posture
-> rebuild non-durable pickup contract
-> re-read External I/O
-> enter live provider gate with real attempt recording
-> create selected-ID metadata run
-> call ESI /universe/names for exactly one ID
-> validate provider response
-> write Hydration readability repair transaction
-> finalize metadata run
-> verify allowed rows only
```

Recommended posture:

- trusted/non-renderer only
- one selected ID per invocation
- supported ID types only: `character`, `corporation`, `alliance`
- no Bucket
- no Dispatcher
- no schema
- no UI
- no background worker
- no generalized `metadata.hydration` reuse without selected-ID revalidation

## Accepted Gate Requirements

Before provider contact, future execution must rebuild trusted local facts and prove:

- explicit Human/Overseer-accepted provider-contact act
- exactly one selected ID
- positive safe integer ID
- supported selected-ID type
- Atlas local basis exists
- local label is still absent
- request posture rebuilds as `provider_needed`
- pickup contract rebuilds as non-durable candidate only
- External I/O persisted state is on / released to normal gates
- live/provider gate allows the attempt and records cadence/attempt state
- storage/write posture allows Hydration readability writes
- command authority / confirmation is satisfied in trusted context
- no duplicate active task/concurrency conflict for the narrow proof

Execution must short-circuit before provider contact if the label became local after request/pickup/preflight.

## Accepted Write Boundary

Allowed on successful real selected-ID Hydration:

- one `metadata_runs` row for selected-ID real Hydration
- one sanitized `api_request_logs` row only if provider contact occurs
- selected `entities` row for `character`, `corporation`, or `alliance`
- matching `activity_events` readability label columns only

Forbidden:

- Evidence/EVEidence mutation
- raw ESI killmail payload mutation
- numeric `activity_events` fact mutation
- Discovery ref mutation
- `fetch_runs` mutation
- Watch, Marked, or Assessment Memory mutation
- storage or External I/O config mutation
- Bucket/request/pickup persistence
- Dispatcher, worker, lease, retry, queue dispatch, or background Hydration state
- schema
- support artifacts
- renderer UI state

## Parked Items

Remain parked:

- renderer-triggered real selected-ID Hydration
- full product live Hydration acceptance
- broad live testing
- Bucket / Dispatcher / worker / lease / retry / queue dispatch
- background Hydration
- Watch/background Hydration pickup
- report-wide or multi-ID Hydration
- schema changes
- runtime enforcement activation
- command blocking
- support artifacts
- UI behavior
- fourth lane / fast lane

## Decision Point

No Dev runway is opened by this review.

Human/Overseer decision needed:

```txt
Do we accept crossing the provider-contact boundary for a trusted, non-renderer, one-ID selected Hydration real execution proof?
```

If yes, Overseer may shape a narrow Dev runway for the first real selected-ID Hydration execution proof.

If no, Atlas should remain on read-only/preflight/proof seams or shift to another storage/runtime seam.

## Verification

Reviewed advisory artifact from disk.

No provider calls, live/API checks, code changes, Hydration writes, schema changes, Bucket/Dispatcher work, runtime enforcement, or UI work were performed.
