# SDE Lookup Builder Failure Modes

## Mission

Attack the explicit SDE lookup builder with failed downloads, bad source files, cleanup pressure, and existing-data preservation cases.

The successful path is implemented. This task is about proving bad paths do not leave Atlas half-ready or reliant on retained zip files.

## Task Requirements

- Verify failed official SDE download surfaces a clear readiness/action error.
- Verify invalid zip/source input fails without marking lookup tables ready.
- Verify interrupted import does not destroy existing valid lookup tables.
- Verify successful build deletes downloaded/extracted source files by default.
- Verify `AURA_ATLAS_KEEP_SDE_SOURCE=1` preserves source files for debugging.
- Verify reports never import SDE modules or parse zip paths at runtime.
- Verify readiness exposes `SDE_LOOKUP_MISSING` when either topology or inventory is incomplete.

## Suggested Verification

Extend existing `verify:sde-build-lookups` or add:

```txt
npm.cmd run verify:sde-build-failures
```

Use fake/local fixture sources rather than network where possible.

## Acceptance Criteria

- Existing lookup tables survive failed refresh attempts.
- Source zip/extraction files are disposable by default.
- Missing/incomplete lookup state is visible through readiness.
- Runtime reports continue to use SQLite lookup tables only.

