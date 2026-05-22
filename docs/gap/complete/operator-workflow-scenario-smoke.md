# Operator Workflow Scenario Smoke

Milestone: Operator Workflow Closure And Debuggability

## Mission

Create an offline scenario smoke that exercises the operator loop through the service/task boundary.

The goal is to catch workflow regressions before live work or UI polish hides them.

## Scenario

Use fixture/fake clients to simulate:

```txt
scope validation
-> manual discovery
-> queue report
-> selected manual expansion
-> metadata hydration where relevant
-> actor or radius report
-> deliberate assessment artifact creation
```

## Actionables

- Keep the scenario offline.
- Use a disposable DB under `.tmp`.
- Invoke the same service/task paths the renderer uses where practical.
- Verify manual discovery writes queued refs but no evidence.
- Verify manual expansion writes ESI-backed evidence.
- Verify reports derive observations only from stored evidence.
- Verify assessment artifacts cite validated stored killmail IDs.
- Verify task history/status surfaces are coherent enough for renderer display.
- Include corpus health and snapshot preflight as support checks if practical, without creating snapshots unless the scenario explicitly confirms the action.

## Acceptance Checks

- Scenario is included in `verify:all`.
- Scenario fails if queue refs are treated as observations.
- Scenario fails if assessment artifacts cite non-local evidence without explicit unverified status.
- Scenario fails if renderer/service actions bypass scope validation.
- Scenario confirms support/readiness products do not become evidence, observation, or assessment.

## Dev Notes

```txt

```
