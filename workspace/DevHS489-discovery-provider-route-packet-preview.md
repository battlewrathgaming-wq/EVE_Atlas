# DevHS489 Discovery Provider Route Packet Preview

Status: ready for Overseer review

## Scope

Implemented a read-only provider-route packet preview over HS487 Discovery pickup selection candidates.

New read-only command:

```txt
discovery.provider_route_packet.preview
```

The command starts from selected system/radius Discovery pickup candidates and fans each accepted included system ID into one inert zKill route packet preview. It does not start Discovery pickup, create pickup units, create leases, create queues, dispatch work, call zKill/ESI/providers, write refs, write Evidence/EVEidence, write Hydration, mutate Watch cadence, mutate bucket status, mutate receipts, change schema, or change UI.

## Files Changed

```txt
package.json
scripts/verify-command-authority.js
scripts/verify-discovery-provider-route-packet-preview.js
scripts/verify-enforcement-dry-run.js
scripts/verify-passive-side-effects.js
scripts/verify-service-registry.js
src/main/services/discoveryProviderRoutePacketPreviewService.js
src/main/services/enforcementDryRunService.js
src/main/services/serviceRegistry.js
workspace/current.md
workspace/DevHS489-discovery-provider-route-packet-preview.md
```

No schema file was changed for HS489.

## Service / Report Surface

Registered renderer-eligible read-only service command:

```txt
discovery.provider_route_packet.preview
```

Coverage metadata:

```txt
storage_action_class: local_db_inspection
external_io_dependency: none
runtime_context: discovery_provider_route_packet_preview_readout
enforcement_status: read_only_non_enforcing_proof
```

The command reads the HS487 selection contract by default. Trusted non-renderer supplied selection candidates can be used for internal proof shape, but renderer-supplied candidates are not authoritative.

## Packet Shape

Each selected candidate fans out through accepted stored scope:

```txt
one accepted included_system_id -> one preview_only_non_executing zKill route packet
```

Each route packet preserves:

```txt
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
```

Center/radius is emitted only under provenance/explanation:

```txt
center_radius_is_provenance_only: true
center_radius_used_as_execution_authority: false
```

The route shape is structured and inert:

```txt
provider: zkillboard
provider_route_family: zkill_system_killmails
route_intent: candidate_lead_acquisition
path_template: /api/kills/systemID/{system_id}/pastSeconds/{past_seconds}/
structured_route_only: true
arbitrary_modifier_grammar_allowed: false
```

The packets explicitly state they are for later zKill candidate acquisition only, not Evidence expansion and not Hydration.

## Sample Output

Focused verifier summary:

```json
{
  "status": "Discovery provider route packet preview verified",
  "command": "discovery.provider_route_packet.preview",
  "external_io_on_summary": {
    "selected_candidate_count": 3,
    "provider_route_packet_preview_count": 5,
    "packet_preview_count": 5,
    "packet_count_by_candidate": [
      {
        "watch_id": 1,
        "accepted_included_system_count": 2,
        "route_packet_preview_count": 2,
        "creates_provider_packets": false,
        "provider_calls": 0,
        "candidate_refs_written": 0
      },
      {
        "watch_id": 2,
        "accepted_included_system_count": 2,
        "route_packet_preview_count": 2,
        "creates_provider_packets": false,
        "provider_calls": 0,
        "candidate_refs_written": 0
      },
      {
        "watch_id": 3,
        "accepted_included_system_count": 1,
        "route_packet_preview_count": 1,
        "creates_provider_packets": false,
        "provider_calls": 0,
        "candidate_refs_written": 0
      }
    ],
    "excluded_row_count": 4,
    "overlapping_watch_scopes_remain_independent": 1,
    "provider_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0,
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
    "selected_candidate_count": 0,
    "provider_route_packet_preview_count": 0,
    "excluded_row_count": 7,
    "held_excluded_count": 3,
    "provider_calls": 0,
    "zkill_calls": 0,
    "esi_calls": 0
  }
}
```

Sample packet:

```json
{
  "provider_route_packet_status": "preview_only_non_executing",
  "preview_only": true,
  "executes_provider_call": false,
  "dispatchable_now": false,
  "persisted": false,
  "packet_shape_for_later": "zkill_candidate_acquisition_only",
  "not_evidence_expansion": true,
  "not_hydration": true,
  "provider": "zkillboard",
  "provider_route_family": "zkill_system_killmails",
  "route_intent": "candidate_lead_acquisition",
  "bucket_item_id": "bucket-system_radius-1",
  "watch_run_id": "watch-run-system_radius-1",
  "watch_id": 1,
  "system_id": 30003597,
  "accepted_scope_execution_authority": "stored_included_system_ids",
  "accepted_included_system_ids": [30003597, 30003599],
  "center_radius_provenance": {
    "center_system_id": 30003597,
    "center_system_name": "Hare",
    "radius_jumps": 1,
    "center_radius_is_provenance_only": true,
    "center_radius_used_as_execution_authority": false
  },
  "zkill_route": {
    "method": "GET",
    "path_template": "/api/kills/systemID/{system_id}/pastSeconds/{past_seconds}/",
    "path_parameters": {
      "system_id": 30003597,
      "past_seconds": 86400
    },
    "trailing_slash_required": true,
    "structured_route_only": true,
    "arbitrary_modifier_grammar_allowed": false,
    "max_results": 1000
  }
}
```

## Acceptance Proof

- Eligible selected candidates can produce inert zKill provider-route packet previews.
- One accepted included system ID yields one preview route packet.
- Watch/run/bucket/scope/window/cap/provenance/source-selection basis is preserved.
- Center/radius remains provenance only.
- Held rows do not produce route packets.
- Rejected rows do not produce route packets.
- Not-input rows do not produce route packets.
- Actor and non-open rows do not produce route packets.
- Overlapping Watch scopes remain independent route packet previews.
- Renderer-supplied selected candidates are not authoritative.
- Packet previews do not create pickup units, leases, queues, dispatcher runtime, provider calls, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, or schema changes.

## Verification

```txt
node --check src\main\services\discoveryProviderRoutePacketPreviewService.js
node --check scripts\verify-discovery-provider-route-packet-preview.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:discovery-provider-route-packet-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Results:

- Syntax checks passed.
- Focused Discovery provider route packet preview verifier passed.
- Service registry verifier passed.
- Command authority verifier passed.
- Passive side-effect verifier passed.
- Enforcement dry-run verifier passed with 126/126 commands covered and no gaps.

Final hygiene:

```txt
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

Results:

- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git diff -- src\main\db\schema.sql` returned no diff.
- `git status --short --branch` showed `main...origin/main` with HS485/HS487/HS489 touched files and the active workspace runway/review files.

## Boundary Confirmation

- Read-only provider-route packet preview only.
- No schema changes.
- No Discovery pickup execution.
- No pickup units.
- No leases.
- No dispatcher runtime.
- No queue runtime.
- No durable Discovery task table.
- No provider calls.
- No zKill calls.
- No ESI calls.
- No executable provider packets.
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

- This is a route-packet preview shape, not pickup authority. It does not define leases, queues, dispatcher scheduling, provider backoff/retry, candidate-ref persistence, or receipt settlement.
- zKill route details are structured preview fields only. They should remain inert until a later runway explicitly opens provider movement.
- Actor rows remain parked as unsupported selection input.

## Recommended Next Action

Overseer review HS489 for acceptance or redirect. The next coherent seam is likely a no-provider pickup execution/dispatcher boundary proof or candidate-ref landing design, but live provider movement and durable Discovery task/lease/queue behavior should remain closed until explicitly opened.
