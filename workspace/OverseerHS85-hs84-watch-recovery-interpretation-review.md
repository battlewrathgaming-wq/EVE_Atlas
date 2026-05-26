# Overseer HS85 - HS84 Watch Recovery Interpretation Review

Date: 2026-05-26
Role: Atlas Overseer
Status: accepted advisory
Milestone: Atlas Storage And Runtime Hardening

## Decision

Accept UIUXHS84 as presentation guidance.

This is not implementation authorization and not a source-term rename.

## Accepted Presentation Direction

- Atlas source/internal term remains Watch.
- Atlas bridge/readout model remains `Watch_offline`.
- Presentation candidate accepted for future UI exploration: R-Scanner.
- Short action candidate accepted for future UI exploration: R-scan.
- R-Scanner should communicate a powered-down, safe, deliberate recovery/scanner console.
- The surface must not imply background surveillance or active checking while disarmed/offline.

## Preferred Method

Use the Powered-Down Central Console concept as the preferred future presentation direction.

The R-Scanner face should be dimmed/static when disarmed or offline. It should show calm readiness, not failure. Any warning edge should be reserved for recoverable or review-needed states.

## Preserved Boundaries

- Do not rename backend Watch, `Watch_offline`, scheduler, service, IPC, schema, command, or payload terms.
- Preserve Watch, Discovery, Evidence/EVEidence, hydration, provenance, Marked, and storage meaning.
- Discovery refs must not look like Evidence/EVEidence.
- Waiting/provider deferral must not look like failure.
- Missing/malformed radius scope must not look exact.
- Offline/disarmed must not look broken or live.

## Future Implementation Use

If opened later, the smallest Dev packet should be a renderer presentation slice that consumes existing `Watch_offline` readout only.

It should not require backend, bridge, IPC, schema, service, payload, provider, live/API, or persistence changes.

## Current State

`workspace/current.md` is refreshed to resting state. No Dev runway is open.

## Verification

- `npm.cmd run verify:protected-terms` passed with exit code 0, warning-only.
- Protected-term discovery scanned 4 working-set files.
- Warning count: 127.
- Warning classes: cross-project-borrowing 30, lab-quarantine-borrowing 77, atlas-candidate 20.
- `git diff --check` passed.
