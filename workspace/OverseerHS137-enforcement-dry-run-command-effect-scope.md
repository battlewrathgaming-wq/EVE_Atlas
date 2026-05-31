# OverseerHS137 - Enforcement Dry-Run Command-Effect Scope

Status: active runway scope
Date: 2026-05-31
Role: Overseer

## Source Of Intent

- Human direction: get the mechanical memory bits in, then make Atlas locally stable.
- Human decision: storage setup and budget are trust boundaries before provider-backed acquisition or EVEidence writes.
- `workspace/OverseerHS122-storage-gate-action-matrix.md`
- `workspace/OverseerHS134-hs133-storage-config-write-proof-review.md`
- `workspace/OverseerHS136-hs135-acknowledgement-persistence-review.md`
- Existing service command authority/effect metadata
- Existing `storage.setup_gate_readout.action_class_matrix`

## Decision

Open one bounded Dev packet for an enforcement dry-run / command-effect map.

This is not runtime enforcement. It is a read-only proof that Atlas can explain which command/effect classes would be allowed or blocked under storage authority states before any lockout is actually applied.

## Packet Shape

Dev should implement a fixture/offline enforcement dry-run readout.

The readout should:

1. Use existing service command metadata/effects where possible.
2. Use existing storage setup/gate state and action class matrix where possible.
3. Report, for representative commands/effect classes:
   - command/effect
   - storage state
   - budget state
   - external I/O assumption if represented
   - would_allow / would_block / conditional
   - reason codes
   - whether real runtime enforcement is active
4. Prove that local read/status/report posture remains allowed where appropriate.
5. Prove provider-backed acquisition, ESI expansion, hydration writes, snapshots/support artifacts, and destructive deletion/pruning execution are blocked or conditional according to accepted storage/budget state.
6. Prove acknowledged fallback behaves as accepted storage while remaining distinct from selected storage.
7. Prove invalidated acknowledgement and missing/unavailable storage block provider-backed movement/write classes.
8. Prove budget hard-lock blocks writes/provider movement while preserving safe local read/status paths.
9. Keep it read-only: no command should actually be blocked by this packet.

## Non-Goals

- No runtime command interception.
- No real storage lockout enforcement.
- No provider calls.
- No zKill or ESI calls.
- No Evidence/EVEidence writes.
- No hydration writes.
- No DB movement, copy, migration, restore, relocation, or deletion.
- No pruning/deletion execution.
- No snapshot creation against real operator paths.
- No schema migration.
- No renderer wording, settings UI, or design work.
- No broad policy engine beyond the dry-run proof.

## Verification Expectations

Expected baseline:

```powershell
node --check src\main\services\serviceRegistry.js
npm.cmd run verify:storage-acknowledgement-persistence
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
Test-Path config\storage-authority.json
```

If Dev adds a new module or verifier, run `node --check` on new/changed JavaScript and include the new verifier command.

## Expected Handoff

```text
workspace/DevHS137-enforcement-dry-run-command-effect.md
```

The handoff should include:

- files changed
- command/helper added, if any
- sample dry-run output
- allowed/blocked/conditional examples
- reason-code list
- proof that enforcement remains inactive
- boundary confirmation
- verification commands and results
