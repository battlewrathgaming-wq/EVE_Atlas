# OverseerHS474 - Watch Bucket Next Seam Assurance Request

Status: open  
Date: 2026-06-12  
Executor: Architecture / Data Engineering Review  
Expected artifact: `workspace/ArchitectureDataHS474-watch-bucket-next-seam-assurance.md`

## Purpose

Run one short practical assurance pass before Atlas chooses the next Watch bucket seam.

The choice is between:

1. disposable Watch bucket persistence fixture
2. Discovery pickup consumer hold contract

The goal is not to redesign Watch, Discovery, or bucket schema. The goal is to identify which proof gives Atlas the most useful next confidence with the least risk of building on the wrong assumption.

## Current Accepted Basis

Accepted ADR:

```txt
docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md
```

Accepted reviews:

```txt
workspace/OverseerHS471-hs470-watch-bucket-identity-projection-review.md
workspace/OverseerHS473-hs472-watch-bucket-pickup-posture-bridge-review.md
```

Accepted Dev handoffs:

```txt
workspace/DevHS470-watch-bucket-identity-projection.md
workspace/DevHS472-watch-bucket-pickup-posture-bridge.md
```

What is already proven:

- Watch bucket identity can be projected read-only from fixture Watch-run stubs.
- One-open-stub, overlap, and integrity-conflict posture can be represented.
- Projected candidates can become future pickup eligible or held by External I/O without starting Discovery.
- External I/O hold is provider movement posture, not Watch emission failure.

## Assurance Questions

Answer practically:

1. Which next proof is safer and more useful: disposable persistence fixture or Discovery pickup consumer hold contract?
2. What information would persistence-first prove that pickup-consumption-first cannot?
3. What information would pickup-consumption-first prove that persistence-first cannot?
4. What assumptions would each option risk hardening too early?
5. What source/schema facts should be checked before any disposable write fixture?
6. Is there an existing table or helper that must explicitly not be reused as the bucket?
7. What is the smallest fixture set needed for the recommended next proof?
8. What acceptance criteria would stop the proof from becoming accidental runtime behavior?
9. Is any ADR-0007 clarification needed before the next proof?
10. What should remain deferred?

## Boundary

Do not:

- implement code
- create or update schema
- create a Dev runway
- call providers
- write candidate refs
- write Evidence/EVEidence
- mutate Watch rows or cadence
- start Discovery pickup
- design queue/lease/dispatcher runtime
- redesign Watch, Discovery, Evidence, Observation, Hydration, or UI
- change source terms or protected-word JSON

Keep this to a concise recommendation with practical evidence.

## Expected Output

Return:

1. Executive recommendation.
2. Persistence-first assessment.
3. Pickup-consumption-first assessment.
4. Source/schema facts to inspect before next proof.
5. Recommended next fixture cases.
6. Acceptance criteria for the recommended proof.
7. Risks / things to avoid.
8. ADR or documentation updates needed, if any.
9. Clear yes/no on whether the next Dev seam is ready.

