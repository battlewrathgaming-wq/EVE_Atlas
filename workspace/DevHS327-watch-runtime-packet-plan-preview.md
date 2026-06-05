# DevHS327 Watch Runtime Packet Plan Preview

Status: complete
Date: 2026-06-05
Role: Dev

## Scope

Executed HS327 only: added a read-only/local-only Watch runtime packet plan preview proving accepted Watch state can be shaped into a future runtime/acquisition packet plan without dispatch, task creation, provider calls, writes, schema, UI, or execution.

## Files Changed

- `src/main/services/watchRuntimePacketPlanService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-runtime-packet-plan.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS327-watch-runtime-packet-plan-preview.md`

## Command Added

```txt
watch.runtime_packet_plan.preview
```

Service posture:

- classification: `read-only`
- renderer eligible: `true`
- storage/action class: `local_db_inspection`
- runtime context: `watch_runtime_packet_plan_readout`
- External I/O dependency: `none`
- enforcement status: `read_only_non_enforcing_proof`

## Implementation Shape

- Added `buildWatchRuntimePacketPlanPreview(...)`.
- Composes existing local facts:
  - `buildWatchScheduleStatus(...)`
  - `watch.authored_execution_readiness.preview`
- Does not call `dispatchFor(...)`.
- Does not call Watch runners, provider gates, task runners, or collectors.
- Actor Watch packet plans come from `watchlist_entities` actor Watch fields.
- System / Radius packet plans use stored accepted `included_system_ids` only.
- Center/radius remain provenance and management after acceptance.
- Waiting states are blocked/no-plan but not failure.
- Readiness remains input evidence, not authorization.

## Sample Valid Actor Plan

```json
{
  "watch_type": "actor",
  "watch_id": 1,
  "scope_key": "actor:character:90000001",
  "packet_plan_status": "planned",
  "planned_lane": "Discovery_then_Evidence_Expansion",
  "scope_authority": {
    "scope_source": "watchlist_entities",
    "accepted_scope_source": "actor_watch_source_fields",
    "entity_type": "character",
    "entity_id": 90000001,
    "accepted_authority": true,
    "selected_for_packet_plan": true
  },
  "runtime_packet_plan": {
    "command": "actor.watch",
    "zkill_discovery_packet_count": 1,
    "esi_evidence_expansion_cap": 7,
    "lookback_seconds": 1209600
  },
  "would_dispatch_watch": false,
  "would_create_task": false,
  "provider_calls": 0,
  "writes": 0
}
```

## Sample Valid System / Radius Plan

```json
{
  "watch_type": "system_radius",
  "watch_id": 1,
  "scope_key": "system:30003597:radius:1",
  "packet_plan_status": "planned",
  "planned_lane": "Discovery_then_Evidence_Expansion",
  "scope_authority": {
    "scope_source": "system_watches.included_system_ids",
    "acceptedScopeSource": "stored_watch_scope",
    "stored_scope_status": "valid",
    "accepted_system_ids": [30003597, 30003601, 30003599],
    "center_radius_role": "provenance_and_management",
    "center_radius_used_as_authority": false,
    "would_recompute_from_center_radius": false,
    "accepted_authority": true,
    "selected_for_packet_plan": true
  },
  "runtime_packet_plan": {
    "command": "system.radius.watch",
    "selected_accepted_system_ids": [30003597, 30003601, 30003599],
    "zkill_discovery_packet_count": 3,
    "esi_evidence_expansion_cap": 9,
    "max_refs_per_system": 3,
    "lookback_seconds": 172800
  },
  "would_dispatch_watch": false,
  "would_create_task": false,
  "provider_calls": 0,
  "writes": 0
}
```

## Sample Invalid Stored Scope

```json
{
  "watch_type": "system_radius",
  "watch_id": 6,
  "packet_plan_status": "blocked_no_plan",
  "planned_lane": "blocked_no_plan",
  "gate_posture": {
    "blocked_reasons": ["watch_scope_authority_invalid"]
  },
  "scope_authority": {
    "scope_source": "system_watches.included_system_ids",
    "acceptedScopeSource": null,
    "stored_scope_status": "invalid",
    "accepted_system_ids": [],
    "accepted_authority": false,
    "selected_for_packet_plan": false
  },
  "invalid_scope_diagnostic": {
    "diagnostic_parseable_system_ids": [30003597],
    "operator_actionable": false,
    "accepted_authority": false,
    "execution_authority": false,
    "selected_runtime_systems": false,
    "repairs_stored_row": false
  },
  "runtime_packet_plan": null,
  "selected_accepted_system_ids": [],
  "would_dispatch_watch": false,
  "would_create_task": false,
  "provider_calls": 0,
  "writes": 0
}
```

## Verification

Passed:

- `node --check src\main\services\serviceRegistry.js`
- `node --check src\main\services\enforcementDryRunService.js`
- `node --check scripts\verify-command-authority.js`
- `node --check scripts\verify-service-registry.js`
- `node --check scripts\verify-passive-side-effects.js`
- `node --check src\main\watchlist\watchScheduler.js`
- `node --check src\main\watchlist\watchExecutor.js`
- `node --check scripts\verify-watch-scheduler.js`
- `node --check scripts\verify-watch-executor.js`
- `node --check scripts\verify-watch-authored-execution-readiness.js`
- `node --check src\main\services\watchRuntimePacketPlanService.js`
- `node --check scripts\verify-watch-runtime-packet-plan.js`
- `npm.cmd run verify:watch-runtime-packet-plan`
- `npm.cmd run verify:watch-scheduler`
- `npm.cmd run verify:watch-executor`
- `npm.cmd run verify:watch-authored-execution-readiness`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:protected-terms`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:passive-side-effects`
- `git diff --check`
- `git status --short --branch`

Notes:

- `verify:service-registry` and `verify:passive-side-effects` were run separately, not in parallel.
- `verify:protected-terms` passed with warning-only advisory output: 341 warnings across 8 changed working-set files; no renames or protected-word JSON updates performed.
- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` showed branch `main...origin/main` with HS327 working-tree changes.

## Boundary Confirmation

Confirmed no Watch execution, runtime arm/disarm, task creation, provider/live/API calls, Watch row mutation, Discovery ref mutation, Evidence/EVEidence writes, Hydration/metadata writes, `watch.create` changes, topology traversal changes, center/radius fallback authority, runtime packet persistence, provider queue creation, schema changes, renderer/UI work, support artifacts, runtime enforcement or command blocking, Watch result identity, relationship tags, protected-word JSON updates, or fourth-lane behavior.
