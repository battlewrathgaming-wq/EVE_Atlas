# TODO: IPC Service Contract

## Actionables

- Define renderer-safe commands for core actions.
- Route renderer requests through service modules, not raw repositories.
- Define request/response shapes for each command.
- Classify commands as read-only, metadata-only, evidence-creating, or destructive.
- Ensure live-network commands respect the live API gate.
- Add verification that renderer cannot directly mutate evidence tables.

## Task Requirements

The Electron renderer needs a clear backend boundary before UI work begins.

Expected command areas:

- create/update/list watches
- run manual discovery
- expand selected queue refs
- run evidence/observation reports
- hydrate report metadata
- read app readiness/settings
- import SDE metadata
- inspect task/run history

Suggested service boundaries:

- `WatchService`
- `DiscoveryService`
- `ExpansionService`
- `ReportService`
- `MetadataService`
- `SettingsService`
- `TaskService`

## Guardrails

- Renderer must not call low-level DB/repository methods directly.
- Renderer must not construct evidence records directly.
- Renderer may request actions; backend services own evidence mutation.
- IPC commands should return scoped results and warnings, not raw internal module state.

## Completion Signal

There is a documented IPC command list, service boundary, and verification path showing renderer actions cannot bypass the evidence pipeline.

