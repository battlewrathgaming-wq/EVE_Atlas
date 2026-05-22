# Live API Refusal And Smoke Matrix

## Mission

Make live behavior harder to misuse by testing refusal paths and a small set of conservative live smoke paths as a matrix.

Live tests remain separate from `verify:all`.

## Task Requirements

Build a matrix covering:

- no `AURA_ATLAS_LIVE_API=1` refusal for every live-capable script/service
- live gate estimates for zKill-only discovery
- live gate estimates for ESI expansion
- discovery-only positive-ref smoke
- selected one-ref expansion smoke
- metadata hydration smoke
- actor watch smoke with caps
- system/radius smoke with caps

Each live smoke should record:

- target and resolved ID
- lookback window
- cap settings
- planned routes
- zKill calls
- ESI calls
- queued refs
- expanded killmails
- activity events written
- warnings
- DB path
- artifact path

## Guardrails

- Do not add live tests to `verify:all`.
- Use disposable `.tmp` DBs.
- Require narrow target, explicit lookback, and conservative caps.
- Keep discovery-only and expansion smokes separate.

## Suggested Verification

Add or organize:

```txt
npm.cmd run verify:live-matrix
```

The command should refuse unless `AURA_ATLAS_LIVE_API=1`.

## Acceptance Criteria

- All live-capable actions have refusal-path coverage.
- Live smoke artifacts are enough for overseer review without reconstructing terminal output.
- Discovery-only paths continue to write zero killmails and zero activity events.

