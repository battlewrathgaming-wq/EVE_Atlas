# Current Workspace Packet

Status: Active
Updated: 2026-05-23
Owner: Overseer planning, Dev execution

## Purpose

This is the overwriteable current milestone/task packet for AURA Atlas.

Overseer may replace this file whenever the active milestone, task queue, or focus changes. Dev should treat this file as the current execution context when the user sends `.`.

## Current Milestone

Aggressive Testing And Operator Bug Hunting

Primary sources:

- `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
- `docs/gap/to-do/README.md`

## Intent

Increase confidence in Atlas as a local-first evidence workstation by testing hard boundaries, rugged operator paths, and failure behavior without expanding product scope.

Atlas should preserve:

- zKillboard as discovery only
- expanded ESI killmails as evidence
- assessment artifacts as deliberate operator memory, not evidence
- explicit live API gates
- scoped local-first operation
- reviewable artifacts for smoke/debug work

## Tree Health Requirement

Before implementation, Dev must run:

```powershell
git status --short
```

Rules:

- Do not ignore dirty tree state.
- Preserve unrelated user/Dev changes.
- If changes overlap the task, inspect them and work with them.
- Do not stage generated SDE, runtime DB, `.tmp`, cache, or smoke artifacts by default.
- If the tree is too ambiguous to proceed safely, return to chat.

## Source Documents

Read before implementation:

- `docs/index.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/tenets/tenets.md`
- `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
- `docs/gap/to-do/README.md`

## Guardrails

- UI presents and scopes evidence; UI is not authority.
- Live APIs require explicit gates and narrow scopes.
- Passive views must not collect evidence.
- Discovery refs are not evidence until expanded.
- Support/debug artifacts must not dump broad raw evidence by default.
- Do not convert assessment memory into proof language.
- Do not use bug-hunting helpers as product features unless accepted.

## Task Queue

Work top to bottom. Skip only with evidence and explanation.

### P0

1. Continue the first incomplete aggressive-testing packet:
   - `docs/gap/to-do/electron-operator-rugged-smoke.md`
   - `docs/gap/to-do/live-api-refusal-and-smoke-matrix.md`
   - `docs/gap/to-do/task-concurrency-and-cancellation-stress.md`
   - `docs/gap/to-do/documentation-drift-and-test-index.md`
2. Add or update deterministic verification.
3. Run `npm.cmd run verify:all`.

### P1

Continue after P0 packets or explicit direction:

- `docs/gap/to-do/adversarial-evidence-fixture-suite.md`
- `docs/gap/to-do/large-synthetic-scale-pressure.md`

### P2

Continue only after higher-priority work or explicit direction:

- Refresh docs/gap/to-do sequencing if completed packets have drifted.
- Create failure records for reusable bug classes found during aggressive testing.
- Add audit handover only when milestone state, risk, or doctrine changes.

## Evidence

Dev updates this section before handoff.

Verification run:

```txt
Not yet run for this packet.
```

Files changed:

```txt
Not yet recorded.
```

Findings:

```txt
Not yet recorded.
```

Deferrals:

```txt
Not yet recorded.
```

## Dev Handoff

Dev fills this in when work is complete:

- completed tasks:
- tests added/updated:
- verification output:
- failures found:
- failure records created:
- docs/gaps moved or updated:
- remaining risk:

## Overseer Review

Overseer fills this in after Dev handoff:

- accepted / redirected:
- doctrine drift:
- architecture risk:
- state updates needed:
- next packet:
