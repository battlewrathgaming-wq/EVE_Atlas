# ADR-0003: Local SDE First For Static Metadata

Status: Accepted
Date: 2026-05-21

## Context

EVE systems, regions, constellations, stargate topology, inventory type names, groups, and categories are static game data. Repeated live API calls for static data waste network/API capacity and slow reporting.

## Decision

AURA Atlas imports required SDE JSONL data into local SQLite lookup tables.

Reports query local SQLite metadata at runtime rather than reading the SDE zip or calling live APIs for static labels.

## Consequences

Reports are faster and more API-respectful.

The SDE zip is import material, not runtime lookup material.

The project must preserve SDE import provenance and verify importer idempotency.

## Alternatives Considered

- Resolve ship/system names through live ESI per report: rejected for static data.
- Parse the SDE zip at report time: rejected for performance and runtime complexity.

## Related Documents

- `docs/tenets/tenets.md`
- `docs/schemas/type-metadata.md`
- `docs/schemas/geography-metadata.md`

