# Overseer HS274 - Selected-ID Real Hydration Execution Gate Advisory Request

Status: advisory request
Date: 2026-06-05
Project: AURA Atlas
Requested by: Atlas Overseer
Intended reviewer: Engineering / Security / Data Engineering, as appropriate

## Purpose

Review whether Atlas is ready to open a real provider-backed selected-ID Hydration execution packet, or whether another bounded proof is needed first.

This is advisory only. Do not implement code.

## Current Accepted Spine

```txt
Discovery outputs possible leads.
Evidence Expansion outputs Evidence/EVEidence.
Hydration outputs readability repair.
Fourth lane stays parked.
```

Accepted Hydration path:

```txt
Evidence/EVEidence
-> raw-ID Observation
-> selective Hydration for readability
-> Assessment
```

Accepted selected-ID ladder:

```txt
selected unresolved ID
-> explicit operator act
-> local-first lookup
-> Hydration request posture
-> pickup-readable posture
-> non-durable pickup contract
-> real execution preflight
-> future execution must revalidate
-> provider contact only if explicit and gates pass
-> write only after provider response and write-path policy pass
```

Accepted boundary:

```txt
Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

## Recent Accepted Proofs

- `metadata.hydration_request_posture.preview`
- `metadata.hydration_pickup_contract.preview`
- `metadata.hydration_selected_id_execution_fixture_proof`
- `metadata.hydration_selected_id_real_execution_preflight.preview`

HS272/HS273 accepted the real execution preflight only. It is read-only and renderer-eligible, but it does not authorize provider calls, Hydration writes, Bucket persistence, Dispatcher work, runtime enforcement, or UI behavior.

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS270-hydration-real-execution-decision-surface.md`
- `workspace/DataEngineering-provider-work-structure-readiness-advisory.md`
- `workspace/OverseerHS271-provider-work-structure-readiness-review.md`
- `workspace/OverseerHS272-selected-id-real-execution-preflight-runway.md`
- `workspace/DevHS272-selected-id-real-execution-preflight.md`
- `workspace/OverseerHS273-hs272-selected-id-real-execution-preflight-review.md`
- `workspace/OverseerHS266-selected-id-hydration-execution-readiness-advisory-request.md`
- `workspace/DataEngineeringHS266-selected-id-hydration-execution-readiness-advisory.md`
- `workspace/OverseerHS267-hs266-hydration-execution-readiness-review.md`
- `workspace/OverseerHS268-selected-id-hydration-execution-fixture-proof-runway.md`
- `workspace/DevHS268-selected-id-hydration-execution-fixture-proof.md`
- `workspace/OverseerHS269-hs268-hydration-execution-fixture-proof-review.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/hydrationPickupContractService.js`
- `src/main/services/hydrationSelectedIdExecutionFixtureProofService.js`
- `src/main/services/hydrationSelectedIdRealExecutionPreflightService.js`
- `src/main/services/liveGateService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/metadata/reportHydrator.js`
- `src/main/db/evidenceRepository.js`
- `src/main/db/schema.sql`

## Questions To Answer

1. Is real provider-backed selected-ID Hydration execution ready to open now?
2. If yes, what is the smallest safe execution packet?
3. If no, what proof or advisory is still missing?
4. What must be revalidated from trusted local state immediately before provider contact?
5. What must short-circuit if a local label appears between request/pickup/preflight and execution?
6. What provider/live gate facts must pass before contact?
7. What External I/O state must pass before contact?
8. What storage/write posture must pass before local Hydration writes?
9. What command-authority or confirmation requirement is needed before live provider contact?
10. What provider response validation is required before writing readability repair?
11. What exact rows may real selected-ID Hydration write?
12. What rows must it never write or mutate?
13. Should first real execution be non-renderer only, renderer-triggerable with confirmation, or still parked?
14. Does real execution need Bucket/Dispatcher machinery now, or can it remain a direct explicit selected-ID act?
15. What verification would prove the smallest safe next packet without broad live testing?
16. What live/API evidence, if any, would be needed later before product acceptance?
17. What should remain parked?

## Boundaries

Do not:

- implement code
- create a Dev runway
- call providers
- run live/API checks
- write Hydration output
- write `metadata_runs`
- write `api_request_logs`
- upsert entities
- patch `activity_events`
- mutate Evidence/EVEidence
- mutate Discovery refs
- mutate Watch, Marked, or Assessment Memory
- add schema
- add Bucket persistence
- add Dispatcher, worker, lease, retry, queue, or background Hydration machinery
- activate runtime enforcement or command blocking
- create support artifacts
- change renderer UI
- treat request posture, pickup contract, or preflight as execution authority
- reopen the parked fourth lane

## Expected Output

Create:

```txt
workspace/EngineeringSecurityHS274-selected-id-real-hydration-execution-gate-advisory.md
```

Include:

1. Executive recommendation.
2. Ready / not ready / ready only for smaller proof.
3. Smallest safe next packet, if any.
4. Required trusted-state revalidation before provider contact.
5. Required local short-circuit behavior.
6. Provider/live/External I/O/storage/command-authority gate requirements.
7. Provider response validation requirements.
8. Allowed write rows and forbidden mutations.
9. Renderer eligibility recommendation.
10. Whether Bucket/Dispatcher machinery is needed now.
11. Verification commands / evidence expected.
12. Live/API evidence needed later, if any.
13. Risks and tradeoffs.
14. Parked items.
15. Human or Overseer decisions needed.
