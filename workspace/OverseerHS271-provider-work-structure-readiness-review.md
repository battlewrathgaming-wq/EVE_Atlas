# Overseer HS271 - Provider Work Structure Readiness Review

Status: accepted
Date: 2026-06-05
Reviewed artifact: `workspace/DataEngineering-provider-work-structure-readiness-advisory.md`
Related decision surface: `workspace/OverseerHS270-hydration-real-execution-decision-surface.md`

## Result

Accepted. No blocking issue found.

The provider-work stack is accepted as a control model, not a schema mandate:

```text
Lane = meaning and policy.
Bucket = eligible waiting work.
Dispatcher = paced release.
Execution = current attempt.
Write = durable outcome.
```

## Accepted Findings

- The structure is coherent for Atlas.
- It should not become a broad provider work queue by default.
- Selected-ID Hydration does not need a durable Bucket yet.
- Selected-ID Hydration does not need a Dispatcher before real provider-backed execution if execution remains one explicit operator-selected ID.
- Dispatcher remains parked until background/multi-item/multi-lane/retry/lease behavior is opened.
- Durable Bucket persistence remains parked until restart, retry, fairness, or background execution need proves it.
- The accepted lane simplification remains:

```text
Discovery outputs possible leads.
Evidence Expansion outputs Evidence/EVEidence.
Hydration outputs readability repair.
Fourth lane stays parked.
```

## Current Placement

Selected-ID Hydration currently sits in:

```text
Hydration lane
-> read-only request posture
-> non-durable pickup contract
-> fixture-only execution revalidation
-> injected fixture provider response validation
-> Hydration readability write proof
```

## Next Seam

The next smallest seam should be:

```text
read-only selected-ID real execution preflight
```

Reason:

The advisory already resolves that durable Bucket and Dispatcher are not needed for the narrow selected-ID path. The remaining uncertainty is whether the exact real execution facts are visible and coherent before any provider call exists.

## Parked

- real selected-ID provider-backed execution
- durable Hydration Bucket
- Dispatcher / worker / lease / retry machinery
- Watch/background Hydration pickup
- broad provider queue
- schema changes
- runtime enforcement activation
- renderer UI behavior
- fourth lane / fast lane

