# AURA Atlas Current Work

Status: Active Dev runway for HS144 Hydration backlog preview
Last updated: 2026-05-31

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove a read-only Hydration backlog preview from local records without provider calls, hydration writes, queues, or schema changes.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS144-hydration-backlog-preview.md
```

## Current State

HS142 is accepted. HS144 is open.

Accepted Human decisions:

- Atlas is file-portable.
- Atlas should avoid hidden/user-device-invasive storage authority.
- Config home pattern:

```text
<Atlas app/root>/config/storage-authority.json
```

- Acknowledged app-local/current-file fallback counts as accepted storage for action posture, but remains visibly distinct as fallback mode.
- Budget is mandatory before real provider-backed acquisition or EVEidence writes.
- HS137 was an enforcement dry-run map, not runtime enforcement.

Atlas has accepted storage/runtime hardening proofs:

- `storage.authority_preflight`
- `support.gate_stack_readout`
- `verify:cadence-simulation`
- `storage.setup_gate_readout`
- `storage.setup_gate_readout.action_class_matrix`
- `storage.setup_gate_readout.storage_authority`
- `storage.setup_gate_readout.storage_config_dry_run`
- `storage.authority_config.write_proof`
- `storage.authority_config.acknowledgement_persistence_proof`
- `storage.enforcement_dry_run.command_effect_map`
- complete enforcement classification coverage for all current service commands
- read-only External I/O held-state proof through `support.gate_stack_readout`

Recent accepted state:

- `workspace/OverseerHS121-local-first-api-lane-model-adoption.md`
- `workspace/OverseerHS122-storage-gate-action-matrix.md`
- `workspace/OverseerHS124-hs123-storage-gate-action-matrix-review.md`
- `workspace/OverseerHS126-hs125-storage-hardening-orientation-review.md`
- `workspace/OverseerHS127-storage-config-acknowledgement-proof-scope.md`
- `workspace/OverseerHS129-hs128-storage-config-acknowledgement-review.md`
- `workspace/OverseerHS130-storage-config-decision-brief.md`
- `workspace/OverseerHS131-storage-config-dry-run-scope.md`
- `workspace/OverseerHS132-hs131-storage-config-dry-run-review.md`
- `workspace/OverseerHS133-storage-config-write-proof-scope.md`
- `workspace/OverseerHS134-hs133-storage-config-write-proof-review.md`
- `workspace/OverseerHS135-acknowledgement-persistence-proof-scope.md`
- `workspace/OverseerHS136-hs135-acknowledgement-persistence-review.md`
- `workspace/OverseerHS137-enforcement-dry-run-command-effect-scope.md`
- `workspace/OverseerHS138-hs137-enforcement-dry-run-review.md`
- `workspace/EngineeringSafetyAuditHS138-enforcement-dry-run-coverage-review.md`
- `workspace/OverseerHS140-hs139-enforcement-classification-coverage-review.md`
- `workspace/SecuritySafetyAuditHS140-enforcement-classification-posture.md`
- `workspace/OverseerHS141-security-audit-hs140-review.md`
- `workspace/SystemsAuditHS109-external-io-policy-fit.md`
- `workspace/OverseerHS142-external-io-held-state-runway.md`
- `workspace/OverseerHS143-hs142-external-io-held-state-review.md`
- `workspace/OverseerHS144-hydration-backlog-preview-runway.md`

## Accepted Boundaries

- Discovery refs are possible leads / provenance, not Evidence.
- ESI-expanded killmail records are Evidence/EVEidence.
- Hydration repairs readability and labels; it does not create Evidence.
- Observation/reporting derives from local records and should disclose basis.
- Assessment Memory is human-authored judgment, not Evidence.
- Storage setup and disk-budget posture are trust boundaries.
- External I/O should hold provider-backed movement when off and must not cause catch-up flooding when re-enabled.
- Waiting is not failure.
- Atlas should remain local-first: inspect local records before provider movement.

## Active Runway

Dev should implement a bounded read-only Hydration backlog preview.

Source of intent:

- Human direction: better understanding our data.
- `docs/contracts/metadata-hydration-contract.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `workspace/SystemsAuditHS101-local-lookup-vs-esi-enrichment.md`
- accepted HS142 External I/O held-state proof
- `workspace/OverseerHS144-hydration-backlog-preview-runway.md`

Ordered steps:

1. Inspect existing metadata hydration, metadata status/readiness, report candidate collection, local SDE lookup, service registry, and HS142 External I/O held-state readout.
2. Add a read-only hydration backlog preview command/readout.
3. Report missing label candidates from local records without calling ESI.
4. Distinguish locally known labels from provider-needed labels.
5. Distinguish Evidence/EVEidence facts from readability metadata.
6. Group candidates into view/local-record, Watch/background, target/report-scoped if computable, and corpus hygiene/low-priority lanes.
7. Include capped representative IDs and basis/freshness where possible.
8. Show that provider-backed hydration would be held when External I/O is off.
9. Add focused offline verification.
10. Update Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails

- No broad enforcement without a dedicated runway.
- No runtime command interception.
- No actual command blocking.
- No provider-backed movement.
- No zKill calls.
- No ESI calls.
- No Evidence/EVEidence writes.
- No hydration writes.
- No hydration queue or persisted backlog.
- No DB movement, copy, migration, relocation, restore, or deletion.
- No real pruning/deletion execution.
- No snapshot creation against real operator paths.
- No schema migration unless Dev can prove it is purely fixture/test support and stops for Overseer if runtime schema is needed.
- No renderer redesign.
- No UI presentation/copy finalization.
- No persisted External I/O setting in this packet.
- Do not collapse Watch arming into External I/O.
- Do not treat External I/O off as failure.
- Do not treat app-local/current-file fallback as selected storage.
- Do not treat app-local/current-file fallback as accepted storage without explicit acknowledgement state.
- Do not allow renderer payloads to choose arbitrary paths, forge acknowledgement, forge budget, or probe the filesystem.
- Do not treat `workspace/to-be-sorted/` as active work.
- Do not broaden into UI work while the current heading is system hardening.

## Stop Conditions

Before opening the next runway, stop and return to Overseer/Human if:

- the proof requires runtime interception or actual command blocking without explicit Human/Overseer decision
- the proof requires persisted External I/O state
- the proof requires moving, copying, migrating, relocating, restoring, or deleting DB/storage
- the proof requires live/provider/API calls
- the proof requires writing entities, metadata runs, activity event labels, or hydration output
- the proof requires schema changes or persisted backlog state
- the proof requires changing Discovery/Evidence/Hydration semantics
- the proof requires renderer path selection or filesystem probing
- the proof requires treating fallback acknowledgement as selected storage
- the proof requires treating `workspace/to-be-sorted/` as current task input
- the proof requires UI wording or renderer design
- local-only work becomes unavailable solely because External I/O is off
- re-enable behavior implies catch-up flooding
- missing labels are treated as report failure

## Required Verification

Run:

```powershell
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
npm.cmd run verify:actor-metadata
npm.cmd run verify:corporation-metadata
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Run `node --check` on any new or changed JavaScript files.

## Evidence

HS144 opens from the accepted hydration contract, acquisition/hydration clock model, and HS101 local lookup audit.

Dev should replace this section with concise proof evidence after implementation.

## Dev Handoff

Pending Dev handoff.

Expected:

- `workspace/DevHS144-hydration-backlog-preview.md`

Prior evidence:

HS142 Dev implementation accepted.

- Refined read-only `support.gate_stack_readout` rather than adding a new runtime command.
- Added per-command External I/O posture from HS139 command coverage plus service command effects.
- Provider-capable commands report `held_by_external_io` when External I/O readout state is off.
- Local-only read/report/preflight commands report `local_only_available` when External I/O is off.
- Watch arming/session state remains separate from provider movement permission.
- External I/O re-enable reports `released_to_normal_gates`, with no catch-up flood, no request debt from missed slots, and normal cadence/provider/storage/confirmation rules preserved.
- Storage dry-run/`would_allow` remains separate from full runtime authorization; the gate-stack readout exposes separate External I/O, External API/live.gate, Watch arming, storage safety, active task, and confirmation posture.
- Boundary preserved: no runtime interception, command blocking, provider calls, Evidence/EVEidence writes, hydration writes, storage movement, pruning/deletion execution, schema change, persisted External I/O setting, or renderer/UI work.

HS142 verification:

```powershell
node --check src\main\services\gateStackReadoutService.js
node --check scripts\verify-gate-stack-readout.js
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:cadence-simulation
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:app-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:watch-executor
npm.cmd run verify:watch-scheduler
npm.cmd run verify:protected-terms
```

All listed commands passed. `verify:protected-terms` completed with warning-only discovery output and exit code 0.

Overseer review:

- `workspace/OverseerHS143-hs142-external-io-held-state-review.md`

Completed handoff:

- `workspace/DevHS142-external-io-held-state-proof.md`

Prior evidence:

HS140 Security audit accepted as advisory input.

- Accepted as breadcrumb, not runtime enforcement authority.
- Atlas is in a healthy pre-enforcement posture.
- `would_allow` must not become a runtime allow decision; future runtime policy needs composed gate state.
- Confirmation tokens remain UX/operator-friction metadata, not security secrets or authorization authority.
- Fixture/proof commands must remain non-renderer, trusted-context only, and excluded from production enforcement surfaces.
- Future runtime enforcement should fail closed for unknown/unclassified commands unless deliberately exempted.
- `setup_config_changes` is broad and should split before enforcement.
- Support artifacts, snapshots, trace packs, retention previews, provider calls, Evidence writes, and hydration writes are separate risk classes.
- Security recommends External I/O held-state follow-up as the next safe seam.

Overseer review:

- `workspace/OverseerHS141-security-audit-hs140-review.md`

HS139 Dev implementation accepted.

- Added complete read-only classification coverage metadata for all 51 current `serviceRegistry` commands.
- Coverage metadata includes `storage_action_class`, `external_io_dependency`, `runtime_context`, `enforcement_status`, and notes.
- Scheduled/background Watch paths are classified, including `actor.watch`, `system.radius.watch`, `watch.executor.arm`, and `watch.executor.tick`.
- Provider/Evidence-capable commands declare External I/O separately from storage/action posture.
- Fixture/proof commands are marked `fixture_only_non_production`.
- `storage.enforcement_dry_run.command_effect_map` now reports `coverage.status`, command counts, gap commands, provider/external-I/O commands, fixture-only commands, and scheduled/background Watch commands.
- `verify:enforcement-dry-run` now fails if a service command appears without classification and demonstrates the missing-classification signal with a fixture command.
- Boundary preserved: enforcement remains inactive; no runtime interception, command blocking, provider calls, Evidence/EVEidence writes, hydration writes, storage movement, pruning/deletion execution, schema change, or renderer/UI work was added.

HS139 verification:

```powershell
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:command-authority
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

All listed HS139 commands passed. `verify:protected-terms` completed with warning-only discovery output and exit code 0.

Overseer review:

- `workspace/OverseerHS140-hs139-enforcement-classification-coverage-review.md`

HS137 Dev implementation accepted.

- Added read-only `storage.enforcement_dry_run.command_effect_map`.
- Added focused verifier `verify:enforcement-dry-run`.
- Dry-run map uses service command metadata and `storage.setup_gate_readout.action_class_matrix`.
- Readout reports representative command/effect, storage state, budget state, external I/O assumption, `would_allow` / `would_block` / `conditional`, reason codes, and inactive enforcement state.
- Verified local status/read/report posture remains allowed or safe conditional where accepted.
- Verified provider-backed acquisition, ESI expansion, hydration writes, snapshots/support artifacts, and destructive pruning/deletion execution are blocked or conditional according to accepted storage/budget state.
- Verified acknowledged fallback behaves as accepted storage while remaining `selected: false` and distinct from selected storage.
- Verified invalidated acknowledgement and missing/unavailable storage block provider-backed movement/write classes.
- Verified budget hard-lock blocks writes/provider movement while preserving safe local read/status paths.
- Added the dry-run command to passive side-effect sweep; it does not mutate DB tables.
- Boundary preserved: no runtime interception, no actual command blocking, no enforcement/lockout, no provider calls, no storage movement, no Evidence/EVEidence writes, no hydration writes, no schema migration, no renderer redesign.
- Interpretation preserved: `provider_gated` maps to `would_allow` only in the storage-enforcement sense; External I/O/API gates remain separate.

Verification:

```powershell
node --check src\main\services\enforcementDryRunService.js
node --check src\main\services\serviceRegistry.js
node --check scripts\verify-enforcement-dry-run.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:enforcement-dry-run
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

All listed commands passed. `verify:protected-terms` completed with warning-only discovery output and exit code 0. `git diff --check` passed with line-ending warnings only. `Test-Path config\storage-authority.json` returned `False`.

Completed prior handoffs:

- `workspace/DevHS139-enforcement-classification-coverage.md`
- `workspace/DevHS137-enforcement-dry-run-command-effect.md`
