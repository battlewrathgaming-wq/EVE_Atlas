# DevHS162 - Runtime Enforcement Boundary Preview

Status: complete

## Summary

Implemented `runtime.enforcement_boundary.preview`, a read-only proof of the first runtime enforcement boundary at the service invocation layer.

The preview models where future enforcement would run in `invokeServiceCommand` and reports representative envelope decisions without installing enforcement, blocking commands, wrapping tasks, dispatching handlers, calling providers, writing files, mutating DB rows, or changing schema.

## Files Changed

- `package.json`
- `src/main/services/runtimeEnforcementBoundaryService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/composedGatePolicyService.js`
- `scripts/verify-runtime-enforcement-boundary.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-composed-gate-policy.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-service-registry.js`
- `workspace/current.md`
- `workspace/DevHS162-runtime-enforcement-boundary-preview.md`

## Command / Readout Added

Added:

```txt
runtime.enforcement_boundary.preview
```

Registry posture:

- classification: `read-only`
- effects: `read-only`
- renderer eligible: true
- handler dispatches: 0
- task executions: 0
- command blocking active: false
- runtime enforcement active: false

## Proposed Insertion Point

Function:

```txt
invokeServiceCommand(command, payload, context)
```

Current order:

1. validate service envelope
2. resolve command definition
3. require `context.db`
4. renderer eligibility check
5. confirmation authority check
6. optional task wrapping
7. handler dispatch

Proposed future order:

1. validate service envelope
2. resolve command definition
3. require `context.db`
4. renderer eligibility check
5. confirmation authority check
6. runtime enforcement decision boundary
7. optional task wrapping
8. handler dispatch

This keeps future enforcement after existing front-door checks, and before any task or handler can move work.

## Representative Envelopes

Covered:

- `report.actor`
- `storage.authority_config.readback`
- `storage.authority_config.write`
- `manual.discovery`
- `manual.expansion`
- `metadata.hydration`
- `watch.executor.tick`
- `runtime.db_snapshot.create`
- `support.debug_trace_pack`
- `task.cancel`
- `storage.authority_config.write_proof`
- `future.unclassified.command`

For each envelope the preview reports:

- command eligibility
- confirmation state
- storage authority
- budget posture
- External I/O posture
- provider/live gate posture
- destination/path authority where relevant
- trusted-context requirement
- composed decision
- whether the composed decision is active

## Sample Output

Focused verifier sample:

```json
{
  "command": "runtime.enforcement_boundary.preview",
  "summary": {
    "total_envelopes": 12,
    "by_composed_decision": {
      "pass": 1,
      "conditional": 6,
      "block": 5
    },
    "provider_capable": [
      "provider_backed_discovery",
      "esi_evidence_expansion",
      "hydration_write",
      "watch_execution_scheduled_provider"
    ],
    "support_artifact": [
      "runtime_snapshot_creation",
      "trace_pack_creation"
    ],
    "unknown_unclassified": [
      "unknown_unclassified_future_command"
    ]
  },
  "semantics": {
    "would_allow_is_authorization": false,
    "external_io_on_is_authorization": false,
    "unknown_unclassified_fail_closed_active": false,
    "unknown_unclassified_future_posture": "fail_closed_intent_only",
    "preview_only": true
  },
  "proof": {
    "target_handlers_called": false,
    "command_blocking_created": false,
    "runtime_interception_created": false,
    "task_wrapping_invoked": false,
    "provider_movement_created": false
  }
}
```

## Verification

Passed:

```powershell
node --check src\main\services\runtimeEnforcementBoundaryService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\composedGatePolicyService.js
node --check scripts\verify-runtime-enforcement-boundary.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
node --check scripts\verify-composed-gate-policy.js
npm.cmd run verify:runtime-enforcement-boundary
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:support-artifact-creation-policy
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
- `git status --short --branch`: `main...origin/main [ahead 39]` with HS162 modified/untracked files.

## Boundary Confirmation

No runtime enforcement, command blocking, command interception, target handler dispatch, task execution, provider calls, zKill calls, ESI calls, SDE downloads, file writes, directory creation, DB mutations, Evidence/EVEidence writes, Discovery mutations, Hydration writes, storage config writes, support artifact creation, snapshot creation, trace-pack creation, schema migration, or UI changes were performed.

`would_allow` remains non-authorizing. External I/O on remains non-authorizing. Unknown/unclassified fail-closed remains inactive policy intent only.

## Risks / Notes

- The preview proposes enforcement after renderer eligibility and confirmation checks. If future enforcement needs to inspect missing-confirmation cases before confirmation rejection, that should be opened explicitly because it changes the front-door ordering.
- The preview still relies on readout composition rather than a shared enforcement evaluator. That is correct for HS162, but future active enforcement should extract a deliberately small evaluator before command blocking is activated.
