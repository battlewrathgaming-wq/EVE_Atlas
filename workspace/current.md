# AURA Atlas Current Work

Status: HS176 Hydration candidate preview runway open
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: prove the shape of deduped Hydration candidates from local records before any persisted queue, provider call, schema change, or Hydration write.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- data-layer boundaries guide the seam before machinery

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS176-hydration-candidate-preview.md
```

## Source Of Intent

Human / Overseer direction:

- choose Hydration candidate preview before patient provider packets because it is the more solvable seam
- use the accepted data-layer boundary note as the spine
- keep Dev work read-only and local
- do not create schema-backed queues yet
- do not let Hydration blur into ESI Evidence Expansion
- do not let one ID become many provider obligations just because many reports need it

Accepted source material:

- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `workspace/DataAnalystHS151-data-intent-supporting-schemas.md`
- `workspace/DataAnalystHS152-current-gaps-and-milestone-slices.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `src/main/services/hydrationBacklogPreviewService.js`
- `src/main/services/hydrationExecutionPolicyPreviewService.js`
- `scripts/verify-hydration-backlog-preview.js`
- `scripts/verify-hydration-execution-policy.js`

Accepted data-layer boundaries:

- Discovery Ref is a stored possible lead/provenance form, not Evidence/EVEidence.
- ESI Evidence Expansion creates Evidence/EVEidence from a Discovery Ref and the ESI killmail endpoint.
- Hydration repairs readability after local facts exist; it is not ESI Evidence Expansion.
- IDs are facts; labels are readability.
- Watch is operational acquisition intent.
- Observation computes/collates local records into an operator-facing story.
- Relationships group appearances, Evidence anchors, or Watch-derived context only when backed by disclosed basis.

Relevant existing proof surfaces:

- `metadata.hydration_backlog.preview` already previews local Hydration backlog shape.
- `metadata.hydration_execution_policy.preview` already previews future Hydration execution posture.
- `metadata.hydration_write_fixture_proof` proves fixture-only local readability writes from existing entities.

HS176 should add candidate-shape clarity, not provider movement.

## Ordered Runway

1. Inspect the existing Hydration backlog and execution policy preview services and their verifiers.
2. Add a read-only Hydration candidate preview, preferably as a new service command named:

```txt
metadata.hydration_candidates.preview
```

3. Build candidates only from local records, especially `activity_events`, `entities`, `metadata_runs`, and local SDE lookup tables.
4. Deduplicate candidate demand by stable key, such as `entity_type:entity_id` for provider-backed entity labels and separate local-SDE lookup keys for local lookup gaps.
5. Group candidates into lanes:

- `view_local_record`
- `watch_background`
- `target_report_scoped`
- `corpus_hygiene_low_priority`

6. For each representative candidate, expose at least:

- `dedupe_key`
- entity or lookup type and ID
- label state such as `known_local_label`, `provider_needed`, `stale_local_label`, or `local_sde_gap`
- source anchors / source basis, such as killmail IDs, report target, Watch-derived route, Marked/Assessment presence, or local lookup table
- appearance / killmail counts where available
- priority rationale
- provider-needed boolean
- Hydration boundary statement
- Evidence/EVEidence boundary statement

7. Add focused verification that proves:

- one ID appears once per dedupe key even when many local rows or reports need it
- selected/report-visible candidates are represented separately from Watch/background candidates
- Watch/background candidates do not starve view/local-record candidates in the preview order
- local SDE gaps are not treated as ESI provider-needed entity Hydration
- labels remain readability and IDs remain facts
- provider-needed Hydration candidates are not Evidence/EVEidence work
- External I/O off is held posture, not failure
- no queue, schema, provider call, Hydration write, metadata run, Evidence write, Discovery mutation, or support artifact is created

## Guardrails And Non-Goals

- No schema migration.
- No persisted `hydration_candidates` table.
- No provider calls.
- No zKill calls.
- No ESI calls.
- No SDE download calls.
- No Hydration writes.
- No `metadata_runs` writes.
- No `entities` writes.
- No `activity_events` label patches.
- No Evidence/EVEidence writes.
- No Discovery ref mutation.
- No Watch mutation.
- No runtime enforcement activation.
- No command blocking.
- No support artifact creation.
- No snapshot or trace-pack creation.
- No renderer redesign or UI wording work.
- Do not treat candidate eligibility as authorization.
- Do not treat External I/O on as authorization.
- Do not call ESI Evidence Expansion Hydration.
- Do not rename existing commands, schemas, IPC names, payload fields, or Atlas-owned terms.

## Stop Conditions

Stop and return to Overseer if:

- implementation requires schema changes
- implementation wants to persist a Hydration queue
- provider calls become necessary
- a candidate cannot disclose local basis/source anchors
- Hydration begins to imply Evidence/EVEidence creation
- local SDE gaps are being treated as live ESI Hydration
- Watch/background work would hide or starve view/local-record needs
- existing Hydration backlog/execution policy surfaces need broad refactor
- current command names or payload contracts would need renaming

## Required Verification

Run exact commands when known:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\hydrationBacklogPreviewService.js
node --check src\main\services\hydrationExecutionPolicyPreviewService.js
node --check scripts\verify-hydration-backlog-preview.js
node --check scripts\verify-hydration-execution-policy.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If Dev adds a new script, also run:

```powershell
node --check scripts\verify-hydration-candidate-preview.js
npm.cmd run verify:hydration-candidate-preview
```

If Dev adds a new service file, also run:

```powershell
node --check src\main\services\hydrationCandidatePreviewService.js
```

## Evidence

Dev should update this section in the handoff with:

- files changed
- command added, if any
- sample output summary
- candidate lane counts
- representative candidate examples
- proof that no writes/provider calls/schema changes occurred
- verification commands and results
- any noisy protected-term warnings

## Dev Handoff

Expected file:

```txt
workspace/DevHS176-hydration-candidate-preview.md
```

The handoff must state whether the candidate preview is complete, incomplete, or blocked.
