# Gap To-Do: Watch Authoring UI

Status: Complete
Priority: P2
Milestone: Structured Area Review And Watch Authoring

## Mission Statement

Expose watch creation and update as explicit operator intent, not passive collection.

Watch authoring should let a user preserve interest in an actor or area without immediately treating that action as evidence ingestion.

## Items For Completion

- Add UI controls for actor watch creation/update.
- Add UI controls for system/radius watch creation/update.
- Use backend scope validation for watch payloads.
- Call `watch.create`, `watch.update`, and `watch.list` through the service bridge.
- Show interval, active state, scope, disposition/interest fields where available, and next due/backoff state.
- Keep watch execution separate through the existing session-armed executor.
- Add verification that watch authoring does not call collection services.
- Refresh watch schedule/status after metadata-only watch changes.

## Guardrails

- Creating a watch must not run zKill or ESI collection.
- Updating a watch must not mutate stored evidence.
- Session arming remains explicit and separate.
- Interest/disposition labels are presentation/assessment aids; they must not erase activity events.

## Completion Signal

The renderer can create/update/list watches as metadata-only work, and collection still occurs only through explicit manual actions or session-armed due-watch execution.

## Completion Notes

Completed on 2026-05-22.

The Queue / Watches pane now includes explicit actor watch and system/radius watch authoring controls. Both paths validate scope through `scope.validate`, save intent through metadata-only `watch.create`, call `watch.list`, and refresh scheduler status. Watch authoring does not dispatch collection; collection remains separated behind manual evidence actions and the session-armed executor.

Verification:

- `npm.cmd run verify:mutating-services`
- `npm.cmd run verify:renderer-shell`
- `npm.cmd run smoke:electron`

## Related Documents

- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/gap/complete/watch-scheduler-and-backoff.md`
- `docs/gap/complete/session-armed-watch-executor-implementation.md`
- `docs/terms/entity-interest.md`
