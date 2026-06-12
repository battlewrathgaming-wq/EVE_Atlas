# DevHS411 - Discovery ESI-Backed Expansion Package Helper Extraction

Status: complete; pending Overseer review
Date: 2026-06-07
Executor: Dev

## Scope

Executed `workspace/OverseerHS411-discovery-esi-backed-expansion-package-helper-extraction-runway.md`.

This was helper-home cleanup only: move/wrap the existing ESI-backed selected-ref expansion/package helper into Discovery ownership while preserving behavior.

## Files Changed

- `src/main/discovery/esiBackedExpansionPackage.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualExpansionWorker.js`
- `workspace/current.md`
- `workspace/DevHS411-discovery-esi-backed-expansion-package-helper-extraction.md`

Note: the working tree already contains a broad unaccepted helper-extraction milestone stack. HS411 is layered on top of that state and does not revert or broaden prior unaccepted changes.

## Helper Ownership Result

Added Discovery-owned helper module:

```txt
src/main/discovery/esiBackedExpansionPackage.js
```

It now defines and exports:

```txt
buildEvidencePackageFromRefs({ refs, repository, esiClient, run, discoveredBy })
```

Preserved behavior:

- local cache skip through `repository.hasKillmail(...)`
- ESI detail expansion through injected `esiClient.expandKillmail(...)`
- `HTTP_CANCELLED`, `TASK_CANCELLED`, and `AbortError` rethrow
- provider capacity errors become `provider_capacity_deferred` warnings
- other expansion failures increment `failed_count` and become `failed_expansion` warnings
- raw ESI payloads still normalize through `normalizeKillmail(...)`
- returned package remains compatible with `EvidenceRepository.persistEvidencePackage(...)`
- helper does not persist Evidence/EVEidence itself
- helper does not mutate candidate-ref status itself

## Compatibility Export Decision

`src/main/workers/killmailIngestionWorker.js` now imports `buildEvidencePackageFromRefs(...)` from Discovery and re-exports it for compatibility.

`evidencePackageFromExpandedKillmails(...)` remains in `killmailIngestionWorker.js` for no-provider fixture/package builder use and existing script imports.

## Import / Caller Changes

Updated direct callers to import `buildEvidencePackageFromRefs(...)` from Discovery:

- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualExpansionWorker.js`

Focused source check:

```txt
rg -n "buildEvidencePackageFromRefs|esiBackedExpansionPackage|evidencePackageFromExpandedKillmails" src\main\workers src\main\discovery scripts
```

Observed:

- implementation lives in `src/main/discovery/esiBackedExpansionPackage.js`
- actor/system/manual expansion callers import from Discovery
- compatibility export remains in `killmailIngestionWorker.js`
- fixture/writer scripts continue using `evidencePackageFromExpandedKillmails(...)` from `killmailIngestionWorker.js`

## Boundary Confirmation

Confirmed unchanged / not implemented:

- no Evidence writer change
- no `normalizeKillmail(...)` behavior change
- no `EvidenceRepository.persistEvidencePackage(...)` behavior change
- no `evidencePackageFromExpandedKillmails(...)` behavior change
- no candidate-ref status policy rewrite
- no `selectExpansionCandidates(...)`, `markFailedExpansionCandidates(...)`, `pendingDiscoveryRefs(...)`, `upsertDiscoveredKillmailRefs(...)`, selected/expanded/cached/failed mutation behavior, timestamp, failure count, or last-error behavior change
- no actor/system/manual expansion result shape change intended
- no `fetch_runs` or `api_request_logs` behavior change
- no provider/live access behavior change
- no command metadata/authority change
- no runtime enforcement or command blocking
- no Watch cadence or Watch receipt behavior change
- no collector invocation, actor Watch redirect, scheduled Watch redirect, or collector retirement
- no durable Discovery task/packet schema, dispatcher, queue, lease, or sequencer behavior change
- no Hydration, Observation, Assessment, support artifact, renderer UI, source-term rename, or protected-word JSON update

## Verification

Ran:

```txt
node --check src\main\discovery\esiBackedExpansionPackage.js
node --check src\main\workers\killmailIngestionWorker.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\manualExpansionWorker.js
rg -n "buildEvidencePackageFromRefs|esiBackedExpansionPackage|evidencePackageFromExpandedKillmails" src\main\workers src\main\discovery scripts
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

Results:

- all syntax checks passed
- `verify:actor-watch` passed: actor watch verified
- `verify:collector` passed: system radius collector verified
- `verify:manual-discovery` passed: manual discovery and expansion verified
- `verify:queue-scope-isolation` passed: queue scope isolation verified
- `verify:queue-selection` passed: queue expansion selection verified
- `verify:queue-report` passed: queue report verified
- `verify:queue-api-evidence-write` passed: queue API/evidence write boundary verified
- `verify:discovery-acquisition-to-evidence-handoff-fixture` passed: Discovery acquisition to Evidence handoff fixture validated
- `verify:discovery-esi-expansion-intake-posture` passed: Discovery ESI-backed expansion intake posture validated
- `verify:evidence-writer-landing-package-fixture` passed: Evidence writer landing package fixture validated
- `verify:evidence-rules` passed: evidence rule regression guard verified
- `verify:service-registry` passed
- `verify:command-authority` passed
- `verify:passive-side-effects` passed
- `verify:enforcement-dry-run` passed; coverage remained complete with 113 commands covered and 0 gaps
- `verify:protected-terms` passed with warning-only advisory output: 775 warnings across the broad current working set; no renames or protected-word JSON updates were performed
- `git diff --check` passed with CRLF normalization warnings only
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the existing broad unaccepted milestone stack plus HS411 changes

## Remaining Parked Items

- actor Watch runtime redirect
- scheduled Watch redirect
- collector retirement
- live/provider movement expansion
- durable Discovery task/packet schema
- dispatcher / queue / lease / sequencer behavior
- Watch cadence mutation from Discovery receipt
- Evidence/EVEidence writer redesign
