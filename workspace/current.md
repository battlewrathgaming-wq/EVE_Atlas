# AURA Atlas Current Work

Status: Human decision needed after deletion policy decision brief
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS66 narrowed the remaining production deletion choices into a Human decision brief. Atlas remains idle; no Dev packet is open until backup/snapshot, footprint, placeholder value labels, and Assessment Memory citation behavior are accepted or revised.

Source of intent:

- Human direction on 2026-05-25: continue from HS64 production deletion policy design.
- Human selected option 2 on 2026-05-25: policy decision pass before Dev.
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
- Future footprint, if accepted, starts from `[Evidence-confirmed killmail_id][Human-authored EVE_value]`.
- Footprint must not preserve raw Evidence, full activity events, participant arrays, or hidden deleted-record copies.
- `EVE_value`, `EVE_Pilot_value`, `Spare_1A`, and `Spare_1B` remain placeholders only.

## Executor

Current executor: none; awaiting Human / Overseer selection for the next bounded packet.

Expected handoff filename: none until a new packet is opened.

## Ordered Runway

1. Hold Atlas idle until the Human accepts or revises the HS66 decision bundle.
2. Future production deletion work must use HS64, HS65, and HS66 as policy inputs, not implementation authority by themselves.
3. Do not open Dev work until the next packet defines exact deletion scope, accepted backup/restore behavior, accepted footprint behavior, fixture cases, and verification commands.
4. If the HS66 recommendation is accepted, the next suitable Dev packet is read-only deletion preflight refinement, not deletion execution.
5. Keep storage/runtime hardening, deletion policy, storage-location authority, and display/presentation work separated unless a future packet explicitly joins them.

## Guardrails And Non-Goals

- No code changes.
- No deletion execution.
- No schema or migration changes.
- No footprint storage.
- No bridge, IPC, service, payload, command, CSS/test-id, or protected-term renames.
- No live/private/API calls.
- Do not mutate the user's real local database.
- Do not accept placeholder terms as implementation terminology.
- Do not let backups, snapshots, logs, reports, Assessment Memory, or provenance become hidden Evidence retention.
- Do not treat archived docs/gap files as active task queues.

## Stop Conditions

Stop and return to Human before writing a Dev runway if:

- exact deletion behavior still needs Human acceptance
- backup/restore choices imply implementation requirements
- footprint persistence implies schema/storage design
- policy would blur Evidence, Discovery, Report, Assessment, Watch, or Marked boundaries
- policy would require live/provider checks
- protected-term warnings suggest a new authority decision is required

## Required Verification

For the completed HS66 documentation pass:

```powershell
npm.cmd run verify:protected-terms
git status --short --branch
```

If future code changes occur under this idle state, stop and explain why the runway was exceeded.

## Evidence

HS66 completed by Overseer.

Accepted handoff:

```txt
workspace/OverseerHS66-deletion-policy-human-decisions.md
```

Decision brief captured:

- backup/snapshot behavior recommendation
- footprint default recommendation
- placeholder value label recommendation
- Assessment Memory citation recommendation
- next read-only Dev packet shape if accepted

No code, schema, deletion execution, footprint storage, live API, real DB mutation, protected-word JSON update, or implementation terminology acceptance occurred.

## Dev Handoff

No Dev packet is open.

Future Dev work requires Human acceptance or revision of HS66, then a new Human / Overseer packet with exact deletion scope, accepted backup/restore behavior, footprint behavior, fixture cases, and verification commands.
