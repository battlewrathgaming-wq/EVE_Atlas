# AURA Atlas Current Work

Status: Active audit packet - runtime and record integrity
Last updated: 2026-05-25

## Active Milestone

Milestone: Runtime And Record Integrity Audit

Source of intent:

- Human direction on 2026-05-25 to focus next on runtime/connection hardening and record manipulation/storage efficacy.
- `workspace/OverseerHS52-runtime-record-integrity-design-input.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- Existing verification commands in `package.json`

Current focus: audit Atlas runtime, queue, Watch, enrichment, storage, provenance, deletion/retention, and restart/recovery behavior against the HS52 design input and current implemented docs.

This packet is read-only audit work. It does not authorize implementation.

## Executor

Current executor: Engineering audit / Overseer review.

Expected handoff filename:

```txt
workspace/OverseerHS53-runtime-record-integrity-audit.md
```

## Ordered Runway

1. Read the source-of-intent files above, then inspect relevant code paths for:
   - discovery refs and queue selection
   - manual expansion / Enrich selected
   - ESI/zKill provider gates and partial-failure paths
   - Watch creation, scheduling, execution, cadence/lookback, and restart behavior
   - record writes, provenance tables, fetch/API logs, metadata hydration, and assessment linkage
   - retention/deletion/snapshot/preflight code paths
2. Build a record lifecycle trace:
   - Discovery packet/ref
   - gate
   - Evidence write
   - enrichment/hydration
   - provenance attachment
   - assessment linkage
   - deletion/footprint behavior
   - stale/refresh behavior
3. Build a runtime/queue/Watch trace:
   - External API gate
   - task/queue state
   - provider call or offline hydration
   - partial failure handling
   - Watch cadence/lookback
   - restart/recovery
   - renderer/user-facing status
4. Separate implemented behavior from design input, proposed policy, and unknowns. Be explicit where HS52 language is not implemented.
5. Identify risks, blockers, and meaningful gaps, especially:
   - Discovery/Evidence boundary
   - offline enrichment limits
   - partial API failures
   - queue statefulness across restart
   - Watch background collection surprise risk
   - deletion/footprint policy uncertainty
   - stale/refresh behavior
6. Run the required verification commands below, unless inspection shows a command is irrelevant or unsafe. Note any skipped command and why.
7. Write `workspace/OverseerHS53-runtime-record-integrity-audit.md` with findings, evidence, gaps, recommended bounded Dev packets if warranted, and verification results.

## Guardrails

- Audit only unless a later Human/Overseer packet explicitly opens implementation.
- No backend changes.
- No schema/migration changes.
- No persistence mutations outside normal read-only verification fixtures.
- No destructive deletion, pruning, compaction, or retention behavior.
- No bridge, IPC, service, payload, command, or contract renames.
- No renderer/UI implementation.
- No live/private/API calls unless explicitly authorized by the Human.
- Do not treat HS52 design input as implemented truth.
- Do not treat archived docs or gap files as active task queues.
- Preserve Atlas meanings for Evidence, Discovery, Watch, Marked, Enrich selected, provenance, Assessment Memory, and External API.

## Stop Conditions

Return to Human/Overseer before continuing if:

- the audit requires live/private provider calls
- verification would mutate the user's real local database
- inspection suggests destructive retention/deletion paths could run
- implementation changes appear necessary to answer the audit
- Evidence and Discovery meanings are ambiguous in a way that affects audit conclusions
- Watch behavior appears to collect beyond accepted gates/cadence/lookback

## Required Verification

Run focused offline checks:

```powershell
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:manual-discovery
npm.cmd run verify:manual
npm.cmd run verify:watch-scheduler
npm.cmd run verify:watch-executor
npm.cmd run verify:restart-recovery
npm.cmd run verify:task-concurrency
npm.cmd run verify:partial-failures
npm.cmd run verify:retention-preflight
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:db-integrity
npm.cmd run verify:evidence-rules
npm.cmd run verify:protected-terms
git status --short --branch
```

If the audit touches broad assumptions or the focused set reveals cross-cutting risk, also run:

```powershell
npm.cmd run verify:all
```

Do not run live smoke unless explicitly authorized by the Human.

## Audit Evidence

Auditor updates this section in the handoff, not necessarily in `current.md`:

```txt
Files/code paths reviewed:

Implemented behavior confirmed:

Design input not implemented:

Unknowns / needs decision:

Risks:

Verification run:
```

## Audit Handoff

Create:

```txt
workspace/OverseerHS53-runtime-record-integrity-audit.md
```

Handoff must include:

- files and code paths reviewed
- record lifecycle trace
- runtime/queue/Watch trace
- implemented behavior vs design input vs proposed policy
- partial failure and restart/recovery findings
- deletion/retention/footprint findings
- recommended bounded Dev packets, if any
- required Human decisions
- verification commands and results
- confirmation that no implementation, live calls, destructive actions, or protected-term updates were performed
