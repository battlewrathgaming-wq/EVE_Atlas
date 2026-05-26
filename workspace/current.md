# AURA Atlas Current Work

Status: Resting after accepted Lab display response
Last updated: 2026-05-26

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current focus: HS87 accepted the Lab response to the R-Scanner powered-down console request as advisory display comparison material. Atlas is resting until the Human / Overseer selects a bounded adoption or runtime packet.

Source of intent:

- Human storage/runtime hardening direction accepted on 2026-05-25.
- Human accepted the post-HS82 next step: inspect how the `Watch_offline` recovery state should read to an operator before adding more machinery.
- Human advisory on 2026-05-26: final presentation may not expose Watch directly; R-Scanner / R-scan is a candidate presentation metaphor.
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

Current executor: None

Expected handoff filename:

```txt
None until the next runway is opened.
```

## Resting State

No Dev or specialist work is currently open.

Next likely candidate lanes, for Human / Overseer selection:

1. Small renderer presentation packet consuming existing `Watch_offline` only, if the Human adopts the HS87 advisory material.
2. Runtime evidence from alpha use of `Watch_offline` recovery diagnostics.
3. Minimal durable Watch movement checkpoint only if real runtime evidence shows derived movement is insufficient.
4. Discovery Sequencer / Enrichment Sequencer architecture note and first implementation slice.

## Guardrails And Non-Goals

- No live/private/API calls unless explicitly authorized.
- No broad provider work queue.
- No high-volume request-attempt ledger.
- No persisted sequencer packet table.
- No schema migration unless a future packet explicitly opens one.
- No stale/expired Discovery ref mutation.
- Do not make `discovered_killmail_refs` the sequencer.
- Do not treat queued refs as Evidence/EVEidence.
- Do not treat waiting as failure.
- Do not couple metadata hydration to Watch recovery.
- Do not rename backend Watch, `Watch_offline`, scheduler, service, IPC, schema, command, or payload terms.
- Do not treat R-Scanner / R-scan as Atlas source or bridge authority yet.

## Stop Conditions

Stop and return to Overseer/Human before implementation if:

- implementation requires live provider access
- implementation requires schema migration
- implementation would rename source/bridge terms
- implementation would blur Watch with Discovery/Evidence/EVEidence
- implementation would make offline/disarmed state look live
- implementation would make waiting/provider deferral look like failure
- implementation would import Lab presentation authority into Atlas source meaning

## Required Verification

No active implementation packet is open.

HS84 advisory capture verification:

```powershell
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
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

Verification:

- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery ran in working-set mode against 4 files.
- Warning count: 127.
- Warning classes: cross-project-borrowing 30, lab-quarantine-borrowing 77, atlas-candidate 20.
- `git diff --check` passed.

## Handoff

No active handoff expected.
