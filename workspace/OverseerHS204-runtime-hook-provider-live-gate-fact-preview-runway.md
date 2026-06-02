# Overseer HS204 - Runtime Hook Provider Live Gate Fact Preview Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening

## Purpose

Close the next small runtime-hardening uncertainty by letting the existing inactive runtime enforcement hook preview see provider/live gate posture as a read-only fact.

This is still preview-only. It must not activate command blocking, dispatch providers, or record provider attempts.

## Current Basis

Accepted prior work:

- HS202/HS203 proved the inactive runtime hook can source storage authority, storage budget, and External I/O posture from existing read-only local posture.
- `provider_live_gate` remains visible as an unsourced fact class unless supplied.
- `liveApiGateService.actionGate(...)` already computes read-only live/provider posture for known actions.
- `liveApiGateService.enterLiveProviderAttempt(...)` records accepted attempts and must not be used by this packet.
- `support.gate_stack_readout` already uses `actionGate(...)` to expose live/provider gate posture without provider calls.

Current limitation:

- the inactive runtime hook can show External I/O held/released posture for provider-capable commands, but it cannot yet show the separate live/provider gate facts that would explain live API disabled, missing User-Agent, cooldown, lockout, duplicate running work, or live radius rejection.

## Task

Add read-only, non-enforcing `provider_live_gate` fact sourcing to the inactive runtime enforcement hook preview.

Preferred shape:

- use existing `actionGate(...)` or equivalent read-only live gate logic only
- never call `enterLiveProviderAttempt(...)`
- never call zKill, ESI, SDE download, provider runners, Watch executors, task dispatch, repositories, file writers, config writers, or handlers from the hook
- source `provider_live_gate` only for commands with a clear provider/live gate action mapping
- keep local-only commands explicitly local-only or not-applicable
- preserve explicitly supplied `runtimeEnforcementFacts.provider_live_gate` and do not overwrite it
- keep provider/live gate separate from External I/O, storage authority, storage budget, composed policy, confirmation, destination path authority, Watch arming, and runtime authorization

## Suggested Command Mapping

Use the existing service command/action meanings where they are already accepted:

- `manual.discovery` -> `manual.discovery`
- `manual.expansion` -> `manual.expansion`
- `metadata.hydration` -> `metadata.hydration`
- `sde.build-lookups` -> `sde.build-lookups`
- Watch execution commands may remain unsourced unless there is already a safe accepted mapping to `actor.watch` or `system.radius.watch` from existing command metadata/context.

Local-only commands should not become provider-capable because this fact exists.

Unknown or unmapped provider-capable commands should report explicit unknown/unmapped provider-live-gate posture rather than fail or guess.

## Required Fact Scope

For sourced provider/live gate facts, include the safe parts already returned by `actionGate(...)`, such as:

- provider capable / local-only posture
- mapped live gate action
- mode
- provider list
- allowed boolean as preview posture only
- state
- blocker codes/messages
- warning codes/messages
- estimated API calls
- request-control posture when already available:
  - provider
  - action
  - target type/id
  - lookback seconds
  - cap summary
  - scope fingerprint
  - cooldown active
  - lockout active
  - next eligible time
  - lockout until
  - blocked attempt count
  - last blocked reason
  - persistence

The fact must explicitly state that `allowed: true` is not runtime authorization.

## Preserve

- no active runtime enforcement
- no command blocking
- no handler dispatch from the hook
- no task wrapping or task execution from the hook
- no provider calls
- no provider attempt recording
- no service-memory cooldown/lockout mutation from the hook
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
2. Provider-capable commands with clear mappings can include sourced `provider_live_gate` facts.
3. `manual.discovery` with normal renderer confirmation reaches the inactive hook and shows provider/live gate posture without changing the existing live/API stop behavior.
4. Live API disabled and missing User-Agent remain read-only blocker posture, not runtime enforcement.
5. Live radius rejection remains a product boundary for live/manual discovery and does not call providers.
6. Local-only commands remain local-only and do not become provider-capable.
7. Supplied `runtimeEnforcementFacts.provider_live_gate` is preserved and not overwritten.
8. External I/O posture remains separate from provider/live gate posture and External I/O on remains non-authorizing.
9. `provider_live_gate.allowed === true` is not treated as runtime authorization.
10. Composed policy remains unsourced unless supplied.
11. Renderer-ineligible and missing-confirmation commands still stop before the inactive hook.
12. Runtime hook telemetry reports `provider_live_gate` as sourced when present and still reports other unsourced classes clearly.

## Stop Conditions

Stop if the implementation requires:

- active command blocking
- composed runtime authorization
- calling target handlers from the hook
- task dispatch or task wrapping from the hook
- `enterLiveProviderAttempt(...)`
- provider calls
- service-memory cooldown/lockout mutation from the hook
- config writes
- schema changes
- support artifact creation
- SDE import/download
- storage movement/migration
- UI work
- treating External I/O on as authorization
- treating provider/live gate `allowed` as authorization
- hiding missing fact classes
- blurring live/provider gate with External I/O, storage authority, confirmation, or composed policy

## Verification Expectations

Use Atlas-local offline verification only.

Likely proof set:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeHookTelemetryReadoutService.js
node --check src\main\services\liveApiGateService.js
node --check scripts\verify-runtime-enforcement-hook.js
node --check scripts\verify-runtime-hook-telemetry.js
node --check scripts\verify-live-api-gate.js
npm.cmd run verify:runtime-enforcement-hook
npm.cmd run verify:runtime-hook-telemetry
npm.cmd run verify:live-api-gate
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
workspace/DevHS204-runtime-hook-provider-live-gate-fact-preview.md
```
