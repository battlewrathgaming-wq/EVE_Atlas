# Data Engineering - Provider Work Structure Readiness Advisory

Status: advisory
Date: 2026-06-05
Role: Engineering / Data Engineering / Systems Design advisory
Project: AURA Atlas

## 1. Executive Recommendation

The proposed structure is coherent for Atlas if it remains a control model, not an automatic schema or queue mandate:

```text
Lane -> Bucket -> Dispatcher -> Execution -> Write
```

Use the stack as a way to preserve boundaries:

- Lane = meaning and policy.
- Bucket = eligible waiting work.
- Dispatcher = paced release.
- Execution = current attempt.
- Write = durable outcome.

Atlas should not open a broad provider work queue from this model. The current evidence supports lane-specific, low-architecture continuation: selected-ID Hydration can remain non-durable through request posture and pickup, and the next smallest real-execution seam should be a read-only selected-ID real execution preflight or Engineering/Security gate-fit advisory, not live provider execution by default.

Selected-ID Hydration does not need a durable Bucket yet. It also does not need a Dispatcher before real provider-backed execution if the future command remains one explicit operator-selected ID. A Dispatcher becomes useful later for background/multi-item paced release, not for the current selected-ID proof chain.

## 2. Whole-Structure Readiness Map

| Layer | Current Atlas Readiness | Advisory Read |
| --- | --- | --- |
| Lane | Ready as accepted meaning/policy model. Current docs preserve Discovery, Evidence Expansion, Hydration, and parked fourth lane. | Coherent and useful. Keep lane identity tied to output meaning, not provider endpoint. |
| Bucket | Partially proven as derived/read-only posture. Discovery refs are already durable possible-lead waiting state. Hydration selected-ID pickup is explicitly non-durable. | Do not generalize into one provider queue. Keep Bucket lane-specific and derived unless restart/retry/fairness need proves persistence. |
| Dispatcher | Conceptual/unopened. `runtime.queue_clock_posture.preview` explicitly does not dispatch. | Not needed for selected-ID Hydration yet. Needed later only for paced release across background or multi-lane work. |
| Execution | Existing provider-capable commands exist for `manual.discovery`, `manual.expansion`, and `metadata.hydration`. Selected-ID Hydration real execution is not open. HS268 proves fixture-only selected-ID execution revalidation. | Execution is the current-attempt boundary. For live Hydration, it must revalidate from trusted local state immediately before provider contact. |
| Write | Evidence Expansion writes Evidence/EVEidence. Hydration fixture proof writes readability rows only. HS268 proves selected-ID fixture write transaction with injected provider result. | Write must stay lane-specific. Hydration Write is `metadata_runs`, optional sanitized `api_request_logs`, `entities`, and readability label patches only. |

## 3. Per-Layer Guidance

Lane:

The accepted lane simplification fits Atlas:

```text
Discovery outputs possible leads.
Evidence Expansion outputs Evidence/EVEidence.
Hydration outputs readability repair.
Fourth lane stays parked.
```

The lane should answer "what kind of meaning and durable outcome can this work create?" It should not be defined merely by provider, speed, or UI surface.

Bucket:

Bucket should mean "eligible waiting work," not "a universal persisted task table." Atlas already has durable lane-specific sources:

- Discovery refs in `discovered_killmail_refs`.
- ESI Evidence Expansion candidates derived from selected/pending Discovery refs.
- Hydration demand derived from local unresolved IDs, attention, local basis, and request posture.

Hydration selected-ID pickup is currently a non-durable candidate contract. That is sound because a selected operator act can be revalidated at execution time, and local labels may appear between request and execution.

Dispatcher:

Dispatcher should be a paced release mechanism only. It should not decide lane meaning, create Evidence, create Hydration demand, bypass gates, or convert backlog into burst behavior.

If introduced later, it should:

- re-enter normal gates for every release;
- smooth work rather than catch up flood;
- preserve lane priority without starving Evidence Expansion;
- treat External I/O re-enable, storage unlock, and restart as recheck moments, not replay debt.

Execution:

Execution is the current attempt boundary. It must rebuild trusted facts immediately before provider contact, not trust renderer-supplied posture or stale pickup hints.

Before provider contact, Execution must revalidate:

- explicit operator act or accepted Watch/manual intent for that lane;
- selected ID normalization and supported ID type;
- local-first label lookup and local-basis requirement;
- request posture and pickup eligibility from current local DB state;
- lane identity: Hydration remains readability repair, not Evidence Expansion;
- External I/O state;
- live/provider cadence gate;
- storage/write posture for the expected write effect;
- confirmation/authority for the exact command;
- active task/concurrency posture if the command can overlap with other provider work;
- no stale renderer-provided local label, gate, or pickup authority.

Write:

Write is not complete when the provider responds. Write is complete only when Atlas records the lane-appropriate durable outcome under policy.

After a provider response, Hydration Write must prove:

- response ID and category match the selected request;
- label is non-empty, bounded, and safe to persist;
- `entities` upsert is scoped to the selected entity;
- `activity_events` patches affect readability label columns only;
- numeric IDs and raw Evidence/EVEidence payloads remain unchanged;
- `metadata_runs` records status, counts, and outcome;
- `api_request_logs`, if written, are sanitized and marked as metadata/provider provenance;
- unresolved, mismatched, blocked, or failed cases do not leave stray label writes.

## 4. Current Selected-ID Hydration Placement

Selected-ID Hydration currently sits here:

```text
Hydration lane
-> read-only request posture
-> non-durable pickup contract
-> fixture-only execution revalidation
-> injected fixture provider response validation
-> Hydration readability write proof
```

Accepted commands:

- `metadata.hydration_request_posture.preview`
- `metadata.hydration_pickup_contract.preview`
- `metadata.hydration_selected_id_execution_fixture_proof`

This means selected-ID Hydration has proven the shape of current-attempt execution and write behavior under fixture conditions. It has not proven real provider-backed execution.

## 5. Durability Recommendation

Can stay derived/read-only for now:

- selected-ID Hydration request posture;
- selected-ID Hydration pickup eligibility;
- patient packet identity/readiness posture;
- queue/clock posture;
- Hydration candidate demand;
- Dispatcher-readiness/readout posture;
- local readability lookup during report/Observation construction.

Already durable or appropriately lane-specific:

- Discovery refs as possible leads/provenance;
- ESI-expanded `killmails` and derived `activity_events` as Evidence/EVEidence support;
- Watch configuration/intent rows;
- Hydration outcomes in `metadata_runs`, `entities`, and readability label patches;
- provider/run provenance in `api_request_logs`, `fetch_runs`, and ingestion audit material as applicable.

Must become durable before live background/dispatcher behavior, if that path opens:

- the lane-specific source of work being dispatched, or an explicit accepted rule that it is always recomputed each tick;
- attempt/run provenance after a provider call occurs;
- enough active/retry/concurrency state to prevent duplicate simultaneous attempts if background execution is allowed;
- restart-safe cadence/pacing state if Atlas depends on Dispatcher timing rather than per-action live gate state.

Selected-ID Hydration does not need durable Bucket persistence before a narrow real execution command, provided the command revalidates local-first posture at execution time and remains one explicit operator-selected ID.

## 6. Dispatcher Recommendation

Selected-ID Hydration does not need a Dispatcher before real provider-backed execution if the product shape is:

```text
operator selects one unresolved supported ID
-> Atlas revalidates local-first/gates
-> Atlas makes one provider lookup
-> Atlas writes readability repair
```

A Dispatcher should stay parked until Atlas opens at least one of:

- background Hydration;
- Watch/background Hydration pickup;
- multi-ID Hydration release from a waiting Bucket;
- multi-lane paced release across Discovery, Evidence Expansion, and Hydration;
- retry/lease behavior that must survive restart.

If a Dispatcher is later introduced, it should prioritize Evidence Expansion enough to keep the primary ingest useful, but it should not starve selective Hydration where readability is needed for current operator work.

## 7. Direct Answers To The Review Questions

1. Is this structure coherent for Atlas?

Yes. It is coherent as a layered control model, especially because it separates meaning, waiting eligibility, pacing, attempt, and durable result.

2. What has Atlas already proven?

Atlas has proven Discovery refs as possible leads, ESI expansion as Evidence/EVEidence creation, local readability/report construction without provider calls, read-only Hydration request posture, non-durable pickup contract, and fixture-only selected-ID Hydration execution/write behavior.

3. What remains conceptual?

Dispatcher behavior, broad provider work queues, durable Hydration request/pickup persistence, background Hydration pickup, retry/lease machinery, and the parked fourth lane remain conceptual or parked.

4. What can stay derived/read-only for now?

Queue/clock posture, patient packet identity, selected-ID request posture, selected-ID pickup, Hydration candidate demand, and selected-ID Bucket-like posture can stay derived/read-only.

5. What must become durable before live behavior?

For one selected-ID live execution, only the outcome/provenance must be durable after the attempt: metadata run, sanitized API log if applicable, entity label, and readability patches. For background/dispatcher live behavior, the work source, active attempt/concurrency posture, and pacing/retry state may need durability.

6. Where does selected-ID Hydration currently sit in this stack?

It sits in the Hydration lane, with request posture and pickup as derived/read-only pre-execution layers, HS268 as fixture Execution proof, and Hydration readability rows as fixture Write proof.

7. Does selected-ID Hydration need a durable Bucket yet?

No. Not for one explicit selected-ID provider-backed command. Durable Bucket persistence would add architecture before the current proof requires it.

8. Does selected-ID Hydration need a Dispatcher before real provider-backed execution?

No, not if execution remains a narrow explicit operator action. A Dispatcher is appropriate later for paced background or multi-item release.

9. What must Execution revalidate immediately before provider contact?

Execution must revalidate explicit intent, selected ID/type, local-first label state, local basis, pickup eligibility, External I/O, live/provider cadence, storage/write posture, confirmation/authority, concurrency/task posture, and lane boundary.

10. What must Write prove after provider response?

Write must prove safe response matching, scoped entity upsert, readability-only label patches, metadata run finalization, sanitized API provenance if logged, and no mutation of Evidence/EVEidence, Discovery, Watch, Marked, Assessment Memory, raw payloads, or numeric facts.

11. What should remain parked?

Fourth lane, broad provider queue, durable Hydration Bucket, Dispatcher/worker/lease/retry machinery, Watch/background Hydration pickup, renderer UI, schema changes, runtime enforcement activation, pruning/deletion, support artifacts, and real provider-backed execution until Overseer deliberately opens it.

12. Recommended next smallest seam.

The smallest next seam is not Dispatcher and not durable Bucket. It is one of the HS270 recommended gates:

- Engineering/Security advisory on whether real selected-ID Hydration can safely use the existing provider/gate path; or
- read-only selected-ID real execution preflight that composes local-first posture, pickup contract, External I/O, live/provider gate, storage write posture, supported selected-ID type, and expected write path.

## 8. Risks / Parked Items

Primary risks:

- Treating fixture proof as live readiness.
- Turning non-durable pickup into queue persistence too early.
- Letting Dispatcher semantics decide lane meaning.
- Blurring Hydration with ESI Evidence Expansion because both contact ESI.
- Reusing older `fast_view_metadata_hydration` wording where the accepted lane is now Hydration readability repair.
- Over-persisting attempt logs before there is a real retry/restart problem to solve.
- Under-validating real provider response and accidentally patching labels from mismatched IDs.

Parked:

- fourth lane;
- separate fast lane;
- background worker Hydration;
- provider work queue;
- live selected-ID execution;
- dispatcher;
- retry/lease state;
- schema changes;
- UI behavior;
- product-direction decisions.

## 9. Files / Context Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS270-hydration-real-execution-decision-surface.md`
- `workspace/DevHS268-selected-id-hydration-execution-fixture-proof.md`
- `workspace/OverseerHS269-hs268-hydration-execution-fixture-proof-review.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
- `src/main/services/hydrationSelectedIdExecutionFixtureProofService.js`
- `src/main/services/hydrationPickupContractService.js`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/queueClockPostureService.js`

## 10. Advisory Disposition

- safe to keep as conceptual/control artifact
- needs Overseer decision before any Dev runway
- not ready for Dev as live provider execution
- safe to translate into a future bounded read-only preflight packet
- durable Bucket / Dispatcher not justified yet for selected-ID Hydration

