# OverseerHS21: Lead Ergonomics Review

Date: 2026-05-23
Role: Overseer
Milestone: Operator Investigation Desk
Reviewed handoff: `workspace/DevHS20-operator-investigation-lead-ergonomics.md`

## Review Outcome

Accepted.

Dev completed the bounded HS20 packet by improving Investigation lead-input feedback, actor/system/radius routing, existing `scope.validate` use, local-SDE system-name resolution behavior, and route-specific operator guidance without adding live/API behavior or changing evidence doctrine.

## Verification Accepted

Dev reported:

```txt
npm.cmd run verify:renderer-shell
npm.cmd run smoke:electron
npm.cmd run verify:all
```

Accepted result:

- renderer shell verification passed
- Electron smoke passed after a route-cleanup bug was fixed
- `verify:all` passed with 61 scripts
- no live API smoke, real SDE network download, destructive retention/pruning, or private runtime DB export was run

## Review Notes

No doctrine drift or blocking architecture risk found.

The changes preserve the accepted Marked/Watch model, keep zKill links and killmail-ID paste support deferred, treat numeric IDs as durable facts, treat names as labels or resolver inputs, and keep queue refs as possible evidence until explicit ESI expansion succeeds.

## Follow-Up Packet

Next bounded Dev packet: stored-evidence investigation detail.

Default target:

- make a validated actor/system/radius lead show what Atlas already knows from stored evidence
- use existing report/evidence service paths where practical
- provide honest empty states when no stored evidence exists
- keep raw payloads and backend details secondary
- avoid live collection, new resolver services, automatic enrichment, assessment creation, or new product terminology
