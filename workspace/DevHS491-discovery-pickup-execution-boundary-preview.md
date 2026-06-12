# DevHS491 Discovery Pickup Execution Boundary Preview

Status: ready for Overseer review

## Scope

Implemented a read-only Discovery pickup execution boundary preview over accepted HS489 provider-route packet previews.

New read-only command:

```txt
discovery.pickup_execution_boundary.preview
```

The command starts from HS489 route packet previews and classifies what each packet would require before provider execution. It does not execute pickup, create executable provider packets, start dispatcher runtime, create leases, create queues, call providers, write candidate refs, write Discovery refs, write Evidence/EVEidence, write Hydration, mutate Watch cadence, mutate bucket status, mutate receipts, change schema, or change UI.

## Files Changed

```txt
package.json
scripts/verify-command-authority.js
scripts/verify-discovery-pickup-execution-boundary-preview.js
scripts/verify-enforcement-dry-run.js
scripts/verify-passive-side-effects.js
scripts/verify-service-registry.js
src/main/services/discoveryPickupExecutionBoundaryPreviewService.js
src/main/services/enforcementDryRunService.js
src/main/services/serviceRegistry.js
workspace/current.md
workspace/DevHS491-discovery-pickup-execution-boundary-preview.md
```

No schema file was changed for HS491.

## Service / Report Surface

Registered renderer-eligible read-only service command:

```txt
discovery.pickup_execution_boundary.preview
```

Coverage metadata:

```txt
storage_action_class: local_db_inspection
external_io_dependency: none
runtime_context: discovery_pickup_execution_boundary_preview_readout
enforcement_status: read_only_non_enforcing_proof
```

The command calls the HS489 provider-route packet preview path by default. Trusted non-renderer supplied route previews can be used for internal proof shape, but renderer-supplied route previews are not authoritative.

## Preview Output

Each HS489 route packet preview becomes:

```txt
execution_boundary_preview_not_executed
```

Each boundary packet preserves:

```txt
packet_identity
bucket_item_id
watch_run_id
watch_type
watch_id
source_kind
accepted_scope
system_id
window
caps
provenance
source_selection_basis
zkill_route
```

Each boundary packet reports future prerequisites:

```txt
requires_external_io_open: true
requires_future_dispatcher_ownership: true
requires_future_lease_claim_semantics: true
requires_future_provider_pacing: true
requires_future_zkill_candidate_ref_write_handling: true
```

Held, rejected, malformed, not-input, actor, and non-open rows remain exclusions and do not enter executable packet posture.

## Sample Output

Focused verifier summary:

```json
{
  "status": "Discovery pickup execution boundary preview verified",
  "command": "discovery.pickup_execution_boundary.preview",
  "external_io_on_summary": {
    "source_route_packet_preview_count": 5,
    "pickup_execution_boundary_packet_count": 5,
    "not_executed_packet_count": 5,
    "one_accepted_system_id_maps_to_one_boundary_packet": true,
    "requires_external_io_open_count": 5,
    "requires_future_dispatcher_ownership_count": 5,
    "requires_future_lease_claim_semantics_count": 5,
    "requires_future_provider_pacing_count": 5,
    "requires_future_zkill_candidate_ref_write_handling_count": 5,
    "excluded_row_count": 4,
    "provider_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0,
    "executable_provider_packets_created": 0,
    "pickup_units_created": 0,
    "leases_created": 0,
    "queue_items_created": 0,
    "candidate_refs_written": 0,
    "discovery_refs_written": false,
    "evidence_eveidence_writes": 0,
    "hydration_writes": 0,
    "watch_cadence_mutations": 0,
    "receipt_mutations": 0,
    "watch_bucket_status_mutations": 0,
    "schema_changes": 0
  },
  "external_io_off_summary": {
    "source_route_packet_preview_count": 0,
    "pickup_execution_boundary_packet_count": 0,
    "excluded_row_count": 7,
    "held_excluded_count": 3,
    "provider_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0
  }
}
```

Sample boundary packet:

```json
{
  "execution_boundary_status": "execution_boundary_preview_not_executed",
  "execution_status": "not_executed",
  "preview_only": true,
  "executable_now": false,
  "executable_provider_packet": false,
  "dispatchable_now": false,
  "lease_claimed": false,
  "provider_call_started": false,
  "provider": "zkillboard",
  "provider_route_family": "zkill_system_killmails",
  "route_intent": "candidate_lead_acquisition",
  "packet_identity": "preview-zkill-system:watch-run-system_radius-1:30003597",
  "bucket_item_id": "bucket-system_radius-1",
  "watch_run_id": "watch-run-system_radius-1",
  "watch_id": 1,
  "system_id": 30003597,
  "accepted_scope_execution_authority": "stored_included_system_ids",
  "requires_external_io_open": true,
  "requires_future_dispatcher_ownership": true,
  "requires_future_lease_claim_semantics": true,
  "requires_future_provider_pacing": true,
  "requires_future_zkill_candidate_ref_write_handling": true,
  "candidate_ref_write_handling_status": "future_required_not_opened",
  "future_provider_movement_status": "not_opened_by_boundary_preview"
}
```

## Acceptance Proof

- HS489 route packet previews can be classified at the pre-provider execution boundary.
- One accepted included system ID remains one boundary packet.
- Route packet identity, Watch/run/bucket/scope/window/cap/provenance/source-selection basis is preserved.
- Every boundary packet is explicitly not executed, not executable now, not dispatchable now, and not leased.
- Every boundary packet reports the future need for External I/O open, dispatcher ownership, lease/claim semantics, provider pacing, and zKill candidate-ref write handling.
- Held-by-External-I/O rows do not enter executable packet posture.
- Malformed/rejected/not-input rows do not enter executable packet posture.
- Renderer-supplied route previews are not authoritative.
- No provider calls, zKill calls, ESI calls, executable provider packets, pickup units, leases, queues, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema change, enforcement, or UI behavior occurs.

## Verification

```txt
node --check src\main\services\discoveryPickupExecutionBoundaryPreviewService.js
node --check scripts\verify-discovery-pickup-execution-boundary-preview.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-pickup-execution-boundary-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- Syntax checks passed.
- Focused Discovery pickup execution boundary preview verifier passed.
- Service registry verifier passed.
- Command authority verifier passed.
- Passive side-effect verifier passed.
- Enforcement dry-run verifier passed with 127/127 commands covered and no gaps.

Final hygiene:

```txt
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git diff -- src\main\db\schema.sql` returned no diff.
- `git status --short --branch` showed `main...origin/main` with HS485/HS487/HS489/HS491 touched files and active workspace runway/review files.

## Boundary Confirmation

- Read-only pickup execution boundary preview only.
- No schema changes.
- No Discovery pickup execution.
- No executable provider packets.
- No pickup units.
- No leases.
- No dispatcher runtime.
- No queue runtime.
- No durable Discovery task table.
- No provider calls.
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

## Unexpected Coupling / Notes

- No unexpected runtime coupling was required. The preview composes over HS489 output and does not need provider responses, schema, durable pickup rows, leases, queues, candidate refs, or receipts.
- The next real complexity remains policy/mechanics that are intentionally not opened here: dispatcher ownership, lease/claim identity, provider pacing/backoff, candidate-ref write handling, and receipt settlement.

## Recommended Next Action

Overseer review HS491 for acceptance or redirect. A later seam can decide whether to prove dispatcher/lease identity, candidate-ref landing, or provider-pacing policy, still before any live zKill/ESI movement.
