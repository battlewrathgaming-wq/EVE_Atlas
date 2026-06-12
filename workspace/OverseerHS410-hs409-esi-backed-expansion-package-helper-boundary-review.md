# OverseerHS410 - HS409 ESI-Backed Expansion / Package Helper Boundary Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS409-esi-backed-expansion-package-helper-boundary-trace-request.md`
- `workspace/EngineeringTraceHS409-esi-backed-expansion-package-helper-boundary.md`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/discovery/expansionQueueSelection.js`
- `src/main/discovery/candidateRefMemory.js`
- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/db/evidenceRepository.js`
- `src/main/api/esiClient.js`
- `src/main/api/httpClient.js`

## Decision

HS409 is accepted.

The advisory correctly identifies `buildEvidencePackageFromRefs(...)` as useful but not a clean long-term boundary in its current home:

```txt
src/main/workers/killmailIngestionWorker.js
```

The function currently performs Discovery ESI-backed selected-ref expansion work:

- local Evidence cache check through `repository.hasKillmail(...)`
- provider movement through `esiClient.expandKillmail(...)`
- provider capacity / failed expansion classification
- raw ESI payload normalization through `normalizeKillmail(...)`
- writer-ready package assembly

It does not persist Evidence/EVEidence by itself. Final durable landing remains:

```txt
EvidenceRepository.persistEvidencePackage(...)
```

## Accepted Boundary

Accepted split:

- Discovery owns ESI-backed selected-ref killmail/detail expansion.
- Evidence/EVEidence owns normalization and final writer landing.
- `normalizeKillmail(...)` remains Evidence/EVEidence normalization.
- `persistEvidencePackage(...)` remains Evidence/EVEidence writer/memory.
- `evidencePackageFromExpandedKillmails(...)` remains a no-provider fixture/package builder for writer proofs and local injected-payload tests.

Accepted caution:

- Package assembly is not durable Evidence/EVEidence.
- ESI-backed expansion is not Hydration.
- Candidate refs are not Evidence.
- Watch must not become provider movement owner.

## Next Dev Packet Accepted For Shaping

Open a narrow helper-boundary packet:

```txt
Discovery ESI-backed selected-ref expansion package helper extraction
```

Intent:

- Create a Discovery-owned helper module for the existing selected-ref ESI-backed expansion/package behavior.
- Preserve behavior.
- Keep Evidence writer landing untouched.
- Keep current runtime behavior intact.

Preferred shape:

- Add `src/main/discovery/esiBackedExpansionPackage.js`.
- Move or wrap `buildEvidencePackageFromRefs(...)` behavior there.
- Update actor/system/manual expansion callers to import the helper from Discovery, if safe.
- Keep `killmailIngestionWorker.js` as a compatibility export for `buildEvidencePackageFromRefs(...)` if existing tests/scripts still import it.
- Keep `evidencePackageFromExpandedKillmails(...)` in `killmailIngestionWorker.js`.

## Parked

Do not open yet:

- full semantic rename
- splitting package assembly into many policies
- Evidence writer changes
- candidate-ref status policy rewrite
- provider/live activation
- actor Watch runtime redirect
- scheduled Watch redirect
- collector retirement
- system/radius replacement
- durable Discovery task/packet schema
- dispatcher/lease/sequencer work
- runtime enforcement
- Hydration / Observation work
- UI
- support artifact changes
- source-term rename / protected-word JSON update

## Verification Note

No implementation verification was required for HS409 itself; it was advisory/source trace only.

The next Dev packet should prove syntax, helper ownership, caller compatibility, and existing behavior across actor/system/manual expansion and Discovery/Evidence fixture surfaces.
