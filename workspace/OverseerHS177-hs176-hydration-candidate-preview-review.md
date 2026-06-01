# OverseerHS177 - HS176 Hydration Candidate Preview Review

Status: accepted
Role: Atlas Overseer
Date: 2026-06-01

## Reviewed

- `workspace/current.md`
- `workspace/DevHS176-hydration-candidate-preview.md`
- `docs/features/data-layer-boundaries.md`
- `src/main/services/hydrationCandidatePreviewService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-candidate-preview.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`

## Acceptance

HS176 is accepted.

`metadata.hydration_candidates.preview` provides a read-only local preview of deduped Hydration candidate demand before any persisted queue, provider call, schema change, or Hydration write.

Accepted facts:

- Candidates are derived from local records.
- Provider-backed entity label demand is deduped by `entity:<entity_type>:<entity_id>`.
- Local SDE lookup gaps are deduped separately as `local_sde:<lookup_type>:<lookup_id>`.
- Candidate lanes are explicit:
  - `view_local_record`
  - `target_report_scoped`
  - `watch_background`
  - `corpus_hygiene_low_priority`
- View/local-record candidates appear before Watch/background lane readout.
- Watch/background candidates are patient background demand and must not starve point-of-need readability.
- Local SDE gaps are not treated as ESI provider-needed entity Hydration.
- Labels remain readability; IDs remain facts.
- Provider-needed labels are Hydration work, not Evidence/EVEidence work and not ESI Evidence Expansion.
- External I/O off is held posture, not failure.

## Boundary Confirmation

No evidence found of:

- schema migration
- persisted `hydration_candidates` table
- provider calls
- zKill calls
- ESI calls
- SDE download calls
- Hydration writes
- `metadata_runs` writes
- `entities` writes
- `activity_events` label patches
- Evidence/EVEidence writes
- Discovery ref mutation
- Watch mutation
- runtime enforcement activation
- command blocking
- support artifact creation
- snapshot or trace-pack creation
- renderer redesign or UI wording work

## Review Note

`appearance_count` can count multiple label bases from the same event, such as `character_label` and `primary_entity_label`.

That is acceptable for this preview as a readability-demand signal, but future Observation/story readouts should prefer `killmail_count` or another explicitly defined basis when the Human-facing meaning is "how many killmails."

No Dev correction is required for HS176.

## Verification Run

Passed:

```powershell
node --check src\main\services\serviceRegistry.js
node --check src\main\services\hydrationBacklogPreviewService.js
node --check src\main\services\hydrationExecutionPolicyPreviewService.js
node --check src\main\services\hydrationCandidatePreviewService.js
node --check scripts\verify-hydration-backlog-preview.js
node --check scripts\verify-hydration-execution-policy.js
node --check scripts\verify-hydration-candidate-preview.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-command-authority.js
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:hydration-execution-policy
npm.cmd run verify:service-registry
npm.cmd run verify:passive-side-effects
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:protected-terms` completed exit code 0 with advisory warnings only. No renames or protected-word JSON updates were performed.

`git diff --check` completed with Git CRLF-normalization warnings only.

## Disposition

Accepted into:

- `workspace/current.md`
- `workspace/overview.md`
- `docs/current-state/current-storage-runtime-hardening.md`

Next likely seam remains Human/Overseer shaping. Do not jump from this preview into a persisted Hydration queue without a fresh runway.
