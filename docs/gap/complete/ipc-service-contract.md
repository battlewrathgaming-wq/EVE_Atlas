# Complete: IPC Service Contract

Status: Complete For Initial Service Shell

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

## Current Implementation

- Generic service IPC shell exists with `atlas:service:list` and `atlas:service:invoke`.
- `app.readiness` is registered as a read-only service command.
- Unknown commands are rejected.
- Commands require backend DB context.
- Verified by `verify:service-registry`.

## Remaining Follow-On Work

Individual service commands for reports, discovery, expansion, hydration, watches, and tasks remain separate implementation slices. The initial IPC service boundary exists.
