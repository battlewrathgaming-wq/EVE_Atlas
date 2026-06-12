# OverseerHS403 - Discovery zKill Candidate Acquisition Helper Extraction Runway

Status: active Dev runway
Date: 2026-06-07
Executor: Dev
Expected handoff: `workspace/DevHS403-discovery-zkill-candidate-acquisition-helper-extraction.md`

## Purpose

Move zKill candidate acquisition helper logic out of old collector ownership and into a Discovery-owned helper module, preserving behavior exactly.

This follows HS399's helper-home pattern:

```txt
same behavior
better ownership
no runtime redirect
no provider behavior change
```

## Scope

Create a Discovery-owned helper module:

```txt
src/main/discovery/zkillCandidateAcquisition.js
```

Move/rehome these helper surfaces into that module:

- actor `discoverActorRefs(...)`
- actor candidate normalization currently in actor `expansionCandidate(...)`
- system/radius `discoverRefs(...)`, renamed or exported as `discoverSystemRefs(...)`
- system candidate normalization currently in system `expansionCandidate(...)`

Update imports/callers:

- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualDiscoveryWorker.js`

Preserve current result shapes for existing callers. If old collector helper exports are needed for compatibility, keep them as thin re-exports only and make sure future ownership is the Discovery module.

## Non-Goals

Do not:

- redirect `actor.watch`
- redirect `system.radius.watch`
- change `runActorWatchService(...)`
- change `watchExecutor.dispatchFor(...)`
- invoke, rewrite, or retire `collectActorWatch(...)` or `collectSystemRadiusWatch(...)`
- change provider-call behavior
- change `ZKillDiscoveryClient.discoverRefs(...)`
- change `HttpClient` construction or API logging policy
- write Discovery refs differently
- change candidate-ref status behavior
- write Evidence/EVEidence differently
- write Hydration/metadata
- change `fetch_runs`, API logs, warnings, Watch cadence, Watch run records, or old summary result behavior
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

- zKill acquisition helper definitions live under `src/main/discovery/zkillCandidateAcquisition.js`
- `manualDiscoveryWorker.js` no longer imports zKill acquisition helper logic from Watch collector modules
- actor/system collectors still behave as current mixed collectors
- current actor/system/manual result shapes are preserved under focused verification
- provider call path is unchanged except for module ownership
- command authority and service metadata are unchanged
- no live/provider movement, schema, UI, enforcement, or durable task/packet behavior was added

## Verification

Run focused syntax checks:

```txt
node --check src\main\discovery\zkillCandidateAcquisition.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\manualDiscoveryWorker.js
```

Run focused source ownership check:

```txt
rg -n "discoverActorRefs|discoverSystemRefs|discoverRefs|zkillCandidateAcquisition|require\('./actorWatchCollector'\)|require\('./systemRadiusCollector'\)" src\main\workers src\main\discovery
```

Run focused behavior/coverage checks:

```txt
npm.cmd run verify:actor-watch
npm.cmd run verify:collector
npm.cmd run verify:manual-discovery
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
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

If an exact script name differs, use the closest existing verifier and state the substitution.

## Handoff Requirements

Create:

```txt
workspace/DevHS403-discovery-zkill-candidate-acquisition-helper-extraction.md
```

Include:

- files changed
- helper module path
- export/import summary
- behavior preservation evidence
- verification commands and outcomes
- explicit statement of untouched boundaries
