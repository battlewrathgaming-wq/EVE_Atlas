# DevHS166 - Dry Runtime Enforcement Adapter

Status: completed
Date: 2026-06-01
Role: Atlas Dev

## Scope

Implemented the HS166 dry runtime enforcement adapter proof. This shows how service-boundary facts can be assembled for the inactive evaluator without inserting enforcement into `invokeServiceCommand`.

## Files Changed

- `src/main/services/runtimeEnforcementDryAdapter.js`
- `src/main/services/runtimeEnforcementEvaluator.js`
- `scripts/verify-runtime-enforcement-adapter.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS166-dry-runtime-enforcement-adapter.md`

## Adapter Shape

Added `buildDryRuntimeEnforcementAdapterDecision({ command, payload, context, definition, facts })`.

The result includes:

- command
- source
- renderer eligibility posture
- confirmation posture
- trusted/internal context posture
- evaluator decision
- `would_block_if_active`
- `would_dispatch_if_active`
- `active: false`
- `preview_only: true`
- missing fact classes
- dry-run non-authority notes
- no-side-effect proof flags

The adapter accepts explicit facts only. It does not call target handlers, task runners, providers, repositories, file writers, config writers, mutating services, or readout builders.

## Missing Fact Proof

The adapter reports missing fact classes instead of using dry-run `would_allow` as execution authority.

Sample verifier output:

```json
{
  "id": "missing_fact_dry_run_would_allow_not_authority",
  "command": "report.actor",
  "decision": "conditional",
  "would_dispatch_if_active": false,
  "missing_fact_classes": [
    "composed_gate_policy",
    "storage_authority",
    "storage_budget"
  ],
  "dry_run_used_as_authority": false
}
```

## Representative Coverage

`npm.cmd run verify:runtime-enforcement-adapter` covered:

- safe local read/report
- renderer-ineligible trusted command
- missing confirmation
- satisfied confirmation
- trusted/internal config write
- provider-backed Discovery
- ESI Evidence/EVEidence expansion
- Hydration write
- Watch execution
- support artifact creation
- unknown command before boundary

Focused verifier summary:

```json
{
  "total_cases": 11,
  "by_decision": {
    "pass": 1,
    "conditional": 3,
    "stop_before_boundary": 2,
    "block": 5
  }
}
```

## Invoke Behavior

`invokeServiceCommand` was not changed. The verifier confirms the dry adapter is not called from `invokeServiceCommand`, and the current order still includes renderer eligibility, confirmation authority, optional task wrapping, and handler dispatch.

## Evaluator Adjustment

Updated `runtimeEnforcementEvaluator` so confirmation is considered missing only when the supplied confirmation posture would stop before the boundary. This preserves the current trusted/internal service-boundary behavior where non-renderer calls can bypass front-door confirmation unless `enforceAuthority` is set.

## Non-Enforcement Confirmation

The implementation remains dry and preview-only:

- runtime enforcement active: no
- command blocking/interception: no
- `invokeServiceCommand` behavior change: no
- target handler dispatch from adapter tests: no
- task wrapping/execution from adapter tests: no
- provider/zKill/ESI/SDE calls: no
- Evidence/EVEidence writes: no
- Discovery mutations: no
- Hydration writes: no
- storage config writes: no
- support artifact creation: no
- schema migration: no
- renderer/UI work: no

## Verification

Passed:

```powershell
node --check src\main\services\runtimeEnforcementEvaluator.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check scripts\verify-runtime-enforcement-adapter.js
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

Risk is contained to preview code and verifier coverage. The dry adapter now proves fact assembly, but active enforcement still needs a separate accepted packet before anything can touch command dispatch.

Recommended next action: Overseer review HS166, then decide whether the next runway is a first inactive service-boundary integration hook, an active-enforcement policy review, or another fact-class gap closure.
