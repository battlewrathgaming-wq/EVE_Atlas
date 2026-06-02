# Overseer HS208 - Runtime Hook Destination Path Authority Fact Preview Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening

## Purpose

Close the remaining support-artifact path authority uncertainty in the inactive runtime enforcement hook preview.

This is still preview-only. It must not create support artifacts, authorize paths, or activate command blocking.

## Current Basis

Accepted prior work:

- HS202/HS203 sourced storage authority, storage budget, and External I/O facts into the inactive runtime hook.
- HS204/HS205 sourced provider/live gate facts into the inactive runtime hook.
- HS206/HS207 sourced compact composed policy facts into the inactive runtime hook.
- `support.artifact_path_authority.preview` already exists as a read-only support artifact path authority inventory.
- `supportArtifactPathAuthorityService.buildSupportArtifactPathAuthorityPreview(...)` already ignores renderer-forged path claims and reports snapshot, trace-pack, log, cache, SDE, readiness/preflight, and fixture proof path posture without creating files.

Current limitation:

- the inactive runtime hook still reports `destination_path_authority` as missing for support-artifact commands unless supplied.
- this leaves support artifact command previews less complete than the existing read-only path authority service can support.

## Task

Add read-only, non-enforcing `destination_path_authority` fact sourcing to the inactive runtime enforcement hook preview.

Preferred shape:

- source compact destination/path authority facts only for commands whose effects require support artifact destination authority
- use existing `buildSupportArtifactPathAuthorityPreview(...)` or equivalent read-only path authority logic
- preserve explicitly supplied `runtimeEnforcementFacts.destination_path_authority` and do not overwrite it
- ignore renderer-forged path claims
- report not-applicable posture for commands without support-artifact destination needs
- report explicit unmapped posture for support-artifact commands that cannot be mapped to an accepted artifact class
- keep destination/path authority separate from storage authority, budget, composed policy, support artifact creation policy, and runtime authorization

## Suggested Mapping

Use accepted artifact classes where practical:

- `runtime.db_snapshot.create` -> runtime snapshot destination classes
- `support.debug_trace_pack` -> operator debug trace-pack destination class

Other commands should remain not-applicable unless their service metadata already clearly indicates support-artifact destination authority.

## Required Fact Scope

For sourced destination/path authority facts, include compact safe fields such as:

- fact class / source / source status
- command
- applies boolean
- mapped artifact class id(s), if any
- destination/path state or posture
- renderer authoritative: false
- renderer path claims ignored
- requires storage authority
- counts against storage budget
- cleanup stage
- privacy/sensitivity summary
- provider posture
- External I/O relevance
- non-authorizing preview marker

Do not include unbounded path inventories, raw Evidence/EVEidence payloads, raw provider payloads, support artifact contents, or renderer-forged path strings.

## Preserve

- no active runtime enforcement
- no command blocking
- no handler dispatch from the hook
- no task wrapping or task execution from the hook
- no provider calls
- no provider attempt recording
- no service-memory cooldown/lockout mutation from the hook
- no support artifact creation
- no snapshot creation
- no trace-pack creation
- no file or directory creation
- no filesystem deletion/move/copy
- no SDE download/import
- no Hydration writes
- no Evidence/EVEidence creation
- no Discovery ref mutation
- no Watch, Assessment Memory, or Marked mutation
- no schema changes
- no config writes
- no storage movement or migration
- no renderer UI work
- no pruning or deletion behavior

## Acceptance Criteria

Dev should prove:

1. Existing service command results remain unchanged with and without a runtime preview observer.
2. The inactive hook can include sourced `destination_path_authority` fact posture for `runtime.db_snapshot.create` after existing front-door confirmation is satisfied.
3. The inactive hook can include sourced `destination_path_authority` fact posture for `support.debug_trace_pack` after existing front-door confirmation is satisfied.
4. The sourced fact is compact and command-focused rather than a full path-authority inventory dump.
5. Renderer-forged path claims are ignored and not echoed in hook facts.
6. Supplied `runtimeEnforcementFacts.destination_path_authority` is preserved and not overwritten.
7. Local/read-only and provider-capable commands without support-artifact destination needs remain not-applicable.
8. Destination/path authority posture is not treated as runtime authorization.
9. Runtime hook telemetry reports `destination_path_authority` as sourced when present.
10. Renderer-ineligible and missing-confirmation commands still stop before the inactive hook.

## Stop Conditions

Stop if the implementation requires:

- active command blocking
- runtime authorization
- treating destination/path authority as a may-run-now answer
- calling target handlers from the hook
- task dispatch or task wrapping from the hook
- provider calls
- support artifact creation
- snapshot or trace-pack creation
- file or directory creation
- filesystem deletion/move/copy
- config writes
- schema changes
- SDE import/download
- storage movement/migration
- UI work
- hiding missing fact classes
- accepting renderer path claims as authority
- dumping unbounded path authority inventories into every hook preview

## Verification Expectations

Use Atlas-local offline verification only.

Likely proof set:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\runtimeEnforcementDryAdapter.js
node --check src\main\services\runtimeHookTelemetryReadoutService.js
node --check src\main\services\supportArtifactPathAuthorityService.js
node --check scripts\verify-runtime-enforcement-hook.js
node --check scripts\verify-runtime-hook-telemetry.js
node --check scripts\verify-support-artifact-path-authority.js
npm.cmd run verify:runtime-enforcement-hook
npm.cmd run verify:runtime-hook-telemetry
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:support-artifact-creation-policy
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:trace-pack-redaction
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
workspace/DevHS208-runtime-hook-destination-path-authority-fact-preview.md
```
