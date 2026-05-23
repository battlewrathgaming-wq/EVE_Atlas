# Gap To-Do: Readiness Side Effects

Status: Complete
Priority: P3

## Completed

- Decided that `app.readiness` is a pure read/inspection check.
- Removed runtime directory creation side effects from readiness inspection.
- Added explicit `app.prepare` metadata-only service command for creating approved runtime/cache/SDE directories.
- Readiness now reports whether runtime paths are valid and whether they already exist.
- Missing valid paths are reported as `RUNTIME_PATHS_MISSING`, not silently created.

## Task Requirements Addressed

The readiness service currently creates temp/cache/SDE directories while computing readiness.

UI semantics are now clear:

- readiness check: observe state
- prepare/init action: create missing runtime folders

## Guardrails

- Read-only service commands should avoid surprising writes.
- Path creation must stay under approved runtime/project paths.
- The app should clearly report when paths are missing versus created.

## Verification

- `verify:app-readiness`
- `verify:service-registry`
- `verify:all`

`verify:app-readiness` proves readiness does not create missing runtime paths and that `app.prepare` creates them explicitly.

## Related Files

- `src/main/services/appReadinessService.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-app-readiness.js`
- `docs/gap/complete/app-readiness-and-settings.md`
