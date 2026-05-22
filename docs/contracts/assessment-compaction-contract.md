# Contract: Assessment Artifacts And Evidence Compaction

Status: Active
Date: 2026-05-22

## Purpose

Assessment artifacts preserve deliberate human or accepted system assessment after an evidence trail cools.

Evidence compaction is the future workflow that may summarize old scoped evidence into an assessment artifact before any raw evidence pruning is allowed.

This contract defines storage expectations and deprecation behavior. It does not authorize executable evidence deletion yet.

## Layer Boundary

Atlas work products remain layered:

```txt
Evidence -> Observation -> Assessment
```

Assessment artifacts are not evidence.

They may cite evidence, summarize observations, and preserve analyst judgment, but they do not replace expanded ESI killmails while those killmails remain available.

## Assessment Artifact Storage Shape

Future persistence should support at least:

```txt
artifact_id
artifact_type              -- entity_interest | evidence_compaction | analyst_note
entity_type                -- character | corporation | alliance, when entity-scoped
entity_id
entity_name                -- cached label only
status                     -- active | cooling | archived | superseded
interest_score
priority_score
impact_score
confidence
assessment_reason
assessment_summary
evidence_window_start
evidence_window_end
evidence_scope_type        -- actor | system | radius | corporation | region | manual
evidence_scope_json
source_report_type
source_report_parameters_json
source_run_ids_json
sample_killmail_ids_json
appearance_count
attacker_appearance_count
victim_appearance_count
systems_observed_json
regions_observed_json
ships_observed_json
created_at
updated_at
assessed_by
superseded_by_artifact_id
archived_at
```

Optional later support:

```txt
assessment_artifact_evidence_links (
  artifact_id,
  killmail_id,
  link_type,
  linked_at
)
```

The link table is useful while evidence remains available. The summary snapshot must still survive if linked raw evidence is later pruned.

## Creation Rules

Assessment artifacts are deliberate.

Allowed creation paths:

- user commits an assessment from an evidence or observation report
- user promotes an observed entity into interest memory
- user accepts a future recommendation
- user runs an explicit compaction action before scoped evidence pruning

Not allowed:

- automatic artifacts for every observed entity
- silent score creation during ingestion
- AI commentary promoted to assessment without user acceptance
- evidence pruning without a visible preservation choice when observations exist

## Score Rules

Scores are allowed only with reasons or supporting summaries.

Minimum requirement for any score:

- score field
- score meaning or band
- assessment reason
- evidence window
- source scope
- sample size or appearance count

Scores may cool, archive, or be superseded. Score changes should preserve prior assessment context through history or supersession rather than silently rewriting meaning.

## What Survives Evidence Pruning

If future evidence pruning is implemented, committed assessment artifacts survive.

An artifact should preserve:

- entity ID and cached label at assessment time
- evidence window summarized
- evidence scope summarized
- appearance and role counts
- systems/regions observed
- ship/type summary when available
- source report type and parameters
- sample killmail IDs or link records when available
- user reason and assessment timestamp

The artifact must remain clear that it is assessment memory, not raw killmail evidence.

## Retention By Data Class

### Expanded Killmail Evidence

Default: retained.

Pruning:

- disabled until assessment artifact persistence exists
- explicit only
- scoped only
- preflight and confirmation required
- assessment preservation required or explicitly declined

### Activity Events

Default: retained with source killmail evidence.

Pruning:

- only with corresponding evidence pruning
- never independently pruned as a cleanup shortcut

### Collection Provenance

Default: retain run summaries longer than request logs.

Pruning:

- `fetch_runs` should remain long enough to explain collection history
- `api_request_logs` are diagnostic and may be pruned by age after preflight

### Metadata Runs

Default: diagnostic history.

Pruning:

- old `metadata_runs` may be pruned after preflight
- hydrated labels in lookup tables remain cached metadata
- pruning metadata diagnostics must not remove evidence IDs

### Discovery Queue Refs

Default: ephemeral operational backlog.

Pruning:

- pending/failed/expanded/cached/superseded refs may expire by age/status after preflight
- queue refs are not evidence
- expiring queue refs must not delete killmails or activity events
- stale failed refs should preserve enough failure count/error context in diagnostics before removal

### Static SDE Lookup Data

Default: replaceable from explicit local SDE import.

Pruning/replacement:

- rebuild from a newer SDE import
- keep import provenance
- reports query SQLite lookup tables, not SDE zip files

### Runtime DB Artifacts

Default: user-controlled.

Pruning/deletion:

- disposable test/live-smoke DBs may be deleted only by explicit action
- path must be shown in preflight
- normal runtime DB deletion requires stronger confirmation than diagnostic pruning
- project temp/cache artifacts stay under `F:\Projects\AURA-Atlas\.tmp`

## Execution Blocker

Executable evidence pruning remains blocked until:

- assessment artifact table/schema is implemented
- compaction preflight can show the assessment artifact that would be created
- pruning preflight can show linked evidence impact
- verification proves artifacts survive evidence pruning
- verification proves raw evidence is never pruned silently

Current `retention.preflight` remains read-only.

## Verification Expectations

Current supporting verification:

- `verify:retention-preflight`
- `verify:db-integrity`
- `verify:report-response`

Future implementation should add checks for:

- assessment artifact creation requires explicit confirmation
- scores require reason/summary
- evidence pruning is blocked without assessment preservation or explicit decline
- assessment artifacts survive scoped evidence pruning
- queue/diagnostic pruning does not remove killmails or activity events
- runtime DB deletion refuses paths outside approved project/runtime roots

## Related Documents

- `docs/statements/retention-and-deprecation-policy.md`
- `docs/features/entity-interest-artifacts.md`
- `docs/features/evidence-compaction-to-assessment.md`
- `docs/terms/entity-interest.md`
- `docs/terms/work-products.md`
