# DevHS487 Discovery Pickup Selection Contract

Status: ready for Overseer review

## Scope

Implemented a read-only, contract-only Discovery pickup selection proof over eligible product Watch bucket pickup readout rows.

New read-only command:

```txt
discovery.pickup_selection_contract.preview
```

The command shapes eligible product bucket readout rows into future Discovery pickup selection candidates. It does not start Discovery pickup, create pickup units, create leases, create queue items, dispatch work, create provider packets, write refs, write Evidence/EVEidence, write Hydration, mutate Watch cadence, mutate bucket status, mutate receipts, or change UI.

## Files Changed

```txt
package.json
scripts/verify-command-authority.js
scripts/verify-discovery-pickup-selection-contract.js
scripts/verify-enforcement-dry-run.js
scripts/verify-passive-side-effects.js
scripts/verify-service-registry.js
src/main/services/discoveryPickupSelectionContractService.js
src/main/services/enforcementDryRunService.js
src/main/services/serviceRegistry.js
workspace/current.md
workspace/DevHS487-discovery-pickup-selection-contract.md
```

No schema file was changed for HS487.

## Service / Report Surface

Registered renderer-eligible read-only service command:

```txt
discovery.pickup_selection_contract.preview
```

Coverage metadata:

```txt
storage_action_class: local_db_inspection
external_io_dependency: none
runtime_context: discovery_pickup_selection_contract_readout
enforcement_status: read_only_non_enforcing_proof
```

The command reads HS485 product pickup readout rows from `watch_bucket_items` by default. Trusted non-renderer supplied readout rows can be used for internal proof shape, but renderer-supplied rows are not authoritative.

## Selection Shape

Selected rows are emitted as:

```txt
selected_future_discovery_pickup_input
```

Selected candidate preserves:

```txt
bucket_item_id
watch_run_id
watch_type
watch_id
source_kind
bucket_status
accepted_scope
scope_posture
window
caps
provenance
provider_posture_basis
```

Excluded rows report:

```txt
held_by_external_io
rejected_before_pickup_consumption
not_pickup_input
not_future_pickup_eligible
```

## Sample Output

```json
{
  "status": "Discovery pickup selection contract verified",
  "command": "discovery.pickup_selection_contract.preview",
  "external_io_on_summary": {
    "product_readout_row_count": 7,
    "selected_candidate_count": 3,
    "excluded_row_count": 4,
    "held_excluded_count": 0,
    "rejected_excluded_count": 2,
    "not_input_excluded_count": 2,
    "actor_excluded_count": 1,
    "non_open_excluded_count": 1,
    "malformed_or_missing_scope_excluded_count": 2,
    "independent_overlap_count": 1,
    "pickup_units_created": 0,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "candidate_refs_written": 0,
    "discovery_refs_written": false,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0
  },
  "external_io_off_summary": {
    "product_readout_row_count": 7,
    "selected_candidate_count": 0,
    "excluded_row_count": 7,
    "held_excluded_count": 3,
    "rejected_excluded_count": 2,
    "not_input_excluded_count": 2,
    "pickup_units_created": 0,
    "provider_packets": 0,
    "discovery_pickup_started": false,
    "candidate_refs_written": 0,
    "discovery_refs_written": false,
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

- Eligible product bucket readout rows can become Discovery pickup selection candidates.
- Selection candidates preserve Watch/run/scope/window/cap/provenance basis.
- Selection candidates are future Discovery pickup input only.
- Held rows are not selected.
- Invalid/rejected rows are not selected.
- Actor rows are not selected.
- Non-open rows are not selected.
- Malformed/missing accepted scope rows are not selected.
- Overlapping Watch scopes remain independent selected candidates when both are eligible.
- Renderer-supplied readout rows are not authoritative.
- No provider packet or pickup unit is created.
- No bucket row is mutated.
- No receipt is mutated.
- No candidate ref or Discovery ref is written.
- No Evidence/EVEidence, Hydration, Observation, Watch cadence, dispatcher, lease, queue, enforcement, or UI behavior is opened.

## Verification

```txt
node --check src\main\services\discoveryPickupSelectionContractService.js
node --check scripts\verify-discovery-pickup-selection-contract.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-pickup-selection-contract
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- Syntax checks passed.
- Focused Discovery pickup selection contract verifier passed.
- Service registry verifier passed.
- Command authority verifier passed.
- Passive side-effect verifier passed.
- Enforcement dry-run verifier passed with 125/125 commands covered and no gaps.

Final hygiene:

```txt
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git diff -- src\main\db\schema.sql` returned no diff.
- `git status --short --branch` showed `main...origin/main` with HS485/HS487 touched files and the active workspace runway/review files.

## Boundary Confirmation

- Read-only selection contract only.
- No schema changes.
- No Discovery pickup execution.
- No pickup units.
- No leases.
- No dispatcher runtime.
- No queue runtime.
- No durable Discovery task table.
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

- This is a selection contract, not pickup authority. It does not define leases, queue runtime, dispatcher scheduling, provider packet creation, candidate-ref persistence, or receipt settlement.
- The selected candidate shape intentionally carries provider posture basis but no provider route packet. A later packet should decide the exact provider packet/Discovery task contract before movement.
- Actor rows remain parked as unsupported selection input.

## Recommended Next Action

Overseer review HS487 for acceptance or redirect. A later packet can decide whether to prove a no-provider pickup unit boundary or provider-route packet preview, but live provider movement, leases, candidate refs, Discovery refs, and receipt mutation should remain closed until explicitly opened.
