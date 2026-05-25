# AURA Atlas Current Work

Status: Idle after production deletion policy design
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS64 accepted a bounded production deletion policy design record. Atlas remains idle; no Dev packet is open.

Source of intent:

- Human selected option 1 on 2026-05-25: production deletion policy design.
- Human deletion/footprint advisory on 2026-05-25:
  - `killmail_id` is the immutable pipeline anchor only after successful ESI expansion and Atlas Evidence write.
  - zKill-provided `killmail_id` is a Discovery anchor and may be malformed/deformed/incomplete.
  - `EVE_value` is human-authored.
  - `EVE_Pilot_value`, `Spare_1A`, and `Spare_1B` are reserved catchment placeholders for future design breathing room.
- `workspace/OverseerHS63-deletion-policy-design-input.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `workspace/DevHS62-partial-success-report-readout.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted baseline:

- Production deletion execution does not exist.
- Retention/deletion behavior is preflight-only.
- Footprint is optional historical-interest metadata only.
- Footprint must not override explicit deletion.
- Footprint must not preserve raw Evidence, full activity events, participant arrays, or hidden deleted-record copies.
- Assessment Memory may be offered or recommended, but must not silently block or reverse explicit deletion.
- HS63 is advisory input, not implementation authority.

## Executor

Current executor: none; awaiting Human / Overseer selection for the next bounded packet.

Expected handoff filename: none until a new packet is opened.

## Ordered Runway

1. Read the source of intent listed above and trace the Discovery -> Evidence anchor distinction from existing current-state/handoff docs.
2. Produce a policy design record at `workspace/OverseerHS64-production-deletion-policy-design.md`.
3. The policy design record must define:
   - Discovery anchor
   - Evidence-confirmed anchor
   - human-authored value
   - `EVE_value` as working terminology only
   - `EVE_Pilot_value`, `Spare_1A`, and `Spare_1B` as reserved catchment placeholders only
   - what deletion may delete in principle
   - what footprint may retain in principle
   - what footprint must never retain
   - backup/restore questions still unresolved
4. The policy design record must separate:
   - accepted policy
   - advisory input
   - unresolved questions
   - future Dev gates
   - non-goals
5. Update `workspace/current.md` Evidence / Dev Handoff sections with the policy record summary.
6. Update `workspace/overview.md` only if the milestone sequence/status changes.
7. Do not implement code. Do not create a Dev packet from this pass unless the Human explicitly asks after reviewing the policy record.

## Guardrails And Non-Goals

- No code changes.
- No deletion execution.
- No schema or migration changes.
- No bridge, IPC, service, payload, command, CSS/test-id, or protected-term renames.
- No live/private/API calls.
- Do not mutate the user's real local database.
- Do not add footprint storage.
- Do not accept `EVE_value`, `EVE_Pilot_value`, `Spare_1A`, or `Spare_1B` as implementation terminology.
- Do not make the user-authored value mandatory.
- Do not allow footprint, Assessment Memory, provenance, reports, snapshots, trace packs, or logs to preserve raw deleted Evidence or full activity events in disguise.
- Do not treat archived docs/gap files as active task queues.

## Stop Conditions

Stop and return to Human before writing a Dev runway if:

- exact deletion scope cannot be decided without Human judgment
- backup/restore expectations become implementation requirements
- footprint persistence implies schema/storage design
- `EVE_value` or catchment placeholders need naming acceptance
- the policy would blur Evidence, Discovery, Report, Assessment, Watch, or Marked boundaries
- the policy would require live/provider checks
- protected-term warnings suggest a new authority decision is required

## Required Verification

Documentation-only verification:

```powershell
npm.cmd run verify:protected-terms
git status --short --branch
```

If code changes occur, stop and explain why the runway was exceeded.

## Evidence

HS64 completed by Overseer.

Accepted handoff:

```txt
workspace/OverseerHS64-production-deletion-policy-design.md
```

Policy decisions captured:

- zKill `killmail_id` is a Discovery anchor.
- ESI-expanded and Atlas-written `killmail_id` is the Evidence-confirmed anchor.
- Future minimal footprint, if accepted later, should start from `[Evidence-confirmed killmail_id][Human-authored EVE_value]`.
- `EVE_value`, `EVE_Pilot_value`, `Spare_1A`, and `Spare_1B` remain working/reserved placeholders, not implementation terminology.
- Footprint must not preserve raw Evidence, full activity events, participant arrays, or hidden deleted-record copies.

No code, schema, deletion execution, footprint storage, live API, real DB mutation, protected-word JSON update, or implementation terminology acceptance occurred.

## Dev Handoff

No Dev packet is open.

Future Dev work requires a new Human / Overseer packet with exact deletion scope, accepted footprint storage class, backup/restore behavior, fixture cases, and verification commands.
