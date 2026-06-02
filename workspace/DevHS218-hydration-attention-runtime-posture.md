# Dev HS218 - Hydration Attention Runtime Posture

Status: complete
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening

## Summary

Added `metadata.hydration_attention_runtime.preview` as a read-only runtime-facing posture readout for Hydration attention.

The command reuses `metadata.hydration_attention_lens.preview`, then groups the selected/deferred local candidates into runtime posture:

- `raw_visible_for_now`
- `known_local_labels`
- `provider_needed_labels`
- `local_sde_lookup_gaps`
- `deferred_candidates`

It also exposes External I/O and storage/setup posture for future Hydration writes while keeping local readout available.

## Files Changed

- `src/main/services/hydrationAttentionRuntimePostureService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-attention-runtime-posture.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS218-hydration-attention-runtime-posture.md`

## Command Surface

Added renderer-eligible read-only command:

```txt
metadata.hydration_attention_runtime.preview
```

Classification:

- `read_only: true`
- `provider_calls: 0`
- `hydration_writes: 0`
- `persisted_queue: false`
- `runtime_enforcement_active: false`
- `command_blocking_active: false`
- `ui_work: false`

Enforcement coverage metadata:

- storage/action class: `local_db_inspection`
- External I/O dependency: `none`
- runtime context: `hydration_attention_runtime_posture_readout`
- enforcement status: `covered_read_only`

## Sample Output Summary

Focused fixture output:

```json
{
  "command": "metadata.hydration_attention_runtime.preview",
  "lens_type": "target_report_scope",
  "source_candidate_count": 4,
  "selected_candidate_count": 3,
  "deferred_candidate_count": 1,
  "runtime_summary": {
    "raw_visible_for_now": 1,
    "known_local_labels": 1,
    "provider_needed_labels": 1,
    "local_sde_lookup_gaps": 1,
    "deferred_candidates": 1,
    "future_hydration_writes_blocked_by_storage": true,
    "local_readout_blocked_by_storage": false
  },
  "external_io": {
    "provider_backed_hydration_posture": "held_by_external_io",
    "held_is_failure": false,
    "provider_calls": 0
  },
  "storage_setup": {
    "storage_state": "no_storage_selected",
    "budget_state": "budget_unconfigured",
    "fast_view_metadata_hydration_posture": "block_writes",
    "future_hydration_writes_blocked": true,
    "local_readout_available": true
  }
}
```

## Posture Groups

Representative fixture items:

- `provider_needed_labels`: `entity:character:90000003`
  - target/report-scoped selected attention
  - `provider_posture.state: held_by_external_io`
  - `provider_call_authorized: false`
- `known_local_labels`: `entity:corporation:98000002`
  - stale local label remains visible as known-local readability
  - `local_label: Known Local Corp`
- `local_sde_lookup_gaps`: `local_sde:inventory_type:999999`
  - local SDE lookup gap
  - `provider_needed: false`
  - not provider-backed ESI Hydration
- `raw_visible_for_now`: `entity:character:90000004`
  - Watch/background candidate remains visible/deferred
  - raw ID remains truthful
- `deferred_candidates`: `entity:character:90000004`
  - visible unresolved candidate, not hidden or treated as failure

## Distinctions

Raw IDs:

- represented as `raw_visible_for_now`
- reason includes `raw_id_remains_visible_truthful`
- not report failure

Known-local labels:

- represented as `known_local_label`
- local/stale labels remain readability landmarks
- labels are not facts replacing IDs

Provider-needed labels:

- represented as `provider_needed_label`
- held by External I/O when off
- future provider-backed Hydration only under normal gates
- not Evidence/EVEidence work

Local SDE gaps:

- represented as `local_sde_lookup_gap`
- explicitly local lookup/readiness posture
- not provider-backed Hydration

Deferred candidates:

- remain visible with `deferred_reason`
- Watch/background and corpus-hygiene posture stays patient
- view/local-record attention is not starved by background work

## Not Computable

The readout includes `runtime_posture.not_computable` entries only when the local lens has no representative candidates or storage setup emits no storage state.

Fixture coverage did not require guessing missing lane/source basis.

## Boundary Confirmation

Confirmed:

- no provider calls
- no Hydration writes
- no persisted Hydration queue
- no `metadata_runs` writes
- no `entities` writes
- no `activity_events` patches
- no Evidence/EVEidence creation
- no Discovery ref mutation
- no Watch mutation
- no Assessment Memory mutation
- no Marked mutation
- no schema changes
- no support artifacts
- no runtime enforcement activation
- no command blocking
- no renderer UI work
- no pruning/deletion behavior
- no label removal, hiding, or attention de-emphasis behavior

## Verification

Syntax checks:

- `node --check src\main\services\hydrationAttentionRuntimePostureService.js` passed
- `node --check src\main\services\serviceRegistry.js` passed
- `node --check src\main\services\enforcementDryRunService.js` passed
- `node --check scripts\verify-hydration-attention-runtime-posture.js` passed
- `node --check scripts\verify-service-registry.js` passed
- `node --check scripts\verify-command-authority.js` passed
- `node --check scripts\verify-passive-side-effects.js` passed
- `node --check scripts\verify-enforcement-dry-run.js` passed

Focused and required verification:

- `npm.cmd run verify:hydration-attention-runtime` passed
- `npm.cmd run verify:hydration-attention-lens` passed
- `npm.cmd run verify:hydration-candidate-preview` passed
- `npm.cmd run verify:hydration-backlog-preview` passed
- `npm.cmd run verify:hydration-execution-policy` passed
- `npm.cmd run verify:hydration` passed
- `npm.cmd run verify:metadata-status` passed
- `npm.cmd run verify:metadata-lookup` passed
- `npm.cmd run verify:service-registry` passed
- `npm.cmd run verify:command-authority` passed
- `npm.cmd run verify:passive-side-effects` passed
- `npm.cmd run verify:enforcement-dry-run` passed
- `npm.cmd run verify:protected-terms` passed warning-only with 470 warnings across 10 changed working-set files; no renames or protected-word JSON updates performed.
- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` showed branch `main...origin/main` with HS218 working-tree changes.
