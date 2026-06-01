# OverseerHS158 - Real Operator Storage Authority Config Runway

Status: active
Role: Overseer
Date: 2026-06-01
Executor: Dev

Expected Dev handoff:

```text
workspace/DevHS158-storage-authority-real-config.md
```

## Milestone

Atlas Storage And Runtime Hardening.

Current focus: make storage authority config real as app-local operator posture, without activating enforcement, migration, provider movement, or UI setup.

## Source Of Intent

- Human selected the storage-memory lane and accepted a real storage authority config seam.
- Human direction: Atlas is file-portable and must not invade the user's device silently.
- Human direction: app-local fallback storage is acceptable only as explicit operator posture, not hidden authority.
- Human direction: 5GB may be the suggested/default budget, but the operator can choose another amount.
- Human direction: use `fallback_acknowledgement_needs_reconfirm`; do not use `Corpus_fallback` in Dev wording.
- Human shaping note: `F:\Obsidian\Projects_Aura\Atlas Ovy\Real operator storage authority config.md`
- `workspace/OverseerHS158-storage-authority-real-config-decision.md`
- `workspace/OverseerHS130-storage-config-decision-brief.md`
- `workspace/OverseerHS131-storage-config-dry-run-scope.md`
- `workspace/OverseerHS132-hs131-storage-config-dry-run-review.md`
- `workspace/OverseerHS133-storage-config-write-proof-scope.md`
- `workspace/OverseerHS134-hs133-storage-config-write-proof-review.md`
- `workspace/OverseerHS135-acknowledgement-persistence-proof-scope.md`
- `workspace/OverseerHS136-hs135-acknowledgement-persistence-review.md`
- `workspace/OverseerHS157-hs156-external-io-real-config-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`

## Accepted Target

```text
<Atlas app/root>/config/storage-authority.json
```

In this repo:

```text
F:\Projects\AURA-Atlas\config\storage-authority.json
```

## Accepted Wording

`app-local fallback storage` means Atlas-controlled user activity storage under the Atlas app/root, used only when no selected storage path is configured and the operator has explicitly acknowledged that posture.

`fallback_acknowledgement_needs_reconfirm` means app-local fallback storage is still discoverable, but the prior acknowledgement basis is stale and should be reconfirmed before meaningful collection or writes are treated as accepted.

## Ordered Runway

1. Inspect existing storage authority preflight, setup gate readout, storage config dry-run, fixture write proof, acknowledgement persistence proof, service registry metadata, command authority checks, passive side-effect checks, enforcement dry-run, composed gate policy preview, and HS156 External I/O real config patterns.
2. Define the canonical real storage authority config target under the Atlas app/root config folder.
3. Add trusted-context-only operator config write/readback behavior for storage authority.
4. Preserve selected storage, app-local fallback storage, fallback acknowledgement, `fallback_acknowledgement_needs_reconfirm`, missing/unavailable storage, invalid/degraded storage, and budget states as distinct facts.
5. Integrate the real config posture into `storage.setup_gate_readout` or a tightly scoped readback command so canonical config posture can be reported without fixture-only parameters.
6. Treat 5GB as a suggested/default budget posture only; allow explicit operator-selected budgets and do not treat the default as hidden acceptance.
7. Keep renderer-origin payloads from choosing arbitrary paths, forging trusted context, forging acknowledgement, forging budget, forging app-root identity, or probing the filesystem.
8. Allow creation only of the canonical `config/` folder and `storage-authority.json` during the trusted write path.
9. Add focused verification and update service registry, command authority, passive side-effect, enforcement dry-run, and gate/composed-policy coverage as needed.
10. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails

- No broad enforcement.
- No runtime command interception.
- No actual command blocking.
- No provider-backed movement.
- No zKill, ESI, or SDE calls.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No Hydration writes.
- No queue dispatch.
- No Watch execution behavior changes.
- No DB movement, copy, migration, relocation, restore, deletion, or creation.
- No storage directory creation beyond the canonical `config/` folder and `storage-authority.json`.
- No pruning/deletion execution.
- No snapshot, trace-pack, support artifact, cleanup, restore, move, copy, migration, or upload.
- No schema migration unless Dev can prove it is purely fixture/test support and stops for Overseer if runtime schema is needed.
- No renderer redesign or UI setup flow.
- No `Corpus_fallback` term in Dev wording.
- Do not treat app-local fallback storage as selected storage.
- Do not treat app-local fallback storage as accepted storage without explicit acknowledgement state.
- Do not treat the 5GB suggested/default budget as hidden operator acceptance.
- Do not allow renderer payloads to choose arbitrary paths, forge acknowledgement, forge budget, forge app-root identity, or probe the filesystem.

## Stop Conditions

Stop and return to Overseer/Human if the work requires:

- storage migration, copy, move, relocation, restore, or deletion
- DB creation or storage directory creation beyond the canonical config file path
- runtime enforcement or command blocking
- provider movement
- UI setup flow
- schema change
- support artifact creation
- treating fallback as selected storage
- treating the budget suggestion as hidden acceptance
- renderer path probing or renderer path authority

## Required Verification

Run:

```powershell
node --check src\main\services\storageAuthorityConfigWriteService.js
node --check src\main\services\storageSetupGateReadoutService.js
node --check src\main\services\storageAuthorityPreflightService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\gateStackReadoutService.js
node --check src\main\services\composedGatePolicyService.js
node --check scripts\verify-storage-authority-config-write.js
node --check scripts\verify-storage-acknowledgement-persistence.js
node --check scripts\verify-storage-setup-gate.js
node --check scripts\verify-storage-authority-preflight.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:storage-acknowledgement-persistence
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If Dev adds a focused verifier such as `verify:storage-authority-real-config`, run it and list it in the handoff.

Run `node --check` on any additional new or changed JavaScript files.

## Evidence

Dev should record:

- commands/files changed
- real config target and whether the focused verifier leaves a real config behind
- sample readback/write output
- renderer safety proof
- service registry / command authority / enforcement dry-run / passive side-effect coverage
- verification commands and outcomes

## Dev Handoff

Create:

```text
workspace/DevHS158-storage-authority-real-config.md
```
