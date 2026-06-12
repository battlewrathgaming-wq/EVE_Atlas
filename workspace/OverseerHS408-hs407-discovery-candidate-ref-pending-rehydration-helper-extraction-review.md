# OverseerHS408 - HS407 Discovery Candidate Ref Pending Rehydration Helper Extraction Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS407-discovery-candidate-ref-pending-rehydration-helper-extraction-runway.md`
- `workspace/DevHS407-discovery-candidate-ref-pending-rehydration-helper-extraction.md`
- `src/main/discovery/candidateRefMemory.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`

## Decision

HS407 is accepted.

The implementation moved the pending-ref rehydration helper surfaces into Discovery ownership without changing the old collector runtime behavior.

Accepted helper home:

```txt
src/main/discovery/candidateRefMemory.js
```

Accepted exports:

```txt
pendingActorDiscovery(pendingRefs, plannerOutput)
pendingSystemRadiusDiscovery(pendingRefs)
```

The old actor and system/radius collectors now import these helpers from Discovery. The collector-local helper bodies are removed.

## Boundary Review

No blocking issues found.

This was helper-home cleanup only. It did not open runtime redirect, collector retirement, provider movement, receipt persistence, status-service extraction, schema, command enforcement, UI, support artifacts, or term-renaming work.

Confirmed preserved:

- actor pending result shape
- system/radius pending result shape
- warning strings
- selected/cached/failed candidate-ref mutation choreography
- manual discovery behavior
- queue/readout behavior
- mixed collector compatibility

Confirmed not changed:

- no repository method move
- no candidate-ref status service
- no `pendingDiscoveryRefs(...)` rewrite
- no `upsertDiscoveredKillmailRefs(...)` rewrite
- no `actor.watch` or `system.radius.watch` redirect
- no `runActorWatchService(...)` or `watchExecutor.dispatchFor(...)` change
- no collector invocation/rewrite/retirement
- no provider call behavior change
- no Discovery ref write behavior change
- no Evidence/EVEidence write behavior change
- no Hydration/metadata write
- no schema
- no receipt/task/packet persistence
- no dispatcher, queue, lease, worker, or sequencer behavior
- no runtime enforcement or command blocking
- no renderer UI
- no protected-word JSON update

## Verification Run

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

Notes:

- `verify:service-registry` passed with the longer ceiling.
- `verify:enforcement-dry-run` remained complete: 113 commands covered, 0 gaps.
- `verify:protected-terms` completed as warning-only advisory output across the broad working set: 730 warnings, no renames, no protected-word JSON updates.
- `git diff --check` returned exit code 0 with CRLF normalization warnings only.
- `git status --short --branch` remains noisy: `main...origin/main [ahead 19]` with the expected broad uncommitted/untracked milestone stack.

## Accepted Result

Discovery now owns:

- zKill candidate acquisition helpers
- expansion queue selection helpers
- pending candidate-ref rehydration helpers

The old mixed collectors still exist and still carry runtime behavior. That is intentional for this packet.

## Next Candidate

Recommended next seam:

1. ESI-backed expansion/package helper boundary trace.

Reason:

The next larger boundary is the second Discovery lane: selected candidate refs moving toward ESI-backed killmail/detail expansion and Evidence/EVEidence writer handoff. This should be traced before actor Watch redirect or collector retirement.

Parked:

- actor Watch redirect readiness re-check
- scheduled Watch redirect
- collector retirement
- durable Discovery receipt/task packet schema
- runtime dispatcher/provider movement
