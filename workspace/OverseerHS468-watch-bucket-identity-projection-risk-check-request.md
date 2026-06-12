# OverseerHS468 - Watch Bucket Identity Projection Risk Check Request

Status: open  
Date: 2026-06-12  
Executor: Engineering / Architecture Review  
Expected artifact: `workspace/EngineeringRiskHS468-watch-bucket-identity-projection.md`

## Purpose

Run one practical assurance pass before Atlas opens a read-only Watch bucket identity projection.

This should identify overlooked risks, missing questions, or source-fit issues that could make the next proof misleading.

Do not fan out into a broad architecture proposal.

## Context

Accepted ADR:

```txt
docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md
```

Current stable direction:

```txt
External I/O gates Discovery pickup/provider movement, not Watch emission.
One Watch may have at most one open emitted run stub.
Bucket identity is Watch-run based, not system based.
Deduplicate the killmail; preserve the fact that multiple Watch intents found it.
```

Current pause/forecast:

```txt
workspace/OverseerHS467-watch-bucket-forecast-and-open-questions.md
```

Likely next seam if accepted later:

```txt
Read-only Watch bucket identity projection
```

Expected future proof shape:

```txt
Given current Watch-run stubs and fixture existing-open states:
- would this Watch emit a bucket candidate?
- would it be suppressed because one is already open?
- is overlapping system scope from another Watch allowed?
- is mismatched watch_run_id/scope/provenance flagged?
- does any of this touch Discovery, Evidence, or providers?
```

## Assurance Questions

Answer practically:

1. Is a read-only Watch bucket identity projection the right next proof, or is there a smaller safer proof first?
2. What assumptions in ADR-0007 or HS467 are most likely to be wrong or underspecified?
3. What current source facts should the next proof inspect or reuse?
4. What should the next proof explicitly avoid so it does not become accidental schema design?
5. What fixture cases are necessary and sufficient?
6. Are there naming risks around `watch_run_id`, bucket candidate, open stub, provenance, or held state?
7. Could External I/O handling be misrepresented in a read-only projection?
8. Could overlapping Watch scopes be misrepresented without a real provenance table?
9. What acceptance criteria would make the proof trustworthy?
10. What should remain deferred?

## Boundary

Do not:

- implement code
- propose durable schema in detail
- create a Dev runway
- call providers
- change files outside the advisory artifact
- change source terms or protected-word JSON
- redesign Discovery, Evidence, Observation, or UI

Keep recommendations practical and bounded to the next read-only proof.

## Expected Output

Return:

1. Executive recommendation.
2. Key assumptions to protect.
3. Overlooked risks or missing questions.
4. Required fixture cases.
5. Acceptance criteria for the next proof.
6. Things to avoid.
7. Whether an ADR amendment is needed.
8. Whether the next seam is ready after this assurance.

