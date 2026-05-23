# Complete: IPC Mutating Action Services

Status: Complete
Priority: P1

## Actionables

- Add service commands for evidence-creating and metadata-mutating actions.
- Route renderer-triggered actions through services, task runner, live gate, and scope validation.
- Cover manual discovery, manual expansion, actor watch, system/radius watch, metadata hydration, SDE import, and watch create/update/list actions.
- Classify each command as read-only, metadata-only, evidence-creating, destructive, or exclusive.

## Task Requirements

The backend has collection workers and CLI scripts, but the Electron renderer needs a governed action boundary.

Expected service commands now cover:

- `manual.discovery`
- `manual.expansion`
- `actor.watch`
- `system.radius.watch`
- `metadata.hydration`
- `sde.import.topology`
- `sde.import.inventory`
- `watch.create`
- `watch.update`
- `watch.list`

The service layer should be the only renderer-facing path for these actions.

## Current Implementation

Evidence-creating and metadata-mutating actions run through the same service/task boundary intended for Electron IPC.

Live actions use the live API gate before calling zKill or ESI-backed workers.

Manual discovery and manual expansion have a controlled renderer-style verification path using `invokeServiceCommand(..., asTask: true)`.

## Guardrails

- Renderer must not call repositories, workers, raw SQLite, or CLI scripts directly.
- Live actions must respect the live API gate.
- Evidence-creating actions must use task classification and locking.
- Scope defaults and validation must come from shared backend helpers.
- Responses should use taxonomy-shaped warnings/errors.

## Verification

- `verify:mutating-services`
- `verify:service-registry`
- `verify:manual-discovery`
- `verify:task-runner`

## Completion Signal

`atlas:service:list` exposes the mutating commands, service verification covers them, and a controlled fixture proves renderer-style invocation can run at least one manual discovery and one capped expansion through the service boundary.

## Related Files

- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/taskRunner.js`
- `src/main/services/liveApiGateService.js`
- `src/main/scopes/scopeControls.js`
- `docs/contracts/scope-definition-contract.md`
- `docs/gap/complete/ipc-service-contract.md`
