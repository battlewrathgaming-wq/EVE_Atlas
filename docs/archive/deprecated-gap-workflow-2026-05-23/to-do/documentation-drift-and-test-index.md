# Documentation Drift And Test Index

## Mission

Keep Atlas documentation aligned with the rapidly expanding verification surface.

The current docs are directionally strong, but some current-state notes still carry stale counts, old milestone references, or duplicated historical status.

## Task Requirements

- Create or refresh a test index documenting:
  - verification groups
  - individual scripts
  - whether each script is offline or live-gated
  - whether each script writes `.tmp` artifacts
  - what boundary each script protects
- Update current-state docs where stale:
  - number of scripts in `verify:all`
  - completed milestone language
  - old "next target" statements that are now complete
  - SDE lookup builder state
  - current local-alpha / bug-hunt milestone state
- Ensure docs distinguish:
  - evidence tests
  - observation/report tests
  - assessment tests
  - readiness/support tests
  - live smoke tests
- Add a lightweight drift check if practical.

## Suggested Verification

Add a script such as:

```txt
npm.cmd run verify:docs-test-index
```

It may check that package scripts referenced in the test index exist and that live scripts are not included in `verify:all`.

## Acceptance Criteria

- A new contributor can understand what to run and why.
- Stale script-count claims are removed or automatically generated.
- Live-gated scripts remain visibly separate from offline verification.
- Current-state docs reflect the current bug-hunting milestone.

