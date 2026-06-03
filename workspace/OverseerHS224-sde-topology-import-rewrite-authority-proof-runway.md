# Overseer HS224 - SDE Topology Import / Rewrite Authority Proof Runway

Status: active Dev runway
Date: 2026-06-03
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS224-sde-topology-import-rewrite-authority-proof.md`

## Purpose

Add a fixture/offline proof for SDE topology import/rewrite authority before any real operator lookup-table mutation is opened.

Accepted HS222 direction:

Atlas is not ready for real operator SDE import/rewrite and is not ready for provider-backed SDE download/build. The next safe step is a dry/fixture-controlled authority and recovery proof, topology first.

This packet should prove the decision and recovery shape without mutating real operator lookup tables.

## Read First

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/OverseerHS222-sde-import-download-readiness-advisory-request.md`
- `workspace/EngineeringSecurityHS222-sde-import-download-readiness-advisory.md`
- `workspace/OverseerHS223-hs222-sde-import-download-readiness-review.md`
- `workspace/OverseerHS220-local-sde-source-import-posture-runway.md`
- `workspace/OverseerHS221-hs220-local-sde-source-import-posture-review.md`
- `docs/features/data-layer-boundaries.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/localSdeSourcePostureService.js`
- `src/main/services/localSdeReadinessPreviewService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/sde/`
- `scripts/verify-sde-fixture.js`
- `scripts/verify-sde-build-lookups.js`
- `scripts/verify-system-radius-planner.js`

## Task

Add a fixture/offline proof for topology import/rewrite authority and recovery.

Preferred command:

```txt
sde.topology_import_rewrite_authority.proof
```

Acceptable alternative:

Add a focused verifier/service helper without renderer command exposure if the existing service architecture makes a command inappropriate. If no command is added, the verifier must still prove the same authority and recovery shape.

The proof should answer:

- whether renderer source paths are ignored
- whether trusted local source authority shape is explicit
- whether remote source references are rejected for local topology import
- whether missing/invalid/degraded storage blocks future topology rewrite
- whether unconfigured or hard-lock budget blocks future topology rewrite
- whether projected temp/cache/DB growth is represented
- whether topology staged/fixture writes can fail without corrupting visible ready topology lookups
- whether provenance is written only after complete promotion
- whether partial temp/staged material cleanup is represented
- whether retry/rerun posture is explicit and not automatic

## Required Behavior

The proof should use fixture/offline data only.

It may create and mutate fixture/test databases under controlled temp/project-local fixture roots. It must not mutate the operator DB or inspect a real operator source path.

Required cases:

- renderer supplied source path is non-authoritative
- trusted local source path is accepted only by explicit trusted/test authority
- remote URL is rejected for local topology import
- no source path blocks topology import rewrite
- storage missing/unavailable blocks rewrite
- unconfigured budget blocks rewrite
- budget hard lock blocks rewrite
- successful fixture topology rewrite writes topology provenance only after complete success
- failed fixture rewrite preserves previous visible topology lookup readiness
- failed fixture rewrite does not leave partial promoted topology tables as ready
- cleanup/retry posture is represented

## Boundaries And Non-Goals

- Do not download SDE.
- Do not run provider-backed `sde.build-lookups`.
- Do not inspect real operator source paths.
- Do not mutate real operator lookup tables.
- Do not move storage.
- Do not write real operator config.
- Do not create support artifacts.
- Do not call ESI, zKill, SDE download endpoints, or any provider.
- Do not write Hydration labels.
- Do not write Evidence/EVEidence.
- Do not mutate Discovery refs.
- Do not mutate Watch state.
- Do not mutate Assessment Memory or Marked state.
- Do not change renderer UI.
- Do not implement pruning/deletion behavior.
- Do not open inventory import or combined topology+inventory behavior.
- Do not open provider-backed download/build behavior.
- Do not activate runtime enforcement or command blocking.
- Do not change schema unless the proof cannot be meaningful without it; if so, stop and return to Overseer before editing.

## Stop Conditions

Stop and return to Overseer if:

- proving recovery requires schema changes
- proving recovery requires mutating the real operator DB
- proving source authority requires inspecting real operator source paths
- implementation starts provider-backed SDE download/build
- implementation touches inventory import behavior beyond reading existing code for context
- implementation requires UI work, runtime enforcement, command blocking, support artifact creation, destructive/private/live action, or real operator data inspection

## Verification Expectations

Run syntax checks on every changed JavaScript file.

Expected focused verification:

```powershell
npm.cmd run verify:sde-topology-import-rewrite-authority
npm.cmd run verify:local-sde-source-posture
npm.cmd run verify:local-sde-readiness
npm.cmd run verify:sde-fixture
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new verifier is added, include it in `package.json` and run it.

Do not run real/live SDE download or real local SDE import commands unless the verifier is fixture-only and project-local.

## Expected Handoff

Create:

```txt
workspace/DevHS224-sde-topology-import-rewrite-authority-proof.md
```

Include:

- files changed
- command/helper/verifier surface used
- sample output summary
- authority cases proven
- recovery/failure cases proven
- whether topology and provenance remain coherent after failed fixture rewrite
- warning count from protected-term check
- verification commands and results
- confirmation that no real SDE download/import, real operator lookup-table rewrite, real operator source path inspection, storage movement, config write, support artifact, provider call, Hydration write, Evidence/EVEidence write, Discovery mutation, Watch mutation, Assessment Memory or Marked mutation, UI work, pruning/deletion behavior, runtime enforcement, command blocking, inventory import, or provider-backed download/build behavior was added
