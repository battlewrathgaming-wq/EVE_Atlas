# OverseerHS355 - HS354 Discovery Outcome Derivation Review

Status: accepted advisory review
Date: 2026-06-06

Reviewed:

- `workspace/EngineeringAuditHS354-discovery-outcome-derivation-feasibility.md`

## Acceptance

HS354 is accepted as read-only derivation feasibility assurance.

The advisory answers the open audit question:

```text
From existing Atlas rows and current proof outputs, what Discovery task/packet outcome fields can be derived today, and where does the model fail?
```

Accepted answer:

- Atlas can derive useful coarse Discovery outcome posture from existing rows.
- Atlas cannot safely derive product-grade per-packet Discovery outcomes for live system/radius Watch completion semantics today.
- Current rows are suitable for a read-only derivation proof with confidence and missing-basis flags.
- Current rows are not sufficient to make live Watch completion depend on per-packet outcomes.

## Findings Accepted

Strong current basis:

- `fetch_runs` provides run-level summary and provider call counts.
- `discovered_killmail_refs` provides candidate-ref memory and dedupe state.
- `api_request_logs` provides provider request support provenance.
- `data_quality_warnings` provides warning and deferral support context.
- HS347 / HS349 proofs show the intended Watch -> Discovery packet shape without providers or durable refs.

Gap:

- There is no durable packet outcome row for no-ref, deferred, held, capped, failed, or skipped system/radius packets.
- A run-level summary cannot prove every accepted included-system packet reached a declared Discovery outcome.
- `discovered_killmail_refs` can show found refs, but cannot represent no-ref packet completion.

## Vocabulary Tightening

Accept HS354's wording correction:

```text
acquisition_capped
```

Use `acquisition_capped` for Discovery outcome shaping instead of generic `capped`.

Reason:

The generic word `capped` can blur Discovery acquisition limits with ESI Evidence Expansion caps. `acquisition_capped` means Discovery moved and returned a bounded/limited acquisition slice. It is complete-but-limited, not failure.

## Discovery Ref Memory Decision

Accepted:

`discovered_killmail_refs` should remain candidate-ref memory.

It should not be overloaded into Discovery task sequencer or packet outcome memory. If a future task/packet layer is accepted, candidate refs should link to task/packet output rather than replace task/packet state.

## Next Step

Recommended next non-implementation-to-implementation bridge:

```text
read-only Discovery outcome derivation proof
```

Purpose:

Show what Atlas can derive today as a confidence-marked completion stub/readout from existing rows, and expose missing-basis flags for what cannot be proven.

The proof should be read-only, non-authorizing, and should not update Watch posture.

Likely useful missing-basis flags:

- `packet_outcome_not_proven`
- `no_ref_not_represented`
- `provider_deferred_not_normalized`
- `held_by_external_io_posture_only`
- `cap_basis_summary_only`

## Boundaries Preserved

This review does not authorize durable `discovery_task` / `discovery_task_packet` schema, live Watch execution behavior, provider calls, runtime dispatcher changes, Watch schedule mutation from derived outcomes, Manual path adoption, Evidence/EVEidence write changes, Hydration changes, Observation work, UI work, External I/O enforcement, or command blocking.

