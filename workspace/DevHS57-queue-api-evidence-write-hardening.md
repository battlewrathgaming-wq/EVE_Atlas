# DevHS57 - Queue API/Evidence Write Hardening

Date: 2026-05-25
Executor: Dev
Milestone: HS57 Queue API/Evidence Write Hardening

## Current Queue -> API -> Evidence Trace

1. Queue preview:
   - `src/main/services/serviceRegistry.js` exposes `queue.selection` as a read-only service command.
   - `src/main/services/queueSelectionService.js` owns `buildQueueExpansionSelection()`, `normalizeSelectionFilter()`, queue row loading, caps, selected/next/oldest/newest/priority selection, and preview annotation.
   - Selection only marks rows with `pending` or `failed` status as selectable. `cached`, `expanded`, and `superseded` rows are reported with skip reasons and do not count as expected ESI calls.
   - Preview fields are explicitly Discovery/provenance metadata and report `preview_is_evidence: false`.
2. Enrich selected:
   - `src/main/services/serviceRegistry.js` exposes `manual.expansion` as evidence-creating and confirmation-required.
   - `src/main/services/mutatingActionService.js` runs `runManualExpansionService()`, checks `assertLiveAllowed('manual.expansion', payload)`, normalizes the scope, then calls `expandManualRefs()`.
3. ESI planning/execution:
   - `src/main/workers/manualExpansionWorker.js` creates a `fetch_runs` row through `EvidenceRepository.createFetchRun()`.
   - `manualExpansionCandidates()` reloads eligible queue refs from `discovered_killmail_refs` with `status IN ('pending', 'failed')`, optional scope and selected killmail IDs, ordered by failed-first/priority/oldest, capped by `maxExpansions`.
   - `markDiscoveryRefsSelected()` records operator selection timestamp before ESI expansion.
   - `buildEvidencePackageFromRefs()` in `src/main/workers/killmailIngestionWorker.js` calls `repository.hasKillmail()` before ESI. Already accepted killmails increment `already_cached` and do not call ESI.
   - Uncached refs call `esiClient.expandKillmail(killmail_id, hash)` and normalize through `normalizeKillmail()`.
4. Partial failures:
   - Non-cancel ESI failures are captured as `failed_expansion` warnings in the evidence package; successful refs remain in the package.
   - `markFailedExpansionCandidates()` annotates failed candidates, and `EvidenceRepository.markDiscoveryRefsFailed()` sets failed queue state, increments `failure_count`, and records `last_error`.
5. Evidence write/idempotency:
   - `EvidenceRepository.persistEvidencePackage()` wraps killmail, activity event, entity, ingestion audit, and warning writes in one transaction.
   - `killmails` upsert by `killmail_id` preserves accepted raw evidence and updates only `last_seen_at`; conflicts generate warnings.
   - `activity_events` use `ON CONFLICT(event_key) DO NOTHING`, preserving idempotent re-runs.
   - After persistence, `markDiscoveryRefsExpanded()` marks successful refs expanded and `markDiscoveryRefsCached()` marks selected refs cached when evidence already exists without overriding expanded rows.
6. Provenance/run/API logging:
   - `fetch_runs` records trigger, watch type/id, counts, status, API counts, duration, and warning/error summary.
   - API calls are reconstructable from `api_request_logs` when the ESI client is backed by the repository/HTTP logging path.
   - `ingestion_audits` tie successful expanded ESI evidence to the fetch run and killmail ID.

## Files Changed

- `scripts/verify-queue-api-evidence-write.js`
  - Added focused offline verifier for the Queue -> Enrich selected -> ESI -> Evidence boundary.
- `package.json`
  - Added `verify:queue-api-evidence-write`.
- `scripts/verify-group.js`
  - Added `verify:queue-api-evidence-write` to the core/all verification group.

No production service, backend, schema, IPC, command, payload, persistence, or contract code was changed.

## Dangerous Cases Covered

- Cached selected refs are visible in queue preview with `skip_reason: cached`, are not selected for expansion, and do not count as expected ESI calls.
- Manual expansion with one cached and one uncached selected ref spends ESI only on the uncached ref.
- Repeated selection of an already expanded ref produces no candidates, spends no ESI calls, and does not create duplicate Evidence rows.
- Fresh queued Discovery refs do not create killmail Evidence before accepted ESI expansion.
- Partial ESI failure persists the successful Evidence write, records the failed ref as `failed`, keeps the fetch run reconstructable, and keeps successful ingestion audit/API log records.
- Retry of the unresolved failed ref selects only that ref, writes Evidence idempotently, and marks it expanded.
- Duplicate activity event keys remain absent after retry.

## Queue Status Transition Behavior

- Discovery queue insert:
  - `upsertDiscoveredKillmailRefs()` writes `pending` unless `hasKillmail(killmail_id)` is already true, in which case it writes `cached`.
- Selection:
  - `markDiscoveryRefsSelected()` records `selected_for_expansion_at` without changing status.
- Successful expansion:
  - `markDiscoveryRefsExpanded()` writes `expanded`, `expanded_at`, and clears `last_error`.
- Already accepted/cached evidence:
  - `markDiscoveryRefsCached()` writes `cached` for selected refs that now have a local killmail and are not already `expanded`.
- Failed ESI expansion:
  - `markDiscoveryRefsFailed()` writes `failed`, `failed_at`, increments `failure_count`, and stores `last_error`.

## Partial Failure / Retry Behavior

Verified with fixture ESI client and in-memory DB:

- First run selected refs `9201` and `9202`.
- `9201` expanded and wrote killmail/activity/audit evidence.
- `9202` simulated a 503 ESI failure, stayed reviewable as `failed`, and recorded the error in queue/run/API state.
- Retry selected only `9202`, wrote it successfully, and moved it to `expanded`.

No retry policy change was needed.

## Evidence Idempotency and Provenance

- Successful ESI expansion writes Evidence through `persistEvidencePackage()` transactionally.
- Repeated expansion against an `expanded` ref created no extra killmail, activity event, audit, or warning rows.
- Partial failure recorded:
  - `fetch_runs` counts and error summary
  - scoped `api_request_logs`
  - `ingestion_audits` for successful Evidence
  - queue status/error state for unresolved refs

This is sufficient to reconstruct the local Queue -> API -> Evidence boundary for the covered cases.

## Verification

Commands run:

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

Results:

- `verify:queue-api-evidence-write`: passed.
- `verify:queue-selection`: passed.
- `verify:queue-preflight`: passed.
- `verify:queue-report`: passed.
- `verify:manual-discovery`: passed.
- `verify:partial-failures`: passed.
- `verify:evidence-rules`: passed.
- `verify:live-api-gate`: passed.
- `verify:protected-terms`: exit 0, warning-only after final documentation updates.
- `verify:all`: passed, 64 scripts.

Protected-term output:

- Files scanned: 4.
- Warning count: 252.
- Classes: `atlas-candidate=148`, `lab-quarantine-borrowing=98`, `cross-project-borrowing=6`.
- Confirmation: warning-only; no renames performed; no protected-word JSON updates performed.

## Boundary Confirmations

- No live/API calls were run.
- No user real database was mutated; verification used in-memory databases and existing `.tmp` verification fixtures.
- Discovery refs remained Discovery until accepted ESI expansion wrote Evidence.
- `Enrich selected` remains deliberate ESI expansion into stored Evidence.
- Expanded ESI killmail remains the authoritative Evidence source.
- Metadata hydration/readability behavior was not changed.
- No schema, migration, contract, command, IPC, payload, service, or product terminology rename was performed.
- `Watch_offline` shape was not changed.

## Risks / Deferred Decisions

- No production defect was proven by HS57 verification, so no production code was changed.
- API log sufficiency depends on using the repository-backed HTTP/ESI path or equivalent test logging client. The focused verifier proves the reconstruction model with scoped API logs but does not change clients.
- Retention/deletion policy remains outside this packet.

## Recommended Next Action

Overseer review HS57 and, if accepted, choose the next read/write hardening packet around another mutation boundary rather than expanding Queue scope further.
