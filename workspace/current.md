# AURA Atlas Current Work

Status: Human footprint decision accepted; backup and Assessment Memory decisions remain
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS67 accepted the deletion footprint anchor decision. If a footprint is retained, it should be `Evidence-confirmed killmail_id + pilot_id` only. Custom value/rating/note fields are rejected for the deletion footprint because observations must be reproducible. Atlas remains idle; no Dev packet is open until backup/snapshot and Assessment Memory citation behavior are accepted or revised.

Source of intent:

- Human direction on 2026-05-25: continue from HS64 production deletion policy design.
- Human selected option 2 on 2026-05-25: policy decision pass before Dev.
- Human refinement on 2026-05-25: deletion footprint should keep `killmail_id + pilot_id` only; custom value input does not satisfy the reproducible-observation policy.
- `workspace/OverseerHS67-deletion-footprint-anchor-decision.md`
- `workspace/OverseerHS66-deletion-policy-human-decisions.md`
- `workspace/OverseerHS64-production-deletion-policy-design.md`
- `workspace/OverseerHS65-deletion-scope-backup-matrix.md`
- `workspace/OverseerHS63-deletion-policy-design-input.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `src/main/db/schema.sql`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted baseline:

- Production deletion execution does not exist.
- Retention/deletion behavior is preflight-only.
- zKill `killmail_id` is a Discovery anchor.
- ESI-expanded and Atlas-written `killmail_id` is the Evidence-confirmed anchor.
- Future footprint, if accepted, should retain only `Evidence-confirmed killmail_id + pilot_id`.
- Footprint must not preserve raw Evidence, full activity events, participant arrays, or hidden deleted-record copies.
- `EVE_value`, `EVE_Pilot_value`, `EVE_rating`, `EVE_interest_score`, `Spare_1A`, and `Spare_1B` are rejected for the deletion footprint.

## Executor

Current executor: none; awaiting Human / Overseer selection for the next bounded packet.

Expected handoff filename: none until a new packet is opened.

## Ordered Runway

1. Hold Atlas idle until the Human accepts or revises the remaining backup/snapshot and Assessment Memory decisions.
2. Future production deletion work must use HS64, HS65, HS66, and HS67 as policy inputs, not implementation authority by themselves.
3. Do not open Dev work until the next packet defines exact deletion scope, accepted backup/restore behavior, accepted footprint behavior, fixture cases, and verification commands.
4. If remaining decisions are accepted, the next suitable Dev packet is read-only deletion preflight refinement, not deletion execution.
5. Keep storage/runtime hardening, deletion policy, storage-location authority, and display/presentation work separated unless a future packet explicitly joins them.

## Guardrails And Non-Goals

- No code changes.
- No deletion execution.
- No schema or migration changes.
- No footprint storage.
- No bridge, IPC, service, payload, command, CSS/test-id, or protected-term renames.
- No live/private/API calls.
- Do not mutate the user's real local database.
- Do not accept placeholder/custom value terms as deletion-footprint terminology.
- Do not let backups, snapshots, logs, reports, Assessment Memory, or provenance become hidden Evidence retention.
- Do not treat archived docs/gap files as active task queues.

## Stop Conditions

Stop and return to Human before writing a Dev runway if:

- backup/snapshot or Assessment Memory behavior still needs Human acceptance
- backup/restore choices imply implementation requirements
- footprint persistence implies schema/storage design
- policy would blur Evidence, Discovery, Report, Assessment, Watch, or Marked boundaries
- policy would require live/provider checks
- protected-term warnings suggest a new authority decision is required

## Required Verification

For the completed HS67 documentation pass:

```powershell
npm.cmd run verify:protected-terms
git status --short --branch
```

If future code changes occur under this idle state, stop and explain why the runway was exceeded.

## Evidence

HS67 completed by Overseer.

Accepted handoff:

```txt
workspace/OverseerHS67-deletion-footprint-anchor-decision.md
```

Decision captured:

- footprint should be `Evidence-confirmed killmail_id + pilot_id` only
- custom value/rating/note fields are rejected for deletion footprint
- footprint remains optional and not storage-authorized
- backup/snapshot and Assessment Memory behavior remain to be accepted or revised

No code, schema, deletion execution, footprint storage, live API, real DB mutation, protected-word JSON update, or implementation terminology acceptance occurred.

## Dev Handoff

No Dev packet is open.

Future Dev work requires Human acceptance or revision of the remaining backup/snapshot and Assessment Memory decisions, then a new Human / Overseer packet with exact deletion scope, accepted backup/restore behavior, footprint behavior, fixture cases, and verification commands.
