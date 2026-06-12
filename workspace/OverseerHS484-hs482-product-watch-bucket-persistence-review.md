# OverseerHS484 - HS482 Product Watch Bucket Persistence Review

Status: accepted
Date: 2026-06-12
Role: Overseer
Reviewed handoff: `workspace/DevHS482-product-watch-bucket-persistence.md`
Runway: `workspace/OverseerHS482-product-watch-bucket-persistence-runway.md`

## Review Result

HS482 is accepted after one small Overseer correction.

Atlas now has a minimal product `watch_bucket_items` persistence surface for system/radius emitted Watch work identity.

The implementation preserves the intended boundary:

- `fetch_runs` is not used as bucket state.
- `discovered_killmail_refs` is not used as pre-acquisition Watch bucket state.
- Evidence/EVEidence tables are not mutated.
- Watch cadence rows are not mutated by bucket emission.
- External I/O off does not block bucket row creation.
- External I/O off creates no provider packets, Discovery refs, candidate refs, or Evidence/EVEidence writes.
- `held_by_external_io` is not a bucket lifecycle status.
- No Discovery pickup execution, dispatcher/lease runtime, provider movement, Hydration, Observation, UI, actor Watch migration, collector retirement, source-term rename, or protected-word update was opened.

## Correction Made During Review

The landed implementation correctly scoped normal Watch-derived emissions to system/radius Watches, but the trusted local emission-basis path could still accept a future `actor` / `watch_actor` row because the schema intentionally allows future actor rows.

This was corrected before acceptance:

- `src/main/services/watchBucketProductPersistenceService.js` now rejects non-`system_radius` / non-`watch_system_radius` trusted basis rows.
- `scripts/verify-watch-bucket-product-persistence.js` now asserts trusted actor basis is rejected and does not mutate product tables.

This keeps actor Watch migration parked while still allowing the schema to reserve future shape.

## Verification

Ran:

```txt
node --check src\main\services\watchBucketProductPersistenceService.js
node --check scripts\verify-watch-bucket-product-persistence.js
npm.cmd run verify:watch-bucket-product-persistence
npm.cmd run verify:migrations
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:watch-bucket-disposable-persistence-fixture
npm.cmd run verify:discovery-pickup-consumer-hold-contract
npm.cmd run verify:db-integrity
git diff --check
```

Results:

- All listed verification commands passed.
- `verify:service-registry` required a longer timeout but passed.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.

## Accepted State

HS482 establishes local durable Watch bucket identity only.

It does not prove or open:

- Discovery pickup over product bucket rows
- receipt mutation
- provider packets
- zKill / ESI calls
- candidate ref writes
- Evidence/EVEidence writes
- dispatcher / leases / queues
- actor Watch migration
- UI

## Recommended Next Seam

After this push/landing, the next coherent seam is likely:

```txt
read-only product bucket pickup readout / Discovery pickup selection over open bucket rows
```

Do not start provider movement or dispatcher/lease runtime from this acceptance.

