# Dev HS150 Hydration Execution Policy Preview

Status: Complete

## Scope

Implemented a bounded read-only Hydration execution policy preview for:

```text
metadata.hydration_execution_policy.preview
```

The preview explains future Hydration execution posture from existing local/read-only inputs. It does not authorize execution or move provider-backed work.

## Files Changed

- `src/main/services/hydrationExecutionPolicyPreviewService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-execution-policy.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS150-hydration-execution-policy.md`

## Implementation Notes

- Added read-only service builder `buildHydrationExecutionPolicyPreview`.
- Registered `metadata.hydration_execution_policy.preview` as renderer-eligible read-only service command.
- Composes existing read-only posture from Hydration backlog preview, storage setup gate readout, gate-stack readout, composed gate policy preview, command authority metadata, and local SDE readiness.
- Separates lanes:
  - `view_local_record`
  - `watch_background`
  - `target_report_scoped`
  - `corpus_hygiene_low_priority`
  - `local_sde_lookup_gaps`
- Reports lane policy states including `eligible_local`, `eligible_provider_if_gates_pass`, `held_by_external_io`, `blocked_by_storage`, `deferred_by_priority`, `local_lookup_gap`, and `not_applicable`.
- Preserves Hydration meaning: names/labels/readability only; numeric IDs remain facts; missing labels are not report failure; provider-needed labels are not Evidence/EVEidence work.
- Preserves priority meaning: view/local-record Hydration is not starved by background work, Watch/background waiting is not failure, corpus hygiene can defer, and External I/O re-enable does not imply catch-up flooding.

## Sample Preview Output

Focused verifier fixture output:

```json
{
  "status": "hydration execution policy preview verified",
  "command": "metadata.hydration_execution_policy.preview",
  "by_policy_state": {
    "blocked_by_storage": 4,
    "local_lookup_gap": 1
  },
  "provider_needed_entity_label_candidates": 2,
  "local_known_label_candidates": 1,
  "local_sde_gap_candidates": 1,
  "lanes": [
    {
      "lane_id": "view_local_record",
      "policy_state": "blocked_by_storage",
      "priority": "point_of_need_not_starved",
      "reason_codes": ["storage_blocks_hydration_writes"]
    },
    {
      "lane_id": "watch_background",
      "policy_state": "blocked_by_storage",
      "priority": "patient_background",
      "reason_codes": ["storage_blocks_hydration_writes"]
    },
    {
      "lane_id": "local_sde_lookup_gaps",
      "policy_state": "local_lookup_gap",
      "priority": "local_lookup_readiness",
      "reason_codes": ["local_sde_lookup_gap", "local_sde_incomplete"]
    }
  ]
}
```

The fixture intentionally demonstrates storage-first blocking while still verifying External I/O hold/release semantics and the no-catch-up-flood policy.

## Read-Only Boundary Confirmed

- No ESI, zKill, SDE download, or provider calls.
- No provider movement.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No entity label writes.
- No activity-event label patches.
- No metadata run writes.
- No Hydration writes.
- No persisted Hydration queue or backlog.
- No schema changes.
- No storage config writes.
- No runtime enforcement, interception, authorization, or command blocking.
- No UI or renderer redesign.

## Verification

Passed:

```powershell
node --check src\main\services\hydrationExecutionPolicyPreviewService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-hydration-execution-policy.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration-backlog-preview
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
```

`verify:protected-terms` completed with warning-only discovery output and exit code 0.

Passed after handoff/current updates:

```powershell
git diff --check
git status --short --branch
```

`git diff --check` passed with line-ending warnings only. `git status --short --branch` showed `main...origin/main [ahead 27]` plus the HS150 working-tree changes.

## Risks / Notes

- The preview is policy explanation only. `eligible_*` states are not runtime authorization.
- Fixture output can show `blocked_by_storage` before `held_by_external_io` because storage validity remains a trust boundary. Lane gates still expose External I/O posture.
- Future implementation should keep Hydration execution separate from Evidence/EVEidence creation and Discovery provenance.

## Recommended Next Action

Overseer review HS150, then decide whether the next seam is Hydration execution dry-run planning, External I/O persisted state, or a bounded Hydration writer fixture proof.
