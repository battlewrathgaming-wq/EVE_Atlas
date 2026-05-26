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

- Operator-defined storage location is important before meaningful high-volume collection.
- Operator-defined storage budget is important.
- Atlas should warn near configured limits and point toward pruning/cleanup.
- Atlas should stop acquisition at hard/full limits to preserve existing records rather than overwrite or malform datasets.
- Snapshot destination and snapshot/support-artifact budget authority already exist for runtime snapshots.
- Snapshot opt-in/default behavior for broader storage policy should wait until snapshot size and data growth are better proven.

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

## Parked Or Future Lanes

Likely future bounded lanes:

- storage path and budget authority for the main Atlas data store
- sequencer progress and recovery readout
- provider cadence and capacity policy
- deletion execution after storage/snapshot authority is accepted
- durable movement checkpointing only if derived `Watch_offline` state proves insufficient

UI/body work should remain requirement context unless explicitly opened by `workspace/current.md`.
