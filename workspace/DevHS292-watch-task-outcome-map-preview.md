# DevHS292 Watch/task Outcome Map Preview

Status: complete pending Overseer review
Date: 2026-06-05
Executor: Dev

## Scope

Implemented the HS292 read-only/local-only Watch/task origin and durable outcome map preview.

Command:

```txt
runtime.watch_task_outcome_map.preview
```

The command explains how current Atlas state maps origin kinds to durable outputs and volatile runtime movement without provider calls, Watch dispatch, task creation, writes, schema, UI, enforcement, support artifacts, or fourth-lane work.

## Files Changed

- `src/main/services/watchTaskOutcomeMapPreviewService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-watch-task-outcome-map-preview.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS292-watch-task-outcome-map-preview.md`

## Command / Classification Shape

`runtime.watch_task_outcome_map.preview` is registered as:

- classification: `read-only`
- effects: `read-only`
- renderer eligible: `true`
- enforcement coverage:
  - storage/action class: `local_db_inspection`
  - External I/O dependency: `none`
  - runtime context: `watch_task_outcome_map_readout`
  - enforcement status: `read_only_non_enforcing_proof`

## Preview Shape

The preview reports these origin sections:

- Manual Discovery
- Manual Expansion
- Watch authoring
- Watch schedule readout
- Watch executor dispatch
- Actor Watch collection
- System/radius Watch collection

It also reports:

- volatile task/executor state from direct memory snapshots only
- durable row counts from current local tables
- latest matching `fetch_runs`
- Discovery ref counts by status
- Evidence/EVEidence counts from `killmails`, `activity_events`, and `ingestion_audits`
- warning/deferral basis from existing local warning rows
- authored system/radius included/excluded scope versus current collector-planned scope
- current system/radius queue identity as center-only
- absence of durable `watch_result`, `watch_results`, `watch_result_items`, relationship tag column, and relationship truth artifacts

## Sample Output

Focused verifier sample:

```json
{
  "status": "Watch/task outcome map preview verified",
  "action": "runtime.watch_task_outcome_map.preview",
  "origin_sections": [
    "Manual Discovery",
    "Manual Expansion",
    "Watch authoring",
    "Watch schedule readout",
    "Watch executor dispatch",
    "Actor Watch collection",
    "System/radius Watch collection"
  ],
  "volatile_task_state": {
    "state_source": "TaskRunner.listTasks read-only memory snapshot",
    "task_state_is_volatile": true,
    "total_tasks": 2,
    "watch_task_count": 1,
    "creates_tasks": false
  },
  "system_radius_identity": {
    "current_discovered_by_id": "center_system_id",
    "current_identity_level": "center_only",
    "radius_or_watch_id_in_discovery_ref_identity": false
  },
  "durable_result_artifacts": {
    "watch_result_exists": false,
    "watch_results_exists": false,
    "watch_result_items_exists": false,
    "relationship_tag_column_exists": false
  },
  "mutation_check": {
    "unchanged": true
  }
}
```

## Scope / Identity Findings

- Current system/radius collection planning recomputes scope through `TopologyService.getSystemsWithinRadius(center,radius)`.
- Stored `included_system_ids` and `excluded_system_ids` are exposed as authored scope, but the current collector plan does not apply stored excluded systems.
- Current system/radius Discovery ref identity is center-only: `discovered_by_type = system_radius`, `discovered_by_id = center_system_id`.
- The preview explicitly marks radius/watch-id identity as absent today, which leaves future durable result semantics ambiguous if multiple radius Watches share a center.

## Boundary Confirmation

Confirmed:

- no provider calls
- no live/API verification
- no Watch dispatch
- no task creation
- no queue dispatch
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no Watch row mutation
- no Hydration writes
- no metadata run writes
- no `api_request_logs` writes by the preview
- no `watch_result`, `watch_result_items`, relationship tag, or relationship truth creation
- no schema changes
- no runtime enforcement or command blocking
- no UI work
- no support artifacts
- no fourth lane / fast lane work

## Verification

Passed:

```txt
node --check src\main\services\watchTaskOutcomeMapPreviewService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-watch-task-outcome-map-preview.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:watch-task-outcome-map
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

`verify:protected-terms` completed with warning-only advisory output: 306 warnings across 8 changed working-set files; no renames or protected-word JSON updates were performed.

```txt
git diff --check
```

Passed with CRLF normalization warnings only.

```txt
git status --short --branch
```

Showed branch `main...origin/main` with HS292 working-tree changes.

## Risks / Open Decisions

- Current center-only system/radius Discovery ref identity may be too coarse for future durable Watch result semantics.
- Stored radius scope versus recomputed topology remains an unresolved policy decision.
- No durable `watch_result` or relationship-tag system exists; this packet proves a readout map only, not persistence semantics.

## Recommended Next Action

Overseer review should decide whether to accept the read-only preview as sufficient map evidence, then separately shape any future decision about system/radius identity or durable Watch result semantics before schema or runtime work is opened.
