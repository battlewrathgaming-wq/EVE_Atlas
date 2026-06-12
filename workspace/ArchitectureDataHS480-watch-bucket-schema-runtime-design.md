# ArchitectureDataHS480 - Watch Bucket Schema Runtime Design

Status: advisory / design only  
Date: 2026-06-12  
Executor: Architecture / Data Engineering Review  
Request: `workspace/OverseerHS480-watch-bucket-schema-runtime-design-request.md`

## 1. Executive Recommendation

Atlas should introduce a small product Watch bucket persistence surface, separate from `fetch_runs`, `discovered_killmail_refs`, Watch source rows, and Evidence/EVEidence.

Recommended shape:

```txt
watch work item / bucket row
-> one open item per Watch
-> accepted Watch scope snapshot
-> future Discovery pickup posture
-> settled factual receipt summary
-> Watch interprets cadence separately
```

Do not combine this first product bucket work with dispatcher, leases, provider packets, candidate-ref writes, ESI expansion, Evidence/EVEidence writes, Hydration, Observation, UI, or `collectActorWatch(...)` retirement.

The first runtime/schema Dev packet should add the smallest local-only bucket persistence and readout behavior needed to prove durable identity/restart recovery. Discovery pickup should remain a read-only or no-movement contract until bucket persistence is stable.

## 2. Proposed Product Schema / Runtime Shape

Design target, not a migration:

```txt
watch_bucket_items
```

Purpose:

- durable identity for one emitted Watch work item
- recoverable open work after restart/storage unlock/External I/O re-enable
- stable input surface for later Discovery pickup
- relationship anchor for future receipts/provenance

The row should represent Watch-emitted work, not Discovery refs, provider calls, or Evidence.

Runtime flow:

```txt
Watch due check
-> if no open item for Watch, create one bucket item
-> if open item exists, suppress duplicate emission
-> Discovery pickup later reads open eligible items
-> External I/O/provider policy gates movement
-> Discovery returns settled factual receipt
-> Watch interprets cadence/backoff/completion
```

## 3. Minimal Alpha Fields And States

### Minimal identity fields

Recommended alpha fields:

- `bucket_item_id`: product row identity; opaque local ID.
- `watch_run_id`: stable emitted-work identity; opaque string, format not doctrine.
- `watch_type`: initially `system_radius`; actor can remain parked unless explicitly included.
- `watch_id`: source Watch row ID.
- `source_kind`: e.g. `watch_system_radius`.
- `status`: Watch bucket lifecycle state.
- `emitted_at`: when Watch emitted the work item.
- `updated_at`: last bucket-row update.

### Minimal scope/window/cap snapshot

Store a snapshot of what Watch asked at emission time:

- `accepted_scope_json`
- `window_json`
- `caps_json`
- `provenance_json`

For system/radius, the accepted scope snapshot must include:

- execution authority: stored included system IDs
- accepted included system IDs
- center/radius as provenance/explanation only
- source Watch scope key or equivalent provenance

### Minimal pickup/receipt fields

Keep pickup/receipt compact:

- `pickup_posture`: nullable readout/posture field, not a dispatcher lease.
- `settled_at`: nullable.
- `receipt_status`: nullable settled factual posture.
- `receipt_summary_json`: compact factual summary.
- `provider_timing_json`: provider timing facts only.
- `last_error_json`: typed/sanitized error posture, if needed.

### Bucket states

Watch bucket-owned alpha states:

- `open`
- `settled`
- `cancelled`
- `blocked_integrity`

Avoid making provider posture a bucket state. `held_by_external_io`, `provider_deferred`, and `retry_after_until` are Discovery/provider movement facts, not Watch-owned lifecycle states.

## 4. Fields / States To Reject Or Defer

Reject for alpha:

- raw provider URLs
- arbitrary zKill modifier grammar
- raw provider response bodies
- provider packet payloads
- ESI killmail payloads
- candidate refs
- Evidence/EVEidence rows
- Watch cadence decisions inside the bucket row
- UI inbox state
- Assessment/Observation interpretation
- task runner progress messages
- lease owner / lease expiry / dispatcher attempt counters

Defer:

- durable Discovery task/packet table
- pickup leases
- dispatcher queue/runtime
- provider attempt table
- candidate-ref relationship table
- Evidence relationship table
- Observation inbox/query implementation
- actor Watch migration into the same bucket schema, unless Overseer explicitly chooses it

## 5. Watch-Owned Facts Versus Discovery / Provider-Owned Facts

Watch-owned:

- accepted scope
- cadence
- due check
- one-open-item rule
- emitted bucket identity
- whether a settled receipt satisfies the run
- whether cadence advances
- whether Watch backoff applies
- armed/active interpretation

Bucket row stores Watch facts as emitted-work memory. It does not decide provider motion.

Discovery/provider-owned:

- pickup eligibility
- External I/O hold
- provider route family
- zKill candidate acquisition posture
- ESI-backed expansion posture
- provider retry/defer/capacity facts
- cache/rate/error facts
- settled factual receipt basis

Provider timing facts may cross into the bucket/receipt projection. Watch scheduling decisions must not.

## 6. Restart / Recovery Model

Recovery should be simple:

- On restart, open bucket rows remain open.
- Watch due checks should not emit a second open row for the same Watch.
- Missed intervals still collapse into one current open item.
- External I/O off does not fail rows.
- External I/O re-enable does not create catch-up flood.
- Discovery pickup later reads open rows and applies provider policy.
- If local Evidence already contains a killmail later encountered, Discovery skips expansion by local cache/idempotency.

The first product packet should prove only durable identity and restart-safe duplicate suppression. It should not prove provider recovery yet.

## 7. External I/O / Provider Hold Model

External I/O should be represented after Watch emission:

```txt
bucket status: open
pickup posture: held_by_external_io
provider packets: 0
Discovery pickup started: false, until a later authorized runtime packet
```

When External I/O is closed:

- bucket rows may exist
- Discovery/provider movement rests
- no provider failure is recorded
- Watch cadence is not automatically advanced
- no catch-up rows are created

Provider retry facts that may be recorded later:

- `retry_after_until`
- `next_provider_eligible_at`
- `rate_limit_group`
- `rate_limit_remaining`
- `rate_limit_reset_at`
- `error_limit_remaining`
- `error_limit_reset_at`
- `cache_expires_at`
- `etag`
- `last_modified`

These are factual provider constraints. They are not Watch cadence authority.

## 8. Receipt / Outcome Model Back To Watch

Discovery should return a settled factual receipt, not internal chatter.

Minimum receipt posture:

- `refs_found`
- `no_refs_found`
- `acquisition_capped`
- `held_by_external_io`
- `provider_deferred`
- `failed_retryable`
- `failed_terminal`
- `partial_recoverable`

Useful count fields:

- candidate refs received
- unique refs
- malformed refs
- duplicate refs
- capped refs
- selected refs
- cached refs
- expansion attempts
- Evidence/EVEidence landed count

For alpha bucket schema, it is acceptable for receipt summary to be compact JSON while detailed Discovery internals remain deferred.

Watch consumes receipt and decides:

- scheduled run satisfied or not
- cadence advance
- backoff
- armed/active implications
- next eligibility

Discovery must not store or emit those as Discovery authority.

## 9. Existing Schema / Code Fit And Non-Reuse Warnings

Reuse conceptually:

- `system_watches.watch_id` as Watch source identity.
- HS463 `watch_run_stub` shape as the emission source.
- HS470 identity fixture semantics.
- HS476 disposable persistence semantics.
- HS478 pickup hold contract language.
- `liveApiGateService` / provider policy facts later, but not as Watch emission blockers.

Do not reuse as bucket:

- `fetch_runs`: provider/Evidence collection lifecycle memory.
- `discovered_killmail_refs`: post-acquisition candidate-ref memory.
- `killmails`: Evidence/EVEidence landed truth.
- `activity_events`: Observation/reportable event memory, not Watch bucket state.
- `api_request_logs`: provider operational provenance, not bucket state.
- `TaskRunner`: volatile runtime task state, not durable work identity.

Important source-fit concern:

Current scheduler and executor paths still treat live/API disabled as Watch blocking posture. Product behavior must shift that boundary for bucket emission so External I/O gates Discovery pickup/provider movement, not Watch emission.

## 10. Migration / Compatibility Risks

Risks moving from fixture to product:

- accidentally making fixture field names final schema doctrine
- using `held_by_external_io` as persisted Watch failure/status
- allowing two open rows for one Watch
- blocking Watch bucket emission on External I/O and preserving old gate placement
- mutating Watch cadence when bucket item is emitted rather than when receipt is interpreted
- losing overlap provenance by deduping at system ID or killmail ID too early
- combining bucket persistence with provider packets
- assuming actor Watch and system/radius Watch have identical bucket input needs
- treating `watch_run_id` format as public API
- letting renderer-supplied bucket rows become authoritative

Compatibility:

- Existing direct/scheduled actor Watch paths are already redirected through the boundary-owned direct body, but `collectActorWatch(...)` remains a retirement candidate with active script/verifier dependencies from HS456.
- System/radius Watch runtime still has collector history and should not be redirected in the bucket persistence packet.
- Existing proof commands should remain read-only/fixture surfaces and not become product runtime paths.

## 11. Smallest Next Dev Packet Recommendation

Recommended next Dev packet:

```txt
Add product Watch bucket persistence for system/radius emitted work identity only.
```

Scope:

- schema migration for a minimal bucket table
- repository/service methods to create/read open bucket items locally
- one-open-item-per-Watch enforcement
- readout/verifier proving restart-safe duplicate suppression
- External I/O off does not block row creation
- no Discovery pickup start
- no provider packets
- no candidate refs
- no Evidence/EVEidence writes
- no Watch cadence mutation

Do not include:

- leases
- dispatcher
- provider movement
- Discovery pickup execution
- settled receipt mutation, unless kept as nullable shape only
- UI
- actor Watch migration
- collector retirement

If this is still too heavy, split it into:

1. schema/repository only for minimal bucket rows
2. later local command/service for Watch emission into bucket

## 12. Acceptance Criteria For That Packet

The first schema/runtime Dev packet should pass these criteria:

- `fetch_runs` is not used as bucket state.
- `discovered_killmail_refs` is not used as pre-acquisition bucket state.
- Evidence/EVEidence tables are not mutated.
- A due valid system/radius Watch can create one open bucket item.
- Re-emitting the same Watch while open is idempotent or suppressed.
- Same Watch with mismatched open identity produces integrity conflict.
- Same `watch_run_id` mismatch produces integrity error.
- Overlapping system scopes for different Watches coexist.
- Stale missed intervals create one current open item and no catch-up rows.
- External I/O off does not block bucket item creation.
- External I/O off creates no provider packets and no Discovery refs.
- Watch cadence rows are not mutated by bucket emission.
- The command/service reports all provider/Discovery/Evidence side effects as zero.
- Verification includes schema syntax/migration check, focused bucket verifier, service registry/command authority/passive side-effects/enforcement dry-run, and `git diff -- src/main/db/schema.sql` review.

## 13. Open Human / Overseer Decisions

Decisions needed before Dev:

1. Is the first product bucket table system/radius-only, or generic with actor parked?
2. Should the first product command create rows from stored Watch rows, or only from validated `watch_run_stub` input?
3. What exact alpha status names are acceptable: `open`, `settled`, `cancelled`, `blocked_integrity`?
4. Should `watch_run_id` be generated by Watch emission service or passed from the stub generator?
5. Should receipt fields be present as nullable columns now, or deferred to a later receipt packet?
6. Should provider timing facts be JSON-only for alpha?
7. What is the minimum readout needed for Overseer to accept no catch-up flood after restart?

## 14. Verification / Evidence Used

Files read:

- `workspace/current.md`
- `workspace/OverseerHS480-watch-bucket-schema-runtime-design-request.md`
- `workspace/ExternalIntegrationHS480-provider-policy-watch-bucket-discovery-pickup-design-pressure.md`
- `docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md`
- `workspace/DevHS476-watch-bucket-disposable-persistence-fixture.md`
- `workspace/DevHS478-discovery-pickup-consumer-hold-contract.md`
- `workspace/OverseerHS479-hs478-discovery-pickup-consumer-hold-contract-review.md`

Commands used:

```txt
Get-Content workspace/current.md | Select-Object -First 140
Get-ChildItem -Name workspace/*HS480*
Get-Content workspace/ExternalIntegrationHS480-provider-policy-watch-bucket-discovery-pickup-design-pressure.md
Get-Content docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md
Get-Content workspace/OverseerHS480-watch-bucket-schema-runtime-design-request.md
Get-Content workspace/DevHS476-watch-bucket-disposable-persistence-fixture.md
Get-Content workspace/DevHS478-discovery-pickup-consumer-hold-contract.md
Get-Content workspace/OverseerHS479-hs478-discovery-pickup-consumer-hold-contract-review.md
Test-Path workspace/ArchitectureDataHS480-watch-bucket-schema-runtime-design.md
```

No code was implemented. No schema, providers, Watch rows, Discovery pickup, candidate refs, Evidence/EVEidence, Hydration, Observation, dispatcher/queue/lease behavior, runtime enforcement, UI, source terms, or protected-word files were changed.
