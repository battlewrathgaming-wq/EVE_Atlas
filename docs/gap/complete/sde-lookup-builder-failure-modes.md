# SDE Lookup Builder Failure Modes

Status: Complete

Completed: 2026-05-23

## Mission

Attack the explicit SDE lookup builder with failed downloads, bad source files, cleanup pressure, and existing-data preservation cases.

## Implemented Outcome

Extended:

```text
npm.cmd run verify:sde-build-lookups
```

The verifier now covers:

- failed official SDE download with a clear surfaced error
- invalid zip/source input
- source/work directory cleanup after failed download or invalid source
- existing lookup-table preservation after a failed refresh
- interrupted inventory import after topology import
- successful build cleanup
- `AURA_ATLAS_KEEP_SDE_SOURCE=1` / `keepSource` debug preservation
- report/runtime guard that reports do not import SDE builder/importer modules or reference zip paths
- `SDE_LOOKUP_MISSING` readiness when topology or inventory is incomplete

## Builder Hardening

The lookup builder now treats a zero/incomplete import as a failed build instead of a successful empty refresh.

Required imported subsets:

- regions
- constellations
- solar systems
- stargate adjacency
- type metadata

If any required subset is missing, the builder raises:

```text
SDE_LOOKUP_BUILD_INCOMPLETE
```

## Guardrails Preserved

- SDE zip/source remains import material only.
- Reports still use SQLite lookup tables only.
- Failed refreshes do not remove existing valid lookup-table rows.
- Failed builds clean disposable source/extraction directories unless debug keep-source is explicitly enabled.

## Verification

Passed:

```text
npm.cmd run verify:sde-build-lookups
npm.cmd run verify:sde
```
