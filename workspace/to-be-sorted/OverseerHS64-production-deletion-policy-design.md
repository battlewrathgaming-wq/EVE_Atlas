# OverseerHS64 - Production Deletion Policy Design

Date: 2026-05-25
Role: Atlas Overseer
Status: policy design / no implementation authorization

## Request Answered

The Human selected production deletion policy design as the next continuation after HS62, using HS63 deletion/footprint input as advisory source material.

This record defines a bounded policy shape for future deletion/footprint work. It does not implement deletion, add schema, create footprint storage, rename commands, or open a Dev runway.

## Files Reviewed

- `workspace/current.md`
- `workspace/OverseerHS63-deletion-policy-design-input.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `workspace/DevHS62-partial-success-report-readout.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

## Accepted Policy Baseline

Production deletion execution does not exist.

Current retention/deletion behavior is preflight-only.

If production deletion is implemented later, explicit user-selected deletion must mean deletion of the selected deletable records.

Footprint is optional historical-interest metadata only. It does not override deletion and must not preserve raw Evidence, full activity events, raw ESI payloads, participant arrays, or hidden deleted-record copies.

Assessment Memory may be offered or recommended, but must not silently block or reverse explicit deletion.

## Anchor Policy

### Discovery Anchor

A zKill-provided `killmail_id` is a Discovery anchor.

It can guide queueing and ESI expansion, but it remains incomplete until confirmed by the Evidence pipeline. It may be malformed, stale, paired with a bad hash, unavailable through ESI, or otherwise fail expansion.

Discovery anchors are not sufficient for a durable deletion footprint.

### Evidence-Confirmed Anchor

An ESI-expanded `killmail_id` that Atlas successfully writes as Evidence is the Evidence-confirmed anchor.

This is the stable factual anchor for the stored killmail Evidence record. It is the only accepted immutable side of a future minimal deletion/footprint pair.

Working form:

```txt
[Evidence-confirmed killmail_id][Human-authored EVE_value]
```

### User Input

A user-entered `killmail_id` is search/reference input only until matched to provider-derived state.

Atlas should not treat user-entered or unverified IDs as factual anchors.

## Human-Authored Value Policy

`EVE_value` is a working label candidate for a human-authored short-form value, rating, note, or significance marker.

The value is subjective/operator-authored. It is not Evidence, Discovery, Observation, or automatic Assessment Memory by itself.

`EVE_value` is not accepted implementation terminology yet.

## Reserved Catchment Placeholders

The following are reserved placeholders only:

- `EVE_Pilot_value`
- `Spare_1A`
- `Spare_1B`

They provide design breathing room if future deletion/footprint policy needs pilot/entity-specific value or additional compact fields.

They are not accepted schema fields, bridge fields, payload fields, UI copy, or implementation requirements.

## What Future Deletion May Delete In Principle

Future policy may allow deletion of selected deletable records tied to Evidence, including:

- selected stored killmail Evidence
- derived activity events for that selected Evidence
- related ingestion audit rows
- related data quality warnings
- related Discovery/queue rows where policy accepts removal or expiry

This list is not executable policy. It identifies decision areas for a future scoped design/Dev packet.

## What Footprint May Retain In Principle

Future policy may allow a minimal historical-interest footprint containing:

- Evidence-confirmed `killmail_id`
- optional human-authored short value such as working `EVE_value`
- optional timestamp or deletion/review event metadata if accepted later
- optional user/operator action context if accepted later

The footprint should be enough to indicate that a record was historically of interest, not enough to reconstruct deleted Evidence.

## What Footprint Must Never Retain

Footprint must not retain:

- raw expanded ESI payload
- full activity events
- participant arrays
- full victim/attacker details
- hidden copies of deleted Evidence
- raw payload checksums if they allow deleted payload reconstruction or imply hidden retention
- report/readout artifacts that function as deleted Evidence copies

## Backup / Restore Questions

Backup and restore expectations are unresolved.

Open questions:

- Must Atlas offer a backup before production deletion?
- Is deletion reversible, irreversible, or reversible only through an operator-created support artifact?
- Are runtime snapshots allowed to contain records later deleted from the active DB?
- If snapshots/backups exist, how should the UI explain that active deletion does not rewrite historical backups?
- Should backup/restore policy be decided before any deletion execution packet opens?

## Future Dev Gates

Before Dev may implement production deletion, a future packet must explicitly define:

- exact deletion scope
- accepted footprint storage class, if any
- whether `EVE_value` or another label is accepted
- whether `EVE_Pilot_value`, `Spare_1A`, or `Spare_1B` survive, change, or are removed
- backup/restore behavior
- confirmation wording
- fixture database cases
- verification commands
- rollback/error behavior
- whether `verify:all` is required

## Non-Goals

- No code implementation.
- No schema design.
- No migration design.
- No renderer/UI design.
- No footprint table or file format.
- No production deletion command.
- No protected-word JSON updates.
- No acceptance of placeholder terms as implementation names.

## Verification

Required documentation-only verification:

```powershell
npm.cmd run verify:protected-terms
git status --short --branch
```

## Conclusion

Atlas should treat production deletion as possible but still gated.

The strongest current policy decision is the anchor distinction:

- zKill `killmail_id` is a Discovery anchor.
- ESI-expanded and Atlas-written `killmail_id` is the Evidence-confirmed anchor.
- Human-authored value is separate and subjective.

Future implementation should start from this distinction and should not preserve deleted Evidence in disguise.
