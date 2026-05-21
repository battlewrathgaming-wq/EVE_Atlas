# Failure 0001: zKill Summary Drift

Date: 2026-05-21
Status: Guarded

## Observed Behavior

Earlier prototypes stored or presented zKill-derived summary payloads as if they were durable tactical intelligence.

Examples included macro statistics, top systems, monthly summaries, and compact recent loss summaries.

## Root Cause

The prototype had fetch and display machinery before it had a strict evidence model.

Convenient zKill summaries filled the role that should have been held by expanded ESI killmail evidence.

## Architectural Lesson

zKill is valuable for discovery, but zKill summaries are not the authoritative source of truth for AURA Atlas.

## Resulting Invariant

Only expanded ESI killmails are stored as killmail evidence. zKill records may provide `killmail_id` and `zkb.hash` for expansion.

Derived intelligence must be rebuilt from stored expanded killmails and normalized activity events.

## Detection / Test Coverage

Collector verification should confirm that zKill clients return discovery refs and that persistence is based on expanded ESI payloads.

## Related Changes

- `docs/adr/ADR-0001-zkill-is-discovery-only.md`
- `docs/adr/ADR-0002-expanded-killmails-authoritative.md`

