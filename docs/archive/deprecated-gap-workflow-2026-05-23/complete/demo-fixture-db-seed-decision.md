# Demo Fixture DB Seed Decision

Milestone: Local Alpha Trial Readiness

## Mission

Decide whether Atlas needs a reproducible demo runtime DB for local alpha testing.

The existing verification fixtures prove behavior, but an operator-facing demo DB may make the app easier to trial without live APIs.

## Actionables

- Review whether current fixture scripts are enough for alpha.
- If implementing:
  - create an explicit seed script
  - write only under `.tmp`
  - use synthetic or fixture evidence
  - include enough data for readiness, corpus health, queue, actor report, radius report, assessment review, snapshot, and trace pack surfaces
  - do not use live APIs
- If deferring:
  - document why fixture verification is sufficient for now
  - identify what alpha feedback would justify a demo DB later

## Acceptance Checks

- Decision is documented.
- If implemented, seed is reproducible and offline.
- Seed does not masquerade as live evidence.
- Seed DB path is clearly marked as demo/fixture.

## Dev Notes

```txt
Completed 2026-05-22.

Decision: implement a reproducible offline demo DB seed for local alpha.

Added npm script:
npm run seed:demo-db

Default output:
F:\Projects\AURA-Atlas\.tmp\aura-atlas-demo-fixture.sqlite

The seed reuses the existing operator workflow scenario with fake zKill/ESI clients:
- scoped manual discovery
- queued refs
- selected ESI expansion from fixture data
- actor report evidence
- metadata hydration
- assessment artifact
- corpus health/snapshot preflight coverage

It does not call live APIs and is labelled as synthetic/fixture alpha data, not live evidence.
```
