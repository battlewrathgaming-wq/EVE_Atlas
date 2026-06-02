# Overseer HS220 - Local SDE Source / Import Posture Runway

Status: active Dev runway
Date: 2026-06-03
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS220-local-sde-source-import-posture.md`

## Purpose

Make Atlas' local SDE source/import posture inspectable before any SDE download, import, lookup-table rewrite, or runtime enforcement exists.

Accepted product insight:

HS218 proved that local SDE gaps are not provider-backed Hydration. Atlas already has `metadata.local_sde_readiness.preview` for local lookup readiness. The remaining hardening seam is the source/import boundary: when Atlas later needs static type/geography lookup material, the operator should be able to distinguish local source import/rewrite from provider-backed SDE download/build, and Atlas should disclose the storage/External I/O posture before moving bytes or rewriting lookup tables.

This packet should make that posture explicit as read-only proof.

## Read First

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/OverseerHS219-hs218-hydration-attention-runtime-posture-review.md`
- `src/main/services/localSdeReadinessPreviewService.js`
- `src/main/services/composedGatePolicyService.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/services/serviceRegistry.js`
- SDE import/build commands and verifiers, especially existing fixture-only checks

## Task

Add or refine a read-only preview that explains SDE source/import posture without executing it.

Preferred command:

```txt
metadata.local_sde_source_posture.preview
```

Acceptable alternative:

Extend `metadata.local_sde_readiness.preview` with a clearly separated `source_import_posture` section if that avoids duplicate command shape.

The proof should answer:

- whether local SDE lookup readiness is currently complete, partial, or missing
- whether missing material is inventory/type lookup, topology/geography lookup, import provenance, or mixed
- whether the future action would be local source import/rewrite or provider-backed SDE download/build
- which posture requires External I/O and which does not
- whether storage authority/budget would block future lookup-table rewrite without blocking this readout
- whether a supplied/observed source path is local, absent, unsupported, or not inspected
- whether SDE source/cache material is support/corpus-adjacent and should stay under storage authority
- why SDE readiness does not authorize provider calls, imports, downloads, or lookup rewrites

## Required Behavior

The readout should include:

- source posture summary
- existing readiness summary from `metadata.local_sde_readiness.preview` or equivalent
- command-family posture for:
  - `sde.import.topology`
  - `sde.import.inventory`
  - `sde.build-lookups`
- local import/rewrite versus download/build distinction
- External I/O relevance for each command family
- storage/budget posture for future lookup writes
- representative missing table/provenance groups from local readiness
- explicit boundary statements that local SDE readiness is local lookup/readability, not Evidence/EVEidence and not ESI Hydration
- explicit disclosure where source path authority cannot be computed without future operator input

Keep the proof local, deterministic, and small. Reuse existing readiness, composed-gate, dry-run, and storage previews where possible.

## Boundaries And Non-Goals

- Do not download SDE.
- Do not import SDE.
- Do not rewrite lookup tables.
- Do not inspect arbitrary user files.
- Do not move storage.
- Do not write config.
- Do not create support artifacts.
- Do not call ESI, zKill, SDE download endpoints, or any provider.
- Do not write Hydration labels.
- Do not write `metadata_runs`.
- Do not create Evidence/EVEidence.
- Do not mutate Discovery refs.
- Do not mutate Watch state.
- Do not mutate Assessment Memory or Marked state.
- Do not change schema.
- Do not activate runtime enforcement.
- Do not add command blocking.
- Do not change renderer UI.
- Do not implement SDE import/download controls.
- Do not implement pruning or deletion behavior.

## Stop Conditions

Stop and return to Overseer if:

- the proof requires downloading or importing SDE
- the proof requires lookup-table writes
- the proof requires arbitrary path inspection outside existing safe preview posture
- the implementation blurs local SDE lookup readiness with provider-backed Hydration
- the implementation treats readiness as authorization
- the implementation treats External I/O on as authorization
- the implementation requires runtime enforcement, command blocking, UI work, schema changes, destructive/private/live action, or real operator data inspection

## Verification Expectations

Run syntax checks on every changed JavaScript file.

Expected focused verification:

```powershell
npm.cmd run verify:local-sde-readiness-preview
npm.cmd run verify:hydration-attention-runtime
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new verifier is added, include it in `package.json` and run it.

## Expected Handoff

Create:

```txt
workspace/DevHS220-local-sde-source-import-posture.md
```

Include:

- files changed
- command or preview surface used
- sample output summary
- local import/rewrite versus download/build distinction
- External I/O and storage posture summary
- any source-path authority that cannot currently be computed
- warning count from protected-term check
- verification commands and results
- confirmation that no SDE download/import, lookup-table rewrite, provider call, config write, storage move, support artifact, Hydration write, Evidence/EVEidence creation, Discovery mutation, Watch mutation, Assessment Memory or Marked mutation, schema change, runtime enforcement, command blocking, UI work, pruning, or deletion behavior was added
