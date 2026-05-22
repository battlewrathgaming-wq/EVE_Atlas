# Gap To-Do: Readiness Side Effects

Status: Open
Priority: P3

## Actionables

- Decide whether app readiness is a pure read check or an initialization/preparation action.
- If readiness remains read-only, remove filesystem-creating side effects from it.
- If directory creation is intended, split it into an explicit prepare/init command or document the side effect clearly.

## Task Requirements

The readiness service currently creates temp/cache/SDE directories while computing readiness.

That is practical for CLI/dev use, but UI semantics should be clear:

- readiness check: observe state
- prepare/init action: create missing runtime folders

## Guardrails

- Read-only service commands should avoid surprising writes.
- Path creation must stay under approved runtime/project paths.
- The app should clearly report when paths are missing versus created.

## Completion Signal

Readiness behavior is either pure read-only, or the service/contract explicitly names it as readiness-and-prepare. Verification should reflect the chosen behavior.

## Related Files

- `src/main/services/appReadinessService.js`
- `src/main/services/serviceRegistry.js`
- `docs/gap/complete/app-readiness-and-settings.md`
