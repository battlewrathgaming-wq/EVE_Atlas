# EngineeringRiskHS468 - Watch Bucket Identity Projection

Status: advisory / practical risk check  
Date: 2026-06-12  
Executor: Engineering / Architecture Review  
Request: `workspace/OverseerHS468-watch-bucket-identity-projection-risk-check-request.md`

## 1. Executive Recommendation

A read-only Watch bucket identity projection is the right next proof.

It is smaller and safer than a disposable write fixture because it can pressure-test the identity rules without implying schema acceptance. It should answer only:

- would this due Watch produce a bucket candidate?
- would it be suppressed because an open candidate already exists?
- is overlap with another Watch allowed?
- is mismatched `watch_run_id` / scope / provenance flagged?
- does External I/O stay outside Watch emission?
- does the projection avoid Discovery, Evidence/EVEidence, providers, dispatcher, and cadence mutation?

No smaller proof appears necessary first. HS463 already proves the source `watch_run_stub`; HS465/ADR-0007 already accepts the bucket/dedupe direction. The next risk is not "can a stub exist?" but "can the future bucket identity rules be represented without misleading Atlas into schema or runtime assumptions?"

Recommendation: ready for the next read-only projection only if it is explicitly fixture/projection-only and treats existing-open bucket state as fixture input, not durable truth.

## 2. Key Assumptions To Protect

Protect these assumptions from accidental weakening:

- Watch emission is separate from provider-facing movement.
- External I/O gates Discovery pickup/provider packet dispatch, not Watch emission.
- One Watch may have at most one open emitted run stub.
- Missed intervals collapse into one current eligible run.
- Bucket identity is Watch-run based, not system based.
- Same system in multiple Watch scopes is valid overlapping intent.
- `fetch_runs` is not the Watch bucket.
- `discovered_killmail_refs` is not the pre-acquisition Watch bucket.
- Evidence/EVEidence must not store Watch scheduler/completion/inbox state.
- Dedupe rule remains: deduplicate the killmail, preserve overlapping Watch intent.

## 3. Overlooked Risks Or Missing Questions

### Projection may imply schema

The largest risk is that field names in a read-only projection will look like accepted table columns. The proof should label shapes as candidate/proposed/read-only and avoid presenting them as schema.

### "Open stub" may be confused with current durable state

Atlas does not currently have a product Watch bucket table or open-stub state. Existing-open rows must be fixture inputs. The proof should not query `fetch_runs` or `discovered_killmail_refs` and pretend they are bucket state.

### Current scheduler still blocks on live/API disabled

Current schedule code treats live API disabled as a blocking reason. ADR-0007 says future Watch emission should not be blocked by External I/O. The projection must explicitly separate:

- current scheduler posture as source fact
- future bucket candidate eligibility under ADR-0007

Otherwise the proof may accidentally preserve the old gate placement.

### Overlap cannot be fully proven without a provenance table

The read-only proof can show that overlap is allowed at the bucket identity layer, but it cannot prove durable many-Watch-to-one-killmail provenance. It should not claim that the full provenance model is implemented.

### `watch_run_id` determinism can overreach

The proof needs stable fixture IDs for comparison, but should not decide the final `watch_run_id` generation algorithm. It can require stable identity for fixture cases without making production ID format doctrine.

### Held state naming can blur owners

`held_by_external_io` should not become a Watch bucket status in this proof. It is Discovery/provider movement posture. The bucket candidate may be open/eligible while Discovery pickup is held later.

### Suppression semantics need precise labels

"Suppressed" could sound like deleted or failed. Safer wording: `not_emitted_existing_open_stub` or `duplicate_open_stub_suppressed`. It should mean "no new candidate emitted because one open candidate already exists."

## 4. Required Fixture Cases

Necessary and sufficient fixture cases for the next read-only proof:

1. Due valid system/radius Watch, no existing open stub:
   - emits one bucket candidate.

2. Due valid system/radius Watch, existing open stub for same `watch_id`:
   - emits no new candidate.
   - reports duplicate/open suppression.

3. Stale Watch with multiple missed intervals, no existing open stub:
   - emits one current candidate only.
   - does not create catch-up candidates.

4. Two Watch IDs with overlapping included systems:
   - both may emit independent candidates when each has no open stub.
   - overlap is not treated as conflict.

5. Same `watch_id`, mismatched existing open scope/provenance:
   - flags integrity conflict.
   - does not silently emit a second candidate.

6. Same `watch_run_id`, mismatched Watch/scope/window/provenance:
   - flags integrity error.

7. External I/O closed:
   - Watch bucket candidate remains possible under ADR-0007 posture.
   - provider packets remain zero.
   - no Discovery pickup is started.
   - no provider failure is reported.

8. Invalid stored scope:
   - emits no bucket candidate.
   - blocks before bucket candidate, Discovery, providers, and Evidence.

9. Not due / inactive / backoff Watch:
   - emits no candidate.

10. Candidate refs / killmail overlap fixture:
   - shows expected future relationship principle only.
   - does not write `discovered_killmail_refs`.
   - does not claim provenance table exists.

## 5. Acceptance Criteria For The Next Proof

The read-only projection is trustworthy if it:

- reads or fixtures Watch-run stubs from the HS463-style source shape.
- represents existing-open bucket state as explicit fixture input.
- emits at most one bucket candidate per `watch_id`.
- collapses stale missed intervals into one current candidate.
- treats overlapping systems across different Watch IDs as allowed.
- rejects system ID as bucket identity.
- flags same-Watch open conflicts and same-`watch_run_id` mismatches.
- keeps External I/O as pickup/provider movement posture, not Watch emission failure.
- reports `provider_calls: 0`, `live_api_calls: 0`, `writes: 0`, `bucket_rows_persisted: 0`, `discovery_refs_written: 0`, and `evidence_writes: 0`.
- does not call `WatchSessionExecutor.tick(...)`, TaskRunner, collectors, zKill, ESI, Discovery pickup, or Evidence writer.
- does not mutate Watch cadence or rows.
- does not use `fetch_runs` or `discovered_killmail_refs` as bucket rows.
- marks output as read-only projection, not schema, not runtime, not Dev authority.

## 6. Things To Avoid

Avoid:

- durable schema fields beyond conceptual labels.
- naming the projection table or table columns as if accepted.
- using `fetch_runs` as "open bucket" evidence.
- using `discovered_killmail_refs` as "open bucket" evidence.
- treating `live_api_disabled` as proof that Watch cannot emit future bucket work.
- making `held_by_external_io` a Watch-owned status.
- adding Discovery receipt design beyond minimal "not started / not touched" proof flags.
- proving Evidence/EVEidence dedupe again; HS465 already source-tested that.
- making actor Watch part of this proof unless explicitly included later.
- claiming many-Watch provenance is implemented.
- opening provider movement, dispatcher, lease, retry, cadence mutation, or UI behavior.

## 7. Naming Risks

Safer terms for the read-only proof:

- `bucket_candidate`: read-only projected candidate, not a row.
- `existing_open_stub_fixture`: fixture state representing an already-open future bucket item.
- `duplicate_open_stub_suppressed`: no new candidate because same Watch already has open work.
- `integrity_conflict`: same identity with mismatched scope/provenance.
- `external_io_pickup_hold`: later Discovery/provider movement hold, not Watch emission failure.

Riskier terms:

- `bucket_row`: implies durable schema.
- `watch_run`: may imply product row if not qualified.
- `held`: ambiguous owner unless qualified.
- `suppressed`: ambiguous unless reason is explicit.
- `open`: acceptable, but should be scoped to fixture/projection state.

Recommended posture:

Use `projected_*`, `candidate_*`, and `fixture_*` labels liberally in the proof output.

## 8. ADR Amendment Needed?

No ADR amendment is needed before the read-only projection.

ADR-0007 already records the needed direction:

- Watch emission separate from provider movement.
- one-open-run identity.
- bucket identity is Watch-run based.
- overlapping Watch intent preserved.
- `fetch_runs` and `discovered_killmail_refs` are not Watch buckets.

Possible later ADR note only if HS468/next proof discovers that External I/O must still block Watch emission for a practical reason. No reviewed source currently proves that.

## 9. Ready For Next Seam?

Yes, with constraints.

The next seam is ready as a read-only Watch bucket identity projection, not as schema or write behavior.

Recommended packet shape:

- input: current/fixture Watch-run stubs plus fixture existing-open states
- output: projected bucket candidates, suppressions, allowed overlaps, integrity conflicts, and boundary flags
- no providers, writes, Discovery pickup, Evidence/EVEidence, dispatcher, cadence mutation, or schema

Do not move to a disposable write fixture until the projection proves the fixture cases above without introducing naming or ownership confusion.

## 10. Source Evidence Used

Files read:

- `workspace/current.md`
- `workspace/OverseerHS468-watch-bucket-identity-projection-risk-check-request.md`
- `workspace/EngineeringSourceTraceHS465-watch-bucket-dedupe-model.md`
- `workspace/OverseerHS466-hs465-watch-bucket-dedupe-model-review.md`
- `workspace/OverseerHS467-watch-bucket-forecast-and-open-questions.md`
- `docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md`

Commands used:

```txt
Get-Content workspace/current.md | Select-Object -First 110
Get-Content workspace/OverseerHS468-watch-bucket-identity-projection-risk-check-request.md
Get-Content workspace/EngineeringSourceTraceHS465-watch-bucket-dedupe-model.md
Get-ChildItem -Name workspace/OverseerHS467*
Get-Content docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md
Get-Content workspace/OverseerHS467-watch-bucket-forecast-and-open-questions.md
Get-Content workspace/OverseerHS466-hs465-watch-bucket-dedupe-model-review.md
Test-Path workspace/EngineeringRiskHS468-watch-bucket-identity-projection.md
```

No code was implemented. No schema, provider calls, Discovery refs, Evidence/EVEidence, Watch rows, cadence state, dispatcher/queue/lease behavior, UI, source terms, or protected-word files were changed.
