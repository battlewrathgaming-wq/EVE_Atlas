# Term: Entity Interest

## Plain Meaning

Entity interest is a committed assessment that a pilot, corporation, or alliance is worth remembering.

It is a way for Atlas to keep a trail alive after current activity cools.

## Simple Example

A corporation appears repeatedly in a watched system.

The user decides:

> This corporation is worth remembering.

Atlas records an interest score or priority for that corporation.

## Why It Matters

Not every observed entity deserves long-term attention.

Entity interest helps separate:

- entities merely seen in evidence
- entities worth remembering
- entities worth watching actively

## Important Distinction

Interest is broader than Marked.

```txt
interest = this entity matters
marked = operator interest / tag / record attention
actor watch = run a scoped lookback collection for this entity
```

An entity can be interesting without being Marked.

An entity can be Marked without an actor watch currently running.

If an active watch includes the entity, the entity should also be treated as Marked.

Marked does not imply Watched.

## What It Is Not

Entity interest is not raw evidence.

It is not automatically created for every entity seen in a killmail.

It is an assessment artifact: a committed judgment or priority marker.

## Related Layer

Entity interest belongs to the assessment layer.

It may be supported by evidence and observations, but it is not itself raw evidence.

## Product Rule

Entity interest should be created deliberately through user action, explicit promotion, or accepted recommendation.

It should not be silently generated as a side effect of ingestion.
