# DevHS403 - Discovery zKill Candidate Acquisition Helper Extraction

Status: complete; pending Overseer review
Date: 2026-06-07
Executor: Dev

## Scope

Executed `workspace/OverseerHS403-discovery-zkill-candidate-acquisition-helper-extraction-runway.md`.

Goal: move zKill candidate acquisition helper logic out of old Watch collector ownership and into Discovery ownership while preserving behavior exactly.

## Files Changed

- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `workspace/current.md`
- `workspace/DevHS403-discovery-zkill-candidate-acquisition-helper-extraction.md`

## Helper Module Path

```txt
src/main/discovery/zkillCandidateAcquisition.js
```

## Export / Import Summary

Discovery-owned exports:

```txt
discoverActorRefs(plannerOutput, zkillClient)
discoverSystemRefs(plannerOutput, zkillClient)
```

Discovery-owned internal normalization helpers:

```txt
actorExpansionCandidate(ref, request, priority)
systemExpansionCandidate(ref, sourceSystemId, priority)
```

Updated import ownership:

```txt
actorWatchCollector.js -> ../discovery/zkillCandidateAcquisition
systemRadiusCollector.js -> ../discovery/zkillCandidateAcquisition
manualDiscoveryWorker.js -> ../discovery/zkillCandidateAcquisition
```

Compatibility retained:

```txt
systemRadiusCollector.js exports discoverRefs: discoverSystemRefs
actorWatchCollector.js exports discoverActorRefs from the Discovery module import
```

Manual discovery no longer imports zKill acquisition helpers from Watch collector modules.

## Behavior Preservation Evidence

The moved helper logic preserves the previous actor/system result shapes:

- actor output still includes `discoveredRefs`, `duplicateRefsRemoved`, `malformedRefsRemoved`, `uniqueRefs`, `expansionQueue`, and `warnings`
- system/radius output still includes `systemsScanned`, `discoveredRefs`, `duplicateRefsRemoved`, `malformedRefsRemoved`, `uniqueRefs`, `expansionQueue`, and `warnings`
- actor candidate shape still includes `source_actor_type`, `source_actor_id`, `priority`, `preview`, and existing skip fields
- system candidate shape still includes `source_system_id`, `priority`, `preview`, and existing skip fields

Provider path is unchanged:

```txt
discoverActorRefs(...) / discoverSystemRefs(...)
-> zkillClient.discoverRefs(...)
-> ZKillDiscoveryClient.discoverRefs(...)
```

No `ZKillDiscoveryClient.discoverRefs(...)`, `HttpClient`, API logging policy, Discovery ref write, Evidence/EVEidence write, Hydration, fetch-run, warning, Watch cadence, command authority, enforcement, schema, UI, support artifact, or provider behavior was changed.

Focused source ownership check:

```txt
rg -n "discoverActorRefs|discoverSystemRefs|discoverRefs|zkillCandidateAcquisition|require\('./actorWatchCollector'\)|require\('./systemRadiusCollector'\)" src\main\workers src\main\discovery
```

Outcome:

- helper definitions are in `src/main/discovery/zkillCandidateAcquisition.js`
- collectors import from the Discovery module
- manual discovery imports from the Discovery module
- no manual import remains from `./actorWatchCollector` or `./systemRadiusCollector`

## Verification

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

Notable verification details:

- `verify:actor-watch`, `verify:collector`, and `verify:manual-discovery` passed, proving current mixed collector/manual behavior remains intact.
- `verify:service-registry` passed with the 300 second ceiling.
- `verify:enforcement-dry-run` remained complete with 113 commands covered and 0 gaps.
- `verify:protected-terms` completed with warning-only advisory output across the broad current working set; no source-term rename or protected-word JSON update was performed.
- `git diff --check` passed with CRLF normalization warnings only.
- `git status --short --branch` showed branch `main...origin/main [ahead 19]` with the existing broad working set plus HS403-touched files.

## Untouched Boundaries

Confirmed unchanged:

- no `actor.watch` redirect
- no `system.radius.watch` redirect
- no `runActorWatchService(...)` change
- no `watchExecutor.dispatchFor(...)` change
- no collector invocation/rewrite/retirement
- no provider-call behavior change
- no `ZKillDiscoveryClient.discoverRefs(...)` change
- no `HttpClient` construction or API logging policy change
- no Discovery ref write behavior change
- no candidate-ref status behavior change
- no Evidence/EVEidence write behavior change
- no Hydration/metadata write
- no `fetch_runs`, API logs, warnings, Watch cadence, Watch run records, or old summary result behavior change
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

Overseer review HS403 against `workspace/current.md` and HS401/HS402. If accepted, the next seam can continue the Discovery-owned acquisition boundary work without treating this extraction as runtime redirect or collector retirement.
