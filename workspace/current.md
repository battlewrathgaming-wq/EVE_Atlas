# AURA Atlas Current Work

Status: Idle after deletion scope and backup matrix
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS65 accepted a bounded deletion scope and backup/restore decision matrix for future production deletion work. Atlas remains idle; no Dev packet is open.

Source of intent:

- Human direction on 2026-05-25: continue from HS64 production deletion policy design.
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

1. Hold Atlas idle until the Human selects the next bounded packet.
2. Future production deletion work must use HS64 and HS65 as policy inputs, not implementation authority by themselves.
3. Do not open Dev work until the next packet defines exact deletion scope, backup/restore behavior, footprint behavior, fixture cases, and verification commands.
4. Keep storage/runtime hardening, deletion policy, storage-location authority, and display/presentation work separated unless a future packet explicitly joins them.

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

For the completed HS65 documentation pass:

```powershell
npm.cmd run verify:protected-terms
git status --short --branch
```

If future code changes occur under this idle state, stop and explain why the runway was exceeded.

## Evidence

HS65 completed by Overseer.

Accepted handoff:

```txt
workspace/OverseerHS65-deletion-scope-backup-matrix.md
```

Policy matrix captured:

- candidate deletion scopes
- records affected in principle
- records that must not become hidden Evidence retention
- backup/restore options
- footprint survival options
- recommended default policy shape
- unresolved Human decisions
- future Dev gates

No code, schema, deletion execution, footprint storage, live API, real DB mutation, protected-word JSON update, or implementation terminology acceptance occurred.

## Dev Handoff

No Dev packet is open.

Future Dev work requires a new Human / Overseer packet with exact deletion scope, accepted backup/restore behavior, footprint behavior, fixture cases, and verification commands.
