# OverseerHS159 - HS158 Storage Authority Real Config Review

Status: accepted
Role: Overseer
Date: 2026-06-01

## Reviewed

- `workspace/current.md`
- `workspace/DevHS158-storage-authority-real-config.md`
- `workspace/OverseerHS158-storage-authority-real-config-decision.md`
- `workspace/OverseerHS158-storage-authority-real-config-runway.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/storageAuthorityConfigWriteService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/composedGatePolicyService.js`
- `scripts/verify-storage-authority-config-write.js`
- `scripts/verify-storage-setup-gate.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `scripts/verify-composed-gate-policy.js`

## Decision

HS158 is accepted.

Atlas now has real app-local storage authority config support while preserving storage trust as explicit operator posture.

Accepted commands:

```text
storage.authority_config.readback
storage.authority_config.write
storage.authority_config.write_proof
storage.authority_config.acknowledgement_persistence_proof
```

Canonical config target:

```text
<Atlas app/root>/config/storage-authority.json
```

In this repo:

```text
F:\Projects\AURA-Atlas\config\storage-authority.json
```

## Accepted Meaning

- App-local fallback storage remains distinct from selected storage.
- App-local fallback storage is accepted only through explicit acknowledgement posture.
- `fallback_acknowledgement_needs_reconfirm` is a visible reconfirmation state, not hidden acceptance.
- The 5GB suggested/default budget is a suggestion, not operator acceptance.
- Explicit operator-selected budgets persist; Dev verified 10GB.
- Budget remains disk-space authority, not provider/API pacing.
- Runtime enforcement remains inactive.

## Boundary Check

Accepted:

- renderer-eligible read-only storage authority config readback
- trusted-context-only storage authority config write/readback
- fixture-only write proof retained
- fixture-only acknowledgement persistence proof retained
- canonical app/root storage authority config target
- persisted config integration into `storage.setup_gate_readout`
- service registry, command authority, passive side-effect, enforcement dry-run, composed gate policy, and storage setup gate coverage

Not added:

- runtime enforcement
- command interception or blocking
- provider movement
- zKill, ESI, or SDE calls
- Evidence/EVEidence writes
- Discovery ref mutation
- Hydration writes
- queue dispatch
- Watch execution behavior changes
- DB creation
- DB/storage movement, copy, migration, relocation, restore, deletion, cleanup, or pruning
- support artifact, snapshot, or trace-pack creation
- schema changes
- renderer UI or setup flow
- renderer path authority, budget forging, acknowledgement forging, app-root forging, or filesystem probing

## Overseer Correction

I removed a duplicate `resolveWriteTarget` helper declaration from `src/main/services/storageAuthorityConfigWriteService.js`.

The duplicate did not break syntax because the later declaration won, but leaving both would make future maintenance less honest. The focused storage verifier still passes after cleanup.

## Verification

Passed:

```powershell
node --check src\main\services\storageAuthorityConfigWriteService.js
node --check src\main\services\storageSetupGateReadoutService.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-storage-authority-config-write.js
node --check scripts\verify-storage-setup-gate.js
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
Test-Path config\storage-authority.json
git diff --check
git status --short --branch
```

`verify:protected-terms` completed with warning-only discovery output and exit code 0.

`git diff --check` passed with line-ending warnings only.

`Test-Path config\storage-authority.json` returned `False`.

I initially ran some verifier batches in parallel and hit temporary-fixture cleanup races involving `.tmp` roots. The affected verifiers passed when rerun individually. Treat this as verifier scheduling noise, not HS158 behavior failure.

## Recommended Next State

Rest at an Overseer/Human selection point.

Likely next seams:

1. Snapshot/trace-pack creation policy, now that path authority and storage authority posture are stronger.
2. First runtime enforcement design, only if Human/Overseer wants command blocking to become real.
3. Real Hydration writer design or provider-backed Hydration gate, only after explicit selection.
4. Storage setup UI/renderer posture later, not now, because the current heading remains system hardening.
