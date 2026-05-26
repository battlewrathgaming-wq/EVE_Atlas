# AURA Atlas Current Work

Status: Active Dev packet - R-Scanner renderer prototype
Last updated: 2026-05-26

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS93 opens a bounded, lightweight renderer-only R-Scanner prototype using `watch.offline_readout` as the source model.

Source of intent:

- Human storage/runtime hardening direction accepted on 2026-05-25.
- Human accepted the post-HS82 next step: inspect how the `Watch_offline` recovery state should read to an operator before adding more machinery.
- Human advisory on 2026-05-26: final presentation may not expose Watch directly; R-Scanner / R-scan is a candidate presentation metaphor.
- Human preference on 2026-05-26: focus on runtime evidence before UI presentation because Atlas has nothing useful to show if the system state is broken.
- Human accepted on 2026-05-26: proceed with a targeted runtime/use observation pass before UI.
- Human accepted on 2026-05-26: proceed with the R-Scanner renderer prototype, keeping frontend/render work light because a facelift is expected soon.
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
workspace/DevHS93-r-scanner-watch-offline-renderer-prototype.md
```

## Ordered Runway

1. Re-read the accepted `Watch_offline` source meaning, HS92 closeout, and R-Scanner presentation guidance.
2. Inspect the current renderer routes/modules and identify the smallest place to expose a prototype R-Scanner powered-down/offline surface.
3. Add a lightweight renderer-only surface or panel that consumes existing `watch.offline_readout` state.
4. Map raw readout values into operator-facing display labels for at least: disarmed/offline, pending local Discovery refs, provider deferred/waiting, missed slot recoverable, orphan review, and malformed/missing radius scope.
5. Keep Discovery refs, Evidence/EVEidence, Watch, and hydration meanings visibly separate where those concepts appear.
6. Add or update renderer verification/smoke coverage only as needed for this bounded surface.
7. Create the expected Dev handoff with files changed, screenshots or visual-smoke evidence if available, verification results, and any presentation gaps that should wait for the facelift.

## Guardrails And Non-Goals

- Renderer-only.
- Keep styling light, replaceable, and local to this prototype.
- No full app redesign.
- No final facelift implementation.
- No live/private/API calls.
- No new provider calls.
- No backend behavior changes unless needed to fix a direct observation-blocking defect.
- No broad provider work queue.
- No high-volume request-attempt ledger.
- No persisted sequencer packet table.
- No durable movement checkpoint implementation.
- No schema migration.
- No stale/expired Discovery ref mutation.
- No deletion/retention work.
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

- implementation requires live provider access
- implementation requires schema migration
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
npm.cmd run verify:renderer-shell
npm.cmd run verify:watch-offline-readout
npm.cmd run smoke:electron
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If source/service/verifier files change beyond renderer scope, explain why and run the relevant narrower verifier. Run `npm.cmd run verify:all` only if the blast radius expands beyond the bounded renderer surface.

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
