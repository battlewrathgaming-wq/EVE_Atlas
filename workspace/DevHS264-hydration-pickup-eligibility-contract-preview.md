# DevHS264 Hydration Pickup Eligibility Contract Preview

Status: complete for Overseer review

## Summary

Implemented the read-only selected-ID Hydration pickup eligibility / execution-input contract preview.

New command:

```txt
metadata.hydration_pickup_contract.preview
```

The preview rebuilds HS260 request posture from local state and current gate readouts, then emits a non-durable pickup contract only when the rebuilt posture is `provider_needed` and released to normal gates. The output is explanation and future execution-input hints only. It does not execute, persist, dispatch, call providers, or write.

## Files Changed

- `package.json`
- `src/main/services/hydrationPickupContractService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-pickup-contract.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/current.md`
- `workspace/DevHS264-hydration-pickup-eligibility-contract-preview.md`

## Command / Service Shape

`metadata.hydration_pickup_contract.preview` returns:

- rebuilt request posture summary
- pickup contract state
- `pickup_candidate`
- `pickup_eligible_means_execution=false`
- `pickup_eligible_means_authorization=false`
- non-durable / persisted false flags
- future execution input hints
- digest comparison as freshness evidence only
- mandatory revalidation steps
- renderer anti-forgery readout
- explicit zero counters and boundary flags

The service reuses:

- `buildHydrationRequestPosturePreview`
- existing service registry metadata pattern
- enforcement dry-run coverage pattern

## Pickup Candidate States Proven

Rejected as pickup candidates:

```txt
not_a_request
invalid
insufficient_basis
already_local
local_lookup_available
held
blocked
```

Accepted as a non-durable pickup candidate:

```txt
request_posture_state=provider_needed
provider_posture=released_to_normal_gates_only
pickup_candidate=true
state=pickup_candidate
```

This still does not authorize execution, provider calls, or Hydration writes.

## Execution Input Contract Fields

Future execution input hints include:

```txt
id_type
id_value
source_surface
source_context
basis_anchor
basis_layer
request_reason
request_posture_id
request_digest
posture_gate_summary
```

The contract marks these fields as `explanation_only_rebuild_required`. Future execution must rebuild authority from trusted local state and current gates.

## Boundary Confirmation

Confirmed:

- pickup candidate is not execution
- pickup candidate is not authorization
- future execution input is hints/explanation only
- request digest comparison is freshness evidence only
- renderer-supplied local labels, storage posture, External I/O posture, live/cadence posture, gate summary, and pickup eligibility are not authority
- local-first short-circuit must run again before future execution
- no provider calls
- no Hydration execution
- no Hydration writes
- no `metadata_runs` writes
- no entity writes
- no activity-event label patches
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch mutation or arming
- no Assessment Memory or Marked mutation
- no pickup/request/queue/lease/retry persistence
- no dispatcher or worker
- no schema changes
- no runtime enforcement activation
- no command blocking
- no storage config or External I/O config writes
- no support artifact creation
- no renderer UI work

## Verification

Commands run and results:

```txt
node --check src\main\services\serviceRegistry.js
passed

node --check src\main\services\hydrationPickupContractService.js
passed

node --check scripts\verify-hydration-pickup-contract.js
passed

npm.cmd run verify:hydration-pickup-contract
passed

npm.cmd run verify:hydration-request-posture
passed

npm.cmd run verify:service-registry
passed

npm.cmd run verify:command-authority
passed

npm.cmd run verify:enforcement-dry-run
passed

npm.cmd run verify:passive-side-effects
passed

npm.cmd run verify:protected-terms
passed with warning-only advisory output: 261 warnings across 8 changed working-set files; no renames or protected-word JSON updates performed

git diff --check
passed with CRLF normalization warnings only

git status --short --branch
branch main...origin/main with HS264 working-tree changes
```

## Gaps / Follow-Up Seams

Still parked:

- provider-backed selected-ID Hydration execution
- pickup/request persistence
- dispatcher, worker, lease, or retry behavior
- Watch/background Hydration pickup
- schema changes
- renderer UI trigger behavior
- runtime enforcement or command blocking

Recommended next action: Overseer review HS264 and decide whether to continue with another read-only execution-shaping seam or pause before any write-capable selected-ID Hydration design.
