# Engineering / Data Engineering / Security Advisory

## HS298 System/Radius Discovery Ref Identity Advisory

Date: 2026-06-05

Role: Engineering / Data Engineering / Security advisory reviewer

Status: Advisory only. No Dev runway opened.

## 1. Executive Recommendation

Current `system_radius` Discovery ref identity is acceptable for the current safe Atlas phase where Discovery refs are possible leads, Evidence Expansion dedupes by killmail, durable Watch/task results remain parked, and no `watch_result` / relationship-tag semantics depend on exact per-Watch membership.

It is not sufficient as the foundation for future durable Watch/task result readouts where multiple system/radius Watches can share the same center but have different accepted stored scopes. Center-only identity can blur scope membership, run membership, and Watch identity.

Recommendation:

- keep center-only identity for now;
- disclose its limitation in read-only outcome/conformance surfaces;
- do not create durable Watch/task result semantics on top of it;
- if Watch/task results become durable later, define a separate membership/result layer rather than mutating Evidence/EVEidence or overloading `discovered_killmail_refs`.

Smallest future-safe model, if reopened later:

```txt
Discovery ref identity remains possible-lead/dedupe identity.
Watch/task result identity is separate.
Watch/task result items link watch_id/run_id/scope_snapshot to killmail_id/hash.
```

No Dev packet is necessary from HS298 unless Overseer wants a focused read-only diagnostic proof of collision/blur cases.

## 2. Current Source-Backed Identity Map

Durable queued/ref row key:

```txt
killmail_id + killmail_hash + discovered_by_type + discovered_by_id
```

Schema:

- `discovered_killmail_refs.killmail_id`
- `discovered_killmail_refs.killmail_hash`
- `discovered_killmail_refs.discovered_by_type`
- `discovered_killmail_refs.discovered_by_id`
- primary key: `(killmail_id, killmail_hash, discovered_by_type, discovered_by_id)`

Source:

- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`

System/radius Watch collection currently writes:

```txt
discovered_by_type = system_radius
discovered_by_id = input.centerSystemId
source_scope = system:<centerSystemId>:radius:<radiusJumps>
source_system_id = zKill target system for the candidate
first_seen_run_id = collection run ID
last_seen_run_id = latest collection run ID for same keyed row
```

Source:

- `src/main/workers/systemRadiusCollector.js`
- `src/main/db/evidenceRepository.js`

HS296 changed execution authority, not Discovery ref identity:

- system/radius Watch execution now passes accepted stored `included_system_ids` as `acceptedSystemIds`;
- planner uses accepted IDs as exact execution authority when supplied;
- center/radius remain provenance/explanation;
- direct/manual `system.radius.watch` remains center/radius planner behavior when accepted IDs are absent;
- no Discovery ref identity changes were made.

Source:

- `src/main/watchlist/watchExecutor.js`
- `src/main/workers/systemRadiusPlanner.js`
- `src/main/workers/systemRadiusCollector.js`
- `workspace/OverseerHS297-hs296-watch-scope-authority-execution-correction-review.md`
- `docs/features/watch-scope-authority.md`

## 3. What Fields Are Present Today

Present in `discovered_killmail_refs`:

- killmail ID and hash;
- `discovered_by_type`;
- `discovered_by_id`;
- `source_scope`;
- `source_system_id`;
- source actor fields for actor paths;
- first/last run IDs;
- queue status and timing;
- priority;
- preview JSON.

Present outside the ref row:

- `fetch_runs.watch_type`;
- `fetch_runs.watch_id`;
- `fetch_runs.started_at` / `finished_at`;
- API logs by run;
- warnings by run;
- Evidence rows and ingestion audits after expansion;
- Watch rows with stored accepted `included_system_ids`.

Absent from the ref identity:

- radius;
- Watch row ID;
- accepted stored included system set identity;
- accepted scope fingerprint;
- execution scope source;
- run/window identity as part of the ref key;
- result/readout identity.

## 4. Collision / Blur Cases

### Case A: Same Center, Different Radius

Two Watches can share center system `30000001`:

```txt
Watch 1: center 30000001, radius 1, accepted systems [A, B]
Watch 2: center 30000001, radius 2, accepted systems [A, B, C, D]
```

Current Watch Discovery ref identity for both:

```txt
system_radius:30000001
```

Risk:

- refs discovered by either Watch share the same queue identity;
- pending refs can be drained by later collection for the same center;
- the ref row cannot identify which accepted Watch scope originally found or selected it.

### Case B: Same Center, Same Radius, Different Exclusions / Accepted Scope

Two accepted scopes can differ even when center/radius text is the same:

```txt
Watch 1 accepted [A, B, C]
Watch 2 accepted [A, C]
```

Current identity still only sees:

```txt
system_radius:<center>
```

Risk:

- center/radius provenance is not enough to reconstruct accepted scope membership;
- `source_scope` cannot safely stand in for stored scope authority.

### Case C: Same Killmail Found By Two Accepted Watch Scopes

Because the primary key excludes Watch ID and scope identity, the same killmail/hash under the same center-oriented `system_radius` identity upserts the existing row.

Source behavior:

- conflict updates `last_seen_run_id`, `last_seen_at`, priority, preview JSON, and status logic;
- it does not create a second row for the second Watch scope.

Risk:

- exact many-to-many membership history is not preserved in Discovery refs.

### Case D: Pending Ref Drain

`pendingDiscoveryRefs` selects pending/failed rows by:

```txt
discovered_by_type
discovered_by_id
```

For Watch system/radius, that means center-only.

Risk:

- one Watch for a center can drain pending refs that originated from another accepted scope for the same center.

This may be acceptable for current provider efficiency and dedupe, but not as exact result membership.

## 5. Durable Versus Derivable Provenance

Durably available:

- center-level queue identity;
- first/last run IDs on the ref row;
- `source_system_id` per candidate;
- latest run provenance;
- `fetch_runs.watch_type/watch_id`;
- Watch row stored accepted scope;
- ESI Evidence and ingestion audits after expansion.

Derivable with limitations:

- a run can be inspected through `fetch_runs`, API logs, warnings, and refs first/last seen in that run;
- a Watch's stored accepted scope can be read from `system_watches`;
- a candidate source system can show which zKill target produced a ref.

Not safely derivable:

- full history of all Watch scopes that saw the same ref;
- exact per-Watch membership when multiple same-center Watches overlap;
- accepted stored scope fingerprint for the ref row;
- exact result item membership for future durable `watch_result_items`.

Conclusion:

- `fetch_runs` helps with run provenance but does not fix the center-only ref identity if future result semantics require many-to-many membership.

## 6. Manual System/Radius Discovery Difference

Manual Discovery differs from Watch system/radius Discovery:

Manual system:

```txt
discovered_by_type = manual_system
discovered_by_id = <centerSystemId>
```

Manual radius:

```txt
discovered_by_type = manual_radius
discovered_by_id = <centerSystemId>:radius:<radiusJumps>
```

Watch system/radius:

```txt
discovered_by_type = system_radius
discovered_by_id = <centerSystemId>
```

Source:

- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/workers/systemRadiusCollector.js`

Implication:

- manual radius identity includes radius in `discovered_by_id`;
- Watch system/radius identity does not include radius, Watch ID, or stored scope.

## 7. Current Safety Assessment

Center-only `system_radius` identity is safe enough for current local Discovery/Evidence behavior because:

- Discovery refs remain possible leads, not Evidence/EVEidence;
- ESI Evidence Expansion dedupes by killmail and skips cached records;
- current queue behavior can intentionally collapse same-center pending work;
- durable Watch/task results remain parked;
- no relationship tags or result artifacts point at these refs as exact membership truth.

Current center-only identity is unsafe for future durable Watch/task result semantics because:

- multiple accepted scopes can share a center;
- accepted stored scope is now execution authority after HS296;
- ref identity does not include stored scope authority;
- a single ref row can be touched by multiple runs/scopes;
- `last_seen_run_id` is not full membership history;
- future result readouts need to answer "what did this Watch/scope/run find?" without ambiguity.

## 8. Future Watch / Task Result Readiness

Not ready:

- durable `watch_result`;
- durable `watch_result_items`;
- relationship tags;
- result semantics built directly on `discovered_killmail_refs` current key;
- Evidence/EVEidence mutation to carry Watch meaning.

Ready only as read-only/posture:

- disclose current center-only queue identity;
- show latest run/ref/evidence counts;
- compare stored Watch scope to queue identity;
- warn when multiple system/radius Watches share the same center;
- show that result semantics remain parked.

Before durable Watch/task results:

- define result identity;
- define item membership;
- decide whether result item membership references Discovery refs, killmails, run IDs, or all three;
- decide whether system/radius queue identity remains broad center-level dedupe or becomes scope-aware.

## 9. Smallest Future-Safe Identity Model

Do not overload Evidence/EVEidence.

Do not make `activity_events.discovered_by_type/id` carry Watch result meaning.

Preferred future-safe model:

```txt
discovered_killmail_refs
  remains possible-lead queue/dedupe/provenance identity

watch_result or outcome_readout
  identifies Watch/task/run/window/scope snapshot

watch_result_items or outcome_items
  links result identity to killmail_id/hash and/or run_id/ref basis
```

Minimum item fields if accepted later:

- result/outcome ID;
- Watch row ID or task origin ID;
- run ID;
- scope snapshot or scope fingerprint;
- killmail ID;
- killmail hash where available;
- source system ID;
- ref basis status: discovered, selected, expanded, cached, failed, capped;
- evidence basis if expanded.

Alternative if schema redesign is chosen later:

- change or extend `system_radius` Discovery ref identity to include Watch ID or accepted scope fingerprint.

Risk of that alternative:

- it may reduce useful center-level dedupe/drain behavior and create more duplicate queue rows unless deliberately designed.

## 10. Suggested Smallest Next Step

No Dev packet is required from HS298.

If Overseer wants further proof before future design, the smallest safe Dev packet would be read-only:

```txt
Add or refine a diagnostic that reports same-center system/radius Watch collisions and shows which current refs are center-only shared.
```

It must not:

- mutate Discovery refs;
- change schema;
- create Watch/task results;
- write relationship tags;
- dispatch Watch execution;
- call providers;
- mutate Evidence/EVEidence;
- open UI work.

Recommended disposition for now:

```txt
keep center-only and disclose limitation
```

Escalate to schema/identity design only when durable Watch/task results are actually selected.

## 11. Parked Items

- Discovery ref identity redesign;
- schema migration;
- durable `watch_result`;
- durable `watch_result_items`;
- relationship tags;
- relationship truth;
- provider movement or live testing;
- Watch execution changes;
- queue/dispatcher/Bucket machinery;
- Evidence/EVEidence mutation;
- UI/renderer work;
- runtime enforcement or command blocking;
- support artifacts;
- fourth lane / fast lane.

## 12. Human / Overseer Decisions Needed

1. Is center-level queue dedupe/drain desirable as current behavior until durable result semantics open?
2. Should future Watch/task results preserve exact per-run membership, per-Watch-window membership, or per-generated-report membership?
3. Should future result items point at Discovery refs, ESI-expanded killmails, run IDs, or a combined basis?
4. If future scope-aware identity is needed, should it live in a new result-item layer or in `discovered_killmail_refs` identity?
5. Should a read-only collision diagnostic be opened before any schema/result design?

## Acceptance Check

- Advisory only: yes.
- No implementation or Dev runway: yes.
- Current durable identity key identified: yes.
- Current system/radius fields and absent fields identified: yes.
- HS296 stored-scope effect considered: yes.
- Manual versus Watch Discovery difference identified: yes.
- Current safety and future-readiness separated: yes.
- Smallest future-safe model suggested without authorizing schema: yes.
- Parked items preserved: yes.
