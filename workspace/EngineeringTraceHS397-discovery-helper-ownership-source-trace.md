# EngineeringTraceHS397 - Discovery Helper Ownership Source Trace

## 1. Executive Recommendation

The raw helper materials are mostly usable, but the current actor Watch runtime is not.

Atlas should preserve and reuse the low-level primitives where their ownership is clean:

- `normalizeKillmail(...)` belongs with Evidence/EVEidence normalization.
- `EvidenceRepository.persistEvidencePackage(...)` belongs with final Evidence/EVEidence landing.
- `EsiClient.expandKillmail(...)` belongs under the future Discovery ESI-backed killmail/detail expansion lane as the low-level provider client.
- `ZKillDiscoveryClient.discoverRefs(...)` belongs under the future Discovery zKill candidate-lead acquisition lane as the low-level provider client.

Atlas should not reuse `collectActorWatch(...)` as a future route. It is the mixed path. It bundles Watch intent, zKill acquisition, durable Discovery ref mutation, ESI-backed expansion, Evidence/EVEidence writes, support logs/warnings, `fetch_runs`, and old summary result shaping.

Smallest next Dev packet, if Overseer wants one: extract the pure candidate selection / expansion-queue helpers out of `systemRadiusCollector.js` into a Discovery-owned helper module, with no runtime behavior change, no provider calls, no writes beyond existing tests, and no `actor.watch` redirect. This would remove the first obvious ownership smell without changing product behavior.

Do not open default `actor.watch` redirect, scheduled Watch redirect, live provider movement, durable Discovery task schema, dispatcher/queue work, collector retirement, or source-term rename from this trace.

## 2. Helper Ownership Table

| Helper / Surface | What It Does Today | Current Callers | Current Side Effects | Recommended Owner | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `normalizeKillmail(...)` | Converts raw ESI killmail payload into `killmails`, `activity_events`, entity updates, audit, and warnings. Rejects missing `killmail_id`. | `buildEvidencePackageFromRefs(...)`, `evidencePackageFromExpandedKillmails(...)`. | None directly; returns rows. | Evidence/EVEidence normalization, called by Discovery ESI lane before writer landing. | Reuse mostly as-is. Keep outside Watch. |
| `EvidenceRepository.persistEvidencePackage(...)` | Transactionally lands normalized killmails, activity events, entities, audits, warnings; suppresses dependent rows for conflicting duplicate killmail IDs. | Actor/system collectors, manual expansion, fixture/verifier paths. | Writes Evidence/EVEidence and support/audit rows. | Evidence/EVEidence writer. | Reuse as writer boundary only. Never route through compatibility wrapper casually. |
| `selectExpansionCandidates(...)` | Copies expansion queue, skips cached killmails using `repository.hasKillmail`, applies max expansion cap, returns selected refs and skip summary. | Actor collector imports it from `systemRadiusCollector.js`; system collector uses it directly. | DB read via `repository.hasKillmail`; no writes. | Discovery ESI-backed expansion intake / selection posture. | Logic is reusable, but extract/rename before future reuse. Current location carries system/radius collector ownership. |
| `pendingDiscoveryRefs(...)` | Reads `discovered_killmail_refs` rows with `pending` or `failed` status for a source identity, ordered by failed status/priority/time/id. | Actor collector, system collector. Manual expansion uses its own query. | DB read. | Discovery candidate-ref memory / recovery input. | Reuse as repository primitive under Discovery. Do not make it a task sequencer. |
| `upsertDiscoveredKillmailRefs(...)` | Writes candidate refs into `discovered_killmail_refs`, preserving expanded/cached/failed terminal-ish statuses and setting cached if local Evidence exists. | Actor collector, system collector, manual discovery, restart/test fixtures. | Writes durable Discovery candidate refs. | Discovery zKill candidate-lead acquisition. | Reuse with Discovery-owned caller. Do not let Watch call it directly in replacement path. |
| `markDiscoveryRefsSelected/Expanded/Cached/Failed(...)` | Mutates durable candidate-ref expansion status and timestamps/errors. | Actor collector, system collector, manual expansion. | Writes durable Discovery candidate-ref status. | Discovery ESI-backed expansion lane / candidate memory. | Reuse cautiously. Needs Discovery-owned receipt/status policy before live replacement. |
| `EsiClient.expandKillmail(...)` | Validates `killmail_id` and hash, calls ESI killmail endpoint through `HttpClient`. | `buildEvidencePackageFromRefs(...)`, tests/live scripts via injected clients. | Provider call; `HttpClient` may write `api_request_logs`. | Discovery ESI-backed killmail/detail expansion lane. | Reuse as low-level provider client only. Never call from Watch wrapper. |
| `ZKillDiscoveryClient.discoverRefs(...)` | Calls zKill, extracts unique `killmail_id` + hash refs, optional preview metadata. | Actor/system collectors, manual discovery through collector helpers. | Provider call; `HttpClient` may write `api_request_logs`. | Discovery zKill candidate-lead acquisition. | Reuse as low-level provider client only. Needs Discovery-owned runtime service before live Watch. |
| `buildEvidencePackageFromRefs(...)` | Skips local cached killmails, calls ESI, normalizes raw payloads, classifies provider-capacity and failed-expansion warnings. | Actor collector, system collector, manual expansion. | Provider calls through injected `esiClient`; no direct DB writes except client logging. | Discovery ESI-backed expansion lane plus Evidence package assembly. | Useful but mixed. Split or wrap under Discovery before live reuse. Name/location risks blurring expansion, ingestion, and writer landing. |
| `evidencePackageFromExpandedKillmails(...)` | Builds an Evidence package from already-expanded raw ESI payload fixtures. | Evidence writer fixtures, reports/tests, assessment/report verifiers. | None directly. | Evidence package assembly / writer fixture support. | Reuse for fixture and writer proof. Not live movement. |
| `discoverActorRefs(...)` | Actor-shaped zKill request loop: calls zKill, normalizes/malformed/duplicate candidate refs, returns expansion queue and warnings. | Actor collector; manual discovery imports it for actor scope. | Provider call through `zkillClient`; no direct DB writes. | Discovery zKill acquisition, actor target variant. | Extract/adapt later. Do not keep it in `actorWatchCollector.js` as future Discovery owner. |
| `discoverRefs(...)` from system collector | System-shaped zKill request loop: calls zKill per planned system, normalizes/malformed/duplicate candidate refs, returns expansion queue and warnings. | System collector; manual discovery imports it for system/radius scope. | Provider call through `zkillClient`; no direct DB writes. | Discovery zKill acquisition, system target variant. | Extract/adapt later. Do not keep it in `systemRadiusCollector.js` as future Discovery owner. |
| `markFailedExpansionCandidates(...)` / `summarizeExpansionQueue(...)` | Applies failed-expansion warnings back onto selected candidates and summarizes queue skip/selection counts. | Actor collector, system collector, manual expansion. | None directly. | Discovery ESI-backed expansion lane / compatibility summary support. | Reuse, but extract from collector module with `selectExpansionCandidates`. |
| `collectActorWatch(...)` | Full mixed actor runtime: run lifecycle, pending ref drain, zKill discovery, ref writes, selection, ESI expansion, Evidence writes, ref status mutation, warnings, old summary result. | `runActorWatchService`, scheduled actor dispatch, actor/report/live verifier scripts. | Provider calls, `fetch_runs`, `api_request_logs`, Discovery refs, Evidence/EVEidence, warnings, ref status updates. | Legacy compatibility only. | Replace in stages. Do not reuse as Discovery/Watch future boundary. |
| `runActorWatchService(...)` | Resolves actor input, normalizes actor Watch scope, gates live access, calls `collectActorWatch`. | `actor.watch` service registry entry. | Calls mixed collector; therefore provider and DB effects. | Current legacy command surface / compatibility. | Preserve until explicit redirect is authorized. Not a Discovery helper. |
| `actor.watch` registry entry | Registers current actor Watch command as evidence-creating, external API, local mutation; handler calls `runActorWatchService`. | Service bridge / command invocation. | Provider/writes through handler. | Current legacy command authority surface. | Keep unchanged until actual redirect packet. Metadata still reflects current behavior, not future doctrine. |
| Scheduled actor `dispatchFor(...)` | Builds actor Watch payload and returns `command: actor.watch` plus `runner: collectActorWatch`. Executor runs detached task and records Watch success/failure. | `WatchSessionExecutor.tick`, dry-run/parity/readout proofs. | In runtime, creates task and mutates Watch run result after runner returns/throws. | Watch for payload/cadence; legacy compatibility for runner binding. | Split later: payload builder is reusable; `runner: collectActorWatch` is mixed legacy binding. |
| `watch.actor_compatibility_wrapper.preview` | Explicit no-provider command that accepts old actor payload shape and delegates to accepted adapter fixture surface. | Read-only service command/verifier. | None; table-count readout only. | Legacy compatibility proof surface. | Keep as proof/migration aid. Do not treat as runtime replacement. |

## 3. Current Callers And Current Side Effects

### Clean or Mostly Clean Primitives

- `normalizeKillmail(...)` is defined in `src/main/normalization/killmailNormalizer.js:4`.
  - It is called by `buildEvidencePackageFromRefs(...)` at `src/main/workers/killmailIngestionWorker.js:15`.
  - It is called by `evidencePackageFromExpandedKillmails(...)` at `src/main/workers/killmailIngestionWorker.js:57`.
  - It does not write. It returns normalized row shapes.

- `persistEvidencePackage(...)` is defined at `src/main/db/evidenceRepository.js:200`.
  - It writes final Evidence/EVEidence and dependent support rows in a transaction.
  - HS389-HS392 have hardened and proven duplicate/conflict dependent-row suppression.

- `EsiClient.expandKillmail(...)` is defined at `src/main/api/esiClient.js:8`.
  - It validates ID/hash and calls the ESI killmail endpoint through `HttpClient`.
  - `HttpClient.log(...)` writes `api_request_logs` through `EvidenceRepository.insertApiRequestLog(...)` at `src/main/api/httpClient.js:119`.

- `ZKillDiscoveryClient.discoverRefs(...)` is defined at `src/main/api/zkillClient.js:8`.
  - It calls zKill and returns unique `killmail_id`/hash refs with optional preview material.

### Candidate Ref And Selection Primitives

- `selectExpansionCandidates(...)` is defined at `src/main/workers/systemRadiusCollector.js:256`.
  - Actor collector imports it from `systemRadiusCollector.js`.
  - It reads local Evidence cache via `repository.hasKillmail(...)`.
  - It does not mutate rows.
  - Its location is misleading for future Discovery ownership.

- `upsertDiscoveredKillmailRefs(...)` is defined at `src/main/db/evidenceRepository.js:418`.
  - Actor collector writes refs at `src/main/workers/actorWatchCollector.js:48`.
  - System collector writes refs at `src/main/workers/systemRadiusCollector.js:45`.
  - Manual discovery writes refs at `src/main/workers/manualDiscoveryWorker.js:34`.

- `pendingDiscoveryRefs(...)` is defined at `src/main/db/evidenceRepository.js:449`.
  - Actor collector drains pending/failed actor refs at `src/main/workers/actorWatchCollector.js:40`.
  - System collector drains pending/failed system/radius refs at `src/main/workers/systemRadiusCollector.js:37`.
  - Manual expansion uses a separate `manualExpansionCandidates(...)` query rather than this helper.

- `markDiscoveryRefsSelected/Expanded/Cached/Failed(...)` are defined at `src/main/db/evidenceRepository.js:462`, `484`, `506`, and `530`.
  - Actor/system collectors and manual expansion mutate candidate ref statuses around ESI expansion and Evidence landing.

### Mixed Runtime

- `collectActorWatch(...)` is defined at `src/main/workers/actorWatchCollector.js:13`.
  - It creates a fetch run at `src/main/workers/actorWatchCollector.js:21`.
  - It creates zKill/ESI clients at `src/main/workers/actorWatchCollector.js:32`.
  - It drains pending refs at `src/main/workers/actorWatchCollector.js:40`.
  - It calls `discoverActorRefs(...)` at `src/main/workers/actorWatchCollector.js:46`.
  - It writes Discovery refs at `src/main/workers/actorWatchCollector.js:48`.
  - It selects refs at `src/main/workers/actorWatchCollector.js:57`.
  - It calls ESI-backed package building at `src/main/workers/actorWatchCollector.js:59`.
  - It writes Evidence/EVEidence at `src/main/workers/actorWatchCollector.js:78`.
  - It mutates ref expanded/cached status at `src/main/workers/actorWatchCollector.js:79` and `83`.
  - It finalizes run posture at `src/main/workers/actorWatchCollector.js:132` and `145`.

- `runActorWatchService(...)` is defined at `src/main/services/mutatingActionService.js:52`.
  - It still returns `collectActorWatch(...)` at `src/main/services/mutatingActionService.js:61`.

- `actor.watch` is registered at `src/main/services/serviceRegistry.js:209`.
  - It remains evidence-creating, provider-capable, and local-mutating.
  - The handler remains `runActorWatchService(...)` at `src/main/services/serviceRegistry.js:215`.

- Scheduled actor Watch dispatch is defined in `src/main/watchlist/watchExecutor.js:286`.
  - Actor dispatch returns `command: 'actor.watch'` and `runner: collectActorWatch` at `src/main/watchlist/watchExecutor.js:298` and `300`.
  - `WatchSessionExecutor.tick(...)` creates detached tasks at `src/main/watchlist/watchExecutor.js:103` and records Watch success/failure at `src/main/watchlist/watchExecutor.js:115` and `130`.

## 4. Reuse / Replace / Rename / Park Recommendations

Reuse mostly as-is:

- `normalizeKillmail(...)`
- `EvidenceRepository.persistEvidencePackage(...)`
- `EsiClient.expandKillmail(...)`, only under a Discovery ESI lane caller with live gates
- `ZKillDiscoveryClient.discoverRefs(...)`, only under a Discovery zKill lane caller with live gates
- `EvidenceRepository.insertApiRequestLog(...)`, as support logging only
- `evidencePackageFromExpandedKillmails(...)`, for fixtures and writer proof

Reuse after extraction / owner clarification:

- `selectExpansionCandidates(...)`
- `markFailedExpansionCandidates(...)`
- `summarizeExpansionQueue(...)`
- `discoverActorRefs(...)`
- system `discoverRefs(...)`
- `buildEvidencePackageFromRefs(...)`

Replace as orchestration:

- `collectActorWatch(...)`
- `collectSystemRadiusWatch(...)`, by implication from shared helper ownership

Preserve as current compatibility surfaces until explicit redirect:

- `runActorWatchService(...)`
- `actor.watch` registry entry
- scheduled `watchExecutor.dispatchFor(...)` runner binding
- `watch.actor_compatibility_wrapper.preview`

Park:

- default `actor.watch` redirect
- scheduled Watch redirect
- collector retirement
- live Discovery zKill runtime service
- live Discovery ESI-backed runtime service
- durable Discovery task/packet schema
- dispatcher/queue/lease work
- source-term rename

## 5. Boundary Risks

1. `collectActorWatch(...)` is too mixed to be a future route.
   It is not just a wrapper around helpers. It decides provider movement, writes refs, expands ESI, lands Evidence, updates candidate statuses, logs support state, finalizes `fetch_runs`, and shapes old caller output.

2. `selectExpansionCandidates(...)` is a good algorithm in the wrong home.
   Future Discovery code importing selection from `systemRadiusCollector.js` would preserve the old collector ownership smell.

3. `buildEvidencePackageFromRefs(...)` is useful but too broad.
   It combines cache skip, ESI provider call, failure classification, normalization, and package assembly. This fits the Discovery ESI lane conceptually, but should be split or wrapped under a Discovery-owned module before live replacement.

4. `discovered_killmail_refs` helpers are durable candidate memory, not task memory.
   `pendingDiscoveryRefs(...)` and mark-status helpers are useful, but they should not become the sequencer or proof that a Watch packet completed.

5. `fetch_runs` remain support/provenance, not canonical Discovery receipt.
   Current collectors use them heavily; future Discovery should not inherit `fetch_runs` as receipt authority without a later design decision.

6. Manual paths already borrow Watch collector helpers.
   `manualDiscoveryWorker.js` imports `discoverActorRefs` from `actorWatchCollector.js` and system `discoverRefs` from `systemRadiusCollector.js`. This confirms the helper logic is useful, but also confirms the source ownership is already muddy.

7. Compatibility wrapper should not route live helpers.
   The wrapper preview is a no-provider/no-write shape bridge. Routing `expandKillmail`, `discoverRefs`, `upsertDiscoveredKillmailRefs`, or `persistEvidencePackage` through it before another proof would collapse the boundary it was created to protect.

## 6. Gaps Before `actor.watch` Redirect

Before default `actor.watch` redirect can be considered, Atlas still needs:

- A Discovery-owned zKill candidate-lead acquisition runtime service or no-provider first extraction proof that no longer imports from Watch collectors.
- A Discovery-owned candidate selection/status policy for local cache skip, cap skip, malformed, duplicate, failed, cached, selected, expanded.
- A Discovery-owned ESI-backed killmail/detail expansion service boundary that uses `EsiClient.expandKillmail(...)` and `normalizeKillmail(...)` without Watch owning provider movement.
- A handoff from Discovery ESI lane to `EvidenceRepository.persistEvidencePackage(...)` that preserves candidate basis.
- A receipt/cadence handoff back to Watch that does not use collector summary fields as doctrine.
- A plan for `fetch_runs` as support telemetry, not canonical Discovery receipt.
- Explicit verifier migration for older scripts that call `collectActorWatch(...)` directly to seed reports or live smoke data.
- Command metadata decision for when `actor.watch` stops being accurately described as current provider/evidence-creating collection.

## 7. Smallest Next Dev Packet Recommendation

Recommended next Dev packet:

```txt
Extract Discovery candidate selection helpers from collector ownership.
```

Suggested scope:

- Create a Discovery-owned helper module for:
  - `selectExpansionCandidates(...)`
  - `markFailedExpansionCandidates(...)`
  - `summarizeExpansionQueue(...)`
- Update current actor/system/manual expansion imports to use the new module.
- Preserve behavior exactly.
- No provider calls.
- No DB writes beyond existing verifier-controlled behavior.
- No `actor.watch` redirect.
- No scheduled Watch redirect.
- No collector retirement.
- No schema, dispatcher, queue, UI, Hydration, Observation, or source-term rename.

Why this is the smallest useful next step:

- It removes a concrete ownership leak without changing runtime behavior.
- It gives Discovery a first real helper home.
- It does not require live zKill, live ESI, durable receipt schema, or Watch cadence decisions.
- It lowers risk before extracting provider-facing zKill and ESI lane helpers.

Alternative if Overseer wants no source movement yet:

```txt
Add a read-only helper ownership conformance preview.
```

That would be safer but less useful, because HS397 already provides the source-trace classification. The extraction packet is the first practical cleanup that follows from this trace.

## 8. Verification / Proof Evidence Expected

For the recommended extraction packet:

```txt
node --check src\main\discovery\[new-helper-module].js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
node --check src\main\workers\manualExpansionWorker.js
node --check scripts\verify-actor-watch.js
node --check scripts\verify-system-radius-collector.js
node --check scripts\verify-manual-expansion-or-relevant-existing-script.js
npm.cmd run verify:actor-watch
npm.cmd run verify:collector
npm.cmd run verify:manual
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:watch-actor-compatibility-wrapper-adapter-fixture
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

Adjust exact verifier names to the packet's touched files. If the packet changes only imports and helper location, verification should prove output parity for actor/system/manual expansion paths and no command/effect metadata drift.

No verification commands were run for this advisory artifact.

