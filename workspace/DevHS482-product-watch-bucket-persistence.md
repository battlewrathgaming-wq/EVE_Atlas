# DevHS482 Product Watch Bucket Persistence

Status: ready for Overseer review

## Scope

Implemented the smallest product Watch bucket persistence surface for system/radius emitted work identity.

New trusted local command:

```txt
watch.bucket_product_persistence.emit
```

This command is not renderer eligible. Bucket rows come from trusted local Watch emission basis, not renderer-authored bucket payloads.

## Files Changed

```txt
package.json
scripts/verify-command-authority.js
scripts/verify-discovery-pickup-consumer-hold-contract.js
scripts/verify-enforcement-dry-run.js
scripts/verify-migrations.js
scripts/verify-service-registry.js
scripts/verify-watch-bucket-disposable-persistence-fixture.js
scripts/verify-watch-bucket-product-persistence.js
src/main/db/schema.sql
src/main/db/watchBucketRepository.js
src/main/services/enforcementDryRunService.js
src/main/services/serviceRegistry.js
src/main/services/watchBucketProductPersistenceService.js
workspace/current.md
workspace/DevHS482-product-watch-bucket-persistence.md
```

## Schema Added

Added product table:

```txt
watch_bucket_items
```

Important fields:

```txt
bucket_item_id
watch_run_id
watch_type
watch_id
source_kind
status
accepted_scope_json
window_json
caps_json
provenance_json
identity_fingerprint
pickup_posture
receipt_summary_json
provider_timing_json
last_error_json
```

Accepted alpha statuses:

```txt
open
settled
cancelled
blocked_integrity
```

One-open-item rule:

```txt
CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_bucket_items_one_open_per_watch
ON watch_bucket_items(watch_type, watch_id)
WHERE status = 'open';
```

`held_by_external_io` is not a bucket lifecycle status.

## Service Behavior

`watch.bucket_product_persistence.emit`:

- derives system/radius emission basis from local `system_watches`
- generates `watch_run_id` in trusted local service/repository logic
- stores accepted stored-scope, window, caps, and provenance snapshots
- creates open `watch_bucket_items` rows even when External I/O is off
- suppresses duplicate emission while an open item already exists
- reports integrity conflict/error readouts without adding extra rows
- reports provider/Discovery/Evidence side effects as zero

The command is registered as:

```txt
classification: metadata-only
effects: local-data-mutation
renderer_allowed: false
storage_action_class: setup_config_changes
external_io_dependency: none
runtime_context: watch_bucket_product_persistence
enforcement_status: covered_local_mutation
```

## Sample Output

```json
{
  "status": "Watch bucket product persistence verified",
  "command": "watch.bucket_product_persistence.emit",
  "first_summary": {
    "emission_basis_count": 5,
    "inserted_open_bucket_item_count": 5,
    "open_bucket_item_count": 5,
    "stale_current_open_item_count": 1,
    "catch_up_rows_created": 0,
    "overlapping_open_item_pairs": 10,
    "watch_bucket_items_delta": 5,
    "provider_packets": 0,
    "discovery_pickup_packets_created": 0,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "watch_cadence_mutations": 0
  },
  "idempotent_summary": {
    "inserted_open_bucket_item_count": 0,
    "idempotent_existing_open_count": 5,
    "watch_bucket_items_delta": 0
  },
  "conflict_summary": {
    "integrity_conflict_count": 1,
    "watch_bucket_items_delta": 0
  },
  "watch_run_id_mismatch_summary": {
    "inserted_open_bucket_item_count": 1,
    "integrity_error_count": 1,
    "watch_bucket_items_delta": 1
  }
}
```

## Acceptance Proof

- `fetch_runs` is not used as bucket state.
- `discovered_killmail_refs` is not used as pre-acquisition Watch bucket state.
- Evidence/EVEidence tables are not mutated.
- A valid system/radius Watch emission basis creates one open bucket item.
- Re-emitting the same Watch while open is idempotent.
- Same Watch with mismatched open identity produces `integrity_conflict_existing_open_bucket_item`.
- Same `watch_run_id` mismatch produces `integrity_error_watch_run_id_mismatch`.
- Overlapping system scopes for different Watches coexist.
- Stale missed intervals collapse to one current open item and create zero catch-up rows.
- External I/O off does not block bucket row creation.
- External I/O off creates no provider packets and no Discovery refs.
- Watch cadence rows are not mutated by bucket emission.
- Renderer IPC cannot forge bucket rows because the command is not renderer eligible.
- Service output reports provider/Discovery/Evidence side effects as zero.

## Verification

```txt
node --check src\main\db\watchBucketRepository.js
node --check src\main\services\watchBucketProductPersistenceService.js
node --check scripts\verify-watch-bucket-product-persistence.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-enforcement-dry-run.js
node --check scripts\verify-migrations.js
node --check scripts\verify-watch-bucket-disposable-persistence-fixture.js
node --check scripts\verify-discovery-pickup-consumer-hold-contract.js
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
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- Syntax checks passed.
- Focused product Watch bucket persistence verifier passed.
- Migration verifier passed.
- Service registry verifier passed.
- Command authority verifier passed.
- Passive side-effect verifier passed.
- Enforcement dry-run verifier passed with 123/123 commands covered and no gaps.
- Previous disposable persistence and Discovery pickup hold contract verifiers passed after their schema-era assertions were updated to reject disposable fixture schema leakage rather than the new product table.
- Database integrity verifier passed.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git diff -- src/main/db/schema.sql` showed only `watch_bucket_items` table/index additions.
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS482 files.

## Boundary Confirmation

- System/radius only.
- Actor Watch migration remains parked.
- No direct/scheduled actor Watch runtime change.
- No `collectActorWatch(...)` retirement.
- No system/radius collector redirect.
- No Discovery pickup execution.
- No provider packets, zKill calls, or ESI calls.
- No candidate refs or Discovery ref writes.
- No Evidence/EVEidence writes.
- No Hydration.
- No Observation/reporting behavior.
- No Watch cadence mutation.
- No lease, dispatcher runtime, or broad queue behavior.
- No runtime enforcement or command blocking.
- No UI.
- No source-term rename or protected-word JSON update.

## Risks / Notes

- The schema is intentionally minimal and includes nullable receipt/provider timing fields only as inert shape for later packets.
- The command writes product `watch_bucket_items`; it does not consume them for Discovery pickup.
- The existing `watch.system_radius_run_stub.preview` still has historical live/API gate language, but HS482 keeps the External I/O boundary correction inside the new bucket persistence service.
- Overseer review found and corrected one boundary leak before acceptance: trusted local emission basis now rejects `actor` / `watch_actor` rows so HS482 remains system/radius-only. The verifier now asserts this rejection and no product table mutation.

## Recommended Next Action

Overseer review HS482 for acceptance or redirect. A later packet can decide whether to add a read-only product bucket pickup readout, Discovery pickup selection over open bucket rows, or receipt mutation semantics.
