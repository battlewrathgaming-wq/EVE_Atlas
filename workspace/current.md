# AURA Atlas Current Work

Status: Idle after accepted deletion preflight refinement
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS69 read-only deletion preflight refinement is accepted. Atlas remains idle; no Dev packet is open. Production deletion execution is still absent and requires a future Human/Overseer packet.

Source of intent:

- Human direction on 2026-05-25: continue after accepted deletion policy decisions.
- Human trust decision on 2026-05-25: when the operator confirms deletion, Atlas should delete the selected deletable active data and retain no footprint.
- `workspace/OverseerHS70-hs69-deletion-preflight-review.md`
- `workspace/DevHS69-deletion-preflight-refinement.md`
- `workspace/OverseerHS69A-deletion-trust-no-footprint-decision.md`
- `workspace/OverseerHS68-deletion-recovery-assessment-decisions.md`
- `workspace/OverseerHS67-deletion-footprint-anchor-decision.md`
- `workspace/OverseerHS66-deletion-policy-human-decisions.md`
- `workspace/OverseerHS65-deletion-scope-backup-matrix.md`
- `workspace/OverseerHS64-production-deletion-policy-design.md`
- `workspace/OverseerHS63-deletion-policy-design-input.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `src/main/db/schema.sql`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted baseline:

- Production deletion execution does not exist.
- Retention/deletion behavior remains preflight-only.
- zKill `killmail_id` is a Discovery anchor.
- ESI-expanded and Atlas-written `killmail_id` is the Evidence-confirmed anchor.
- Retained deletion footprint is rejected.
- Deletion preflight reports no-footprint policy, not footprint candidate fields.
- `killmail_id + pilot_id`, `EVE_value`, `EVE_Pilot_value`, `EVE_rating`, `EVE_interest_score`, `Spare_1A`, and `Spare_1B` are rejected for deletion footprint.
- Snapshotting is accepted as the recovery posture for first production deletion, with honest disclosure that snapshots/backups may retain records removed from active storage.
- Assessment Memory is mutable, disposable, and quickly stale; it is not Evidence and must not become hidden retention.

## Executor

Current executor: none; awaiting Human / Overseer selection for the next bounded packet.

Expected handoff filename: none until a new packet is opened.

## Ordered Runway

1. Hold Atlas idle until the Human selects the next bounded packet.
2. Treat HS69 as accepted read-only deletion preflight refinement, not deletion execution.
3. Future production deletion execution requires a new packet defining transaction, rollback, backup/snapshot, confirmation, and failure behavior.
4. Keep storage-location/snapshot management authority separate unless a future packet explicitly joins it to deletion execution.

## Guardrails And Non-Goals

- No deletion execution without a new packet.
- No schema or migration changes without a new packet.
- No footprint table, file, storage class, persistence, or retained footprint reporting.
- No real local database mutation without a new packet.
- No live/private/API calls unless explicitly authorized.
- No bridge, IPC, service command, payload, CSS/test-id, or protected-term renames without explicit approval.
- Do not add an executable `evidence.prune_scope` command without a production deletion execution packet.
- Do not mutate Assessment Memory unless a future packet explicitly defines stale/prune behavior.
- Do not mutate snapshots, backups, reports, trace packs, or support artifacts unless a future packet explicitly targets them.
- Do not treat archived docs/gap files as active task queues.

## Stop Conditions

Stop and return to Human before writing a Dev runway if:

- production deletion behavior is not explicitly scoped
- transaction, rollback, backup/snapshot, confirmation, or failure behavior is unresolved
- implementation would create footprint storage or retained footprint reporting
- implementation would make Assessment Memory immutable or a deletion blocker
- implementation would blur Evidence, Discovery, Report, Assessment, Watch, or Marked boundaries
- implementation would require live/provider calls
- protected-term warnings suggest a new authority decision is required

## Required Verification

For the accepted HS69 review, Overseer reran:

```powershell
npm.cmd run verify:retention-preflight
npm.cmd run verify:retention-deletion-boundary
```

If future production deletion work opens, verification must include focused retention/deletion checks and likely `npm.cmd run verify:all`.

## Evidence

HS69 completed by Dev and accepted by Overseer.

Accepted handoffs:

```txt
workspace/DevHS69-deletion-preflight-refinement.md
workspace/OverseerHS70-hs69-deletion-preflight-review.md
```

Accepted behavior:

- `evidence.prune_scope` preflight now reports `deletion_policy`.
- `deletion_policy.execution_status` reports `blocked_preflight_only`.
- `deletion_policy.no_retained_footprint` reports `true`.
- snapshot/backup recovery disclosure is present.
- Assessment Memory is reported as mutable/disposable/stale context, not Evidence and not a blocker.
- selected Evidence scope can count affected rows by `killmailId` / `killmailIds`.
- affected Assessment Memory references are reported where practical.
- `retention.preflight` remains read-only.
- no executable deletion command was added.
- no schema, migration, storage class, footprint table/file, or footprint persistence was added.
- no retained footprint is reported or stored.

Overseer reran:

```powershell
npm.cmd run verify:retention-preflight
npm.cmd run verify:retention-deletion-boundary
```

Both passed.

## Dev Handoff

No Dev packet is open.

Future Dev work requires a new Human / Overseer packet.
