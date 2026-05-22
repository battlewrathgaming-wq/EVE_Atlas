# Gap To-Do: Backend And Electron Readiness

Date: 2026-05-22
Status: Open

## Context

AURA Atlas is built as an Electron app.

Current evidence:

- `package.json` uses `src/main/main.js` as the Electron main entry.
- `npm start` runs `electron .`.
- runtime DB handling supports Electron `app.getPath('userData')`.
- development and test DBs can override runtime location with `AURA_ATLAS_DB_PATH`.
- current implementation work is concentrated in Electron main-process/backend services, SQLite, workers, reports, and CLI verification.

## Important Open Backend Gaps

### Controlled Disposable DB Batch Test

Status: Implemented

One realistic workflow test now uses a disposable DB under the project `.tmp` path.

Suggested flow:

```txt
manual discovery
-> manual expansion
-> actor watch
-> radius report
-> corporation report
-> metadata readiness
-> queue/report checks
```

Purpose:

- prove integrated work products across lanes
- catch cross-feature drift
- provide a pre-UI confidence gate

Current verification:

- `verify:controlled-workflow`
- included in `verify:all`

### Live Smoke Grouping

Status: Implemented

Grouped gated live smoke commands now exist.

Current commands:

- `verify:live-smoke`
- `verify:live-actor-smoke`
- `verify:live-radius-smoke`

Rules:

- must require `AURA_ATLAS_LIVE_API=1`
- must use disposable DBs under `F:\Projects\AURA-Atlas\.tmp`
- must remain separate from `verify:all`

### Retention And Deprecation Policy

Retention rules are not finalized for:

- `api_request_logs`
- zKill at-a-glance preview metadata
- old discovery queue refs
- metadata refresh age
- stale failed refs

This should become a dedicated policy/implementation slice before long-running use.

### Electron IPC / Backend API Boundary

Before UI work, the renderer needs a controlled backend interface.

Likely IPC-backed actions:

- plan radius scope
- run routine system/radius watch
- resolve typed actor name
- run routine actor watch
- run manual discovery
- run manual expansion
- get queue report/status
- get evidence/observation report
- run metadata readiness report
- run scoped hydration
- get run diagnostics

Rule:

Renderer/UI should not call repositories, workers, or raw SQLite directly.

### Watch Persistence And Scheduler

Collection workers exist, but the full session-armed scheduler/poll loop is not complete.

Open questions:

- how watches are armed/disarmed per session
- how poll intervals are enforced
- how backoff state is surfaced
- how due runs are triggered in Electron

### Shared Scope Validation Helpers

Status: Implemented

User-facing scope rules are documented and validation/default application is now centralized for current CLI/live runner paths.

Current coverage:

- shared defaults for manual discovery
- shared defaults for actor watch
- shared defaults for system/radius watch
- consistent validation for lookback, refs, expansions, radius, max systems
- current CLI and live runners use shared helpers
- future IPC and UI should use the same helpers

Current verification:

- `verify:scope-controls`
- included in `verify:all`

## Related Documents

- `docs/contracts/scope-definition-contract.md`
- `docs/features/ui-trigger-and-scope-map.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/current-state/current-report-products.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/gap/complete/app-readiness-and-settings.md`
- `docs/gap/complete/ipc-service-contract.md`
- `docs/gap/complete/scope-controls-contract.md`
- `docs/gap/complete/task-runner-and-progress.md`
- `docs/gap/complete/live-api-gate-ux.md`
- `docs/gap/complete/report-response-contract.md`
- `docs/gap/complete/queue-expansion-selection.md`
- `docs/gap/complete/error-warning-taxonomy.md`
- `docs/gap/complete/concurrency-and-locking.md`
- `docs/gap/complete/destructive-actions-and-retention.md`
- `docs/gap/to-do/ui-language-contract.md`
