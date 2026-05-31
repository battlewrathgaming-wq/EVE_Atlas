# DevHS144 - Hydration Backlog Preview

Status: complete
Date: 2026-05-31
Role: Dev

## Summary

Added a read-only Hydration backlog preview that helps Atlas understand missing readability labels from local records without provider calls, hydration writes, queues, schema changes, or UI work.

The preview separates local Evidence/EVEidence facts from readability metadata, distinguishes known local labels from provider-needed labels, identifies local SDE lookup gaps separately, groups representative candidates into likely hydration lanes, and shows future External I/O posture for provider-backed hydration.

## Files Changed

- `src/main/services/hydrationBacklogPreviewService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-hydration-backlog-preview.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-passive-side-effects.js`
- `package.json`
- `workspace/current.md`
- `workspace/DevHS144-hydration-backlog-preview.md`

## Readout Command Added

```text
metadata.hydration_backlog.preview
```

Command posture:

- classification: `read-only`
- effects: `read-only`
- renderer eligible: `true`
- provider calls: `0`
- hydration writes: `0`
- persisted backlog: `false`
- schema changes: `false`

The command is also covered in the enforcement dry-run classification map as `local_db_inspection`.

## Sample Preview Output

From `npm.cmd run verify:hydration-backlog-preview`:

```json
{
  "summary": {
    "evidence_records_scanned_basis": "local activity_events and lookup/cache tables",
    "entity_label_candidates": 3,
    "local_known_label_candidates": 1,
    "provider_needed_entity_label_candidates": 2,
    "local_sde_gap_candidates": 1,
    "missing_labels_are_report_failure": false,
    "hydration_creates_evidence": false,
    "discovery_refs_used_as_evidence": false
  },
  "external_io": {
    "requested_readout_state": "off",
    "provider_backed_hydration_posture": "held_by_external_io",
    "held_is_failure": false
  }
}
```

Representative provider-needed label:

```json
{
  "entity_type": "character",
  "entity_id": 90000003,
  "label_state": "provider_needed",
  "provider_needed": true,
  "freshness": "never_enriched_or_unknown",
  "discovery_routes": ["actor"],
  "lane_hints": [
    "view_local_record",
    "watch_background",
    "target_or_report_scoped",
    "corpus_hygiene_low_priority"
  ],
  "evidence_basis": "activity_events local Evidence/EVEidence-derived rows",
  "hydration_boundary": "readability metadata only; numeric IDs remain facts"
}
```

Representative known local label:

```json
{
  "entity_type": "corporation",
  "entity_id": 98000002,
  "label_state": "known_local_label",
  "local_label": "Known Local Corp",
  "provider_needed": false,
  "freshness": "stale_over_30_days"
}
```

Representative local SDE gap:

```json
{
  "lookup_type": "inventory_type",
  "id": 999999,
  "label_state": "local_sde_gap",
  "provider_needed": false,
  "recommended_source": "local SDE inventory/type metadata"
}
```

## Lane Behavior

The preview groups candidates into:

- `view_local_record`: point-of-need readability from inspected local records.
- `watch_background`: Watch-originated local records that may create patient readability backlog.
- `target_report_scoped`: Marked/assessment or repeated report-relevant IDs.
- `corpus_hygiene_low_priority`: broad low-priority readability cleanup and local SDE gaps.

Each lane reports counts, capped representatives, `waiting_is_failure: false`, and `persisted_queue: false`.

## Boundary Confirmation

Confirmed:

- no ESI calls
- no zKill calls
- no SDE download/import
- no provider/API calls
- no hydration writes
- no `entities` writes
- no `metadata_runs` writes
- no `activity_events` label patches
- no Evidence/EVEidence writes
- no Discovery ref mutation
- no queue or persisted backlog
- no schema changes
- no renderer/UI work
- missing labels are not report failure

## Verification

Passed:

```powershell
node --check src\main\services\hydrationBacklogPreviewService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-hydration-backlog-preview.js
npm.cmd run verify:hydration-backlog-preview
npm.cmd run verify:hydration
npm.cmd run verify:metadata-status
npm.cmd run verify:metadata-lookup
npm.cmd run verify:actor-metadata
npm.cmd run verify:corporation-metadata
npm.cmd run verify:gate-stack-readout
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
```

`verify:protected-terms` completed with warning-only discovery output and exit code 0.

Final checks still to run after this handoff write:

```powershell
git diff --check
git status --short --branch
```
