# Overseer HS200 - Local SDE Readiness Gap Lens Runway

Status: active Dev runway
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening
Executor: Dev
Expected handoff: `workspace/DevHS200-local-sde-readiness-gap-lens.md`

## Purpose

Add a read-only local SDE readiness gap lens so Atlas can distinguish static local lookup gaps from ESI Hydration work.

HS198 proved that local SDE gaps can appear inside Hydration attention, but those gaps should not become provider-needed entity Hydration. This packet should make the local SDE side inspectable on its own.

Accepted principle:

```text
SDE lookup readiness repairs static local labels and geometry; ESI Hydration repairs entity readability labels.
```

## Read First

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/features/data-layer-boundaries.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/OverseerHS177-hs176-hydration-candidate-preview-review.md`
- `workspace/OverseerHS199-hs198-hydration-attention-lens-review.md`
- `src/main/services/hydrationCandidatePreviewService.js`
- `src/main/services/appReadinessService.js`
- `src/main/sde/sdeLookupBuilder.js`
- `scripts/verify-metadata-lookup.js`
- `scripts/verify-sde-build-lookups.js`
- relevant service registry, command authority, passive-side-effect, and enforcement dry-run verifiers

## Task

Add a read-only preview surface for local SDE lookup readiness gaps.

Preferred command:

```txt
metadata.local_sde_readiness.preview
```

The proof should answer:

- whether local topology lookup appears ready
- whether local inventory/type lookup appears ready
- which local lookup tables are empty or missing coverage
- which currently stored Evidence/EVEidence-derived rows expose local type/system lookup gaps
- which gaps are inventory/type gaps versus topology/geography gaps
- whether the gap belongs to local import/readiness, not ESI Hydration
- whether SDE source/import material is needed later, without downloading or importing anything now

## Required Behavior

The readout should include:

- table/count posture for at least:
  - `type_metadata`
  - `solar_systems`
  - `regions`
  - `constellations`
  - `system_adjacency`
  - SDE import provenance tables where present
- representative local lookup gaps from `activity_events`, such as:
  - missing `ship_type_name` / type metadata for `ship_type_id`
  - missing `weapon_type_id` type metadata where available
  - missing `solar_system_name` / system lookup for `solar_system_id`
- gap groups:
  - `inventory_type_lookup_gap`
  - `topology_lookup_gap`
  - `import_provenance_gap`
- boundary statements:
  - local SDE gaps are not ESI provider-needed Hydration
  - local SDE gaps do not create or invalidate Evidence/EVEidence
  - missing static labels should degrade display/readiness, not trigger live ESI label work
  - no SDE download/import is performed by this preview

Keep the proof deterministic and local. It may use fixture/in-memory databases.

## Boundaries And Non-Goals

- Do not download SDE.
- Do not import SDE.
- Do not call ESI, zKill, SDE download, or any provider.
- Do not write lookup tables.
- Do not write Hydration labels.
- Do not write `metadata_runs`.
- Do not write `entities`.
- Do not patch `activity_events`.
- Do not create Evidence/EVEidence.
- Do not mutate Discovery refs.
- Do not mutate Watch, Assessment Memory, or Marked state.
- Do not change schema.
- Do not create support artifacts, snapshots, trace packs, logs, files, exports, packages, or directories.
- Do not activate runtime enforcement.
- Do not add command blocking.
- Do not change renderer UI.
- Do not implement SDE import/download controls.
- Do not merge local SDE readiness with ESI Hydration execution.

## Stop Conditions

Stop and return to Overseer if:

- proving readiness requires SDE import or download
- proving readiness requires provider calls
- proving readiness requires schema changes or lookup writes
- the implementation treats SDE gaps as ESI Hydration candidates
- the implementation treats missing static labels as missing Evidence/EVEidence
- implementation requires UI work, runtime enforcement, command blocking, destructive/private/live action, or real operator data inspection

## Verification Expectations

Run syntax checks on every changed JavaScript file.

Expected focused verification:

```powershell
npm.cmd run verify:metadata-lookup
npm.cmd run verify:sde-build-lookups
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-attention-lens
npm.cmd run verify:app-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new verifier is added, include it in `package.json` and run it.

## Expected Handoff

Create:

```txt
workspace/DevHS200-local-sde-readiness-gap-lens.md
```

Include:

- files changed
- command or preview surface used
- sample output summary
- table/count readiness posture
- representative inventory/type and topology/geography gaps
- how local SDE gaps are separated from ESI Hydration
- warning count from protected-term check
- verification commands and results
- confirmation that no SDE download/import, provider calls, lookup writes, Hydration writes, persisted queue, schema changes, support artifacts, runtime enforcement, command blocking, UI work, Evidence/EVEidence, Discovery, Watch, Assessment Memory, Marked, pruning, or deletion behavior was added
