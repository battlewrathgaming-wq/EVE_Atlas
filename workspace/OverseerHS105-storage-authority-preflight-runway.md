# OverseerHS105 - Storage Authority Preflight Runway

Date: 2026-05-27
Role: Atlas Overseer
Status: Dev runway opened

## Milestone

Atlas Storage And Runtime Hardening

## Source Of Intent

- Human accepted storage path and budget authority direction on 2026-05-27.
- Human accepted that Atlas should behave like a portable briefcase with explicit storage authority.
- Human accepted that meaningful real/alpha collection should wait for explicit storage selection, but enforcement should be shaped carefully.
- HS100 identified the main storage authority gap: production Electron can fall back to hidden `userData` storage and missing paths can be created silently.
- HS104 accepted HS100-HS103 as advisory input and selected read-only storage authority preflight/inventory as the strongest next system packet.

## Current Executor

Dev

## Expected Dev Handoff

```txt
workspace/DevHS105-storage-authority-preflight.md
```

## Goal

Add a read-only storage authority preflight/inventory proof layer.

Atlas should be able to report where it believes active runtime/storage/support artifacts are, whether the runtime DB path is explicitly configured or a fallback, and current byte usage for known Atlas-controlled locations where practical.

This packet must not enforce lockout yet. It is instrumentation before policy.

## Ordered Runway

1. Read current storage/runtime path code and existing readiness/snapshot/debug trace services.
2. Add or extend a read-only storage authority status model/service that reports:
   - current DB path and mode: configured, fallback, missing, outside policy, or demo/fixture where determinable
   - DB parent path, DB existence, and WAL/SHM existence/size
   - snapshot settings path and snapshot destination status
   - trace-pack default or configured output status
   - temp/cache/SDE paths and whether they appear project-local/dev/demo/runtime
   - window/settings path if exposed by existing runtime helpers
   - byte usage for known Atlas-controlled locations where practical
3. Expose the preflight through an existing appropriate read-only service/report surface, or add a narrowly named read-only service if cleaner.
4. Add offline fixture or script verification proving configured path, fallback path, missing path, and known support-artifact inventory behavior without live/API calls.
5. Update `workspace/current.md` Evidence / Dev Handoff and create the expected Dev handoff file.

## Guardrails And Non-Goals

- Read-only preflight/inventory only.
- No storage config writing.
- No DB movement, copy, migration, relocation, or deletion.
- No lockout enforcement.
- No pruning.
- No snapshot creation unless an existing verifier already uses disposable fixture paths and does not change real runtime state.
- No live/private/API/provider calls.
- No schema migration.
- No broad storage manifest format unless required for read-only reporting and approved by Overseer.
- No renderer redesign.
- No Electron hidden-path behavior change yet.
- No change to provider behavior, Watch behavior, Sequencer behavior, Discovery refs, Evidence/EVEidence writes, hydration, or Assessment Memory.

## Stop Conditions

Stop and return to Overseer/Human if:

- implementation needs to choose the final storage config filename/location
- implementation would enforce app lockout or write/provider/acquisition lockout
- implementation would move, create, copy, or delete a real active DB
- implementation requires schema migration
- implementation requires live/provider access
- implementation turns into storage migration tooling
- implementation needs broad UI work
- storage path state cannot be classified without changing startup behavior

## Required Verification

Run the focused non-live proof set:

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

If Electron startup or renderer readiness is touched, also run:

```powershell
npm.cmd run verify:electron-runtime
npm.cmd run verify:renderer-shell
npm.cmd run smoke:electron
```

## Evidence Expected

Dev handoff should include:

- files changed
- service/report command added or extended
- sample preflight output
- path modes demonstrated
- byte usage fields demonstrated
- confirmation that no storage config was written
- confirmation that no DB move/copy/delete/relocation occurred
- confirmation that no lockout, pruning, live/API/provider, schema, renderer redesign, or storage migration behavior was added
- verification commands and results

## Dev Prompt

Role:
Atlas Dev

Start:
`F:\Projects\AURA-Atlas`

Read:
- `AGENTS.md`
- `workspace/current.md`
- `workspace/OverseerHS105-storage-authority-preflight-runway.md`
- `workspace/OverseerHS104-systems-audit-synthesis-review.md`
- `workspace/SystemsAuditHS100-storage-path-budget-authority.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Task:
Implement the HS105 read-only storage authority preflight/inventory proof layer.

Do not implement lockout, storage migration, config writing, pruning, live/provider behavior, schema changes, or renderer redesign.

Produce:
`workspace/DevHS105-storage-authority-preflight.md`
