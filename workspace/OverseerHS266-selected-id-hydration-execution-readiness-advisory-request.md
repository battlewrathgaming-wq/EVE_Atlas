# Overseer HS266 - Selected-ID Hydration Execution Readiness Advisory Request

Status: advisory request
Date: 2026-06-05
Project: AURA Atlas
Requested by: Atlas Overseer
Intended reviewer: Engineering / Data Engineering / Security, as appropriate

## Purpose

Review whether Atlas is ready to shape a later selected-ID provider-backed Hydration execution packet, or whether more proof is needed first.

This is advisory only. Do not implement code.

## Current Accepted Spine

```text
Discovery outputs possible leads.
Evidence Expansion outputs Evidence / EVEidence.
Hydration outputs readability repair.
Fourth lane stays parked.
```

Accepted Hydration ladder:

```text
selected unresolved ID
-> explicit operator act
-> local-first lookup
-> Hydration request posture
-> pickup-readable posture
-> non-durable pickup contract
-> future execution must revalidate
-> write only after the write path succeeds under policy
```

Accepted commands / proofs:

- `metadata.hydration_request_posture.preview`
- `metadata.hydration_pickup_contract.preview`
- earlier fixture-only Hydration write proof: `metadata.hydration_write_fixture_proof`

Accepted boundary:

```text
Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS258-hydration-request-posture-advisory-request.md`
- `workspace/DataEngineeringHS258-hydration-request-posture-advisory.md`
- `workspace/OverseerHS259-hs258-hydration-request-posture-review.md`
- `workspace/OverseerHS262-hydration-request-pickup-shaping-advisory-request.md`
- `workspace/DataEngineeringHS262-hydration-request-pickup-shaping-advisory.md`
- `workspace/OverseerHS263-hs262-hydration-pickup-shaping-review.md`
- `workspace/OverseerHS264-hydration-pickup-eligibility-contract-preview-runway.md`
- `workspace/DevHS264-hydration-pickup-eligibility-contract-preview.md`
- `workspace/OverseerHS265-hs264-hydration-pickup-contract-review.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/hydrationPickupContractService.js`
- `src/main/services/hydrationWriteFixtureProofService.js`, if present
- `src/main/metadata/reportHydrator.js`
- `src/main/db/evidenceRepository.js`
- `src/main/db/schema.sql`

## Questions To Answer

1. Is Atlas ready to shape a selected-ID provider-backed Hydration execution packet?
2. What must execution revalidate from trusted local state before any provider call?
3. What must execution revalidate after provider response and before write?
4. What must short-circuit to local readability if a label became local between pickup and execution?
5. What existing write path should be used or adapted for selected-ID Hydration writes?
6. What counts as successful Hydration output:
   - `entities` write
   - `activity_events` label patch
   - `metadata_runs` row
   - `api_request_logs` row
   - another existing structure
7. What must not be written by selected-ID Hydration execution?
8. What provider/API gate facts must be active before execution may call externally?
9. What storage facts must be active before execution may write locally?
10. Should the first implementation be:
    - read-only execution preflight
    - fixture-only execution proof
    - real provider-backed execution
    - another advisory/design pass
11. What verification would prove the smallest safe next packet?
12. What should remain parked?

## Boundaries

Do not:

- call providers
- run live/API checks
- implement code
- create a Dev runway
- add schema
- add queues, dispatcher, worker, leases, retries, or persistence
- mutate Evidence/EVEidence
- mutate Discovery refs
- mutate Watch, Marked, or Assessment Memory
- create support artifacts
- change renderer UI
- treat request posture or pickup contract as execution authority
- reopen the parked fourth lane

## Expected Output

Create:

```text
workspace/DataEngineeringHS266-selected-id-hydration-execution-readiness-advisory.md
```

Include:

1. Executive recommendation.
2. Whether selected-ID Hydration execution is ready, not ready, or ready only for a smaller proof.
3. Required revalidation steps before provider call.
4. Required revalidation steps before local write.
5. Existing write path assessment.
6. Required output/write rows, if any.
7. Non-goals and parked items.
8. Recommended smallest next packet.
9. Acceptance criteria for that packet.
10. Verification commands / evidence expected.
11. Human or Overseer decisions needed.

