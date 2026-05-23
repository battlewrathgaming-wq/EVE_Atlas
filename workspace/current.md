# Current Workspace Packet

Status: Active
Updated: 2026-05-23
Owner: Overseer planning, Dev execution

## Coordination State

Active milestone: Aggressive Testing And Operator Bug Hunting
Roadmap source: `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
Sequence: HS03
Previous accepted handshake: `workspace/DevHS01-atlas-operator-refusal-smoke.md`
Latest Overseer review: `workspace/OverseerHS02-operator-refusal-review.md`
Current executor: Dev
Current focus: task concurrency and cancellation pressure
Expected output: DevHS03-atlas-task-concurrency-cancellation.md
Archive target on milestone completion: `workspace/complete/milestone-aggressive-testing/`

## Purpose

This is the only active executable work packet for AURA Atlas.

The former `docs/gap` task lifecycle has been archived under `docs/archive/deprecated-gap-workflow-2026-05-23/`. Those files are historical context only. This packet carries the executable runway.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/DevHS01-atlas-operator-refusal-smoke.md`
- `workspace/OverseerHS02-operator-refusal-review.md`
- `docs/index.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/audits/audit-2026-05-23-aggressive-testing-and-bug-hunt-assessment.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\workspace-structure-authority.md`

## Runway Objective

Continue Atlas aggressive testing with a bounded task pressure slice: prove task overlap, cancellation, failure, rerun, and lock-release behavior remains visible, evidence-safe, and diagnostic-rich.

## Ordered Runway

1. Task inventory and existing harness review:
   - inspect service/task lock classes, cancellation pathways, HTTP timeout handling, worker/background execution, and existing verification scripts
   - identify deterministic task pairs for exclusive, mutating, metadata, evidence-creating, destructive/preflight, and read-only overlap checks
   - do not invent live/API-dependent pressure where an offline deterministic harness can prove the boundary
2. Concurrency and cancellation stress:
   - add or extend focused verification to cover overlapping tasks across lock classes
   - cover cancellation during an HTTP-bound or cancellation-aware path where deterministic simulation exists
   - cover a task failure followed by immediate rerun
   - prove locks release after cancellation or failure
3. Evidence and diagnostics assertions:
   - assert evidence rows, queue refs, assessment artifacts, and support artifacts are preserved or changed only as intentionally scoped by the tested task
   - assert failures are visible through task status/history/result/error payloads
   - assert diagnostics are reviewable without dumping broad raw evidence
4. Documentation/test index reconciliation:
   - update durable docs only where command inventory, current-state truth, or milestone meaning changes
   - do not recreate `docs/gap` task files
5. Next-runway recommendation:
   - recommend the next bounded packet after this slice, with adversarial evidence fixtures as the expected default unless findings point to a more urgent blocker

## Explicitly Deferred From This Packet

- Adversarial evidence fixture suite.
- Partial failure and transaction-integrity expansion beyond task failure/rerun behavior needed here.
- SDE lookup builder failure modes unless required as a deterministic exclusive-task target.
- Larger synthetic scale pressure.
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
npm.cmd run verify:task-concurrency
Result: passed after correcting the trace-pack assertion to distinguish declared exclusions from payload dumps.

npm.cmd run verify:task-runner
Result: passed.

npm.cmd run verify:http-timeouts
Result: passed.

npm.cmd run verify:background-execution
Result: passed.

npm.cmd run verify:operator-debug-trace
Result: passed.

npm.cmd run verify:all
Result: passed; all verification group passed with 58 offline scripts, including verify:task-concurrency.
```

Files changed:

```txt
package.json
scripts/verify-group.js
scripts/verify-task-concurrency-cancellation.js
docs/current-state/current-evidence-pipeline.md
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS03-atlas-task-concurrency-cancellation.md
```

Findings:

```txt
Added focused offline task pressure verification covering: evidence-task same-scope lock conflicts, read-only work during evidence tasks, exclusive/destructive global lock conflicts, metadata same-scope serialization with different-scope allowance, HTTP-bound cancellation, lock release after cancellation, task failure followed by same-scope rerun, preserved progress/warning/error diagnostics, and preserved evidence/storage counts.
The service diagnostic check creates a gate-blocked manual.discovery task, confirms task history keeps LIVE_API_DISABLED, writes a bounded debug trace pack, confirms raw_esi_payload is declared as excluded, and checks broad raw payload fields are not dumped.
No runtime task-runner behavior required changes; the pressure slice is verification coverage and documentation/index reconciliation.
One test assertion was corrected during development: trace packs intentionally mention raw_esi_payload in their exclusions list; the final check asserts exclusion declaration without treating that declaration as a payload leak.
```

Deferrals:

```txt
Adversarial evidence fixture suite remains the recommended next bounded packet.
Partial failure/transaction-integrity expansion beyond task failure/rerun, SDE builder failure modes, larger synthetic scale pressure, live success smoke, roadmap milestone conversion, and broad documentation cleanup remain deferred.
```

## Dev Handoff

Dev fills this in when work is complete:

- completed tasks: Reviewed task runner/service lock classes and added deterministic offline pressure coverage for overlap, cancellation, failure, rerun, lock release, evidence preservation, and diagnostics.
- tests added/updated: Added `verify:task-concurrency`, wired it into `verify:all`, and reconciled current-state verification docs.
- verification output: Focused checks passed; `verify:all` passed with 58 offline scripts.
- failures found: No runtime failure found. A draft assertion mistook trace-pack exclusion wording for a raw payload dump and was corrected before final verification.
- handshake created: workspace/DevHS03-atlas-task-concurrency-cancellation.md
- remaining risk: Coverage is deterministic task/service pressure, not app-restart recovery or large-scale pressure. Adversarial evidence fixtures are the recommended next packet.

## Overseer Review

Overseer fills this in after Dev handoff:

- accepted / redirected:
- doctrine drift:
- architecture risk:
- state updates needed:
- next packet:
