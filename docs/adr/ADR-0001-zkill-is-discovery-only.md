# ADR-0001: zKill Is Discovery Only

Status: Accepted
Date: 2026-05-21

## Context

zKillboard is useful for finding public killmail references, but zKill summaries and profile statistics are not the evidence model for AURA Atlas.

Earlier prototypes risked treating zKill-derived aggregates as tactical truth.

## Decision

AURA Atlas uses zKillboard only to discover killmail references:

- `killmail_id`
- `zkb.hash`

All tactical and historical intelligence must come from expanded ESI killmails.

## Consequences

This keeps Atlas from becoming a zKill clone or depending on zKill summaries as truth.

It requires an ESI expansion step before evidence is persisted or normalized.

## Alternatives Considered

- Store zKill summaries directly: rejected because summaries are not the source of truth and are not sufficiently rebuildable.
- Use zKill profile statistics for actor pages: rejected for authoritative reports; may be used only as labeled external context later.

## Related Documents

- `docs/adr/ADR-0002-expanded-killmails-authoritative.md`
- `docs/failures/failure-0001-zkill-summary-drift.md`

