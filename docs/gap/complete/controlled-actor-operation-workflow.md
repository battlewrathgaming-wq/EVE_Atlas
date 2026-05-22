# Gap To-Do: Controlled Actor Operation Workflow

Status: Complete
Priority: P1
Milestone: Controlled Actor/Area Operation

## Mission Statement

Prove one full actor-focused operator loop: define actor scope, collect or inspect safely, review evidence/observations, and optionally save assessment memory.

## Items For Completion

- Choose one actor target for fixture/offline workflow and one optional live-smoke target.
- Validate actor scope through backend services.
- Show live/API impact before live action.
- Run manual discovery or actor watch explicitly.
- Inspect queue/evidence/report state after completion.
- Render actor report observations.
- Save assessment artifact only if the operator chooses to.
- Confirm no passive view dispatches collection.

## Guardrails

- Do not imply affiliation, staging, or intent without assessment.
- Manual discovery queues refs only.
- ESI expansion remains explicit.
- Assessment remains memory, not evidence.
- Live smoke stays capped and disposable.

## Completion Signal

There is a documented actor operation path from scope to report/assessment, with task/run details and boundary notes.

## Completed Workflow Proof

Offline fixture target:

```txt
Atlas Scout [characterID: 90000002]
```

Verification commands run:

```txt
npm.cmd run verify:controlled-workflow
npm.cmd run verify:actor-bulk
npm.cmd run verify:renderer-shell
```

Observed controlled workflow result:

```txt
status: controlled workflow verified
db_path: F:\Projects\AURA-Atlas\.tmp\controlled-workflow.sqlite
killmails: 3
activity_events: 21
discovery_refs: 7
fetch_runs: 4
```

## Actor Loop Proven

The fixture workflow proves this actor-focused path:

```txt
typed actor scope
-> manual actor discovery
-> queued zKill refs only
-> manual ESI expansion
-> stored killmail evidence
-> actor watch capped expansion
-> queue/report state inspection
-> actor evidence report
-> metadata readiness report
```

The renderer shell supports the same operator-facing stages through:

- Scopes view for `scope.validate`
- Actions view for `manual.discovery` preflight/execution
- Queue / Watches view for `queue.selection` and manual expansion preflight/execution
- Tasks view for task progress/result inspection
- Reports view for `report.actor`
- Reports view for deliberate `assessment.create`, `assessment.list`, and `assessment.get`

## Boundary Notes

- Manual discovery queues refs only and performs zero ESI expansion.
- ESI expansion remains explicit through the queue/manual expansion path.
- Actor watch collection remains service/task-backed and capped.
- Actor report observations derive from stored killmails/activity events.
- Assessment artifact creation is optional and requires operator input.
- Passive renderer views are still guarded by `verify:renderer-shell` against direct `actor.watch` and `system.radius.watch` dispatch.

## Live Smoke Decision

No new live actor smoke was run in this slice.

Reason:

- The controlled actor loop is already proven offline with deterministic fixtures.
- The separate `live-expansion-smoke.md` task is the right place to choose a target/window that intentionally returns live zKill refs and at least one ESI expansion.

## Related Documents

- `docs/gap/complete/evidence-creating-ui-actions.md`
- `docs/gap/complete/assessment-report-workflow-ui.md`
- `docs/contracts/scope-definition-contract.md`
- `docs/terms/work-products.md`
