# Overseer HS206 - Runtime Hook Composed Policy Fact Preview Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening

## Purpose

Close the next small runtime-hardening uncertainty by letting the existing inactive runtime enforcement hook preview see composed policy posture as a read-only fact.

This is still preview-only. It must not activate command blocking or treat composed policy as runtime authorization.

## Current Basis

Accepted prior work:

- HS202/HS203 sourced storage authority, storage budget, and External I/O facts into the inactive runtime hook.
- HS204/HS205 sourced provider/live gate facts into the inactive runtime hook.
- `storage.composed_gate_policy.preview` already exists as a read-only, non-enforcing composed policy preview.
- `composedGatePolicyService.buildComposedGatePolicyPreview(...)` already composes classification, storage, budget, External I/O, live/provider gate, cadence, Watch arming, active task, confirmation, destination/path authority, and trusted-context posture as policy preview rows.

Current limitation:

- the inactive runtime hook still reports `composed_gate_policy` as missing unless supplied.
- that leaves the hook able to show individual gate facts, but not the accepted composed policy posture for the command under preview.

## Task

Add read-only, non-enforcing `composed_policy` fact sourcing to the inactive runtime enforcement hook preview.

Preferred shape:

- source only a compact composed policy fact for the current command, not a bulky full preview dump
- use `buildComposedGatePolicyPreview(...)` or equivalent existing read-only composed policy logic
- match the current service command to the relevant composed policy row when one exists
- if no row exists, report explicit unmapped composed-policy posture rather than guessing
- preserve explicitly supplied `runtimeEnforcementFacts.composed_policy` and do not overwrite it
- keep composed policy separate from runtime authorization
- keep `would_allow`, `pass`, `conditional`, `hold`, and `block` as preview posture only
- leave destination path authority and Watch/task runtime facts separate unless already present in the composed policy row as read-only policy posture

## Required Fact Scope

For sourced composed policy facts, include safe compact fields such as:

- fact class / source / source status
- command
- matched composed policy row id, if any
- composed state
- reason codes
- active/enforcement/runtime authorization flags
- `would_allow_is_authorization: false`
- summary of relevant gate states, preferably by gate name and reason
- basis action: `storage.composed_gate_policy.preview`
- non-authorizing preview marker

Do not include unbounded row dumps, raw provider payloads, raw Evidence/EVEidence payloads, or support artifact content.

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
2. The inactive hook can include a sourced `composed_policy` fact for at least one mapped local/read-only command.
3. The inactive hook can include a sourced `composed_policy` fact for at least one mapped provider-capable command after normal renderer confirmation is satisfied.
4. The sourced fact is compact and command-focused rather than a full policy dump.
5. Supplied `runtimeEnforcementFacts.composed_policy` is preserved and not overwritten.
6. `composed_policy.state` is preview posture only and does not authorize runtime dispatch.
7. `would_allow`, `pass`, and External I/O on remain non-authorizing.
8. Provider/live gate, External I/O, storage authority, storage budget, confirmation, destination path authority, Watch arming, and runtime authorization remain distinguishable in the fact basis.
9. Renderer-ineligible and missing-confirmation commands still stop before the inactive hook.
10. Runtime hook telemetry reports `composed_gate_policy` as sourced when present and still reports other unsourced broad fact classes clearly.

## Stop Conditions

Stop if the implementation requires:

- active command blocking
- runtime authorization
- treating composed policy as a may-run-now answer
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
- hiding missing fact classes
- blurring composed policy with runtime authorization
- dumping unbounded composed policy rows into every hook preview

## Verification Expectations

Use Atlas-local offline verification only.

Likely proof set:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeHookTelemetryReadoutService.js
node --check src\main\services\composedGatePolicyService.js
node --check scripts\verify-runtime-enforcement-hook.js
node --check scripts\verify-runtime-hook-telemetry.js
node --check scripts\verify-composed-gate-policy.js
npm.cmd run verify:runtime-enforcement-hook
npm.cmd run verify:runtime-hook-telemetry
npm.cmd run verify:composed-gate-policy
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
workspace/DevHS206-runtime-hook-composed-policy-fact-preview.md
```
