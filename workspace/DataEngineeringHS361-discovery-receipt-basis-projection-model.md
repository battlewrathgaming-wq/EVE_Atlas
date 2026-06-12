# DataEngineeringHS361 - Discovery Receipt Basis Projection Model

Status: advisory
Date: 2026-06-07
Role: Data Engineering / Data Analyst
Milestone: Atlas Storage And Runtime Hardening

## 1. Executive Recommendation

Adopt a Discovery-owned canonical receipt basis, then allow callers to request smaller projections from that basis.

The receipt basis should describe bounded acquisition facts: source intent, accepted scope/window, packet attempts, packet outcomes, candidate refs, caps, deferrals, failures, missing basis, and boundary flags. Projection should be presentation and performance shaping only. Projection must not transfer meaning ownership to Watch, Manual, Observation, or any future caller.

For now, keep this non-durable and fixture/proof-oriented. Current Atlas can derive coarse Discovery posture and can emit pre-provider pickup packets, but product-grade per-packet receipt completion is not proven from current durable rows. A durable `discovery_task` / `discovery_task_packet` model is likely later, not needed for the next proof.

Important refinement: keep `held_by_external_io` as request-level pre-acquisition hold posture for now, not as a packet outcome. If External I/O is off, Discovery should rest before acquisition rather than spend work manufacturing packet outcomes for attempts it did not make.

## 2. Recommended Canonical Receipt Basis Fields

Recommended canonical basis groups:

- Receipt envelope: `receipt_id`, `receipt_model_version`, `generated_at`, `source_intent_kind`, `source_intent_id`, `source_run_id`, `source_watch_id`, `projection_requested`, `projection_emitted`.
- Request and scope: `scope_key`, `scope_basis`, `requested_window`, `provider_path`, `accepted_packet_count`, `accepted_scope_snapshot`, `cap_basis`, `request_posture`.
- Pre-acquisition hold posture: `hold_reason`, `held_before_acquisition`, `packet_outcomes_emitted`, `attempted_packet_count`, `completed_packet_count`.
- Packet basis: `packet_id`, `packet_index`, `packet_count`, `packet_scope_key`, target anchor such as `candidate_system_id`, `provider`, `provider_target`, `lookback_window`, `cap_summary`, `attempted_at`, `completed_at`, `outcome`, `outcome_basis`, `refs_found_count`, `candidate_ref_handles`, `deferred_reason`, `failure_class`, `retry_after_or_next_eligible_at`, `missing_basis_flags`.
- Rollup: `packet_outcome_counts`, `ref_count`, bounded `candidate_ref_handles`, `deferred_count`, `retryable_count`, `failed_terminal_count`, `missing_basis_flags`, `confidence`, `boundary_flags`.
- Boundary/provenance: candidate refs are possible leads only, ESI context is not Discovery completion, Evidence/EVEidence writes are downstream, Hydration and Observation are not receipt completion.

If the request is held by External I/O before acquisition, the basis may include the accepted scope or packet plan only if that plan already exists cheaply. It should still report `attempted_packet_count: 0`, `completed_packet_count: 0`, empty packet outcome counts, and `packet_outcomes_emitted: false`.

## 3. Packet / Task Vocabulary Recommendation

Use packet outcomes for attempted acquisition packets:

- `complete_refs_found`
- `complete_no_refs`
- `partial_deferred`
- `provider_deferred`
- `acquisition_capped`
- `failed_retryable`
- `failed_terminal`

Do not use `held_by_external_io` as a packet outcome in the next proof. Treat it as request-level pre-acquisition posture.

Avoid inventing a second task-outcome truth vocabulary now. A task/top-level receipt should roll up packet outcomes through fields such as `packet_outcome_counts`, `accepted_packet_count`, `attempted_packet_count`, `completed_packet_count`, `ref_count`, `missing_basis_flags`, and `request_posture`. If a readable top-level label is later needed, it should be a receipt posture derived from the counts, not a replacement for packet facts.

`invalid_scope` remains pre-Discovery and should stop before Discovery acceptance.

## 4. Projection Profile Recommendation

Caller-selectable projections are sound if they are generated from the same canonical basis:

- `minimal`: receipt identity, source identity, request posture, packet counts, outcome counts, ref count, missing basis, and boundary flags.
- `watch_summary`: Watch-safe rollup with Watch/source id, scope key, requested window, accepted/attempted/completed counts, outcome counts, cap/defer/failure indicators, ref count, recovery candidate counts, and missing basis flags.
- `operator_detail`: packet list, packet targets, outcomes, refs found count, bounded ref handles, cap/defer/failure basis, scope/cap details, and factual warnings.
- `debug_basis`: full factual basis, provider/log summaries, source action posture, mutation posture, omitted-field notes, and bounded samples.

Projection names are acceptable as temporary engineering terms. They should not become product-facing language without Overseer/Human review.

## 5. Projection Safety Rules

Projection may omit volume, not safety. These fields or equivalents should remain visible whenever relevant:

- request posture and hold reason, especially External I/O hold;
- accepted/attempted/completed packet denominators;
- packet outcome counts when packet details are omitted;
- missing basis flags and confidence;
- cap basis when capped or bounded;
- provider defer/failure class and retryability uncertainty;
- source/scope basis, especially stored accepted included systems for system/radius Watch;
- candidate-ref boundary: refs are possible leads, not Evidence/EVEidence;
- ESI context boundary: ESI expansion is not Discovery completion;
- Hydration/Observation/Assessment boundary flags when any adjacent context appears;
- omitted-field note for `minimal` and `watch_summary` projections.

No projection should imply full coverage when the receipt is capped, partial, deferred, failed, held, or missing no-ref packet basis.

## 6. Durability / Storage Recommendation

Do not add schema for HS361's next likely proof.

Current durable rows already cover useful adjacent facts:

- `fetch_runs` for coarse run posture;
- `discovered_killmail_refs` for candidate-ref memory;
- `api_request_logs` and `data_quality_warnings` for provider/error basis;
- `killmails` and `activity_events` for downstream Evidence/EVEidence;
- Watch rows for source intent and schedule posture.

But those rows do not prove product-grade per-packet Discovery completion. `discovered_killmail_refs` should remain candidate-ref memory, not packet memory.

Later durable receipt storage becomes justified when Atlas needs restart recovery for in-flight Discovery packets, Watch schedule advancement from receipt facts, retry/defer packet handling, durable no-ref packet audit, or stable linking from candidate refs back to the packet that produced them.

If persistence is later needed, store minimal factual identifiers, counts, timestamps, outcome words, scope/window/cap basis, missing flags, and ref handles. Do not store projection variants as separate truth.

## 7. Performance / Write-Load Recommendation

Prefer one canonical basis produced in memory, with projections computed from it. Avoid writing large receipt bodies, duplicated projections, full provider payloads, or unbounded candidate arrays.

Use counts, IDs, hashes, scope keys, timestamps, bounded samples, and warning summaries. Keep detailed debug projection bounded. Let `discovered_killmail_refs` continue to hold candidate-ref dedupe/status memory rather than duplicating that lifecycle into every receipt.

This keeps the next proof light and avoids prematurely turning Discovery receipts into another high-write operational log.

## 8. External I/O Hold Recommendation

Treat External I/O off as a request-level hold before acquisition.

Recommended held return shape:

- source intent and scope basis;
- requested window/caps/provider path;
- `request_posture: held_by_external_io`;
- `hold_reason`;
- `held_before_acquisition: true`;
- `attempted_packet_count: 0`;
- `completed_packet_count: 0`;
- `packet_outcome_counts: {}`;
- `packet_outcomes_emitted: false`;
- boundary and missing-basis flags.

This preserves the accepted "rest, do not flood" posture. It also avoids pretending that packets reached Discovery outcomes when Atlas deliberately did not attempt provider acquisition.

## 9. Discovery Success / Recovery Model

Discovery success should mean the acquisition utility accurately reports what happened within the accepted bounds. It should not mean that a caller is satisfied or that Evidence exists.

Interpretation:

- `complete_refs_found`: provider acquisition found candidate refs for that packet/window.
- `complete_no_refs`: provider acquisition was attempted and returned no refs for that packet/window; it is not a global no-activity claim.
- `acquisition_capped`: Discovery reached a declared cap and must disclose limited coverage.
- `partial_deferred` / `provider_deferred`: some work did not complete and should be recovery/task-handling input.
- `failed_retryable`: recovery may try later under policy.
- `failed_terminal`: the packet reached a terminal acquisition failure under the current basis.

Completeness pressure belongs in recovery and task handling. A later Watch cadence or recovery policy may re-emit the same accepted scope/window, but the receipt should not overstate one pass as perfect coverage.

## 10. Candidate Ref / Evidence Boundary Notes

Discovery receipt candidate refs are possible leads and provenance handles. They are not Evidence/EVEidence.

ESI Evidence Expansion begins after selected `killmail_id` / hash refs are expanded through ESI. Evidence/EVEidence begins when expanded ESI killmail rows are written to `killmails` and related derived events. Receipt success should not be updated or upgraded because ESI later succeeds.

The receipt may include `candidate_ref_handles` or a `candidate_ref_write_summary`, but candidate-ref lifecycle remains owned by `discovered_killmail_refs` and expansion selection. Fixture proof should keep candidate refs as fixture/plain data and should not mutate corpus rows.

## 11. Schema Avoidance Or Schema Need Assessment

Schema avoidance is appropriate now.

The next useful proof can consume fixture/pre-provider pickup packets and fixture provider-return outcomes, then emit a non-durable canonical receipt basis plus selected projection. No current HS361 requirement forces durable tables.

Durable schema appears necessary later if Atlas needs any of the following as product behavior:

- restart recovery for in-flight Discovery packets;
- Watch schedule advancement based on per-packet receipt completion;
- retry/defer packet policy;
- durable no-ref packet audit;
- durable packet-to-candidate-ref linkage;
- historical query of "what this accepted scope/window found" independent of Evidence.

Until one of those is opened by Overseer, durable task/packet schema should remain parked.

## 12. Smallest Next Proof Recommendation

If Overseer opens a future Dev packet, the smallest useful seam is:

```txt
Discovery receipt projection fixture proof
```

Suggested proof shape:

- input fixture Discovery pickup packets;
- inject fixture provider-return outcomes per packet;
- emit one canonical receipt basis;
- emit one requested projection;
- include actor and system/radius cases;
- include refs found, no refs, provider deferred, acquisition capped, retryable failure, terminal failure, and mixed rollup cases;
- include External I/O held pre-acquisition case with no packet outcomes emitted;
- prove projections preserve mandatory safety fields;
- prove no provider calls, DB writes, schema, Watch mutation, Evidence/EVEidence, Hydration, Observation, UI, dispatcher, or enforcement behavior.

This proof would settle shape and vocabulary before Atlas decides whether runtime or durable storage should adopt it.

## 13. Risks And Tradeoffs

Main risks:

- canonical basis becomes too large and starts behaving like support artifact storage;
- projections hide safety fields and let callers over-claim;
- Watch-specific language leaks into Discovery-owned receipts;
- durable schema freezes the wrong lifecycle too early;
- External I/O hold loses packet-level debugging detail because packets are not attempted;
- "success" gets misread as full coverage or Evidence creation;
- candidate refs get overloaded as task/packet completion memory.

The recommended staged model accepts a small amount of repetition in fixture returns to avoid premature durable architecture.

## 14. Human / Overseer Decisions Needed

Overseer should decide:

- whether to accept `held_by_external_io` as request-level only for the next proof;
- whether the packet outcome vocabulary above is sufficient without task-level outcome words;
- whether the projection profile names are acceptable as temporary engineering terms;
- the minimum `watch_summary` fields Watch needs before future schedule/retry policy can inspect receipts;
- whether a future top-level `request_posture` / `receipt_posture` field is useful or whether counts and flags are enough;
- when durable receipt schema becomes necessary.

No Dev runway is created by this advisory.

## Verification / Evidence Used

Reviewed:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS358-discovery-receipt-model-shaping-note.md`
- `workspace/EngineeringTraceHS359-discovery-receipt-task-packet-source-trace.md`
- `workspace/OverseerHS360-hs359-discovery-receipt-source-trace-review.md`
- `workspace/OverseerHS357-hs356-discovery-outcome-derivation-review.md`
- `workspace/DevHS356-discovery-outcome-derivation-proof.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/current-state/current-evidence-pipeline.md`
- `src/main/services/discoveryOutcomeDerivationService.js`
- `src/main/services/watchDiscoveryPickupPacketProofService.js`
- `src/main/services/discoveryPickupConsumerFixtureService.js`
- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`
- attached HS361 request text

No live/API/provider calls were made. No code, schema, corpus rows, Watch state, provider state, UI, protected terms, or durable project docs were changed.
