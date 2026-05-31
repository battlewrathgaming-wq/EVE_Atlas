# DevHS125 - Storage Hardening Orientation

Date: 2026-05-31
Role: Atlas Dev
Status: Orientation complete

## Scope

This was a read-only orientation pass before any further storage/runtime implementation.

No code, runtime behavior, source behavior, storage config, DB/storage files, provider/API paths, Discovery/Evidence/Hydration semantics, or `workspace/current.md` were changed.

## Files Read

- `AGENTS.md`
- `HUMAN.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/OverseerHS121-local-first-api-lane-model-adoption.md`
- `workspace/OverseerHS122-storage-gate-action-matrix.md`
- `workspace/OverseerHS124-hs123-storage-gate-action-matrix-review.md`
- `workspace/DevHS123-storage-gate-action-matrix-proof.md`
- `src/main/services/storageSetupGateReadoutService.js`
- `scripts/verify-storage-setup-gate.js`
- `src/main/services/storageAuthorityPreflightService.js`
- `src/main/services/gateStackReadoutService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/runtimeSnapshotSettingsService.js`

## Current Implementation Map

- `storage.authority_preflight` inventories the current DB path, mode, parent, WAL/SHM, snapshot settings/destination, trace-pack path, temp/cache/SDE paths, window/settings path, and byte usage. It is read-only and ignores renderer payload path overrides unless trusted context explicitly allows them.
- `storage.setup_gate_readout` interprets preflight-style facts into storage setup posture, budget posture, `work_classes`, and the accepted `action_class_matrix`. It remains read-only and non-enforcing.
- `action_class_matrix` classifies action classes across storage states and includes basis fields: storage state, local inspection availability, provider movement requirement, write posture, block/hold reason, and result basis.
- `support.gate_stack_readout` separately reports provider-backed work posture, current `External API`/`live.gate`, future `external_io` readout posture, Watch arming/schedule, storage safety summary, active task state, and confirmation requirement.
- `serviceRegistry` exposes `storage.setup_gate_readout` and related readouts as renderer-eligible read-only commands, while mutating/provider-backed commands still declare their effects and confirmation requirements.
- `runtimeSnapshotSettingsService` has a concrete settings read/write path for runtime snapshot settings, but this is snapshot/support-artifact specific and is not the final main Atlas storage config authority.

## Coherence Assessment

HS121, HS122, and HS124 are coherent from an implementation perspective.

HS121 supplies the execution model: local inspection first, then one lane only, with lane-owned writes and visible basis. HS122 turns storage posture into action-class decisions without treating storage as a blunt global switch. HS124 correctly tightened HS123 by making storage validity take precedence over budget hard-lock, so missing or unselected storage cannot be hidden behind budget posture.

The implementation now matches that spine as a read-only proof. It can explain what would be allowed, blocked, conditional, fixture-only, provider-gated, or future-runway-only, but it deliberately does not enforce those decisions.

## Matrix Sufficiency

`storage.setup_gate_readout.action_class_matrix` is sufficient input for:

- read-only operator/support explanations
- fixture/offline proof of storage posture and action-class classification
- an enforcement dry-run that reports what would be blocked without blocking it
- service-level tests that compare current commands/effects against matrix posture

It is not yet sufficient input for real enforcement because these facts are still missing or not accepted:

- final portable storage config filename and location
- explicit operator acknowledgement state for app-local/current-file fallback
- confirmed writeability checks for selected storage and support destinations
- main Atlas storage budget persistence and projected-write accounting
- exact byte scope for main storage budget versus snapshot/support-artifact budget
- behavior when configured storage disappears after startup while a DB handle is already open
- whether local read/report surfaces can proceed from an already-open safe handle under missing/degraded storage
- emergency/export destination rules for support artifacts during missing/degraded/hard-lock states
- exact enforcement insertion points in service invocation, mutating services, task runner, or lower write repositories

## Storage Config And Acknowledgement Decisions Needed

Before enforcement, Atlas needs an accepted storage setup/config model:

- portable config file path and name
- config schema for selected storage root, DB path or DB naming convention, budget bytes, acknowledgement state, and version
- whether app-local/current-file fallback is represented as a selected storage mode or as an unacknowledged fallback posture
- how acknowledgement is recorded, cleared, and invalidated
- whether missing storage locks the whole app, provider-backed writes only, or specific action classes
- whether existing safe local reads are allowed when configured storage is missing/unavailable
- how budget warnings and hard-lock compare projected writes against current usage
- whether snapshot/support-artifact settings remain separate or become referenced by broader storage authority
- renderer payload rules for setup/config commands so arbitrary filesystem probing is not introduced

## Runtime Seams

Technically ready:

- read-only posture surfaces: `storage.authority_preflight`, `storage.setup_gate_readout`, `support.gate_stack_readout`
- offline fixture verification of storage states, action classes, and basis fields
- service registry effect metadata for identifying read-only, local-data-mutation, provider-backed, evidence-creating, metadata-readability, support-artifact, and destructive-preview commands
- command-authority verification for renderer eligibility and confirmation-gated commands
- passive-side-effect verification for read-only surfaces

Technically plausible but risky without one more proof:

- enforcement dry-run at the service command boundary
- comparing command `effects` to `action_class_matrix` classes
- reporting would-block posture for provider-backed acquisition/write commands without changing behavior

Risky now:

- real lockout enforcement
- storage config writes or migration/setup flows
- blocking repository writes beneath service commands without first mapping all write paths
- hard-locking snapshot/support artifacts without clearer emergency/export rules
- provider-backed catch-up or release behavior under future `external_io`
- hydration backlog persistence or broad queue/sequencer machinery

## Recommended Next Dev Packet

Recommended next packet: **storage config / acknowledgement proof**.

Reasoning:

The matrix is now a good classifier, but enforcement needs accepted facts about what storage authority actually means. In particular, fallback acknowledgement is central: HS122 says current/app-local fallback is usable only after explicit acknowledgement, but no persisted or read-only acknowledgement model exists yet for main Atlas storage. Implementing enforcement before that would force Dev to invent policy.

Suggested next scope:

- read-only or fixture-only proof of a portable storage config shape and acknowledgement states
- no real storage config write yet unless Overseer explicitly opens a write packet
- show how configured storage, no selection, app-local fallback acknowledged/unacknowledged, missing storage, and budget config would read
- prove renderer payloads cannot select/probe arbitrary paths through readout payloads
- decide whether this proof becomes a future write-capable config service later

Second-best next packet: **enforcement dry-run / lockout boundary**.

This is viable if Overseer wants to avoid config design first, but it should remain read-only and should report would-block decisions by command/effect class without actually blocking. It should not be the first real enforcement packet.

External I/O held-state follow-up and Hydration backlog preview are both useful, but they are less directly blocking the storage enforcement seam. Hydration backlog preview may become more valuable after storage setup/config facts exist, because backlog writes and provider movement need the same storage authority.

## Verification Expectations For Next Packet

For storage config / acknowledgement proof:

- `npm.cmd run verify:storage-setup-gate`
- `npm.cmd run verify:storage-authority-preflight`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:protected-terms`
- `node --check` on any new/changed JS files
- `git diff --check`
- `git status --short --branch`

If snapshot/support-artifact settings are touched:

- `npm.cmd run verify:runtime-snapshot`

If service invocation or command gating is touched:

- `npm.cmd run verify:gate-stack-readout`
- `npm.cmd run verify:task-concurrency`

If enforcement dry-run is selected:

- focused new verifier for command/effect-class-to-matrix mapping
- `npm.cmd run verify:storage-setup-gate`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:gate-stack-readout`
- `git diff --check`
- `git status --short --branch`

No live/provider/API verification should be part of the next storage-runtime packet unless Human/Overseer explicitly opens it.

## Confirmation

This pass created only this orientation artifact:

- `workspace/DevHS125-storage-hardening-orientation.md`

No code/runtime/source behavior was changed.
