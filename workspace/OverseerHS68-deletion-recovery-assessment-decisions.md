# OverseerHS68 - Deletion Recovery And Assessment Decisions

Date: 2026-05-25
Role: Atlas Overseer
Status: Human decisions accepted / no implementation authorization

## Request Answered

The Human accepted the remaining production deletion policy direction:

- Recovery: snapshotting is acceptable.
- Assessment Memory: it is mutable, disposable, and goes stale quickly.

This record completes the policy decision bundle needed before a future read-only Dev deletion preflight refinement packet.

It does not implement deletion, add schema, create footprint storage, mutate Assessment Memory, or authorize deletion execution.

## Files Reviewed

- `workspace/current.md`
- `workspace/OverseerHS67-deletion-footprint-anchor-decision.md`
- `workspace/OverseerHS66-deletion-policy-human-decisions.md`
- `workspace/OverseerHS65-deletion-scope-backup-matrix.md`
- `workspace/OverseerHS64-production-deletion-policy-design.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

## Accepted Recovery Policy

Snapshotting is accepted as the first production deletion recovery posture.

Accepted meaning:

- first production deletion may require or create an explicit local pre-delete snapshot
- the snapshot is a recovery/support artifact
- active database deletion does not rewrite prior snapshots/backups
- preflight or confirmation must be honest that snapshots/backups may still contain records removed from active storage

Rejected meaning:

- snapshot is not active-state truth after deletion
- snapshot does not make deletion private across all historical support artifacts
- deletion does not silently prune old snapshots/backups
- snapshotting does not authorize deletion execution by itself

## Accepted Assessment Memory Policy

Assessment Memory is mutable and disposable.

It goes stale quickly and should not be treated as immutable evidence, protected source material, or a reason to block explicit deletion.

Accepted meaning for deletion policy:

- Assessment Memory can be stale after Evidence deletion
- deletion preflight should report affected Assessment Memory references where practical
- production deletion does not need to preserve Assessment Memory as a protected artifact
- future implementation may invalidate, mark stale, prune, or leave affected Assessment Memory according to an explicit packet
- Assessment Memory must not preserve raw Evidence as a deletion workaround

Rejected meaning:

- Assessment Memory is not Evidence
- Assessment Memory is not durable provider truth
- Assessment Memory should not silently override user-selected deletion
- Assessment Memory should not become hidden retention of raw payloads, full activity events, or participant arrays

## Consolidated Accepted Policy

The current accepted deletion-policy shape is:

1. Delete scope candidate: selected Evidence-confirmed `killmail_id`.
2. Recovery: snapshotting is acceptable and should be disclosed honestly.
3. Footprint: if retained, it is `Evidence-confirmed killmail_id + pilot_id` only.
4. Custom value/rating/note fields are rejected for deletion footprint.
5. Assessment Memory is mutable/disposable/stale and must not preserve deleted Evidence in disguise.
6. Production deletion execution remains blocked until a future Dev packet explicitly authorizes it.

## Future Dev Packet Implication

The next suitable Dev packet can now be read-only deletion preflight refinement.

It should:

- report exact affected rows for a selected Evidence-confirmed `killmail_id`
- include snapshot/recovery requirement or warning state
- include footprint candidate reporting using `killmail_id + pilot_id` only
- report affected Assessment Memory references as stale/disposable context, not protected blockers
- keep deletion execution blocked
- avoid schema/storage creation
- avoid real DB mutation
- avoid live/provider calls

## Non-Goals

- No deletion execution.
- No code implementation in this record.
- No schema or migration design.
- No footprint table/file format.
- No Assessment Memory mutation.
- No snapshot implementation changes.
- No UI copy or renderer design.
- No bridge, IPC, payload, service, command, or protected-term rename.
- No protected-word JSON updates.

## Verification

Required documentation-only verification:

```powershell
npm.cmd run verify:protected-terms
git status --short --branch
```

Result:

- `npm.cmd run verify:protected-terms` completed with exit code 0.
- Protected-term discovery ran in working-set mode against 3 files.
- Warning count: 68.
- Warning classes: cross-project borrowing 10, Lab quarantine borrowing 45, Atlas candidate 13.
- The scan confirmed warning-only behavior; no renames and no protected-word JSON updates were performed.
- No code, schema, deletion execution, footprint storage, live API, or real DB mutation occurred.

## Conclusion

The policy decision phase is complete enough to shape the next Dev runway.

Atlas should move next to a bounded read-only deletion preflight refinement packet, not production deletion execution.
