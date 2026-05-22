# Gap To-Do: Evidence-Creating UI Actions

Status: Open
Priority: P1
Milestone: Presentation Validation And Controlled Execution

## Actionables

- Choose the first evidence-creating UI action deliberately.
- Prefer a low-risk path first: manual discovery, manual expansion, or metadata hydration.
- Wire actions through `atlas:service:invoke`, backend scope validation, live gates, and task execution.
- Show caps, scope, live/API state, and expected effect before running the action.
- Route progress, warnings, errors, and result summaries through the task UI.

## Task Requirements

Evidence-creating UI actions should use existing service commands:

- `manual.discovery`
- `manual.expansion`
- `actor.watch`
- `system.radius.watch`
- `metadata.hydration`
- `sde.import.topology`
- `sde.import.inventory`

Initial implementation should not try to expose all of them at once.

Recommended first slice:

1. Manual discovery UI: zKill discovery only, zero ESI expansion.
2. Manual expansion UI: selected queue refs, capped ESI expansion.
3. Metadata hydration UI: report-scoped readability improvement.

Routine actor/system watches should wait until the task and confirmation patterns are proven.

## Guardrails

- No evidence-creating action should run from page load, refresh, or passive preview.
- No live action should run without visible user action.
- Scope validation remains backend authoritative.
- Collection caps must be visible before execution.
- Use task wrapping for long-running or mutating actions.
- Do not let UI state become evidence or assessment.

## Completion Signal

At least one evidence-creating action can be started from the renderer through the service/task boundary, inspected in task progress, and verified without direct backend imports.

## Related Documents

- `docs/contracts/scope-definition-contract.md`
- `docs/gap/complete/ipc-mutating-action-services.md`
- `docs/gap/complete/task-progress-and-cancellation-ui.md`
- `docs/gap/complete/live-api-gate-ux.md`
- `docs/gap/complete/ui-language-contract.md`
