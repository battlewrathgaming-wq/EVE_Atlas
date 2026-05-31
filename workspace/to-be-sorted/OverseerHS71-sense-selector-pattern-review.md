# OverseerHS71 - Sense Selector Pattern Review For Atlas Storage

Date: 2026-05-25
Role: Atlas Overseer
Status: accepted advisory pattern / Dev runway source

## Request Answered

The Human selected storage/snapshot management before production deletion execution and asked to look to Sense's file selector hardening.

This record imports only the selector and settings-hardening patterns that fit Atlas. Sense does not define Atlas storage meaning, deletion semantics, Evidence semantics, or snapshot policy.

## Sense Sources Reviewed

- `F:\Projects\AURA-Sense\docs\archive\deprecated-gap-workflow-2026-05-23\complete\native-gamelog-folder-picker.md`
- `F:\Projects\AURA-Sense\docs\archive\deprecated-gap-workflow-2026-05-23\complete\runtime-settings-persistence.md`
- `F:\Projects\AURA-Sense\docs\archive\deprecated-gap-workflow-2026-05-23\complete\runtime-startup-and-session-recovery.md`
- `F:\Projects\AURA-Sense\src\main\main.js`
- `F:\Projects\AURA-Sense\src\runtime\runtimeSettingsService.js`
- `F:\Projects\AURA-Sense\src\combat\eveLogPaths.js`
- `F:\Projects\AURA-Sense\scripts\verify-runtime-control.js`

## Atlas Sources Reviewed

- `workspace/current.md`
- `workspace/overview.md`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-runtime-db-snapshot.js`
- `src/main/main.js`
- `src/main/preload.js`
- `src/renderer/app.js`
- `scripts/verify-renderer-shell.js`

## Sense Patterns Accepted For Atlas Adaptation

- Native folder selection should be main-process owned.
- Renderer must not receive direct filesystem authority or Node filesystem APIs.
- A selected folder must be backend validated before it is persisted or used.
- Typed path fallback is acceptable if it goes through the same backend validation.
- Persisted runtime settings should be explicit and versioned.
- Invalid persisted settings should degrade visibly rather than silently configure work.
- Native dialog behavior is environment-dependent; static verification can prove boundaries, but manual smoke remains useful.
- Path validation should normalize/resolve paths and avoid unsafe link/escape behavior where practical.

## Sense Patterns Not Imported

- Sense's EVE `logs/Gamelogs` folder structure rule is not Atlas doctrine.
- Sense's watcher containment model is not copied directly; Atlas snapshot destinations are output folders, not active input watch folders.
- Sense's tactical/passive state model is not imported.
- Sense's product terms remain Sense-owned.

## Atlas Adaptation

Atlas should first harden snapshot destination authority, not active runtime DB relocation.

The first Atlas slice should:

- keep the active runtime DB path unchanged
- keep snapshot creation explicit
- allow the operator to select or configure a snapshot destination directory
- validate and persist only the approved snapshot destination directory
- generate snapshot filenames in the backend/service layer
- show degraded state for invalid/missing persisted snapshot destination settings
- keep default snapshot output under the existing project `.tmp` location if no valid destination is configured
- let the operator configure an explicit snapshot/storage budget for this support-artifact lane
- report current and projected snapshot-directory usage against that budget before creating a snapshot
- warn or block new snapshot creation when projected usage exceeds the accepted budget, without deleting old artifacts automatically
- keep snapshots/backups classified as support/recovery artifacts, not Evidence, Observation, Assessment Memory, deletion, or active-state truth

## Non-Goals For First Dev Packet

- No production deletion execution.
- No active database relocation.
- No restore implementation.
- No snapshot deletion/pruning UI.
- No automatic pruning to satisfy storage budget.
- No external live/API calls.
- No raw Evidence inspection beyond existing snapshot copy behavior.
- No direct renderer filesystem access.
- No broad redesign of readiness/settings UI.

## Recommended Dev Packet

Open a bounded Dev packet for Atlas snapshot destination authority:

- add or refine runtime snapshot destination settings support
- add or refine a snapshot/storage budget setting
- add a main-process/native folder picker or controlled service path if it fits the existing Atlas bridge
- validate selected destination folders before saving or using them
- update snapshot preflight/create to use the accepted destination directory when valid
- update snapshot preflight/create to report current/projected usage against the accepted budget and avoid silently exceeding it
- preserve explicit confirmation for snapshot creation
- add focused verification for valid save/reload, invalid/degraded setting, budget reporting/over-budget handling, picker/bridge boundary, and snapshot create using the validated destination

## Stop Conditions

Stop before or during Dev if:

- implementation requires moving the active runtime DB
- implementation requires production deletion
- implementation requires restore semantics
- implementation requires deleting snapshots/backups
- implementation requires automatic pruning/cleanup to enforce budget
- implementation gives renderer direct filesystem authority
- implementation bypasses backend validation
- implementation silently accepts invalid persisted paths

## Verification

Documentation-only verification while opening the runway:

```powershell
npm.cmd run verify:protected-terms
git status --short --branch
```

Result:

- `npm.cmd run verify:protected-terms` completed with exit code 0.
- Protected-term discovery ran in working-set mode against 3 files.
- Warning count: 111.
- Warning classes: cross-project borrowing 10, Lab quarantine borrowing 91, Atlas candidate 10.
- The scan confirmed warning-only behavior; no renames and no protected-word JSON updates were performed.
- No code, schema, deletion execution, storage relocation, snapshot deletion, automatic pruning, live API, or real DB mutation occurred while opening this runway.

## Conclusion

Sense gives Atlas a good workflow pattern:

```txt
main-process picker -> backend validation -> explicit persisted setting -> degraded invalid state -> controlled runtime use
```

Atlas should adapt that pattern for snapshot destination management before destructive deletion execution.
