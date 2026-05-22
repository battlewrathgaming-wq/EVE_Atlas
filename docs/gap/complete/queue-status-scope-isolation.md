# Complete: Queue Status Scope Isolation

Status: Complete
Priority: P1

## Actionables

- Scope-qualify queue status updates for selected, expanded, cached, and failed refs.
- Ensure queue updates target the intended `discovered_by_type` and `discovered_by_id` when available.
- Preserve separate queue provenance when the same `killmail_id + hash` appears in multiple scopes.
- Add regression coverage for the same killmail ref appearing in manual discovery, actor watch, and system/radius watch lanes.

## Task Requirements

`discovered_killmail_refs` is keyed by:

```txt
killmail_id + killmail_hash + discovered_by_type + discovered_by_id
```

Queue state transitions should respect the same scope identity as queue insertion.

## Current Implementation

- Queue transition helpers now support scoped identity through `discovered_by_type` and `discovered_by_id`.
- Pending queue rows return scope identity so queue-drain paths can preserve provenance.
- Manual expansion, actor watch, and system/radius watch pass scope identity when marking refs selected, expanded, cached, or failed.
- Legacy unscoped repository behavior remains available for older direct helper usage, but current workers use scoped transitions.

## Guardrails

- Manual discovery refs must not be silently drained or reclassified by routine watches.
- Routine actor/system watches must not erase manual queue intent.
- One killmail can be discovered by several scopes; each scope's provenance should remain understandable.
- Queue refs remain staging/provenance metadata, not evidence.

## Verification

- `verify:queue-scope-isolation`
- `verify:manual-discovery`
- `verify:actor-watch`
- `verify:collector`

## Completion Signal

A fixture proves the same `killmail_id + hash` can exist under multiple discovery scopes, and expanding/caching/failing one scoped row does not incorrectly mutate the others.

## Related Files

- `src/main/db/evidenceRepository.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `docs/contracts/discovery-queue-contract.md`
