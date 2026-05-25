# OverseerHS67 - Deletion Footprint Anchor Decision

Date: 2026-05-25
Role: Atlas Overseer
Status: Human decision accepted / no implementation authorization

## Request Answered

The Human refined the deletion footprint policy after HS66.

The accepted direction is that a deletion footprint, if used, should stay reproducible from provider-confirmed data and should not depend on custom operator-authored value fields.

This record supersedes the HS66 footprint/value recommendation where it suggested a human-authored value in the retained footprint.

## Files Reviewed

- `workspace/current.md`
- `workspace/OverseerHS66-deletion-policy-human-decisions.md`
- `workspace/OverseerHS65-deletion-scope-backup-matrix.md`
- `workspace/OverseerHS64-production-deletion-policy-design.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

## Accepted Footprint Principle

All observations must be able to be recreated from provider-confirmed or Atlas-derived data.

Custom operator input does not satisfy that requirement.

Therefore, a retained deletion footprint should not rely on custom score, note, rating, or value fields.

## Accepted Minimal Footprint Shape

If a deletion footprint is retained, the accepted minimal shape is:

```txt
Evidence-confirmed killmail_id
pilot_id
```

Meaning:

- `killmail_id` anchors the confirmed fight record.
- `pilot_id` identifies the specific pilot of interest within that fight.

This is better than `killmail_id` alone because a killmail is an event involving multiple pilots and entities. The event anchor is reliable, but it does not identify which participant Atlas cared about.

## Rejected For Footprint

The following are not accepted for the retained deletion footprint:

- `EVE_value`
- `EVE_Pilot_value`
- `EVE_rating`
- `EVE_interest_score`
- `Spare_1A`
- `Spare_1B`
- custom short text explaining why the pilot mattered
- mutable interest score or ranking
- any operator-authored custom value field

These may remain future UI, Assessment, or product-design discussion topics, but they are not accepted deletion-footprint fields.

## Boundary Clarification

The footprint is not Evidence.

The footprint is a historical-interest clue that Atlas once had interest in a specific pilot within a confirmed killmail event.

The footprint must not retain:

- raw ESI payload
- zKill payload
- full activity events
- participant arrays
- victim/attacker detail beyond the accepted `pilot_id`
- report bodies
- trace packs that reconstruct the deleted Evidence
- Assessment Memory text as a substitute for deleted Evidence

## Remaining Decisions

Backup/snapshot policy remains as in HS66 unless revised:

- recommended: require explicit pre-delete snapshot for first production deletion
- disclose that snapshots/backups may still contain deleted records unless separately removed

Assessment Memory behavior remains as in HS66 unless revised:

- do not silently mutate Assessment Memory
- preflight affected citations/sample IDs
- require explicit acknowledgement if deletion affects Assessment Memory references

## Future Dev Packet Implication

If a Dev preflight-refinement packet opens next, it should:

- treat footprint as optional
- default footprint off unless the Human accepts otherwise
- model retained footprint candidates as `killmail_id + pilot_id` only
- report whether the selected Evidence contains the selected `pilot_id`
- avoid schema/storage creation unless a later packet explicitly authorizes footprint storage
- avoid `EVE_value`, score, rating, note, and catchment fields
- keep deletion execution blocked

## Non-Goals

- No code implementation.
- No schema or migration design.
- No footprint storage class.
- No deletion execution.
- No UI copy.
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
- Warning classes: cross-project borrowing 10, Lab quarantine borrowing 44, Atlas candidate 14.
- The scan confirmed warning-only behavior; no renames and no protected-word JSON updates were performed.
- No code, schema, deletion execution, footprint storage, live API, or real DB mutation occurred.

## Conclusion

The deletion footprint model is now simpler and stronger:

```txt
confirmed event + specific pilot
```

That preserves the useful historical-interest clue without turning custom operator input into a retained deletion artifact.
