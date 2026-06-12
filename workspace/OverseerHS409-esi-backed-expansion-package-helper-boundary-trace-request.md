# OverseerHS409 - ESI-Backed Expansion / Package Helper Boundary Trace Request

Status: open advisory request
Date: 2026-06-07
Requester: Overseer
Expected artifact: `workspace/EngineeringTraceHS409-esi-backed-expansion-package-helper-boundary.md`

## Request

Trace the current ESI-backed killmail/detail expansion and Evidence package-building path so Atlas can decide what belongs to Discovery, what belongs to Evidence/EVEidence, and what should remain compatibility scaffolding before any helper extraction, runtime redirect, collector retirement, provider movement, or schema work.

This is advisory/source-trace work only.

## Accepted Context

Atlas is reshaping the provider-facing path around this model:

- Watch / Manual / future intent sources define accepted intent and scope.
- Discovery is the provider-facing acquisition utility.
- Discovery services:
  - zKill candidate-lead acquisition.
  - ESI-backed killmail/detail expansion from selected candidate refs.
- Discovery refs / `discovered_killmail_refs` are possible leads and candidate-ref memory, not Evidence and not Watch task memory.
- Evidence/EVEidence is final landed memory from expanded ESI killmails and normalized rows.
- Hydration repairs readability and labels; it does not create Evidence.
- Observation derives local records into stories/readouts and should disclose basis.
- Assessment Memory is human-authored judgment, not Evidence.

Recent accepted helper homes:

- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/discovery/expansionQueueSelection.js`
- `src/main/discovery/candidateRefMemory.js`

HS407 was accepted by:

```txt
workspace/OverseerHS408-hs407-discovery-candidate-ref-pending-rehydration-helper-extraction-review.md
```

## Trace Questions

Answer from source code, not from preferred architecture alone:

1. What functions currently perform ESI-backed killmail/detail expansion from selected refs?
2. What functions currently build Evidence packages from expanded killmail payloads?
3. What functions currently normalize raw ESI killmail payloads?
4. What functions currently persist Evidence/EVEidence packages?
5. Which current callers use those functions?
6. Which functions perform provider calls, DB reads, DB writes, support logging, warning creation, or status mutation?
7. Which helpers are clean enough to reuse as-is?
8. Which helpers are useful but need a Discovery-owned wrapper or extraction before future runtime replacement?
9. Which helpers belong to Evidence/EVEidence, not Discovery?
10. Which helper names or file homes risk boundary drift?
11. What must remain parked before actor Watch redirect or collector retirement?
12. What is the smallest next Dev packet, if any, after this trace?

## Source List

Read at minimum:

```txt
workspace/current.md
workspace/overview.md
workspace/OverseerHS408-hs407-discovery-candidate-ref-pending-rehydration-helper-extraction-review.md
workspace/EngineeringTraceHS397-discovery-helper-ownership-source-trace.md
workspace/EngineeringTraceHS405-candidate-ref-memory-status-helper-ownership.md
workspace/OverseerHS380-hs379-discovery-esi-expansion-intake-posture-review.md
workspace/OverseerHS386-hs385-evidence-writer-landing-source-trace-review.md
workspace/OverseerHS388-hs387-evidence-writer-landing-package-fixture-review.md
workspace/OverseerHS390-hs389-evidence-writer-conflict-hardening-review.md
workspace/OverseerHS392-hs391-evidence-writer-mixed-conflict-review.md
src/main/workers/actorWatchCollector.js
src/main/workers/systemRadiusCollector.js
src/main/workers/manualExpansionWorker.js
src/main/workers/killmailIngestionWorker.js
src/main/normalization/killmailNormalizer.js
src/main/db/evidenceRepository.js
src/main/api/esiClient.js
src/main/api/httpClient.js
src/main/discovery/expansionQueueSelection.js
src/main/discovery/candidateRefMemory.js
src/main/discovery/zkillCandidateAcquisition.js
```

Use `rg` to find additional callers for:

```txt
buildEvidencePackageFromRefs
evidencePackageFromExpandedKillmails
normalizeKillmail
persistEvidencePackage
expandKillmail
markDiscoveryRefsSelected
markDiscoveryRefsExpanded
markDiscoveryRefsCached
markDiscoveryRefsFailed
```

## Boundaries

Do not implement code.

Do not run live/provider calls.

Do not edit schema.

Do not create a Dev runway.

Do not change `workspace/current.md`.

Do not rename source terms.

Do not update protected-word JSON.

Do not suggest broad provider queue or dispatcher implementation unless the source trace proves it is immediately necessary.

## Expected Output

Return a concise but complete advisory artifact with:

1. Executive recommendation.
2. Current expansion/package flow.
3. Function ownership table.
4. Caller and side-effect map.
5. Reuse / wrap / extract / preserve / park recommendations.
6. Boundary risks.
7. Gaps before `actor.watch` redirect or collector retirement.
8. Smallest next Dev packet recommendation, if any.
9. Verification/proof commands expected for that packet.
10. Human/Overseer decisions needed.

## Acceptance Criteria

The artifact is acceptable if it:

- distinguishes Discovery ESI-backed expansion from Evidence/EVEidence writer landing.
- does not treat ESI-backed expansion as Hydration.
- does not treat candidate refs as Evidence.
- does not treat Watch as owner of provider movement.
- identifies the current mixed collector responsibilities clearly.
- identifies whether `buildEvidencePackageFromRefs(...)` should be reused, wrapped, split, or extracted.
- identifies what must remain parked.
- gives a smallest next step that does not skip source-trace findings.
