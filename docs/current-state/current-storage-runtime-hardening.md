# Current State: Storage And Runtime Hardening

Date: 2026-05-27
Status: Current milestone summary

## Purpose

This document consolidates accepted storage/runtime hardening direction that had accumulated in workspace handshakes.

`workspace/current.md` remains the active executable packet. This document is durable orientation for the current Storage And Runtime Hardening milestone.

## Current Focus

Atlas is prioritizing the storage/runtime spine before expanding the product body.

UI and Observation direction now exist as useful pressure tests, but the active priority remains making the underlying system trustworthy for heavy local data, patient acquisition, restart recovery, deletion safety, and provider pacing.

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
- Discovery Sequencer should pace zKill acquisition and return Discovery refs.
- Enrichment Sequencer should pace ESI expansion of known refs into Evidence/EVEidence.
- Hydration stays separate from request-control sequencing.

R-Scanner / Sequencer is not an instant response interface. It can run background acquisition/enrichment for minutes if Atlas is honest about schedule, provider wait, progress, and whether operator action is needed.

Current implementation state:

- Live/manual provider request-control metadata exists.
- Live radius is rejected.
- Per-fingerprint cooldown/lockout exists service-memory-only.
- Watch schedule diagnostics exist.
- `Watch_offline` derives read-only restart/recovery state from durable local rows.
- Durable movement checkpointing and broad provider work queues are deferred.

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
