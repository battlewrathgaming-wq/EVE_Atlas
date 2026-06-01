# DevHS156 External I/O Real Config

Status: Completed
Date: 2026-06-01
Executor: Dev

## Scope

Implemented HS156 real operator External I/O config posture while keeping External I/O separate from provider execution, runtime authorization, Watch arming, live/API gates, storage authority, cadence, and catch-up behavior.

Final command names:

```text
external_io.state_readout
external_io.state_config_readback
external_io.state_config_write
external_io.state_persistence_proof
```

Renderer eligibility:

- `external_io.state_readout`: renderer eligible, read-only
- `external_io.state_config_readback`: renderer eligible, read-only
- `external_io.state_config_write`: not renderer eligible, trusted context only
- `external_io.state_persistence_proof`: not renderer eligible, fixture-only legacy proof retained

## Canonical Config Path

Canonical target:

```text
<Atlas app/root>/config/external-io-state.json
```

Resolved in this repo as:

```text
F:\Projects\AURA-Atlas\config\external-io-state.json
```

The readout now reports this path as operator config posture. If the file is missing, Atlas defaults safely to `off`.

## Config Schema

The written payload shape is:

```json
{
  "config_kind": "external_io_operator_state",
  "external_io_state": "on",
  "fixture_offline_only": false,
  "reason": "operator External I/O config write",
  "state_meaning": {
    "authorization": false,
    "catch_up_flood": false,
    "immediate_dispatch": false,
    "meaning": "Provider-backed work may be reconsidered by normal storage, live/provider, cadence, Watch, and confirmation gates.",
    "provider_backed_posture": "released_to_normal_gates"
  },
  "version": 1,
  "written_at": "EXTERNAL_IO_STATE_PROOF_TIMESTAMP_PLACEHOLDER"
}
```

Accepted input states normalize to:

- `off`
- `on`

Compatibility aliases:

- `disabled` -> `off`
- `enabled` -> `on`

Invalid states are rejected and default posture remains safe `off`.

## Implementation

- Extended `external_io.state_readout` to read canonical app-local config posture without fixture-only parameters.
- Added `external_io.state_config_readback` as a read-only operator config readback surface.
- Added `external_io.state_config_write` as a trusted-context-only config write/readback path.
- Kept renderer payloads from selecting paths, forging trusted context, forging state authority, forging acknowledgement/budget, or probing arbitrary files.
- Kept `external_io.state_persistence_proof` intact as the fixture/offline proof command.
- Integrated canonical External I/O readout into `support.gate_stack_readout`.
- Added `external_io_operator_config_write` to the composed gate policy preview.
- Added service registry, command authority, enforcement dry-run, gate-stack, composed policy, and focused External I/O verification coverage.

## Sample Verification Output

```json
{
  "sample_operator_config_write": {
    "action": "external_io.state_config_write",
    "default_config_path": "F:\\Projects\\AURA-Atlas\\config\\external-io-state.json",
    "target_path_basis": "trusted_fixture_context_target",
    "requested_state": "on",
    "normalized_state": "on",
    "would_write": true,
    "validation_status": "external_io_config_write_valid",
    "write_status": "written_atomically",
    "readback_matches_payload": true,
    "readout_state": "on",
    "provider_backed_posture": "released_to_normal_gates",
    "on_is_authorization": false,
    "catch_up_flood": false,
    "queue_dispatches": 0,
    "provider_calls": 0,
    "real_config_write": false
  },
  "real_project_config_exists_before": false,
  "real_project_config_exists_after": false
}
```

Verification used fixture-controlled write targets for the focused test, so no real project-root config file was created during verification.

Gate-stack sample now reports:

```json
{
  "implementation_state": "operator_config_readout",
  "requested_readout_state": "off",
  "persisted_state": {
    "status": "missing",
    "path": "F:\\Projects\\AURA-Atlas\\config\\external-io-state.json",
    "path_basis": "<Atlas app/root>/config/external-io-state.json",
    "path_allowed": true,
    "read_allowed": true
  },
  "provider_backed_posture": "held_by_external_io",
  "local_only_posture": "available",
  "held_is_failure": false
}
```

## Boundary Confirmation

Confirmed:

- `off` means provider-backed movement is `held_by_external_io`, not failure.
- `on` means provider-backed work is released only to normal storage, live/provider, cadence, Watch, and confirmation gates.
- `on` is not authorization.
- Re-enable creates no catch-up flood, request debt, or immediate dispatch.
- Watch arming remains separate from External I/O.
- `live.gate`, storage authority, composed gate policy, runtime authorization, and External I/O remain separate.
- No provider calls were added.
- No runtime enforcement, command interception, or command blocking was added.
- No queue dispatch was added.
- No Evidence/EVEidence writes were added.
- No Discovery ref mutation was added.
- No Hydration writes were added.
- No schema changes were added.
- No renderer UI or renderer redesign was added.
- No storage authority config write was added.
- No DB/storage move, copy, migration, relocation, restore, deletion, snapshot, trace pack, cleanup, or pruning was added.

## Verification

Passed:

```powershell
node --check src\main\services\externalIoStateService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\gateStackReadoutService.js
node --check src\main\services\composedGatePolicyService.js
node --check scripts\verify-external-io-state.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-gate-stack-readout.js
node --check scripts\verify-composed-gate-policy.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:external-io-state
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:hydration
npm.cmd run verify:hydration-write-fixture
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

`verify:protected-terms` completed with warning-only discovery output and exit code 0.

`git diff --check` passed with line-ending warnings only.

Final `git status --short --branch`:

```text
## main...origin/main [ahead 33]
 M scripts/verify-command-authority.js
 M scripts/verify-composed-gate-policy.js
 M scripts/verify-enforcement-dry-run.js
 M scripts/verify-external-io-state.js
 M scripts/verify-gate-stack-readout.js
 M scripts/verify-service-registry.js
 M src/main/services/composedGatePolicyService.js
 M src/main/services/enforcementDryRunService.js
 M src/main/services/externalIoStateService.js
 M src/main/services/gateStackReadoutService.js
 M src/main/services/serviceRegistry.js
 M workspace/current.md
?? workspace/DevHS156-external-io-real-config.md
```

## Risks / Follow-Up

- `external_io.state_config_write` is now capable of writing the canonical app-local External I/O config when invoked from trusted main-process/direct context with `allowExternalIoStateConfigWrite`.
- No renderer/UI flow exists for operator control yet.
- Runtime enforcement remains inactive; future provider-backed movement still needs explicit enforcement/runway work before External I/O becomes a blocking runtime gate.

