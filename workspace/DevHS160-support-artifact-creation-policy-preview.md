# DevHS160 - Support Artifact Creation Policy Preview

Status: complete

## Summary

Implemented `support.artifact_creation_policy.preview`, a read-only support artifact creation policy readout for runtime DB snapshots and operator debug trace packs.

The preview classifies representative creation requests before any future creation path runs. It composes existing Atlas posture from storage authority config readback, storage setup gate, support artifact path authority, External I/O readout, command metadata, enforcement dry-run coverage, and composed gate policy coverage.

## Files Changed

- `package.json`
- `src/main/services/supportArtifactCreationPolicyService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/composedGatePolicyService.js`
- `scripts/verify-support-artifact-creation-policy.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-composed-gate-policy.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-service-registry.js`
- `workspace/current.md`
- `workspace/DevHS160-support-artifact-creation-policy-preview.md`

## Command / Readout Added

Added:

```txt
support.artifact_creation_policy.preview
```

Registry posture:

- classification: `read-only`
- effects: `read-only`
- renderer eligible: true
- creates support artifacts: false
- creates snapshots: false
- creates trace packs: false
- provider calls: 0
- runtime enforcement active: false

## Sample Output

Focused verifier sample:

```json
{
  "command": "support.artifact_creation_policy.preview",
  "renderer_payload_ignored": true,
  "sample_ready_postures": {
    "runtime_snapshot_rolling": "would_allow",
    "runtime_snapshot_retained": "would_allow",
    "operator_debug_trace_pack": "would_allow",
    "readiness_preflight_export": "conditional"
  },
  "sample_budget_blocked_postures": {
    "runtime_snapshot_rolling": "budget_blocked",
    "runtime_snapshot_retained": "budget_blocked",
    "operator_debug_trace_pack": "budget_blocked",
    "readiness_preflight_export": "conditional"
  },
  "external_io_policy": {
    "off_blocks_local_support_policy_readout": false,
    "off_blocks_support_artifact_creation_policy": false,
    "on_authorizes_creation": false,
    "support_artifact_creation_calls_providers": false,
    "provider_backed_posture": "held_by_external_io",
    "reenable_catch_up_flood": false
  }
}
```

## Proof Coverage

Creation classes:

- `runtime_snapshot_rolling`
- `runtime_snapshot_retained`
- `operator_debug_trace_pack`
- `readiness_preflight_export`

Renderer anti-forgery:

- renderer payload ignored: true
- renderer path claims accepted: false
- renderer storage authority claims accepted: false
- renderer fallback acknowledgement claims accepted: false
- renderer budget claims accepted: false
- renderer trusted context claims accepted: false
- filesystem probe performed: false

Policy posture:

- snapshot and trace-pack classes require confirmation and trusted context before future creation.
- destination path authority remains backend/settings derived, not renderer-authoritative.
- snapshot and trace-pack classes remain storage-budget scoped.
- `would_allow` is preview posture only and is not runtime authorization.
- readiness/preflight export remains conditional because no current write-capable export surface was adopted here.

External I/O:

- External I/O off does not block the local policy readout.
- External I/O on does not authorize creation.
- re-enable does not imply catch-up flooding.
- support artifact creation policy does not call zKill, ESI, SDE download, or any provider.

## Verification

Passed:

```powershell
node --check src\main\services\supportArtifactCreationPolicyService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\composedGatePolicyService.js
node --check scripts\verify-support-artifact-creation-policy.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
node --check scripts\verify-composed-gate-policy.js
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

`verify:protected-terms` completed with warning-only advisory output and exit code 0.

Final checks:

```powershell
git diff --check
git status --short --branch
```

- `git diff --check`: passed with line-ending warnings only.
- `git status --short --branch`: `main...origin/main [ahead 37]` with HS160 modified/untracked files.

## Boundary Confirmation

No support artifacts, runtime snapshots, trace packs, operator exports, files, directories, provider calls, zKill calls, ESI calls, SDE downloads, Evidence/EVEidence writes, Discovery mutations, Hydration writes, storage config writes, runtime enforcement, command blocking, schema migrations, or UI changes were added by the new preview behavior.

Existing snapshot and trace-pack creation code was not modified, so `verify:runtime-snapshot` and `verify:operator-debug-trace` were not run.

## Risks / Notes

- `would_allow` is intentionally non-authorizing. Future enforcement must still compose storage, budget, path authority, confirmation, trusted context, and command-specific gates.
- Readiness/preflight export remains a future conditional class because no accepted current write-capable export command was introduced in HS160.
- Protected-term verification reports advisory warnings for existing terms such as snapshot/readout; no terminology rename was performed.
