# OverseerHS135 - Acknowledgement Persistence Proof Scope

Status: active runway scope
Date: 2026-05-31
Role: Overseer

## Source Of Intent

- Human direction: get the mechanical memory bits in before enforcement.
- Human decision: Atlas is file-portable and should avoid hidden/user-device-invasive storage authority.
- Human decision: acknowledged app-local/current-file fallback counts as accepted storage for action posture, but remains visibly distinct.
- Human decision: budget is mandatory before real provider-backed acquisition or EVEidence writes.
- `workspace/OverseerHS130-storage-config-decision-brief.md`
- `workspace/OverseerHS132-hs131-storage-config-dry-run-review.md`
- `workspace/OverseerHS134-hs133-storage-config-write-proof-review.md`
- Existing `storage.authority_config.write_proof`

## Decision

Open one bounded Dev packet for acknowledgement persistence proof.

This packet should prove Atlas can persist and read back the operator acknowledgement for app-local/current-file fallback as storage-authority memory. It should not implement broad storage enforcement.

## Packet Shape

Dev should implement fixture/offline acknowledgement persistence proof.

The proof should:

1. Reuse the accepted storage authority config shape where practical.
2. Persist an acknowledged app-local/current-file fallback state into an allowed fixture config.
3. Read it back and show the storage setup/readout posture treats it as acknowledged fallback, not selected storage.
4. Persist or derive enough provenance to know what was acknowledged:
   - acknowledgement status
   - acknowledgement basis/provenance
   - storage root or DB path basis
   - app/root or fallback path basis used for invalidation comparison
   - budget bytes/source when accepted
5. Prove invalidation when the fallback/app path basis changes.
6. Prove missing budget prevents provider-backed write posture even if fallback acknowledgement exists.
7. Prove renderer-origin payloads cannot forge acknowledgement, storage root/path, or budget.
8. Keep the command/service non-renderer or otherwise main-process gated.
9. Keep verification fixture/offline.

## Non-Goals

- No runtime storage lockout enforcement.
- No provider-backed movement.
- No zKill or ESI calls.
- No Evidence/EVEidence writes.
- No hydration writes.
- No DB movement, copy, migration, restore, relocation, or deletion.
- No pruning/deletion execution.
- No snapshot creation against real operator paths.
- No schema migration.
- No renderer wording, settings UI, or design work.
- No broad settings framework.

## Verification Expectations

Expected baseline:

```powershell
node --check src\main\services\storageAuthorityConfigWriteService.js
node --check src\main\services\serviceRegistry.js
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
workspace/DevHS135-acknowledgement-persistence-proof.md
```

The handoff should include:

- files changed
- command/helper added, if any
- sample persisted acknowledgement payload
- readback posture evidence
- invalidation evidence
- missing-budget evidence
- renderer safety evidence
- confirmation that no real project-root config was written unless explicitly fixture-controlled
- verification commands and results
