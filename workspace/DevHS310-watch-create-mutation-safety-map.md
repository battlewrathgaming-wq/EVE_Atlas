# DevHS310 Watch Create Mutation Safety Map

Status: complete pending Overseer review
Date: 2026-06-05
Executor: Dev

## Summary

Implemented a read-only/local-only safety map for the future system/radius `watch.create` mutation contract.

New command:

```txt
watch.create_mutation_safety_map.preview
```

The preview does not change `watch.create`. It maps the current recompute path, the future accepted-ID mutation contract seam, allowed/forbidden write surfaces, mismatch rejection posture, and focused warning-only term drift assurance.

## Files Changed

- `package.json`
- `src/main/services/watchCreateMutationSafetyMapService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-create-mutation-safety-map.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `workspace/current.md`
- `workspace/DevHS310-watch-create-mutation-safety-map.md`

## Command Shape

`watch.create_mutation_safety_map.preview` is registered as:

- classification: `read-only`
- renderer eligible: `true`
- effects: `read-only`
- enforcement dry-run class: `local_db_inspection`
- runtime context: `watch_create_mutation_safety_map_readout`
- enforcement status: `read_only_non_enforcing_proof`
- External I/O dependency: `none`

## Sample Output

Focused verifier sample:

```json
{
  "action": "watch.create_mutation_safety_map.preview",
  "current_watch_create_consumes_preflight_included_ids": false,
  "future_mutation_contract_required": true,
  "future_payload_directly_executable_now": false,
  "expected_future_mutation_target": "watch.create",
  "current_packet_allows_watch_row_write": false,
  "current_path": [
    "serviceRegistry watch.create",
    "mutatingActionService.runWatchCreateService",
    "normalizeSystemRadiusWatchScope",
    "watchlistRepository.addSystemRadiusWatch",
    "TopologyService.getSystemsWithinRadius"
  ],
  "recomputation_point": {
    "path": "watchlistRepository.addSystemRadiusWatch -> TopologyService.getSystemsWithinRadius",
    "input_basis": "center_system_id + radius_jumps + maxRadius/maxTopologySystems",
    "consumes_accepted_preflight_included_ids": false,
    "posture": "current_gap_for_future_contract"
  },
  "future_allowed_write_surface": {
    "table": "system_watches",
    "write_authority_basis": "accepted_preflight_included_system_ids",
    "confirmation_required": true,
    "confirmation_token": "confirm:watch.create"
  },
  "term_drift_assurance": {
    "status": "focused_assurance_warning_only",
    "flagged_terms": [
      "watch.create",
      "radius",
      "stargate / topology source data"
    ],
    "renames_performed": false,
    "protected_word_json_updated": false
  },
  "watch_rows_written": 0,
  "watch_dispatches": 0,
  "provider_calls": 0
}
```

## Safety Map

Current path:

```txt
serviceRegistry watch.create
-> mutatingActionService.runWatchCreateService
-> normalizeSystemRadiusWatchScope
-> watchlistRepository.addSystemRadiusWatch
-> TopologyService.getSystemsWithinRadius
```

Current gap:

- current `watch.create` does not consume accepted preflight `included_system_ids`
- current creation recomputes included systems from center/radius
- future payloads are not directly executable by current `watch.create`

Future mutation contract:

- expected target: `watch.create`
- required accepted-ID input: `included_system_ids`
- accepted IDs source: HS304 preflight `included_system_ids_for_acceptance`
- center/radius role: provenance/explanation only
- included IDs role: future stored-scope authority
- reject forged/mismatched replacement IDs
- reject capped, missing, unknown, or invalid preflight posture

Allowed future write surface:

- `system_watches.center_system_id`
- `system_watches.center_system_name`
- `system_watches.radius_jumps`
- `system_watches.included_system_ids`
- `system_watches.excluded_system_ids`
- `system_watches.lookback_hours`
- `system_watches.max_systems_per_run`
- `system_watches.max_killmails_per_run`
- `system_watches.is_active`
- `system_watches.poll_interval_minutes`
- `system_watches.notes`

Must not touch:

- Evidence/EVEidence tables
- Discovery refs
- provider/run provenance
- Hydration/metadata output
- Assessment Memory
- support artifacts
- schema
- topology traversal behavior
- renderer/UI
- runtime enforcement
- durable Watch/task result identity
- relationship tags
- fourth lane / fast lane

## Term Drift Assurance

Included focused warning-only assurance for:

- Watch
- `watch.create`
- system/radius
- radius
- included systems
- direct neighbors
- stargate / topology source data
- Discovery
- Evidence/EVEidence
- Hydration
- Observation
- Assessment

Assurance results:

- renames performed: `false`
- protected-word JSON updated: `false`
- caution-prone terms: `watch.create`, `radius`, `stargate / topology source data`

## Boundary Confirmation

Confirmed:

- no `watch.create` behavior change
- no Watch row writes
- no Watch dispatch
- no task creation
- no provider calls
- no Discovery ref mutation
- no Evidence/EVEidence writes
- no Hydration writes
- no topology traversal behavior change
- no schema changes
- no renderer/UI behavior
- no runtime enforcement
- no support artifacts
- no durable Watch/task result identity
- no relationship tags
- no fourth-lane / fast-lane work
- no source-owned term renames
- no protected-word JSON updates

## Verification

Passed:

```txt
node --check src\main\services\watchCreateMutationSafetyMapService.js
node --check scripts\verify-watch-create-mutation-safety-map.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:watch-create-mutation-safety-map
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:protected-terms` completed with warning-only advisory output: 718 warnings across 12 changed working-set files; no renames or protected-word JSON updates were performed.

`git diff --check` passed with CRLF normalization warnings only.

`git status --short --branch` showed:

```txt
## main...origin/main
 M package.json
 M scripts/verify-command-authority.js
 M scripts/verify-enforcement-dry-run.js
 M scripts/verify-passive-side-effects.js
 M scripts/verify-service-registry.js
 M src/main/services/enforcementDryRunService.js
 M src/main/services/serviceRegistry.js
 M workspace/current.md
 M workspace/overview.md
?? scripts/verify-watch-create-mutation-safety-map.js
?? src/main/services/watchCreateMutationSafetyMapService.js
?? workspace/DevHS310-watch-create-mutation-safety-map.md
?? workspace/OverseerHS310-watch-create-mutation-safety-map-runway.md
```

## Risks / Open Decisions

- Actual `watch.create` mutation behavior remains unchanged and still requires a future bounded packet.
- Field names for the future accepted-ID mutation contract may need final Overseer/Human acceptance before mutation work.
- Term assurance is warning-only; it does not rename terms or change doctrine.

## Recommended Next Action

Overseer should review HS310. If accepted, the next seam is the actual `watch.create` mutation contract consuming accepted preflight `included_system_ids` as stored-scope authority.
