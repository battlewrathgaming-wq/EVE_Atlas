# Workflow Prompts

Use these prompts to keep Overseer and Dev sessions aligned without making the user relay context by hand.

## User To Overseer: Plan Or Refresh

```txt
Overseer: review current repo state, docs, audits, gap packets, and tree health.
Define or refresh the next milestone in workspace/current.md.
Keep it feature-aligned and scoped.
Update durable docs only if project truth changed.
Leave the repo ready for Dev to use the dot protocol.
```

## User To Dev: Dot Signal

```txt
.
```

Meaning:

```txt
Read workspace/README.md, workspace/00-dot-protocol.md, and workspace/current.md.
Read the linked source docs.
Check git status.
Execute the task queue in priority order.
Update Evidence and Dev Handoff in workspace/current.md.
Run required verification.
Return only for blockers or final handoff.
```

## User To Dev: Narrow Execution

```txt
Dev: use the dot protocol, but only execute P0 in workspace/current.md.
Do not broaden scope.
Leave evidence and verification in the packet.
```

## User To Overseer: Review Dev Work

```txt
Overseer: review Dev handoff in workspace/current.md.
Check git status, docs/current-state, latest audits, and completed/to-do gaps.
Accept, redirect, or split the work.
Update state records only where truth changed.
Refresh workspace/current.md for the next Dev session.
```

## User To Overseer: Create Next Packet

```txt
Overseer: create the next overwriteable workspace packet.
Use current-state and feature/roadmap docs as source of truth.
Rank tasks P0/P1/P2.
Write tasks as per-line actionable guidance, not micromanagement.
Include guardrails, verification, evidence expectations, and return conditions.
```

## Dev Blocker Response Shape

```txt
Blocked on: <specific blocker>
Why it matters: <risk or missing contract>
What I checked: <files/commands>
Safe next options: <2-3 options>
Recommendation: <one preferred option>
```

## State Reset Prompt

```txt
Overseer: perform a state reset.
Read current-state, latest audits, workspace/current.md, and git status.
Identify stale documentation, retired packets, and doctrine drift.
Rewrite workspace/current.md to match current truth.
Create or update audit/current-state/gap records only where useful for future sessions.
```

## Handoff Shape For Dev

```txt
Completed:
Verified:
Changed files:
Evidence left in:
Risks/deferrals:
Recommended next slice:
```

## Handoff Shape For Overseer

```txt
Milestone verdict:
Accepted work:
Doctrine drift:
Architecture risk:
State/docs updated:
Next Dev packet:
```
