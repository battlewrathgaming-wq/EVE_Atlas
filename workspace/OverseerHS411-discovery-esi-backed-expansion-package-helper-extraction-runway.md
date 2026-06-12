# OverseerHS411 - Discovery ESI-Backed Selected-Ref Expansion Package Helper Extraction Runway

Status: open Dev runway
Date: 2026-06-07
Executor: Dev
Expected handoff: `workspace/DevHS411-discovery-esi-backed-expansion-package-helper-extraction.md`

## Purpose

Move the existing ESI-backed selected-ref expansion/package helper behavior into Discovery ownership while preserving runtime behavior exactly.

This is helper-home cleanup only. It is not provider movement expansion, not runtime redirect, not collector retirement, not schema work, and not Evidence writer redesign.

## Context

Accepted source trace:

```txt
workspace/EngineeringTraceHS409-esi-backed-expansion-package-helper-boundary.md
```

Accepted review:

```txt
workspace/OverseerHS410-hs409-esi-backed-expansion-package-helper-boundary-review.md
```

Accepted model:

- Discovery owns ESI-backed selected-ref killmail/detail expansion from candidate refs.
- Evidence/EVEidence owns normalization and final writer landing.
- `normalizeKillmail(...)` remains Evidence/EVEidence normalization.
- `EvidenceRepository.persistEvidencePackage(...)` remains final durable Evidence/EVEidence writer landing.
- `evidencePackageFromExpandedKillmails(...)` remains a no-provider fixture/package builder for writer proofs and injected expanded-payload tests.
- ESI-backed expansion is not Hydration.
- Candidate refs are not Evidence.
- Watch does not own provider movement.

## Scope

Add:

```txt
src/main/discovery/esiBackedExpansionPackage.js
```

Move or wrap the existing behavior of:

```txt
buildEvidencePackageFromRefs(...)
```

from:

```txt
src/main/workers/killmailIngestionWorker.js
```

into the new Discovery-owned module.

Preserve the existing function signature and output shape:

```txt
buildEvidencePackageFromRefs({ refs, repository, esiClient, run, discoveredBy })
```

Preserve behavior:

- local cache skip through `repository.hasKillmail(...)`
- ESI call through injected `esiClient.expandKillmail(...)`
- `HTTP_CANCELLED`, `TASK_CANCELLED`, and `AbortError` are rethrown
- provider capacity errors create `provider_capacity_deferred` warnings
- other expansion failures increment `failed_count` and create `failed_expansion` warnings
- raw ESI payloads normalize through `normalizeKillmail(...)`
- returned package remains compatible with `EvidenceRepository.persistEvidencePackage(...)`
- helper does not persist Evidence/EVEidence by itself
- helper does not mutate `discovered_killmail_refs` status by itself

Update imports where safe:

- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualExpansionWorker.js`

Keep compatibility:

- `src/main/workers/killmailIngestionWorker.js` may continue to export `buildEvidencePackageFromRefs(...)` as a compatibility export, but the implementation should live under Discovery.
- `evidencePackageFromExpandedKillmails(...)` stays in `killmailIngestionWorker.js`.

## Non-Goals

Do not change:

- `normalizeKillmail(...)`
- `EvidenceRepository.persistEvidencePackage(...)`
- `evidencePackageFromExpandedKillmails(...)` behavior
- `selectExpansionCandidates(...)`
- `markFailedExpansionCandidates(...)`
- `pendingDiscoveryRefs(...)`
- `upsertDiscoveredKillmailRefs(...)`
- `markDiscoveryRefsSelected(...)`
- `markDiscoveryRefsExpanded(...)`
- `markDiscoveryRefsCached(...)`
- `markDiscoveryRefsFailed(...)`
- actor/system/manual expansion result shapes
- `fetch_runs` behavior
- `api_request_logs` behavior
- provider/live access behavior
- command metadata/authority
- runtime enforcement
- Watch cadence or Watch receipt behavior
- collector invocation
- actor Watch redirect
- scheduled Watch redirect
- collector retirement
- durable Discovery task/packet schema
- dispatcher/queue/lease/sequencer behavior
- Hydration / metadata writes
- Observation / Assessment behavior
- support artifact behavior
- renderer UI
- source terms
- protected-word JSON

## Acceptance Criteria

- `buildEvidencePackageFromRefs(...)` implementation is Discovery-owned.
- Current callers still behave the same.
- Existing compatibility imports do not break.
- `evidencePackageFromExpandedKillmails(...)` remains available for fixture/writer proofs.
- The new helper does not write Evidence/EVEidence.
- The new helper does not mutate candidate-ref status.
- The new helper does not invoke Watch collectors.
- Existing actor/system/manual expansion verifiers pass.
- Discovery/Evidence fixture verifiers pass.
- Service registry and command authority do not drift.

## Required Verification

Run:

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

If a focused helper-contract verifier is added, include it in the handoff. It must remain fake-client/no-live-provider unless explicitly justified by existing verifier patterns.

## Expected Handoff

Create:

```txt
workspace/DevHS411-discovery-esi-backed-expansion-package-helper-extraction.md
```

Include:

- files changed
- exact helper ownership result
- compatibility export decision
- import/caller changes
- boundary confirmation
- verification commands and outcomes
- remaining parked items
