# AURA Atlas Current Work

Status: Idle after accepted HS74 review
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS74 Queue -> API request -> Evidence write confidence is accepted. Atlas is resting before the next Human/Overseer-selected storage/runtime hardening slice.

Source of intent:

- Human direction on 2026-05-25: continue with Queue -> API request -> Evidence write confidence hardening.
- Human design input: zKill-provided `killmail_id` is a Discovery anchor; ESI-expanded and Atlas-written `killmail_id` is the Evidence-confirmed anchor.
- Human design input: Evidence is the packet return from Atlas's gate into local memory; Discovery is the intermittent downstream packet before that.
- `workspace/OverseerHS52-runtime-record-integrity-design-input.md`
- `workspace/OverseerHS53-runtime-record-integrity-audit.md`
- `workspace/OverseerHS70-hs69-deletion-preflight-review.md`
- `workspace/OverseerHS73-hs72-snapshot-destination-review.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted baseline:

- Discovery refs and zKill previews are not Evidence.
- Expanded ESI killmail data and Atlas-owned derived activity events are Evidence.
- Enrich selected / manual expansion is the accepted Evidence-creation boundary.
- API request logs, fetch runs, ingestion audits, and data quality warnings are provenance/support records, not Evidence by themselves.
- Partial success must not be presented as complete local evidence coverage.
- Existing offline verification already includes `verify:queue-api-evidence-write`; HS74 may refine or extend that proof.
- Live/private/provider calls remain gated and are not required for HS74.

## Executor

Current executor: none

Expected handoff filename:

```txt
None. No Dev packet is open.
```

## Ordered Runway

No active Dev runway.

Next likely selectable lanes:

1. Queue stale/expiration policy.
2. Queue batch cadence and UX pacing.
3. Partial-success operator presentation/readout.
4. Production deletion execution design, with transaction, rollback, confirmation, snapshot disclosure, and failure behavior.
5. Native picker/UI rigging or broader support-artifact budget coverage if storage-location work resumes.

## Guardrails And Non-Goals

- No live/private/API calls.
- No production deletion execution.
- No retention/deletion policy changes.
- No snapshot, restore, active DB relocation, or storage-budget expansion.
- No UI redesign or renderer presentation work.
- No broad service registry, IPC, payload, schema, or term rename unless a focused boundary bug requires an Overseer/Human decision first.
- Do not treat zKill Discovery refs as Evidence.
- Do not treat failed/partial provider results as stored Evidence.
- Do not hide partial failure by reporting complete evidence coverage.
- Do not add automatic retry loops, background collection, or live watch behavior unless explicitly accepted in a later packet.

## Stop Conditions

Stop and return to Overseer/Human before any new implementation if:

- proving the boundary requires live provider access
- the fix requires schema migration or durable contract changes beyond focused verification support
- the implementation would blur Discovery with Evidence
- the implementation would blur provenance/support logs with Evidence
- the implementation requires deletion, pruning, restore, active DB relocation, or snapshot cleanup
- the implementation requires new user-facing doctrine or presentation decisions
- protected-term warnings suggest a new authority decision is required

## Required Verification

No active Dev packet.

If work resumes near HS74, run the focused set first:

```powershell
npm.cmd run verify:queue-api-evidence-write
npm.cmd run verify:partial-failures
npm.cmd run verify:manual-discovery
npm.cmd run verify:queue-selection
npm.cmd run verify:db-integrity
```

If service registry, main/preload, shared command behavior, or broad verification helpers change, also run:

```powershell
npm.cmd run verify:service-registry
npm.cmd run verify:all
```

Run warning-only terminology discovery if the packet touches terminology, bridge/display wording, protected terms, critical assets, or release/push readiness:

```powershell
npm.cmd run verify:protected-terms
```

Finish with:

```powershell
git status --short --branch
```

## Evidence

HS74 runway opened by Overseer.

Opening evidence:

- Previous git state was clean and synced with `origin/main`.
- HS72 is accepted and closed.
- No implementation was performed while opening HS74.
- No live calls, deletion execution, snapshot cleanup, restore, active DB relocation, schema changes, or UI work were opened.
- `npm.cmd run verify:protected-terms` completed with exit code 0.
- Protected-term discovery ran in working-set mode against 3 files.
- Warning count: 101.
- Warning classes: cross-project-borrowing 14, lab-quarantine-borrowing 70, atlas-candidate 17.
- The scan confirmed warning-only behavior; no renames and no protected-word JSON updates were performed.
- `git diff --check` passed.

Dev implementation completed for HS74.

Files reviewed:

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

Files changed:

- `scripts/verify-queue-api-evidence-write.js`
- `docs/current-state/current-evidence-pipeline.md`
- `workspace/current.md`
- `workspace/DevHS74-queue-api-evidence-confidence.md`

Trace of current queue -> API request -> Evidence write path:

- manual discovery stores zKill refs in `discovered_killmail_refs` as Discovery/provenance only
- queue selection is read-only and marks preview rows as non-Evidence
- manual expansion creates a `fetch_runs` row, selects pending/failed refs, marks them selected, and calls ESI only for uncached selected refs
- successful ESI responses normalize into `killmails`, `activity_events`, entity updates, and `ingestion_audits`
- failed ESI expansion creates `failed_expansion` warning provenance, marks the queue ref `failed`, and writes no partial Evidence
- persistence is atomic through `persistEvidencePackage`; persistence failure rolls back raw killmail and derived event writes
- successful refs become `expanded`; cached refs remain `cached`; failed refs remain reviewable for explicit retry

Existing verification coverage reviewed:

- `verify:queue-api-evidence-write`
- `verify:partial-failures`
- `verify:manual-discovery`
- `verify:queue-selection`

Implementation result:

- No runtime defect was found.
- Added verification-only confidence in `verify:queue-api-evidence-write`.
- The partial failure/retry proof now uses a file-backed fixture DB, closes/reopens after the mixed-result run, and proves durable reconstruction before retry.

Mixed success/failure behavior now proved:

- successful ESI-expanded killmail writes durable Evidence
- failed expansion writes no partial Evidence
- failed expansion leaves reviewable queue state and warning provenance
- zKill/Discovery anchor remains a queue/provenance row
- ESI-expanded killmail row is the Evidence-confirmed anchor

Duplicate/retry/idempotency behavior now proved:

- retry of failed ref writes the later successful Evidence
- retry does not duplicate activity event keys
- repeated selection of expanded/cached refs does not spend ESI or duplicate Evidence

Durable provenance/restart reconstruction now proved:

- expanded and failed queue refs
- fetch run counts and warning summary
- scoped ESI API logs
- failed-expansion warning rows
- ingestion audit rows
- stored killmail Evidence and derived activity events

Verification:

- `npm.cmd run verify:queue-api-evidence-write` passed.
- `npm.cmd run verify:partial-failures` passed.
- `npm.cmd run verify:manual-discovery` passed.
- `npm.cmd run verify:queue-selection` passed.
- `npm.cmd run verify:db-integrity` passed.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 4 files.
- Warning count: 239.
- Warning classes: lab-quarantine-borrowing 130, atlas-candidate 96, cross-project-borrowing 13.
- `git status --short --branch` reported `main...origin/main` with expected HS74 modified/untracked files.

Guardrail confirmation:

- No live calls, deletion execution, snapshot cleanup, restore, active DB relocation, schema change, service registry change, IPC/preload change, broad UI work, protected-word JSON update, or terminology rename occurred.

## Dev Handoff

Dev created:

```txt
workspace/DevHS74-queue-api-evidence-confidence.md
```

The handoff summarizes what confidence was added, confirms no runtime behavior changed, explains partial provider failure representation, and records deferred risks.

Overseer review:

```txt
workspace/OverseerHS75-hs74-queue-evidence-confidence-review.md
```

HS74 is accepted as verification-only. No runtime behavior changed.

Overseer verification:

- `npm.cmd run verify:queue-api-evidence-write` passed.
- `npm.cmd run verify:partial-failures` passed.
- `npm.cmd run verify:manual-discovery` passed.
- `npm.cmd run verify:queue-selection` passed.
- `npm.cmd run verify:db-integrity` passed.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 6 files.
- Warning count: 289.
- Warning classes: lab-quarantine-borrowing 167, atlas-candidate 99, cross-project-borrowing 23.
- `git diff --check` passed.
