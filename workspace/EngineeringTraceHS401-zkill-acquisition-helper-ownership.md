# EngineeringTraceHS401 - zKill Acquisition Helper Ownership

## 1. Executive Recommendation

Atlas can move the zKill acquisition helper loops into a Discovery-owned helper module as the next small cleanup seam, but only as a behavior-preserving extraction.

The low-level provider client `ZKillDiscoveryClient.discoverRefs(...)` is already a reasonable reusable primitive for Discovery zKill candidate-lead acquisition. The ownership problem is one layer above it: actor and system/radius acquisition loops still live in old Watch collector files, and manual discovery imports those helper surfaces from the collectors.

Recommended next Dev packet, if Overseer opens one: extract the actor/system zKill acquisition helper logic into a Discovery-owned module such as:

```txt
src/main/discovery/zkillCandidateAcquisition.js
```

This should preserve current runtime behavior exactly. It should not redirect `actor.watch`, retire collectors, change provider movement, change write behavior, change command metadata, create schema, or create live capability.

If Overseer wants a still safer step, do not move code yet and instead ask Dev for a focused fixture parity proof around the extracted helper shape. Source trace alone is enough to justify a narrow extraction, but not enough to justify runtime redirect or collector retirement.

## 2. Current Actor zKill Acquisition Path

Current actor acquisition helper logic lives in:

```txt
src/main/workers/actorWatchCollector.js
```

Important path:

- `collectActorWatch(...)` creates `EvidenceRepository`, a `fetch_runs` row, `HttpClient`, `ZKillDiscoveryClient`, and `EsiClient`.
- It checks local pending refs through `repository.pendingDiscoveryRefs(...)`.
- If no pending refs exist, it calls `discoverActorRefs(plannerOutput, zkillClient)`.
- `discoverActorRefs(...)` loops `plannerOutput.plannedZkillRequests`.
- Each request calls `zkillClient.discoverRefs(...)` with actor target type/id, lookback, cap, and optional preview.
- Returned refs are converted into expansion candidates by `expansionCandidate(...)`.
- The helper counts discovered refs, malformed refs, duplicate refs, unique refs, expansion queue rows, and warnings.

Actor request input shape comes from `planActorWatch(...)` in `src/main/workers/actorWatchPlanner.js`:

```txt
plannedZkillRequests: [{
  provider: 'zkill',
  method: 'GET',
  target_type,
  target_id,
  past_seconds,
  max_refs,
  route
}]
```

Actor acquisition output shape from `discoverActorRefs(...)`:

```txt
{
  discoveredRefs,
  duplicateRefsRemoved,
  malformedRefsRemoved,
  uniqueRefs,
  expansionQueue,
  warnings
}
```

Actor candidate shape:

```txt
{
  killmail_id,
  hash,
  source_actor_type,
  source_actor_id,
  discovered_at,
  priority,
  already_cached,
  selected_for_expansion,
  skip_reason,
  preview
}
```

This helper is Discovery-shaped in meaning, but Watch-owned in location.

## 3. Current System/Radius zKill Acquisition Path

Current system/radius acquisition helper logic lives in:

```txt
src/main/workers/systemRadiusCollector.js
```

Important path:

- `collectSystemRadiusWatch(...)` creates `EvidenceRepository`, `TopologyService`, a `fetch_runs` row, `HttpClient`, `ZKillDiscoveryClient`, and `EsiClient`.
- It plans system requests through `planSystemRadiusWatch(...)`.
- It checks local pending refs through `repository.pendingDiscoveryRefs(...)`.
- If no pending refs exist, it calls system `discoverRefs(plannerOutput, zkillClient)`.
- `discoverRefs(...)` loops `plannerOutput.plannedZkillRequests`.
- Each request calls `zkillClient.discoverRefs(...)` with `targetType: 'system'`.
- Returned refs become expansion candidates through system `expansionCandidate(...)`.
- The helper counts systems scanned, discovered refs, malformed refs, duplicate refs, unique refs, expansion queue rows, and warnings.

System/radius request input shape comes from `planSystemRadiusWatch(...)` in `src/main/workers/systemRadiusPlanner.js`:

```txt
plannedZkillRequests: [{
  provider: 'zkill',
  method: 'GET',
  target_type: 'system',
  target_id,
  past_seconds,
  max_refs,
  route
}]
```

System/radius acquisition output shape:

```txt
{
  systemsScanned,
  discoveredRefs,
  duplicateRefsRemoved,
  malformedRefsRemoved,
  uniqueRefs,
  expansionQueue,
  warnings
}
```

System candidate shape:

```txt
{
  killmail_id,
  hash,
  source_system_id,
  discovered_at,
  priority,
  already_cached,
  selected_for_expansion,
  skip_reason,
  preview
}
```

This helper is also Discovery-shaped in meaning, but still lives in the mixed system/radius collector.

## 4. Current Manual Discovery Dependency On Collector Helpers

Manual discovery currently depends directly on Watch collector helper ownership:

```txt
src/main/workers/manualDiscoveryWorker.js
```

It imports:

```txt
discoverActorRefs from ./actorWatchCollector
discoverRefs as discoverSystemRefs from ./systemRadiusCollector
```

`buildManualDiscoveryPlan(...)` uses Watch planners to shape manual actor/system/radius requests, then calls the imported collector helper functions through a `discover(zkillClient)` closure.

Manual discovery is not using the full mixed collectors. It uses the zKill acquisition loops only. That is a strong signal that those helpers are already shared Discovery utility logic in practice, even though their module homes still imply Watch ownership.

Manual discovery also creates/finalizes `fetch_runs`, writes `discovered_killmail_refs`, writes warnings, marks cached candidates, and returns manual result posture. Those responsibilities should not move in the proposed zKill helper extraction.

## 5. Current Provider Call Path And Side Effects

The provider call path is:

```txt
discoverActorRefs(...) / system discoverRefs(...)
-> ZKillDiscoveryClient.discoverRefs(...)
-> HttpClient.json('zkill', endpoint)
-> fetchImpl(endpoint, ...)
-> optional EvidenceRepository.insertApiRequestLog(...)
```

`ZKillDiscoveryClient.discoverRefs(...)` in `src/main/api/zkillClient.js`:

- Builds a zKill endpoint through `buildZkillDiscoveryEndpoint(...)`.
- Supports `system`, `character`, `corporation`, and `alliance`.
- Parses array-like zKill data.
- Requires positive `killmail_id` and `zkb.hash`.
- Dedupes by `killmailId:hash`.
- Optionally carries a preview object.
- Stops at `maxRefs`.

`HttpClient.json(...)` in `src/main/api/httpClient.js`:

- Performs the actual HTTP request.
- Retries 420, 429, and 503 while attempts remain.
- Parses JSON.
- Logs API request rows through `this.repository?.insertApiRequestLog(...)` when a repository is supplied.

Side-effect boundary:

- The acquisition helper loops do not directly write Discovery refs or Evidence.
- `ZKillDiscoveryClient.discoverRefs(...)` does not directly write rows.
- `HttpClient` may write `api_request_logs` if constructed with a repository/run id.
- Current collectors/manual discovery create the `HttpClient`, so support logging remains a caller/runtime concern today.

## 6. Input / Output Shape Comparison For Actor And System Helpers

The actor and system helpers are very close structurally.

Shared inputs:

- `plannerOutput.plannedZkillRequests`
- injected `zkillClient`
- per-request `target_id`, `past_seconds`, `max_refs`, optional `include_preview`

Differences:

- Actor requests supply `target_type` as `character`, `corporation`, or `alliance`.
- System helper forces `targetType: 'system'`.
- Actor candidates preserve `source_actor_type` and `source_actor_id`.
- System candidates preserve `source_system_id`.
- System output includes `systemsScanned`; actor output does not have an equivalent target count.
- Warning text differs by actor target versus system target.

Shared outputs:

- `discoveredRefs`
- `duplicateRefsRemoved`
- `malformedRefsRemoved`
- `uniqueRefs`
- `expansionQueue`
- `warnings`

This is enough similarity for one Discovery-owned module with target variants. A single generic helper may be possible, but a cautious first extraction should preserve the two public helper names or provide explicit actor/system wrapper functions to avoid changing result shapes.

## 7. Pure Reusable Logic Vs Mixed Collector Logic

Pure/reusable enough to move into Discovery helper ownership:

- Actor `discoverActorRefs(...)`.
- System `discoverRefs(...)`, preferably renamed or wrapped later as `discoverSystemRefs(...)`.
- Actor/system `expansionCandidate(...)` candidate normalization.
- Per-run duplicate and malformed classification within the acquisition result.
- Warning construction for provider failure and non-array provider return.

Reusable lower-level provider primitive:

- `ZKillDiscoveryClient.discoverRefs(...)`.
- `buildZkillDiscoveryEndpoint(...)`.
- `modifierForTarget(...)`.
- `discoveryPreview(...)`.

Mixed collector logic that should not move in this packet:

- `collectActorWatch(...)`.
- `collectSystemRadiusWatch(...)`.
- `pendingActorDiscovery(...)` and `pendingSystemRadiusDiscovery(...)` unless a separate candidate-memory trace says otherwise.
- `fetch_runs` create/finalize behavior.
- `HttpClient` construction policy.
- `EvidenceRepository.upsertDiscoveredKillmailRefs(...)`.
- `repository.pendingDiscoveryRefs(...)`.
- `repository.markDiscoveryRefsSelected/Expanded/Cached/Failed(...)`.
- `selectExpansionCandidates(...)`, already moved by HS399 and not part of this seam.
- `buildEvidencePackageFromRefs(...)`.
- `repository.persistEvidencePackage(...)`.
- Old collection summary shaping.
- Watch cadence/run result updates.

## 8. Recommended Discovery-Owned Helper / Module Shape

Recommended low-risk home:

```txt
src/main/discovery/zkillCandidateAcquisition.js
```

Recommended exports for a first extraction:

```txt
discoverActorRefs(plannerOutput, zkillClient)
discoverSystemRefs(plannerOutput, zkillClient)
```

Optionally, the old system export name can remain as a compatibility alias at the collector boundary:

```txt
discoverRefs: discoverSystemRefs
```

Recommended internal helpers:

```txt
actorExpansionCandidate(ref, request, priority)
systemExpansionCandidate(ref, sourceSystemId, priority)
```

This shape keeps the current runtime result contract stable while placing provider-facing acquisition logic under Discovery ownership.

Do not over-generalize in the first packet. A generic `discoverZkillRefsForRequests(...)` may be useful later, but the safest first move is house-sorting, not abstraction.

## 9. What Should Not Move Yet

Do not move or reframe these from HS401 alone:

- `runActorWatchService(...)`.
- `runSystemRadiusWatchService(...)`.
- `actor.watch` or `system.radius.watch` registry behavior.
- Scheduled Watch dispatch.
- Mixed collector orchestration.
- Candidate-ref durable memory/status policy.
- ESI-backed killmail/detail expansion.
- Evidence/EVEidence writer landing.
- Fetch-run lifecycle as receipt authority.
- API logging policy.
- Manual discovery write/result behavior.
- Discovery task/packet schema.
- Dispatcher/queue/lease/sequencer behavior.
- Runtime enforcement or command blocking.
- UI/renderer behavior.

## 10. Risks And Terminology / Ownership Cautions

1. `discoverRefs` is too generic as a future public name.
   In `systemRadiusCollector.js`, it means system zKill acquisition. If moved, prefer `discoverSystemRefs(...)` or `discoverZkillSystemCandidateRefs(...)` for clarity.

2. `expansionQueue` is still old compatibility language.
   It is current result shape, but in Discovery language these are candidate refs / acquisition candidates awaiting ESI-backed expansion. Keep the field for compatibility; do not let the term become wider doctrine.

3. Deduping is per helper run and by `killmail_id`.
   `ZKillDiscoveryClient` dedupes by `killmailId:hash`; the actor/system helper loops dedupe by `killmail_id`. That may be current behavior worth preserving, but future Discovery policy should explicitly decide whether same killmail ID with different hash is malformed/conflict/duplicate.

4. Non-array provider response is unlikely through current `ZKillDiscoveryClient`.
   The helper loops check for non-array refs, but `ZKillDiscoveryClient.discoverRefs(...)` returns an array even when provider data is non-array. Preserve the check for compatibility; do not over-read it as live provider coverage.

5. `HttpClient` support logging is a side effect outside the helper loop.
   Moving helper loops will not eliminate API log writes when callers pass a repository-backed `HttpClient`. Dev verification must prove the extraction does not create new provider/logging paths.

6. Manual discovery is already carrying the ownership smell.
   It is the best proof that helper movement is useful, because manual discovery currently imports shared acquisition logic from Watch collector modules.

7. Mapvault notes support the mental model, but are not authority.
   The local accepted HS397/HS400 records and source trace are sufficient basis for this recommendation.

## 11. Smallest Next Dev Packet Recommendation

Recommended packet:

```txt
Discovery zKill candidate acquisition helper extraction
```

Scope:

- Add `src/main/discovery/zkillCandidateAcquisition.js`.
- Move actor `discoverActorRefs(...)` and actor candidate normalization into that module.
- Move system/radius `discoverRefs(...)` logic into that module as `discoverSystemRefs(...)`.
- Update `actorWatchCollector.js`, `systemRadiusCollector.js`, and `manualDiscoveryWorker.js` imports to use the Discovery-owned module.
- Preserve old exported collector helper surfaces if current tests or scripts need them, but make them thin compatibility re-exports only.
- Preserve behavior exactly.

Out of scope:

- No provider-call behavior change.
- No new command.
- No runtime redirect.
- No collector retirement.
- No write behavior change.
- No schema.
- No dispatcher/queue/lease.
- No protected-term/source-term rename.

## 12. Acceptance Criteria For That Packet

- zKill acquisition helper definitions live under `src/main/discovery/`.
- `manualDiscoveryWorker.js` no longer imports acquisition helpers from Watch collector files.
- `actorWatchCollector.js` and `systemRadiusCollector.js` still behave as current mixed collectors.
- Current result shapes remain byte-for-byte or semantically equivalent for tested fixture paths.
- Current provider call path remains unchanged except for module ownership.
- No new provider calls are introduced by verification.
- `discovered_killmail_refs`, `fetch_runs`, `api_request_logs`, Evidence/EVEidence writes, and Watch cadence/state behavior are unchanged.
- No command authority or service registry metadata changes.
- No runtime redirect or collector retirement occurs.
- Any old collector helper export retained is marked by structure as compatibility, not future ownership.

## 13. Verification Commands / Evidence Expected

Suggested focused checks:

```txt
node --check src\main\discovery\zkillCandidateAcquisition.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\manualDiscoveryWorker.js
rg -n "discoverActorRefs|discoverSystemRefs|discoverRefs|zkillCandidateAcquisition|require\('./actorWatchCollector'\)|require\('./systemRadiusCollector'\)" src\main\workers src\main\discovery
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

Expected proof emphasis:

- Import ownership changed.
- Runtime behavior did not.
- Manual discovery no longer borrows from collector modules for zKill acquisition.
- No live/API/provider movement is added by the extraction.

No implementation verification was run for this advisory artifact.

## 14. Human / Overseer Decisions Needed

Overseer should decide whether to open the narrow helper extraction packet now or ask for a fixture-only parity proof first.

Human/Overseer should also decide naming if Dev opens the packet:

- Preferred: `zkillCandidateAcquisition.js`.
- Acceptable: `zkillAcquisition.js`, if Overseer wants shorter naming.
- Avoid for future doctrine: `collector`, unqualified `discoverRefs`, or names implying Watch ownership.

No Dev runway is created by this advisory.

