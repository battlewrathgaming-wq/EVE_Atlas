# DevHS485 Product Watch Bucket Pickup Readout

Status: ready for Overseer review

## Scope

Implemented the smallest read-only product Watch bucket pickup readout over real `watch_bucket_items` rows.

New read-only command:

```txt
watch.bucket_product_pickup_readout.preview
```

The command inspects product bucket rows and classifies future Discovery pickup posture. It does not start Discovery pickup, create provider packets, mutate bucket lifecycle status, mutate receipts, write refs, write Evidence/EVEidence, write Hydration, mutate Watch cadence, or change UI.

## Files Changed

```txt
package.json
scripts/verify-command-authority.js
scripts/verify-enforcement-dry-run.js
scripts/verify-passive-side-effects.js
scripts/verify-service-registry.js
scripts/verify-watch-bucket-product-pickup-readout.js
src/main/db/watchBucketRepository.js
src/main/services/enforcementDryRunService.js
src/main/services/serviceRegistry.js
src/main/services/watchBucketProductPickupReadoutService.js
workspace/current.md
workspace/DevHS485-product-watch-bucket-pickup-readout.md
```

No schema file was changed for HS485.

## Service / Report Surface

Registered renderer-eligible read-only service command:

```txt
watch.bucket_product_pickup_readout.preview
```

Coverage metadata:

```txt
storage_action_class: local_db_inspection
external_io_dependency: none
runtime_context: watch_bucket_product_pickup_readout
enforcement_status: read_only_non_enforcing_proof
```

The repository gained a read method:

```txt
WatchBucketRepository.listItems()
```

## Classification Shape

Product rows classify as:

```txt
future_pickup_eligible
held_by_external_io
rejected_before_pickup_consumption
not_pickup_input
```

Rules proven:

- open `system_radius` / `watch_system_radius` rows with valid accepted stored scope become `future_pickup_eligible` when External I/O is on
- the same rows become `held_by_external_io` when External I/O is off
- actor rows become `not_pickup_input`
- non-open rows become `not_pickup_input`
- malformed or missing accepted scope becomes `rejected_before_pickup_consumption`
- overlapping valid system/radius rows remain independent readout rows
- `held_by_external_io` is posture only, not bucket status and not persisted `pickup_posture`

## Sample Output

```json
{
  "status": "Watch bucket product pickup readout verified",
  "command": "watch.bucket_product_pickup_readout.preview",
  "external_io_on_summary": {
    "product_bucket_row_count": 7,
    "open_system_radius_row_count": 5,
    "future_pickup_eligible_count": 3,
    "held_by_external_io_count": 0,
    "rejected_before_pickup_consumption_count": 2,
    "not_pickup_input_count": 2,
    "unsupported_actor_row_count": 1,
    "non_open_row_count": 1,
    "malformed_or_missing_scope_count": 2,
    "independent_overlap_count": 1,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0
  },
  "external_io_off_summary": {
    "future_pickup_eligible_count": 0,
    "held_by_external_io_count": 3,
    "rejected_before_pickup_consumption_count": 2,
    "not_pickup_input_count": 2,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0
  }
}
```

Boundary table proof:

```txt
watch_bucket_items before: 7
watch_bucket_items after: 7
all tracked product table counts unchanged: true
```

## Acceptance Proof

- Product `watch_bucket_items` rows are inspected without mutation.
- Open system/radius rows can be classified for future pickup eligibility.
- External I/O off reports `held_by_external_io` as provider movement posture.
- External I/O on reports `future_pickup_eligible` for valid open rows.
- Unsupported actor rows do not become pickup eligible.
- Non-open rows do not become pickup eligible.
- Malformed/missing scope rows are rejected before pickup consumption.
- No bucket lifecycle status is changed by the readout.
- `held_by_external_io` is not persisted as lifecycle status or `pickup_posture`.
- No Discovery pickup starts.
- No provider packets are created.
- No Discovery refs, candidate refs, Evidence/EVEidence, Hydration, Observation, Watch cadence, receipt, or UI side effects occur.

## Verification

```txt
node --check src\main\db\watchBucketRepository.js
node --check src\main\services\watchBucketProductPickupReadoutService.js
node --check scripts\verify-watch-bucket-product-pickup-readout.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:watch-bucket-product-pickup-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- Syntax checks passed.
- Focused product Watch bucket pickup readout verifier passed.
- Service registry verifier passed.
- Command authority verifier passed.
- Passive side-effect verifier passed.
- Enforcement dry-run verifier passed with 124/124 commands covered and no gaps.

Final hygiene:

```txt
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git diff -- src\main\db\schema.sql` returned no diff.
- `git status --short --branch` showed `main...origin/main` with HS485-touched files plus pre-existing workspace/current, workspace/overview, and HS485 runway workspace changes.

## Boundary Confirmation

- Read-only product bucket row inspection only.
- No schema changes.
- No Discovery pickup execution.
- No leases.
- No dispatcher runtime.
- No queue runtime.
- No provider packets.
- No zKill calls.
- No ESI calls.
- No candidate refs.
- No Discovery ref writes.
- No Evidence/EVEidence writes.
- No Hydration.
- No Observation/reporting behavior.
- No Watch cadence mutation.
- No Watch bucket status mutation.
- No receipt mutation.
- No UI.
- No actor Watch migration.
- No `collectActorWatch(...)` retirement.
- No system/radius collector redirect.
- No source-term rename.
- No protected-word JSON update.

## Risks / Notes

- This readout is future pickup posture only. It is not Discovery pickup authority, lease ownership, queue runtime, provider dispatch, or receipt settlement.
- Actor bucket rows remain parked as unsupported pickup input even though the product table reserves future actor shape.
- Scope validation is intentionally minimal and tied to current accepted stored-system scope facts. Later Discovery pickup may need a stronger provider-route packet contract before execution.

## Recommended Next Action

Overseer review HS485 for acceptance or redirect. A later packet can decide whether to add a Discovery pickup selection contract over these product readout rows, but provider movement, leases, candidate refs, and receipt mutation should stay closed until explicitly opened.
