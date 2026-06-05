# Overseer HS278 - Selected-ID Product Hydration Transition Advisory Request

Status: advisory request
Date: 2026-06-05
Project: AURA Atlas
Requested by: Atlas Overseer
Intended reviewer: Engineering / Security / Data Engineering / Product Architecture, as appropriate

## Purpose

Define what must change before selected-ID Hydration can move from HS276 proof/test machinery toward product behavior.

This is advisory only. Do not implement code.

## Context

HS276 proved a trusted, non-renderer, one-ID real selected-ID Hydration execution in a controlled temp store:

```txt
metadata.hydration_selected_id_real_execution_proof
```

HS277 accepted the proof.

ADR-0006 then recorded the guardrail:

```txt
HS276 selected-ID Hydration proof/test machinery is not product flow.
```

The next risk is accidentally reusing proof scaffolding as product authority.

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `docs/adr/ADR-0006-selected-id-hydration-proof-is-not-product-flow.md`
- `workspace/OverseerHS276-selected-id-real-hydration-execution-proof-runway.md`
- `workspace/DevHS276-selected-id-real-hydration-execution-proof.md`
- `workspace/OverseerHS277-hs276-selected-id-real-hydration-execution-proof-review.md`
- `workspace/EngineeringSecurityHS274-selected-id-real-hydration-execution-gate-advisory.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
- `src/main/services/hydrationSelectedIdRealExecutionProofService.js`
- `src/main/services/hydrationSelectedIdRealExecutionPreflightService.js`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/hydrationPickupContractService.js`
- `src/main/services/liveGateService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/db/evidenceRepository.js`
- `src/main/db/schema.sql`

## Accepted Spine

```txt
Discovery outputs possible leads.
Evidence Expansion outputs Evidence/EVEidence.
Hydration outputs readability repair.
Fourth lane stays parked.
```

```txt
Evidence/EVEidence
-> raw-ID Observation
-> selective Hydration for readability
-> Assessment
```

```txt
Request posture is pickup-readable, not pickup.
Pickup is not execution.
Execution is not write until the write path succeeds under policy.
```

## Questions To Answer

1. What parts of HS276 are proof scaffolding and must never become product authority?
2. What product-selected-ID Hydration command shape would be needed later, if any?
3. How should product behavior derive DB/storage authority without trusting `controlledTempAtlasStore`?
4. What local Atlas basis should qualify an unresolved ID for product Hydration?
5. How should product behavior handle local short-circuit before provider contact?
6. What confirmation / command authority is required for operator-triggered provider contact?
7. Should product selected-ID Hydration be non-renderer first, renderer-triggerable later, or still parked?
8. What trusted facts must be rebuilt at execution time?
9. What product run type should replace the proof-only `selected_id_real_hydration_execution_proof` run type?
10. What rows may product Hydration write, and what rows must remain forbidden?
11. How should provider errors, unresolved IDs, category mismatch, retry-after, cooldown, and partial states be represented?
12. Does product selected-ID Hydration need Bucket/Dispatcher machinery now, or can it remain a direct explicit operator act?
13. What verification should exist before any product command is implemented?
14. What should remain parked?

## Boundaries

Do not:

- implement code
- create a Dev runway
- call providers
- run live/API checks
- write Hydration output
- mutate real operator corpus
- add schema
- add Bucket/Dispatcher/worker/lease/retry/background Hydration
- activate runtime enforcement or command blocking
- change renderer UI
- treat HS276 proof flags, fixed ID, seeded local basis, temp store, proof command, verifier rows, or proof run type as product authority
- reopen the parked fourth lane

## Expected Output

Create:

```txt
workspace/EngineeringSecurityHS278-selected-id-product-hydration-transition-advisory.md
```

Include:

1. Executive recommendation.
2. Proof scaffolding that must not become product behavior.
3. Product authority model needed before selected-ID Hydration can be productized.
4. Product command / run type recommendation, if any.
5. DB/storage authority requirements.
6. Local basis requirements.
7. Confirmation / renderer eligibility recommendation.
8. Runtime gate and revalidation requirements.
9. Allowed writes and forbidden mutations.
10. Provider error / unresolved / partial-state handling.
11. Bucket/Dispatcher recommendation.
12. Smallest safe next packet, if any.
13. Verification evidence expected.
14. Parked items.
15. Human or Overseer decisions needed.
