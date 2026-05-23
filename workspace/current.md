# Current Workspace Packet

Status: Active
Updated: 2026-05-23
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Aggressive Testing And Operator Bug Hunting
Roadmap source: `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
Sequence: HS14
Previous accepted handshake: `workspace/DevHS12-atlas-large-synthetic-scale-pressure.md`
Latest Overseer review: `workspace/OverseerHS13-large-scale-review.md`
Current executor: Dev
Current focus: app restart recovery after running or failed tasks
Expected output: DevHS14-atlas-app-restart-recovery.md
Archive target on milestone completion: `workspace/complete/milestone-aggressive-testing/`

## Purpose

This is the only active executable work packet for AURA Atlas.

The former `docs/gap` task lifecycle has been archived under `docs/archive/deprecated-gap-workflow-2026-05-23/`. Those files are historical context only. This packet carries the executable runway.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/DevHS12-atlas-large-synthetic-scale-pressure.md`
- `workspace/ProjectPlannerHS06-operator-investigation-ux.md`
- `workspace/OverseerHS13-large-scale-review.md`
- `docs/index.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\workspace-structure-authority.md`

## Runway Objective

Complete the remaining non-live aggressive-testing slice: prove app restart/reinitialization after running, cancelled, or failed task scenarios leaves evidence, queues, task history, and support diagnostics reviewable without hidden collection or silent recovery claims.

## Accepted Planner Requirement

Carry this accepted planning requirement forward for future product/UI work:

```txt
Mark = operator interest/tagging.
Watch = active watch system only.
```

Do not implement the Operator Investigation Desk UX in this packet. Preserve the Mark/Watch distinction if any touched docs or tests mention operator interest or watch behavior.

## Ordered Runway

1. Existing restart/session-state review:
   - inspect task runner persistence boundaries, app readiness, session-armed watch executor state, task history/reporting, and existing failure/cancellation tests
   - identify deterministic restart or reinitialization harnesses that do not require live APIs or GUI smoke unless clearly justified
2. Restart/recovery coverage:
   - cover restart/reinitialization after a running or cancelled task where current architecture supports deterministic simulation
   - cover restart/reinitialization after failed service work
   - prove volatile session state, especially armed watch execution, does not silently resume collection
   - prove persisted evidence, queue refs, fetch/API logs, and diagnostics remain reviewable
3. Evidence and diagnostics assertions:
   - assert no hidden live/API calls, evidence expansion, metadata hydration, assessment creation, or watch execution happens on restart
   - assert recovery language is honest about volatile versus persisted state
   - assert support/debug artifacts remain bounded and exclude broad raw evidence
4. Documentation/test index reconciliation:
   - update durable docs only where command inventory, current-state truth, failure classes, or milestone meaning changes
   - do not recreate `docs/gap` task files
5. Next recommendation:
   - recommend whether the aggressive-testing milestone is ready for Overseer closure review, with any remaining live success smoke or roadmap conversion clearly framed as gated/human-decision work

## Explicitly Deferred From This Packet

- Live API success smoke without explicit operator authorization.
- Real SDE network download.
- Operator Investigation Desk UX implementation.
- Converting the aggressive-testing audit into a roadmap milestone doc unless required for milestone closure recommendation.
- Broad workflow-documentation cleanup outside this packet.

## Guardrails

- zKillboard is discovery only.
- Expanded ESI killmails are evidence.
- SDE source files are import material; SQLite lookup tables are runtime metadata.
- Assessment artifacts are deliberate operator memory, not evidence.
- UI presents and scopes evidence; UI is not authority.
- Passive views must not collect evidence.
- Live APIs require explicit gates and narrow scopes.
- Support/debug artifacts must not dump broad raw evidence by default.
- Mark means operator interest/tagging, not active collection.
- Watch means active watch system behavior only.
- Do not convert assessment memory into proof language.
- Do not use bug-hunting helpers as product features unless accepted.
- Archived gap files are historical context, not active work packets.

## Stop Conditions

Return to chat before continuing if:

- live network/API action is needed without explicit operator authorization
- a test failure reveals a doctrine or architecture decision
- current-state, audit assessment, observed code, and this packet disagree materially
- evidence/private runtime DB artifacts would need to be retained, exposed, or staged
- the working tree contains overlapping unknown changes in files needed for this runway

## Verification Required

Run the focused verification added or affected by the work, then run:

```powershell
npm.cmd run verify:all
```

Run only when relevant and authorized by the packet or Overseer:

```powershell
npm.cmd run smoke:electron
```

Do not run by default:

- live API smoke without explicit gate/operator approval
- real SDE network download without explicit operator approval
- destructive retention/pruning operations
- broad private runtime DB export outside existing verification harnesses

## Evidence

Dev updates this before handoff.

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
- handshake created:
- remaining risk:

## Overseer Review

Overseer fills this in after Dev handoff:

- accepted / redirected:
- doctrine drift:
- architecture risk:
- state updates needed:
- next packet:
