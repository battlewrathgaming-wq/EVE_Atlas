# DevHS176 Hydration Candidate Preview

Status: complete
Executor: Dev
Date: 2026-06-01

## Scope

Implemented a read-only Hydration candidate preview that derives deduped readability demand from local records before any queue, provider call, schema change, or Hydration write.

This preview keeps Hydration separate from ESI Evidence Expansion. IDs remain facts; labels remain readability.

## Files Changed

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

## Command Added

```txt
metadata.hydration_candidates.preview
```

Command shape:

- classification: `read-only`
- effects: `read-only`
- renderer eligible: yes
- provider calls: 0
- Hydration writes: 0
- persisted queue: false
- schema changes: false

The command is also covered in the enforcement classification map as `covered_read_only`.

## Candidate Shape

Candidates are built from local records:

- `activity_events`
- `entities`
- `metadata_runs`
- `watchlist_entities`
- `assessment_artifacts`
- local SDE lookup tables such as `type_metadata` and `solar_systems`

Deduping:

- provider-backed entity labels use `entity:<entity_type>:<entity_id>`
- local SDE gaps use `local_sde:<lookup_type>:<lookup_id>`

Lanes:

- `view_local_record`
- `target_report_scoped`
- `watch_background`
- `corpus_hygiene_low_priority`

Each candidate exposes:

- `dedupe_key`
- entity or local lookup type/ID
- label state
- source anchors
- appearance and killmail counts
- lane membership
- priority rationale
- provider-needed boolean
- Hydration boundary
- Evidence/EVEidence boundary

## Sample Output Summary

Focused verifier sample:

```json
{
  "total_candidates": 4,
  "unique_dedupe_keys": 4,
  "provider_needed_candidates": 3,
  "local_sde_gap_candidates": 1,
  "known_or_stale_local_label_candidates": 1,
  "lane_counts": {
    "view_local_record": 4,
    "target_report_scoped": 2,
    "watch_background": 2,
    "corpus_hygiene_low_priority": 4
  },
  "view_local_record_first": true,
  "watch_background_starves_view_local_record": false,
  "labels_are_readability": true,
  "ids_are_facts": true,
  "provider_needed_labels_are_evidence_work": false,
  "persisted_queue": false,
  "provider_calls": 0,
  "hydration_writes": 0
}
```

Representative candidates:

- `entity:character:90000003`: report/interest-scoped provider-needed label, deduped across two local killmails.
- `entity:character:90000004`: Watch/background provider-needed label, separate from selected/report-scoped lane membership.
- `local_sde:inventory_type:999999`: local SDE lookup gap, not ESI provider-needed entity Hydration.

## Boundary Confirmation

- No schema migration was added.
- No persisted `hydration_candidates` table was added.
- No provider, zKill, ESI, or SDE download calls were added.
- No Hydration writes were added.
- No `metadata_runs`, `entities`, or `activity_events` label writes were added.
- No Evidence/EVEidence writes were added.
- No Discovery ref mutation was added.
- No Watch mutation was added.
- No runtime enforcement activation or command blocking was added.
- No support artifact, snapshot, or trace-pack creation was added.
- No renderer redesign or UI wording work was added.
- Candidate eligibility is not authorization.
- External I/O on is not authorization.
- Local SDE gaps are not treated as live ESI Hydration.

## Verification

Passed:

- `node --check src\main\services\serviceRegistry.js`
- `node --check src\main\services\hydrationBacklogPreviewService.js`
- `node --check src\main\services\hydrationExecutionPolicyPreviewService.js`
- `node --check src\main\services\hydrationCandidatePreviewService.js`
- `node --check scripts\verify-hydration-backlog-preview.js`
- `node --check scripts\verify-hydration-execution-policy.js`
- `node --check scripts\verify-hydration-candidate-preview.js`
- `node --check scripts\verify-service-registry.js`
- `node --check scripts\verify-passive-side-effects.js`
- `node --check scripts\verify-command-authority.js`
- `npm.cmd run verify:hydration-backlog-preview`
- `npm.cmd run verify:hydration-execution-policy`
- `npm.cmd run verify:hydration-candidate-preview`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:protected-terms`
- `npm.cmd run verify:command-authority`
- `npm.cmd run verify:enforcement-dry-run`
- `git diff --check`
- `git status --short --branch`

Notes:

- `verify:protected-terms` passed with advisory warning-only output.
- `verify:enforcement-dry-run` reports coverage complete for 66 commands.
- `git diff --check` passed with Git CRLF-normalization warnings.

## Risks / Follow-Up

- This is a read-only candidate shape proof, not durable scheduling or retry state.
- Candidate ordering is useful for preview, but future persisted Hydration queue policy still needs its own runway before storing movement state.
