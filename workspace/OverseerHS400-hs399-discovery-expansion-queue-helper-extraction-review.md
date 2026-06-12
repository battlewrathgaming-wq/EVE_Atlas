# OverseerHS400 - HS399 Discovery Expansion Queue Helper Extraction Review

Status: accepted
Date: 2026-06-07
Reviewed handoff: `workspace/DevHS399-discovery-expansion-queue-helper-extraction.md`

## Decision

HS399 is accepted.

Dev moved the shared expansion queue helpers into a Discovery-owned helper module and updated current callers without changing runtime behavior.

Accepted helper home:

```txt
src/main/discovery/expansionQueueSelection.js
```

Accepted helpers:

- `selectExpansionCandidates(...)`
- `markFailedExpansionCandidates(...)`
- `summarizeExpansionQueue(...)`

## Scope Review

Accepted:

- `systemRadiusCollector.js` no longer defines or exports the shared expansion queue helpers.
- `actorWatchCollector.js`, `systemRadiusCollector.js`, `manualExpansionWorker.js`, and `manualDiscoveryWorker.js` import the moved helpers from Discovery ownership.
- Current behavior remains old-runtime compatible.

Preserved boundaries:

- no `actor.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no collector retirement
- no provider-client movement
- no zKill or ESI behavior change
- no Discovery ref write behavior change
- no Evidence/EVEidence write behavior change
- no Hydration/metadata work
- no `fetch_runs`, API log, warning, Watch cadence, or candidate-ref status behavior change
- no schema
- no dispatcher, queue, lease, worker, or sequencer behavior
- no command metadata/authority change
- no runtime enforcement or command blocking
- no renderer UI
- no support artifacts
- no source-term rename
- no protected-word JSON update

## Verification

Overseer ran:

```txt
Get-Content -Path workspace\DevHS399-discovery-expansion-queue-helper-extraction.md
Get-Content -Path src\main\discovery\expansionQueueSelection.js
rg -n "selectExpansionCandidates|markFailedExpansionCandidates|summarizeExpansionQueue|require\('./systemRadiusCollector'\)|require\('../discovery/expansionQueueSelection'\)" src\main\workers src\main\discovery
node --check src\main\discovery\expansionQueueSelection.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\manualExpansionWorker.js
node --check src\main\workers\manualDiscoveryWorker.js
npm.cmd run verify:actor-watch
npm.cmd run verify:collector
npm.cmd run verify:manual-discovery
npm.cmd run verify:evidence-rules
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

Results:

- all syntax checks passed
- focused actor/system/manual behavior checks passed
- command authority, service registry, passive side-effect, and enforcement dry-run checks passed
- protected-term check completed warning-only; no source-term rename or protected-word JSON update
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the expected broad HS working set plus HS399 files

## Remaining Pressure

The next unresolved boundary is provider-facing zKill acquisition ownership:

- `discoverActorRefs(...)` still lives in `actorWatchCollector.js`
- system `discoverRefs(...)` still lives in `systemRadiusCollector.js`
- manual discovery still imports those provider-facing helper surfaces from old collector modules

That is a larger seam than HS399 because those helpers call provider clients. It should get a source-trace or carefully bounded extraction runway before implementation.

## Resting Next Candidates

1. Source-trace provider-facing zKill acquisition helper ownership before moving `discoverActorRefs(...)` or system `discoverRefs(...)`.
2. Source-trace Discovery candidate-ref memory/status helper ownership around `pendingDiscoveryRefs(...)`, `upsertDiscoveredKillmailRefs(...)`, and mark-selected/expanded/cached/failed helpers.
3. Re-check actor Watch compatibility-wrapper redirect readiness after HS399 if Human wants to continue toward the actor Watch replacement route.

Do not open live provider movement, collector retirement, default `actor.watch` redirect, schema, dispatcher/queue, or enforcement from HS399 alone.
