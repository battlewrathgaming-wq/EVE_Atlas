# OverseerHS115 - Storage Setup Gate Readout Runway

Date: 2026-05-27
Role: Atlas Overseer
Status: Open Dev runway

## Source Of Intent

Accepted Human / Overseer direction:

- Atlas should block meaningful real/alpha collection until the operator chooses a storage location.
- Demo/fixture mode may remain available without real storage setup.
- A project-local or "current file" choice can be offered, but machine storage use must be explicit.
- Missing/unavailable storage should return to setup/re-establish posture, not silently relocate.
- Disk budget means physical Atlas-controlled storage use, not request/API scan pacing.
- 70% budget should warn, 95% should strongly warn, 100% should hard-lock writes/acquisition.
- Hard-lock protects existing data from malformed writes; it is not pruning, migration, deletion, restore, or UI redesign.

Accepted existing baseline:

- `storage.authority_preflight` exists as read-only inventory.
- `support.gate_stack_readout` keeps storage safety separate from `external_io`, `live.gate`, Watch arming, active task state, and confirmation.
- HS113/HS114 accepted cadence simulation only; no runtime cadence or storage unlock behavior is implemented.

## Current Executor

Dev.

## Expected DevHS

```txt
workspace/DevHS115-storage-setup-gate-readout.md
```

## Active Milestone

Atlas Storage And Runtime Hardening.

## Current Focus

Create a read-only storage setup gate readout that turns the accepted storage-location and disk-budget policy into inspectable posture before any enforcement is implemented.

This is the bridge between current storage authority inventory and later real lockout behavior.

## Ordered Runway

1. Read `docs/current-state/current-storage-runtime-hardening.md`, `src/main/services/storageAuthorityPreflightService.js`, `src/main/services/gateStackReadoutService.js`, and existing storage/snapshot verifier patterns.
2. Add a read-only storage setup gate helper or service that consumes existing preflight-style facts and reports storage readiness posture without enforcing it.
3. The readout must distinguish at least:
   - explicit configured storage ready for real/alpha collection
   - project/current-file fallback requiring explicit operator acknowledgement before real/alpha collection
   - demo/fixture mode only
   - missing/unavailable storage blocked
   - invalid/degraded settings blocked or setup-required
   - budget unconfigured, within budget, warning at/above 70%, strong warning at/above 95%, hard lock at/above 100%
4. The readout must name allowed and blocked work classes:
   - allowed while locked: storage setup/re-establish, settings needed to fix storage, read-only help/status, clearly separated demo/fixture mode
   - blocked while locked: provider-backed acquisition, Evidence/EVEidence writes, hydration writes, snapshots/support artifacts when over budget or path invalid, destructive pruning/deletion execution
   - local read/report behavior should be reported separately and only blocked if storage is unavailable for the needed local records
5. Add focused offline fixture verification proving the readout states above.
6. If a service command is added, register it as read-only and prove renderer payloads cannot probe arbitrary paths or override trusted storage facts.
7. Update `workspace/current.md` Evidence / Dev Handoff and create the expected DevHS file.

## Guardrails And Non-Goals

- Do not implement actual lockout enforcement.
- Do not write storage config.
- Do not create a file selector.
- Do not move, copy, migrate, delete, restore, or create active DB files.
- Do not create pruning/deletion execution.
- Do not run live/API/provider calls.
- Do not change Watch scheduler, Acquisition/Hydration cadence, provider dispatch, hydration, Evidence/EVEidence write behavior, or renderer layout.
- Do not treat snapshot budget as full Atlas storage budget unless the readout explicitly labels it as snapshot/support-artifact budget.
- Do not silently relocate missing storage to a new database.

## Stop Conditions

Stop and hand back if:

- implementing the readout requires schema changes or persisted settings changes
- the existing preflight cannot distinguish configured/fallback/missing/demo posture without unsafe probing
- a proposed change would enforce lockout globally
- a proposed change would allow renderer payloads to inspect arbitrary filesystem paths
- a proposed change would blur storage budget with provider/API pacing budget

## Required Verification

Run and report:

```powershell
npm.cmd run verify:storage-setup-gate
npm.cmd run verify:storage-authority-preflight
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If the chosen implementation touches snapshot settings, also run:

```powershell
npm.cmd run verify:runtime-snapshot
```

## Evidence Required

Dev handoff must include:

- files changed
- command added, if any
- sample readout output
- proof that readout is read-only
- proof for ready, fallback/current-file, demo/fixture, missing/unavailable, invalid/degraded, warning, strong warning, and hard-lock budget states
- proof of allowed/blocked work classes while locked
- proof no storage config, DB movement, migration, provider calls, Evidence/EVEidence writes, hydration writes, pruning/deletion execution, or renderer redesign occurred

## Dev Handoff

Expected:

```txt
workspace/DevHS115-storage-setup-gate-readout.md
```
