# AURA Atlas Current Work

Status: Resting after HS177 accepted HS176 Hydration candidate preview
Last updated: 2026-06-01

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: preserve the accepted Hydration candidate preview and choose the next storage/runtime seam deliberately.

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- data-layer boundaries guide the seam before machinery

## Executor

Current executor: Human / Overseer shaping

Expected handoff filename:

```txt
none
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
- `metadata.hydration_candidates.preview` now previews deduped local Hydration candidate demand by lane and basis.
- `metadata.hydration_write_fixture_proof` proves fixture-only local readability writes from existing entities.

HS176 added candidate-shape clarity, not provider movement.

## Current State

HS176 is accepted.

Accepted facts:

- `metadata.hydration_candidates.preview` is read-only and renderer-eligible.
- It derives candidates only from local records.
- It dedupes provider-backed entity label demand by stable entity key.
- It dedupes local SDE gaps separately.
- It exposes lane membership, source anchors, priority rationale, and boundary statements.
- It keeps view/local-record demand ahead of Watch/background demand.
- It treats External I/O off as held posture, not failure.
- It does not persist a queue, call providers, write Hydration output, mutate Evidence/EVEidence, mutate Discovery refs, mutate Watch rows, create support artifacts, or change schema.

Review note:

`appearance_count` can include multiple label bases from one event. Use it as a readability-demand signal, not as a Human-facing killmail count. Prefer `killmail_count` for story/readout meaning unless a future runway defines otherwise.

## Resting State

No implementation packet is open.

Likely next shaping candidates:

1. Decide whether Hydration candidate preview is enough to pause Hydration queue design for now.
2. Consider patient provider packet preview only if movement-control pressure becomes the next chosen seam.
3. Consider support artifact creation hardening only after confirming what artifact contents must preserve.
4. Keep runtime enforcement resting until a stronger need for active blocking appears.

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

HS176 implemented by Dev.

Files changed:

- `src/main/services/hydrationCandidatePreviewService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-candidate-preview.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS176-hydration-candidate-preview.md`
- `workspace/OverseerHS177-hs176-hydration-candidate-preview-review.md`

Command added:

- `metadata.hydration_candidates.preview`

Sample output summary:

- total candidates: 4
- unique dedupe keys: 4
- provider-needed candidates: 3
- local SDE gap candidates: 1
- known/stale local label candidates: 1

Candidate lane counts:

- `view_local_record`: 4
- `target_report_scoped`: 2
- `watch_background`: 2
- `corpus_hygiene_low_priority`: 4

Representative candidates:

- `entity:character:90000003`: report/interest-scoped provider-needed label, deduped across two local killmails.
- `entity:character:90000004`: Watch/background provider-needed label, separate from selected/report-scoped membership.
- `local_sde:inventory_type:999999`: local SDE lookup gap, not ESI provider-needed entity Hydration.

Boundary proof:

- provider calls: 0
- Hydration writes: 0
- metadata run writes: 0
- entity writes: 0
- activity event label patches: 0
- Evidence/EVEidence writes: 0
- Discovery ref mutations: 0
- Watch mutations: 0
- support artifacts created: 0
- persisted queue: false
- schema changes: false

Verification evidence:

- `node --check src\main\services\serviceRegistry.js` passed.
- `node --check src\main\services\hydrationBacklogPreviewService.js` passed.
- `node --check src\main\services\hydrationExecutionPolicyPreviewService.js` passed.
- `node --check src\main\services\hydrationCandidatePreviewService.js` passed.
- `node --check scripts\verify-hydration-backlog-preview.js` passed.
- `node --check scripts\verify-hydration-execution-policy.js` passed.
- `node --check scripts\verify-hydration-candidate-preview.js` passed.
- `node --check scripts\verify-service-registry.js` passed.
- `node --check scripts\verify-passive-side-effects.js` passed.
- `node --check scripts\verify-command-authority.js` passed.
- `npm.cmd run verify:hydration-backlog-preview` passed.
- `npm.cmd run verify:hydration-execution-policy` passed.
- `npm.cmd run verify:hydration-candidate-preview` passed.
- `npm.cmd run verify:service-registry` passed.
- `npm.cmd run verify:passive-side-effects` passed.
- `npm.cmd run verify:protected-terms` passed with advisory warning-only output.
- `npm.cmd run verify:command-authority` passed.
- `npm.cmd run verify:enforcement-dry-run` passed and reports coverage complete for 66 commands.
- `git diff --check` passed with Git CRLF-normalization warnings.
- `git status --short --branch` completed.

## Dev Handoff

Expected file:

```txt
workspace/DevHS176-hydration-candidate-preview.md
```

Created:

```txt
workspace/DevHS176-hydration-candidate-preview.md
```

Candidate preview status: accepted.
