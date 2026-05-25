# AURA Atlas Current Work

Status: Active Dev runway opened
Last updated: 2026-05-25

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS74 is a bounded Queue -> API request -> Evidence write confidence packet. Atlas should prove, with offline fixtures, what happens when queued Discovery refs are expanded through the API/ESI boundary into stored Evidence, especially under partial provider failure and mixed success/failure conditions.

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

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS74-queue-api-evidence-confidence.md
```

## Ordered Runway

1. Read the source of intent and trace the current queue-to-Evidence path in code:
   - queued Discovery refs
   - API/ESI expansion request handling
   - Evidence writes into `killmails` and `activity_events`
   - `fetch_runs`, `api_request_logs`, `ingestion_audits`, `data_quality_warnings`, and queue status updates
2. Review existing offline verification for this boundary, especially `verify:queue-api-evidence-write`, `verify:partial-failures`, `verify:manual-discovery`, `verify:queue-selection`, and any helper fixtures they use.
3. Add or refine focused offline fixture coverage that proves mixed-result behavior:
   - successful ESI-expanded killmail writes durable Evidence
   - failed expansion does not write partial Evidence
   - failed expansion leaves reviewable provenance/status
   - retries or later success do not duplicate Evidence
   - zKill/Discovery anchor and ESI/Evidence-confirmed anchor remain distinct
4. Ensure the readout/provenance records are sufficient to reconstruct what happened after restart using durable SQLite/support state, without relying on volatile task memory.
5. If a real defect is found, make the smallest code correction required to preserve the accepted boundary. Do not broaden into product redesign.
6. Update current-state docs only where implemented behavior or verified confidence changes.
7. Update this file Evidence / Dev Handoff sections and create the expected DevHS74 handoff.

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

Stop and return to Overseer/Human before implementation if:

- proving the boundary requires live provider access
- the fix requires schema migration or durable contract changes beyond focused verification support
- the implementation would blur Discovery with Evidence
- the implementation would blur provenance/support logs with Evidence
- the implementation requires deletion, pruning, restore, active DB relocation, or snapshot cleanup
- the implementation requires new user-facing doctrine or presentation decisions
- protected-term warnings suggest a new authority decision is required

## Required Verification

Run the focused set first:

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

To be completed by Dev after implementation:

- files reviewed
- files changed
- trace of the current queue -> API request -> Evidence write path
- existing verification coverage reviewed
- any defect found and correction made, or confirmation that added proof was verification-only
- mixed success/failure fixture behavior
- duplicate/retry/idempotency behavior
- durable provenance/restart reconstruction behavior
- commands run and results
- confirmation that no live calls, deletion execution, snapshot cleanup, active DB relocation, broad UI work, or terminology rename occurred

## Dev Handoff

Dev should create:

```txt
workspace/DevHS74-queue-api-evidence-confidence.md
```

The handoff must summarize what confidence was added, whether any behavior changed, how partial provider failure is represented, and what remains deferred.
