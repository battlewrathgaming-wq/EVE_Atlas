# AURA Atlas Current Work

Status: Active Dev packet - Queue API/Evidence write hardening
Last updated: 2026-05-25

## Active Milestone

Milestone: Queue API/Evidence Write Hardening

Source of intent:

- Human direction on 2026-05-25: after `Watch_offline`, focus read/write hardening on the Queue boundary because Queue controls API request flow.
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/DevHS56-watch_offline-readout-support.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/adr/ADR-0001-zkill-is-discovery-only.md`
- `docs/adr/ADR-0002-expanded-killmails-authoritative.md`
- `docs/adr/ADR-0004-staged-collection-and-expansion-budgets.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Current focus: harden the local Queue -> Enrich selected -> ESI request planning/execution -> Evidence write boundary. Queue is the API-request gate between Discovery refs and durable Evidence. This packet is test-led: trace first, add or strengthen focused offline verification, then implement only local fixes directly tied to proven gaps.

## Executor

Current executor: Dev.

Expected handoff filename:

```txt
workspace/DevHS57-queue-api-evidence-write-hardening.md
```

## Ordered Runway

1. Read the source-of-intent files above, then trace current code paths for:
   - queued Discovery ref selection and caps
   - `Enrich selected`
   - cached/ref dedupe behavior
   - ESI expansion request planning/execution
   - partial ESI failure handling
   - Evidence writes and idempotency
   - queue status transitions
   - provenance/run/API logging
2. Identify the exact current Queue -> API -> Evidence flow in the handoff before changing code. Include the files/functions that own each stage.
3. Add or strengthen focused offline verification for dangerous cases:
   - selected refs are not double-expanded accidentally
   - cached refs do not spend ESI/API calls
   - partial ESI failure records failed/skipped state without corrupting successful Evidence writes
   - retry can pick up unresolved refs cleanly
   - successful ESI expansion writes Evidence idempotently
   - provenance, fetch run, ingestion audit, API log, or equivalent local record is sufficient to reconstruct what happened
   - Discovery refs remain Discovery until accepted ESI expansion writes Evidence
4. Before implementation, be able to answer clearly in the handoff:
   - What is the current trace from Queue refs to Evidence writes?
   - Which dangerous cases were proven by verification?
   - Did any policy, schema, or product decision become necessary?
5. Implement only local hardening fixes that are directly proven by the verification work and stay within existing product meaning.
6. Preserve accepted terms and effects:
   - zKill refs / queue refs are Discovery, not Evidence.
   - `Enrich selected` is the deliberate ESI expansion into stored Evidence.
   - Expanded ESI killmail is the authoritative Evidence source.
   - Metadata hydration / label refresh is not Evidence creation.
7. Run required verification.
8. Create `workspace/DevHS57-queue-api-evidence-write-hardening.md` with trace, changes, verification, risks, and any deferred policy decisions.

## Acceptance Criteria

HS57 is acceptable if the handoff and verification prove:

- The Queue -> `Enrich selected` -> ESI request -> Evidence write trace is explicit enough for Overseer review.
- At least one focused hardening verifier covers the risky boundary, or existing focused verifiers are strengthened with named cases.
- Cached refs do not spend ESI calls.
- Duplicate or repeated selection cannot accidentally double-create Evidence.
- Partial ESI failure preserves successful Evidence writes and records unresolved/failed refs clearly enough for retry.
- Retry behavior is proven for unresolved refs, or a precise stop/deferred decision is recorded.
- Evidence writes remain idempotent.
- Provenance/run/API/local records are sufficient to reconstruct what happened at the boundary, or the exact missing record model is escalated.
- Discovery refs remain Discovery until accepted ESI expansion writes Evidence.
- No live/API calls, user real database mutation, schema/migration changes, service/command/payload renames, or product meaning changes occurred unless explicitly approved.
- If Dev is unsure about a case, acceptance should widen toward better evidence, clearer trace, or explicit deferral, not broader implementation.

## Guardrails

- No live/private/API calls unless explicitly authorized by the Human.
- Use fixtures/mocks/local in-memory DBs for verification.
- Do not mutate the user's real local database.
- No UI redesign.
- No schema/migration changes unless Dev proves the hardening cannot be safely represented without one and stops for Overseer approval first.
- No bridge, IPC, service, payload, command, or contract renames.
- Do not rename Queue, Discovery, Evidence, Enrich selected, External API, provenance, Watch, Marked, or `Watch_offline`.
- Do not change `Watch_offline` readout shape unless a bug directly impacts this packet and Overseer approves.
- Do not broaden into deletion/retention policy execution.
- Do not broaden into Watch authoring hardening except where Watch-produced queue refs are needed as fixtures for this boundary.

## Stop Conditions

Stop and return to Overseer if:

- live/API behavior is needed to prove the hardening
- a schema/migration change appears necessary
- retention/deletion policy must be decided
- Queue status semantics are insufficient and require product decision
- retry behavior requires a new user-facing policy
- provenance/logging records cannot reconstruct the boundary without a broader record model change
- Dev cannot clearly show the current Queue -> API -> Evidence trace before implementation
- Dev cannot name the dangerous case proven by verification
- a fix requires service/command/payload renames
- verification requires mutating the user's real local database
- protected-term output suggests new terminology authority decisions are needed

## Required Verification

Run focused offline checks:

```powershell
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-preflight
npm.cmd run verify:queue-report
npm.cmd run verify:manual-discovery
npm.cmd run verify:partial-failures
npm.cmd run verify:evidence-rules
npm.cmd run verify:live-api-gate
npm.cmd run verify:protected-terms
git status --short --branch
```

Add and run a focused hardening verifier if Dev creates one, for example:

```powershell
npm.cmd run verify:queue-api-evidence-write
```

If Dev touches shared ingestion, evidence persistence, service registry, or task-runner behavior, also run:

```powershell
npm.cmd run verify:all
```

Do not run live smoke unless explicitly authorized by the Human.

## Evidence

Dev must update this section in the handoff, not necessarily in `current.md`:

```txt
Trace of current Queue -> API -> Evidence flow:

Files/functions changed:

Dangerous cases covered:

Queue status transition behavior:

Partial failure / retry behavior:

Evidence idempotency and provenance:

Verification run:

Protected-term output:

Deferred decisions:
```

## Dev Handoff

Create:

```txt
workspace/DevHS57-queue-api-evidence-write-hardening.md
```

Handoff must include:

- trace of the current Queue -> API -> Evidence flow
- files/code paths changed
- verification cases added or strengthened
- any implementation fixes and why each was necessary
- confirmation no live/API calls were run
- confirmation no user real database was mutated
- confirmation Discovery/Evidence/Enrich selected meanings were preserved
- confirmation no schema/migration/contract/command/payload renames were performed, or exact approved exception if Overseer authorized one
- verification commands and results
- warning-only protected-term output and noisy classes
- recommended next packet for remaining read/write hardening, if clear
