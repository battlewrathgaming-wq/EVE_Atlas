# Overseer HS94 - HS93 Review And Operator Intent Note

Date: 2026-05-26
Role: Atlas Overseer
Status: accepted
Milestone: Atlas Storage And Runtime Hardening

## Decision

Accept DevHS93.

The R-Scanner prototype stayed renderer-only and light. It proves the display contract over `watch.offline_readout` without changing backend behavior, IPC, payloads, schema, persistence, scheduler logic, Watch semantics, Discovery refs, Evidence/EVEidence writes, hydration, deletion/retention, provider behavior, or source/bridge terminology.

## Reviewed

- `workspace/DevHS93-r-scanner-watch-offline-renderer-prototype.md`
- `workspace/current.md`
- `workspace/OverseerHS93-r-scanner-renderer-prototype-runway.md`
- `workspace/OverseerHS92-hs91-alpha-observation-review.md`
- `workspace/DisplayResponseHS86-atlas-r-scanner-powered-down-console.md`
- `workspace/UIUXHS84-watch-recovery-readout-interpretation.md`
- `workspace/critical/critical-terms.md`
- `src/renderer/index.html`
- `src/renderer/app.js`
- `src/renderer/queueWatch.js`
- `src/renderer/styles.css`
- `scripts/verify-renderer-shell.js`
- `.tmp/electron-visual-smoke/queue-watch.png`

## Accepted Implementation

- Added a compact R-Scanner panel to the existing Queue / Watch view.
- Consumes `watch.offline_readout` through the existing renderer service bridge.
- Keeps `Watch_offline` as the source model.
- Keeps R-Scanner / R-scan as presentation-only language.
- Uses a static/powered-down scanner face, with no sweep or active scan implication.
- Maps disarmed/offline, pending local Discovery refs, provider waiting, missed-slot recovery, orphan review, and missing/malformed radius scope into operator-facing labels.
- Preserves Discovery, Evidence/EVEidence, Watch, and hydration boundaries in the panel.

## Review Notes

The prototype is accepted as a display-contract proof, not final UI. It is text-heavy by design and should remain replaceable during the later facelift.

One minor non-blocking note: startup currently loads Watch executor status through `loadWatchStatus()` and also calls `loadWatchExecutorStatus()` in the initial load group. This is harmless duplicate read-only status work and can be cleaned later if it becomes noisy.

## Operator Intent Captured

Atlas should answer the operator question:

```txt
Do I need to do anything?
```

If no action is needed, Atlas should show calm progress, light state text, and no diagnostic overload.

If operator action is needed, Atlas should surface a light inbox/row item shaped as:

```txt
[Situation] [brief insight] [needed action]
```

Diagnostic detail should be available at point of need rather than occupying the first screen.

## R-Scanner And Sequencer Direction

R-Scanner / Sequencer is not intended as instant search presentation. It is a patient discovery engine that builds and enriches data sets over time. Long jobs, including tens of minutes for large enrichment batches, are acceptable if Atlas is honest about state, progress, and whether operator action is needed.

Accepted presentation direction from Human discussion:

- Disarmed: ready to work, but needs preflight such as External API/network gate or storage path.
- Waiting: ready to scan or safely holding.
- Pending input/activity: activity detected.
- Missed Watch slot: recovery pending or recovery complete, with a diagnostic row if needed.
- Orphan review: diagnostic inbox/row catchment, not first-screen panic.
- Queued: scheduled.
- Provider wait: ESI callback pending.
- Paused: R-scan on hold, with reason if known.
- Caught up/resumed: affirmative state showing nothing is needed from the operator.

## Retention And Storage Direction

Deletion promise:

- Deletion of active local records is absolute.
- Snapshots/backups are separate support/recovery artifacts and should disclose their path so the operator can clean them too.

Storage direction:

- Atlas may become data-heavy.
- Operator-defined storage location and storage budget are important product features.
- A storage path should be configured before meaningful collection.
- Near limit: warn and point to pruning.
- At full limit: stop/deadlock acquisition to preserve existing records rather than overwrite or malform datasets.
- Snapshot opt-in/default behavior should wait until snapshot size is better proven.

## Assessment And Observation Direction

Assessments should be their own entities with metadata tags and relationships to the ingredients present when they were formed, such as killmail, pilot ID, system, and later corporation/alliance where accepted.

Atlas records are loosely connected parts. A killmail is one complete presentation of connected parts, but an operator should also be able to search a pilot and see associated killmails, assessments, observations, and related context.

Observation is the middle layer that pulls connected parts into a story.

## Verification Rerun

Passed:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run verify:watch-offline-readout
npm.cmd run smoke:electron
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

`verify:protected-terms` stayed warning-only. It scanned 6 working-set files and reported:

- warning count: 1487
- atlas-candidate: 902
- lab-quarantine-borrowing: 511
- cross-project-borrowing: 74

No renames and no protected-word JSON updates were performed.

## Accepted Next Direction

Atlas can rest after HS93 unless Human chooses another packet.

Likely next choices:

1. Human/UIUX review of the R-Scanner prototype against the operator-intent note.
2. A small follow-up renderer polish packet only if the prototype blocks understanding before the facelift.
3. Return to storage/runtime hardening for storage path/budget or sequencer progress behavior.
