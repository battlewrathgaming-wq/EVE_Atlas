# DevHS174 Runtime Hook Telemetry Readout

Status: complete
Executor: Dev
Date: 2026-06-01

## Scope

Implemented a read-only telemetry/readout seam for inactive runtime hook preview objects.

The readout summarizes explicitly supplied preview objects. Verification also proves it can summarize previews captured by an explicit trusted diagnostic observer. No default runtime capture, persistence, support artifact creation, provider calls, repository calls, task runner calls, file writes, config writes, or target handler dispatch are added.

## Files Changed

- `src/main/services/runtimeHookTelemetryReadoutService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-runtime-hook-telemetry.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS174-runtime-hook-telemetry-readout.md`

## Service / Command Surface

Added:

```txt
runtime.enforcement_hook_telemetry.readout
```

Shape:

- classification: `read-only`
- effects: `read-only`
- renderer eligible: yes
- input: explicit preview object(s), via `preview` or `previews`
- output: summarized inactive hook telemetry

The command is classified in the enforcement coverage map as `read_only_non_enforcing_proof`.

## Readout Fields

The readout reports:

- command
- source
- evaluator decision
- missing fact classes
- coverage present versus missing/null
- whether broad fact-class inputs are absent
- active runtime enforcement false
- preview-only true
- dry-run `would_allow` non-authorizing
- External I/O on non-authorizing
- no telemetry persistence, support artifacts, provider calls, repository calls, task runner calls, file writes, config writes, or handler dispatches

## Sample Output

Focused verifier sample:

```json
{
  "status": "runtime hook telemetry readout verified",
  "empty_preview_count": 0,
  "captured_sample": {
    "command": "scope.defaults",
    "evaluator_decision": "conditional",
    "missing_fact_classes": [
      "composed_gate_policy",
      "storage_authority",
      "storage_budget"
    ],
    "coverage_status": "present_from_hook_or_supplied_fact",
    "broad_fact_classes_absent": true,
    "active_runtime_enforcement": false,
    "active_enforcement_false": true,
    "preview_only": true,
    "dry_run_would_allow_non_authorizing": true,
    "external_io_on_non_authorizing": true
  },
  "missing_coverage_sample": {
    "command": "scope.defaults",
    "coverage_status": "missing_or_null",
    "missing_fact_classes": [
      "classification_coverage",
      "composed_gate_policy",
      "storage_authority",
      "storage_budget"
    ]
  },
  "proof": {
    "readout_summarizes_supplied_previews": true,
    "readout_summarizes_captured_previews": true,
    "empty_preview_input_supported": true,
    "missing_fact_classes_are_reported_not_failures": true,
    "coverage_present_and_missing_reported": true,
    "broad_fact_classes_sourced": false,
    "telemetry_persisted": false,
    "support_artifacts_created": false,
    "active_runtime_enforcement": false,
    "command_blocking": false,
    "dispatch_changed": false,
    "providers_called": false,
    "repositories_called": false,
    "file_writers_called": false,
    "config_writers_called": false
  }
}
```

## Verification

Passed:

- `node --check src\main\services\serviceRegistry.js`
- `node --check src\main\services\runtimeEnforcementDryAdapter.js`
- `node --check src\main\services\runtimeEnforcementEvaluator.js`
- `node --check scripts\verify-runtime-enforcement-hook.js`
- `node --check scripts\verify-runtime-enforcement-adapter.js`
- `node --check src\main\services\runtimeHookTelemetryReadoutService.js`
- `node --check src\main\services\enforcementDryRunService.js`
- `node --check scripts\verify-runtime-hook-telemetry.js`
- `node --check scripts\verify-command-authority.js`
- `node --check scripts\verify-service-registry.js`
- `node --check scripts\verify-passive-side-effects.js`
- `npm.cmd run verify:runtime-enforcement-hook`
- `npm.cmd run verify:runtime-enforcement-adapter`
- `npm.cmd run verify:runtime-enforcement-evaluator`
- `npm.cmd run verify:runtime-enforcement-boundary`
- `npm.cmd run verify:runtime-hook-telemetry`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:composed-gate-policy`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:protected-terms`
- `git diff --check`
- `git status --short --branch`

Notes:

- `verify:protected-terms` passed with advisory warning-only output.
- `git diff --check` passed; Git reported CRLF-normalization warnings for edited files.

## Boundary Confirmation

- No active runtime enforcement was added.
- No command blocking was added.
- No command dispatch behavior changed.
- No handler result behavior changed.
- No task wrapping behavior changed.
- No provider, zKill, ESI, or SDE download calls were added.
- No Evidence/EVEidence, Discovery ref, Hydration, storage config, support artifact, snapshot, trace-pack, telemetry log, or persisted telemetry writes were added.
- No storage authority, budget, External I/O, provider/live gate, destination/path, Watch/task, DB, config, or runtime state facts were sourced.
- No cleanup, deletion, pruning, restore, move, copy, migration, upload, packaging, schema migration, renderer redesign, or UI wording work was added.
- Dry-run `would_allow` remains non-authoritative.
- External I/O on remains non-authoritative.
- Unknown/unclassified fail-closed remains inactive policy intent only.

## Risks / Follow-Up

- The readout can only report what exists in supplied preview objects. It deliberately does not collect missing canonical fact classes from storage/config/DB/runtime state.
- Future fact-class packets can use this readout to inspect boundary posture before considering any active enforcement.
