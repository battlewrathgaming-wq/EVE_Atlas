# Current State: IPC And UI Preparation

Date: 2026-05-22

## What Exists

AURA Atlas is currently backend-first and CLI-verifiable.

The project now has the first Electron IPC service shell around backend services. The renderer/UI should call a controlled backend interface rather than repositories, workers, or SQLite directly.

Current implemented shell:

- `atlas:service:list`
- `atlas:service:invoke`
- `app.readiness` service command
- `scope.defaults` service command
- `scope.validate` service command

## Backend Actions Ready For IPC Wrapping

Implemented backend actions include:

- read app readiness/settings
- resolve typed actor names
- validate user-defined scopes
- run manual discovery
- run manual expansion
- run actor watch collection
- run system/radius watch collection
- run queue preflight/report
- run report products
- run metadata readiness reports
- run scoped hydration commands
- run diagnostics reports

## Scope Defaults And Guardrails

Scope validation/defaults are centralized in backend helpers.

This is intended to be the shared source for:

- CLI arguments
- future IPC request validation
- future UI form defaults

The UI should submit explicit user choices, but backend scope helpers remain the authority for allowed values and conservative defaults.

## Verification Shape

Offline verification now includes:

- individual feature checks
- grouped `verify:all`
- a controlled disposable DB workflow check
- app readiness verification
- service registry / IPC handler verification
- scope defaults/validation verification

Live smoke grouping exists separately:

- `verify:live-smoke`
- `verify:live-actor-smoke`
- `verify:live-radius-smoke`

Live smoke groups refuse to run unless `AURA_ATLAS_LIVE_API=1` is set.

## Not Yet Implemented

- renderer shell
- UI controls for scope selection
- session-armed watch scheduler
- long-running retention/deprecation policy
- IPC wrappers for evidence-creating actions
- IPC wrappers for report products beyond app readiness
