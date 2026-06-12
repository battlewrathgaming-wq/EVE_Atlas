# EngineeringSourceTraceHS465 - Watch Bucket / Dedupe Model

Status: advisory/source trace only  
Date: 2026-06-12  
Executor: Engineering / Source Trace  
Request: `workspace/OverseerHS465-watch-bucket-dedupe-model-source-trace-request.md`

## 1. Executive Recommendation

The proposed model is sound as an architectural direction:

```txt
Watch emits at most one open run stub per Watch
-> durable/blind bucket may hold due work even while External I/O is closed
-> Discovery/dispatcher gates provider movement
-> Discovery dedupes candidate refs and returns settled factual receipt
-> Evidence/EVEidence remains singular landed killmail truth
-> provenance preserves overlapping Watch intent
```

But current Atlas schema/code does not yet support the full durable bucket model. HS463 proves a read-only system/radius `watch_run_stub` projection only. There is no durable Watch bucket table, no product Watch run row, no one-open-stub constraint, and no explicit `watch_run_id -> candidate refs` relationship.

Recommendation: adopt the model as ADR-worthy direction, but do not open provider movement or bucket implementation yet. The next useful Dev proof should be a no-provider, write-capable or read-only-with-fixture proof of single-flight bucket identity and overlap-preserving dedupe semantics before durable schema is accepted.

## 2. Current Schema / Code Fit

### Watch identity and scheduling

Current Watch source rows:

- `system_watches.watch_id`
- `watchlist_entities.watch_id`
- cadence fields: `last_polled_at`, `next_poll_at`, `last_success_at`, `last_error_at`, `backoff_until`, `poll_interval_minutes`, `is_active`

`src/main/watchlist/watchScheduler.js` can derive due/blocked posture from Watch rows, session armed state, live API state, backoff, and next poll time.

HS463 added a read-only projection service:

- `watch.system_radius_run_stub.preview`
- source: `src/main/services/watchSystemRadiusRunStubService.js`

That service can express one due system/radius Watch as a bounded `watch_run_stub`, but it deliberately creates no durable bucket rows and no product Watch run rows.

### Existing durable run table

`fetch_runs` already stores provider/evidence collection run summaries:

- `run_id`
- `trigger`
- `watch_type`
- `watch_id`
- status/counts/API summary fields

`fetch_runs` should not become the Watch work bucket. It is tied to provider/Evidence collection lifecycle and is created by current collectors/direct bodies at execution time. Using it as the due-work bucket would blur Watch emission with provider-facing collection.

### Existing candidate-ref table

`discovered_killmail_refs` stores candidate acquisition memory:

```txt
PRIMARY KEY (killmail_id, killmail_hash, discovered_by_type, discovered_by_id)
```

It is useful Discovery memory, but should not become the durable Watch work bucket. It stores candidate refs after acquisition, not pre-acquisition Watch work stubs.

## 3. Gaps Or Blockers

Current gaps before the proposed durable bucket model can be implemented safely:

- no Watch bucket table
- no product Watch run table
- no durable `watch_run_id` column on candidate refs
- no one-open-stub-per-`watch_id` constraint
- no product state machine for open/settled/cancelled Watch stubs
- no source-tested receipt projection from bucket work back to Watch
- no durable relationship table preserving many Watch runs/scopes to one candidate ref or landed killmail
- current system/radius candidate-ref identity uses center system as `discovered_by_id`, not `watch_id` or `watch_run_id`
- current Watch schedule due checks include live API disabled as a blocked reason; the proposed model would move External I/O gating after Watch emission, so this needs a deliberate boundary change

None of these are fatal. They mean the model is not ready to be represented by existing tables alone.

## 4. Current Candidate-Ref Dedupe Behavior

Candidate-ref dedupe currently happens in layers.

Provider-response dedupe:

- `discoverActorRefs(...)` and `discoverSystemRefs(...)` use an in-memory `Map` keyed by `killmail_id`.
- malformed refs are marked `skip_reason = 'malformed'`.
- repeated killmail IDs inside a discovery response are marked `skip_reason = 'duplicate'`.
- The in-memory unique list tracks `killmail_id` with associated hash.

Durable ref upsert:

- `EvidenceRepository.upsertDiscoveredKillmailRefs(...)` skips malformed/duplicate candidates.
- It writes non-skipped refs to `discovered_killmail_refs`.
- Upsert identity is `killmail_id + killmail_hash + discovered_by_type + discovered_by_id`.
- On conflict it updates `last_seen_run_id`, `last_seen_at`, priority, preview, and status unless already expanded/cached/failed.

Pending selection:

- `pendingDiscoveryRefs(...)` selects refs by `discovered_by_type + discovered_by_id` with status `pending` or `failed`.
- `markDiscoveryRefsSelected/Expanded/Cached/Failed` can update scoped refs when passed `discoveredByType/discoveredById`.
- Without a scope, legacy updates can touch all rows for a `killmail_id/hash` or `killmail_id`, which is a risk for overlap-preserving future behavior.

## 5. Current Evidence/EVEidence Dedupe Behavior

Evidence/EVEidence killmail truth is singular by `killmail_id` today:

- `killmails.killmail_id` is the primary key.
- `EvidenceRepository.hasKillmail(killmail_id)` is the pre-expansion cache skip basis.
- `persistEvidencePackage(...)` upserts killmails with `ON CONFLICT(killmail_id) DO UPDATE SET last_seen_at = excluded.last_seen_at`.
- If an incoming payload differs by checksum/hash/time/system, the writer preserves existing Evidence and writes a data-quality warning instead of replacing dependent rows.
- `activity_events` dedupe by `event_key`.
- `ingestion_audits` dedupe by `(run_id, killmail_id)`.

This supports the principle:

```txt
Deduplicate the killmail; preserve the fact that multiple Watch intents found it.
```

The first half is currently supported. The second half needs a relationship/provenance layer stronger than current center-system `discovered_by_id` identity.

## 6. Provenance-Overlap Support Or Risk

Current support:

- `discovered_killmail_refs` can preserve multiple rows for the same `killmail_id/hash` when `discovered_by_type/discovered_by_id` differ.
- Same killmail found by an actor Watch and a system/radius Watch can remain separate candidate provenance rows.
- Same killmail found by different system-radius center systems can remain separate rows if `discovered_by_id` differs.

Current risk:

- System/radius collection currently uses `discoveredByType: 'system_radius'` and `discoveredById: input.centerSystemId`.
- Two distinct Watch IDs with the same center system but different accepted included-system scopes would collapse into one candidate-ref identity.
- There is no `watch_id` or `watch_run_id` in `discovered_killmail_refs`.
- `source_scope` is not part of the primary key.
- `first_seen_run_id` and `last_seen_run_id` can show run history endpoints, but they do not preserve a many-run/many-Watch relationship.

Conclusion: current candidate-ref memory partially supports overlapping intent, but not enough for the proposed bucket model. If Watch overlap matters, future provenance should be Watch-run based, not center-system based.

## 7. External I/O Gate Interaction

Current runtime behavior gates before Watch emission/dispatch in several places:

- `watchScheduler.buildWatchScheduleStatus(...)` marks rows blocked when `liveApiEnabled` is false.
- `watchExecutor.tick(...)` blocks when live API is disabled before selecting/dispatching due work.
- `liveApiGateService.actionGate(...)` blocks live-required commands when live API is disabled, User-Agent is missing, duplicate task is active, cooldown is active, or lockout is active.
- `composedGatePolicyService` models `held_by_external_io` as a hold, but that appears to be policy/readout composition rather than the direct Watch execution path.

The proposed model changes the boundary:

- Watch emission should not be blocked by External I/O.
- External I/O should gate Discovery pickup/provider packet dispatch.
- A durable bucket row may exist while External I/O is closed.
- Discovery should rest when External I/O is closed and not create provider failure noise.

This does conflict with current due-preview behavior if "live API disabled" remains part of Watch due/blocking state. It is not a conceptual blocker, but it requires a deliberate source change later so Watch can emit or retain eligible work independently of provider movement gates.

## 8. ADR-Worthy Decision Wording

Recommended ADR direction, if Overseer chooses to capture it:

> Watch owns scheduling, accepted scope, one-open-run identity, and receipt interpretation. Watch may emit one durable work stub for a due Watch even while External I/O is closed. External I/O gates Discovery pickup and provider packet dispatch, not Watch emission. Missed intervals collapse into one current eligible run; Watch is not a historical catch-up generator. Bucket identity is Watch-run based, not system based. Candidate refs and Evidence/EVEidence dedupe by killmail identity, while provenance preserves overlapping Watch intent.

ADR should also state:

> `discovered_killmail_refs` remains candidate-ref acquisition memory and should not become the Watch work bucket.

## 9. What Should Remain Deferred

Defer:

- durable bucket schema
- durable Watch run schema
- dispatcher/lease/retry implementation
- live/provider movement
- External I/O enforcement relocation
- Watch cadence mutation changes
- `discovered_killmail_refs` schema changes
- Evidence/EVEidence writer changes
- Observation inbox/report implementation
- `collectActorWatch(...)` retirement
- system/radius collector replacement
- UI behavior

Reject for now:

- using `system_id` as bucket identity
- using `fetch_runs` as the Watch work bucket
- using `discovered_killmail_refs` as the pre-acquisition Watch work bucket
- storing Watch completion/cadence/inbox state on Evidence/EVEidence
- treating External I/O closed as provider failure
- catch-up flooding by emitting multiple historical Watch stubs for stale Watches

## 10. Smallest Next Dev Proof

Smallest useful Dev proof, if Overseer opens one later:

Prove a no-provider Watch bucket identity projection or fixture that demonstrates:

- one open stub per `watch_id`
- External I/O closed does not create provider packets
- bucket rows or projected bucket candidates are Watch-run based, not system based
- overlapping systems across different Watch IDs are allowed
- duplicate same-Watch open stub is upserted/ignored
- same `watch_run_id` with mismatched scope/provenance is flagged as integrity error
- same `killmail_id/hash` can be associated with multiple Watch-run provenance relationships without duplicating Evidence/EVEidence

The proof should not call providers, mutate Evidence/EVEidence, create real dispatcher/lease behavior, or change Watch cadence.

If a write-capable proof is too early, a read-only projection with fixture rows and explicit proposed constraints would still be useful.

## 11. Verification / Source Evidence Used

Files read:

- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS465-watch-bucket-dedupe-model-source-trace-request.md`
- `workspace/EngineeringSourceTraceHS462-watch-system-advisory.md`
- `workspace/DevHS463-system-radius-watch-run-stub-projection.md`
- `workspace/OverseerHS464-hs463-system-radius-watch-run-stub-review.md`
- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/services/watchSystemRadiusRunStubService.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/composedGatePolicyService.js` through focused search
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/actorWatchCollector.js` through focused search
- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/discovery/esiBackedExpansionPackage.js`
- adjacent Watch/Discovery services through focused `rg`

Commands/evidence used:

```txt
Get-Content workspace/current.md | Select-Object -First 90
Get-Content workspace/OverseerHS465-watch-bucket-dedupe-model-source-trace-request.md
Get-Content workspace/EngineeringSourceTraceHS462-watch-system-advisory.md
Get-Content workspace/DevHS463-system-radius-watch-run-stub-projection.md
Get-Content workspace/OverseerHS464-hs463-system-radius-watch-run-stub-review.md
rg -n "CREATE TABLE|discovered_killmail_refs|killmails|fetch_runs|watchlist_entities|system_watches|UNIQUE|PRIMARY KEY|watch_run" src/main/db/schema.sql
Get-Content src/main/db/schema.sql | Select-Object -First 330
rg -n "discovered_killmail_refs|upsertDiscoveredKillmailRefs|pendingDiscoveryRefs|markDiscoveryRefs|hasKillmail|persistEvidencePackage|INSERT OR|ON CONFLICT|fetch_runs|system_watches|watchlist_entities" src/main/db/evidenceRepository.js src/main/watchlist src/main/workers src/main/discovery src/main/services
Get-Content src/main/db/evidenceRepository.js | Select-Object -First 570
Get-Content src/main/db/evidenceRepository.js | Select-Object -Skip 568 -First 50
Get-Content src/main/services/watchSystemRadiusRunStubService.js | Select-Object -First 430
Get-Content src/main/watchlist/watchScheduler.js
Get-Content src/main/watchlist/watchlistRepository.js
rg -n "External|external|AURA_ATLAS_LIVE_API|enterLiveProviderAttempt|actionGate|LIVE_API|live_api|provider" src/main/services src/main/watchlist src/main/workers src/main/discovery
Get-Content src/main/services/liveApiGateService.js
Get-Content src/main/workers/systemRadiusCollector.js | Select-Object -First 230
Get-Content src/main/discovery/zkillCandidateAcquisition.js
Get-Content src/main/discovery/esiBackedExpansionPackage.js
```

No code was implemented. No providers or live/API calls were run. No schema, Watch rows, Discovery refs, Evidence/EVEidence, Hydration, Observation, Assessment, dispatcher/queue/lease behavior, External I/O behavior, UI, source terms, or protected-word files were changed.
