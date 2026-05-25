# AURA Atlas Current Work

Status: HS53 runtime and record integrity audit accepted; awaiting Human priority decision
Last updated: 2026-05-25

## Active Milestone

Milestone: Runtime And Record Integrity Audit

Source of intent:

- Human direction on 2026-05-25 to focus on runtime/connection hardening and record manipulation/storage efficacy.
- `workspace/OverseerHS52-runtime-record-integrity-design-input.md`
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Current focus: HS53 completed the read-only audit and is accepted as the current evidence base for runtime, queue, Watch, enrichment, storage, provenance, deletion/retention, and restart/recovery decisions.

No Dev runway is open.

## Executor

Current executor: None.

Completed handoff filename:

```txt
workspace/OverseerHS53-runtime-record-integrity-audit.md
```

## Accepted Audit Summary

Accepted findings:

- Discovery becomes Evidence only through accepted ESI expansion and `persistEvidencePackage` writes.
- zKill refs and queue previews remain Discovery/provenance, not Evidence.
- `Enrich selected` maps to `manual.expansion`; it can create expanded ESI killmail Evidence and update queue refs.
- Existing raw ESI payloads are preserved; repeated expansion updates `last_seen_at` and records conflicts as warnings rather than overwriting evidence.
- Offline hydration exists for known local labels and local SDE/report joins, but unresolved entity names remain live-gated.
- Provenance is distributed across fetch runs, API request logs, ingestion audits, data quality warnings, discovery source fields, metadata runs, and report joins.
- Assessment Memory remains separate from Evidence and validates cited local killmail context.
- Partial provider failures are mostly contained per stage; runs may still finalize as success with warnings and failed counts.
- Queue rows and Watch definitions are persistent; task runner state and Watch session armed state are volatile.
- Deletion/retention execution is not implemented as product capability. Broad deletion plus footprint remains design input only.

Verification accepted from HS53:

```txt
npm.cmd run verify:queue-selection - passed
npm.cmd run verify:queue-scope-isolation - passed
npm.cmd run verify:manual-discovery - passed
npm.cmd run verify:manual - passed
npm.cmd run verify:watch-scheduler - passed
npm.cmd run verify:watch-executor - passed
npm.cmd run verify:restart-recovery - passed
npm.cmd run verify:task-concurrency - passed
npm.cmd run verify:partial-failures - passed
npm.cmd run verify:retention-preflight - passed
npm.cmd run verify:runtime-snapshot - passed
npm.cmd run verify:db-integrity - passed
npm.cmd run verify:evidence-rules - passed
npm.cmd run verify:protected-terms - passed
npm.cmd run verify:all - passed
```

Guardrail confirmation accepted:

- no implementation
- no live API checks
- no destructive actions
- no real user data mutation
- no schema, persistence, bridge, IPC, service, payload, command, or UI changes
- no protected-term updates or renames

## Recommended Future Packets

HS53 recommends these bounded future packets:

1. Offline label refresh clarity packet.
2. Partial run status surfacing packet.
3. Queue stale/expiration design packet.
4. Evidence deletion policy design packet.
5. Watch recovery/readout polish packet.

These are recommendations only. They are not active work until Human/Overseer selects one and `workspace/current.md` is updated.

## Human Decisions Needed

- Should Atlas ever support Evidence deletion, or should raw ESI Evidence remain append/retain?
- If deletion is desired, what footprint survives?
- Should queue refs expire, and what summary survives?
- What does stale/refresh mean separately for raw Evidence, metadata labels, queue refs, and Watch schedules?
- Should `External API` remain preserve-exact in Atlas interfaces?

## Guardrails

- Do not start Dev work from this accepted audit state.
- Do not run live smoke unless explicitly authorized by the Human.
- Do not implement deletion, pruning, retention, or footprint behavior without a separate accepted policy packet.
- Do not change backend, schema, persistence, bridge, IPC, service, payload, command, or UI behavior without a new bounded runway.
- Preserve Atlas meanings for Evidence, Discovery, Watch, Marked, Enrich selected, provenance, Assessment Memory, and External API.

## Next Step

Await Human/Overseer selection of the next packet.
