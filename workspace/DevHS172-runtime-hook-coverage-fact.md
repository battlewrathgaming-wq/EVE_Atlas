# DevHS172 Runtime Hook Coverage Fact

Status: complete
Executor: Dev
Date: 2026-06-01

## Scope

Implemented the HS172 read-only fact seam: the inactive service-boundary runtime enforcement preview hook now attaches command classification coverage from the existing in-memory enforcement dry-run coverage map.

This remains preview-only. It does not block, authorize, change dispatch, call handlers early, wrap tasks differently, call providers, source runtime/storage facts, or write anything.

## Files Changed

- `src/main/services/serviceRegistry.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `workspace/current.md`
- `workspace/DevHS172-runtime-hook-coverage-fact.md`

## Implementation

- Imported `COMMAND_ENFORCEMENT_COVERAGE` from the existing enforcement dry-run service.
- Extended `runtimeEnforcementFactsFor(command, context)` so it adds only the current command's classification coverage when context did not already supply a `coverage` key.
- Preserved command-scoped facts from `context.runtimeEnforcementFacts[command]`.
- Preserved whole-context facts from `context.runtimeEnforcementFacts`.
- Preserved explicit supplied `coverage`, including `coverage: null`, so missing classification coverage remains visible instead of being silently repaired.
- Exported `runtimeEnforcementFactsFor` for focused verifier proof.

No storage authority, budget, External I/O, provider/live gate, destination/path, Watch/task, DB, config, or runtime state facts are sourced.

## Merge Order

1. Use explicitly supplied command-scoped facts when present.
2. Otherwise use explicitly supplied whole-context facts.
3. If the selected fact object has its own `coverage` key, preserve it exactly.
4. If no `coverage` key is present, attach the existing coverage map entry for the current command.
5. If no map entry exists, do not invent coverage; the adapter still reports `classification_coverage` as missing.

## Sample Hook Output

Focused verifier output:

```json
{
  "status": "inactive runtime enforcement service-boundary hook verified",
  "proof": {
    "active_runtime_enforcement": false,
    "command_blocking": false,
    "dispatch_changed": false,
    "observer_optional": true,
    "command_coverage_sourced": true,
    "supplied_facts_preserved": true,
    "supplied_coverage_not_overwritten": true,
    "broad_fact_sourcing": false,
    "renderer_ineligible_stops_before_hook": true,
    "missing_confirmation_stops_before_hook": true,
    "hook_runs_before_task_wrapping": true,
    "dry_run_would_allow_is_authorization": false,
    "external_io_on_is_authorization": false,
    "unknown_fail_closed_active": false,
    "target_handlers_called_by_hook": false,
    "task_runners_called_by_hook": false,
    "providers_called_by_hook": false,
    "repositories_called_by_hook": false,
    "file_writers_called_by_hook": false,
    "config_writers_called_by_hook": false
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
- `npm.cmd run verify:runtime-enforcement-hook`
- `npm.cmd run verify:runtime-enforcement-adapter`
- `npm.cmd run verify:runtime-enforcement-evaluator`
- `npm.cmd run verify:runtime-enforcement-boundary`
- `npm.cmd run verify:enforcement-dry-run`
- `npm.cmd run verify:composed-gate-policy`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:protected-terms`
- `git diff --check`
- `git status --short --branch`

Notes:

- `verify:protected-terms` passed with advisory warning-only output for existing/current terms.
- `git diff --check` passed; Git reported CRLF-normalization warnings for edited JS files.

## Boundary Confirmation

- No active runtime enforcement was added.
- No command blocking was added.
- No command dispatch behavior changed.
- No handler result behavior changed.
- No task wrapping behavior changed.
- No provider, zKill, ESI, or SDE download calls were added.
- No Evidence/EVEidence, Discovery ref, Hydration, storage config, support artifact, snapshot, or trace-pack writes were added.
- No cleanup, deletion, pruning, restore, move, copy, migration, upload, packaging, schema migration, renderer redesign, or UI wording work was added.
- Dry-run `would_allow` remains non-authoritative.
- External I/O on remains non-authoritative.
- Unknown/unclassified fail-closed remains inactive policy intent only.

## Risks / Follow-Up

- Coverage now comes from an imported in-memory map. If future coverage moves behind a side-effectful builder, this seam should be revisited before active enforcement.
- The hook still lacks canonical storage, budget, External I/O, provider/live, Watch/task, destination/path, DB/config/runtime state facts by design. Future packets should add exactly one fact class at a time.
