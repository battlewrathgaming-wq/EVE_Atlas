# DevHS01: Atlas Operator Refusal Smoke

Date: 2026-05-23
Role: Dev
Milestone: Aggressive Testing And Operator Bug Hunting
Packet: `workspace/current.md`

## Scope Executed

- Added a fixture-backed Electron rugged smoke path under `npm.cmd run smoke:electron`.
- Exercised readiness/support surfaces, corpus health, runtime snapshot preflight, debug trace pack, scope validation, queue selection, watch authoring/status, manual discovery preflight, manual expansion preflight, actor/radius reports, hydration preflight, assessment save/review, long labels, partial queue selection, and a 760x620 narrow window state.
- Proved closed live-gate refusal behavior without operator authorization for live network/API calls.
- Updated current-state documentation only where the Electron smoke behavior changed.

## Verification

```txt
npm.cmd run verify:renderer-shell
Result: passed.

npm.cmd run verify:operator-workflow
Result: passed; 2 queued refs, 1 killmail, 7 activity events, 1 assessment artifact.

npm.cmd run verify:live-api-gate
Result: passed.

npm.cmd run smoke:electron
Result: passed.
Artifact: .tmp/electron-visual-smoke/visual-smoke-result.json
Rugged checks: corpus health loaded, snapshot preflight read-only, trace pack written, manual discovery refused, manual expansion refused, hydration refused, actor report loaded, assessment saved, long label length 77, narrow window 760x620.

npm.cmd run verify:live-scoped-zkill
Result: expected refusal without live authorization; exit 1.
Artifact: .tmp/live-scoped-zkill-smoke/latest.json
Refusal: set AURA_ATLAS_LIVE_API=1 to allow zKill calls.

npm.cmd run verify:live-smoke
Result: expected refusal without live authorization; exit 1.
Refusal: set AURA_ATLAS_LIVE_API=1 to allow live zKill/ESI calls.

npm.cmd run verify:all
Result: passed; 57 offline scripts.
```

## Files Changed

```txt
src/main/main.js
scripts/electron-visual-smoke.ps1
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS01-atlas-operator-refusal-smoke.md
```

## Findings

- The default Electron smoke now seeds a project-local synthetic demo DB under `.tmp/electron-visual-smoke`, then drives the operator surfaces through the renderer rather than only capturing startup screenshots.
- The rugged smoke keeps live work closed: manual discovery, manual expansion, and metadata hydration preflights report refusal when `AURA_ATLAS_LIVE_API` is not set.
- `verify:live-scoped-zkill` writes a reviewable refusal artifact under `.tmp/live-scoped-zkill-smoke/latest.json`; the grouped `verify:live-smoke` refuses before running live subcommands when the gate is closed.
- A wrapper bug was found and fixed: failed Electron visual smoke JSON is now treated as command failure by `scripts/electron-visual-smoke.ps1`.

## Deferrals And Risk

- No live success smoke was run; live network/API authorization was not provided.
- This is rugged smoke coverage, not exhaustive UI visual QA.
- Task concurrency/cancellation stress remains the recommended next bounded packet.
- Adversarial evidence fixtures, SDE builder failure modes, larger synthetic scale pressure, and broad documentation cleanup remain deferred.

## Recommended Next Action

Write the next Dev runway for task concurrency and cancellation pressure: stress lock classes, cancellation during HTTP/worker paths, failure followed by rerun, and overlap between exclusive/mutating/read-only tasks with evidence preservation and diagnostics checks.
