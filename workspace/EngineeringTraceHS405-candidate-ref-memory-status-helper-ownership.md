# EngineeringTraceHS405 - Candidate Ref Memory / Status Helper Ownership

## 1. Executive Recommendation

Atlas should keep `discovered_killmail_refs` as candidate-ref memory only. It is useful durable acquisition memory, but it is not Discovery task/packet memory, not Watch completion authority, and not Evidence/EVEidence.

The current repository methods are reusable storage primitives, but the policy for when to read, write, select, mark expanded, mark cached, or mark failed is still embedded in mixed runtime orchestration:

- actor Watch collector
- system/radius Watch collector
- manual discovery
- manual expansion

Smallest safe next Dev packet, if Overseer opens one: extract only the pure pending-ref rehydration helpers from the old collector files into a Discovery-owned helper module, likely:

```txt
src/main/discovery/candidateRefMemory.js
```

First exports could be:

```txt
pendingActorDiscovery(...)
pendingSystemRadiusDiscovery(...)
```

Do not move broad status mutation policy yet. Selected/expanded/cached/failed transitions sit across Discovery ESI-backed expansion intake, Evidence/EVEidence writer landing, and legacy/manual compatibility. They need either a small fixture proof or the next ESI-backed expansion/package boundary trace before becoming a central status engine.

No Dev runway is created by this advisory.

## 2. Helper-By-Helper Ownership Table

| Helper / Field | Defined In | Current Behavior | Current Callers | Side Effects | Recommended Owner | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| `discovered_killmail_refs` table | `src/main/db/schema.sql` | Stores possible zKill candidate refs by `killmail_id`, hash, source identity, source scope, status, timestamps, priority, preview. | Repository, reports, readouts, verifiers. | Durable candidate-ref memory. | Discovery candidate-ref memory, stored by DB repository. | Keep as candidate-ref memory, not task/packet memory. |
| `status` | `src/main/db/schema.sql` | Accepted values: `pending`, `expanded`, `cached`, `failed`, `superseded`. | Repository methods, reports, manual expansion, queue selection. | Drives local retry/skip/readout posture. | Discovery candidate-ref memory / ESI expansion intake. | Reuse cautiously; do not treat as Watch task completion. |
| `selected_for_expansion_at` | `src/main/db/schema.sql` / repository update | Timestamp only; records selected attempt posture. Does not change `status`. | Actor/system collectors, manual expansion. | Writes candidate row timestamp. | Discovery ESI-backed expansion intake. | Reuse; consider helper policy later. |
| `expanded_at` | schema / `markDiscoveryRefsExpanded(...)` | Records successful ESI-backed expansion status. | Actor/system collectors, manual expansion. | Sets `status = 'expanded'`, clears `last_error`. | Discovery ESI lane after Evidence/EVEidence landing succeeds. | Reuse with strict caller ordering. |
| `failed_at` | schema / `markDiscoveryRefsFailed(...)` | Records failed ESI expansion posture. | Actor/system collectors, manual expansion. | Sets `status = 'failed'`. | Discovery ESI-backed expansion lane. | Reuse; failure language needs policy before live redirect. |
| `failure_count` | schema / `markDiscoveryRefsFailed(...)` | Increments on failed expansion mark. | Actor/system collectors, manual expansion. | Durable retry signal. | Discovery candidate-ref memory / retry posture. | Reuse as ref-level retry signal, not task attempt log. |
| `last_error` | schema / `markDiscoveryRefsFailed(...)` | Stores latest expansion error message; cleared by `markDiscoveryRefsExpanded(...)`. | Actor/system collectors, manual expansion; queue reports display it. | Durable diagnostic text. | Discovery candidate-ref memory with support/logging caution. | Reuse with existing redaction/truncation context; do not overclaim. |
| `upsertDiscoveredKillmailRefs(...)` | `src/main/db/evidenceRepository.js` | Inserts valid non-duplicate/non-malformed candidate refs; sets `pending` unless local Evidence exists, then `cached`; preserves existing `expanded`, `cached`, and `failed` status on conflict. | Actor collector, system collector, manual discovery, fixtures. | Writes `discovered_killmail_refs`; reads `killmails` through `hasKillmail(...)`. | Discovery zKill candidate-lead acquisition memory, implemented as repository primitive. | Reuse mostly as-is. Future Discovery caller should own policy; repository can keep SQL primitive. |
| `pendingDiscoveryRefs(...)` | `src/main/db/evidenceRepository.js` | Reads scoped `pending` or `failed` refs, failed first, then priority/time/id. | Actor collector, system collector. | DB read only. | Discovery candidate-ref memory / recovery input. | Reuse as repository primitive; not a task sequencer. |
| `pendingActorDiscovery(...)` | `src/main/workers/actorWatchCollector.js` | Converts pending actor refs into old discovery result shape and skips fresh zKill. | Actor collector only. | No DB write; creates compatibility result. | Discovery candidate-ref memory compatibility helper. | Safe first extraction candidate. |
| `pendingSystemRadiusDiscovery(...)` | `src/main/workers/systemRadiusCollector.js` | Converts pending system/radius refs into old discovery result shape and skips fresh zKill. | System/radius collector only. | No DB write; creates compatibility result. | Discovery candidate-ref memory compatibility helper. | Safe first extraction candidate. |
| `markDiscoveryRefsSelected(...)` | `src/main/db/evidenceRepository.js` | Sets `selected_for_expansion_at` for scoped rows when scope identity is present; falls back to legacy killmail/hash update. | Actor collector, system collector, manual expansion, fixtures. | DB write. | Discovery ESI-backed expansion intake selection posture. | Reuse; future wrapper should prefer scoped identity. |
| `markDiscoveryRefsExpanded(...)` | `src/main/db/evidenceRepository.js` | Sets `status = 'expanded'`, `expanded_at`, clears `last_error`; scoped when possible, legacy otherwise. | Actor collector, system collector, manual expansion, fixtures. | DB write. | Discovery ESI lane after Evidence/EVEidence landing. | Reuse; must remain after successful writer landing. |
| `markDiscoveryRefsCached(...)` | `src/main/db/evidenceRepository.js` | Sets `status = 'cached'` unless already expanded; scoped when possible, legacy otherwise. | Actor collector, system collector, manual expansion, fixtures. | DB write. | Discovery candidate-ref memory / local Evidence cache skip posture. | Reuse; should not imply provider attempt. |
| `markDiscoveryRefsFailed(...)` | `src/main/db/evidenceRepository.js` | For `failed_expansion` warnings or untyped refs, sets `status = 'failed'`, increments `failure_count`, stores `last_error`; scoped when possible, legacy by killmail_id otherwise. | Actor collector, system collector, manual expansion, fixtures. | DB write. | Discovery ESI-backed expansion failure posture. | Reuse cautiously; legacy fallback is a scope-drift risk. |
| `manualExpansionCandidates(...)` | `src/main/workers/manualExpansionWorker.js` | Reads `pending`/`failed` refs by optional source filters or killmail IDs; maps them to expansion candidates. | Manual expansion only; exported for tests. | DB read only. | Manual compatibility now; future Discovery ESI intake selection. | Keep for compatibility until ESI boundary is traced. |
| `selectExpansionCandidates(...)` | `src/main/discovery/expansionQueueSelection.js` | Selects uncached refs under cap, marks local cached/cap skipped/selected in memory. | Actor collector, system collector. | Reads local Evidence cache; no writes. | Discovery ESI-backed expansion intake. | Already correctly housed by HS399. |
| `markFailedExpansionCandidates(...)` | `src/main/discovery/expansionQueueSelection.js` | Applies failed-expansion warning messages onto in-memory candidates. | Actor collector, system collector, manual expansion. | No DB write. | Discovery ESI-backed expansion intake. | Already correctly housed by HS399; status write remains repository call. |
| `queueScopeIdentity(...)` | `src/main/db/evidenceRepository.js` | Resolves scoped identity from ref or caller scope for status updates. | Repository status methods. | None directly. | Repository primitive supporting Discovery candidate memory. | Keep; important scope-isolation helper. |

## 3. Current Callers And Current Side Effects

### Actor Watch

`src/main/workers/actorWatchCollector.js` currently:

- reads pending refs with `repository.pendingDiscoveryRefs({ discoveredByType: 'actor', discoveredById: actor_id, limit })`
- if pending refs exist, calls `pendingActorDiscovery(...)` and skips fresh zKill acquisition
- otherwise calls Discovery-owned `discoverActorRefs(...)` and writes new candidates through `repository.upsertDiscoveredKillmailRefs(...)`
- selects expansion candidates with `selectExpansionCandidates(...)`
- writes `selected_for_expansion_at` via `markDiscoveryRefsSelected(...)`
- calls ESI package building
- maps failed expansion warnings to candidates through `markFailedExpansionCandidates(...)`
- writes failed status through `markDiscoveryRefsFailed(...)`
- persists Evidence/EVEidence through `persistEvidencePackage(...)`
- writes expanded/cached status through `markDiscoveryRefsExpanded(...)` and `markDiscoveryRefsCached(...)`

Actor side effects include `fetch_runs`, API logs if provider clients use repository-backed `HttpClient`, candidate-ref writes/status updates, Evidence/EVEidence writes, and warnings.

### System / Radius Watch

`src/main/workers/systemRadiusCollector.js` mirrors actor behavior:

- reads pending scoped refs for `system_radius`
- drains pending refs through `pendingSystemRadiusDiscovery(...)`
- otherwise calls Discovery-owned `discoverSystemRefs(...)`
- writes candidate refs through `upsertDiscoveredKillmailRefs(...)`
- selects/marks selected/failed/expanded/cached around ESI expansion and Evidence landing

System/radius side effects match actor side effects, with system scope fields.

### Manual Discovery

`src/main/workers/manualDiscoveryWorker.js`:

- calls Discovery-owned zKill acquisition helpers
- marks local cached candidates in memory through `markCachedCandidates(...)`
- writes candidate refs through `upsertDiscoveredKillmailRefs(...)`
- writes warnings and finalizes a fetch run
- does not call ESI and does not create Evidence/EVEidence

Manual discovery is the clearest current zKill-only producer of candidate-ref memory.

### Manual Expansion

`src/main/workers/manualExpansionWorker.js`:

- reads `pending`/`failed` candidate refs through `manualExpansionCandidates(...)`
- marks selected refs through `markDiscoveryRefsSelected(...)`
- calls ESI package building
- marks failed refs through `markDiscoveryRefsFailed(...)`
- persists Evidence/EVEidence
- marks expanded and cached refs

Manual expansion needs the current status behavior for product compatibility: failed refs stay retryable, expanded refs stop being selectable, cached refs skip ESI, and pending refs can remain waiting.

### Read-only reports / readouts

Adjacent read-only consumers include:

- `src/main/reports/queueReport.js`
- `src/main/reports/runReport.js`
- `src/main/reports/collectionProvenance.js`
- `src/main/reports/corpusHealthReport.js`
- `src/main/services/queueSelectionService.js`
- `src/main/support/runtimeBoundaryStatus.js`

These read status fields for queue/provenance/support posture. They do not own mutation policy.

## 4. Candidate-Ref Memory / Status Lifecycle Today

1. zKill candidate acquisition returns in-memory candidates.
   HS403 moved actor/system zKill acquisition helpers into `src/main/discovery/zkillCandidateAcquisition.js`.

2. Candidate refs are persisted.
   `upsertDiscoveredKillmailRefs(...)` writes only valid refs with `killmail_id` and hash, skipping malformed and duplicate candidates. It writes `pending` unless `hasKillmail(...)` finds local Evidence, in which case it writes `cached`.

3. Existing durable states are mostly preserved on rediscovery.
   On conflict, the upsert preserves `expanded`, `cached`, and `failed` rather than resetting them to pending. It updates `last_seen_run_id`, `last_seen_at`, priority, and preview.

4. Pending/failed refs can be drained before fresh zKill.
   Actor/system collectors read local `pending`/`failed` refs first. If found, they skip zKill and turn those rows into an old discovery result shape through `pendingActorDiscovery(...)` or `pendingSystemRadiusDiscovery(...)`.

5. Expansion selection happens in memory.
   `selectExpansionCandidates(...)` picks uncached candidates under cap and annotates cached/cap-skipped/selected posture without writing.

6. Selection timestamp is written.
   `markDiscoveryRefsSelected(...)` records `selected_for_expansion_at` but does not change `status`.

7. ESI-backed expansion runs.
   Current actor/system/manual expansion paths use `buildEvidencePackageFromRefs(...)`; this is still the next larger boundary to trace.

8. Failed expansions are marked.
   `markFailedExpansionCandidates(...)` maps failed warnings onto in-memory candidates; `markDiscoveryRefsFailed(...)` writes status, timestamp, failure count, and latest error.

9. Evidence/EVEidence is persisted.
   `persistEvidencePackage(...)` is the Evidence/EVEidence writer landing boundary.

10. Candidate refs are marked expanded or cached.
   Successful expanded killmails become `expanded`. Refs skipped because local Evidence exists become `cached`.

This lifecycle is useful and mostly coherent, but it is not a task lifecycle. It does not prove that every accepted Watch packet attempted or completed.

## 5. Reuse / Replace / Rename / Park Recommendations

Reuse mostly as-is:

- `upsertDiscoveredKillmailRefs(...)` as a repository primitive.
- `pendingDiscoveryRefs(...)` as a repository primitive.
- `markDiscoveryRefsSelected(...)`.
- `markDiscoveryRefsExpanded(...)`.
- `markDiscoveryRefsCached(...)`.
- `markDiscoveryRefsFailed(...)`.
- `queueScopeIdentity(...)`.

Extract/relocate first:

- `pendingActorDiscovery(...)`.
- `pendingSystemRadiusDiscovery(...)`.

Keep for compatibility until ESI boundary trace:

- `manualExpansionCandidates(...)`.
- direct status-call choreography inside `expandManualRefs(...)`.
- direct status-call choreography inside actor/system collectors.

Do not rename now:

- `discovered_killmail_refs`.
- `status`.
- `expanded`.
- `cached`.
- `failed`.
- `selected_for_expansion_at`.

Park:

- durable Discovery task/packet schema.
- a broad provider work queue.
- dispatcher/lease/sequencer work.
- status vocabulary replacement.
- collector retirement.
- default `actor.watch` redirect.

## 6. Boundary Risks, Especially Task-Memory Drift

1. `discovered_killmail_refs` can look like a task queue, but it is not one.
   It has status, priority, retry-ish counters, and timestamps. That is enough to recover candidate work, but not enough to prove per-Watch packet completion, accepted scope coverage, provider deferral, External I/O hold, cap outcome, or caller receipt.

2. `pendingDiscoveryRefs(...)` drains by source identity, not by a Discovery task/packet identity.
   For actor this is tolerable. For system/radius, it does not prove every accepted included system packet has reached a declared outcome.

3. `failed` means ESI-backed expansion failure in current paths.
   It should not be read as zKill acquisition failure, Watch failure, or terminal Discovery task failure without additional basis.

4. `cached` means local Evidence already exists.
   It is a useful skip posture, not a provider attempt and not a new Evidence write.

5. `selected_for_expansion_at` is an attempt signal, not completion.
   It records that a candidate was selected for expansion. It does not prove ESI was called or Evidence landed.

6. Legacy fallback status updates can widen scope.
   Repository methods have scoped updates when identity exists, but fall back to killmail/hash or killmail-only legacy updates. `verify-queue-scope-isolation.js` proves scoped calls behave correctly, but future Discovery-owned callers should avoid relying on fallback updates.

7. Upsert preserves `failed`.
   This supports retry visibility, but it also means rediscovery does not reset a failed candidate. That is probably correct for memory, but a future retry policy must decide what re-seeing a failed ref should mean.

8. `superseded` exists in schema/report vocabulary but no source mutation path was found in this trace.
   It should remain parked unless a future policy explicitly defines it.

9. Reports read candidate-ref states as support/provenance.
   Queue/run/corpus reports disclose boundaries, but they must not become canonical receipt authority.

## 7. Gaps Before `actor.watch` Redirect Or Collector Retirement

Before redirect or retirement, Atlas still needs:

- Discovery-owned pending-ref rehydration helpers outside collector files.
- A clear Discovery-owned status policy for selected/expanded/cached/failed transitions.
- A decision that status updates should prefer scoped identity and avoid legacy fallback in new paths.
- ESI-backed expansion/package helper boundary trace.
- A safe handoff order: candidate selected -> ESI expansion attempted -> Evidence writer landing succeeds -> candidate expanded/cached/failed.
- A receipt/cadence handoff to Watch that does not use `discovered_killmail_refs.status` as Watch completion.
- Explicit handling for provider deferral, External I/O hold, acquisition cap, and no-refs outcomes outside candidate rows.
- Verifier coverage that actor/system/manual behavior remains unchanged after any helper-home move.

## 8. Smallest Next Dev Packet Recommendation

Smallest safe packet:

```txt
Discovery candidate-ref pending rehydration helper extraction
```

Suggested scope:

- Add `src/main/discovery/candidateRefMemory.js`.
- Move `pendingActorDiscovery(...)` and `pendingSystemRadiusDiscovery(...)` into it.
- Update actor/system collectors to import those helpers.
- Preserve output shapes exactly.
- Do not move repository methods yet.
- Do not change status mutation behavior.
- Do not change manual expansion.
- Do not add schema, dispatcher, receipt, task/packet memory, provider movement, or runtime redirect.

Why this slice:

- It removes the next obvious Discovery helper from collector ownership.
- It is pure shape conversion over already-read refs.
- It does not touch write policy.
- It keeps candidate-ref memory separate from task/packet memory.

Not recommended yet:

```txt
Broad candidate-ref status service extraction
```

Reason: selected/expanded/cached/failed transitions are tied to the still-mixed ESI expansion/package/writer boundary. Extracting a status service before that trace risks moving mixed choreography into a nicer-named module without actually clarifying ownership.

## 9. Verification / Proof Evidence Expected

For the pending rehydration extraction packet:

```txt
node --check src\main\discovery\candidateRefMemory.js
node --check src\main\workers\actorWatchCollector.js
node --check src\main\workers\systemRadiusCollector.js
rg -n "pendingActorDiscovery|pendingSystemRadiusDiscovery|candidateRefMemory" src\main\workers src\main\discovery
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

Expected proof:

- Pending actor/system rehydration helpers live under Discovery ownership.
- Actor/system collector behavior remains unchanged.
- Existing candidate-ref status mutation behavior remains unchanged.
- Manual discovery and manual expansion compatibility remain intact.
- Queue scope isolation still proves scoped status updates do not cross source identities.
- No provider calls, DB schema changes, runtime redirects, collector retirement, task/packet persistence, dispatcher behavior, Evidence/EVEidence write behavior changes, Hydration writes, support artifacts, UI, runtime enforcement, or protected-term changes are introduced.

No implementation verification was run for this advisory artifact.

