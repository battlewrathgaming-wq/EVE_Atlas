# DevHS148 - Composed Gate Policy Preview

Status: complete
Role: Dev
Date: 2026-06-01

## Summary

Implemented a bounded read-only composed gate policy preview.

Added:

```text
storage.composed_gate_policy.preview
```

The preview answers: if Atlas enforced later, which gates would need to pass for representative command families?

It does not answer whether a command may run now, and it does not activate enforcement, interception, command blocking, provider calls, file writes, DB mutations, schema changes, or runtime authorization.

## Files Changed

- `package.json`
- `src/main/services/composedGatePolicyService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-composed-gate-policy.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `workspace/current.md`
- `workspace/DevHS148-composed-gate-policy.md`

## Command Added

```text
storage.composed_gate_policy.preview
```

Registry posture:

- classification: `read-only`
- effects: `read-only`
- renderer eligible: yes, as a read-only backend-derived policy preview
- enforcement coverage: `local_db_inspection`, no External I/O dependency, `read_only_non_enforcing_proof`

## Preview Shape

The preview composes existing read-only posture from:

- service registry command metadata
- enforcement dry-run command/effect coverage
- storage setup gate/action matrix
- External I/O gate-stack readout
- live/API gate posture
- Watch arming / active task posture where available
- confirmation metadata
- support-artifact path authority preview

Representative rows:

- local read/report/preflight
- Assessment local metadata write
- Watch local metadata write
- zKill Discovery
- ESI Evidence/EVEidence expansion
- Hydration write
- SDE local import/rewrite
- SDE download/build
- runtime snapshot creation
- trace-pack creation
- pruning/deletion preflight
- pruning/deletion execution
- runtime control / task cancellation
- fixture-only proof command
- unknown/unclassified future command

Each row reports gate states using:

```text
pass, hold, block, conditional, not_applicable, unknown
```

Gate families include:

- service command classified
- renderer eligibility
- storage authority
- storage budget posture
- External I/O
- live/provider gate
- cadence/rate safety
- Watch arming
- active task / duplicate prevention
- confirmation UX
- destination/path authority
- trusted context / fixture-only exclusion

## Important Semantics

`would_allow` remains input-only:

```json
{
  "answers_may_run_now": false,
  "would_allow_is_authorization": false,
  "would_allow_role": "storage/enforcement dry-run input only; final future runtime authorization must compose all gates"
}
```

Unknown/unclassified command posture:

```json
{
  "future_posture": "fail_closed",
  "active_now": false,
  "reason": "Future runtime enforcement should block unknown/unclassified commands unless deliberately exempted; this preview does not implement that behavior."
}
```

## Sample Focused Output

```json
{
  "status": "composed gate policy preview verified",
  "command": "storage.composed_gate_policy.preview",
  "total_rows": 15,
  "by_composed_state": {
    "pass": 1,
    "block": 7,
    "conditional": 7
  },
  "provider_or_external_io_rows": [
    "zkill_discovery",
    "esi_evidence_expansion",
    "hydration_write",
    "sde_download_build"
  ],
  "fixture_only_rows": [
    "fixture_only_write_proof"
  ],
  "unknown_fail_closed_rows": [
    "unknown_unclassified_future_command"
  ]
}
```

## Split Notes

The preview marks broad classes that should split before real enforcement:

- `setup_config_changes`: runtime path preparation, Watch authoring metadata, snapshot settings update, runtime task control, fixture-only proof
- `background_hydration`: local SDE import/rewrite, SDE download/build, provider-backed background hydration
- `snapshot_support_artifact_write`: runtime snapshot creation and trace-pack creation

## Side-Effect Proof

`verify:composed-gate-policy` proves:

- no runtime interception
- no command blocking
- no provider calls
- no filesystem writes
- no fixture temp root creation
- no DB table-count mutation
- no schema changes
- unknown/unclassified fail-closed remains inactive policy intent
- `would_allow` is not treated as runtime authorization

## Boundary Confirmation

No runtime enforcement was added.

No command interception or command blocking was added.

No provider calls, zKill calls, ESI calls, or SDE download calls were added.

No storage config write, support artifact creation, snapshot creation, trace-pack creation, cleanup/delete/prune/restore/move/copy/migration/upload, Evidence/EVEidence write, Hydration write, schema change, or UI/renderer redesign was added.

Confirmation tokens remain UX/operator-friction metadata, not security secrets or authorization authority.

## Verification

```powershell
node --check src\main\services\composedGatePolicyService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-composed-gate-policy.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
npm.cmd run verify:actor-metadata
npm.cmd run verify:corporation-metadata
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- all `node --check` commands passed
- all listed `npm.cmd run verify:*` commands passed
- `verify:protected-terms` completed with warning-only discovery output and exit code 0
- `git diff --check` passed with line-ending warnings only
- `git status --short --branch` showed `main...origin/main [ahead 25]` plus the HS148 working-tree changes
