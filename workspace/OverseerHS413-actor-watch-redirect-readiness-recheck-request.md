# OverseerHS413 - Actor Watch Redirect Readiness Re-Check Request

Status: advisory request open
Date: 2026-06-07
Requested by: Overseer
Expected artifact: `workspace/EngineeringTraceHS413-actor-watch-redirect-readiness-recheck.md`

## Request

Perform a source-trace readiness re-check for redirecting the actor Watch entry point into the new Discovery-owned body.

This is not implementation. Do not edit code.

## Purpose

Atlas has been moving the old mixed collector pipe bends into clearer boundary-owned modules. Before Dev redirects runtime behavior, verify whether the new Discovery body is stable enough for actor Watch to route through it.

Core question:

```txt
Can the existing actor Watch entry point route into the Discovery-owned path without relying on old mixed collector semantics?
```

## Current Accepted Model

- Watch is scheduler and scope-authority.
- Watch decides cadence and emits/populates Discovery pickup intent when due/current/missed.
- Discovery is the provider-facing acquisition utility.
- Discovery services zKill candidate-lead acquisition and ESI-backed killmail/detail expansion lanes.
- `discovered_killmail_refs` is Discovery candidate/ref memory and provenance, not Evidence and not Watch task memory.
- Watch completion should consume a bounded Discovery zKill acquisition receipt/outcome, not inspect Discovery memory directly.
- Discovery ESI-backed expansion continues downstream from landed candidate refs.
- Evidence/EVEidence begins only at final landed expanded ESI killmail memory.
- Hydration repairs readability only.

## Recent Accepted Helper Homes

- `src/main/discovery/zkillCandidateAcquisition.js`
  - owns zKill candidate acquisition helpers.
- `src/main/discovery/expansionQueue.js`
  - owns selected candidate-ref expansion queue helper surface, if still present/current.
- `src/main/discovery/candidateRefMemory.js`
  - owns pending candidate-ref rehydration helpers.
- `src/main/discovery/esiBackedExpansionPackage.js`
  - owns `buildEvidencePackageFromRefs(...)`.
- `src/main/workers/killmailIngestionWorker.js`
  - keeps compatibility export for `buildEvidencePackageFromRefs(...)`.
  - keeps `evidencePackageFromExpandedKillmails(...)` as no-provider fixture/package builder.
- `EvidenceRepository.persistEvidencePackage(...)`
  - remains final Evidence/EVEidence writer landing.
- `normalizeKillmail(...)`
  - remains Evidence/EVEidence normalization.

## Source List

Read current authority and recent artifacts:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS412-hs411-discovery-esi-backed-expansion-package-helper-extraction-review.md`
- `workspace/DevHS411-discovery-esi-backed-expansion-package-helper-extraction.md`
- `workspace/OverseerHS396-hs395-actor-watch-compatibility-wrapper-command-review.md`
- `workspace/OverseerHS394-hs393-actor-watch-redirect-readiness-review.md`
- `workspace/OverseerHS384-hs383-actor-watch-compatibility-wrapper-adapter-fixture-review.md`
- `workspace/OverseerHS378-hs377-actor-watch-replacement-parity-review.md`
- `workspace/OverseerHS375-hs374-mixed-collector-replacement-route-review.md`

Read source code as needed:

- `src/main/workers/actorWatchCollector.js`
- `src/main/services/runActorWatchService.js`
- `src/main/watchlist/watchExecutor.js`
- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/discovery/candidateRefMemory.js`
- `src/main/discovery/esiBackedExpansionPackage.js`
- `src/main/discovery/expansionQueue.js`, if present
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/db/evidenceRepository.js`
- `src/main/services/serviceRegistry.js`
- relevant verification scripts under `scripts/`

## Questions To Answer

1. What exactly does the current actor Watch entry point do today?
2. Which parts of that behavior now have Discovery-owned equivalents?
3. Which parts still rely on old mixed collector semantics?
4. Is a runtime redirect of `actor.watch` ready now, or is another proof/helper needed first?
5. If redirect is ready, what is the smallest safe redirect slice?
6. If redirect is not ready, what precise missing bend blocks it?
7. What compatibility wrapper shape must be preserved for existing callers?
8. What result fields are old caller-facing compatibility only, versus real Discovery receipt/Watch posture?
9. What must remain parked?

## Boundaries

Do not:

- edit code
- create a Dev runway
- redirect `actor.watch`
- invoke providers
- call zKillboard or ESI
- write Discovery refs
- write Evidence/EVEidence
- write Hydration metadata
- mutate Watch cadence
- change command metadata
- change schema
- implement dispatcher/queue/lease/sequencer behavior
- retire collectors
- rename source-owned terms
- update protected-word JSON

## Expected Output

Return a concise advisory artifact with:

1. Executive finding.
2. Current actor Watch behavior trace.
3. New Discovery-owned equivalent surfaces.
4. Remaining mixed-collector dependencies.
5. Redirect readiness decision: ready / not ready / ready only for a narrower slice.
6. Smallest safe next Dev packet, if any.
7. Acceptance criteria for that packet.
8. Verification commands/evidence expected.
9. Parked risks and future work.

Be skeptical. Do not assume readiness because helper modules now exist.
