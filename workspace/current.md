# Current Workspace Packet

Status: Active
Updated: 2026-05-23
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Aggressive Testing And Operator Bug Hunting
Roadmap source: `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
Sequence: HS10
Previous accepted handshake: `workspace/DevHS08-atlas-partial-failure-transaction-integrity.md`
Latest Overseer review: `workspace/OverseerHS09-partial-failure-review.md`
Current executor: Dev
Current focus: SDE lookup builder failure modes
Expected output: DevHS10-atlas-sde-builder-failure-modes.md
Archive target on milestone completion: `workspace/complete/milestone-aggressive-testing/`

## Purpose

This is the only active executable work packet for AURA Atlas.

The former `docs/gap` task lifecycle has been archived under `docs/archive/deprecated-gap-workflow-2026-05-23/`. Those files are historical context only. This packet carries the executable runway.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/DevHS08-atlas-partial-failure-transaction-integrity.md`
- `workspace/ProjectPlannerHS06-operator-investigation-ux.md`
- `workspace/OverseerHS09-partial-failure-review.md`
- `docs/index.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\workspace-structure-authority.md`

## Runway Objective

Continue Atlas aggressive testing with SDE lookup builder failure-mode pressure: prove failed download/source/import paths fail visibly, clean up safely, and preserve existing lookup tables and evidence doctrine.

## Accepted Planner Requirement

Carry this accepted planning requirement forward for future product/UI work:

```txt
Mark = operator interest/tagging.
Watch = active watch system only.
```

Do not implement the Operator Investigation Desk UX in this packet. Preserve the Mark/Watch distinction if any touched docs or tests mention operator interest or watch behavior.

## Ordered Runway

1. Existing SDE builder review:
   - inspect `sde:build-lookups`, `sde.build-lookups`, SDE current-state docs, temp/source cleanup behavior, and current verification
   - identify deterministic failure injection points for download/source/import/cleanup behavior
   - avoid real network download unless explicitly authorized
2. SDE failure-mode coverage:
   - cover failed download or source acquisition without mutating existing lookup tables
   - cover bad zip/source or malformed source input with visible diagnostics
   - cover interrupted import while preserving prior valid lookup tables
   - cover cleanup behavior for default disposable source files
   - cover `AURA_ATLAS_KEEP_SDE_SOURCE=1` preserving source artifacts as intended
3. Evidence and diagnostics assertions:
   - assert SDE lookup failures do not mutate killmail evidence, activity events, queue refs, or assessment artifacts
   - assert existing SDE lookup tables remain usable after failure
   - assert failures leave reviewable run/status diagnostics without broad raw dumps
   - assert rerun behavior is explicit and does not hide prior failure state
4. Documentation/test index reconciliation:
   - update durable docs only where command inventory, current-state truth, failure classes, or milestone meaning changes
   - do not recreate `docs/gap` task files
5. Next-runway recommendation:
   - recommend the next bounded packet after this slice, with larger synthetic scale pressure as the expected default unless findings point to a more urgent blocker

## Explicitly Deferred From This Packet

- Larger synthetic scale pressure.
- App restart recovery after running or failed tasks.
- Live API success smoke without explicit operator authorization.
- Operator Investigation Desk UX implementation.
- Converting the aggressive-testing audit into a roadmap milestone doc.
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
