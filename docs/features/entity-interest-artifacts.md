# Feature: Entity Interest And Assessment Artifacts

Status: Assessment artifact foundation implemented; interest scoring remains future assessment work
Updated: 2026-05-23

## Purpose

Entity interest is deliberate operator memory that an entity matters after the immediate evidence trail cools.

It is the difference between:

```text
this entity appeared in evidence
```

and:

```text
the operator assessed this entity as worth remembering
```

## Data Classification

Entity interest is assessment memory.

It is not:

- raw evidence
- collection provenance
- automatic ingestion
- a hidden threat score

## Current Behavior

Atlas can create and review assessment artifacts from report context with citation status.

Current assessment artifacts can preserve:

- artifact type
- typed entity scope
- scores and reasons where required
- evidence window
- citation status
- cited killmail IDs
- source report/run context
- timestamps

## Future Interest Shape

A future entity interest record may include:

```text
entity_type
entity_id
interest_score
interest_band
assessment_reason
source_report_context
cited_killmail_ids
last_assessed_at
status
```

Interest score should remain explainable. A number without a reason is not acceptable assessment memory.

## Relationship To Watchlists

Interest is not the same as watchlist membership.

```text
watchlist = actively collect or monitor
interest = remember this entity matters
```

An entity can be interesting but not watched, watched but low interest, or both.

## Must Not Do

- Automatically create interest records for every observed entity.
- Replace evidence counts with an opaque score.
- Claim affiliation, ownership, staging, or hostility without assessment wording.
- Hide the evidence basis for an assessment.
- Mutate raw killmails or activity events.

Related docs:

- `docs/terms/entity-interest.md`
- `docs/terms/work-products.md`
- `docs/features/evidence-compaction-to-assessment.md`
- `docs/statements/retention-and-deprecation-policy.md`
