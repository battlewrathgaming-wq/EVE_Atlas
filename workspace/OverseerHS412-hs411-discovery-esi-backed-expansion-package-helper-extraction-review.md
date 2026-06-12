# OverseerHS412 - HS411 Discovery ESI-Backed Expansion Package Helper Extraction Review

Status: accepted
Date: 2026-06-07
Reviewer: Overseer

## Reviewed Input

- `workspace/OverseerHS411-discovery-esi-backed-expansion-package-helper-extraction-runway.md`
- `workspace/DevHS411-discovery-esi-backed-expansion-package-helper-extraction.md`
- `src/main/discovery/esiBackedExpansionPackage.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualExpansionWorker.js`

## Decision

HS411 is accepted.

The ESI-backed selected-ref expansion/package helper is now Discovery-owned while preserving behavior. This is a helper-home cleanup only, not runtime redirect, collector retirement, provider movement expansion, schema work, dispatcher work, or Evidence/EVEidence writer redesign.

## Accepted Result

Added:

- `src/main/discovery/esiBackedExpansionPackage.js`

The module defines and exports:

```txt
buildEvidencePackageFromRefs({ refs, repository, esiClient, run, discoveredBy })
```

Accepted ownership posture:

- Discovery owns ESI-backed selected-ref killmail/detail expansion/package preparation from candidate refs.
- `buildEvidencePackageFromRefs(...)` implementation now lives under `src/main/discovery/`.
- actor/system/manual expansion callers import `buildEvidencePackageFromRefs(...)` from Discovery.
- `src/main/workers/killmailIngestionWorker.js` retains a compatibility export for existing imports.
- `evidencePackageFromExpandedKillmails(...)` remains in `killmailIngestionWorker.js` as the no-provider fixture/package builder.
- Evidence/EVEidence writer landing remains `EvidenceRepository.persistEvidencePackage(...)`.
- Evidence/EVEidence normalization remains `normalizeKillmail(...)`.

## Boundary Review

Confirmed unchanged:

- no Evidence writer behavior change
- no `normalizeKillmail(...)` behavior change
- no `EvidenceRepository.persistEvidencePackage(...)` behavior change
- no `evidencePackageFromExpandedKillmails(...)` behavior change
- no candidate-ref status-policy rewrite
- no selected/expanded/cached/failed mutation behavior change
- no `fetch_runs` or `api_request_logs` behavior change
- no provider/live access behavior change
- no command metadata/authority change
- no runtime enforcement or command blocking
- no Watch cadence or Watch receipt behavior change
- no collector invocation, actor Watch redirect, scheduled Watch redirect, or collector retirement
- no durable Discovery task/packet schema, dispatcher, queue, lease, or sequencer behavior change
- no Hydration, Observation, Assessment, support artifact, renderer UI, source-term rename, or protected-word JSON update

## Verification

Overseer re-ran the focused HS411 proof set:

```txt
node --check src\main\discovery\esiBackedExpansionPackage.js
node --check src\main\workers\killmailIngestionWorker.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\manualExpansionWorker.js
git diff --check
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
git status --short --branch
```

Results:

- all syntax checks passed
- all listed npm verification commands passed
- `verify:service-registry` passed with a 300 second ceiling
- `verify:enforcement-dry-run` remained complete: 113 commands covered, 0 gaps
- `verify:protected-terms` completed warning-only: 775 warnings across the broad current working set; no renames or protected-word JSON updates were performed
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git status --short --branch` showed `main...origin/main [ahead 19]` with the expected broad uncommitted/untracked milestone stack

## Notes

No blocking issues found.

One small naming residue remains in some fixture output: older generated labels still mention "ESI Evidence Expansion" in places. This is not a behavior blocker for HS411 because the accepted behavior and helper home are Discovery-owned. When the fixture surfaces are revised later, prefer Discovery-owned lane wording such as "Discovery ESI-backed killmail/detail expansion".

The duplicate `emptyEvidencePackage(...)` helper shape between the Discovery helper and worker-side fixture builder is acceptable for this extraction. Do not spend Dev churn on that unless it becomes a real maintenance issue.

## Next Candidate

Recommended next seam:

- actor Watch redirect readiness re-check, now that helper homes are settled

Do not open runtime redirect, scheduled Watch redirect, collector retirement, provider movement expansion, dispatcher work, schema work, or enforcement until the next seam explicitly accepts that movement.
