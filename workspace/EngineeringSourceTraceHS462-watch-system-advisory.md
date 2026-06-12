# EngineeringSourceTraceHS462 - Watch System Advisory

Status: advisory / discussion-flattened model  
Date: 2026-06-12  
Role: Engineering / Source Trace  
Milestone: Atlas Storage And Runtime Hardening  
Current project state: HS461 accepted by HS462; Human / Overseer decision point  

## 1. Purpose

This artifact flattens the current Human/Engineering discussion into Overseer-facing language for the Watch system model.

It is not a Dev runway, not implementation authorization, and not a schema proposal. It should be source-tested later against current Watch, Discovery, bucket, dispatcher, receipt, and Evidence/EVEidence code before adoption.

Core question:

What should Watch mean, what should a Watch run emit, what should Discovery return, and where should task/result memory live without mutating Evidence/EVEidence?

## 2. Current Working Model

Atlas should prefer recoverable, repeatable motion over perfect internal tracking.

The clean primitive is:

```txt
Human Watch intent
-> accepted stored scope
-> due Watch emits run stub
-> eligible Watch work bucket
-> Discovery provider-facing acquisition/recovery
-> settled factual receipt
-> Watch cadence/accounting interpretation
-> later Observation inbox/query
```

Watch schedules and accounts. Discovery performs provider-facing acquisition and recovery. Evidence/EVEidence remains landed ESI killmail memory. Provenance links the chain.

## 3. What Is A Watch?

A Watch is a durable, Human-authored scheduled intent.

For system/radius Watch, it should represent:

- accepted center system
- accepted included system IDs
- radius/scope basis
- lookback window
- cadence
- caps/limits
- active/armed state
- last run / next eligibility state

Watch owns why this scope should be checked and when it is due. Watch should not own provider acquisition, zKill candidate recovery, ESI-backed expansion, Evidence/EVEidence creation, Hydration, Observation, or Assessment.

## 4. What Is A Watch Run?

A Watch run is one scheduled emission of a Watch's accepted intent.

It represents:

- this Watch
- this accepted scope
- this lookback/window
- this due moment
- this run identity

The Watch run is the accounting unit for "what did this Watch ask Discovery to check this time?"

It is not Evidence/EVEidence, not a provider call, and not a report.

## 5. What Is A Watch Work Bucket?

A Watch work bucket is the eligible waiting area for due Watch work.

It should contain work that Watch has decided is due, but that Discovery/dispatcher has not fully settled yet.

The bucket should stay simple and recoverable:

- eligible work waits there
- Discovery or dispatcher-owned pickup can claim/release it
- restart can safely remanifest or skip already-handled pieces
- duplicate candidate refs do not become duplicate Evidence/EVEidence
- bucket population can continue while External I/O is closed, if policy allows

Watch should not micromanage Discovery once work is emitted.

## 6. What Is The Emitted Run Stub?

The emitted run stub is the bounded handoff from Watch to Discovery.

Likely conceptual fields:

- `watch_id`
- `watch_run_id`
- accepted system IDs
- center/radius basis
- lookback window
- caps
- emitted time
- scope provenance
- source intent: Watch/system-radius

The stub says: "Discovery, check this accepted scope/window under these limits."

The stub is not Evidence/EVEidence and should not be treated as provider execution by itself.

## 7. What Receipt Does Watch Need Back From Discovery?

Watch needs a settled factual receipt, not every internal Discovery step.

The receipt should answer:

- was the emitted work handled to a settled posture?
- what posture did it settle into?
- were refs found?
- were no refs found?
- was the work capped?
- was provider access deferred?
- was work held because External I/O was closed?
- did it fail retryably or terminally?
- are there recoverable Discovery gaps?
- what provider timing facts matter, if any?

Discovery may include provider route facts such as `retry_after_until` or `next_provider_eligible_at`.

Discovery must not tell Watch what cadence decision to make.

## 8. Receipt State Interpretation

Watch interprets Discovery receipts against Watch state.

- `refs_found`: the acquisition ask may be considered settled for this run, if policy says candidate refs satisfy Watch.
- `no_refs_found`: absence is a factual settled result.
- `capped`: Watch can record capped posture and decide whether cadence advances or operator attention is needed.
- `provider_deferred`: Watch can record factual provider defer posture; Discovery owns provider recovery facts.
- `held_by_external_io`: Discovery did not attempt provider movement because External I/O was closed. Work remains eligible/held for later pickup. This is not a provider failure and not Evidence/EVEidence outcome.
- `failed_retryable`: Watch may avoid cadence advance or mark the run as needing retry/backoff, depending on Watch policy.
- `failed_terminal`: Watch may record failed posture and require operator/system policy handling.
- `partial_recoverable`: Watch can stop waiting on that emitted item while Discovery retains recovery basis internally.

Important boundary:

External I/O closed is a global motion gate. Discovery should rest when the gate is closed rather than repeatedly throwing packets at a closed gate. Buckets may populate, but provider packets should not be dispatched while the gate is closed.

Discovery can say: "provider route is not safely usable until X." Watch decides what that means for cadence, backoff, completion, armed state, and next eligibility.

## 9. What Watch Does After Receipt

After a settled Discovery receipt, Watch owns the scheduler/accounting interpretation:

- whether the receipt satisfies the scheduled run
- whether cadence advances
- whether backoff applies
- whether the Watch remains armed
- when the Watch should next be eligible
- how last run/current time/configured cadence/task status affect scheduling

Discovery should not decide these.

## 10. What Must Not Be Stored On Evidence/EVEidence

Evidence/EVEidence should not be mutated to carry Watch task identity as if it were truth about the killmail.

Do not store on Evidence/EVEidence as primary meaning:

- Watch run completion state
- Watch cadence state
- inbox state
- "this killmail belongs to Watch X" as truth mutation
- task success/failure
- Discovery retry/defer state
- Observation interpretation
- Assessment judgment

The safer model is relational/provenance:

```txt
watch_run_id
-> candidate refs
-> killmail_id/hash
-> landed Evidence/EVEidence
```

Both zKill candidate refs and ESI killmail Evidence/EVEidence are anchored by `killmail_id` and hash, so later relationships can be derived without making Evidence carry Watch scheduler memory.

## 11. Inbox / Working Memory Lifecycle

During the hot/inbox window, richer working memory may be useful:

- Watch run ID
- accepted scope/window
- Discovery receipt posture
- candidate refs found
- caps/defer/failure posture
- links derivable to any later Evidence/EVEidence through `killmail_id`/hash
- enough provenance to explain why the item is in the inbox

After the inbox window, Watch can collapse back to primitive scheduling state:

- `last_run_at`
- last settled/success posture as policy requires
- next eligibility or cadence basis
- active/armed state

The longer-term relationship/history can live through provenance and queryable linkage, not bulky Watch state.

Engineering rule:

```txt
Watch stores scheduling state.
Discovery stores acquisition memory.
Evidence/EVEidence stores landed truth.
Provenance links them.
Observation queries across them.
```

## 12. Old Collector Behavior Now Out Of Lane

Old mixed collector behavior should not define the future Watch model:

- Watch directly acquiring zKill refs
- Watch directly driving ESI-backed expansion
- Watch owning candidate-ref recovery
- Watch deciding provider movement details
- collector summary being treated as durable doctrine
- Evidence/EVEidence landing being treated as Watch completion
- internal expansion queue details leaking as the Watch contract
- old `collectActorWatch(...)` shape defining Discovery ownership

Some raw helpers may remain reusable. Ownership should not be inherited blindly from legacy collector shape.

## 13. Likely Future Proof / Migration Surfaces

Future proof/migration likely needs source testing around:

- Watch due check to emitted run stub
- Watch work bucket persistence/recovery
- Discovery pickup of Watch stubs
- system/radius packetization from accepted included system IDs
- zKill candidate acquisition receipt per Watch run
- candidate ref dedupe and idempotent replay
- External I/O hold posture without provider attempts
- settled Discovery receipt projection back to Watch
- Watch cadence interpretation from receipt
- query path: "what did this Watch run find?"
- old collector script/verifier migration away from mixed ownership
- stale compatibility readouts that still describe old collector paths

HS456-specific migration surfaces remain:

- active verifiers still importing `collectActorWatch(...)`
- live actor Watch runner
- compatibility wrapper readouts with stale or legacy runtime assumptions
- old summary-field assertions that preserve mixed collector assumptions

## 14. Smallest Later Dev Packet

Smallest later Dev packet, if Overseer opens one:

Prove a no-provider Watch-run stub projection for system/radius Watch.

Candidate acceptance shape:

- reads or fixtures a stored Watch
- proves accepted included system IDs are the execution scope
- creates or previews the run stub shape
- includes `watch_id`, `watch_run_id`, accepted scope, window, caps, and provenance
- does not call zKill or ESI
- does not dispatch provider packets
- does not write Evidence/EVEidence
- does not invoke old collectors
- does not decide Discovery outcome
- does not implement dispatcher behavior
- does not advance Watch cadence

This would source-test the boundary before building buckets, live movement, or durable generic receipt machinery.

## 15. Open Questions For Overseer

- Is "refs found" sufficient for Watch acquisition-settled posture, or must every accepted system packet settle?
- Should Watch emit work into a durable bucket while External I/O is closed, or only mark due work as eligible until the gate opens?
- How long should the hot/inbox window preserve richer run/result memory?
- Where should `watch_run_id -> candidate refs` relationship live if not on Evidence/EVEidence?
- Should Watch record `last_run_at` on emitted stub, settled receipt, or only policy-accepted completion?
- What receipt states should advance cadence in V1?

## 16. Verification / Evidence Used

This advisory was shaped from Human/Engineering discussion plus the current accepted workspace state:

- `workspace/current.md`
- `workspace/overview.md`
- `workspace/EngineeringTraceHS456-collect-actor-watch-remaining-caller-retirement-readiness.md`
- HS457 settled-posture reporting rule as recorded in `workspace/current.md`

Commands used:

```txt
Get-Content workspace/current.md | Select-Object -First 120
Get-Content workspace/overview.md | Select-Object -First 80
Get-Content workspace/EngineeringTraceHS456-collect-actor-watch-remaining-caller-retirement-readiness.md | Select-Object -First 230
```

No code was implemented. No runtime behavior, schema, Watch rows, Discovery rows, Evidence/EVEidence, Hydration, Observation, Assessment, provider calls, dispatcher/queue/lease behavior, UI, source terms, or protected-word files were changed.

## 17. Parked Items

- Durable Watch work bucket design.
- Durable generic Discovery task/receipt schema.
- Dispatcher implementation.
- Live provider movement.
- Watch cadence mutation behavior.
- Evidence/EVEidence writer changes.
- Observation inbox/report implementation.
- `collectActorWatch(...)` retirement.
- System/radius Watch collector replacement.
- UI behavior.
