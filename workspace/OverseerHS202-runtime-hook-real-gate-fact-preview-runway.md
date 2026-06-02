# Overseer HS202 - Runtime Hook Real Gate Fact Preview Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening

## Purpose

Close the next small runtime-hardening uncertainty by letting the existing inactive runtime enforcement hook preview see real read-only gate facts for storage authority and External I/O posture.

This is still preview-only. It must not activate command blocking.

## Current Basis

Accepted prior work:

- HS158/HS159 made real app-local storage authority config readback/write available.
- HS156/HS157 made real app-local External I/O config readback/write available.
- HS162-HS175 created the inactive runtime enforcement boundary, evaluator, dry adapter, service-boundary hook, classification coverage, and telemetry readout.
- HS200/HS201 separated local SDE readiness gaps from ESI Hydration.

Current limitation:

- the inactive runtime hook currently sources command classification coverage, but broad gate facts such as storage authority, storage budget, and External I/O remain absent unless explicitly supplied by the caller.

## Task

Add a read-only, non-enforcing fact-sourcing preview for the inactive runtime enforcement hook so it can report storage and External I/O posture from existing real readback sources.

Preferred shape:

- keep the existing hook command path and observer behavior
- source only read-only facts that are already available from accepted local config/readback posture
- preserve explicitly supplied `runtimeEnforcementFacts` as authoritative test/diagnostic input
- distinguish:
  - fact class sourced and configured
  - fact class sourced but absent/unconfigured
  - fact class still not sourced
- update the runtime hook telemetry readout so sourced broad facts are visible and no longer reported as universally absent

## Required Fact Scope

Source, if practical:

- `storage_authority`
  - selected storage/app-local fallback posture
  - validation/config status
  - fallback acknowledgement status if available
- `budget`
  - configured byte budget if available
  - missing budget / budget-not-configured posture if applicable
- `external_io`
  - persisted/app-local External I/O state
  - off as held posture
  - on as release to normal gates only, not authorization

Leave unsourced or explicitly missing unless already safely available:

- composed gate policy
- provider live gate
- destination path authority
- Watch runtime state
- active task state

## Preserve

- no active runtime enforcement
- no command blocking
- no handler dispatch from the hook
- no provider calls
- no SDE download/import
- no Hydration writes
- no Evidence/EVEidence creation
- no Discovery ref mutation
- no Watch, Assessment Memory, or Marked mutation
- no schema changes
- no support artifact creation
- no config writes
- no storage movement or migration
- no renderer UI work
- no pruning or deletion behavior

## Acceptance Criteria

Dev should prove:

1. Existing service command results remain unchanged with and without a runtime preview observer.
2. The inactive hook can include storage authority and budget facts derived from existing read-only local config/readback posture.
3. The inactive hook can include External I/O facts derived from existing read-only local config/readback posture.
4. Missing storage config, missing budget, or missing External I/O config are represented as read-only posture, not command failure.
5. Explicitly supplied runtime enforcement facts are preserved and not overwritten by sourced facts.
6. Active runtime enforcement remains false.
7. `would_allow`, External I/O on, and sourced gate facts remain non-authorizing.
8. Provider-capable commands still require normal front-door confirmation/live/API gates before existing behavior runs.
9. Renderer-ineligible and missing-confirmation commands still stop before the inactive hook.
10. Runtime hook telemetry shows sourced broad fact classes when present and still reports unsourced classes clearly.

## Stop Conditions

Stop if the implementation requires:

- active command blocking
- composed runtime authorization
- calling target handlers from the hook
- config writes
- provider calls
- schema changes
- support artifact creation
- SDE import/download
- storage movement/migration
- UI work
- treating External I/O on as authorization
- treating sourced facts as Dev/run authorization
- hiding missing fact classes

## Verification Expectations

Use Atlas-local offline verification only.

Likely proof set:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeHookTelemetryReadoutService.js
node --check scripts\verify-runtime-enforcement-hook.js
node --check scripts\verify-runtime-hook-telemetry.js
npm.cmd run verify:runtime-enforcement-hook
npm.cmd run verify:runtime-hook-telemetry
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:external-io-state
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

## Expected Handoff

```txt
workspace/DevHS202-runtime-hook-real-gate-fact-preview.md
```

