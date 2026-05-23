# Gap To-Do: Controlled Area Operation Workflow

Status: Complete
Priority: P1
Milestone: Controlled Actor/Area Operation

## Mission Statement

Prove one system/radius-focused operator loop: define watched area, collect or inspect safely, review repeated actors and multi-system presence, and preserve assessment only by deliberate action.

## Items For Completion

- Choose a system/radius scope with local SDE topology available.
- Validate area scope and caps through backend services.
- Show radius, included systems, lookback, max systems, max refs, and max expansions.
- Run manual discovery or system/radius watch explicitly.
- Inspect queue/evidence/report state after completion.
- Render radius/system observations.
- Highlight repeated presence as observation, not proof.
- Confirm passive views do not dispatch collection.

## Guardrails

- Area scope is a slicer, not evidence itself.
- Repeated appearances are evidence-backed observations, not ownership claims.
- Disposition labels filter/present but do not erase events.
- Live smoke stays capped and disposable.

## Completion Signal

There is a documented area operation path from scope to report/observation, with task/run details and boundary notes.

## Completed Workflow Proof

Offline fixture area target:

```txt
Atlas Prime [solarSystemID: 30000001]
Radius: 1 jump
Included fixture systems: Atlas Prime, Atlas Gate, Atlas Reach
```

Verification commands run:

```txt
npm.cmd run verify:planner
npm.cmd run verify:collector
npm.cmd run verify:radius-report
npm.cmd run verify:bulk-synthetic
```

## Area Loop Proven

The fixture workflow proves this system/radius-focused path:

```txt
local SDE topology
-> radius planning
-> included systems and caps
-> scoped zKill discovery by system
-> global dedupe/cache skip
-> capped ESI expansion
-> stored killmail evidence
-> radius evidence/observation report
-> repeated and multi-system presence display
```

Area scope behavior verified:

- radius 0 and radius 1 planning use local topology
- included systems and zKill request counts are planned before collection
- per-system ref cap and global expansion cap are preserved
- runtime SDE zip lookup is rejected; reports use SQLite lookup tables
- local lookup failures are logged rather than silently falling back
- repeated presence is presented as observation, not ownership/staging proof
- watchlist promotion does not mutate stored activity events
- radius reports include evidence basis, collection provenance, observations, warnings, source statement, and partial-sample language

The renderer shell supports the same operator-facing stages through:

- Scopes view for `system_radius_watch` validation
- Queue / Watches view for passive watch schedule/status inspection
- Queue / Watches view for session Arm/Disarm state
- Actions view for manual system/radius discovery
- Queue / Watches view for manual expansion of selected queued refs
- Tasks view for task progress/result inspection

## Boundary Notes

- Area scope is a slicer over systems/time, not evidence.
- zKill discovery refs remain possible evidence until ESI expansion succeeds.
- Multi-system presence is an evidence-backed observation, not proof of residence, staging, ownership, or affiliation.
- Disposition/watchlist metadata affects presentation/attention only; it does not erase or mutate stored events.
- Passive renderer views remain non-collecting.

## Live Smoke Decision

No new live radius smoke was run in this slice.

Reason:

- Offline area planning/collection/report behavior is already deterministic and verified.
- The separate `live-expansion-smoke.md` task should choose one current live target/window that returns refs and expands at least one killmail through the controlled queue path.

## Related Documents

- `docs/gap/complete/queue-and-watch-status-views.md`
- `docs/gap/complete/session-armed-watch-executor-implementation.md`
- `docs/audits/audit-2026-05-22-live-operational-smoke.md`
- `docs/contracts/scope-definition-contract.md`
