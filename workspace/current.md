# Current Workspace Packet

Status: Active
Updated: 2026-05-23
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Aggressive Testing And Operator Bug Hunting
Roadmap source: `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
Sequence: HS05
Previous accepted handshake: `workspace/DevHS03-atlas-task-concurrency-cancellation.md`
Latest Overseer review: `workspace/OverseerHS04-task-concurrency-review.md`
Current executor: Dev
Current focus: adversarial evidence fixtures
Expected output: DevHS05-atlas-adversarial-evidence-fixtures.md
Archive target on milestone completion: `workspace/complete/milestone-aggressive-testing/`

## Purpose

This is the only active executable work packet for AURA Atlas.

The former `docs/gap` task lifecycle has been archived under `docs/archive/deprecated-gap-workflow-2026-05-23/`. Those files are historical context only. This packet carries the executable runway.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/DevHS03-atlas-task-concurrency-cancellation.md`
- `workspace/OverseerHS04-task-concurrency-review.md`
- `docs/index.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\workspace-structure-authority.md`

## Runway Objective

Continue Atlas aggressive testing with adversarial evidence fixtures that attack malformed, incomplete, duplicated, inconsistent, and poorly labelled evidence inputs while preserving Atlas evidence doctrine and reviewable diagnostics.

## Ordered Runway

1. Existing ingestion/report fixture review:
   - inspect current fixture ingestion, idempotency, manual expansion, queue, report, evidence-rule, and data-quality warning verification
   - identify the smallest existing harness or new focused harness for adversarial fixture coverage
   - prefer deterministic offline fixtures over broad runtime mutation
2. Adversarial fixture coverage:
   - cover malformed or incomplete killmail payloads where the system should reject or warn visibly
   - cover missing IDs, unresolved labels, NPC-only participants, duplicate corporation/alliance appearances, changed hashes, inconsistent queued refs, partially hydrated labels, and stale or mismatched SDE metadata where practical
   - keep each case evidence-bound: either stored as valid evidence with warnings, rejected before evidence mutation, or preserved as possible evidence/discovery metadata as doctrine requires
3. Evidence and report assertions:
   - assert raw expanded killmail evidence remains immutable once accepted
   - assert discovery refs remain possible evidence until expansion
   - assert reports expose uncertainty, unresolved IDs, warning groups, and sample limits without inventing proof language
   - assert assessment memory is not created by passive/report fixture paths
4. Documentation/test index reconciliation:
   - update durable docs only where command inventory, current-state truth, failure classes, or milestone meaning changes
   - do not recreate `docs/gap` task files
5. Next-runway recommendation:
   - recommend the next bounded packet after this slice, with partial failure/transaction integrity as the expected default unless findings point to a more urgent blocker

## Explicitly Deferred From This Packet

- Broader partial failure and transaction-integrity expansion beyond fixture ingestion/report assertions needed here.
- SDE lookup builder failure modes.
- Larger synthetic scale pressure.
- App restart recovery after running or failed tasks.
- Live API success smoke without explicit operator authorization.
- Converting the aggressive-testing audit into a roadmap milestone doc.
- Broad workflow-documentation cleanup outside this packet.

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
npm.cmd run verify:adversarial-fixtures
Result: passed.

npm.cmd run verify:evidence-rules
Result: passed; evidence-rule manifest now includes verify:adversarial-fixtures.

npm.cmd run verify:fixture
Result: passed.

npm.cmd run verify:idempotent
Result: passed.

npm.cmd run verify:manual-discovery
Result: passed.

npm.cmd run verify:report-response
Result: passed.

npm.cmd run verify:all
Result: passed; all verification group passed with 59 offline scripts, including verify:adversarial-fixtures.
```

Files changed:

```txt
package.json
scripts/verify-group.js
scripts/verify-evidence-rule-regressions.js
scripts/verify-adversarial-evidence-fixtures.js
docs/current-state/current-evidence-pipeline.md
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS05-atlas-adversarial-evidence-fixtures.md
```

Findings:

```txt
Added focused offline adversarial fixture verification for malformed missing killmail_id rejection before mutation; incomplete identifiable killmail persistence with warnings; NPC-only attacker warnings; duplicate corporation/alliance attacker dedupe; changed-hash/checksum rediscovery immutability; malformed/duplicate queue ref filtering; queue preview non-evidence boundary; unresolved labels; missing/stale type metadata exposure; report uncertainty/proof-language guard; and passive/report paths not creating assessment artifacts.
No runtime ingestion/report behavior required changes; this packet adds regression coverage and test-index documentation.
Planner advisory artifact ProjectPlannerHS06-operator-investigation-ux.md was not read or touched per user instruction.
```

Deferrals:

```txt
Partial failure and transaction-integrity expansion remains the recommended next bounded packet.
SDE lookup builder failure modes, larger synthetic scale pressure, app restart recovery, live success smoke, roadmap conversion, and broad documentation cleanup remain deferred.
```

## Dev Handoff

Dev fills this in when work is complete:

- completed tasks: Reviewed existing ingestion/queue/report/evidence-rule harnesses and added deterministic adversarial evidence fixture coverage.
- tests added/updated: Added `verify:adversarial-fixtures`, wired it into `verify:all`, and added it to the evidence-rule manifest.
- verification output: Focused evidence checks passed; `verify:all` passed with 59 offline scripts.
- failures found: No runtime failure found. Existing behavior already preserved doctrine; this slice locked it down with coverage.
- handshake created: workspace/DevHS05-atlas-adversarial-evidence-fixtures.md
- remaining risk: Broader partial-failure/transaction-integrity paths, SDE builder failure modes, app restart recovery, and larger scale pressure remain untested in this packet.

## Overseer Review

Overseer fills this in after Dev handoff:

- accepted / redirected:
- doctrine drift:
- architecture risk:
- state updates needed:
- next packet:
