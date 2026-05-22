# Contract: Metadata Hydration

Status: Active
Date: 2026-05-22

## Purpose

Metadata hydration makes reports readable by resolving names and labels for already-stored IDs.

Names are labels. IDs remain facts.

## Boundary

Owned by:

- typed actor resolver
- report-scoped hydrators
- metadata readiness reports
- `metadata_runs`

## Inputs

- report-relevant unresolved character, corporation, and alliance IDs
- typed user-entered actor names
- local SDE type/geography lookup tables

## Outputs

- cached `entities` labels
- patched display labels where allowed
- metadata run records
- API logs marked as metadata

## Invariants

- Hydration must not mutate raw killmail evidence.
- Hydration must not replace numeric IDs.
- Entity hydration is scoped by report relevance or explicit user action.
- Static type labels come from local SDE metadata, not live ESI, during normal reporting.
- Metadata runs use `metadata_runs`, not `fetch_runs`.

## Must Not Do

- Do not hydrate every ID by default.
- Do not use live ESI for ship/type names when local SDE should provide them.
- Do not let missing labels block evidence reports.

## Verification

- `verify:hydration`
- `verify:metadata-status`
- `verify:metadata-lookup`
- `verify:actor-resolution`
- `verify:actor-metadata`
- `verify:corporation-metadata`

