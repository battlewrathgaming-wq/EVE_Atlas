# DevHS493 Discovery Dispatcher Lease Boundary Preview

Status: ready for Overseer review

## Scope

Implemented a read-only Discovery dispatcher/lease boundary preview over accepted HS491 pickup execution boundary packets.

New read-only command:

```txt
discovery.dispatcher_lease_boundary.preview
```

The command starts from HS491 boundary packets and classifies future lease candidacy only. It does not start dispatcher runtime, create queue rows, create lease rows, claim leases, execute pickup, create executable provider packets, call providers, write candidate refs, write Discovery refs, write Evidence/EVEidence, write Hydration, mutate Watch cadence, mutate bucket status, mutate receipts, change schema, enforce runtime decisions, or change UI.

## Files Changed

```txt
package.json
scripts/verify-command-authority.js
scripts/verify-discovery-dispatcher-lease-boundary-preview.js
scripts/verify-enforcement-dry-run.js
scripts/verify-passive-side-effects.js
scripts/verify-service-registry.js
src/main/services/discoveryDispatcherLeaseBoundaryPreviewService.js
src/main/services/enforcementDryRunService.js
src/main/services/serviceRegistry.js
workspace/current.md
workspace/DevHS493-discovery-dispatcher-lease-boundary-preview.md
```

No schema file was changed for HS493.

## Service / Report Surface

Registered renderer-eligible read-only service command:

```txt
discovery.dispatcher_lease_boundary.preview
```

Coverage metadata:

```txt
storage_action_class: local_db_inspection
external_io_dependency: none
runtime_context: discovery_dispatcher_lease_boundary_preview_readout
enforcement_status: read_only_non_enforcing_proof
```

The command calls the HS491 pickup execution boundary preview path by default. Trusted non-renderer supplied boundary previews can be used for internal proof shape, but renderer-supplied boundary previews are not authoritative.

## Preview Output

Each eligible HS491 boundary packet becomes:

```txt
lease_candidate_preview_not_leased
```

Each lease candidate preserves:

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

Each lease candidate reports future facts only:

```txt
future_lease_identity
future_lease_owner_required
future_lease_expires_at_required
future_retry_after_basis
future_provider_pacing_basis
future_expired_lease_recovery_basis
```

Held, rejected, malformed, not-input, actor, and non-open rows remain exclusions and do not enter lease candidacy.

## Sample Output

Focused verifier summary:

```json
{
  "status": "Discovery dispatcher lease boundary preview verified",
  "command": "discovery.dispatcher_lease_boundary.preview",
  "external_io_on_summary": {
    "source_pickup_execution_boundary_packet_count": 5,
    "lease_candidate_count": 5,
    "not_leased_candidate_count": 5,
    "one_accepted_system_id_maps_to_one_lease_candidate": true,
    "external_io_hold_before_lease_candidacy": false,
    "excluded_row_count": 4,
    "future_lease_owner_required_count": 5,
    "future_lease_expires_at_required_count": 5,
    "future_retry_after_basis_count": 5,
    "future_provider_pacing_basis_count": 5,
    "future_expired_lease_recovery_basis_count": 5,
    "provider_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0,
    "executable_provider_packets_created": 0,
    "dispatcher_runtime_started": false,
    "queue_items_created": 0,
    "leases_created": 0,
    "lease_claims_created": 0,
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
    "source_pickup_execution_boundary_packet_count": 0,
    "lease_candidate_count": 0,
    "external_io_hold_before_lease_candidacy": true,
    "excluded_row_count": 7,
    "held_excluded_count": 3,
    "provider_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0
  }
}
```

Sample lease candidate:

```json
{
  "lease_boundary_status": "lease_candidate_preview_not_leased",
  "lease_candidate": true,
  "lease_status": "not_leased",
  "preview_only": true,
  "executable_now": false,
  "dispatchable_now": false,
  "lease_row_exists": false,
  "lease_claimed": false,
  "lease_claim_created": false,
  "provider_call_started": false,
  "provider": "zkillboard",
  "provider_route_family": "zkill_system_killmails",
  "packet_identity": "preview-zkill-system:watch-run-system_radius-1:30003597",
  "bucket_item_id": "bucket-system_radius-1",
  "watch_run_id": "watch-run-system_radius-1",
  "watch_id": 1,
  "system_id": 30003597,
  "accepted_scope_execution_authority": "stored_included_system_ids",
  "future_lease_identity": {
    "status": "future_identity_basis_only_not_persisted",
    "basis_fields": [
      "packet_identity",
      "bucket_item_id",
      "watch_run_id",
      "provider_route_family",
      "system_id"
    ],
    "persisted": false
  },
  "future_lease_owner_required": true,
  "future_lease_expires_at_required": true,
  "future_lease_claim_status": "future_required_not_opened",
  "future_dispatcher_status": "future_required_not_started",
  "future_queue_status": "future_required_not_created",
  "future_provider_movement_status": "not_opened_by_lease_boundary_preview"
}
```

## Acceptance Proof

- HS491 boundary packets can be classified as future dispatcher/lease candidates.
- One accepted included system ID remains one not-leased lease candidate when External I/O is on.
- Route packet identity, Watch/run/bucket/scope/window/cap/provenance/source-selection basis is preserved.
- Every lease candidate is explicitly not leased, not executable now, not dispatchable now, and has no lease row or claim.
- Future lease facts are named without persisting them: identity basis, owner requirement, expiry requirement, retry/provider eligibility basis, provider pacing basis, and expired/abandoned lease recovery basis.
- External I/O closed remains a hold before lease candidacy.
- Held-by-External-I/O rows do not enter lease candidacy.
- Malformed/rejected/not-input rows do not enter lease candidacy.
- Renderer-supplied boundary previews are not authoritative.
- No dispatcher runtime, queue item, durable queue row, lease row, lease claim, provider call, zKill call, ESI call, executable provider packet, candidate ref, Discovery ref, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema change, enforcement, or UI behavior occurs.

## Verification

```txt
node --check src\main\services\discoveryDispatcherLeaseBoundaryPreviewService.js
node --check scripts\verify-discovery-dispatcher-lease-boundary-preview.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-dispatcher-lease-boundary-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- Syntax checks passed.
- Focused Discovery dispatcher/lease boundary preview verifier passed.
- Service registry verifier passed.
- Command authority verifier passed.
- Passive side-effect verifier passed.
- Enforcement dry-run verifier passed with 128/128 commands covered and no gaps.

Final hygiene:

```txt
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git diff -- src\main\db\schema.sql` returned no diff.
- `git status --short --branch` showed `main...origin/main` with HS485/HS487/HS489/HS491/HS493 touched files and active workspace runway/review files.

## Boundary Confirmation

- Read-only dispatcher/lease boundary preview only.
- No schema changes.
- No Discovery pickup execution.
- No executable provider packets.
- No dispatcher runtime.
- No dispatcher loop.
- No queue runtime.
- No durable queue rows.
- No durable leases.
- No lease claims.
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

- No unexpected runtime coupling was required. The preview composes over HS491 output and does not need dispatcher workers, durable queues, durable leases, provider responses, candidate refs, receipts, or schema changes.
- The next complexity remains intentionally unopened: actual dispatcher ownership, lease persistence, claim/expiry/recovery semantics, provider pacing/backoff policy, candidate-ref write handling, and receipt settlement.

## Recommended Next Action

Overseer review HS493 for acceptance or redirect. A later seam can decide whether to prove durable lease/queue fixture semantics, candidate-ref landing, or provider pacing, still before any live zKill/ESI movement.
