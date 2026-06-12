# DevHS399 - Discovery Expansion Queue Helper Extraction

Status: complete; pending Overseer review

## Scope

Moved shared expansion queue helper logic out of collector ownership and into a Discovery-owned helper module, preserving behavior exactly.

New helper module:

```txt
src/main/discovery/expansionQueueSelection.js
```

## Files Changed

- `src/main/discovery/expansionQueueSelection.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `workspace/current.md`
- `workspace/DevHS399-discovery-expansion-queue-helper-extraction.md`

## Helper Module

`src/main/discovery/expansionQueueSelection.js` now defines and exports:

```txt
selectExpansionCandidates(...)
markFailedExpansionCandidates(...)
summarizeExpansionQueue(...)
```

The helper bodies were preserved from `systemRadiusCollector.js` without behavior changes.

## Import / Caller Updates

Updated:

```txt
src/main/workers/systemRadiusCollector.js
```

Now imports:

```txt
../discovery/expansionQueueSelection
```

Updated:

```txt
src/main/workers/actorWatchCollector.js
src/main/workers/manualExpansionWorker.js
src/main/workers/manualDiscoveryWorker.js
```

Those callers no longer import shared expansion helper behavior from `systemRadiusCollector.js`.

`systemRadiusCollector.js` now exports only:

```txt
collectSystemRadiusWatch
discoverRefs
```

## Ownership Proof

Focused source search:

```txt
rg "selectExpansionCandidates|markFailedExpansionCandidates|summarizeExpansionQueue" src\main -n
```

Result:

- helper definitions exist in `src/main/discovery/expansionQueueSelection.js`
- actor/system/manual callers import from `../discovery/expansionQueueSelection`
- no source caller imports those helpers from `systemRadiusCollector.js`

## Behavior Preservation Evidence

Passed behavior checks:

- actor Watch verification
- system/radius collector verification
- manual verification group
- direct manual discovery/expansion verification
- actor Watch compatibility-wrapper runtime preview verification
- actor Watch compatibility-wrapper adapter fixture verification
- Discovery ESI-backed expansion intake posture verification
- Evidence writer landing package fixture verification
- Evidence rule regression verification
- service registry, command authority, passive side-effect, enforcement dry-run, protected-term advisory checks

## Verification Commands

Passed:

```txt
node --check src\main\discovery\expansionQueueSelection.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\manualExpansionWorker.js
node --check src\main\workers\manualDiscoveryWorker.js
npm.cmd run verify:actor-watch
npm.cmd run verify:collector
npm.cmd run verify:manual
npm.cmd run verify:manual-discovery
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:evidence-rules
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Notes:

- `npm.cmd run verify:manual` resolved to the existing manual group and ran `verify:manual-discovery`; `npm.cmd run verify:manual-discovery` was also run directly.
- `npm.cmd run verify:service-registry` passed with a 300 second ceiling.
- `npm.cmd run verify:enforcement-dry-run` remained complete: 113 commands covered, 0 gaps.
- `npm.cmd run verify:protected-terms` completed with warning-only advisory output; no source-term rename or protected-word JSON update was performed.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the existing broad unaccepted working set plus HS399-touched files.

## Boundary Confirmation

Not changed or added:

- no `actor.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no collector invocation/rewrite/retirement
- no zKill call
- no ESI call
- no provider-client movement
- no Discovery ref write behavior change
- no Evidence/EVEidence write behavior change
- no Hydration/metadata write
- no `fetch_runs`, API logs, warnings, Watch cadence, Watch run records, or candidate-ref status behavior change
- no schema
- no Discovery task/packet persistence
- no dispatcher, queue, lease, worker, or sequencer behavior
- no command metadata/authority change
- no runtime enforcement or command blocking
- no renderer UI
- no support artifacts
- no source-term rename
- no protected-word JSON update

## Recommended Next Action

Overseer review HS399. If accepted, this clears the helper-ownership smell identified by HS397 and leaves the next narrow actor Watch compatibility-wrapper/redirect shaping step available without opening live provider movement or collector retirement.
