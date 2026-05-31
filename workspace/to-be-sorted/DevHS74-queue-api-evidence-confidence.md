# DevHS74 - Queue API Evidence Confidence

Date: 2026-05-25
Executor: Dev
Milestone: HS74 Queue -> API Request -> Evidence Write Confidence

## Scope

Added focused offline fixture proof for the Queue -> ESI request -> Evidence write boundary.

This was verification-only. No product behavior, schema, service registry, IPC/preload, renderer UI, live/API gate, deletion, retention, snapshot, restore, active DB relocation, or terminology rename was changed.

## Files Reviewed

- `workspace/current.md`
- `workspace/OverseerHS52-runtime-record-integrity-design-input.md`
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/OverseerHS70-hs69-deletion-preflight-review.md`
- `workspace/OverseerHS73-hs72-snapshot-destination-review.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/db/evidenceRepository.js`
- `src/main/services/queueSelectionService.js`
- `scripts/verify-queue-api-evidence-write.js`
- `scripts/verify-partial-failures.js`
- `scripts/verify-manual-discovery.js`
- `scripts/verify-queue-selection.js`

## Files Changed

- `scripts/verify-queue-api-evidence-write.js`
  - Converted the partial failure/retry proof to a file-backed fixture DB.
  - Reopened the DB after the mixed-result run before retrying.
  - Added durable reconstruction assertions for queue state, Evidence rows, activity events, ESI API logs, ingestion audits, and failed-expansion warnings.
  - Added explicit Discovery anchor versus Evidence-confirmed anchor assertions.
- `docs/current-state/current-evidence-pipeline.md`
  - Recorded the verified mixed expansion/retry and restart reconstruction confidence.
- `workspace/current.md`
  - Updated HS74 Evidence and Dev Handoff.
- `workspace/DevHS74-queue-api-evidence-confidence.md`
  - Created this handoff.

## Path Trace

Current queue-to-Evidence path:

1. Manual discovery stores zKill refs in `discovered_killmail_refs`; preview fields remain Discovery/provenance and do not write `killmails` or `activity_events`.
2. Queue selection is read-only and marks preview fields as non-Evidence.
3. Manual expansion creates a `fetch_runs` row, selects pending/failed refs, marks them selected, and calls ESI for uncached selected refs.
4. Successful ESI responses are normalized into `killmails`, `activity_events`, entity updates, and `ingestion_audits`.
5. ESI failures produce `failed_expansion` warnings and mark the queue ref `failed`; no partial Evidence row is written.
6. `persistEvidencePackage` writes Evidence atomically; persistence failure rolls back raw killmail and derived event writes.
7. Successful refs become `expanded`; already cached refs stay `cached`; failed refs remain reviewable for explicit retry.

## Confidence Added

The strengthened `verify:queue-api-evidence-write` now proves:

- successful ESI-expanded killmail writes durable Evidence
- failed expansion does not write partial Evidence
- failed expansion leaves reviewable queue status and warning provenance
- scoped ESI API logs and ingestion audits survive restart
- retries after failure write the later successful Evidence without duplicating activity event keys
- repeated selection of already expanded/cached refs does not spend ESI or duplicate Evidence
- zKill/Discovery anchors remain queue/provenance rows
- ESI-expanded killmail rows are the Evidence-confirmed anchors

## Behavior Changed

No runtime behavior changed. This packet added confidence around existing behavior.

## Verification

Commands run:

```powershell
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:partial-failures
npm.cmd run verify:manual-discovery
npm.cmd run verify:queue-selection
npm.cmd run verify:db-integrity
npm.cmd run verify:protected-terms
git status --short --branch
```

Results:

- `verify:queue-api-evidence-write`: passed.
- `verify:partial-failures`: passed.
- `verify:manual-discovery`: passed.
- `verify:queue-selection`: passed.
- `verify:db-integrity`: passed.
- `verify:protected-terms`: passed warning-only.
- Protected-term discovery scanned 4 working-set files.
- Warning count: 239.
- Warning classes: lab-quarantine-borrowing 130, atlas-candidate 96, cross-project-borrowing 13.
- `git status --short --branch`: `main...origin/main` with expected HS74 modified/untracked files.

## Risks / Deferred

- Partial success still finalizes as `success` with failed counts and warning summary; operator-facing surfaces must continue to avoid implying complete local evidence coverage.
- Queue stale/expiration policy remains deferred.
- Broader support-artifact budget, deletion execution, pruning, restore, and active DB relocation remain out of scope.

## Recommended Next Action

Overseer review HS74. If accepted, choose whether to improve partial-success operator presentation or open a queue stale/expiration policy packet.
