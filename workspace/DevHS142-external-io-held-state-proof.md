# DevHS142 - External I/O Held-State Proof

Status: complete
Date: 2026-05-31
Role: Dev

## Summary

Refined the existing read-only `support.gate_stack_readout` so Atlas can explain External I/O held-state composition before enforcement.

The proof reports provider-capable commands as `held_by_external_io` when External I/O is off, keeps local-only read/report/preflight commands available, keeps Watch arming separate from provider movement permission, and states that re-enable returns work to normal gates without catch-up flooding.

## Files Changed

- `src/main/services/gateStackReadoutService.js`
- `scripts/verify-gate-stack-readout.js`
- `workspace/current.md`
- `workspace/DevHS142-external-io-held-state-proof.md`

## Readout Refined

Refined:

```text
support.gate_stack_readout
```

Added:

- `external_io.provider_backed_posture`
- `external_io.local_only_posture`
- `external_io.held_is_failure`
- `external_io.reenable_catch_up_policy`
- `command_external_io_posture`
- per-action `gates.external_io.state`

The readout consumes HS139 command coverage through `buildCommandCoverageReport()` and service command effects. It remains read-only and non-enforcing.

## Sample Held-State Output

From `npm.cmd run verify:gate-stack-readout`:

```json
{
  "external_io": {
    "family": "external_io",
    "implementation_state": "policy_only_not_implemented",
    "enforced": false,
    "requested_readout_state": "off",
    "provider_backed_posture": "held_by_external_io",
    "local_only_posture": "available",
    "held_is_failure": false,
    "reenable_catch_up_policy": {
      "catch_up_flood": false,
      "release_count_now": "bounded_by_normal_lane_policy",
      "missed_slots_create_request_debt": false,
      "next_step": "re_enter_normal_gates"
    }
  },
  "sample_command_external_io": {
    "command": "manual.expansion",
    "provider_capable": true,
    "external_io_dependency": "esi_provider_required",
    "storage_action_class": "esi_evidence_expansion",
    "external_io_state": "off",
    "posture": "held_by_external_io",
    "held_is_failure": false,
    "enforcement_active": false
  }
}
```

## Provider-Capable Held Examples

Verified as `held_by_external_io` while External I/O is off:

- `manual.discovery`
- `manual.expansion`
- `actor.watch`
- `system.radius.watch`
- `metadata.hydration`
- `sde.build-lookups`
- `watch.executor.arm`
- `watch.executor.tick`

## Local-Only Available Examples

Verified as `local_only_available` while External I/O is off:

- `app.readiness`
- `report.actor`
- `queue.selection`
- `storage.authority_preflight`
- `storage.setup_gate_readout`
- `watch.schedule`
- `watch.offline_readout`

## Watch Separation

Watch arming remains its own gate:

- `watch_arming.state` can be `armed` or `disarmed`.
- Provider-capable Watch dispatch still reports External I/O state separately.
- External I/O on does not bypass `live.gate`, active task duplicate posture, storage safety, or confirmation.

Sample actor Watch stack while External I/O is off:

```json
{
  "action": "actor.watch",
  "provider_backed": true,
  "schedule_state": "due_consider_gates",
  "watch_arming_state": "armed",
  "external_io_state": "held_by_external_io",
  "live_gate_allowed": false,
  "active_task_state": "duplicate_or_active_task",
  "confirmation_required": true,
  "readout_posture": [
    "held_by_external_io",
    "active_task_wait",
    "blocked_by_live_gate",
    "confirmation_required"
  ]
}
```

## Re-Enable / No Catch-Up Proof

External I/O re-enable reports:

```text
released_to_normal_gates
```

The readout and verifier prove:

- no catch-up flood
- missed slots do not create request debt
- provider-capable work re-enters normal cadence/provider/storage/Watch/confirmation gates
- Watch arming remains separate
- `live.gate` and active task posture are not bypassed

`verify:cadence-simulation` also confirms `no_catch_up_after_external_io_reenable: true`.

## Boundary Confirmation

Confirmed:

- no runtime enforcement
- no command interception
- no actual command blocking
- no provider/API calls
- no zKill calls
- no ESI calls
- no SDE download
- no Evidence/EVEidence writes
- no hydration writes
- no DB/storage movement, copy, migration, restore, deletion, or pruning execution
- no schema changes
- no renderer/UI work
- no persisted External I/O setting

## Verification

Passed:

```powershell
node --check src\main\services\gateStackReadoutService.js
node --check scripts\verify-gate-stack-readout.js
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:cadence-simulation
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:app-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-scheduler
npm.cmd run verify:protected-terms
```

`verify:protected-terms` completed with warning-only discovery output and exit code 0.

Final checks still to run after this handoff write:

```powershell
git diff --check
git status --short --branch
```
