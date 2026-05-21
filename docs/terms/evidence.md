# Term: Evidence

## Plain Meaning

Evidence is the stored factual material AURA Atlas can point back to.

In Atlas, the main evidence is the expanded ESI killmail.

## Why It Matters

Reports should be able to answer:

> What evidence supports this?

If a claim cannot be traced back to stored evidence, it should not be treated as authoritative intelligence.

## What Counts As Evidence

Evidence includes:

- expanded ESI killmail payloads
- normalized activity events derived from those killmails
- ingestion audits tied to those killmails

## What Does Not Count As Evidence

These are useful, but they are not evidence:

- zKill summaries
- UI state
- AI summaries
- display names
- dashboard counters that cannot be rebuilt
- user interpretation

## Product Rule

AURA Atlas should preserve evidence first, then build reports and interpretation on top of it.

