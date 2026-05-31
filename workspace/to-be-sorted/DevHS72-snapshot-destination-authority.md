# DevHS72 - Snapshot Destination Authority

Date: 2026-05-25
Executor: Dev
Milestone: HS72 Snapshot Destination And Storage Budget Authority

## Scope

Implemented bounded runtime DB snapshot destination authority and snapshot/support-artifact budget behavior.

No production deletion execution, active runtime DB relocation, restore behavior, snapshot deletion, automatic cleanup/pruning, footprint storage, live API access, or protected-word JSON update was added.

## Files Reviewed

- `workspace/current.md`
- `workspace/OverseerHS71-sense-selector-pattern-review.md`
- `workspace/OverseerHS70-hs69-deletion-preflight-review.md`
- `workspace/DevHS69-deletion-preflight-refinement.md`
- `workspace/OverseerHS69A-deletion-trust-no-footprint-decision.md`
- `workspace/OverseerHS68-deletion-recovery-assessment-decisions.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/main.js`
- `src/main/preload.js`
- `src/renderer/readiness.js`
- `scripts/verify-runtime-db-snapshot.js`
- `scripts/verify-renderer-shell.js`
- `scripts/verify-service-registry.js`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

## Files Changed

- `src/main/services/runtimeSnapshotSettingsService.js`
  - Added versioned runtime snapshot settings persistence.
  - Added backend validation for snapshot destination directories and budget bytes.
  - Added degraded-state reporting for invalid persisted destination/budget settings.
- `src/main/services/runtimeSnapshotService.js`
  - Uses validated configured destination directories when available.
  - Falls back to the existing project `.tmp/db-snapshots` location when settings are missing or degraded.
  - Generates snapshot filenames in backend logic.
  - Reports current usage, projected snapshot size, configured budget, remaining budget, and over-budget blockers.
  - Blocks snapshot creation when projected usage exceeds the configured budget.
  - Rejects renderer-origin arbitrary `destinationPath` snapshot file paths.
- `src/main/services/serviceRegistry.js`
  - Added bounded `runtime.db_snapshot.settings.get` and `runtime.db_snapshot.settings.update` service commands.
  - Preserved explicit snapshot creation confirmation.
- `src/renderer/readiness.js`
  - Shows snapshot settings status, destination source, usage, projected size, budget, remaining budget, allowed state, and blockers in the existing snapshot preflight output.
- `scripts/verify-runtime-db-snapshot.js`
  - Added fixture coverage for settings save/load, invalid destination degradation, invalid budget degradation, configured destination use, backend filename generation, over-budget blocking, and renderer destination-path rejection.
- `scripts/verify-renderer-shell.js`
  - Added static checks for visible snapshot settings and budget readout fields.
- `scripts/verify-service-registry.js`
  - Added assertions for the new snapshot settings commands.
- `docs/current-state/current-evidence-pipeline.md`
  - Recorded accepted snapshot destination authority and budget behavior.
- `docs/current-state/current-terminology-and-retention.md`
  - Recorded snapshot settings/budget retention boundary.
- `workspace/current.md`
  - Updated Evidence and Dev Handoff for HS72.

## Sense Pattern Adapted

Adapted:

- backend-owned folder/path authority
- backend validation before persistence/use
- explicit versioned persisted runtime settings
- visible degraded state for invalid persisted settings
- backend-generated output filenames
- renderer access only through controlled service bridge

Explicitly not imported:

- Sense product terms
- Sense gamelog-folder structure validation
- Sense watcher/input-folder containment model
- Sense tactical/passive runtime semantics

Atlas treats snapshot destinations as support-artifact output locations only.

## Runtime Snapshot Authority

New service commands:

- `runtime.db_snapshot.settings.get`
  - read-only settings/status response
- `runtime.db_snapshot.settings.update`
  - metadata-only backend validation and persistence

Persisted settings:

- `version`
- `snapshot_destination_dir`
- `snapshot_budget_bytes`

Effective behavior:

- valid configured destination: used for generated snapshot filenames
- missing settings: fallback to existing project `.tmp/db-snapshots`
- invalid persisted destination: `degraded`, not used, fallback applies
- invalid persisted budget: `degraded`, not used as an effective budget
- explicit renderer-origin snapshot file paths: rejected

## Budget Behavior

Snapshot preflight now reports:

- current destination usage
- projected snapshot size from active DB plus WAL/SHM journals
- projected post-snapshot usage
- configured budget
- remaining budget after projected write
- over-budget state
- blocker list
- `automatic_cleanup: false`

Snapshot create:

- remains explicit support-artifact creation
- refuses existing destination files unless overwrite is explicitly requested
- blocks when preflight reports projected usage above configured budget
- does not prune, delete, restore, compact, relocate, or mutate active Evidence

## Boundary Proof

- `runtime.db_snapshot.preflight` remains read-only.
- `runtime.db_snapshot.create` remains explicit support-artifact creation.
- Snapshot filenames are generated by backend/service logic.
- Renderer code does not use filesystem APIs or direct Electron APIs.
- Renderer-origin snapshot requests cannot pass arbitrary destination file paths.
- No active DB relocation was added.
- No production deletion execution was added.
- No restore implementation was added.
- No snapshot deletion/pruning or automatic cleanup was added.
- No live/provider/API behavior was introduced.

## Verification

Commands run:

```powershell
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:renderer-shell
npm.cmd run verify:service-registry
npm.cmd run verify:protected-terms
npm.cmd run verify:all
git status --short --branch
```

Results:

- `verify:runtime-snapshot`: passed.
- `verify:renderer-shell`: passed.
- `verify:service-registry`: passed.
- `verify:protected-terms`: passed warning-only.
- `verify:all`: passed, 65 scripts.

Protected-term output after documentation and handoff updates:

- Files scanned: 11.
- Warning count: 1088.
- Classes: lab-quarantine-borrowing 461, atlas-candidate 608, cross-project-borrowing 19.
- Confirmation: warning-only; no renames performed; no protected-word JSON updates performed.

## Risks / Deferred Decisions

- Native folder picker UI is not implemented in this slice; Atlas uses the accepted controlled backend service path.
- The configured budget applies to the runtime snapshot destination/support-artifact lane implemented here; it does not yet govern every possible support artifact output location.
- Historical snapshots/backups and trace packs are not pruned, deleted, or relocated.
- Production deletion execution still needs separate transaction, rollback, confirmation, and failure behavior.

## Recommended Next Action

Overseer review HS72. If accepted, choose whether Atlas needs a native folder picker UI pass, broader support-artifact budget coverage, or a separate production deletion execution design packet.
