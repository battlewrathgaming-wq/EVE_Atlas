# DevHS478 Discovery Pickup Consumer Hold Contract

Status: ready for Overseer review

## Scope

Implemented a fixture-only/read-only Discovery pickup consumer hold contract proof for disposable Watch bucket fixture rows.

Command added:

```txt
discovery.pickup_consumer_hold_contract.preview
```

The proof classifies disposable open rows as:

- `future_pickup_eligible` when External I/O is on
- `held_by_external_io` when External I/O is off
- `not_pickup_input_duplicate_idempotent_result` for duplicate/idempotent result rows
- `rejected_before_pickup_consumption` for integrity conflict/error and rejected source rows

`held_by_external_io` is reported as provider movement hold only. It is not Watch failure and not persisted bucket status.

## Files Changed

```txt
package.json
scripts/verify-command-authority.js
scripts/verify-discovery-pickup-consumer-hold-contract.js
scripts/verify-enforcement-dry-run.js
scripts/verify-passive-side-effects.js
scripts/verify-service-registry.js
src/main/services/discoveryPickupConsumerHoldContractService.js
src/main/services/enforcementDryRunService.js
src/main/services/serviceRegistry.js
workspace/current.md
workspace/DevHS478-discovery-pickup-consumer-hold-contract.md
```

## Service / Report Surface

Registered renderer-eligible read-only service command:

```txt
discovery.pickup_consumer_hold_contract.preview
```

Coverage metadata:

```txt
storage_action_class: local_db_inspection
external_io_dependency: none
runtime_context: discovery_pickup_consumer_hold_contract_readout
enforcement_status: read_only_non_enforcing_proof
```

## Sample Output

```json
{
  "status": "Discovery pickup consumer hold contract verified",
  "command": "discovery.pickup_consumer_hold_contract.preview",
  "external_io_on_summary": {
    "disposable_open_row_count": 5,
    "contract_row_count": 12,
    "future_pickup_eligible_count": 5,
    "held_by_external_io_count": 0,
    "duplicate_idempotent_result_count": 1,
    "integrity_conflict_or_error_count": 2,
    "rejected_source_row_count": 4,
    "rejected_before_pickup_consumption_count": 7,
    "independent_overlap_count": 10,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "discovery_pickup_packets_created": 0,
    "leases_created": 0,
    "queue_items_created": 0,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "watch_cadence_mutations": 0
  },
  "external_io_off_summary": {
    "disposable_open_row_count": 5,
    "contract_row_count": 12,
    "future_pickup_eligible_count": 0,
    "held_by_external_io_count": 5,
    "duplicate_idempotent_result_count": 1,
    "integrity_conflict_or_error_count": 2,
    "rejected_source_row_count": 4,
    "rejected_before_pickup_consumption_count": 7,
    "independent_overlap_count": 10,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "discovery_pickup_packets_created": 0,
    "leases_created": 0,
    "queue_items_created": 0,
    "candidate_refs_written": 0,
    "evidence_eveidence_writes": 0,
    "watch_cadence_mutations": 0
  }
}
```

## Behavior Proven

- Open disposable fixture row plus External I/O on becomes future pickup eligible, but no pickup starts.
- Open disposable fixture row plus External I/O off becomes `held_by_external_io`.
- Duplicate/idempotent result rows do not create additional pickup units.
- Integrity conflict/error/rejected rows do not become pickup input.
- Overlapping open rows from different Watches remain independent pickup candidates or holds.
- Provider packet count remains zero.
- Discovery pickup started remains false.
- Lease/queue/dispatcher behavior remains false.
- Candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence, and product tables remain untouched.

## Boundary Confirmation

- Fixture/contract only.
- No `src/main/db/schema.sql` update.
- No operator corpus mutation.
- No production bucket consumption.
- No Discovery pickup start.
- No provider packets.
- No candidate refs or Evidence/EVEidence writes.
- No Watch cadence mutations.
- No lease, queue, dispatcher, schema, runtime enforcement, command blocking, UI, source-term rename, or protected-word JSON update.
- `held_by_external_io` remains provider movement hold, not Watch failure or persisted bucket status.

## Verification

```txt
node --check src\main\services\discoveryPickupConsumerHoldContractService.js
node --check scripts\verify-discovery-pickup-consumer-hold-contract.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-pickup-consumer-hold-contract
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- Syntax checks passed.
- Focused HS478 verifier passed.
- Service registry verifier passed.
- Command authority verifier passed.
- Passive side-effect verifier passed.
- Enforcement dry-run verifier passed with 122/122 commands covered and no gaps.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git diff -- src/main/db/schema.sql` returned no diff.
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS478 files.

## Risks / Notes

- This is still fixture/contract proof only. It does not consume production bucket rows or define product bucket schema.
- The command is renderer-eligible because it is read-only and non-enforcing; it treats renderer-supplied rows as fixture input only.
- Future implementation still needs an explicit product bucket schema/runtime pickup runway before any real Discovery pickup, lease, queue, provider movement, or ref writing is opened.

## Recommended Next Action

Overseer review HS478 for acceptance or redirect, then decide whether the next seam remains contract/readout proof or opens a separate product-schema/runtime pickup design runway.
