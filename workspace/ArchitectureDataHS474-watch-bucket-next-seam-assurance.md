# ArchitectureDataHS474 - Watch Bucket Next Seam Assurance

Status: advisory / assurance only  
Date: 2026-06-12  
Executor: Architecture / Data Engineering Review  
Request: `workspace/OverseerHS474-watch-bucket-next-seam-assurance-request.md`

## 1. Executive Recommendation

Recommend the next proof be a disposable Watch bucket persistence fixture, not another Discovery pickup consumer hold contract.

Reason: HS470 already proved bucket identity as read-only projection, and HS472 already proved the bridge from projected candidates to future pickup eligible / External I/O hold posture without starting Discovery. The remaining highest-value uncertainty is whether the bucket identity rules still hold when expressed as disposable persistence semantics: one-open-stub, duplicate suppression, integrity conflict, overlap, and "not `fetch_runs` / not `discovered_killmail_refs`" boundaries.

This should still be tiny and fixture-only:

- disposable/local test DB or in-memory fixture only
- no production schema
- no provider calls
- no Discovery pickup
- no candidate refs
- no Evidence/EVEidence writes
- no Watch cadence mutation
- no dispatcher/queue/lease runtime

If Overseer wants one more no-write step, pickup-consumer hold contract is acceptable, but it is less informative now because HS472 has already covered the key hold/eligibility posture without starting pickup.

## 2. Persistence-First Assessment

Persistence-first would prove facts the read-only projections cannot prove:

- one-open-stub behavior can survive write/upsert semantics
- duplicate same-Watch open work can be suppressed idempotently
- same `watch_run_id` mismatch can be rejected before persistence
- overlapping systems across different Watches can coexist as separate bucket items
- stale missed intervals can collapse to one persisted/open item
- open/settled/cancelled-like fixture states can be represented without touching Watch cadence
- a disposable table can avoid reusing `fetch_runs` or `discovered_killmail_refs`

What it risks hardening too early:

- accidental table/column doctrine
- premature status vocabulary
- a production-looking `watch_run_id` format
- conflating "bucket open" with Discovery pickup or provider movement
- making the fixture table look like accepted schema

Risk control:

The fixture must label all persistence as disposable and internal to the proof. It should not update `src/main/db/schema.sql`, not persist to operator corpus, and not expose the shape as durable product schema.

## 3. Pickup-Consumption-First Assessment

Pickup-consumption-first would prove:

- Discovery-side consumers can distinguish eligible from held candidates
- External I/O off can stop movement without Watch failure
- invalid/suppressed/conflicted rows do not become pickup input
- overlap remains independent at consumer boundary

But HS472 already proved most of this as a bridge:

- `future_pickup_eligible` when External I/O is on
- `held_by_external_io` when External I/O is off
- no Discovery pickup started
- no provider packets
- duplicate-open and integrity rows rejected before pickup

The remaining pickup-consumer proof would be more useful after persistence exists, even disposable persistence, because the consumer then has something closer to a realistic source shape to consume.

What it risks hardening too early:

- consumer contract before bucket persistence identity is proven
- Discovery-facing naming before bucket state words stabilize
- accidental movement toward dispatcher/lease semantics
- treating held rows as Discovery work when they are still only projection rows

## 4. Source / Schema Facts To Inspect Before Next Proof

Before any disposable write fixture, inspect and protect these facts:

- `src/main/db/schema.sql` currently has no Watch bucket table and no product Watch run table.
- `system_watches.watch_id` and `watchlist_entities.watch_id` are Watch source identities, not bucket rows.
- `fetch_runs` is provider/Evidence collection run memory and must not become Watch bucket state.
- `discovered_killmail_refs` is candidate-ref acquisition memory and must not become pre-acquisition Watch bucket state.
- `discovered_killmail_refs` primary key is `killmail_id + killmail_hash + discovered_by_type + discovered_by_id`, which is too late and too provider-result-shaped for Watch bucket identity.
- HS470 service `watchBucketIdentityProjectionService` already has fixture rows for candidate/suppression/conflict/error behavior.
- HS472 service `watchBucketPickupPostureBridgeService` already has fixture rows for pickup eligible / held / rejected-before-pickup posture.
- `serviceRegistry` classifies the existing commands as read-only preview surfaces.

The disposable persistence proof should reuse HS470 fixture concepts and source-test with current schema snapshots, but it should not modify current schema.

## 5. Recommended Next Fixture Cases

For disposable Watch bucket persistence fixture:

1. Insert one valid projected candidate:
   - one open disposable bucket row appears.

2. Insert same Watch / same open identity again:
   - idempotent no-op or upsert.
   - still one open row.

3. Insert same Watch / different open identity:
   - integrity conflict.
   - no second open row.

4. Insert same `watch_run_id` with mismatched scope/provenance:
   - integrity error.
   - rejected before persistence or rolled back within disposable fixture.

5. Insert stale Watch with missed intervals:
   - one current open row only.
   - zero catch-up rows.

6. Insert overlapping system scopes for different Watch IDs:
   - both rows can coexist.
   - shared systems do not merge identity.

7. External I/O off:
   - row may persist/open in disposable fixture.
   - no provider packets.
   - no Discovery pickup.
   - no failure state.

8. Invalid/not-due/inactive/backoff source rows:
   - no persisted bucket row.

9. Boundary table check:
   - no `fetch_runs` row created.
   - no `discovered_killmail_refs` row created.
   - no `killmails`, `activity_events`, `api_request_logs`, warnings, or Watch cadence rows mutated.

## 6. Acceptance Criteria For Recommended Proof

The disposable persistence fixture is trustworthy if:

- it is explicitly disposable/fixture-only
- it does not update `src/main/db/schema.sql`
- it does not create or mutate operator corpus data
- it uses a temporary/in-memory fixture table or equivalent isolated fixture mechanism
- it proves one-open-stub per `watch_id`
- it proves overlap allowed across different Watch IDs
- it proves duplicate same-Watch open work is idempotent/suppressed
- it proves mismatched same-Watch open work is an integrity conflict
- it proves same-`watch_run_id` mismatch is an integrity error
- it proves External I/O closed does not block bucket persistence and does not start provider movement
- it reports zero providers, zero Discovery pickup, zero candidate refs, zero Evidence/EVEidence writes, zero Watch cadence mutations
- it explicitly reports `fetch_runs_as_bucket_state: false`
- it explicitly reports `discovered_killmail_refs_as_bucket_state: false`
- it does not expose the fixture schema as accepted durable product schema

## 7. Risks / Things To Avoid

Avoid:

- production schema migration
- durable product bucket table
- broad queue/lease/dispatcher design
- using `fetch_runs` as bucket rows
- using `discovered_killmail_refs` as pre-acquisition bucket rows
- writing candidate refs or Evidence/EVEidence
- treating External I/O off as failure
- mutating Watch cadence when a row persists
- naming disposable fixture statuses as final product statuses
- creating a Discovery pickup consumer in the same proof
- overloading `watch_run_id` format as final generation doctrine

Naming cautions:

- Prefer `disposable_bucket_row_fixture`, `fixture_open_state`, and `projected_persistence_result`.
- Avoid unqualified `bucket_row` if it reads as production state.
- Use `held_by_external_io` only as pickup/provider movement posture, not as persisted Watch bucket status.

## 8. ADR Or Documentation Updates Needed

No ADR-0007 amendment is needed before the next proof.

ADR-0007 already captures:

- Watch emission separate from provider movement
- one-open-run identity
- bucket identity is Watch-run based, not system based
- killmail dedupe with provenance overlap
- `fetch_runs` and `discovered_killmail_refs` are not Watch buckets

If the disposable fixture reveals that one-open-stub persistence needs a materially different identity rule, update ADR-0007 later. Do not amend before proof.

## 9. Clear Yes / No On Next Dev Seam

Yes: the next Dev seam is ready if it is a disposable Watch bucket persistence fixture with the boundaries above.

No: it is not ready for durable schema, production bucket rows, Discovery pickup, provider movement, Watch cadence mutation, dispatcher/lease behavior, or Evidence/EVEidence changes.

## 10. Verification / Evidence Used

Files read:

- `workspace/current.md`
- `workspace/OverseerHS474-watch-bucket-next-seam-assurance-request.md`
- `workspace/DevHS470-watch-bucket-identity-projection.md`
- `workspace/OverseerHS471-hs470-watch-bucket-identity-projection-review.md`
- `workspace/DevHS472-watch-bucket-pickup-posture-bridge.md`
- `workspace/OverseerHS473-hs472-watch-bucket-pickup-posture-bridge-review.md`
- `docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md`
- `src/main/services/watchBucketIdentityProjectionService.js`
- `src/main/services/watchBucketPickupPostureBridgeService.js`
- `src/main/db/schema.sql`
- `src/main/services/serviceRegistry.js` through focused search
- `package.json` through focused search

Commands used:

```txt
Get-Content workspace/current.md | Select-Object -First 120
Get-Content workspace/OverseerHS474-watch-bucket-next-seam-assurance-request.md
Get-ChildItem -Name workspace/*HS470*
Get-ChildItem -Name workspace/*HS471*
Get-ChildItem -Name workspace/*HS472*
Get-ChildItem -Name workspace/*HS473*
Get-Content workspace/DevHS470-watch-bucket-identity-projection.md
Get-Content workspace/OverseerHS471-hs470-watch-bucket-identity-projection-review.md
Get-Content workspace/DevHS472-watch-bucket-pickup-posture-bridge.md
Get-Content workspace/OverseerHS473-hs472-watch-bucket-pickup-posture-bridge-review.md
Get-Content docs/adr/ADR-0007-watch-bucket-and-provenance-preserving-dedupe.md
rg -n "CREATE TABLE|fetch_runs|discovered_killmail_refs|system_watches|watchlist_entities|PRIMARY KEY|UNIQUE|watch_run|bucket" src/main/db/schema.sql src/main/services/watchBucketIdentityProjectionService.js src/main/services/watchBucketPickupPostureBridgeService.js src/main/services/serviceRegistry.js package.json
Get-Content src/main/services/watchBucketIdentityProjectionService.js
Get-Content src/main/services/watchBucketPickupPostureBridgeService.js
Get-Content src/main/db/schema.sql | Select-Object -First 310
Test-Path workspace/ArchitectureDataHS474-watch-bucket-next-seam-assurance.md
```

No code was implemented. No schema, providers, Watch rows, Discovery pickup, candidate refs, Evidence/EVEidence, Hydration, Observation, dispatcher/queue/lease behavior, runtime enforcement, UI, source terms, or protected-word files were changed.
