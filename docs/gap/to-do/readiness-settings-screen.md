# Gap To-Do: Readiness And Settings Screen

Status: Open
Priority: P1

## Actionables

- Build a renderer view for `app.readiness`.
- Expose `app.prepare` as an explicit preparation action when runtime paths are valid but missing.
- Show SDE topology/import state, inventory/type metadata state, runtime DB path, cache paths, live API state, and User-Agent state.
- Use readiness blockers/warnings from the backend taxonomy rather than inventing UI-only status meanings.

## Task Requirements

The user should know whether Atlas is ready before running reports, discovery, or live collection.

The screen should show:

- app readiness status: ready, degraded, or blocked
- path state and missing runtime folders
- SDE topology readiness
- SDE inventory/type metadata readiness
- live API enabled/disabled
- current database path
- next recommended local action

## Guardrails

- `app.readiness` is inspection only.
- Directory creation should happen only through explicit `app.prepare`.
- Do not trigger SDE import or live API calls from this screen automatically.
- Missing SDE should disable topology/type-dependent actions elsewhere.

## Completion Signal

A user can open the app, understand what is ready or missing, run `app.prepare` deliberately, and see the readiness state refresh without hidden filesystem writes.

## Related Documents

- `docs/gap/complete/app-readiness-and-settings.md`
- `docs/gap/complete/readiness-side-effects.md`
- `docs/current-state/current-ipc-ui-preparation.md`
