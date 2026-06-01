# DevHS170 - Inactive Service-Boundary Hook

Status: completed
Date: 2026-06-01
Role: Atlas Dev

## Scope

Implemented the first inactive service-boundary preview hook in `invokeServiceCommand`. The hook is after existing renderer eligibility and confirmation authority checks, before task wrapping and handler dispatch.

It is non-blocking and behavior-preserving.

## Files Changed

- `src/main/services/serviceRegistry.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS170-inactive-service-boundary-hook.md`

## Hook Shape

Added `emitInactiveRuntimeEnforcementPreview(command, definition, payload, context)`.

The hook:

- builds an inactive dry adapter preview using `buildDryRuntimeEnforcementAdapterDecision`
- uses command definition, command, payload, context source, and explicitly supplied trusted context facts only
- accepts facts from `context.runtimeEnforcementFacts` / `context.runtime_enforcement_facts`
- optionally calls `context.runtimeEnforcementPreviewObserver` / `context.runtime_enforcement_preview_observer`
- returns preview internally, but never authorizes, blocks, throws, dispatches, or changes command output

The hook does not source broad canonical facts. It does not call readout builders, config readers, DB repositories, providers, task runners, file writers, config writers, or mutating services.

## Focused Verification

Added:

```powershell
npm.cmd run verify:runtime-enforcement-hook
```

Focused verifier proves:

- hook runs after renderer eligibility and confirmation
- hook runs before task wrapping
- command results are unchanged when observer is absent
- command results are unchanged when observer is present
- observer receives inactive preview data when supplied
- renderer-ineligible commands stop before hook
- missing renderer confirmation stops before hook
- trusted/internal confirmation bypass remains distinct from confirmation satisfaction
- unknown commands stop before hook
- hook itself does not call target handlers, task runners, providers, repositories, file writers, or config writers
- dry-run `would_allow` remains non-authorizing
- External I/O on remains non-authorizing
- unknown/unclassified fail-closed remains inactive

Sample output:

```json
{
  "status": "inactive runtime enforcement service-boundary hook verified",
  "proof": {
    "active_runtime_enforcement": false,
    "command_blocking": false,
    "dispatch_changed": false,
    "observer_optional": true,
    "renderer_ineligible_stops_before_hook": true,
    "missing_confirmation_stops_before_hook": true,
    "hook_runs_before_task_wrapping": true
  }
}
```

## Behavior Confirmation

No active behavior changed:

- runtime enforcement active: no
- command blocking/interception: no
- handler result change: no
- task wrapping change: no
- provider/zKill/ESI/SDE calls: no
- Evidence/EVEidence writes: no
- Discovery mutations: no
- Hydration writes: no
- storage config writes: no
- support artifact creation: no
- schema migration: no
- renderer/UI work: no
- broad canonical fact sourcing: no

## Verification

Passed:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeEnforcementEvaluator.js
node --check scripts\verify-runtime-enforcement-hook.js
npm.cmd run verify:runtime-enforcement-hook
npm.cmd run verify:runtime-enforcement-adapter
npm.cmd run verify:runtime-enforcement-evaluator
npm.cmd run verify:runtime-enforcement-boundary
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:protected-terms` exited 0 with advisory warnings only. No protected-term renames or authority updates were made.

## Risk / Next Action

Risk is contained to an inactive observer hook. It proves live boundary plumbing, but active enforcement still needs canonical fact sourcing and an explicit accepted packet before blocking can exist.

Recommended next action: Overseer review HS170, then decide whether to close another missing fact class, add a fuller readout of hook telemetry, or open an explicitly scoped active-policy design review.
