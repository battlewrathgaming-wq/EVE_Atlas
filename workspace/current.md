# AURA Atlas Current Work

Status: Idle after accepted HS72 review
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS72 snapshot destination and storage-budget authority is accepted after Overseer review and correction. Atlas is resting before the next Human/Overseer-selected storage/runtime hardening slice.

Source of intent:

- Human direction on 2026-05-25: prioritize storage/snapshot management before destructive deletion execution.
- Human direction on 2026-05-25: look to Sense's selector hardening.
- Human direction on 2026-05-25: wire in an option to choose how much space Atlas will use.
- `workspace/OverseerHS71-sense-selector-pattern-review.md`
- `workspace/OverseerHS70-hs69-deletion-preflight-review.md`
- `workspace/DevHS69-deletion-preflight-refinement.md`
- `workspace/OverseerHS69A-deletion-trust-no-footprint-decision.md`
- `workspace/OverseerHS68-deletion-recovery-assessment-decisions.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-runtime-db-snapshot.js`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted baseline:

- Production deletion execution does not exist and must not be added in HS72.
- Retained deletion footprint is rejected.
- Snapshotting is accepted as recovery/support posture, with honest disclosure that snapshots/backups may retain records removed from active storage.
- Snapshots/backups are support/recovery artifacts, not Evidence, Observation, Assessment Memory, deletion, or active-state truth.
- Operator-configured storage budget should apply to the snapshot/support-artifact lane in this packet.
- Storage budget should warn or block new snapshot/support artifact writes when projected usage exceeds the accepted budget; it must not automatically delete old artifacts.
- Active runtime DB relocation is not accepted for this packet.
- Atlas may adapt Sense's selector/settings workflow pattern, but Sense product terms and gamelog-folder structure rules are not Atlas authority.

## Executor

Current executor: none

Expected handoff filename:

```txt
None. No Dev packet is open.
```

## Ordered Runway

No active Dev runway.

Next likely selectable lanes:

1. Native picker/UI rigging for snapshot/support-artifact destination settings.
2. Broader support-artifact budget coverage beyond runtime DB snapshots.
3. Production deletion execution design, with transaction, rollback, confirmation, snapshot disclosure, and failure behavior.
4. Queue -> API request -> Evidence write confidence hardening if storage/runtime work continues there.

## Runway Shape

- current packet: idle decision state after HS72 acceptance; no executor and no Dev runway.
- likely next packet if accepted: Overseer selects one storage/runtime hardening lane and writes a bounded current packet.
- follow-up packet if clean: continue the same selected lane for one adjacent slice, then return to Human/Overseer selection before crossing into deletion execution, restore, active DB relocation, automatic pruning, or broad settings redesign.
- stop or Human decision point: choosing the next lane, especially before deletion execution, active runtime DB relocation, restore, snapshot deletion/pruning, or automatic cleanup.

Likely-next and follow-up lines are orientation, not authorization. Dev opens only through a rewritten `workspace/current.md`.

## Guardrails And Non-Goals

- No production deletion execution.
- No active runtime DB relocation.
- No restore implementation.
- No snapshot deletion/pruning implementation.
- No automatic cleanup/pruning to satisfy storage budget.
- No footprint storage or retained footprint reporting.
- No live/private/API calls.
- No direct renderer filesystem access.
- No broad readiness/settings redesign.
- No bridge, IPC, service command, payload, CSS/test-id, or protected-term renames beyond what the bounded selector/settings path requires.
- Do not copy Sense product terms or gamelog-folder validation rules into Atlas.
- Do not silently accept invalid persisted paths.
- Do not silently accept invalid persisted budgets.
- Do not mutate real operator data outside explicit snapshot support artifact creation.

## Stop Conditions

Stop and return to Overseer/Human before any new implementation if:

- implementation requires moving the active runtime DB
- implementation requires production deletion, restore, or snapshot deletion
- implementation requires automatic pruning/cleanup
- implementation requires accepting arbitrary renderer-supplied file paths
- implementation would bypass backend validation
- implementation would require broad settings/product doctrine decisions
- implementation would blur snapshots/backups with Evidence, Observation, Assessment Memory, or active-state truth
- protected-term warnings suggest a new authority decision is required

## Required Verification

No active Dev packet.

If work resumes in the HS72 area, rerun at minimum:

```powershell
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:renderer-shell
npm.cmd run verify:service-registry
```

Run `npm.cmd run verify:protected-terms` only when the selected packet touches terminology, adapter mappings, display copy, bridge-facing labels, Atlas-owned meanings, critical assets, release/push readiness, or the packet explicitly requires it. It is warning-only unless Atlas Overseer/Human tightens it.

If main/preload/service registry/shared verification surfaces change, also run:

```powershell
npm.cmd run verify:all
```

## Evidence

HS72 runway opened by Overseer.

Overseer verification:

- `npm.cmd run verify:protected-terms` completed with exit code 0.
- Protected-term discovery ran in working-set mode against 3 files.
- Warning count: 111.
- Warning classes: cross-project borrowing 10, Lab quarantine borrowing 91, Atlas candidate 10.
- The scan confirmed warning-only behavior; no renames and no protected-word JSON updates were performed.
- No code, schema, deletion execution, storage relocation, snapshot deletion, automatic pruning, live API, or real DB mutation occurred while opening this runway.

Dev implementation completed for HS72.

Files changed:

- `src/main/services/runtimeSnapshotSettingsService.js`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/services/serviceRegistry.js`
- `src/renderer/readiness.js`
- `scripts/verify-runtime-db-snapshot.js`
- `scripts/verify-renderer-shell.js`
- `scripts/verify-service-registry.js`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/current.md`
- `workspace/DevHS72-snapshot-destination-authority.md`

Sense patterns adapted:

- backend-owned folder/path authority
- backend validation before settings persistence/use
- versioned persisted runtime settings
- visible degraded state for invalid persisted settings
- backend-generated output filenames
- renderer access only through controlled service commands

Sense patterns explicitly not imported:

- Sense product terms
- Sense gamelog-folder structure validation
- Sense watcher/input-folder containment semantics
- Sense tactical/passive runtime semantics

Snapshot destination behavior:

- Runtime snapshot settings now support `snapshot_destination_dir` and `snapshot_budget_bytes`.
- Missing settings fall back to the existing project `.tmp/db-snapshots` location.
- Invalid persisted destination settings degrade visibly and are not used.
- Existing configured destination directories are resolved and real-path checked before use unless external paths are explicitly allowed.
- Snapshot filenames are generated by backend snapshot logic.
- Renderer-origin snapshot requests cannot provide arbitrary `destinationPath` file paths.

Snapshot/support-artifact budget behavior:

- Preflight reports current destination usage, projected snapshot bytes from DB plus journals, projected usage, configured budget, remaining budget, over-budget state, and `automatic_cleanup: false`.
- Over-budget preflight sets blocker `SNAPSHOT_BUDGET_EXCEEDED`.
- Snapshot create refuses over-budget writes.
- Atlas does not auto-prune or delete old snapshots/support artifacts.

Boundary proof:

- `runtime.db_snapshot.preflight` remains read-only.
- `runtime.db_snapshot.create` remains explicit support-artifact creation.
- No native picker was added; bridge proof is controlled service-command access plus renderer filesystem rejection.
- No active DB relocation, production deletion execution, restore, snapshot deletion/pruning, automatic cleanup, footprint storage, live/private/API behavior, protected-word JSON update, or terminology rename was added.

Verification:

- `npm.cmd run verify:runtime-snapshot` passed.
- `npm.cmd run verify:renderer-shell` passed.
- `npm.cmd run verify:service-registry` passed.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 11 files.
- Warning count: 1088.
- Warning classes: lab-quarantine-borrowing 461, atlas-candidate 608, cross-project-borrowing 19.
- `npm.cmd run verify:all` passed, 65 scripts.

## Dev Handoff

Dev created:

```txt
workspace/DevHS72-snapshot-destination-authority.md
```

The handoff summarizes the snapshot destination authority, deferred items, verification results, and remaining storage/deletion risks.

Overseer review:

```txt
workspace/OverseerHS73-hs72-snapshot-destination-review.md
```

HS72 is accepted after one Overseer correction: renderer-origin snapshot settings get/update and preflight now ignore payload-supplied settings paths and use backend/context-owned authority instead. This preserves the no-direct-renderer-filesystem-authority boundary.

Overseer verification after correction:

- `npm.cmd run verify:runtime-snapshot` passed.
- `npm.cmd run verify:service-registry` passed.
- `npm.cmd run verify:renderer-shell` passed.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 13 files.
- Warning count: 1138.
- Warning classes: lab-quarantine-borrowing 496, atlas-candidate 613, cross-project-borrowing 29.
- `npm.cmd run verify:all` passed, 65 scripts.
- `git diff --check` passed.
