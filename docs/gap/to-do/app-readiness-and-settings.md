# TODO: App Readiness And Settings

Status: Partially Implemented

## Actionables

- Define app readiness checks.
- Expose runtime DB path, SDE status, cache paths, and live API state.
- Validate required local paths stay under intended project/user data locations.
- Show whether topology and inventory metadata have been imported.
- Provide settings for User-Agent/contact where required.
- Add a startup readiness report.

## Task Requirements

Before UI actions run, the app should know whether Atlas is ready.

Readiness checks:

- DB initialized
- migrations applied
- SDE topology imported
- SDE inventory imported
- type metadata available
- runtime/cache/temp paths valid
- live API gate state known
- User-Agent configured

## Guardrails

- Avoid hidden writes to unexpected drives/paths.
- Do not let UI run topology-dependent actions before SDE topology exists.
- Do not make live calls without a clear User-Agent.

## Completion Signal

The app can produce a readiness object that the renderer can show and use to enable/disable actions.

## Current Implementation

- `app.readiness` service command exists.
- Readiness object includes DB/migration state, SDE topology/inventory state, lookup counts, runtime paths, live API gate state, and User-Agent state.
- Verified by `verify:app-readiness` and `verify:service-registry`.
