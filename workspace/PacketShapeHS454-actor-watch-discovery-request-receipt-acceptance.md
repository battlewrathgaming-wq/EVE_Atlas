# PacketShapeHS454 - Actor Watch Discovery Request / Receipt Acceptance Pressure

Status: advisory acceptance pressure only
Date: 2026-06-12
Role: Packet Shape / Dispatch Contract Specialist, including External Integration Steward

## 1. Executive Recommendation

Accept with changes.

`actor_watch_discovery_request` and `actor_watch_discovery_receipt` are good near-term packet/receipt candidates for the actor Watch -> Discovery handoff. They are precise enough to preserve the current direct and scheduled actor Watch source facts, and they improve the boundary by nesting the old 22-field compatibility output under `compatibility_summary`.

They should not be accepted as final reusable Discovery doctrine yet. The current model name and some fields are actor-Watch-specific, the receipt still inherits compatibility-era vocabulary in nested substructures, and the request lacks explicit dispatch/packet identity, provider route family, and local-pending-ref policy. None of those gaps block acceptance as a read-only shaping surface, but they should be resolved before durable packet persistence, dispatcher work, or collector retirement uses this shape as authority.

## 2. What The Packet Shape Gets Right

- It names a request and a receipt instead of forcing future work through `collection` or the 22-field compatibility summary.
- It cleanly separates direct and scheduled actor Watch sources through `source`.
- It keeps Watch-owned intent in the request: actor target, lookback window, caps, and Watch/direct basis.
- It keeps Discovery-owned facts in the receipt: candidate counts, pending refs, selection, ESI-backed expansion, Evidence/EVEidence landing counts, provider API count posture, warnings, and outcome.
- It makes scheduled and direct actor Watch share one handoff language without changing runtime behavior.
- It preserves `compatibility_summary` as nested temporary/debug material rather than future doctrine.
- It avoids treating zKill refs as Evidence/EVEidence at the top level.
- It avoids calling ESI killmail expansion Hydration.
- It can let Watch know "the emitted actor Watch work reached the Discovery boundary and returned a factual handling receipt" without inspecting Discovery memory directly.

## 3. Blocking Issues, If Any

No blocking issue for accepting HS452 as an advisory/projection shape.

Blocking before dispatcher or durable packet use:

- The request lacks a stable packet identity or idempotency key.
- The request lacks explicit `provider_route` / `provider_family` to distinguish scoped zKill API, local pending-ref drain, ESI-backed expansion, and future provider route choices.
- The receipt outcome is currently a derived projection over compatibility data, not a durable Discovery outcome authority.
- The receipt does not explicitly separate acquisition outcome from expansion outcome.
- Reuse beyond actor Watch is limited by model name and actor-specific fields.
- `compatibility_summary` still contains fields that should not leak into the contract: `collection_plan`, `expansion_queue`, `expansion_queue_summary`, `zkill_refs_discovered`, and `zkill_discovery_skipped`.

## 4. Non-Blocking Improvements

- Add a future `packet_identity` block when dispatcher design opens.
- Add a future `caller` block separate from `source`; `source` currently does two jobs.
- Add `provider_route` or `acquisition_route` to describe whether Discovery used local pending refs or scoped zKill acquisition.
- Split receipt outcome into `acquisition_outcome`, `expansion_outcome`, and `overall_outcome`.
- Rename provider-specific count fields toward boundary language before they become durable.
- Keep actor Watch model names for now, but do not reuse them for Manual, Live, Marked, or Assessment-originated requests.
- Add explicit `schema_version` or `contract_version` before any durable packet/receipt persistence.

## 5. Field-By-Field Notes For Request

`model`

- Good for this proof.
- Too actor-specific for future shared Discovery packets.
- Parked future shape could use a generic model such as `discovery_request` with `request_kind: actor_watch_discovery`.

`source`

- Useful for distinguishing `direct_actor_watch` and `scheduled_actor_watch`.
- It currently mixes caller origin and dispatch mode.
- Future split should consider `caller_origin` (`watch`, `manual`, `marked`, `assessment`, `live`) and `dispatch_origin` (`direct`, `scheduled`, future `dispatcher`).

`command`

- Good for current actor Watch traceability.
- Should remain caller/Watch-owned context, not Discovery authority.
- Discovery should not infer Watch cadence or completion expectations from this field.

`actor`

- Sufficient for actor Watch dispatch: `entity_type`, `entity_id`, `entity_name`.
- `entity_id` and `entity_type` are dispatch facts; `entity_name` is readability/context only.
- Future generic Discovery requests need a more neutral `target` or `scope` block because Manual/Marked/Assessment requests may not always be actor-only.

`window.lookback_seconds`

- Sufficient for direct and scheduled actor Watch.
- Good because it carries the accepted lookback value rather than Watch cadence.
- Should be validated before Discovery acceptance; `invalid_scope` belongs at Intent / Scope Authority, not as Discovery completion.

`caps.max_refs`

- Good acquisition cap for zKill candidate lead intake.
- Should stay separate from expansion cap.
- Future dispatcher acceptance should prove this cap maps to zKill scoped API request size and does not become broad history or stream ingestion.

`caps.max_expansions`

- Good ESI-backed expansion cap.
- Should remain evidence-expansion cap, not Hydration cap.
- Future naming could be `max_esi_expansions` or `max_evidence_expansions` for clarity.

`basis.watch_id`

- Good scheduled Watch provenance.
- Watch-owned; Discovery should echo it as caller basis only.
- Direct requests correctly set this to null.

`basis.scope_key`

- Good scheduled Watch/task correlation.
- Watch-owned; should not become Discovery's scope authority.

`basis.direct_request_basis`

- Useful for fixture/direct projection.
- Should not become production doctrine as free text.
- Future direct requests should use structured caller/request identifiers instead of prose.

Missing request fields before dispatcher use:

- `packet_id` or deterministic `packet_key`.
- `contract_version`.
- `caller_origin` and `dispatch_origin`.
- `requested_at` or accepted time basis.
- `provider_route` / `acquisition_route`.
- `pending_ref_policy` such as `drain_pending_first`.
- `scope_authority` with explicit accepted/validated status, while keeping invalid scope outside Discovery completion.
- `external_io` / live gate posture only as trusted dispatch facts when dispatcher work opens, not as Discovery-owned permission.

## 6. Field-By-Field Notes For Receipt

`model`

- Good for the actor Watch projection.
- Too actor-specific for shared future Discovery receipts.

`run_id`

- Useful provider/run provenance.
- Should remain support/provenance, not Evidence.
- For durable packet work, `run_id` should not be the only correlation field; add packet/request identity.

`actor`

- Good echo of the accepted target.
- Echo should be treated as receipt correlation, not Discovery re-authoring Watch scope.

`request_window`

- Good echo of the accepted request.
- Helps Watch understand what was handled without reading Discovery memory.

`caps`

- Good echo of accepted constraints.
- Future receipt should report both requested caps and applied caps if the dispatcher/provider layer changes them.

`candidate_ref_counts`

- Good boundary concept.
- `discovered`, `unique_after_dedupe`, `duplicate_removed`, `malformed_removed` are useful.
- Consider renaming `discovered` to `provider_refs_received` or `candidate_refs_received` before durable doctrine, because `discovered` can sound like Atlas truth rather than provider-returned candidate material.

`pending_ref_counts`

- Useful because draining local refs is materially different from zKill provider acquisition.
- `zkill_discovery_skipped` should be renamed before contract acceptance. Suggested future field: `acquisition_route: local_pending_refs` or `fresh_provider_acquisition_attempted: false`.

`selection_counts`

- Useful but still close to implementation internals.
- `selected_for_expansion`, `cap_skipped`, `already_cached`, and `failed_expansions` are receipt-relevant.
- `expansion_queue_summary` should remain compatibility/debug or become a normalized count block, not a raw nested compatibility carryover.

`evidence_landing_counts`

- Strong field group. It correctly makes Evidence/EVEidence begin at persisted expanded ESI killmail and normalized activity write.
- `new_esi_expansions`, `persisted_killmails`, and `activity_events_written` are good factual basis.
- Future version might add `ingestion_audits_written` if Watch needs enough basis to know evidence landing was fully represented.

`api_counts`

- Useful as support/provenance.
- `source: fixture synthetic api_request_logs from disposable proof DB` is correct for HS452, but not production contract language.
- Future production receipt should distinguish provider attempt counts from durable `api_request_logs` counts and should represent provider capacity/deferred outcomes.

`warnings`

- Useful but too untyped for durable packet semantics.
- Future receipt should provide typed warnings with source layer: acquisition, expansion, persistence, provider_capacity, validation, or compatibility.

`outcome`

- Good as a projection using accepted vocabulary.
- Not yet complete enough for dispatcher doctrine.
- Needs split outcome posture before durable use:
  - `acquisition_outcome`
  - `expansion_outcome`
  - `evidence_landing_outcome`
  - `overall_outcome`

`compatibility_summary`

- Correctly nested and marked temporary/debug.
- Must not become a contract dependency.
- Future acceptance should require callers to consume named receipt fields, not inspect this object.

Missing receipt fields before dispatcher use:

- `request_id` / `packet_id` echo.
- `handled_at` / `started_at` / `finished_at` if durable sequencing matters.
- `provider_route_used`.
- `external_io_held`, provider deferred, retry-after, cooldown, or next-eligible posture where applicable.
- `idempotency_basis` and duplicate/replay status.
- Typed warnings/errors.
- Explicit local pending-ref drain vs fresh zKill acquisition route.
- Clear distinction between ESI expansion attempted, ESI expansion deferred, and Evidence write landed.

## 7. Provider Packet Shape Considerations: zKill / ESI

zKill:

- zKill scoped API belongs to Atlas Discovery, not Evidence.
- The relevant packet basis is `killmail_id` plus hash, with optional preview/metadata as Discovery/provenance only.
- Current request caps map well to bounded scoped zKill Discovery for actor Watch.
- Atlas should preserve provider posture later: scoped API route, target ID/type, `pastSeconds`, max refs, User-Agent, request spacing, gzip, local cache, and no catch-up flooding.
- RedisQ should remain off the table because it is sunset.
- R2Z2 or history dumps are separate future lanes and should not be smuggled into actor Watch scoped API packets.

ESI:

- ESI killmail expansion is Evidence/EVEidence creation only after expanded payload lands locally.
- The receipt correctly avoids calling ESI-backed expansion Hydration.
- The receipt should eventually separate ESI provider expansion outcome from Evidence landing outcome, because a successful provider response and a successful local write are not the same event.
- Public ESI SSO/app registration is not relevant to the current public killmail expansion posture, but User-Agent, pacing, cache/rate, Retry-After, and error handling remain relevant when dispatcher design opens.

No provider/API detail required live verification for this advisory. No browsing or live/API calls were performed for HS454.

## 8. Reuse Assessment For Manual, Live, Marked, Assessment-Originated Requests

Manual:

- The current shape is conceptually reusable, but not as named.
- Manual needs `caller_origin: manual`, explicit user selection basis, and queue-selection basis.
- Manual may ask for zKill Discovery only or ESI expansion from selected Discovery refs; the actor Watch model name is too narrow.

Live:

- Current shape is not enough.
- Live needs stricter immediate provider gate posture, confirmation basis, endpoint route family, and response/cooldown handling.
- Live should not inherit Watch cadence semantics.

Marked:

- Current shape needs a neutral target/scope block.
- Marked is attention/interest, not active checking; a Marked-originated request must explicitly avoid implying Watch.
- `source: marked` alone would be too weak without a separate `caller_origin` and request reason.

Assessment-originated:

- Current shape needs citation/context basis and an explicit statement that Assessment is human judgment, not provider truth.
- Assessment-originated Discovery should not make Discovery responsible for validating the assessment's meaning.

Conclusion:

- The request/receipt concept is reusable.
- The current `actor_watch_*` model is intentionally actor-Watch-specific and should not be reused as the generic form.
- A future generic packet can be derived from this shape after actor Watch proves the handoff, but that is parked.

## 9. Caller Completion / Readiness Assessment

For direct and scheduled actor Watch, the receipt is sufficient for a caller to know:

- which actor target/window/caps were handled;
- whether candidate refs were found, deduped, malformed, or reused from pending refs;
- whether refs were selected for ESI expansion or skipped by cache/cap/failure;
- whether Evidence/EVEidence landing happened;
- what warnings and provider API count posture occurred;
- what coarse outcome was derived.

It is not yet sufficient for:

- durable idempotent dispatch replay;
- cross-process dispatcher recovery;
- provider Retry-After/cooldown persistence;
- deciding future scheduled cadence from a persisted Discovery receipt alone;
- generalized system/radius Watch behavior;
- collector retirement authority.

Watch can consume this shape as a receipt projection. It should not yet use it as the sole source for durable scheduling policy or retirement decisions.

## 10. Parked Future Fields Or Schema Concerns

Park until durable task/packet persistence exists:

- packet/request table schema;
- receipt persistence schema;
- lease/claim fields;
- dispatcher worker ownership;
- durable provider cooldown / Retry-After state;
- cross-process idempotency/replay strategy;
- provider route registry;
- generic `discovery_request` / `discovery_receipt` contract;
- system/radius request/receipt generalization;
- Manual/Live/Marked/Assessment request-origin contract;
- collector retirement.

Possible future fields, parked:

- `contract_version`
- `packet_id`
- `packet_key`
- `caller_origin`
- `dispatch_origin`
- `request_kind`
- `scope_authority`
- `provider_route`
- `pending_ref_policy`
- `idempotency_basis`
- `started_at`
- `finished_at`
- `provider_retry_after_until`
- `next_eligible_at`
- `acquisition_outcome`
- `expansion_outcome`
- `evidence_landing_outcome`
- `typed_warnings`

## 11. Recommended Next Atlas Step

Accept HS452's projected shape as a good actor Watch handoff language candidate, with changes noted here before any durable or dispatcher adoption.

Recommended next seam remains advisory/source-trace, not implementation:

```txt
remaining collectActorWatch caller / retirement-readiness trace, using the HS452 request/receipt shape and HS454 acceptance pressure as review lenses
```

Do not open a Dev runway solely from this artifact. Do not retire `collectActorWatch(...)` until remaining callers and system/radius isolation are mapped.

## 12. Human / Overseer Decisions Needed

- Decide whether `actor_watch_discovery_request` / `actor_watch_discovery_receipt` should be accepted as actor-Watch-only handoff language for the next trace.
- Decide whether future generic packet naming should be explored now or parked until dispatcher design.
- Decide whether `source` should be split into `caller_origin` and `dispatch_origin` before the next implementation seam.
- Decide whether `compatibility_summary` can remain available as debug-only through the next actor Watch seam.
- Decide when to ask the zKill/External Integration lane to define provider route/cadence fields for dispatcher acceptance.
- Decide whether the next step is a `collectActorWatch(...)` retirement-readiness trace or a caller return-path naming trace.
