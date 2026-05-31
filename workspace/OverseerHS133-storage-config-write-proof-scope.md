# OverseerHS133 - Storage Config Write Proof Scope

Status: active runway scope
Date: 2026-05-31
Role: Overseer

## Source Of Intent

- Human decision: Atlas is file-portable and should avoid hidden/user-device-invasive storage authority.
- Human decision: storage config home pattern is `<Atlas app/root>/config/storage-authority.json`.
- Human decision: acknowledged app-local/current-file fallback can count as accepted storage, but must remain visibly distinct.
- Human decision: budget is mandatory before real provider-backed acquisition or EVEidence writes.
- `workspace/OverseerHS130-storage-config-decision-brief.md`
- `workspace/OverseerHS131-storage-config-dry-run-scope.md`
- `workspace/OverseerHS132-hs131-storage-config-dry-run-review.md`
- Existing `storage.setup_gate_readout.storage_config_dry_run`

## Decision

Open one bounded Dev packet for a storage config write proof.

This is the next smallest useful hardening seam after HS131. It should prove that Atlas can write and read back the accepted storage authority config shape safely, without implementing storage enforcement or turning the UI into a configuration flow.

## Packet Shape

Dev should implement a write-capable storage authority config helper with fixture/offline verification.

The proof should:

1. Reuse the HS131 dry-run payload shape where possible.
2. Derive the default production target as:

```text
<Atlas app/root>/config/storage-authority.json
```

3. Support test/fixture target injection only through trusted main-process/test context, not renderer payload.
4. Write atomically or in a clearly safe staged-write pattern.
5. Read back the written file and verify it matches the normalized payload.
6. Reject unsafe target paths outside the allowed config root.
7. Preserve fallback acknowledgement and invalidation semantics.
8. Preserve budget requirement before provider-backed acquisition/EVEidence writes.
9. Prove no renderer-origin payload can choose path, storage root, acknowledgement, or budget.
10. Leave enforcement state disabled/readout-only unless a separate future packet opens enforcement.

## Non-Goals

- No storage setup UI.
- No runtime lockout enforcement.
- No provider calls.
- No zKill or ESI calls.
- No Evidence/EVEidence writes.
- No hydration writes.
- No DB movement, copy, migration, restore, relocation, or deletion.
- No pruning/deletion execution.
- No snapshot creation against real operator paths.
- No schema migration.
- No renderer wording or design work.
- No broad settings framework.

## Verification Expectations

Expected baseline:

```powershell
node --check src\main\services\storageSetupGateReadoutService.js
node --check scripts\verify-storage-setup-gate.js
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If Dev adds a new writer module or verifier, run `node --check` on the new JavaScript file and include the new verifier command in the handoff.

The handoff must state whether the real project-root `config/storage-authority.json` exists after verification.

## Expected Handoff

```text
workspace/DevHS133-storage-config-write-proof.md
```

The handoff should include:

- files changed
- command or helper added, if any
- target path behavior
- atomic/staged write behavior
- sample write/readback output
- unsafe path rejection evidence
- renderer safety evidence
- boundary confirmation
- verification commands and results
