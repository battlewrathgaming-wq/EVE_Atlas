# Gap To-Do: Background Worker Execution

Status: Open
Priority: P1

## Actionables

- Move heavy backend actions off the Electron main process path.
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

## Guardrails

- Do not let long-running DB/report/import work block IPC responsiveness.
- Do not introduce unsafe concurrent writes to the same SQLite DB.
- Preserve task locking semantics.
- Preserve evidence immutability and queue scope rules.
- Keep live API gates intact in background execution.

## Completion Signal

A test or smoke path starts a long-running fixture task while readiness/report/list-task IPC calls still respond. Evidence-writing tasks remain serialized as intended.

## Related Files

- `src/main/main.js`
- `src/main/db/database.js`
- `src/main/services/taskRunner.js`
- `src/main/workers/*`
- `docs/gap/complete/task-runner-and-progress.md`
