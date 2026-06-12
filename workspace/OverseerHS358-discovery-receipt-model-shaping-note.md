# OverseerHS358 - Discovery Receipt Model Shaping Note

Status: accepted shaping
Date: 2026-06-07
Role: Overseer
Milestone: Atlas Storage And Runtime Hardening

## Purpose

Capture the Discovery-side receipt model before any implementation or schema decision.

This is not a Dev runway.

## Accepted Direction

Discovery should own the receipt language because Watch is only one future caller.

Callers may include:

- Watch / scheduled accepted-scope work
- Manual / operator-driven Discovery
- Live / narrow provider-style lookup
- future Marked, Assessment, or recovery-driven acquisition requests

Discovery should return a rich factual acquisition receipt that downstream systems can inspect without inheriting Watch-specific meaning.

## Core Rule

```txt
Discovery reports facts and limits.
Discovery does not report caller satisfaction.
```

Discovery may say:

- what was asked
- what packets were accepted
- what packets were attempted
- what provider path was used
- what refs were found
- what returned no refs
- what was deferred
- what was capped
- what failed
- what could not be proven
- what basis supports each outcome

Discovery must not say:

- the Watch is satisfied
- the operator has enough
- Evidence/EVEidence exists
- Hydration is complete
- Observation has a story
- Assessment has meaning
- full coverage was achieved when capped, bounded, partial, or unprovable

## Bias

The receipt should over-report basis and under-claim authority.

That means each caller can pick useful fields without forcing Discovery to know caller policy.

Examples:

- Watch can decide cadence, rest, retry, or surface a gap.
- Manual can show an immediate acquisition result.
- Future recovery can select deferred/failed packets.
- Observation can later disclose basis without treating Discovery refs as Evidence.

## Discovery Receipt Candidate Shape

Candidate top-level receipt fields:

- `receipt_id` or equivalent local/non-authorizing identity
- `source_intent_kind`
- `source_intent_id`
- `source_run_id`
- `source_watch_id`, where applicable
- `scope_key`
- `scope_basis`
- `requested_window`
- `accepted_packet_count`
- `attempted_packet_count`
- `completed_packet_count`
- `packet_outcome_counts`
- `ref_count`
- `candidate_ref_handles`
- `provider_path`
- `provider_call_count`
- `deferred_count`
- `retryable_count`
- `failed_terminal_count`
- `cap_basis`
- `missing_basis_flags`
- `confidence`
- `boundary_flags`

Candidate packet fields:

- `packet_id` or equivalent local/non-authorizing identity
- `packet_index`
- `packet_scope_key`
- `candidate_system_id` or target anchor, where applicable
- `provider`
- `provider_target`
- `lookback_window`
- `cap_summary`
- `attempted_at`
- `completed_at`
- `outcome`
- `outcome_basis`
- `refs_found`
- `candidate_ref_handles`
- `deferred_reason`
- `failure_class`
- `retry_after_or_next_eligible_at`, if known
- `missing_basis_flags`

Accepted outcome words remain:

- `complete_refs_found`
- `complete_no_refs`
- `partial_deferred`
- `provider_deferred`
- `held_by_external_io`
- `acquisition_capped`
- `failed_retryable`
- `failed_terminal`

`invalid_scope` remains pre-Discovery and should not be emitted as a Discovery completion outcome.

## Relationship To Existing Tables

Current accepted finding from HS356:

```txt
coarse run/ref posture is derivable
product-grade per-packet Discovery completion is not derivable from current rows
```

Therefore:

- `fetch_runs` can support coarse run posture.
- `discovered_killmail_refs` can support candidate-ref posture.
- `api_request_logs` and `data_quality_warnings` can support partial provider/error basis.
- `discovered_killmail_refs` must remain candidate-ref memory, not Discovery task/packet memory.
- ESI Evidence Expansion context may be visible only as non-Discovery context.

Future proof should decide whether the receipt is:

1. derived/read-only from existing rows where possible
2. a non-durable in-memory return shape from Discovery processing
3. a durable `discovery_task` / `discovery_task_packet` or equivalent model
4. a staged path that starts non-durable and later persists only the minimum completion receipt

## Next Useful Assurance

Before Dev implements new receipt machinery, run an advisory/source-trace pass focused on:

- what current Discovery-capable code can emit as a receipt today
- where current Watch collectors still bypass Discovery ownership
- whether a non-durable receipt shape can be proven before schema
- what minimum fields are required for Watch to know every emitted packet reached an outcome
- what must remain parked until Manual/Live paths are revisited

## Parked

- durable receipt schema
- dispatcher/lease model
- live provider execution
- Watch schedule advancement from receipt
- Manual/Live adoption
- UI receipt display
- Observation interpretation of receipts
