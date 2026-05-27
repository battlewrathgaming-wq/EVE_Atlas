# DevHS115 - Storage Setup Gate Readout

Date: 2026-05-27
Role: Atlas Dev
Status: Complete

## Summary

Implemented a read-only storage setup gate readout that interprets existing storage authority/preflight-style facts into operator-facing setup posture before any lockout enforcement exists.

Added service command:

- `storage.setup_gate_readout`

Added verifier:

- `npm.cmd run verify:storage-setup-gate`

The readout is not enforcement and does not write storage configuration, persist budget settings, move storage, create a file selector, or change provider/write behavior.

## Files Changed

- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-storage-setup-gate.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS115-storage-setup-gate-readout.md`

## Readout Scope

The readout distinguishes:

- explicit configured storage ready for real/alpha collection, subject to budget and other gates
- project/current-file fallback requiring explicit operator acknowledgement
- demo/fixture mode only
- missing/unavailable storage blocked
- invalid/degraded settings blocked or setup-required
- budget unconfigured
- within budget
- warning at/above 70%
- strong warning at/above 95%
- hard-lock posture at/above 100%

It also names:

- allowed while locked: storage setup/re-establish, settings needed to fix storage, read-only help/status, clearly separated demo/fixture mode
- blocked while locked: provider-backed acquisition, Evidence/EVEidence writes, hydration writes, snapshots/support artifacts when over budget or path invalid, destructive pruning/deletion execution
- local read/report posture separately, blocked only when needed local records are unavailable

## Sample Output

Focused verifier output included:

```json
{
  "status": "storage setup gate readout verified",
  "sample_ready": {
    "storage_state": "configured_ready",
    "setup_gate": "ready",
    "budget_state": "within_budget",
    "locked": false,
    "local_read_report": "available_if_records_accessible",
    "blocked_reasons": []
  },
  "sample_fallback": {
    "storage_state": "fallback_ack_required",
    "setup_gate": "operator_ack_required",
    "budget_state": "within_budget",
    "locked": true,
    "local_read_report": "available_if_records_accessible",
    "blocked_reasons": [
      "fallback_ack_required"
    ]
  },
  "sample_missing": {
    "storage_state": "missing_unavailable_blocked",
    "setup_gate": "setup_required",
    "budget_state": "within_budget",
    "locked": true,
    "local_read_report": "blocked_storage_unavailable",
    "blocked_reasons": [
      "missing_unavailable_blocked"
    ]
  },
  "sample_budget_states": {
    "unconfigured": "budget_unconfigured",
    "within": "within_budget",
    "warning": "budget_warning",
    "strong_warning": "budget_strong_warning",
    "hard_lock": "budget_hard_lock",
    "hard_lock_blocks": [
      "budget_hard_lock"
    ]
  }
}
```

## Read-Only Proof

- `storage.setup_gate_readout` is registered as `read-only` with only the `read-only` effect.
- Renderer-eligible command registration is verified.
- Renderer payloads cannot override trusted storage facts, arbitrary DB path facts, fixture preflight facts, or trusted budget context.
- Passive side-effect verification includes the new command against seeded and empty DBs.
- The focused verifier compares DB table counts before and after service invocation.

## Boundary Confirmation

- No storage config was written.
- No final storage config filename/location was chosen.
- No active DB was moved, copied, migrated, created, restored, relocated, or deleted.
- No lockout enforcement was added.
- No pruning/deletion execution was added.
- No provider calls were added or made.
- No Evidence/EVEidence writes, hydration writes, Watch scheduler changes, Acquisition/Hydration cadence changes, provider dispatch changes, schema changes, renderer layout changes, or file selector work occurred.
- Budget is reported as Atlas-controlled disk usage posture, not provider/API request pacing.

## Verification

- `npm.cmd run verify:storage-setup-gate` - passed.
- `npm.cmd run verify:storage-authority-preflight` - passed.
- `npm.cmd run verify:gate-stack-readout` - passed after sequential rerun; an earlier parallel run collided with another verifier's temporary fixture cleanup.
- `npm.cmd run verify:service-registry` - passed after sequential rerun; an earlier parallel run collided with another verifier's temporary fixture cleanup.
- `npm.cmd run verify:command-authority` - passed.
- `npm.cmd run verify:passive-side-effects` - passed.
- `npm.cmd run verify:protected-terms` - passed with exit code 0, warning-only; 8 changed files scanned.
- `git diff --check` - passed with LF-to-CRLF working-copy warnings only.
- `git status --short --branch` - reported expected HS115 source/verifier/package/workspace changes on `main...origin/main`.

## Recommended Next Action

Overseer review should decide whether this read-only setup posture is sufficient before opening any future storage setup UI, config persistence, or enforcement packet.
