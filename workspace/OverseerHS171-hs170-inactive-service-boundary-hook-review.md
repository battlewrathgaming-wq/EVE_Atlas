# OverseerHS171 - HS170 Inactive Service-Boundary Hook Review

Status: accepted
Date: 2026-06-01
Role: Atlas Overseer

## Request Reviewed

HS170 asked Dev to add the first inactive service-boundary hook after existing renderer eligibility and confirmation authority checks, before task wrapping and handler dispatch.

The hook had to be non-blocking, behavior-preserving, preview-only, and limited to boundary plumbing proof. It could use command definition, command, payload, context source, and explicitly supplied trusted context facts. It could optionally report preview data to a trusted observer.

## Files Reviewed

- `workspace/current.md`
- `workspace/DevHS170-inactive-service-boundary-hook.md`
- `package.json`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-runtime-enforcement-hook.js`
- `scripts/verify-runtime-enforcement-adapter.js`

## Acceptance

Accepted after one Overseer proof-language correction.

HS170 successfully proves the live service boundary can call an inactive runtime-enforcement preview hook without changing command behavior.

Accepted facts:

- Hook is placed after `assertCommandEligible` and `assertCommandAuthority`.
- Hook runs before task wrapping and handler dispatch.
- Hook uses the dry adapter/evaluator path.
- Hook uses only definition, command, payload, context source, and explicit trusted `context.runtimeEnforcementFacts` / `context.runtime_enforcement_facts`.
- Hook may call an optional trusted observer.
- Observer failures are swallowed.
- No observer means no runtime side effect beyond local preview construction.
- Hook does not block, authorize, dispatch differently, mutate payload, change handler result, or change task wrapping.
- Hook does not call providers, repositories, task runners, file writers, config writers, DB readouts, config readbacks, mutating services, or broad canonical fact sources.

## Overseer Correction

The older HS166 adapter verifier still reported `adapter_inserted: false`, which was true before HS170 but could become misleading now that HS170 intentionally adds an indirect inactive preview hook.

Correction made:

- renamed proof output to `adapter_called_directly_from_invoke: false`
- added `inactive_preview_hook_may_call_adapter: true`
- kept the assertion that `invokeServiceCommand` does not call `buildDryRuntimeEnforcementAdapterDecision` directly

This keeps HS166 and HS170 proof language aligned without changing product behavior.

## Verification

Passed during review:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeEnforcementEvaluator.js
node --check scripts\verify-runtime-enforcement-hook.js
node --check scripts\verify-runtime-enforcement-adapter.js
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
```

`verify:protected-terms` exited 0 with advisory warnings only. No protected-term JSON updates or renames were performed.

## Boundary Confirmation

No active runtime enforcement was added.

No command blocking, behavior-changing interception, dispatch change, handler result change, task wrapping change, provider calls, zKill calls, ESI calls, SDE downloads, Evidence/EVEidence writes, Discovery mutations, Hydration writes, storage config writes, support artifact creation, schema migration, renderer/UI work, or broad canonical fact sourcing was performed.

## Disposition

Accepted into:

- `workspace/current.md`
- `workspace/overview.md`
- `docs/current-state/current-storage-runtime-hardening.md`

No new Dev runway is opened by this review.

## Recommended Next Shape

Atlas now has the live boundary plumbing proof.

Recommended next decision candidates:

1. Add a read-only hook telemetry/readout surface from captured previews, still no blocking.
2. Close one missing fact class by sourcing a canonical read-only fact safely.
3. Pause runtime enforcement and continue support artifact creation hardening.

Do not jump directly to active runtime blocking.
