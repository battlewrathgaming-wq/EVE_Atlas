# DevHS320 System Watch Post-Create Readout

Status: complete
Date: 2026-06-05
Executor: Dev

## Scope

Implemented a read-only/local-only post-create setup readout for accepted System / Radius Watches.

Command added:

```txt
watch.system_radius_setup_readout.preview
```

Core rule preserved:

```txt
stored included_system_ids = accepted Watch scope authority
center/radius = provenance and management after acceptance
readout = inspection only
```

## Files Changed

- `src/main/services/systemRadiusSetupReadoutService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-system-radius-setup-readout.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS320-system-watch-post-create-readout.md`

## Readout Shape

The readout reports:

- Watch ID
- active/inactive state
- center system ID/name as provenance/management
- radius as provenance/management
- stored `included_system_ids` as accepted Watch scope authority
- included system display names when available locally
- included system count
- stored-scope status: `valid`, `missing`, `malformed`, `empty`, `invalid`
- readiness for future execution input from stored scope
- next safe operator/system action
- explicit `does_not_do` and boundary statements

It does not recompute accepted scope from center/radius. Local display names are readability only and do not replace raw stored IDs.

## Sample Valid Readout

Focused verifier sample for an active Hare radius-1 accepted scope:

```json
{
  "watch_id": 1,
  "state": "active",
  "center": {
    "solar_system_id": 30003597,
    "stored_name": "Hare",
    "local_display_name": "Hare",
    "role": "provenance_and_management"
  },
  "radius": {
    "radius_jumps": 1,
    "role": "provenance_and_management"
  },
  "stored_scope_status": "valid",
  "included_system_ids": [30003597, 30003601, 30003599, 30003598, 30003596],
  "included_system_count": 5,
  "ready_for_future_execution_input_from_stored_scope": true,
  "blocked_reasons": []
}
```

Local names were found for Hare, Babirmoult, Heluene, Ogaria, and Oruse.

## Sample Blocked Readouts

Verifier coverage proves:

- missing stored scope -> `missing_stored_scope`
- malformed stored scope -> `malformed_stored_scope`
- empty stored scope -> `empty_stored_scope`
- invalid stored scope -> `invalid_stored_scope`
- inactive Watch with valid stored scope -> stored IDs preserved but not ready because `inactive_watch`

Unknown/missing local system names are not treated as scope failure. The raw ID remains in the accepted stored scope, with `missing_local_name` reported.

## Mutation Boundary Proof

The readout reports and verifies:

- `provider_calls: 0`
- `live_api_calls: 0`
- `watch_dispatches: 0`
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

The focused verifier compares table counts before and after the preview and confirms no persistent table counts changed.

## Verification

Passed:

```txt
node --check src/main/services/serviceRegistry.js
node --check src/main/services/enforcementDryRunService.js
node --check scripts/verify-command-authority.js
node --check scripts/verify-service-registry.js
node --check scripts/verify-passive-side-effects.js
node --check src/main/services/systemRadiusSetupReadoutService.js
node --check scripts/verify-system-radius-setup-readout.js
npm.cmd run verify:system-radius-setup-readout
npm.cmd run verify:watch-create-accepted-scope-contract
npm.cmd run verify:watch-authored-execution-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`npm.cmd run verify:protected-terms` passed with warning-only advisory output: 690 warnings across 9 changed working-set files; no renames or protected-word JSON updates were performed.

`git diff --check` passed with CRLF normalization warnings only.

`git status --short --branch` showed branch `main...origin/main` with HS320 working-tree changes.

## Boundary Confirmation

No Watch execution, Watch executor tasks, provider calls, live/API calls, Discovery ref mutation, Evidence/EVEidence writes, Hydration/metadata label writes, `watch.create` behavior changes, topology traversal changes, accepted-scope recomputation from center/radius, schema changes, renderer UI work, popup/modal behavior, R-Scanner redesign, runtime enforcement, command blocking, support artifacts, Watch result identity, relationship tags, source-owned term rename, protected-word JSON update, or fourth-lane behavior were opened.

## Recommended Next Action

Overseer review HS320 for acceptance. The next practical seam, if accepted, is a renderer placement or operator-facing surfacing decision for this readout, but that remains unopened until explicitly run.
