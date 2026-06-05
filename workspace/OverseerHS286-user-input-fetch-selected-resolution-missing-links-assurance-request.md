# Overseer HS286 - User Input To Fetch / Selected Resolution Missing Links Assurance Request

Status: submitted
Date: 2026-06-05
Project: AURA Atlas
Requester: Atlas Overseer
Suggested reviewer: Engineering / Data Engineering / Security, as appropriate

## Purpose

Review the end-to-end Atlas pipeline from deliberate operator input to complete fetch / selected resolution and identify missing links, unsafe assumptions, or unclear handoff surfaces.

This is assurance and next-surface discovery only. Do not implement code.

## Context

Atlas has accepted these current boundaries:

- Discovery outputs possible leads.
- Evidence Expansion outputs Evidence/EVEidence.
- Hydration outputs readability repair.
- The fourth lane remains parked.
- Local readability may happen during report / Observation construction.
- Provider-backed selected-ID readability repair is the explicit operator act `Resolve`.
- HS284 accepted a trusted, non-renderer selected-ID Resolve execution command: `metadata.selected_id_readability_repair.execute`.

The next useful surface is not more implementation by default. It is to verify where the operator-to-provider-to-local-result pipeline is complete, where it is only proven as posture, and where the missing links remain.

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/selected-id-readability-repair.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `workspace/OverseerHS285-hs284-selected-id-readability-repair-execution-review.md`
- `workspace/DevHS284-selected-id-readability-repair-execution.md`
- relevant source under `src/main/services`, `src/main/reports`, `src/main/metadata`, `src/main/queue`, `src/main/workers`, `src/main/db`, and `scripts`

## Task

Trace the current pipeline from user/operator input to local outcome.

Focus on these paths:

1. Operator input to Discovery / fetch intent.
2. Discovery refs to selected Evidence Expansion.
3. Evidence/EVEidence write to raw-ID Observation/report construction.
4. Raw-ID local readability lookup during report construction.
5. Explicit selected-ID `Resolve` to provider-backed Hydration/readability repair.
6. Selected resolution result back into future local report construction.

For each path, identify:

- current source-code truth
- current documentation truth
- what is implemented
- what is posture/readout only
- what is fixture/proof only
- what is missing
- what is unsafe or ambiguous
- what must remain parked

## Questions To Answer

1. What operator input surfaces currently exist for fetch, selection, expansion, report construction, and selected resolution?
2. Where does user intent become durable state, and where is it only transient runtime/input?
3. Where does Atlas currently distinguish focus/hover/navigation from an explicit request?
4. Where does a Discovery lead become eligible for Evidence Expansion, and what missing link remains between selection and execution?
5. Where does a local Evidence/EVEidence write become report/Observation input?
6. Where does local readability lookup already happen during report construction?
7. Where does selected-ID `Resolve` now execute, and what is still missing before renderer/UI use?
8. After `Resolve` writes a label, how does or should that label appear in later local reports?
9. Are any docs implying a complete pipeline where only proof/posture exists?
10. Are any source paths relying on broad or hidden provider movement?
11. Are any terms blurred, especially Discovery, Evidence/EVEidence, Hydration, Observation, Assessment, Watch, fetch, expansion, resolution, or local readability?
12. What is the smallest next rich surface to explore after this assurance, if any?

## Boundaries

Do not:

- implement code
- edit files
- create a Dev runway
- run live/API calls
- add renderer/UI behavior
- add schema
- add Bucket/Dispatcher/worker/lease/retry/persisted queue behavior
- activate runtime enforcement or command blocking
- change support artifacts
- change storage or External I/O behavior
- rename Atlas terms
- treat proof/test scaffolding as product authority
- treat this advisory as adoption

## Expected Output

Create an advisory artifact:

```txt
workspace/EngineeringDataHS286-user-input-fetch-selected-resolution-missing-links.md
```

Return a concise summary with:

1. Executive recommendation.
2. Current implemented pipeline map.
3. Missing links by path.
4. Posture/proof-only areas that must not be mistaken for product completion.
5. Ambiguous or risky terminology.
6. Recommended next rich surface to explore.
7. Smallest safe next Dev packet, if one exists.
8. Items to keep parked.
9. Verification or evidence expected before implementation.
10. Human/Overseer decisions needed.

If no Dev packet is ready, say so clearly.
