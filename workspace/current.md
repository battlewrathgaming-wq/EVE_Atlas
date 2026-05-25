# AURA Atlas Current Work

Status: Idle after accepted Queue API/Evidence write hardening
Last updated: 2026-05-25

## Active Milestone

Milestone: Queue API/Evidence Write Hardening

Source of intent:

- Human direction on 2026-05-25: after `Watch_offline`, focus read/write hardening on the Queue boundary because Queue controls API request flow.
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/DevHS56-watch_offline-readout-support.md`
- `workspace/DevHS57-queue-api-evidence-write-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/adr/ADR-0001-zkill-is-discovery-only.md`
- `docs/adr/ADR-0002-expanded-killmails-authoritative.md`
- `docs/adr/ADR-0004-staged-collection-and-expansion-budgets.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Current focus: HS57 is accepted. Atlas now has a focused offline verifier covering the Queue -> `Enrich selected` -> ESI request -> Evidence write boundary. No Dev packet is currently open.

## Executor

Current executor: none; awaiting Human / Overseer selection for the next bounded read/write hardening slice.

Expected handoff filename: none until a new packet is opened.

## Accepted HS57 Understanding

HS57 traced the current Queue -> API -> Evidence flow:

- `queue.selection` is read-only through `serviceRegistry` and `queueSelectionService`.
- Queue selection only treats `pending` and `failed` refs as selectable.
- `cached`, `expanded`, and `superseded` refs are skipped and do not count as expected ESI calls.
- `manual.expansion` is the evidence-creating `Enrich selected` path.
- `manualExpansionWorker.expandManualRefs()` creates `fetch_runs`, selects eligible refs, records selection time, skips locally cached killmails before ESI, expands uncached refs through ESI, persists expanded ESI killmails as Evidence, marks successful refs expanded, cached refs cached, and failed refs failed.
- `persistEvidencePackage()` keeps killmail/activity/audit/warning writes transactional and idempotent.
- `fetch_runs`, `api_request_logs`, `ingestion_audits`, and queue status/error state are sufficient to reconstruct the covered boundary.

HS57 added:

```txt
scripts/verify-queue-api-evidence-write.js
npm.cmd run verify:queue-api-evidence-write
```

No production service, backend, schema, IPC, command, payload, persistence, contract, or product terminology code was changed.

## Accepted Coverage

The new verifier proves:

- cached selected refs do not spend ESI/API calls
- repeated selection of expanded refs does not double-create Evidence
- fresh Discovery refs remain non-Evidence before accepted ESI expansion
- partial ESI failure preserves successful Evidence writes
- failed refs remain reviewable/retryable as `failed`
- retry of unresolved failed refs writes Evidence and marks the ref expanded
- duplicate activity event keys are not created by retry
- fetch run, API log, ingestion audit, and queue state can reconstruct the covered boundary

No schema change, retry policy change, retention/deletion decision, live/API proof, or service/command/payload rename was required.

## Remaining Work Options

No work is active by default.

Recommended future read/write hardening slices, to be selected one at a time:

- provenance/API logging sufficiency across non-fixture clients
- retention/deletion execution and footprint behavior
- Watch authoring/write-boundary consistency
- metadata hydration/label refresh write boundaries
- Assessment Memory write/citation integrity

Do not reopen Queue hardening unless a new defect or product decision appears.

## Guardrails

- No implementation is authorized by this idle state.
- No live/private/API calls unless explicitly authorized by the Human.
- Do not mutate the user's real local database.
- No UI redesign.
- No schema/migration changes unless a future packet explicitly authorizes them.
- No bridge, IPC, service, payload, command, or contract renames unless a future packet explicitly authorizes them.
- Preserve Queue, Discovery, Evidence, Enrich selected, External API, provenance, Watch, Marked, and `Watch_offline` meanings.
- Do not broaden into deletion/retention policy execution without Human / Overseer selection.

## Stop Conditions

Return to Human / Overseer before opening work if:

- the next hardening scope spans multiple persistence domains at once
- live/API behavior is needed to prove the hardening
- a schema/migration change appears necessary
- retention/deletion policy must be decided
- retry behavior requires a new user-facing policy
- provenance/logging records require a broader record model change
- a fix requires service/command/payload renames
- verification requires mutating the user's real local database
- protected-term output suggests new terminology authority decisions are needed

## Required Verification

HS57 was accepted with:

```powershell
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-preflight
npm.cmd run verify:queue-report
npm.cmd run verify:manual-discovery
npm.cmd run verify:partial-failures
npm.cmd run verify:evidence-rules
npm.cmd run verify:live-api-gate
npm.cmd run verify:protected-terms
npm.cmd run verify:all
git status --short --branch
```

Local Overseer verification result: all focused checks passed, and `verify:all` passed 64 scripts including `verify:queue-api-evidence-write`. `verify:protected-terms` passed warning-only with expected advisory warnings across changed verifier/handoff/state files.

## Evidence

Accepted handoff:

```txt
workspace/DevHS57-queue-api-evidence-write-hardening.md
```

Accepted implementation files:

```txt
scripts/verify-queue-api-evidence-write.js
scripts/verify-group.js
package.json
```

## Dev Handoff

No Dev packet is open.

The next Dev packet should be a bounded read/write hardening packet selected by Human / Overseer and should name:

- exact persistence/write boundary under review
- allowed files and non-goals
- expected failure/recovery cases
- required offline verification commands
- whether `verify:all` is required
