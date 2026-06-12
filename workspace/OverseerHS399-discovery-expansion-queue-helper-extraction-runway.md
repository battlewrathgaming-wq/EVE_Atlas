# OverseerHS399 - Discovery Expansion Queue Helper Extraction Runway

Status: active Dev runway
Date: 2026-06-07
Executor: Dev
Expected handoff: `workspace/DevHS399-discovery-expansion-queue-helper-extraction.md`

## Purpose

Move shared expansion queue selection helpers out of collector ownership and into a Discovery-owned helper module, preserving behavior exactly.

This is the first practical cleanup after HS397. It should remove the current smell where actor/manual paths import shared expansion-selection behavior from `systemRadiusCollector.js`.

## Scope

Create a Discovery-owned helper module, preferably:

```txt
src/main/discovery/expansionQueueSelection.js
```

Move or rehome these helpers from `src/main/workers/systemRadiusCollector.js`:

- `selectExpansionCandidates(...)`
- `markFailedExpansionCandidates(...)`
- `summarizeExpansionQueue(...)`

Update existing imports/callers to use the new Discovery-owned helper module:

- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/workers/manualDiscoveryWorker.js`

Preserve behavior exactly. This packet is about helper ownership only.

## Non-Goals

Do not:

- redirect `actor.watch`
- change `runActorWatchService(...)`
- change `watchExecutor.dispatchFor(...)`
- invoke, rewrite, or retire `collectActorWatch(...)` or `collectSystemRadiusWatch(...)`
- call zKill
- call ESI
- move provider clients
- write Discovery refs beyond existing test behavior
- write Evidence/EVEidence beyond existing test behavior
- write Hydration/metadata
- change `fetch_runs`, API logs, warnings, Watch cadence, Watch run records, or candidate-ref status behavior
- add schema
- add Discovery task/packet persistence
- add dispatcher, queue, lease, worker, or sequencer behavior
- change command metadata/authority
- change runtime enforcement or command blocking
- change renderer UI
- create support artifacts
- rename source-owned terms
- update protected-word JSON

## Acceptance Criteria

Dev should prove:

- the three helpers now live in a Discovery-owned module
- current actor/system/manual imports no longer import those helpers from `systemRadiusCollector.js`
- current behavior remains unchanged for actor Watch, system/radius collector, manual discovery, and manual expansion paths
- `actor.watch`, `runActorWatchService(...)`, scheduled actor Watch dispatch, and collector runtime behavior are not redirected
- no provider movement, schema, UI, enforcement, or durable task/packet behavior was added

## Verification

Run focused syntax checks:

```txt
node --check src\main\discovery\expansionQueueSelection.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\manualExpansionWorker.js
node --check src\main\workers\manualDiscoveryWorker.js
```

Run focused behavior/coverage checks:

```txt
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

If an exact script name differs, use the closest existing verifier and state the substitution in the handoff.

## Handoff Requirements

Create:

```txt
workspace/DevHS399-discovery-expansion-queue-helper-extraction.md
```

Include:

- files changed
- helper module path
- import/caller update summary
- behavior preservation evidence
- verification commands and outcomes
- explicit statement of untouched boundaries
