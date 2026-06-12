# DevHS407 - Discovery Candidate Ref Pending Rehydration Helper Extraction

Status: complete; pending Overseer review
Date: 2026-06-07
Executor: Dev

## Scope

Executed `workspace/OverseerHS407-discovery-candidate-ref-pending-rehydration-helper-extraction-runway.md`.

Goal: move pure pending-ref rehydration helpers out of old Watch collector ownership and into Discovery ownership while preserving behavior exactly.

## Files Changed

- `src/main/discovery/candidateRefMemory.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `workspace/current.md`
- `workspace/DevHS407-discovery-candidate-ref-pending-rehydration-helper-extraction.md`

## Helper Module Path

```txt
src/main/discovery/candidateRefMemory.js
```

## Export / Import Summary

Discovery-owned exports:

```txt
pendingActorDiscovery(pendingRefs, plannerOutput)
pendingSystemRadiusDiscovery(pendingRefs)
```

Updated import ownership:

```txt
actorWatchCollector.js -> ../discovery/candidateRefMemory
systemRadiusCollector.js -> ../discovery/candidateRefMemory
```

The old collector-local helper bodies were removed. Repository methods and candidate-ref status mutation choreography were not moved.

## Behavior Preservation Evidence

The moved helpers preserve the previous result shapes:

- actor pending rehydration still returns `discoveredRefs`, `duplicateRefsRemoved`, `malformedRefsRemoved`, `uniqueRefs`, `pendingRefsConsidered`, `expansionQueue`, and `warnings`
- system/radius pending rehydration still returns `systemsScanned`, `discoveredRefs`, `duplicateRefsRemoved`, `malformedRefsRemoved`, `uniqueRefs`, `pendingRefsConsidered`, `expansionQueue`, and `warnings`
- actor pending candidates still include source actor type/id, priority, local selection flags, and null skip posture
- system/radius pending candidates still include source system ID, priority, local selection flags, and null skip posture
- warning strings are preserved exactly

Focused source ownership check:

```txt
rg -n "pendingActorDiscovery|pendingSystemRadiusDiscovery|candidateRefMemory" src\main\workers src\main\discovery
```

Outcome:

- helper definitions are in `src/main/discovery/candidateRefMemory.js`
- actor/system collectors import and call from the Discovery module
- no collector-local pending rehydration helper bodies remain

## Verification

Passed:

```txt
node --check src\main\discovery\candidateRefMemory.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
rg -n "pendingActorDiscovery|pendingSystemRadiusDiscovery|candidateRefMemory" src\main\workers src\main\discovery
npm.cmd run verify:actor-watch
npm.cmd run verify:collector
npm.cmd run verify:manual-discovery
npm.cmd run verify:queue-scope-isolation
npm.cmd run verify:queue-selection
npm.cmd run verify:queue-report
npm.cmd run verify:queue-api-evidence-write
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

Notable verification details:

- `verify:actor-watch`, `verify:collector`, and `verify:manual-discovery` passed, proving current mixed collector/manual compatibility remains intact.
- `verify:queue-scope-isolation`, `verify:queue-selection`, `verify:queue-report`, and `verify:queue-api-evidence-write` passed, preserving candidate-ref status/readout behavior.
- `verify:service-registry` passed with the 300 second ceiling.
- `verify:enforcement-dry-run` remained complete with 113 commands covered and 0 gaps.
- `verify:protected-terms` completed with warning-only advisory output across the broad current working set; no source-term rename or protected-word JSON update was performed.
- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad working set plus HS407-touched files.

## Untouched Boundaries

Confirmed unchanged:

- no repository method move
- no candidate-ref status service
- no status-policy rewrite
- no `pendingDiscoveryRefs(...)` change
- no `upsertDiscoveredKillmailRefs(...)` change
- no selected/expanded/cached/failed status mutation behavior change
- no `selected_for_expansion_at`, `expanded_at`, `failed_at`, `failure_count`, or `last_error` behavior change
- no manual discovery change
- no manual expansion change
- no `actor.watch` redirect
- no `system.radius.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no collector invocation/rewrite/retirement
- no provider-call behavior change
- no Discovery ref write behavior change
- no Evidence/EVEidence write behavior change
- no Hydration/metadata write
- no `fetch_runs`, API logs, warnings, Watch cadence, Watch run records, or old summary result behavior change
- no schema
- no Discovery task/packet persistence
- no receipt machinery
- no dispatcher, queue, lease, worker, or sequencer behavior
- no command metadata/authority change
- no runtime enforcement or command blocking
- no renderer UI
- no support artifacts
- no source-term rename
- no protected-word JSON update

## Recommended Next Action

Overseer review HS407 against `workspace/current.md`, HS405, and HS406. If accepted, the next larger boundary remains the ESI-backed expansion/package helper trace before any actor Watch redirect or collector retirement.
