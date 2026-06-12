# EngineeringTraceHS409 - ESI-backed Expansion Package Helper Boundary

Status: advisory/source trace only  
Role: Engineering / Source Trace Advisor  
Date: 2026-06-07

## 1. Executive Recommendation

Atlas should not treat `buildEvidencePackageFromRefs(...)` as a clean long-term boundary surface in its current home or current name.

The function is useful and mostly reusable, but it sits in `src/main/workers/killmailIngestionWorker.js` while doing Discovery ESI-backed provider movement, local Evidence cache checks, provider failure classification, normalization, and writer-ready package assembly. That is too much mixed meaning for the future Discovery-owned ESI-backed expansion lane.

Recommended next step: open only a small helper-boundary Dev packet that extracts or wraps `buildEvidencePackageFromRefs(...)` into a Discovery-owned ESI-backed expansion/package helper module, with behavior preserved. Do not change `normalizeKillmail(...)`, `EvidenceRepository.persistEvidencePackage(...)`, ref status semantics, Watch runtime redirect, live provider capability, schema, Hydration, Observation, or collector retirement in the same packet.

`evidencePackageFromExpandedKillmails(...)` should remain available as a no-provider fixture/package builder for Evidence writer proofs. It should not be confused with the live ESI-backed Discovery expansion path.

## 2. Current Expansion / Package Flow

Current live-capable mixed paths:

1. `collectActorWatch(...)`, `collectSystemRadiusWatch(...)`, or `expandManualRefs(...)` select candidate refs.
2. Selected refs are marked with `EvidenceRepository.markDiscoveryRefsSelected(...)`.
3. `buildEvidencePackageFromRefs(...)` receives selected refs, checks `repository.hasKillmail(...)`, calls `esiClient.expandKillmail(...)` for uncached refs, normalizes ESI payloads through `normalizeKillmail(...)`, and returns an Evidence/EVEidence writer-ready package.
4. Caller runs `markFailedExpansionCandidates(...)` and `EvidenceRepository.markDiscoveryRefsFailed(...)` for failed expansion warnings.
5. Caller writes durable Evidence/EVEidence through `EvidenceRepository.persistEvidencePackage(...)`.
6. Caller marks refs expanded or cached through `markDiscoveryRefsExpanded(...)` and `markDiscoveryRefsCached(...)`.
7. Caller finalizes `fetch_runs` and reads `api_request_logs` for zKill/ESI call counts.

Current fixture/no-provider package path:

1. Proofs and reports build injected expanded payload packages through `evidencePackageFromExpandedKillmails(...)`.
2. That function normalizes supplied raw payloads and returns a package.
3. `EvidenceRepository.persistEvidencePackage(...)` performs durable writer landing.

Boundary read:

- zKill candidate refs remain possible leads, not Evidence/EVEidence.
- ESI-backed killmail/detail expansion is Discovery provider movement, not Hydration.
- Evidence/EVEidence begins at durable writer landing, not at selected refs and not at package assembly.
- Watch currently invokes mixed collector paths, but the accepted model says Watch should not own provider movement.

## 3. Function Ownership Table

| Function / helper | Current home | Current behavior | Recommended owner |
| --- | --- | --- | --- |
| `buildEvidencePackageFromRefs(...)` | `src/main/workers/killmailIngestionWorker.js` | Checks local cache, calls ESI, normalizes expanded payloads, creates writer-ready package, classifies capacity/failed expansion warnings | Discovery ESI-backed expansion/package boundary, with Evidence normalizer dependency |
| `evidencePackageFromExpandedKillmails(...)` | `src/main/workers/killmailIngestionWorker.js` | Builds package from already-expanded fixture/raw payloads, no provider call | Evidence package fixture/support helper; not live Discovery movement |
| `normalizeKillmail(...)` | `src/main/normalization/killmailNormalizer.js` | Converts raw ESI killmail payload into killmail, activity, entity, audit, and warning rows | Evidence/EVEidence normalization |
| `EsiClient.expandKillmail(...)` | `src/main/api/esiClient.js` | Validates killmail ID/hash and calls ESI killmail endpoint through `HttpClient` | Low-level Discovery ESI provider client |
| `HttpClient.json(...)` / `HttpClient.log(...)` | `src/main/api/httpClient.js` | Performs HTTP request, retry behavior, error normalization, optional API request logging | Shared provider I/O and support logging utility |
| `EvidenceRepository.persistEvidencePackage(...)` | `src/main/db/evidenceRepository.js` | Transactionally lands killmails, activity events, entities, audits, warnings, and conflict suppression | Evidence/EVEidence writer/memory |
| `selectExpansionCandidates(...)` | `src/main/discovery/expansionQueueSelection.js` | Chooses uncached refs within cap from candidate queue | Discovery selection policy/helper |
| `markFailedExpansionCandidates(...)` | `src/main/discovery/expansionQueueSelection.js` | Maps `failed_expansion` warnings back onto selected queue candidates | Discovery expansion status helper |
| `pendingActorDiscovery(...)` / `pendingSystemRadiusDiscovery(...)` | `src/main/discovery/candidateRefMemory.js` | Rehydrates pending refs into acquisition-like queue output without zKill | Discovery candidate-ref memory helper |
| `collectActorWatch(...)` | `src/main/workers/actorWatchCollector.js` | Mixed Watch planning/run, zKill acquisition, candidate ref persistence, ESI expansion, Evidence write, status updates, run summary | Legacy compatibility / retire candidate |
| `collectSystemRadiusWatch(...)` | `src/main/workers/systemRadiusCollector.js` | Same mixed runtime plus system/radius planning/topology | Legacy compatibility / retire candidate |
| `expandManualRefs(...)` | `src/main/workers/manualExpansionWorker.js` | Manual selected-ref ESI expansion plus Evidence write and status mutation | Transitional manual entry point; should call Discovery-owned ESI helper later |

## 4. Caller And Side-Effect Map

`src/main/workers/actorWatchCollector.js`

- Calls `pendingActorDiscovery(...)` or `discoverActorRefs(...)`.
- Writes candidate refs through `upsertDiscoveredKillmailRefs(...)`.
- Selects refs, marks selected, calls `buildEvidencePackageFromRefs(...)`, persists package, marks expanded/cached/failed, inserts warnings, finalizes `fetch_runs`.
- Mixed boundary: Watch, Discovery zKill acquisition, Discovery ESI expansion, Evidence writer landing, and run posture all occur in one function.

`src/main/workers/systemRadiusCollector.js`

- Same mixed shape as actor Watch, with topology/scope planning added.
- Should not be the first runtime replacement target because accepted included-system scope authority and radius identity remain a larger seam.

`src/main/workers/manualExpansionWorker.js`

- Reads `discovered_killmail_refs` where status is `pending` or `failed`.
- Calls `buildEvidencePackageFromRefs(...)`.
- Persists Evidence/EVEidence and mutates candidate-ref status.
- Cleaner than Watch because there is no zKill acquisition, but it still mixes selected-ref intake, ESI expansion, writer landing, and status mutation.

`src/main/workers/killmailIngestionWorker.js`

- Exports both the ESI-backed ref expansion helper and the no-provider expanded-payload package helper.
- The file name and export grouping preserve older ingestion/worker meaning rather than the emerging Discovery/Evidence split.

`src/main/db/evidenceRepository.js`

- `persistEvidencePackage(...)` is the durable Evidence/EVEidence writer boundary.
- `hasKillmail(...)` is used by Discovery selection/expansion to avoid duplicate provider work.
- `markDiscoveryRefsSelected/Expanded/Cached/Failed(...)` mutate Discovery candidate-ref memory, not Evidence truth.

`src/main/api/esiClient.js` and `src/main/api/httpClient.js`

- ESI expansion uses provider I/O through `EsiClient.expandKillmail(...)`.
- `HttpClient.log(...)` may write `api_request_logs` when a repository/run is supplied.
- This is provider movement/support logging, not Hydration and not Evidence landing.

## 5. Reuse / Wrap / Extract / Preserve / Park

Reuse mostly as-is:

- `normalizeKillmail(...)` as Evidence/EVEidence normalization.
- `EvidenceRepository.persistEvidencePackage(...)` as writer landing; HS389 and HS391 have already hardened/proven mixed conflict behavior.
- `EsiClient.expandKillmail(...)` as low-level provider client.
- `selectExpansionCandidates(...)` and `markFailedExpansionCandidates(...)` as Discovery helpers.

Extract or wrap:

- `buildEvidencePackageFromRefs(...)` should move behind a Discovery-owned module such as `src/main/discovery/esiBackedExpansionPackage.js` or equivalent. First packet should preserve behavior and signatures as much as possible.
- A compatibility export from `killmailIngestionWorker.js` may remain temporarily if needed for tests or existing imports, but new route code should import from the Discovery-owned home.

Preserve:

- `evidencePackageFromExpandedKillmails(...)` should remain a no-provider package builder used by fixture proofs and writer tests.
- Current writer proof commands should keep using injected expanded payloads, not live ESI.
- Existing conflict suppression behavior in `persistEvidencePackage(...)` should remain unchanged.

Park:

- Full semantic rename of `buildEvidencePackageFromRefs(...)`.
- Splitting package assembly into multiple new policies.
- Live provider activation.
- Actor Watch runtime redirect.
- Scheduled Watch redirect.
- System/radius replacement.
- Durable task/packet schema.
- Dispatcher, leases, runtime enforcement, UI, Hydration, Observation, and support artifact changes.

## 6. Boundary Risks

Main risk: the current helper name and home imply "worker ingestion" or "Evidence package" as the owner, but the function actually performs Discovery ESI-backed provider movement. If this remains the future surface, Atlas may preserve the old mixed collector model in cleaner-looking files.

Specific risks:

- `buildEvidencePackageFromRefs(...)` hides an ESI provider call behind package-building language.
- The helper performs local cache skip through `repository.hasKillmail(...)`, which is valid for avoiding duplicate work but should be described as Discovery expansion policy/read, not Evidence writer ownership.
- Provider capacity errors become package warnings with `provider_capacity_deferred`, while failed expansions become `failed_expansion`; status mutation happens outside the helper. That separation is workable, but the contract is implicit.
- `collectActorWatch(...)` and `collectSystemRadiusWatch(...)` still decide too much after receiving a package: failure mapping, writer landing, ref status mutation, run summary, and warnings.
- `manualExpansionWorker.js` may look like the future model because it lacks zKill, but it still directly owns selected-ref ESI movement and Evidence landing.
- `HttpClient` support logging can write `api_request_logs` during ESI expansion. That is acceptable support logging, but it must not be mistaken for Discovery receipt or Evidence/EVEidence.
- Package assembly is not durable Evidence/EVEidence. Only `persistEvidencePackage(...)` lands final memory.

No reviewed source shows ESI-backed expansion being Hydration. Hydration remains separate readability repair.

## 7. Gaps Before `actor.watch` Redirect Or Collector Retirement

Before any actor Watch runtime redirect:

- Discovery needs an explicit ESI-backed expansion/package helper surface outside old worker files.
- The new helper surface needs fixture/no-provider proof with injected `esiClient` and disposable DB or fake repository.
- The proof should show cache skip, successful expansion, provider capacity deferral, failed expansion warning, cancellation passthrough, and malformed payload behavior.
- The proof should show the helper does not write Evidence/EVEidence by itself.
- The proof should show the helper does not mutate `discovered_killmail_refs` status by itself.
- The proof should show writer landing remains `EvidenceRepository.persistEvidencePackage(...)`.
- The proof should show Watch collectors are not invoked.

Before collector retirement:

- Existing actor Watch runtime expectations must be mapped to boundary-owned outputs.
- Discovery zKill candidate acquisition, candidate-ref memory, ESI-backed expansion, Evidence writer landing, and run receipt/handoff need an integrated no-provider route proof.
- System/radius Watch needs separate proof because accepted included-system scope authority is a larger geometry and identity problem than actor Watch.

## 8. Smallest Next Dev Packet Recommendation

Smallest useful Dev packet, if Overseer opens one:

Create a Discovery-owned ESI-backed expansion/package helper boundary while preserving behavior.

Suggested implementation shape:

- Add a new Discovery module for the ESI-backed selected-ref expansion helper.
- Move or wrap the existing `buildEvidencePackageFromRefs(...)` behavior there.
- Keep the same core inputs: selected refs, repository, `esiClient`, run basis, and `discoveredBy`.
- Keep `normalizeKillmail(...)` imported from the Evidence normalization layer.
- Keep `EvidenceRepository.persistEvidencePackage(...)` untouched.
- Keep `evidencePackageFromExpandedKillmails(...)` available for fixture writer proofs.
- Update direct callers only if the packet explicitly allows import rewiring; otherwise add the module and prove it without runtime call-site changes.

Recommended packet style:

```txt
Discovery ESI-backed expansion package helper extraction / wrapper proof
```

This should be a helper-boundary packet, not runtime redirect and not live readiness.

## 9. Verification / Proof Commands Expected For That Packet

Expected focused proof should include a new verifier or an expanded existing verifier that proves:

- no zKill provider calls
- no live ESI provider calls unless an injected fake client is used
- no Watch collector invocation
- no `fetch_runs` mutation unless the proof intentionally uses a disposable DB
- no `discovered_killmail_refs` status mutation inside the helper
- no Evidence/EVEidence write inside the helper
- returned package is compatible with `EvidenceRepository.persistEvidencePackage(...)`
- cache skip increments `already_cached`
- success increments `expanded_count`
- failed ESI expansion produces `failed_expansion`
- provider capacity errors produce `provider_capacity_deferred`
- cancellation/abort errors are rethrown

Useful existing commands to reuse after any packet:

```txt
node --check src\main\workers\killmailIngestionWorker.js
node --check src\main\discovery\expansionQueueSelection.js
npm.cmd run verify:evidence-writer-landing-package-fixture
npm.cmd run verify:discovery-esi-expansion-intake-posture
npm.cmd run verify:discovery-acquisition-to-evidence-handoff-fixture
npm.cmd run verify:watch-actor-compatibility-wrapper-runtime-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If a new helper module is created, add `node --check` for that file and a focused verifier for the helper contract.

## 10. Human / Overseer Decisions Needed

Overseer should decide:

- Whether the next packet is extraction-only or extraction plus caller import rewiring.
- Whether the future helper name should say `esiBackedExpansion`, `selectedRefExpansion`, or `evidencePackage` language. Safer wording is boundary-qualified: "Discovery ESI-backed selected-ref expansion package helper."
- Whether `buildEvidencePackageFromRefs(...)` remains as a temporary compatibility export after extraction.
- Whether manual expansion should be rewired before actor Watch runtime redirect, or remain as a transitional caller.

Human decision may be useful later on naming, but HS409 does not need a product-direction decision. The technical recommendation is clear enough: extract/wrap the helper under Discovery ownership first; leave behavior and runtime posture alone.

## Verification / Evidence Used

Reviewed:

- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS409-esi-backed-expansion-package-helper-boundary-trace-request.md`
- `workspace/OverseerHS408-hs407-discovery-candidate-ref-pending-rehydration-helper-extraction-review.md`
- `workspace/EngineeringTraceHS397-discovery-helper-ownership-source-trace.md`
- `workspace/EngineeringTraceHS405-candidate-ref-memory-status-helper-ownership.md`
- `workspace/OverseerHS380-hs379-discovery-esi-expansion-intake-posture-review.md`
- `workspace/OverseerHS386-hs385-evidence-writer-landing-source-trace-review.md`
- `workspace/OverseerHS388-hs387-evidence-writer-landing-package-fixture-review.md`
- `workspace/OverseerHS390-hs389-evidence-writer-conflict-hardening-review.md`
- `workspace/OverseerHS392-hs391-evidence-writer-mixed-conflict-review.md`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/workers/actorWatchCollector.js`
- `src/main/workers/systemRadiusCollector.js`
- `src/main/workers/manualExpansionWorker.js`
- `src/main/discovery/expansionQueueSelection.js`
- `src/main/discovery/candidateRefMemory.js`
- `src/main/discovery/zkillCandidateAcquisition.js`
- `src/main/normalization/killmailNormalizer.js`
- `src/main/api/esiClient.js`
- `src/main/api/httpClient.js`
- `src/main/db/evidenceRepository.js`
- `src/main/db/schema.sql`

Commands used for source trace:

```txt
rg -n "buildEvidencePackageFromRefs|evidencePackageFromExpandedKillmails|normalizeKillmail|persistEvidencePackage|expandKillmail|markDiscoveryRefsSelected|markDiscoveryRefsExpanded|markDiscoveryRefsCached|markDiscoveryRefsFailed|markFailedExpansionCandidates|selectExpansionCandidates" src\main scripts package.json
rg -n "discovered_killmail_refs|fetch_runs|api_request_logs|killmails|activity_events|ingestion_audits|data_quality_warnings" src\main\db\schema.sql
rg -n "buildEvidencePackageFromRefs|evidencePackageFromExpandedKillmails|expandManualRefs|collectActorWatch|collectSystemRadiusWatch" src\main scripts
```

No code was implemented. No provider/API/live calls were run. No schema, queue, dispatcher, Watch runtime, Evidence write behavior, Hydration, Observation, UI, protected terms, or `workspace/current.md` changes were made.
