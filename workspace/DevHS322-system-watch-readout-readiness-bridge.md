# DevHS322 System Watch Readout Readiness Bridge

Status: complete
Date: 2026-06-05
Executor: Dev

## Scope

Implemented a read-only/local-only bridge preview between accepted System / Radius Watch setup readout and authored execution readiness.

Command added:

```txt
watch.system_radius_readout_readiness_bridge.preview
```

The bridge composes:

- `watch.system_radius_setup_readout.preview`
- `watch.authored_execution_readiness.preview`

Core rule preserved:

```txt
stored included_system_ids = shared authority
setup readout = what Atlas accepted/stored
execution readiness = whether the stored scope is usable as future execution input
bridge = conformance proof only
```

## Files Changed

- `src/main/services/systemRadiusReadoutReadinessBridgeService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-system-radius-readout-readiness-bridge.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS322-system-watch-readout-readiness-bridge.md`

## Bridge Shape

Each bridge row compares:

- Watch ID
- active/inactive state
- stored-scope status
- stored included-system IDs
- included-system count
- center/radius provenance/management role
- whether center/radius are used as authority
- readiness for future execution input
- blocked reasons
- next safe action

The bridge reports:

- `matched_fields`
- `mismatch_fields`
- `equivalent_mappings`
- `mismatch_handling: reported_only_no_fix_or_mutation`

## Sample Matched Row

Valid active Hare radius-1 setup:

```json
{
  "watch_id": 1,
  "conformance_status": "matched",
  "stored_scope_status": {
    "setup": "valid",
    "readiness": "valid"
  },
  "stored_included_system_ids": {
    "setup": [30003597, 30003601, 30003599, 30003598, 30003596],
    "readiness": [30003597, 30003601, 30003599, 30003598, 30003596]
  },
  "included_system_count": {
    "setup": 5,
    "readiness": 5
  },
  "center_radius_used_as_authority": {
    "setup": false,
    "readiness": false
  },
  "readiness_for_future_execution_input": {
    "setup": true,
    "readiness": true
  }
}
```

## Blocked Rows

Verifier coverage proves:

- missing stored scope is blocked in both views with `missing_stored_scope`;
- malformed stored scope is blocked in both views with `malformed_stored_scope`;
- empty stored scope is blocked in both views with `empty_stored_scope`;
- inactive Watch with valid stored scope preserves stored IDs and is not ready in both views with `inactive_watch`;
- valid stored scope with a missing local display name remains ready from raw IDs in both views.

## Mismatch Handling

The bridge intentionally reports one existing source-view mismatch for invalid stored scope:

- setup readout reports invalid stored scope and exposes `included_system_ids: []`;
- authored readiness reports invalid stored scope and exposes the valid numeric subset `[30003597]` in `stored_scope.included_system_ids`;
- both views still block the row with `invalid_stored_scope`;
- the bridge reports `stored_included_system_ids` as a mismatch and does not repair or mutate anything.

Next-safe-action wording differs between setup/readout and readiness surfaces, so the bridge discloses those differences as equivalent safe-review mappings instead of silently flattening them.

## Mutation Boundary Proof

The bridge reports and verifies:

- `provider_calls: 0`
- `live_api_calls: 0`
- `watch_dispatches: 0`
- `watch_execution_armed: false`
- `tasks_created: 0`
- `discovery_refs_mutated: 0`
- `evidence_rows_written: 0`
- `hydration_writes: 0`
- `metadata_writes: 0`
- `watch_mutations: 0`
- `schema_changes: 0`
- `support_artifacts_created: 0`
- `runtime_enforcement_active: false`
- `command_blocking_active: false`

The focused verifier compares table counts before and after the bridge preview and confirms no persistent table counts changed.

## Verification

Passed:

```txt
node --check src/main/services/serviceRegistry.js
node --check src/main/services/enforcementDryRunService.js
node --check scripts/verify-command-authority.js
node --check scripts/verify-service-registry.js
node --check scripts/verify-passive-side-effects.js
node --check src/main/services/systemRadiusReadoutReadinessBridgeService.js
node --check scripts/verify-system-radius-readout-readiness-bridge.js
npm.cmd run verify:system-radius-readout-readiness-bridge
npm.cmd run verify:system-radius-setup-readout
npm.cmd run verify:watch-authored-execution-readiness
npm.cmd run verify:watch-create-accepted-scope-contract
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`npm.cmd run verify:protected-terms` passed with warning-only advisory output: 792 warnings across 10 changed working-set files; no renames or protected-word JSON updates were performed.

`git diff --check` passed with CRLF normalization warnings only.

`git status --short --branch` showed branch `main...origin/main` with HS322 working-tree changes.

## Boundary Confirmation

No Watch execution, Watch runtime arm/disarm, Watch executor tasks, provider calls, live/API calls, Discovery ref mutation, Evidence/EVEidence writes, Hydration/metadata label writes, `watch.create` behavior changes, source readout behavior changes, topology traversal changes, center/radius execution authority, schema changes, renderer UI work, popup/modal behavior, R-Scanner redesign, runtime enforcement, command blocking, support artifacts, durable Watch result identity, relationship tags, source-owned term rename, protected-word JSON update, or fourth-lane behavior were opened.

## Recommended Next Action

Overseer review HS322. The bridge is mechanically useful now: it confirms the accepted setup/readiness spine and highlights the invalid-scope mismatch for a future tiny normalization decision if desired.
