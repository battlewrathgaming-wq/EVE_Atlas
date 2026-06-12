# OverseerHS404 - HS403 Discovery zKill Candidate Acquisition Helper Extraction Review

Status: accepted
Date: 2026-06-07
Reviewer: Overseer

## Reviewed

- `workspace/DevHS403-discovery-zkill-candidate-acquisition-helper-extraction.md`
- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualDiscoveryWorker.js`
- source diff for the HS403-touched files

## Decision

HS403 is accepted.

The change performs the intended ownership extraction only: zKill candidate acquisition helper logic now has a Discovery-owned home, while the existing mixed Watch collector runtime remains intact.

## Acceptance Findings

- `src/main/discovery/zkillCandidateAcquisition.js` now defines and exports `discoverActorRefs(...)` and `discoverSystemRefs(...)`.
- Actor Watch, system/radius collector, and manual discovery import zKill acquisition helpers from the Discovery module.
- Manual discovery no longer imports zKill acquisition helpers from Watch collector modules.
- `systemRadiusCollector.js` retains `discoverRefs: discoverSystemRefs` only as a compatibility alias.
- `actorWatchCollector.js` retains `discoverActorRefs` as an imported compatibility export.
- The provider primitive remains `zkillClient.discoverRefs(...)`; `ZKillDiscoveryClient.discoverRefs(...)` was not changed.
- Current actor Watch, system/radius, and manual discovery result shapes are preserved.

## Boundary Confirmation

No runtime redirect, scheduled Watch redirect, collector retirement, collector invocation rewrite, provider behavior change, Discovery ref write/status change, Evidence/EVEidence write change, Hydration change, schema, dispatcher, runtime enforcement, command blocking, UI, support artifact, source-term rename, or protected-word JSON update was introduced.

This remains helper ownership extraction, not live movement.

## Verification Run

Passed:

```txt
node --check src\main\discovery\zkillCandidateAcquisition.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\manualDiscoveryWorker.js
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

Notes:

- `verify:service-registry` passed with a 300 second ceiling.
- `verify:enforcement-dry-run` remained complete with 113 commands covered and 0 gaps.
- `verify:protected-terms` completed as warning-only advisory output across the broad current working set; no renames or protected-word JSON updates were performed.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the existing broad milestone stack still present.

## Remaining Pressure

The next Discovery helper-home seams are still open:

- candidate-ref memory/status helper ownership trace
- ESI-backed expansion/package helper boundary trace
- actor Watch redirect readiness re-check after helper homes are settled

Do not treat HS403 as approval to redirect `actor.watch`, retire collectors, or begin live/provider movement.
