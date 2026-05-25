# OverseerHS66 - Deletion Policy Human Decisions

Date: 2026-05-25
Role: Atlas Overseer
Status: decision brief / no implementation authorization

## Request Answered

The Human selected the policy decision pass after HS65.

This record narrows the remaining production deletion choices into Human decisions before any Dev deletion preflight or implementation packet opens.

It does not implement deletion, add schema, create footprint storage, rename terms, or authorize Dev execution.

## Files Reviewed

- `workspace/current.md`
- `workspace/OverseerHS65-deletion-scope-backup-matrix.md`
- `workspace/OverseerHS64-production-deletion-policy-design.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

## Accepted Baseline

Production deletion execution does not exist.

Current retention/deletion behavior is preflight-only.

The first implementation candidate remains tightly scoped selected Evidence deletion by Evidence-confirmed `killmail_id`.

Footprint must not preserve raw Evidence, full activity events, participant arrays, or hidden deleted-record copies.

Assessment Memory is deliberate human-authored context. It must not become hidden Evidence retention or silently block explicit deletion.

`EVE_value`, `EVE_Pilot_value`, `Spare_1A`, and `Spare_1B` remain placeholders only.

## Decision 1 - Backup / Snapshot Behavior

Decision needed before Dev:

Should first production deletion require a pre-delete runtime DB snapshot?

Recommended first-release answer:

```txt
Require an explicit pre-delete snapshot for first production deletion, with clear warning that the snapshot is a historical support artifact and active DB deletion does not rewrite prior snapshots.
```

Why:

- deletion is destructive
- Atlas records may be heavy and connected
- early deletion code needs recovery margin
- the user must not be misled into thinking snapshots are active-state truth after deletion

Rejected for first release:

- silent automatic backup without disclosure
- no-backup deletion as the only path
- rewriting or pruning historical snapshots during active DB deletion

Acceptance wording:

```txt
Accepted: first production deletion requires an explicit local pre-delete snapshot, and the UI/preflight must disclose that snapshots/backups may still contain deleted records unless separately removed.
```

Alternative acceptable Human choice:

```txt
Accepted: first production deletion offers, but does not require, a pre-delete snapshot. If the operator skips it, the confirmation must state that recovery may not be available.
```

## Decision 2 - Footprint Behavior

Decision needed before Dev:

Should deletion leave a minimal historical-interest footprint?

Recommended first-release answer:

```txt
Footprint is optional per deletion action. Default is no footprint unless the operator explicitly chooses to leave one.
```

Why:

- footprint is useful as a "was of interest" clue
- footprint must not override explicit deletion
- defaulting it off avoids hidden retention concerns
- per-action choice fits the operator's intent better than a global silent policy

Allowed footprint content for first release:

- Evidence-confirmed `killmail_id`
- optional human-authored short value, using `EVE_value` only if Human later accepts the label
- optional deletion/review timestamp if accepted in the implementation packet

Not allowed:

- raw ESI payload
- full activity events
- participant arrays
- copied report bodies
- trace packs that reconstruct the deleted Evidence
- provider payload checksums if they imply hidden retention or reconstruction

Acceptance wording:

```txt
Accepted: footprint is optional per deletion action, defaults off, and may only retain the Evidence-confirmed killmail_id plus an explicitly human-authored compact value if that value label is later accepted.
```

## Decision 3 - Human-Authored Value Label

Decision needed before Dev:

Should `EVE_value` become the accepted label for the human-authored compact footprint value?

Recommended first-release answer:

```txt
Do not accept `EVE_value` as implementation terminology yet. Keep it as a design placeholder until UI/product wording is clearer.
```

Why:

- the meaning is useful, but the name is not mature
- the value may represent rating, note, significance, or operator shorthand
- accepting the label too early could leak placeholder language into schema, bridge, or UI

Acceptance wording:

```txt
Accepted: `EVE_value`, `EVE_Pilot_value`, `Spare_1A`, and `Spare_1B` remain parked placeholders and must not become schema, bridge, payload, command, or UI labels in the next Dev packet.
```

## Decision 4 - Assessment Memory Citation Behavior

Decision needed before Dev:

What should happen when selected Evidence deletion affects Assessment Memory citations or sample killmail IDs?

Recommended first-release answer:

```txt
Do not silently mutate Assessment Memory. The deletion preflight must report affected Assessment Memory citations. Production deletion may proceed only with explicit operator acknowledgement or a later accepted citation-handling choice.
```

Why:

- Assessment Memory is human-authored and should not be quietly rewritten
- citations can point at Evidence that will no longer exist in active storage
- retaining a raw Evidence-like summary would violate deletion policy
- deleting Assessment Memory automatically may destroy deliberate operator judgment

First-release allowed behavior:

- preflight lists affected Assessment Memory artifacts
- confirmation states that citations may reference deleted Evidence after deletion
- no automatic rewrite unless a later packet defines a safe compact stale-citation marker

Not allowed:

- silently deleting Assessment Memory
- silently rewriting human-authored text
- preserving raw Evidence details inside Assessment Memory as a deletion workaround
- blocking explicit deletion merely because Assessment Memory exists, unless Human later chooses that policy

Acceptance wording:

```txt
Accepted: Assessment Memory is not silently mutated. Deletion preflight must show affected citations/sample IDs, and production deletion requires explicit acknowledgement when Assessment Memory references selected Evidence.
```

## Recommended Decision Set

Recommended bundle for the next Dev preflight-refinement packet:

1. Backup: require explicit pre-delete snapshot for first production deletion, with warning that snapshots/backups may retain deleted records.
2. Footprint: optional per deletion action, default off.
3. Value label: keep `EVE_value`, `EVE_Pilot_value`, `Spare_1A`, and `Spare_1B` parked as placeholders.
4. Assessment Memory: do not silently mutate; preflight affected citations and require explicit acknowledgement.

This bundle keeps deletion honest, recoverable, and bounded without pretending that footprint, snapshots, or Assessment Memory are solved by implementation magic.

## Future Dev Packet Shape If Accepted

If the Human accepts the recommended decision set, the next Dev packet should remain read-only and bounded:

- refine deletion preflight output only
- report exact affected rows for selected Evidence-confirmed `killmail_id`
- include snapshot requirement/warning state
- include footprint choice state without creating storage
- include affected Assessment Memory citation count/details
- do not execute deletion
- do not create schema
- do not create footprint storage
- do not mutate snapshots, backups, reports, traces, or Assessment Memory

## Stop Conditions

Stop before Dev if:

- backup/snapshot behavior is not accepted
- footprint default is not accepted
- placeholder value terms are promoted without Human terminology acceptance
- Assessment Memory behavior is unresolved
- deletion scope expands beyond selected Evidence-confirmed `killmail_id`
- implementation would require schema/storage design

## Verification

Required documentation-only verification:

```powershell
npm.cmd run verify:protected-terms
git status --short --branch
```

Result:

- `npm.cmd run verify:protected-terms` completed with exit code 0.
- Protected-term discovery ran in working-set mode against 3 files.
- Warning count: 73.
- Warning classes: cross-project borrowing 10, Lab quarantine borrowing 52, Atlas candidate 11.
- The scan confirmed warning-only behavior; no renames and no protected-word JSON updates were performed.
- No code, schema, deletion execution, footprint storage, live API, or real DB mutation occurred.

## Conclusion

Atlas is ready for a Human deletion-policy decision, not Dev implementation.

The safest next move is to accept or revise the four-decision bundle above. After that, Overseer can open a narrow read-only Dev packet for deletion preflight refinement.
