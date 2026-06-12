# OverseerHS441 - HS440 Direct Actor Watch Redirect Review

Status: accepted with follow-up correction
Date: 2026-06-12
Role: Overseer

## Reviewed Handoff

```txt
workspace/DevHS440-direct-actor-watch-redirect.md
```

## Result

HS440 is accepted for the direct `actor.watch` runtime redirect.

The production direct path now keeps the service-layer authority work in `runActorWatchService(...)`:

- actor input resolution
- actor Watch scope normalization
- `assertLiveAllowed('actor.watch', input, dependencies)`

Then it routes the direct body into:

```txt
runActorWatchDirectBody(input, { ...dependencies, db })
```

This matches the accepted boundary: direct `actor.watch` may move; scheduled actor Watch remains parked on the legacy collector.

## Boundary Check

Accepted:

- direct production `actor.watch` redirect
- boundary-owned direct body in `src/main/discovery/actorWatchDirectBody.js`
- real `EvidenceRepository`, `HttpClient`, `ZKillDiscoveryClient`, and `EsiClient` wiring in the direct body
- API request logging remains through `HttpClient -> EvidenceRepository.insertApiRequestLog(...)`
- direct caller return shape remains the accepted actor Watch compatibility summary

Still parked:

- scheduled actor Watch redirect
- `watchExecutor.dispatchFor(...)` replacement
- `collectActorWatch(...)` retirement
- system/radius Watch redirect
- mixed collector retirement
- live/provider verification
- durable Discovery task/packet persistence
- dispatcher/queue/lease/enforcement/UI work

No schema, Hydration, Observation, Assessment, renderer UI, source-term rename, protected-word JSON, or provider/live verification change was accepted.

## Verification Run

Overseer reran:

```powershell
node --check src\main\discovery\actorWatchDirectBody.js
node --check src\main\services\mutatingActionService.js
npm.cmd run verify:watch-actor-direct-redirect
npm.cmd run verify:watch-actor-transport-failure-parity
npm.cmd run verify:watch-actor-production-like-fake-client-direct-proof
npm.cmd run verify:watch-actor-controlled-adapter-disabled-seam
npm.cmd run verify:watch-actor-controlled-adapter-return-path
npm.cmd run verify:watch-actor-controlled-runtime-adapter-fixture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git status --short --branch
```

Results:

- focused direct redirect verifier passed
- transport/failure parity passed
- production-like fake-client direct proof passed
- controlled adapter disabled seam passed
- controlled adapter return-path proof passed
- controlled runtime adapter fixture passed
- service registry, command authority, passive side-effects, and enforcement dry-run passed
- syntax checks passed
- `git diff --check` reported only existing LF/CRLF warnings, no whitespace errors
- tree remains `main...origin/main [ahead 19]` with the expected large uncommitted/untracked milestone stack

## Follow-Up Correction

One verification wording issue remains.

`scripts/verify-watch-actor-controlled-adapter-return-path.js` still prints and asserts a `production_runtime_unchanged` block containing:

```txt
actor_watch_redirected: false
runActorWatchService_changed: false
```

That was correct for the older controlled-adapter proof, but it is misleading after HS440 because the production direct `actor.watch` path is intentionally redirected.

This is not a blocking runtime issue. It is a guardrail language issue that could teach future agents the wrong post-HS440 state.

## Disposition

Accepted:

- HS440 direct redirect

Next runway:

```txt
workspace/OverseerHS442-post-redirect-return-path-verifier-correction-runway.md
```

Expected Dev handoff:

```txt
workspace/DevHS442-post-redirect-return-path-verifier-correction.md
```

Purpose:

Correct the old return-path verifier/proof language so it distinguishes:

- production direct `actor.watch` is intentionally redirected
- controlled adapter preview remains non-production
- scheduled actor Watch remains legacy/parked

No runtime movement should be added by HS442.
