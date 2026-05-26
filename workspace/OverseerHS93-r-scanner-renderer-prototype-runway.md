# Overseer HS93 - R-Scanner Renderer Prototype Runway

Date: 2026-05-26
Role: Atlas Overseer
Status: active Dev runway
Milestone: Atlas Storage And Runtime Hardening

## Decision

Open a bounded renderer-only prototype for the R-Scanner / `Watch_offline` presentation surface.

This is intentionally light frontend work. Atlas is expecting a later visual facelift, so this packet should prove the display contract and operator meaning rather than lock in final styling.

## Source Of Intent

- Human accepted moving to the R-Scanner prototype after HS92.
- Human requested renderer-level development stay light because a facelift is expected soon.
- `workspace/OverseerHS92-hs91-alpha-observation-review.md`
- `workspace/DevHS91-watch-offline-alpha-observation.md`
- `workspace/DisplayResponseHS86-atlas-r-scanner-powered-down-console.md`
- `workspace/UIUXHS84-watch-recovery-readout-interpretation.md`
- `workspace/critical/critical-terms.md`

## Executor

Dev.

Expected handoff:

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
- Do not perform a full app redesign.
- Do not implement final face-lift visuals.
- Do not change backend behavior, services, IPC command names, payload contracts, schema, persistence, scheduler logic, Watch semantics, Discovery ref state, Evidence/EVEidence writes, hydration, deletion/retention, or provider logic.
- Do not run live/private/API/provider calls.
- Do not rename backend/source/bridge terms.
- Do not make R-Scanner / R-scan Atlas source or bridge authority.
- Do not imply background surveillance, active checking, or live coverage while the readout is disarmed/offline.
- Do not draw exact radius coverage when scope is missing or malformed.
- Do not treat waiting/provider deferral as failure.

## Stop Conditions

Stop and return to Overseer/Human if:

- implementation requires backend, IPC, schema, persistence, service, scheduler, provider, or payload changes
- renderer work turns into a full redesign
- the UI blurs Discovery refs with Evidence/EVEidence
- the UI blurs Watch with Marked or makes R-Scanner a source term
- offline/disarmed state appears live or actively scanning
- live/API/provider access is needed for verification
- existing renderer structure cannot safely host a small prototype

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

## Evidence Expectations

Dev handoff should prove:

- `watch.offline_readout` remains the source model.
- R-Scanner/R-scan is presentation-only language.
- Offline/disarmed state reads as safe and intentional, not broken or live.
- Pending refs, provider wait, missed slot, orphan review, and scope limitation states are visible.
- Discovery/Evidence/EVEidence/Watch/hydration boundaries remain intact.
- Verification commands and results are named.
