# OverseerHS352 - HS351 Discovery Boundary Audit Review

Status: accepted advisory review
Date: 2026-06-06

Reviewed:

- `workspace/EngineeringAuditHS351-discovery-boundary-task-handling-trace.md`

## Acceptance

HS351 is accepted as read-only assurance for the current Discovery boundary consolidation.

The audit supports the emerging Atlas boundary model:

```text
Intent source
-> accepted intent handoff
-> Discovery work bucket / task handling
-> provider-facing zKill movement
-> candidate refs / no-ref / defer / cap / failure outcomes
-> completion stub back to source intent
```

Accepted clarification:

- Watch is a scheduler and scope-authority source.
- Discovery is the acquisition utility and workflow-memory domain.
- Watch completion is a Discovery-task outcome, not Evidence/EVEidence, Hydration, Observation, or Assessment completion.
- Invalid scope belongs before Discovery acceptance.
- For system/radius Watch, the acquisition task is complete only when every emitted Discovery packet for the accepted scope/window has reached a declared Discovery outcome.
- ESI Evidence Expansion and Hydration may continue separately after Watch acquisition completion.

## Findings Accepted

Aligned:

- Atlas docs and HS347/HS349 proof surfaces already express the desired direction.
- Manual Discovery is currently the cleanest implemented Discovery path.
- Manual Expansion is currently the cleanest implemented ESI Evidence Expansion path.
- Existing proof surfaces keep Watch from doing Discovery and keep candidate refs out of Evidence/EVEidence.

Mixed:

- Current live-capable Watch collectors still combine zKill Discovery, Discovery ref persistence, ESI Evidence Expansion, Evidence writes, warnings/logs, fetch-run lifecycle, and Watch run posture.
- Current Watch "done" is collector/task completion, not a normalized Discovery-task completion stub.
- Current system/radius runtime cannot prove one declared outcome per accepted included-system packet/window.

Partially derivable:

- Coarse run/ref outcomes can be inferred from `fetch_runs`, `api_request_logs`, `data_quality_warnings`, and `discovered_killmail_refs`.
- Per-packet system/radius Discovery outcomes are not reliably derivable today.

Likely future need:

- A future `discovery_task` / `discovery_task_packet` layer or equivalent read model is likely needed before product live Watch completion semantics depend on packet outcomes.
- This is not authorized now.

## Accepted Outcome Words For Shaping

First Discovery outcome vocabulary for shaping:

- `complete_refs_found`
- `complete_no_refs`
- `partial_deferred`
- `provider_deferred`
- `held_by_external_io`
- `capped`
- `failed_retryable`
- `failed_terminal`

Excluded from Discovery completion vocabulary:

- `invalid_scope`

Reason:

`invalid_scope` should stop before Discovery acceptance at the Intent / Scope Authority boundary.

## Next Step

Next non-implementation activity:

```text
Discovery outcome-model decision pass
```

This should decide whether the outcome words apply to Discovery task, Discovery packet, or both, and whether the next proof should be read-only derivation from current rows or a fixture-only task/packet model.

No Dev runway is opened by this review.

## Boundaries Preserved

No code edits, schema changes, provider calls, live Watch execution, Discovery writes, Evidence/EVEidence writes, Hydration writes, Observation work, runtime enforcement, support artifacts, UI work, or Dev runway are authorized by this review.

