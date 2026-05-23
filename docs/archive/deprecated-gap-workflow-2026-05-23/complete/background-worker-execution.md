# Complete: Background Worker Execution

Status: Complete For IPC Shell Preparation
Priority: P1

## Actionables

- Move heavy backend actions off the immediate Electron IPC response path.
- Decide the execution model: worker threads, utility process, child process, or dedicated backend service module with async isolation.
- Keep SQLite access safe under the chosen execution model.
- Ensure task progress and warnings still flow back through the service/task boundary.

## Task Requirements

Current worker files are worker-style modules, not separate runtime workers. SQLite access is synchronous through `node:sqlite`, and the Electron main process owns the runtime DB.

Heavy operations include:

- SDE topology/import work
- SDE inventory import
- zKill/ESI collection runs
- metadata hydration
- broad reports over growing evidence
- retention/compaction work when implemented

The app needs to remain responsive while these run.

## Current Implementation

The first execution model is detached service tasks:

```txt
renderer IPC request
-> service registry
-> task runner
-> immediate running task response
-> async command execution
-> task history/progress/result updated
```

This keeps renderer-triggered long work off the immediate IPC response path. It preserves the existing task classification and lock model for read-only, metadata-only, evidence-creating, destructive, and exclusive work.

The IPC request can set:

```txt
asTask: true
detachedTask: true
```

or:

```txt
asTask: true
background: true
```

## Important Limit

This slice does not yet move work into a worker thread, utility process, child process, or separate backend process.

Synchronous SQLite and CPU-heavy import/report work can still consume main-process time while executing. True process isolation remains a future scaling step.

## Guardrails

- Long actions can return a task handle immediately instead of blocking the renderer until completion.
- Read-only IPC calls can still respond while a detached async task is waiting on external or asynchronous work.
- Evidence-writing tasks remain serialized by task locks.
- Live API gates still apply before zKill or ESI work begins.
- Evidence immutability and queue scope rules remain unchanged.

## Verification

- `verify:background-execution`
- `verify:task-runner`
- `verify:service-registry`
- `verify:mutating-services`

## Completion Signal

A smoke path starts a long-running fixture task while readiness and task-list IPC calls still respond. Evidence-writing tasks remain serialized as intended.

## Related Files

- `src/main/services/taskRunner.js`
- `src/main/services/serviceRegistry.js`
- `scripts/verify-background-execution.js`
- `docs/gap/complete/task-runner-and-progress.md`
