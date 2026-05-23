# SDE Build Local Lookup Tables

Status: Complete

Completed: 2026-05-22

## Mission

Replace long-term reliance on a stored SDE zip with an explicit setup and maintenance workflow that builds Atlas runtime lookup tables from disposable source material.

Atlas treats the SDE zip as import source material only. Runtime reports and UI inspection use local SQLite lookup tables.

## Implemented Outcome

Atlas now has an explicit command:

```text
npm run sde:build-lookups
```

and backend service command:

```text
sde.build-lookups
```

The workflow:

1. Downloads official EVE SDE JSONL source when no local source path is supplied.
2. Stores downloaded and extracted source files only under the configured Atlas temp/cache path.
3. Imports the lookup records Atlas needs:
   - regions
   - constellations
   - solar systems
   - system adjacency
   - inventory type metadata
   - `ship_types` view support
4. Populates or refreshes the local SQLite lookup tables:
   - `regions`
   - `constellations`
   - `solar_systems`
   - `system_adjacency`
   - `type_metadata`
   - `ship_types` view
5. Records provenance:
   - source URL
   - SDE build number where available
   - ETag
   - Last-Modified
   - imported timestamp
   - source checksum
   - import counts
6. Removes downloaded/extracted source files after successful import.
7. Supports debug override:

```text
AURA_ATLAS_KEEP_SDE_SOURCE=1
```

## Readiness Behavior

If local lookup tables are missing or incomplete, app readiness surfaces:

```text
SDE_LOOKUP_MISSING
```

Message:

```text
Local SDE lookup tables are missing or incomplete. Atlas cannot reliably resolve systems, topology, ships, or typeIDs until lookup tables are built.
```

Renderer next action:

```text
Build Local Lookup Tables
```

## Guardrails Preserved

- Reports do not trigger this workflow.
- Unresolved `typeID` or `solarSystemID` values do not silently download or parse SDE source.
- SDE source material is not durable app state unless the explicit debug override is set.
- Raw evidence is not mutated by lookup rebuilds.
- Runtime reports resolve metadata from SQLite lookup tables only.

## Verification

Added:

```text
npm run verify:sde-build-lookups
```

The verification proves:

- a clean DB can build local lookup tables through one explicit action
- lookup tables exist after build
- reports do not import SDE importer modules or reference SDE zip paths
- disposable source zip/extraction files are deleted after a successful build
- `AURA_ATLAS_KEEP_SDE_SOURCE=1` preserves source files for debugging
- missing lookup tables produce `SDE_LOOKUP_MISSING`

`verify:sde-build-lookups` is included in the `verify:sde` and `verify:all` groups.
