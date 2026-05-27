# AURA Atlas Current Work

Status: Active Dev runway - storage authority preflight
Last updated: 2026-05-27

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS105 opens a read-only storage authority preflight/inventory packet. This is instrumentation before lockout policy.

Source of intent:

- Human storage/runtime hardening direction accepted on 2026-05-25.
- Human accepted the post-HS82 next step: inspect how the `Watch_offline` recovery state should read to an operator before adding more machinery.
- Human advisory on 2026-05-26: final presentation may not expose Watch directly; R-Scanner / R-scan is a candidate presentation metaphor.
- Human preference on 2026-05-26: focus on runtime evidence before UI presentation because Atlas has nothing useful to show if the system state is broken.
- Human accepted on 2026-05-26: proceed with a targeted runtime/use observation pass before UI.
- Human accepted on 2026-05-26: proceed with the R-Scanner renderer prototype, keeping frontend/render work light because a facelift is expected soon.
- Human product direction on 2026-05-26: Atlas should answer "Do I need to do anything?", surface action-needed states as light diagnostic rows, treat R-Scanner/Sequencer as patient background discovery, require honest storage/deletion posture, and treat Observation as the layer that pulls connected records into story.
- Human product direction on 2026-05-26: Observation is a presentation/query layer that starts from anchors such as killmail ID, pilot ID, corporation ID, or system ID and pulls connected records into story without creating new truth.
- Human direction on 2026-05-27: keep immediate effects in `workspace/current.md`, offload elements that creep beyond current working memory into durable docs, and preserve UI spatial guidance as presentation workflow rather than Atlas source authority.
- Human storage direction on 2026-05-27: real/alpha collection should lock until storage location is explicit; budget means disk-space used in the pointed Atlas location, not scan credits; 70%/95% warn and 100% hard-lock writes/acquisition; missing/unavailable storage should hard-lock instead of silently relocating; pruning is a future intelligence-formation suite.
- Human storage path direction on 2026-05-27: Atlas should behave as a portable briefcase with app-local storage config, not hidden Windows settings; no silent relocation if storage disappears; migration/copy/move is out of scope unless explicitly opened.
- Human pruning direction on 2026-05-27: pruning should support variable time windows, no-interest/Marked filtering, entity ID filtering, and Assessment reference review; noise means stale or excessive records that no longer serve target hunting, threat detection, or current pattern recognition.
- Human local lookup direction on 2026-05-27: local records are the preferred cheap substrate for story formation; ESI enrichment can fill gaps but is explicit, provider-gated, slower, and not a silent substitute for healthy local storage. Long-term ambition is listening-post style workflows that learn corporation behavior.
- Systems audits HS100-HS103 on 2026-05-27 accepted as advisory review input: storage authority preflight/inventory is the strongest next system candidate; typed actor name live-gate classification, pruning relationship preview, and Sequencer cadence readout are secondary bounded candidates.
- Human `Go ahead` on 2026-05-27 accepted opening the storage authority preflight/inventory runway.
- `workspace/OverseerHS105-storage-authority-preflight-runway.md`
- `workspace/OverseerHS104-systems-audit-synthesis-review.md`
- `workspace/SystemsAuditHS100-storage-path-budget-authority.md`
- `workspace/SystemsAuditHS101-local-lookup-vs-esi-enrichment.md`
- `workspace/SystemsAuditHS102-pruning-readiness.md`
- `workspace/SystemsAuditHS103-sequencer-provider-cadence.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/features/observation-lookup-model.md`
- `docs/features/r-scanner-sequencer-presentation.md`
- `workspace/OverseerHS95-observation-lookup-product-note.md`
- `workspace/OverseerHS94-hs93-review-and-operator-intent-note.md`
- `workspace/OverseerHS93-r-scanner-renderer-prototype-runway.md`
- `workspace/OverseerHS92-hs91-alpha-observation-review.md`
- `workspace/DevHS91-watch-offline-alpha-observation.md`
- `workspace/OverseerHS91-watch-offline-alpha-observation-runway.md`
- `workspace/OverseerHS89-hs88-runtime-evidence-review.md`
- `workspace/OverseerHS90-keyword-housekeeping-review.md`
- `workspace/DevHS88-watch-offline-runtime-evidence.md`
- `workspace/OverseerHS88-watch-offline-runtime-evidence-runway.md`
- `workspace/OverseerHS87-hs86-lab-response-review.md`
- `workspace/DisplayResponseHS86-atlas-r-scanner-powered-down-console.md`
- `workspace/OverseerHS85-hs84-watch-recovery-interpretation-review.md`
- `workspace/OverseerHS86-r-scanner-display-request-review.md`
- `workspace/RequestDisplayHS86-r-scanner-powered-down-console.md`
- `workspace/UIUXHS84-watch-recovery-readout-interpretation.md`
- `workspace/OverseerHS84-watch-recovery-readout-interpretation-runway.md`
- `workspace/OverseerHS83-hs82-watch-recovery-review.md`
- `workspace/DevHS82-watch-recovery-diagnostic-readout.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

Accepted baseline:

- `Watch_offline` is a read-only support/readout model.
- `Watch_offline.watches[]` includes `recovery` and `next_safe_action`.
- Watch config is durable intent.
- Discovery refs are returned zKill work awaiting ESI/cache handling.
- Evidence/EVEidence is completed ESI-expanded truth.
- Watch recovery readout is derived operator state.
- Timer firing means a Watch should be considered, not that provider work must start now.
- Waiting is not failure.
- Watch restart remains disarmed by default.

Accepted presentation guidance:

- Atlas source/internal term remains Watch.
- Atlas bridge/readout model remains `Watch_offline`.
- Presentation candidate: R-Scanner.
- Short interaction candidate: R-scan.
- Preferred future display method: powered-down central console.
- R-Scanner should look intentionally disarmed/offline, not broken.
- R-Scanner must not imply background surveillance or active checking while disarmed/offline.

## Executor

Current executor: Dev

Expected handoff filename:

```txt
workspace/DevHS105-storage-authority-preflight.md
```

## Active Runway

Dev should implement a read-only storage authority preflight/inventory proof layer.

Ordered steps:

1. Read current storage/runtime path code and existing readiness/snapshot/debug trace services.
2. Add or extend a read-only storage authority status model/service that reports current DB path mode, DB/WAL/SHM, snapshot settings/destination, trace-pack output, temp/cache/SDE paths, window/settings path where available, and current byte usage for known Atlas-controlled locations where practical.
3. Expose the preflight through an existing appropriate read-only service/report surface, or add a narrowly named read-only service if cleaner.
4. Add offline fixture or script verification proving configured path, fallback path, missing path, and known support-artifact inventory behavior without live/API calls.
5. Update Evidence / Dev Handoff and create the expected Dev handoff file.

## Guardrails And Non-Goals

- Read-only storage authority preflight/inventory only.
- No storage config writing.
- No DB movement, copy, migration, relocation, or deletion.
- No lockout enforcement.
- No pruning.
- No snapshot creation unless an existing verifier already uses disposable fixture paths and does not change real runtime state.
- No live/private/API calls.
- No new provider calls.
- No broad provider work queue.
- No high-volume request-attempt ledger.
- No persisted sequencer packet table.
- No durable movement checkpoint implementation.
- No schema migration.
- No stale/expired Discovery ref mutation.
- No deletion/retention execution.
- No broad storage manifest format unless required for read-only reporting and approved by Overseer.
- No renderer redesign.
- No Electron hidden-path behavior change yet.
- No change to provider behavior, Watch behavior, Sequencer behavior, Discovery refs, Evidence/EVEidence writes, hydration, or Assessment Memory.
- Do not make `discovered_killmail_refs` the sequencer.
- Do not treat queued refs as Evidence/EVEidence.
- Do not treat waiting as failure.
- Do not couple metadata hydration to Watch recovery.
- Do not rename backend Watch, `Watch_offline`, scheduler, service, IPC, schema, command, payload terms, or test IDs.
- Do not treat R-Scanner / R-scan as Atlas source or bridge authority.
- Do not imply background surveillance, active checking, or live coverage while disarmed/offline.
- Do not draw exact radius coverage when scope is missing or malformed.
- Do not treat shared keyword references as Atlas authority.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- implementation needs to choose the final storage config filename/location
- implementation would enforce app lockout or write/provider/acquisition lockout
- implementation would move, create, copy, or delete a real active DB
- implementation requires live provider access
- implementation requires schema migration
- implementation turns into storage migration tooling
- implementation needs broad UI work
- storage path state cannot be classified without changing startup behavior
- implementation would rename source/bridge terms
- implementation would blur Watch with Discovery/Evidence/EVEidence
- implementation would make offline/disarmed state look live
- implementation would make waiting/provider deferral look like failure
- implementation would import Lab presentation authority into Atlas source meaning
- renderer work turns into a full redesign
- behavior changes expand beyond a direct testability defect
- the packet turns into sequencer architecture implementation
- observation requires live provider access
- observation requires schema or persistence changes

## Required Verification

Run:

```powershell
npm.cmd run verify:app-readiness
npm.cmd run verify:runtime-snapshot
npm.cmd run verify:operator-debug-trace
npm.cmd run verify:sde-build-lookups
npm.cmd run verify:sde-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:task-concurrency
npm.cmd run verify:db-integrity
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If Electron startup or renderer readiness is touched, also run:

```powershell
npm.cmd run verify:electron-runtime
npm.cmd run verify:renderer-shell
npm.cmd run smoke:electron
```

## Evidence

HS84 accepted by Overseer as presentation guidance.

Files created:

- `workspace/UIUXHS84-watch-recovery-readout-interpretation.md`
- `workspace/OverseerHS85-hs84-watch-recovery-interpretation-review.md`

Accepted:

- R-Scanner is a future presentation candidate.
- R-scan is a future short action candidate.
- Powered-down central console is the preferred future presentation method.
- Watch and `Watch_offline` remain source/bridge terms underneath.
- No code, schema, bridge, renderer, service, payload, live/API, or persistence work was opened.

HS86 created an Atlas-local Lab display request.

Files created:

- `workspace/RequestDisplayHS86-r-scanner-powered-down-console.md`
- `workspace/OverseerHS86-r-scanner-display-request-review.md`

Accepted:

- The request is advisory only.
- Lab may compare up to three display methods for R-Scanner powered-down console.
- Atlas retains source meaning and final adoption authority.
- No implementation, backend, bridge, IPC, payload, persistence, schema, service, live/API, or terminology rename was opened.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 4 files.
- Warning count: 124.
- Warning classes: cross-project-borrowing 32, lab-quarantine-borrowing 79, atlas-candidate 13.
- `git diff --check` passed.

HS87 accepted the Lab response as advisory display comparison material.

Files added:

- `workspace/DisplayResponseHS86-atlas-r-scanner-powered-down-console.md`
- `workspace/OverseerHS87-hs86-lab-response-review.md`

Accepted:

- Lab response matches the HS86 request.
- Preferred advisory method: Powered-Down Central Console.
- Fallback advisory method: Status Envelope With Scanner Face.
- Recovery Status Rail is parked as a primary method and may be considered as a subcomponent later.
- R-Scanner / R-scan remain presentation candidates only.
- `Watch`, `Watch_offline`, Discovery, Evidence/EVEidence, hydration, provenance, storage, and External API meanings remain Atlas-owned.
- No implementation, Dev runway, backend, bridge, IPC, payload, persistence, schema, service, live/API, scheduler, test, or terminology change is opened.

HS88 opens the runtime-evidence packet.

Files added:

- `workspace/OverseerHS88-watch-offline-runtime-evidence-runway.md`

Expected:

- Dev should produce `workspace/DevHS88-watch-offline-runtime-evidence.md`.
- Evidence should prove existing `Watch_offline` recovery states from offline fixtures/runtime checks before UI work.
- No live/API calls, renderer work, schema migration, broad sequencer architecture, provider queue, Discovery ref mutation, Evidence writes, hydration coupling, or terminology rename is authorized.

Verification:

- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 4 files.
- Warning count: 127.
- Warning classes: cross-project-borrowing 30, lab-quarantine-borrowing 77, atlas-candidate 20.
- `git diff --check` passed.

HS88 Dev runtime evidence captured.

Files reviewed:

- `AGENTS.md`
- `workspace/README.md`
- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/current.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/OverseerHS88-watch-offline-runtime-evidence-runway.md`
- `workspace/DevHS82-watch-recovery-diagnostic-readout.md`
- `workspace/OverseerHS87-hs86-lab-response-review.md`
- `workspace/DisplayResponseHS86-atlas-r-scanner-powered-down-console.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchlistRepository.js`
- `scripts/verify-watch-offline-readout.js`

Files changed:

- `scripts/verify-watch-offline-readout.js`
- `workspace/current.md`
- `workspace/DevHS88-watch-offline-runtime-evidence.md`

Evidence observed:

- `verify:watch-offline-readout` now prints a compact runtime evidence JSON block after assertions.
- `Watch_offline` readout generated with `session_armed=false`, `collection_active=false`, `configured_watches=10`, and `eligible_if_armed=8`.
- Unarmed restart state: actor Watch 4 reports `next_safe_action=arm_required`.
- Pending local Discovery refs state: actor Watch 1 reports `pending_refs_count=1` and `next_safe_action=drain_pending_refs`.
- Provider deferred state: actor Watch 7 reports `provider_deferral=true` and `next_safe_action=wait`.
- Missed-slot recoverability: actor Watch 5 reports expected next run `2026-05-25T11:00:00.000Z`, observed movement `2026-05-25T10:00:00.000Z`, `missed_slot.present=true`, and `recoverable=true`.
- Orphan/review state: actor Watch 6 reports orphaned running run `run_orphan_actor` and `next_safe_action=review_orphan`.
- Radius scope states: system/radius Watch 1 reports `scope_status=valid`, Watch 2 reports `scope_status=not_stored`, and Watch 3 reports `scope_status=malformed`.
- No-mutation evidence: persisted counts before and after readout stayed identical for killmails, activity_events, discovered_killmail_refs, fetch_runs, api_request_logs, data_quality_warnings, metadata_runs, and assessment_artifacts.
- Boundary flags from evidence output: `no_provider_work=true`, `mutates_state=false`.

Boundary confirmation:

- No live/API calls, renderer work, schema migration, provider queue, sequencer table, Discovery ref mutation, Evidence writes, hydration coupling, terminology rename, scheduler behavior change, or product behavior change was performed.

Verification:

- `npm.cmd run verify:watch-offline-readout` passed and printed runtime evidence JSON.
- `npm.cmd run verify:watch-scheduler` passed.
- `npm.cmd run verify:watch-executor` passed.
- `npm.cmd run verify:restart-recovery` passed.
- `npm.cmd run verify:queue-api-evidence-write` passed.
- `npm.cmd run verify:queue-selection` passed.
- `npm.cmd run verify:queue-scope-isolation` passed.
- `npm.cmd run verify:hydration` passed.
- `npm.cmd run verify:db-integrity` passed.
- `npm.cmd run verify:service-registry` passed.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 3 files.
- Warning count: 372.
- Warning classes: atlas-candidate 128, cross-project-borrowing 87, lab-quarantine-borrowing 157.
- `git diff --check` passed with existing LF-to-CRLF working-copy warnings for `scripts/verify-watch-offline-readout.js` and `workspace/current.md`.
- `npm.cmd run verify:all` passed, 65 scripts.

HS88 Dev handoff:

Dev created:

```txt
workspace/DevHS88-watch-offline-runtime-evidence.md
```

HS89 accepted DevHS88.

Files added:

- `workspace/OverseerHS89-hs88-runtime-evidence-review.md`

Accepted:

- The runtime evidence proves the existing `Watch_offline` readout states from offline fixtures.
- The changed verifier emits useful diagnostic JSON without product behavior changes.
- No live/API calls, renderer work, schema migration, provider queue, sequencer table, Discovery ref mutation, Evidence writes, hydration coupling, scheduler behavior change, terminology rename, or product behavior change was performed.
- `npm.cmd run verify:all` passed, 65 scripts.

HS90 completed local keyword housekeeping.

Files added/changed:

- `workspace/OverseerHS90-keyword-housekeeping-review.md`
- `workspace/critical/critical-terms.md`

Accepted:

- `Watch_offline` readout keys and values are documented as Atlas support/readout vocabulary.
- Shared protected-word JSON files were not edited.
- Scanner warnings remain advisory evidence, not rename instructions.

## Dev Handoff

Dev created:

```txt
workspace/DevHS91-watch-offline-alpha-observation.md
```

HS91 Dev observation complete.

Files reviewed:

- `AGENTS.md`
- `workspace/README.md`
- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/current.md`
- `workspace/OverseerHS91-watch-offline-alpha-observation-runway.md`
- `workspace/OverseerHS89-hs88-runtime-evidence-review.md`
- `workspace/OverseerHS90-keyword-housekeeping-review.md`
- `workspace/DevHS88-watch-offline-runtime-evidence.md`
- `workspace/OverseerHS87-hs86-lab-response-review.md`
- `workspace/DisplayResponseHS86-atlas-r-scanner-powered-down-console.md`
- `docs/adr/ADR-0005-watch-offline-readout-aggregation.md`
- `docs/current-state/current-evidence-pipeline.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `src/main/services/serviceRegistry.js`
- `src/main/watchlist/watchOfflineReadout.js`
- `src/main/watchlist/watchScheduler.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/watchlist/watchlistRepository.js`
- `scripts/verify-watch-offline-readout.js`
- `scripts/verify-app-readiness.js`
- `scripts/verify-queue-report.js`
- `scripts/verify-operator-debug-trace-pack.js`
- `package.json`

Files changed:

- `workspace/current.md`
- `workspace/DevHS91-watch-offline-alpha-observation.md`

No source, verifier, service, schema, renderer, payload, IPC, or behavior files were changed.

Observed surfaces:

- `watch.offline_readout` is the precise renderer-eligible read-only source for `Watch_offline` recovery meaning.
- `watch.schedule` and `watch.executor.status` expose schedule and volatile executor state but are less complete than `Watch_offline`.
- `report.queue` exposes pending/failed/expanded Discovery refs and preserves the non-Evidence boundary, but it does not explain Watch recovery state.
- `app.readiness` exposes compact runtime boundary support context.
- `support.debug_trace_pack` writes a bounded support/debug artifact and is useful for support review, not first-screen operator understanding.

Runtime evidence observed:

- `Watch_offline` readout generated with `session_armed=false`, `collection_active=false`, `configured_watches=10`, and `eligible_if_armed=8`.
- Unarmed restart: actor Watch 4 reports `next_safe_action=arm_required`.
- Pending local Discovery refs: actor Watch 1 reports `pending_refs_count=1` and `next_safe_action=drain_pending_refs`.
- Provider deferred: actor Watch 7 reports `provider_deferral=true` and `next_safe_action=wait`.
- Missed-slot recovery: actor Watch 5 reports expected next run `2026-05-25T11:00:00.000Z`, observed movement `2026-05-25T10:00:00.000Z`, `missed_slot.present=true`, and `recoverable=true`.
- Orphan review: actor Watch 6 reports orphaned run `run_orphan_actor` and `next_safe_action=review_orphan`.
- Radius scope quality: system/radius Watch 1 reports `valid`, Watch 2 reports `not_stored`, and Watch 3 reports `malformed`.
- No mutation: persisted counts before and after readout stayed identical.
- Boundary flags: `no_provider_work=true`, `mutates_state=false`.

Operator-readability findings:

- The readout is sufficient for a bounded renderer prototype, but it needs presentation mapping for raw `next_safe_action` values.
- Queue/readiness/debug surfaces are useful complements but not substitutes for `watch.offline_readout`.
- Missing/malformed radius scope must remain limited in presentation and must not imply exact live coverage.
- Debug trace packs are support artifacts, not ordinary first-screen operator UI.

Boundary confirmation:

- No live/API calls, renderer work, UI redesign, schema migration, provider queue, sequencer table, durable movement checkpoint, Discovery ref mutation, Evidence/EVEidence writes, hydration coupling, deletion/retention work, terminology rename, source changes, or behavior changes were performed.

Verification:

- `npm.cmd run verify:watch-offline-readout` passed and printed runtime evidence JSON.
- `npm.cmd run verify:watch-scheduler` passed.
- `npm.cmd run verify:watch-executor` passed.
- `npm.cmd run verify:restart-recovery` passed.
- `npm.cmd run verify:queue-api-evidence-write` passed.
- `npm.cmd run verify:queue-selection` passed.
- `npm.cmd run verify:queue-report` passed.
- `npm.cmd run verify:app-readiness` passed.
- `npm.cmd run verify:operator-debug-trace` passed.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 2 files.
- Warning count: 264.
- Warning classes: cross-project-borrowing 45, lab-quarantine-borrowing 150, atlas-candidate 69.
- `git diff --check` passed with the existing LF-to-CRLF working-copy warning for `workspace/current.md`.
- `git status --short --branch` reported expected HS91 workspace file changes.

Recommendation:

- Proceed to a bounded renderer-only presentation prototype next, using `watch.offline_readout` as the source model and treating R-Scanner / R-scan as presentation-only language.

HS92 accepted DevHS91.

Files added:

- `workspace/OverseerHS92-hs91-alpha-observation-review.md`

Accepted:

- `watch.offline_readout` is the best current source model for a first renderer-only R-Scanner prototype.
- Queue/readiness/debug trace surfaces are useful complementary support context, not substitutes for `Watch_offline`.
- Missing/malformed radius scope must stay limited in future presentation and must not imply exact live coverage.
- Durable movement checkpointing remains deferred until real use shows derived `Watch_offline` state is insufficient.

HS93 opens the R-Scanner renderer prototype packet.

Files added:

- `workspace/OverseerHS93-r-scanner-renderer-prototype-runway.md`

Expected Dev handoff:

```txt
workspace/DevHS93-r-scanner-watch-offline-renderer-prototype.md
```

Accepted:

- This is a lightweight renderer-only prototype, not a final facelift.
- `watch.offline_readout` remains the source model.
- R-Scanner / R-scan is presentation-only language.
- No backend, IPC, payload, schema, persistence, provider, scheduler, Watch semantic, Discovery ref, Evidence/EVEidence, hydration, deletion/retention, or terminology rename work is opened.

HS93 Dev renderer prototype complete.

Files reviewed:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/OverseerHS93-r-scanner-renderer-prototype-runway.md`
- `workspace/OverseerHS92-hs91-alpha-observation-review.md`
- `workspace/DevHS91-watch-offline-alpha-observation.md`
- `workspace/DisplayResponseHS86-atlas-r-scanner-powered-down-console.md`
- `workspace/UIUXHS84-watch-recovery-readout-interpretation.md`
- `workspace/critical/critical-terms.md`
- `src/renderer/index.html`
- `src/renderer/app.js`
- `src/renderer/queueWatch.js`
- `src/renderer/shared.js`
- `src/renderer/styles.css`
- `scripts/verify-renderer-shell.js`
- `scripts/electron-visual-smoke.ps1`
- `src/main/main.js`

Files changed:

- `src/renderer/index.html`
- `src/renderer/app.js`
- `src/renderer/queueWatch.js`
- `src/renderer/styles.css`
- `scripts/verify-renderer-shell.js`
- `workspace/current.md`
- `workspace/DevHS93-r-scanner-watch-offline-renderer-prototype.md`

Implementation:

- Added a compact R-Scanner panel to the existing Queue / Watch view.
- The panel consumes `watch.offline_readout` through the existing renderer service bridge.
- The panel keeps `Watch_offline` as source model and labels R-Scanner / R-scan as presentation-only language.
- The scanner face is static/powered-down; it does not imply background surveillance, active checking, or live coverage.
- Mapped raw readout state to operator-facing labels for disarmed/offline, pending local Discovery refs, provider deferred/waiting, missed slot recovery, orphan review, and missing/malformed radius scope.
- Kept Discovery refs, Evidence/EVEidence, Watch, and hydration boundaries visible in the panel.

Visual smoke evidence:

- `npm.cmd run smoke:electron` passed.
- Smoke result: `.tmp/electron-visual-smoke/visual-smoke-result.json`
- Queue / Watch screenshot: `.tmp/electron-visual-smoke/queue-watch.png`
- Result status: `passed`.

Verification:

- `npm.cmd run verify:renderer-shell` passed.
- `npm.cmd run verify:watch-offline-readout` passed and printed runtime evidence JSON.
- `npm.cmd run smoke:electron` passed.
- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 6 files.
- Warning count: 1487.
- Warning classes: atlas-candidate 902, lab-quarantine-borrowing 511, cross-project-borrowing 74.
- `git diff --check` passed with existing LF-to-CRLF working-copy warnings for changed renderer/verifier/workspace files.
- `git status --short --branch` reported expected HS93 renderer/verifier/workspace file changes.

Boundary confirmation:

- No live/private/API/provider calls were added.
- No backend, IPC, schema, service, payload, persistence, scheduler, Watch semantic, Discovery ref, Evidence/EVEidence, hydration, deletion/retention, source-term, or bridge-term changes were made.

Dev handoff:

```txt
workspace/DevHS93-r-scanner-watch-offline-renderer-prototype.md
```

HS94 accepted DevHS93 and captured product intent.

Files added:

- `workspace/OverseerHS94-hs93-review-and-operator-intent-note.md`

Accepted:

- HS93 is accepted as a renderer-only display-contract proof, not final UI.
- The R-Scanner panel may remain a light prototype until the larger facelift.
- Atlas should answer "Do I need to do anything?" as a primary operator-state question.
- Action-needed states should use light diagnostic rows shaped as `[Situation] [brief insight] [needed action]`.
- R-Scanner / Sequencer is a patient discovery and enrichment engine, not instant search presentation.
- Deletion of active local records should be absolute, with snapshots/backups disclosed as separate support/recovery artifacts.
- Storage path and budget remain important future product work before meaningful high-volume collection.
- Assessments should be their own linked entities.
- Observation is the middle layer that pulls connected records into a story.

No active handoff is expected.

HS96 consolidated workspace memory into durable docs.

Files added/updated:

- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/features/observation-lookup-model.md`
- `docs/features/r-scanner-sequencer-presentation.md`
- `docs/index.md`
- `docs/features/README.md`
- `workspace/overview.md`

Accepted:

- `workspace/current.md` should keep immediate active state and current packet effects.
- Product/body direction that outgrows immediate packet memory should move into durable docs.
- UI spatial guidance from the Human/agent channel is useful presentation workflow, not Atlas source meaning or implementation authority.

HS95 captured Observation lookup product direction.

Files added:

- `workspace/OverseerHS95-observation-lookup-product-note.md`

Accepted:

- Observation is a presentation/query layer, not a truth-creation layer.
- ESI-expanded killmail remains the strongest primary Evidence/EVEidence anchor.
- Pilot, corporation, system, and later alliance/entity IDs may become lookup anchors.
- Pilot lookup should assemble sightings, timeline, locations, corporation context, assessments, Watch/Marked context where relevant, and provenance/Evidence basis.
- Corporation lookup should assemble known members, member sightings, related killmails, recurring systems/regions, assessments, and traceable observed patterns.
- Evidence/EVEidence, Discovery, Assessment, Hydration, and Observation boundaries remain distinct.
- Future implementation questions are parked until opened through a bounded packet or advisory pass.

HS97 captured storage path and budget authority decisions.

Files updated:

- `docs/current-state/current-storage-runtime-hardening.md`

Accepted:

- Meaningful real/alpha collection should be locked until the operator selects or explicitly accepts a storage location.
- Budget means physical disk-space use in the pointed Atlas storage location, not scan/API credits.
- 70% budget should remind the operator to prune/clean up.
- 95% budget should warn more strongly.
- 100% budget should hard-lock acquisition/write behavior until the operator fixes storage, prunes, or expands budget.
- Missing, unavailable, or corrupt storage should hard-lock and require fix/recovery instead of silently creating a new DB elsewhere.
- Moving storage should be user-controlled but hardened.
- Snapshots support accidental deletion recovery, not protection against deliberate user behavior.
- Pruning should become a future suite for reducing noise from interest while preserving Evidence/EVEidence and deletion boundaries.
- Request pacing belongs to Sequencer/provider cadence, not storage budget.

HS98 captured storage path behavior and pruning direction.

Files updated:

- `docs/current-state/current-storage-runtime-hardening.md`

Accepted:

- Storage config should be portable and app/project-local, not hidden in Windows app/user settings.
- Atlas should behave like a self-contained briefcase that can boot locally and select suitable storage.
- "Current file" means the packaged app/local app folder as the self-contained host.
- Moving/copying storage is out of scope as migration tooling unless explicitly opened later.
- Missing storage should return to the setup/re-establish flow and must not silently create a new active DB elsewhere.
- First implementation may choose total lockout or narrower write/provider/acquisition lockout, but meaningful collection/writes must wait for storage authority.
- Pruning is a suite: time-window pruning, no-interest/Marked pruning, entity ID pruning, and Assessment reference review are accepted product directions.
- Noise means stale or excessive records that no longer help target hunting, threat detection, or current behavior pattern recognition.

HS99 captured local lookup and long-term discovery ambition.

Files updated:

- `docs/current-state/current-storage-runtime-hardening.md`

Accepted:

- Local records are the preferred substrate for fast, cheap story formation.
- ESI enrichment may fill gaps, but it is explicit, provider-gated, slower, rate-limited, and not a silent substitute for healthy local storage.
- Atlas should use local lookup first, then controlled enrichment or degraded display when optional lookup metadata is incomplete.
- Rich story telling should eventually answer who was killed, by whom, when, corporation relationships, prior sightings, and behavior patterns.
- Long-term ambition includes listening-post style workflows that learn corporation behavior through patient scoped acquisition, enrichment, local lookup, pruning, and Observation.

HS104 accepted systems audit inputs.

Files added/updated:

- `workspace/SystemsAuditHS100-storage-path-budget-authority.md`
- `workspace/SystemsAuditHS101-local-lookup-vs-esi-enrichment.md`
- `workspace/SystemsAuditHS102-pruning-readiness.md`
- `workspace/SystemsAuditHS103-sequencer-provider-cadence.md`
- `workspace/OverseerHS104-systems-audit-synthesis-review.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `workspace/overview.md`
- `workspace/current.md`

Accepted:

- The audits are advisory review input, not Dev authorization.
- The strongest next systems candidate is read-only storage authority preflight/inventory.
- Secondary bounded candidates are typed actor name live-gate classification, pruning relationship preview, and Sequencer cadence readout.
- Destructive pruning, broad provider queue architecture, persisted Sequencer packets, stale/expired Discovery ref mutation, storage migration, and storage hard-lock enforcement remain parked until explicitly opened.

HS105 opens the read-only storage authority preflight runway.

Files added/updated:

- `workspace/OverseerHS105-storage-authority-preflight-runway.md`
- `workspace/current.md`

Expected Dev handoff:

```txt
workspace/DevHS105-storage-authority-preflight.md
```

Expected evidence:

- files changed
- service/report command added or extended
- sample preflight output
- path modes demonstrated
- byte usage fields demonstrated
- confirmation that no storage config was written
- confirmation that no DB move/copy/delete/relocation occurred
- confirmation that no lockout, pruning, live/API/provider, schema, renderer redesign, or storage migration behavior was added
- verification commands and results
