# DevHS236: Pruning Intelligence Preview

Date: 2026-06-03
Role: Atlas Dev
Milestone: Atlas Storage And Runtime Hardening
Runway: `workspace/OverseerHS236-pruning-intelligence-preview-runway.md`

## Summary

Implemented HS236 as a read-only extension to the existing `retention.preflight` path for `evidence.prune_scope`.

The existing top-level impact counts remain available. A new nested `impact.relationship_context` block now reports operator-review context for future pruning without adding deletion execution, command blocking, schema, UI, provider calls, support artifact inspection, or any row mutation.

## Files Changed

- `src/main/services/retentionActionService.js`
- `scripts/verify-retention-preflight.js`
- `workspace/current.md`
- `workspace/DevHS236-pruning-intelligence-preview.md`

## Service Shape Added

`retention.preflight` for `evidence.prune_scope` now includes:

- `relationship_context.preview_only`
- `relationship_context.read_only`
- `relationship_context.basis`
- `relationship_context.evidence_rows`
- `relationship_context.audit_warning_rows`
- `relationship_context.discovery_refs`
- `relationship_context.assessment_memory`
- `relationship_context.watch_marked_context`
- `relationship_context.provenance_logs`
- `relationship_context.support_artifact_disclosure`
- `relationship_context.no_footprint_policy`
- `relationship_context.context_warnings`

The relationship basis explicitly states that computed relationships are not durable truth, Discovery refs are not Evidence/EVEidence, and the preview does not authorize deletion.

## Sample Fixture Output Shape

The focused verifier now proves a selected killmail preview with this representative posture:

```json
{
  "impact": {
    "killmails": 1,
    "activity_events": "> 0",
    "ingestion_audits": 1,
    "data_quality_warnings": 1,
    "assessment_artifact_references": 1,
    "relationship_context": {
      "preview_only": true,
      "read_only": true,
      "basis": {
        "scope_kind": "selected_killmails",
        "computed_relationships_are_durable_truth": false,
        "discovery_refs_are_evidence": false
      },
      "discovery_refs": {
        "count": 1,
        "statuses": ["cached"],
        "interpretation": "possible leads/provenance, not Evidence/EVEidence"
      },
      "assessment_memory": {
        "count": 1,
        "deletion_blocker": false
      },
      "support_artifact_disclosure": {
        "active_record_prune_would_clean_support_artifacts": false,
        "historical_recovery_material_may_retain_records": true
      },
      "no_footprint_policy": {
        "no_retained_deletion_footprint": true,
        "retained_footprint_created_by_preview": false
      }
    }
  }
}
```

## Verification Coverage Added

`scripts/verify-retention-preflight.js` now seeds and asserts:

- selected Evidence/EVEidence row impact
- derived `activity_events`
- ingestion audit rows
- data quality warnings
- same-killmail Discovery refs with status separation
- affected Assessment Memory references and stale-risk/non-blocker posture
- Watch/Marked-adjacent actor and direct system Watch rows where determinable
- fetch run and API request provenance summaries
- support artifact disclosure that active-record pruning would not clean historical/recovery material
- no retained deletion footprint created by preview
- selected killmail and actor/time-window preflight shape
- broader table immutability across Evidence, Discovery refs, provenance/logs, warnings, Watch-adjacent rows, and Assessment rows

## Boundaries Preserved

- no destructive pruning execution
- no new delete/prune/expire command
- no Evidence/EVEidence mutation
- no Discovery ref mutation
- no Assessment Memory creation, mutation, deletion, or stale marking
- no Watch or Marked mutation
- no provider calls
- no Hydration writes
- no support artifact creation, deletion, cleanup, or real artifact inspection
- no storage movement
- no schema changes
- no runtime enforcement activation
- no command blocking
- no renderer UI work
- no retained deletion footprint

## Verification Results

Passed:

- `node --check src\main\services\retentionActionService.js`
- `node --check scripts\verify-retention-preflight.js`
- `npm.cmd run verify:retention-preflight`
- `npm.cmd run verify:retention-deletion-boundary`
- `npm.cmd run verify:assessment-artifacts`
- `npm.cmd run verify:queue-report`
- `npm.cmd run verify:db-integrity`
- `npm.cmd run verify:evidence-rules`
- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:passive-side-effects`
- `npm.cmd run verify:protected-terms`
- `git diff --check`
- `git status --short --branch`

Notes:

- `verify:protected-terms` produced warning-only advisory output; no protected-term JSON or terminology authority files were changed.
- `git diff --check` passed with CRLF normalization warnings only.

## Risks / Parked

- This is relationship/context preview only. Actual destructive pruning still needs a separate bounded design and execution runway.
- Discovery ref pruning policy remains separate and unopened.
- Support artifact cleanup, snapshot deletion, provenance rewrite/redaction/recompute, and automatic Assessment Memory stale marking remain unopened.
- Watch/Marked context is intentionally limited to determinable adjacent rows and does not define first-class no-interest pruning policy.

## Recommended Next Action

Overseer should review HS236 for acceptance, especially the `relationship_context` emitted shape, then either rest pruning or open a separate design packet for deletion execution prerequisites before any destructive work is considered.
