# Current Workspace Packet

Status: Active
Updated: 2026-05-23
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Aggressive Testing And Operator Bug Hunting
Roadmap source: `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
Sequence: HS01
Previous accepted handshake: None under the new workspace handshake sequence
Current executor: Dev
Current focus: operator rugged smoke, live refusal matrix, and task concurrency pressure
Expected output: DevHS01-atlas-aggressive-operator-runway.md
Archive target on milestone completion: `workspace/complete/milestone-aggressive-testing/`

## Purpose

This is the only active executable work packet for AURA Atlas.

The former `docs/gap` task lifecycle has been archived under `docs/archive/deprecated-gap-workflow-2026-05-23/`. Those files are historical context only. This packet now carries the executable runway.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `docs/index.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\workspace-structure-authority.md`

## Runway Objective

Continue Atlas aggressive testing by attacking operator-path ruggedness, live API refusal/smoke boundaries, and task concurrency/cancellation behavior without broadening product scope or weakening evidence doctrine.

## Ordered Runway

1. Electron/operator rugged smoke:
   - exercise the main operator path through readiness, demo/local data setup, queue/watch surfaces, manual discovery and expansion preflights, report loading, hydration preflight, assessment review/save, trace pack, and snapshot preflight where fixtures allow
   - include long labels, unresolved IDs, empty states, partial samples, warnings, and narrow window states where practical
   - keep smoke artifacts under project-local `.tmp`
2. Live API refusal and smoke matrix:
   - prove live work refuses safely when gates are closed
   - keep live API smoke explicit, narrow, and outside `verify:all`
   - record safe refusal behavior even when live smoke is not authorized
3. Task concurrency and cancellation stress:
   - stress lock classes, cancellation during HTTP/worker paths, failure followed by rerun, and overlap between exclusive/mutating/read-only tasks where deterministic harnesses exist
   - prove tasks fail visibly, preserve evidence, release locks, and leave reviewable diagnostics
4. Documentation/test index reconciliation:
   - update durable docs only where command inventory, current-state truth, or milestone meaning changes
   - do not recreate `docs/gap` task files
5. If the first three slices are completed cleanly, recommend the next runway for adversarial evidence fixtures and larger synthetic scale pressure.

## Guardrails

- zKillboard is discovery only.
- Expanded ESI killmails are evidence.
- Assessment artifacts are deliberate operator memory, not evidence.
- UI presents and scopes evidence; UI is not authority.
- Passive views must not collect evidence.
- Live APIs require explicit gates and narrow scopes.
- Support/debug artifacts must not dump broad raw evidence by default.
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
