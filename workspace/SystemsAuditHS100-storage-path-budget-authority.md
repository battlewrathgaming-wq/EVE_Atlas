# SystemsAuditHS100 - Storage Path / Budget Authority Audit

Date: 2026-05-27
Role: Atlas Systems Auditor
Status: advisory audit only; not a Dev runway

## Executive Summary

Atlas has strong support-artifact hardening for runtime snapshots and decent project-local discipline for dev/test temp, SDE cache, and live-smoke artifacts. It does not yet implement the accepted broader storage path / budget authority for the main Atlas data store.

The largest gap is that production Electron still creates or uses the runtime SQLite DB at `app.getPath('userData')` when `AURA_ATLAS_DB_PATH` is absent, and `openDatabase()` creates missing parent directories. That conflicts with the newer briefcase direction: portable/app-local config, explicit operator-selected storage, no silent relocation/new DB, and hard-lock when storage is missing or unavailable.

No code was changed.

## Files Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/index.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/runbooks/local-alpha-trial.md`
- `docs/runbooks/local-alpha-known-limits-and-feedback.md`
- `docs/runbooks/local-alpha-release-tag-checklist.md`
- `docs/features/r-scanner-sequencer-presentation.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/features/evidence-compaction-to-assessment.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `src/main/db/database.js`
- `src/main/util/tempPaths.js`
- `src/main/main.js`
- `src/main/windowState.js`
- `src/main/services/appReadinessService.js`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/services/runtimeSnapshotSettingsService.js`
- `src/main/support/operatorDebugTracePack.js`
- `src/main/sde/sdeLookupBuilder.js`
- `src/main/sde/sdeImporter.js`
- `src/main/sde/sdeInventoryImporter.js`
- `scripts/seed-demo-db.js`
- `scripts/snapshot-runtime-db.js`
- `scripts/operator-debug-trace-pack.js`
- `scripts/sde-build-lookups.js`
- `scripts/import-sde-topology.js`
- `scripts/import-sde-inventory.js`
- `scripts/manual-discover.js`
- `scripts/manual-expand.js`
- `scripts/electron-visual-smoke.ps1`
- `package.json`

## Current Implementation Map

Runtime SQLite DB:

- `AURA_ATLAS_DB_PATH` is used when set.
- Otherwise Electron uses `app.getPath('userData')/aura-atlas.sqlite`.
- `openDatabase()` creates missing parent directories automatically.

WAL/SHM files:

- No explicit storage authority exists.
- Snapshot preflight detects `<db>-wal` and `<db>-shm` and includes them in projected snapshot size.

Snapshots:

- `runtime.db_snapshot.preflight` and `runtime.db_snapshot.create` are explicit.
- Default destination is `.tmp/db-snapshots`.
- Configured destination is allowed only under project root unless `AURA_ATLAS_ALLOW_EXTERNAL_PATHS=1`.
- Snapshot budget blocks snapshot creation when projected usage exceeds configured snapshot budget.

Snapshot settings:

- Settings can live at an explicit path, `AURA_ATLAS_RUNTIME_SNAPSHOT_SETTINGS_PATH`, DB directory when `AURA_ATLAS_DB_PATH` is set, or `.tmp/aura-atlas-runtime-snapshot-settings.json`.

Trace packs:

- Default output is `.tmp/operator-debug-trace-packs`.
- The service accepts `outputDir`.
- I did not find project-local validation on `outputDir`.

Visual smoke artifacts:

- The smoke script forces output into `.tmp/electron-visual-smoke`.
- The app fallback is Electron `userData/visual-smoke`.

Temp/cache/SDE:

- `auraTempRoot()` defaults to project `.tmp`.
- Cache defaults to `.tmp/cache`.
- SDE cache defaults to `.tmp/sde`.

SDE import/build artifacts:

- SDE lookup build uses `.tmp/sde` by default.
- SDE source/cache paths have project-local validation unless external paths are explicitly allowed.
- Temporary `lookup-build-*` directories are cleaned unless `keepSource` is enabled.
- SDE zip/source is treated as import material, not runtime lookup data.

Demo/fixture DBs:

- Scripts write under `.tmp` by default, including `.tmp/aura-atlas-demo-fixture.sqlite`, `.tmp/aura-atlas-dev.sqlite`, and smoke DBs.

Window/settings:

- Window state defaults to DB directory if `AURA_ATLAS_DB_PATH` is set.
- Otherwise it falls back to Electron `userData`.

## Accepted Direction Map

Durable docs now accept:

- Meaningful real/alpha collection should lock until storage location is explicit.
- Storage config should be portable/app-local, not hidden in Windows app/user settings.
- Missing, unavailable, or corrupt storage should hard-lock and require setup/re-establish, not silently create a new DB elsewhere.
- Budget means physical disk use under the pointed Atlas storage location.
- Budget accounting should include DB, journals, snapshots, trace packs, logs, and support artifacts stored there.
- 70% budget should warn.
- 95% budget should warn strongly.
- 100% budget should hard-lock writes/acquisition.
- Demo/fixture mode may remain separate.
- Storage budget is distinct from provider/request pacing.
- Pruning is future suite work, not current cleanup behavior.

## Gaps / Risks

- Main DB storage authority is not implemented.
- There is no required operator-selected storage location before real/alpha collection.
- Default Electron DB path is hidden app user data, which conflicts with briefcase/app-local direction.
- Missing DB/folder can silently create a new DB because `openDatabase()` creates parent directories.
- No setup/re-establish lockout exists.
- No whole-Atlas disk budget model exists.
- Snapshot budget only covers snapshot/support-artifact destination usage.
- No 70% or 95% warnings exist for overall Atlas storage.
- No 100% hard-lock exists for acquisition/write behavior across Evidence, Discovery, metadata hydration, SDE import, trace packs, or logs.
- Invalid snapshot destination degrades to `.tmp` fallback; that was accepted for snapshot settings, but it is not acceptable for future active DB/storage authority.
- Trace pack `outputDir` appears less constrained than snapshot destination.
- App readiness reports path validity/readiness, but does not enforce storage authority before writes/provider actions.
- `AURA_ATLAS_ALLOW_EXTERNAL_PATHS=1` is useful for dev override, but future operator storage selection needs a safer product-owned validation path.
- There is no single storage manifest/config that accounts for DB, journals, cache, SDE lookup/import material, snapshots, trace packs, smoke artifacts, and settings together.

## Suggested Bounded Next Packet

A Dev packet is not quite ready until Human/Overseer choose the first lockout posture.

The smallest safe next packet would be a read-only storage authority preflight/inventory:

- Add a read-only storage authority status model.
- Inventory current DB path, WAL/SHM, snapshot settings/destination, trace pack default dir, temp/cache/SDE dirs, window/settings path, and demo/fixture separation.
- Report whether current runtime is `configured`, `fallback`, `missing`, `outside policy`, or `demo/fixture`.
- Compute current byte usage for known Atlas-controlled locations.
- Do not move DBs, write config, enforce lockout, prune, or change provider behavior yet.
- Use this as the proof layer before a second packet implements setup/re-establish and hard-lock behavior.

## Verification Suggestions

Relevant non-live commands:

```powershell
npm.cmd run verify:app-readiness
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:sde-build-lookups
npm.cmd run verify:sde-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:task-concurrency
npm.cmd run verify:db-integrity
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If storage authority touches Electron startup or renderer readiness:

```powershell
npm.cmd run verify:electron-runtime
npm.cmd run verify:renderer-shell
npm.cmd run smoke:electron
```

Do not run live/provider checks for this audit or first storage preflight packet.

## Human / Overseer Decisions Needed

- Should first implementation be total app lockout, or narrower write/provider/acquisition lockout?
- What exact file should hold portable storage authority config in packaged/app-local mode?
- Is project `.tmp` acceptable only for dev/demo, or also as an explicit "current file" real storage choice?
- Should invalid/missing snapshot destination continue fallback behavior once global storage authority exists, or hard-lock support artifact writes too?
- Should trace pack output be forced under selected storage/support-artifact root?
- Which artifacts count against the first budget: active DB/WAL/SHM only, or DB plus snapshots/trace/log/cache/SDE lookup tables immediately?

## Boundary Confirmation

No code was changed, no durable product direction was changed, no Dev runway was created, and no live/API/provider checks were run.
