# Current State: Storage And Runtime Hardening

Date: 2026-06-01
Status: Current milestone summary

## Purpose

This document consolidates accepted storage/runtime hardening direction that had accumulated in workspace handshakes.

`workspace/current.md` remains the active executable packet. This document is durable orientation for the current Storage And Runtime Hardening milestone.

## Current Focus

Atlas is prioritizing the storage/runtime spine before expanding the product body.

UI and Observation direction now exist as useful pressure tests, but the active priority remains making the underlying system trustworthy for heavy local data, patient acquisition, restart recovery, deletion safety, and provider pacing.

## Accepted Proof Spine 2026-05-31

Atlas has completed a sequence of read-only/offline proofs that make the storage/runtime spine inspectable without activating enforcement or provider movement.

Accepted proof surfaces:

- `storage.authority_preflight`
- `storage.setup_gate_readout`
- `storage.setup_gate_readout.action_class_matrix`
- `storage.setup_gate_readout.storage_authority`
- `storage.setup_gate_readout.storage_config_dry_run`
- `storage.authority_config.write_proof`
- `storage.authority_config.acknowledgement_persistence_proof`
- `storage.enforcement_dry_run.command_effect_map`
- `support.gate_stack_readout`
- `metadata.hydration_backlog.preview`
- `metadata.hydration_candidates.preview`
- `support.artifact_path_authority.preview`
- `storage.composed_gate_policy.preview`
- `metadata.hydration_execution_policy.preview`
- `external_io.state_readout`
- `external_io.state_persistence_proof`
- `external_io.state_config_readback`
- `external_io.state_config_write`
- `storage.authority_config.readback`
- `storage.authority_config.write`
- `metadata.hydration_write_fixture_proof`
- `support.artifact_creation_policy.preview`
- `runtime.enforcement_boundary.preview`
- `runtimeEnforcementEvaluator.evaluateRuntimeEnforcementDecision`
- `runtime.enforcement_adapter.dry_preview`
- `runtimeEnforcementDryAdapter.buildDryRuntimeEnforcementAdapterDecision`

Accepted shape:

- storage authority and budget posture are visible before runtime enforcement
- selected storage, app-local fallback, acknowledged fallback, invalidated acknowledgement, missing storage, and budget hard-lock remain distinct
- fixture write proofs remain trusted-context only and do not create the real project-root config file
- `would_allow` / `would_block` / `conditional` are dry-run classifications, not runtime authorization
- all current `serviceRegistry` commands have enforcement classification coverage or explicit fixture/non-production posture
- External I/O off holds provider-backed movement as `held_by_external_io`, while local-only read/report/preflight paths remain available
- External I/O re-enable releases work only to normal cadence/provider/storage/confirmation gates and must not create catch-up flooding
- Hydration backlog preview is read-only local data understanding: it distinguishes provider-needed labels, known local labels, and local SDE gaps without writing hydration output or creating a persisted queue
- Hydration candidate preview is read-only local data understanding: it dedupes readability demand by stable candidate key, groups candidates by view/local-record, target/report-scoped, Watch/background, and corpus hygiene lanes, and exposes source anchors and basis without provider calls, writes, queues, or schema changes
- Support artifact path authority preview is read-only local trust posture: it classifies snapshots, trace packs, logs, temp/cache, SDE/import material, and fixture proof artifacts without creating, deleting, moving, packaging, or uploading files
- Composed gate policy preview is read-only enforcement policy understanding: it composes service command classification, storage authority, budget posture, External I/O, live/provider gate, cadence/rate safety, Watch arming, active task/duplicate prevention, confirmation UX, destination/path authority, and trusted-context posture without making runtime authorization active
- Hydration execution policy preview is read-only readability-repair policy understanding: it separates view/local-record, Watch/background, target/report-scoped, corpus hygiene, and local SDE lookup lanes without provider calls, label writes, queue persistence, or runtime authorization
- External I/O persisted state proof is fixture/offline local trust posture: `off` holds provider-backed movement, `on` releases only to normal gates, renderer payloads cannot forge state/path/acknowledgement/budget, and the fixture proof keeps the real project-root config untouched
- External I/O real operator config is app-local trust posture: trusted context can write/read `<Atlas app/root>/config/external-io-state.json`, renderer code can only read safe posture, `off` holds provider-backed movement, and `on` releases only to normal gates without authorization, immediate dispatch, or catch-up flood
- Storage authority real operator config is app-local trust posture: trusted context can write/read `<Atlas app/root>/config/storage-authority.json`, renderer code can only read safe posture, selected storage and app-local fallback storage remain distinct, `fallback_acknowledgement_needs_reconfirm` is visible, and 5GB is suggestion only rather than hidden acceptance
- Hydration writer fixture proof is fixture/offline readability write posture: it patches activity-event label columns from existing local `entities`, records one `metadata_runs` proof row, keeps numeric IDs as facts, and leaves Evidence/EVEidence, Discovery refs, Watch state, queues, providers, schema, storage config, and renderer UI untouched
- Support artifact creation policy preview is read-only creation posture: it classifies rolling snapshots, retained snapshots, operator debug trace packs, and future readiness/preflight export posture without creating artifacts, files, directories, providers, Evidence/EVEidence, Discovery mutations, Hydration writes, storage config writes, runtime enforcement, or UI work
- Runtime enforcement boundary preview is read-only service-boundary posture: it proves a future insertion point in `invokeServiceCommand(command, payload, context)` after renderer eligibility and confirmation checks, before task wrapping and handler dispatch, while keeping `would_allow`, External I/O on, and unknown/unclassified fail-closed as non-authorizing preview/policy posture
- Runtime enforcement evaluator is a pure inactive decision helper: it accepts explicit facts, returns `pass`, `block`, `conditional`, or `stop_before_boundary` with stable reason codes, and does not call handlers, task runners, providers, repositories, file writers, config writers, or DB APIs
- Runtime enforcement dry adapter is inactive service-boundary fact assembly proof: it assembles evaluator facts from command metadata/definition, payload, context, and explicit supplied gate facts; reports missing fact classes; refuses to treat dry-run `would_allow` as authorization; and remains outside `invokeServiceCommand`
- Trusted/internal confirmation bypass is distinct from confirmation satisfaction: it may preserve the current service-boundary behavior, but it must not be described as an operator or renderer satisfying confirmation
- Runtime enforcement activation readiness audit accepted the proof chain as coherent but found Atlas not ready for active runtime blocking; the next safe seam is a non-blocking service-boundary integration hook only

Current resting state:

- no active Dev runway is open
- future runtime enforcement now has composed gate-state, service-boundary, pure evaluator, dry adapter, and activation-readiness evidence, but still needs an explicit implementation/design runway before command blocking
- HS170 accepted the first inactive service-boundary hook: `invokeServiceCommand` now calls a behavior-preserving non-blocking preview hook after eligibility/confirmation and before task wrapping/dispatch, without command blocking, dispatch changes, provider calls, broad fact sourcing, writes, or runtime authorization
- HS172 accepted the first canonical read-only fact class in that hook: command classification coverage from the existing in-memory coverage map, while preserving supplied facts and not sourcing storage, budget, External I/O, provider/live, Watch/task, DB/config/runtime, or path facts
- HS174 accepted read-only inspection of inactive hook preview evidence through `runtime.enforcement_hook_telemetry.readout`; it does not persist telemetry, create support artifacts, source new fact classes, or activate enforcement
- future Hydration execution now has policy preview evidence, but still needs a dedicated write-capable or provider-capable runway before calls or writes
- future Hydration candidate demand now has dedupe and lane preview evidence, but still needs a dedicated runway before persisted Hydration queues, scheduling, retry state, provider movement, or writes
- future real/operator Hydration writes now have fixture write proof evidence, but still need a dedicated runway before provider-backed or operator-real Hydration exists
- real operator External I/O config is now supported as app-local operator posture, but runtime enforcement still needs a dedicated runway before command blocking or provider release behavior exists
- real operator storage authority config is now supported as app-local operator posture, but runtime enforcement still needs a dedicated runway before command blocking or provider-backed storage gating exists
- support artifact creation policy can now be inspected before creation, but actual support artifact creation, snapshot creation, trace-pack creation, cleanup, and pruning/deletion remain separate future seams

## Accepted Runtime Boundaries

- Discovery refs are returned zKill refs and possible leads.
- Evidence/EVEidence is completed ESI-expanded truth written to local storage.
- Hydration repairs readability and local metadata; it does not create Evidence/EVEidence.
- Assessment Memory is human-authored judgment, mutable, disposable, and not Evidence/EVEidence.
- Runtime snapshots, trace packs, logs, readiness reports, and debug artifacts are support/readout material, not Evidence/EVEidence, Observation, or Assessment Memory.
- Waiting is not failure.
- Retryable provider/capacity waits do not mark refs failed and do not write Evidence/EVEidence.

## Watch And Sequencer Direction

Accepted split:

- Live search is immediate, narrow, and provider-style.
- Watch / Sequencer is patient scoped acquisition over time.
- Acquisition Clock builds the local evidence corpus through separate zKill Discovery and ESI Evidence expansion lanes.
- Hydration Recovery Clock repairs readability through separate Watch hydration and view/local-record hydration lanes.
- Hydration stays separate from Evidence/EVEidence creation.

R-Scanner / Sequencer is not an instant response interface. It can run background acquisition/enrichment for minutes if Atlas is honest about schedule, provider wait, progress, and whether operator action is needed.

Accepted bottleneck clarification:

- zKill and ESI killmail expansion are comparatively compact acquisition steps.
- the larger fanout pressure is often hydration: expanded killmails expose many IDs that may need names/labels
- Evidence acquisition should not be blurred with readability recovery
- view/local-record hydration should not be starved behind an unrelated deep Evidence backlog unless a shared provider/storage gate truly applies

Detailed design direction is recorded in `docs/features/acquisition-and-hydration-clocks.md`.

Current implementation state:

- Live/manual provider request-control metadata exists.
- Live radius is rejected.
- Per-fingerprint cooldown/lockout exists service-memory-only.
- Watch schedule diagnostics exist.
- `Watch_offline` derives read-only restart/recovery state from durable local rows.
- `storage.setup_gate_readout` derives read-only storage setup and disk-budget posture from existing storage authority facts.
- Durable movement checkpointing and broad provider work queues are deferred.

## External I/O Gate Direction

Future provider movement should be organized under an `external_io` family.

`external_io` means the operator trust boundary for external provider contact. It should be the product-level answer to whether Atlas may use zKill, ESI, SDE download, or other external/downstream provider movement.

This does not replace existing gates:

- `watch.executor.arm` remains the session-level switch for scheduled Watch execution.
- `live.gate` remains per-action/provider/cadence control for live/manual provider actions.
- storage authority remains the storage-safety gate.

When external I/O is off / local mode, Atlas should still allow local reports, stored Evidence/EVEidence views, Observation from local records, Assessment notes, and read-only preflights. It should block zKill Discovery, ESI Evidence expansion, ESI metadata hydration, SDE download, and Watch provider dispatch.

Provider-backed movement should pass all relevant gates instead of treating any one gate as universal: `external_io`, per-action/provider cadence, storage safety, confirmation, and Watch arming when Watch-driven.

Clock behavior while external I/O is off:

- Acquisition and Hydration Recovery clocks may keep schedule/readout calculations alive.
- Provider-backed work should be held as `held_by_external_io`, not failed.
- Local-only readout, reports, queue previews, Assessment work, and preflights remain available.
- Releasing external I/O must not trigger immediate catch-up flooding.
- Previously held work should resume only through normal cadence/provider controls, storage safety, and any required operator confirmation.

## Watch_offline Current Role

`Watch_offline` is the accepted read-only post-restart/offline Watch support model.

It derives:

- session armed/collection active state
- configured Watch count
- pending local Discovery refs
- provider deferral
- missed-slot recoverability
- orphaned runs
- reconstructed radius scope quality
- next safe action

It does not call providers, arm Watch execution, hydrate metadata, create Evidence/EVEidence, mutate Discovery refs, or persist sequencer packets.

## Storage Direction

Atlas may become data-heavy. Human direction accepts storage path and budget authority as a high-value future hardening lane.

Accepted direction:

- Atlas should block meaningful real/alpha collection until the operator chooses a storage location.
- Demo/fixture mode may remain available without the real storage setup gate.
- A "current file" or default project-local choice may be offered, but Atlas should make local machine storage use explicit.
- Operator-defined storage location is important before meaningful high-volume collection.
- Operator-defined storage budget is important, and means physical disk-space use under the pointed Atlas storage location.
- Budget accounting should cover space Atlas takes in that location, including the main database, journals, snapshots, trace packs, logs, and other support artifacts stored there.
- Atlas should be lighter in deployment than the current development tree; large import material such as SDE zip files should not be treated as ordinary Atlas runtime data if the deployed runtime uses lighter local lookup tables.
- Around 70% of budget, Atlas should show a prune/cleanup reminder.
- Around 95% of budget, Atlas should show a stronger prune/cleanup reminder.
- At 100% or full budget, Atlas should hard-lock acquisition/write behavior and instruct the operator to fix storage, prune, or expand the budget.
- The hard lock should preserve existing records rather than overwrite, truncate, or malform datasets.
- Moving storage should remain under full user control, but the migration/change function needs hardening against misuse or exploitation.
- Snapshot destination and snapshot/support-artifact budget authority already exist for runtime snapshots.
- Snapshots are for accidental deletion/recovery support, not protection against deliberate user behavior.
- Snapshot opt-in/default behavior for broader storage policy should wait until snapshot size and data growth are better proven.
- Missing, unavailable, or corrupt storage path should hard-lock and require fix/recovery rather than silently creating a surprise new database elsewhere.

Budget here is disk-space authority, not request/API pacing. Earlier "scan budget" ideas are superseded by Sequencer/provider cadence: Live search remains narrow and gated, while Watch / Sequencer controls respectful paced acquisition over time.

Pruning is a first-class future suite, not just cleanup. It is the other half of intelligence formation: working noise away from operator interest while preserving honest deletion, snapshot disclosure, and Evidence/EVEidence boundaries.

## Storage Path Behavior Direction

Atlas should behave like a self-contained briefcase: portable, boot-ready, and able to select suitable storage without relying on hidden Windows app/user settings.

Accepted direction:

- Storage configuration should be stored in a portable project/app-local file.
- Do not hide core Atlas storage authority in Windows app data or user settings directories.
- The app should be able to run from its packaged/local folder and let the operator select suitable storage.
- "Current file" means the packaged app/local app folder as the default self-contained host.
- Atlas should not become a migration tool. Moving storage by copying/moving existing data is out of scope unless explicitly opened later.
- The operator may select storage, but copy/move/migration should rely on higher-authority local tooling unless a future packet explicitly scopes safe migration.
- If the chosen storage folder disappears, Atlas should return to the storage setup/re-establish flow and require explicit operator action.
- Atlas should not silently relocate active records or create a surprise new database elsewhere.

Open implementation choice:

- The first implementation can choose between total app lockout or narrower write/provider/acquisition lockout, but must preserve the rule that meaningful collection and storage writes do not proceed until storage authority is established.

Current implementation note:

- HS115 added `storage.setup_gate_readout` as posture only. It reports configured-ready, fallback acknowledgement-required, demo/fixture-only, missing/unavailable, invalid/degraded, and budget warning/hard-lock states without enforcing them.

Likely allowed while locked:

- storage setup/re-establish screen
- settings needed to fix the storage path
- read-only help/status explaining the lockout
- demo/fixture mode if clearly separated from real/alpha collection

## Pruning Direction

Pruning is future product/system work and should be treated as a suite, not a single delete button.

Accepted direction:

- Pruning may operate by variable time window, such as one month, two months, or another operator-selected interval.
- Pruning may operate by no-interest state; Marked is useful input for distinguishing interest from noise.
- Pruning may operate by entity ID.
- Assessment Memory should participate in the pruning suite. It may be pruned by reference ID and should not silently protect related records from pruning.
- Assessment-linked records should be shown in pruning review so the operator understands affected relationships.
- Discovery refs likely live as metadata/provenance and need a separate pruning treatment from Evidence/EVEidence; confirm the exact data relationship before implementation.

Noise means Atlas holds more entities/records than are useful for target hunting, threat detection, or current pattern recognition.

Atlas is temporal. Information becomes stale. A system-radius search is meant to reveal current/recent behavior patterns around a condition, not catalogue every EVE player indefinitely.

Open implementation questions:

- Which Discovery ref rows are safe to prune independently from Evidence/EVEidence?
- How should stale but Marked entities be handled?
- Should pruning preview group candidates by time, entity, Watch scope, or Observation story impact?
- Which support artifacts should be pruned separately from active records?

## Deletion And Retention Direction

Accepted posture:

- Deletion of active local records should be absolute.
- Retained deletion footprint is rejected.
- Snapshots/backups are separate support/recovery artifacts and should disclose their path so the operator can clean them too.
- Deletion preflight remains read-only until a future bounded deletion execution packet is explicitly opened.
- Assessment Memory is stale and disposable after Evidence/EVEidence deletion; it is not a deletion blocker.

## Record Integrity Direction

Hardening remains focused on preserving coherent local state under:

- partial provider failure
- retryable provider/capacity waits
- restart recovery
- mixed expansion success/failure
- queue/API/Evidence write boundary
- snapshot/support artifact generation
- deletion preflight and future deletion execution

## Local Lookup And Enrichment Direction

Local records are the preferred substrate for fast, cheap Atlas story formation.

Atlas can use ESI enrichment to fill missing context, but enrichment is explicit, provider-gated, slower, rate-limited, and more expensive than local lookup. ESI enrichment is not a silent substitute for healthy local storage.

Accepted direction:

- Use healthy local records first.
- Treat ESI enrichment as controlled gap filling or recovery, not normal baseline lookup behavior.
- If storage is unavailable or broken, hard-lock writes/acquisition until fixed.
- If optional lookup metadata is incomplete, Atlas may allow controlled enrichment or degraded display with honest basis/cost.
- Do not silently replace local lookup with provider calls.

The long-term product goal is rich story telling and discovery from connected local records: who was killed, by whom, exactly when, which pilots were in a corporation together, how many killmails Atlas has seen before, and what behavior patterns emerge over time.

Longer-term ambition: Atlas should support listening-post style workflows that learn corporation behavior through patient scoped acquisition, enrichment, local lookup, pruning, and Observation.

## Parked Or Future Lanes

Likely future bounded lanes:

- storage path and budget authority for the main Atlas data store
- sequencer progress and recovery readout
- provider cadence and capacity policy
- deletion execution after storage/snapshot authority is accepted
- local lookup completeness and controlled enrichment policy
- listening-post/corporation-behavior discovery model
- durable movement checkpointing only if derived `Watch_offline` state proves insufficient

UI/body work should remain requirement context unless explicitly opened by `workspace/current.md`.

## Systems Audit Synthesis 2026-05-27

Accepted advisory inputs:

- `workspace/SystemsAuditHS100-storage-path-budget-authority.md`
- `workspace/SystemsAuditHS101-local-lookup-vs-esi-enrichment.md`
- `workspace/SystemsAuditHS102-pruning-readiness.md`
- `workspace/SystemsAuditHS103-sequencer-provider-cadence.md`
- `workspace/OverseerHS104-systems-audit-synthesis-review.md`

Synthesis:

- Prove and expose current runtime state before enforcement.
- Keep storage authority, provider cadence, local lookup, pruning, Discovery, Evidence/EVEidence, hydration, Watch, and Assessment Memory separate.
- Prefer read-only diagnostics and relationship previews before write enforcement or destructive behavior.
- Do not open broad Sequencer architecture, persisted provider queues, Discovery ref stale/expired mutation, storage migration, or destructive pruning until a bounded packet explicitly selects them.

Strongest next system candidate:

- read-only storage authority preflight/inventory for current DB path mode, DB/WAL/SHM, snapshot settings/destination, trace packs, temp/cache/SDE paths, window/settings path, and current Atlas-controlled byte usage

Secondary candidates:

- explicit live-gate classification for uncached typed actor name resolution
- richer read-only pruning relationship preview
- Sequencer cadence phase readout from existing state

## Acquisition / Hydration Clock Clarification 2026-05-27

Accepted advisory inputs:

- `workspace/SystemsProposalHS104-two-clock-recovery-sequencer.md`
- `workspace/SystemsTraceHS105-search-watch-recovery-rewire-map.md`
- `workspace/SystemsAuditHS107-zkill-esi-trust-boundary.md`

Accepted synthesis:

- zKill remains Discovery only.
- ESI-expanded killmail payloads written locally are Evidence / EVEidence.
- Acquisition Clock creates local facts through zKill Discovery and ESI Evidence expansion lanes.
- Hydration Recovery Clock makes local facts readable through Watch hydration and view/local-record hydration lanes.
- The main provider pressure may be hydration fanout from many unresolved IDs, not only zKill or ESI killmail expansion.
- `external_io` is the future operator trust boundary for provider movement; `watch.executor.arm` remains Watch/session arming only.
- When `external_io` is off, due provider work should be held as `held_by_external_io`; release does not authorize catch-up flooding.
- Future packets should prove readout and boundaries before adding schema-backed queues, broad provider orchestration, or new persistence.
