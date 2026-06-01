# AURA Atlas Current Work

Status: Active Dev runway for HS148 Composed gate enforcement policy preview
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove a read-only composed gate policy preview before any runtime enforcement or command blocking exists.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- project root and Atlas-local context remain the anchor

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS148-composed-gate-policy.md
```

## Current State

HS142, HS144, and HS146 are accepted. HS148 is open as the next bounded hardening seam.

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
- Support artifacts need explicit path/budget/trust posture before cleanup, snapshot, trace-pack, or enforcement execution.
- Runtime enforcement must be composed from multiple gates and must not treat `would_allow` as authorization.

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
- read-only support-artifact path authority proof through `support.artifact_path_authority.preview`

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
- `workspace/OverseerHS145-hs144-hydration-backlog-preview-review.md`
- `workspace/OverseerHS146-support-artifact-path-authority-runway.md`
- `workspace/OverseerHS147-hs146-support-artifact-path-authority-review.md`
- `workspace/OverseerHS148-composed-gate-enforcement-policy-runway.md`

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

Dev should implement a bounded read-only composed gate policy preview.

Source of intent:

- Human direction: continue down the memory lane with composed gate enforcement design.
- `workspace/SecuritySafetyAuditHS140-enforcement-classification-posture.md`
- `workspace/OverseerHS141-security-audit-hs140-review.md`
- `workspace/OverseerHS143-hs142-external-io-held-state-review.md`
- `workspace/OverseerHS147-hs146-support-artifact-path-authority-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/OverseerHS148-composed-gate-enforcement-policy-runway.md`

Ordered steps:

1. Inspect service registry, enforcement dry-run, storage setup gate/action matrix, gate-stack readout, support artifact path authority preview, live gate, task/watch command metadata, and existing verification.
2. Add a read-only composed gate policy preview command/readout.
3. Keep `would_allow` separate from runtime authorization; label it as one input only.
4. Add representative composed gate rows and reason codes.
5. Include representative families: local read/report/preflight, Assessment/Watch metadata writes, zKill Discovery, ESI Evidence/EVEidence expansion, Hydration writes, SDE import/download, snapshot creation, trace-pack creation, pruning/deletion, runtime control/task cancellation, fixture-only proofs, and unknown/unclassified command example.
6. Mark or split overly broad classes in the preview where needed.
7. Include unknown/unclassified future command posture as fail-closed policy intent without implementing runtime fail-closed behavior.
8. Add focused offline verification proving no runtime interception, no command blocking, no provider calls, no filesystem writes, no DB mutations, and no schema changes.
9. Add command-authority, service-registry, enforcement dry-run, and passive side-effect coverage as needed.
10. Update Evidence / Dev Handoff and create the expected DevHS file.

## Last Runway Accepted

HS146 implemented a bounded read-only support-artifact path authority inventory.

Source of intent:

- Human direction: support artifacts should be explicit before cleanup, snapshot, trace-pack, or enforcement execution.
- Human shaping note: `F:\Obsidian\Projects_Aura\AURA-Atlas\Atlas_Human notes\Atlas Support Artifact Path Authority Human Notes.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/OverseerHS145-hs144-hydration-backlog-preview-review.md`
- `workspace/OverseerHS146-support-artifact-path-authority-runway.md`

Ordered steps:

1. Inspect existing snapshot, trace pack, storage preflight, storage setup gate, enforcement dry-run, service registry, support/debug, temp/cache/SDE path handling, and passive side-effect verifier code.
2. Identify existing support artifact classes and current path sources.
3. Add a read-only support-artifact path authority preview/readout command.
4. Classify artifact classes as operational support or corpus-adjacent support.
5. Report path basis, storage authority requirement, pre-storage allowance, budget inclusion, External I/O relevance, renderer/trusted-context posture, cleanup stage, and privacy/sensitivity posture.
6. Distinguish cache by origin where possible rather than treating all cache as one policy bucket.
7. Distinguish rolling snapshot posture from retained snapshot posture where relevant.
8. Prove the preview creates no files/directories and mutates no DB tables.
9. Add focused offline verification plus command/service/enforcement/passive-side-effect coverage as needed.
10. Update Evidence / Dev Handoff and create the expected DevHS file.

## Prior Accepted Runway

HS144 implemented a bounded read-only Hydration backlog preview.

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
- No support artifact creation.
- No snapshot creation.
- No trace-pack creation.
- No cleanup/delete/prune/restore/move/copy/migration.
- No storage config write.
- No filesystem probing from renderer-provided arbitrary paths.
- No runtime authorization activation.
- No future fail-closed behavior activation.
- Do not collapse Watch arming into External I/O.
- Do not treat External I/O off as failure.
- Do not treat `would_allow` as runtime authorization.
- Do not treat confirmation tokens as security secrets.
- Do not treat support artifacts as Evidence/EVEidence.
- Do not treat trace packs as evidence export.
- Do not make snapshots invisible hidden storage.
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
- the proof requires support artifact creation, snapshot creation, trace-pack creation, cleanup, delete, prune, restore, move, copy, migration, or upload
- the proof requires filesystem probing from renderer-provided arbitrary paths
- support artifacts blur into Evidence/EVEidence, Discovery, Observation, or Assessment Memory
- cache cannot be classified without inventing runtime policy
- the proof requires changing how commands execute
- the proof would make runtime authorization decisions active
- unknown/unclassified command handling would become active runtime behavior
- class splitting requires source command renames or broad registry refactor
- local-only work becomes unavailable solely because External I/O is off
- re-enable behavior implies catch-up flooding
- missing labels are treated as report failure

## Required Verification

Run:

```powershell
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:composed-gate-policy
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
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

HS148 opened from accepted security/enforcement breadcrumbs.

Dev should replace this section with concise proof evidence after implementation.

## Dev Handoff

Pending Dev handoff.

Expected:

- `workspace/DevHS148-composed-gate-policy.md`

Prior evidence:

HS146 Dev implementation accepted.

- Added read-only `support.artifact_path_authority.preview`.
- Preview reports 10 representative support artifact classes: rolling runtime snapshots, retained runtime snapshots, operator debug trace packs, light operational logs, readiness/preflight reports, operational runtime cache, provider/activity-derived cache, SDE source/import material, SDE derived DB lookup material, and fixture config/write-proof artifacts.
- Classes are split between `operational_support` and `corpus_adjacent_support`.
- Each class reports path basis, storage authority requirement, pre-storage allowance, budget inclusion, External I/O relevance, renderer/trusted-context posture, cleanup stage, privacy/sensitivity posture, and read-only/non-mutating status.
- Cache is distinguished by origin: operational runtime cache, provider/activity-derived cache, SDE source/import cache, and SDE derived DB lookup material.
- Snapshot posture is split between rolling/overwritten recovery copy and retained recovery copy.
- Renderer path claims are ignored by the preview; the verifier proves forged renderer paths are not echoed as authority.
- Focused verifier proves the preview creates no files/directories and mutates no DB table counts.
- Added command/service/enforcement/passive-side-effect coverage for the new read-only command.
- Boundary preserved: no support artifact creation, snapshot creation, trace-pack creation, cleanup/delete/prune/restore/move/copy/migration/upload, provider calls, storage config writes, enforcement, schema changes, or UI/renderer redesign.

HS146 verification:

```powershell
node --check src\main\services\supportArtifactPathAuthorityService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-support-artifact-path-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
npm.cmd run verify:support-artifact-path-authority
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:storage-setup-gate
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

All listed commands passed. `verify:protected-terms` completed with warning-only discovery output and exit code 0. `git diff --check` passed with line-ending warnings only. `git status --short --branch` showed `main...origin/main [ahead 23]` plus the HS146 working-tree changes.

Overseer review:

- `workspace/OverseerHS147-hs146-support-artifact-path-authority-review.md`

Completed handoff:

- `workspace/DevHS146-support-artifact-path-authority.md`

Prior evidence:

HS144 Dev implementation accepted.

- Added read-only `metadata.hydration_backlog.preview`.
- Preview derives missing readability labels from local `activity_events`, `entities`, local SDE lookup tables, Watch/discovery route hints, assessment interest context, and recent `metadata_runs`.
- Distinguishes locally known labels from provider-needed entity labels.
- Distinguishes local SDE/type/system lookup gaps from provider-needed ESI name labels.
- Separates Hydration from Evidence/EVEidence creation and Discovery refs.
- Groups representative candidates into `view_local_record`, `watch_background`, `target_report_scoped`, and `corpus_hygiene_low_priority` lanes.
- Shows External I/O posture for future provider-backed hydration: off means `held_by_external_io`, not failure; on means release to normal gates, not catch-up flood.
- Boundary preserved: no ESI/zKill/SDE provider calls, no hydration writes, no Evidence/EVEidence writes, no Discovery ref mutation, no queue or persisted backlog, no schema change, no UI work.

HS144 verification:

```powershell
node --check src\main\services\hydrationBacklogPreviewService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-hydration-backlog-preview.js
npm.cmd run verify:hydration-backlog-preview
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
```

All listed commands passed. `verify:protected-terms` completed with warning-only discovery output and exit code 0.

Overseer review:

- `workspace/OverseerHS145-hs144-hydration-backlog-preview-review.md`

Completed handoff:

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
