# AURA Atlas Current Work

Status: Active Dev runway opened
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS69 is a bounded read-only deletion preflight refinement packet. It should make the existing retention/deletion preflight report the accepted policy decisions more clearly without adding deletion execution, schema, footprint storage, live calls, or real database mutation. HS69A corrected the trust policy: explicit deletion should not retain a footprint.

Source of intent:

- Human direction on 2026-05-25: continue after accepted deletion policy decisions.
- Human trust decision on 2026-05-25: when the operator confirms deletion, Atlas should delete the selected deletable active data and retain no footprint.
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

- Production deletion execution does not exist and must not be added in HS69.
- Retention/deletion behavior is preflight-only.
- zKill `killmail_id` is a Discovery anchor.
- ESI-expanded and Atlas-written `killmail_id` is the Evidence-confirmed anchor.
- Retained deletion footprint is rejected.
- Deletion preflight should report no-footprint policy, not footprint candidate fields.
- `killmail_id + pilot_id`, `EVE_value`, `EVE_Pilot_value`, `EVE_rating`, `EVE_interest_score`, `Spare_1A`, and `Spare_1B` are rejected for deletion footprint.
- Snapshotting is accepted as the recovery posture for first production deletion, with honest disclosure that snapshots/backups may retain records removed from active storage.
- Assessment Memory is mutable, disposable, and quickly stale; it is not Evidence and must not become hidden retention.

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS69-deletion-preflight-refinement.md
```

## Ordered Runway

1. Read the source of intent and trace the existing retention preflight implementation and tests.
2. Refine the read-only `evidence.prune_scope` preflight output so it reports the accepted policy state for selected Evidence deletion:
   - deletion remains blocked from execution
   - snapshot/recovery disclosure is present
   - no retained footprint policy is present
   - custom value/rating/note/catchment fields are not footprint fields
   - Assessment Memory is mutable/disposable/stale context, not Evidence and not a deletion blocker
3. Ensure preflight can report exact affected row counts where available for selected Evidence scope:
   - `killmails`
   - `activity_events`
   - `ingestion_audits`
   - `data_quality_warnings`
   - related `assessment_artifacts` references where practical
4. Add or update focused fixture verification for the refined preflight readout.
5. Preserve existing service boundaries: `retention.preflight` remains read-only; no executable `evidence.prune_scope` command appears.
6. Update this file Evidence / Dev Handoff sections and create the expected DevHS69 handoff.

## Guardrails And Non-Goals

- No deletion execution.
- No schema or migration changes.
- No footprint table, file, storage class, persistence, or retained footprint reporting.
- No real local database mutation.
- No live/private/API calls.
- No bridge, IPC, service command, payload, CSS/test-id, or protected-term renames.
- Do not add an executable `evidence.prune_scope` command.
- Do not mutate Assessment Memory.
- Do not mutate snapshots, backups, reports, trace packs, or support artifacts.
- Do not preserve raw Evidence, full activity events, participant arrays, or hidden deleted-record copies through footprint, reports, traces, snapshots, or Assessment Memory.
- Do not present `killmail_id + pilot_id` as a retained deletion footprint; HS69A rejects retained footprint.
- Do not treat archived docs/gap files as active task queues.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- exact preflight refinement requires schema or storage changes
- implementation would execute deletion or mutate real/user data
- implementation would create footprint storage or retained footprint reporting
- implementation would promote rejected placeholder/custom value terms
- implementation would make Assessment Memory immutable or a deletion blocker
- implementation would blur Evidence, Discovery, Report, Assessment, Watch, or Marked boundaries
- implementation would require live/provider calls
- protected-term warnings suggest a new authority decision is required

## Required Verification

Run the smallest focused set that proves the packet, then broaden if touched code requires it:

```powershell
npm.cmd run verify:retention-preflight
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:assessment-artifacts
npm.cmd run verify:protected-terms
git status --short --branch
```

If shared registry, schema, or broader service behavior changes, also run:

```powershell
npm.cmd run verify:service-registry
npm.cmd run verify:all
```

## Evidence

HS69 runway opened by Overseer.

Overseer verification:

- `npm.cmd run verify:protected-terms` completed with exit code 0.
- Protected-term discovery ran in working-set mode against 2 files.
- Warning count: 69.
- Warning classes: cross-project borrowing 12, Lab quarantine borrowing 37, Atlas candidate 20.
- The scan confirmed warning-only behavior; no renames and no protected-word JSON updates were performed.
- No code, schema, deletion execution, footprint storage, live API, or real DB mutation occurred while opening this runway.

HS69 completed by Dev.

Files changed:

- `src/main/services/retentionActionService.js`
- `scripts/verify-retention-preflight.js`
- `scripts/verify-retention-deletion-boundary.js`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/current.md`
- `workspace/DevHS69-deletion-preflight-refinement.md`

Preflight fields/readout refined:

- `evidence.prune_scope` preflight now includes `deletion_policy`.
- `deletion_policy.execution_status` reports `blocked_preflight_only`.
- `deletion_policy.no_retained_footprint` reports `true`.
- `deletion_policy.footprint_policy` rejects retained deletion footprint reporting.
- `deletion_policy.rejected_footprint_fields` lists rejected footprint/custom fields including `killmail_id + pilot_id`, `EVE_value`, `EVE_Pilot_value`, `EVE_rating`, `EVE_interest_score`, `Spare_1A`, and `Spare_1B`.
- `deletion_policy.snapshot_recovery_disclosure` states snapshots/backups are historical support artifacts and may retain records removed from active storage unless separately deleted.
- `deletion_policy.assessment_memory_policy` states Assessment Memory is mutable, disposable, stale after Evidence deletion, not Evidence, not hidden retention, and not a deletion blocker.
- `impact.assessment_artifact_references` and `impact.affected_assessment_artifacts` report related Assessment Memory references where practical.
- Selected Evidence scope can now count exact affected rows by `killmailId` / `killmailIds`.

Fixture cases added/updated:

- refined retention preflight verifies no-footprint policy, snapshot disclosure, rejected custom footprint fields, selected Evidence row counts, affected Assessment Memory references, and read-only table counts
- retention deletion boundary verifies no executable deletion command exists, no retained footprint is reported, raw Evidence/participant payloads are not exposed by preflight, and service preflight does not mutate Evidence or Assessment Memory

Boundary proof:

- `retention.preflight` remains read-only.
- No executable `evidence.prune_scope` command was added.
- No executable `assessment.compact_from_evidence` command was added.
- No schema, migration, storage class, footprint table/file, or footprint persistence was added.
- No retained footprint is reported or stored.
- No live API, real DB mutation, protected-word JSON update, or terminology rename occurred.

Verification:

```powershell
npm.cmd run verify:retention-preflight
npm.cmd run verify:retention-deletion-boundary
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:assessment-artifacts
npm.cmd run verify:service-registry
npm.cmd run verify:protected-terms
npm.cmd run verify:all
git status --short --branch
```

Result: all focused checks passed and `verify:all` passed 65 scripts. `verify:protected-terms` passed warning-only; final warning count and classes are recorded in `workspace/DevHS69-deletion-preflight-refinement.md`. No renames or protected-word JSON updates were performed.

## Dev Handoff

Dev completed:

```txt
workspace/DevHS69-deletion-preflight-refinement.md
```

The handoff summarizes what preflight now reports, which policy decisions it encodes, verification results, and remaining policy or implementation risks.
