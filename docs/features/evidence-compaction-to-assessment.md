# Feature: Evidence Compaction To Assessment

Status: Proposed
Date: 2026-05-22

## Purpose

Evidence compaction to assessment lets AURA Atlas preserve what was learned from old evidence without keeping every raw observation forever.

The idea is:

```txt
old evidence
-> scoped summary
-> committed assessment artifact
-> optional evidence pruning
```

This supports long-term memory without requiring permanent retention of every old killmail, activity event, queue record, or diagnostic log.

## User Value

Many evidence records lose tactical value over time.

However, the assessment created from them may remain valuable:

- this corporation was worth watching
- this alliance repeatedly appeared in a watched radius
- this pilot was part of a hot trail
- this operator pattern cooled but should remain remembered

This feature allows Atlas to keep the lesson even if the old trail cools.

## Data Classification

Evidence compaction creates an assessment artifact.

It is not raw evidence.

It is not automatic ingestion.

It is not a replacement for the original killmails while those killmails remain available.

It is a committed memory product that should clearly state what evidence window and scope it summarizes.

## Creation Path

Preferred creation paths:

- user commits an assessment from an evidence/observation report
- user promotes an observed operator into an interest artifact
- user reviews old evidence before pruning and saves a summary
- future rule suggests an assessment, but the user accepts it deliberately

Avoid:

- silently creating assessment artifacts for every observed entity
- pruning evidence without offering a summary when useful observations exist
- producing opaque scores with no reason

## Suggested Assessment Shape

Minimum:

```txt
entity_type
entity_id
entity_name
interest_score
assessment_summary
evidence_window_start
evidence_window_end
source_scope_type
source_scope_value
last_assessed_at
status
```

Useful supporting snapshot:

```txt
appearance_count
attacker_count
victim_count
systems_observed
regions_observed
ships_observed
first_observed
last_observed
source_report_type
source_report_parameters
```

## Example

```txt
Entity:
Emperor Scythes [corporationID: 98715582]

Assessment:
Interest score 62 / warm-hot.

Summary:
Repeated attacker-side presence in ZTS-4D radius.
Observed across ZTS-4D and ZUE-NS during a 24h evidence window.
Worth retaining as a cold trail after raw evidence ages out.
```

## Relationship To Evidence Pruning

Evidence should not be pruned silently.

Before pruning old scoped evidence, Atlas should be able to ask:

> Should any assessment memory be created from this?

If the user commits an assessment, the assessment should survive even if the raw evidence is later removed.

## Must Not Do

This feature must not:

- pretend the assessment is raw evidence
- erase uncertainty
- claim ownership, staging, or affiliation without support
- create interest artifacts automatically for every entity
- hide the evidence window and sample size behind a score

## Related Documents

- `docs/statements/retention-and-deprecation-policy.md`
- `docs/features/entity-interest-artifacts.md`
- `docs/terms/entity-interest.md`
- `docs/terms/work-products.md`
- `docs/tenets/tenets.md`

