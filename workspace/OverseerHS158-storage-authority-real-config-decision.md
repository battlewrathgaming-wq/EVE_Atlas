# OverseerHS158 - Storage Authority Real Config Decision

Status: accepted for next Dev runway
Role: Overseer
Date: 2026-06-01

## Source

- Human / Overseer shaping discussion.
- Human shaping note: `F:\Obsidian\Projects_Aura\Atlas Ovy\Real operator storage authority config.md`
- `workspace/OverseerHS130-storage-config-decision-brief.md`
- `workspace/OverseerHS131-storage-config-dry-run-scope.md`
- `workspace/OverseerHS132-hs131-storage-config-dry-run-review.md`
- `workspace/OverseerHS133-storage-config-write-proof-scope.md`
- `workspace/OverseerHS134-hs133-storage-config-write-proof-review.md`
- `workspace/OverseerHS135-acknowledgement-persistence-proof-scope.md`
- `workspace/OverseerHS136-hs135-acknowledgement-persistence-review.md`
- `workspace/OverseerHS157-hs156-external-io-real-config-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`

## Decision

Open a bounded Dev packet for real operator storage authority config.

Canonical storage authority config target:

```text
<Atlas app/root>/config/storage-authority.json
```

In this repo, the canonical target resolves to:

```text
F:\Projects\AURA-Atlas\config\storage-authority.json
```

The packet should make storage authority config real as app-local operator posture, following the same trust shape as HS156 External I/O real config.

## Accepted Meaning

`app-local fallback storage` means Atlas-controlled user activity storage under the Atlas app/root, used only when no selected storage path is configured and the operator has explicitly acknowledged that posture.

Do not use `Corpus_fallback` in Dev wording. It is too ambiguous for implementation.

`fallback_acknowledgement_needs_reconfirm` means app-local fallback storage is still discoverable, but the prior acknowledgement basis is stale and should be reconfirmed before meaningful collection or writes are treated as accepted.

Storage budget is disk-space authority for Atlas-controlled data under the accepted storage posture. It is not API/request pacing.

Default budget posture:

- 5GB may be used as a suggested/default operator posture.
- The operator must be able to set another budget such as 10GB, 50GB, or another explicit amount.
- The default must not become hidden authority or silent acceptance.

## Required Distinctions

The real config and readout must preserve these states as distinct:

- no storage selected
- selected storage configured and valid
- selected storage missing or unavailable
- selected storage invalid or degraded
- app-local fallback available but unacknowledged
- app-local fallback acknowledged
- `fallback_acknowledgement_needs_reconfirm`
- budget unconfigured
- budget within budget
- budget warning
- budget strong warning
- budget hard lock

Selected storage and app-local fallback storage must remain visibly distinct. App-local fallback storage is not selected storage.

## Allowed

- Add trusted-context-only real operator storage authority config write/readback behavior.
- Add renderer-safe read posture for storage authority config.
- Create the canonical `config/` folder and `storage-authority.json` when the trusted write command is intentionally invoked.
- Include a config version.
- Include a human-readable operator label as non-authority metadata if cheap.
- Include app/build/version identity only if already cheap and low-risk.

## Not Allowed

- No DB creation.
- No storage directory creation beyond the canonical `config/` folder and config file.
- No storage copy, move, migration, relocation, restore, deletion, cleanup, or pruning.
- No runtime enforcement.
- No command interception or blocking.
- No provider calls.
- No zKill, ESI, or SDE calls.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No Hydration writes.
- No snapshot, trace-pack, or support artifact creation.
- No renderer UI work.
- No renderer-provided arbitrary path selection, filesystem probing, budget forging, acknowledgement forging, or app-root identity forging.

## Recommended First Dev Shape

Implement the real storage authority config as a narrow storage posture seam:

1. Reuse existing fixture write/readback and acknowledgement persistence proof logic where appropriate.
2. Add real operator readback/write commands or extend existing services with explicit real-config posture.
3. Keep write commands trusted-context only and non-renderer eligible.
4. Keep renderer-facing behavior read-only and safe.
5. Integrate real config posture into `storage.setup_gate_readout` without activating enforcement.
6. Extend service registry, command authority, passive side-effect, enforcement dry-run, and composed/gate readout coverage.
7. Verify the real config file is not created by read-only commands.

## Stop Conditions

Stop for Overseer/Human if implementation requires:

- storage migration
- DB movement or creation
- runtime command blocking
- provider movement
- UI setup flow
- schema change
- support artifact creation
- treating fallback as selected storage
- treating budget suggestion as hidden operator acceptance
- renderer path probing or renderer path authority

## Notes

This decision makes the next seam explicit. It does not accept runtime enforcement, provider-backed movement, storage migration, or UI setup work.
