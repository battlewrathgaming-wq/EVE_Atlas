# AURA Atlas Current Work

Status: Resting after HS160 Support artifact creation policy preview accepted
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: hold at an Overseer/Human selection point after accepting support artifact creation policy preview.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Human / Overseer shaping

Expected handoff filename:

```txt
None. No active Dev runway is open.
```

## Source Of Intent

Human selected the next seam:

- Snapshot/trace-pack creation policy.
- "Laying down all the heavy equipment."

Accepted context:

- `workspace/OverseerHS147-hs146-support-artifact-path-authority-review.md`
- `workspace/OverseerHS159-hs158-storage-authority-real-config-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- existing read-only support path posture: `support.artifact_path_authority.preview`
- existing storage authority config posture: `storage.authority_config.readback` and `storage.authority_config.write`
- existing storage setup posture: `storage.setup_gate_readout`
- existing composed gate posture: `storage.composed_gate_policy.preview`
- existing enforcement inventory posture: `storage.enforcement_dry_run.command_effect_map`

Accepted interpretation:

- Support artifacts are support/readout material, not Evidence/EVEidence, Discovery refs, Observation, or Assessment Memory.
- Runtime snapshots and trace packs can be sensitive recovery/support artifacts.
- Renderer payloads cannot provide filesystem path authority.
- External I/O is not required for local support-artifact readout or local support-artifact policy.
- Support artifact creation must not become a provider-call back door.
- This packet previews creation policy only. It does not create snapshots, trace packs, or files.

## Current State

HS142, HS144, HS146, HS148, HS150, HS152, HS154, HS156, HS158, and HS160 are accepted. No active Dev runway is open.

Accepted proof surfaces include:

- `storage.authority_preflight`
- `storage.setup_gate_readout`
- `storage.setup_gate_readout.action_class_matrix`
- `storage.setup_gate_readout.storage_authority`
- `storage.setup_gate_readout.storage_config_dry_run`
- `storage.authority_config.write_proof`
- `storage.authority_config.acknowledgement_persistence_proof`
- `storage.enforcement_dry_run.command_effect_map`
- `support.gate_stack_readout`
- `support.artifact_path_authority.preview`
- `storage.composed_gate_policy.preview`
- `metadata.hydration_execution_policy.preview`
- `external_io.state_readout`
- `external_io.state_persistence_proof`
- `external_io.state_config_readback`
- `external_io.state_config_write`
- `storage.authority_config.readback`
- `storage.authority_config.write`
- `metadata.hydration_write_fixture_proof`
- `support.artifact_creation_policy.preview`

## Active Runway

No active Dev runway is open.

Likely next selectable seams:

1. First runtime enforcement design/implementation packet, now that storage, External I/O, support artifact path authority, composed policy, and support artifact creation policy have read-only proof.
2. Actual support artifact creation hardening, if Human wants to continue the snapshot/trace-pack lane.
3. Provider-backed Hydration gate or real Hydration writer design, if Human wants to return to data/readability movement.
4. Storage setup UI/renderer posture later, not now, because the current heading remains system hardening.

Do not open the next packet until the Human selects the next seam or explicitly asks Overseer to choose.

## Guardrails

- No actual support artifact creation.
- No runtime snapshot creation.
- No trace-pack creation.
- No file creation.
- No directory creation.
- No cleanup, delete, prune, restore, move, copy, migration, upload, or packaging.
- No runtime command interception.
- No actual command blocking.
- No runtime authorization activation.
- No provider-backed movement.
- No zKill calls.
- No ESI calls.
- No SDE download calls.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No Hydration writes.
- No metadata label writes.
- No storage config writes.
- No DB/storage movement.
- No schema migration unless Dev can prove it is purely fixture/test support and stops for Overseer if runtime schema is needed.
- No renderer redesign or UI wording work.
- No renderer-origin filesystem path authority.
- Do not treat support artifacts as Evidence/EVEidence, Discovery, Observation, or Assessment Memory.
- Do not treat trace packs as evidence exports.
- Do not treat app-local/current-file fallback as selected storage.
- Do not treat the 5GB suggested/default budget as hidden acceptance.
- Do not treat `would_allow` as runtime authorization.

## Stop Conditions

For the next runway, stop and return to Overseer/Human if:

- the proof requires actual snapshot, trace-pack, log, export, cache, or support artifact creation
- the proof requires writing files or directories
- the proof requires runtime interception or actual command blocking
- the proof requires live/provider/API calls
- the proof requires moving, copying, migrating, relocating, restoring, pruning, deleting, or uploading DB/storage/support artifacts
- renderer path selection or renderer filesystem probing is required
- budget/path policy cannot be derived without inventing a new storage authority model
- support artifacts blur into Evidence/EVEidence, Discovery, Observation, or Assessment Memory
- trace packs become evidence exports or raw payload exports
- External I/O off would make local-only support readout unavailable
- External I/O on would become authorization for creation
- implementation requires broad UI work

## Required Verification

No active Dev verification is required while resting.

HS160 review verification was completed by Overseer and recorded in `workspace/OverseerHS161-hs160-support-artifact-creation-policy-review.md`.

Prior HS160 verification:

Run syntax checks on every new or changed JavaScript file.

Run:

```powershell
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-config-write
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If Dev adds a focused verifier such as `verify:support-artifact-creation-policy`, run it and list it in the handoff.

Only run `npm.cmd run verify:runtime-snapshot` or `npm.cmd run verify:operator-debug-trace` if implementation touches existing snapshot/trace-pack creation code or verifier expectations. If run, clearly state these are existing fixture/verifier writes, not the new policy preview creating real operator artifacts.

## Evidence

HS160 Dev implementation complete.

Evidence:

- Added `support.artifact_creation_policy.preview` as a renderer-eligible read-only service command.
- Added `src/main/services/supportArtifactCreationPolicyService.js`.
- Added focused verifier `scripts/verify-support-artifact-creation-policy.js` and npm script `verify:support-artifact-creation-policy`.
- Updated service registry, command authority, passive side-effect, enforcement dry-run, and composed gate policy coverage for the new command.
- Representative creation classes covered:
  - `runtime_snapshot_rolling`
  - `runtime_snapshot_retained`
  - `operator_debug_trace_pack`
  - `readiness_preflight_export`
- Sample focused verifier output:
  - renderer-forged payload summary: 4 classes; three snapshot/trace classes reported `path_untrusted` under untrusted renderer/current missing storage posture; readiness/preflight export reported `conditional` because no current write-capable export surface exists.
  - ready fixture: rolling snapshot `would_allow`, retained snapshot `would_allow`, trace pack `would_allow`, readiness export `conditional`.
  - budget hard-lock fixture: rolling snapshot `budget_blocked`, retained snapshot `budget_blocked`, trace pack `budget_blocked`, readiness export `conditional`.
- Renderer anti-forgery proof:
  - renderer payload ignored: true
  - renderer path claims accepted: false
  - renderer storage authority claims accepted: false
  - renderer fallback acknowledgement claims accepted: false
  - renderer budget claims accepted: false
  - renderer trusted context claims accepted: false
  - filesystem probe performed: false
- External I/O local-only proof:
  - External I/O off does not block local support policy/readout.
  - External I/O off does not block support artifact creation policy preview.
  - External I/O on is not authorization for creation.
  - re-enable catch-up flood remains false.
  - policy preview provider calls are 0.
- Confirmation/storage/budget/path posture proof:
  - snapshot and trace-pack classes require confirmation and trusted context before future creation.
  - destination path authority is backend/settings derived and not renderer-authoritative.
  - support artifact classes remain storage-budget scoped.
  - `would_allow` is explicitly not runtime authorization.
- Verification completed:
  - `node --check src\main\services\supportArtifactCreationPolicyService.js`
  - `node --check src\main\services\serviceRegistry.js`
  - `node --check src\main\services\enforcementDryRunService.js`
  - `node --check src\main\services\composedGatePolicyService.js`
  - `node --check scripts\verify-support-artifact-creation-policy.js`
  - `node --check scripts\verify-service-registry.js`
  - `node --check scripts\verify-command-authority.js`
  - `node --check scripts\verify-passive-side-effects.js`
  - `node --check scripts\verify-enforcement-dry-run.js`
  - `node --check scripts\verify-composed-gate-policy.js`
  - `npm.cmd run verify:support-artifact-creation-policy`
  - `npm.cmd run verify:support-artifact-path-authority`
  - `npm.cmd run verify:storage-authority-preflight`
  - `npm.cmd run verify:storage-setup-gate`
  - `npm.cmd run verify:storage-authority-config-write`
  - `npm.cmd run verify:composed-gate-policy`
  - `npm.cmd run verify:enforcement-dry-run`
  - `npm.cmd run verify:gate-stack-readout`
  - `npm.cmd run verify:service-registry`
  - `npm.cmd run verify:command-authority`
  - `npm.cmd run verify:passive-side-effects`
  - `npm.cmd run verify:protected-terms` passed with warning-only protected-term advisory output, exit 0.
- Final checks:
  - `git diff --check` passed with line-ending warnings only.
  - `git status --short --branch` reported `main...origin/main [ahead 37]` with HS160 modified/untracked files.
- Explicit confirmation:
  - no support artifacts, snapshots, trace packs, operator exports, files, directories, provider calls, zKill calls, ESI calls, SDE downloads, Evidence/EVEidence writes, Discovery mutations, Hydration writes, storage config writes, runtime enforcement, command blocking, schema migrations, or UI changes were added by the new preview behavior.

## Dev Handoff

Dev handoff:

- `workspace/DevHS160-support-artifact-creation-policy-preview.md`

Prior completed Dev handoff:

- `workspace/DevHS158-storage-authority-real-config.md`

Latest Overseer review:

- `workspace/OverseerHS161-hs160-support-artifact-creation-policy-review.md`
