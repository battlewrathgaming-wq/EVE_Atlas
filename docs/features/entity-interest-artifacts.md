# Feature: Entity Interest Artifacts

Status: Proposed
Date: 2026-05-21

## Purpose

Entity interest artifacts preserve long-term assessment that an entity matters.

They let AURA Atlas remember a corporation, alliance, or pilot after an active evidence trail cools.

This is the difference between:

```txt
we observed this entity once
```

and:

```txt
we assessed this entity as worth remembering
```

## User Value

This feature supports:

- hot trail -> cold trail memory
- analyst-curated entity priority
- delayed reinspection
- future watchlist promotion
- lightweight long-term corp/alliance memory
- impact/priority ranking independent from raw activity counts

## Data Classification

Entity interest is an assessment artifact.

It is not raw evidence.

It is not automatic ingestion.

It is not collection provenance.

It is a committed assessment product.

## Creation Path

Interest artifacts should be created deliberately through:

- user action
- explicit promotion from an observed-operator report
- accepted system suggestion
- accepted rule-based recommendation

They should not be created automatically for every entity seen in a killmail.

## Suggested Data Shape

Generic shape:

```txt
entity_type
entity_id
entity_name
interest_score
interest_band
assessment_reason
evidence_summary
source_report_type
source_report_scope
source_run_id
first_assessed_at
last_assessed_at
assessed_by
status
```

Minimum useful shape:

```txt
entity_type
entity_id
interest_score
assessment_reason
last_assessed_at
status
```

Interest score can start simple:

```txt
0-19   cold
20-49  warm
50-79  hot
80-100 priority
```

The exact scoring method is future assessment work.

## Relationship To Watchlists

Interest is not the same as watchlist membership.

```txt
watchlist = actively collect on this entity
interest = remember this entity matters
```

An entity may be:

- interesting but not watched
- watched but low interest
- both watched and high interest

## Must Not Do

This feature must not:

- create interest records for every observed entity automatically
- replace evidence counts
- erase or mutate activity events
- imply certainty beyond the supporting evidence
- become an invisible threat score with no reason

## Related Documents

- `docs/statements/retention-and-deprecation-policy.md`
- `docs/tenets/tenets.md`
- `docs/terms/activity-event.md`

