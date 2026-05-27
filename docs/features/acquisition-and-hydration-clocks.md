# Acquisition And Hydration Clocks

Status: accepted design direction
Date: 2026-05-27

## Purpose

This note records the provider-pressure model that emerged from the HS103, HS107, and Human/Overseer discussion.

The important correction is that Atlas should not treat zKill discovery, ESI killmail expansion, and metadata hydration as one generic enrichment stream.

Atlas should distinguish:

```text
Acquisition Clock = builds the local evidence corpus.
Hydration Recovery Clock = makes local facts readable.
```

## Trust Ladder

```text
zKill candidate / summary
-> Discovery ref / possible lead
-> ESI killmail expansion
-> provider-complete killmail report
-> local Evidence / EVEidence
-> Observation / report / Assessment may cite it
```

zKill is a Discovery signal. It may provide useful candidate and preview metadata, but it is not provider-complete Evidence.

ESI-expanded killmail payloads, once written locally, are Atlas Evidence / EVEidence.

Stable Evidence basis is IDs and raw provider-complete payloads. Names and labels are readability metadata.

## Acquisition Clock

The Acquisition Clock is the patient provider-work mechanism for creating local facts.

It has two conceptual lanes.

### zKill Discovery Lane

Purpose:

- ask scoped questions such as target, Watch, system, radius, and lookback
- receive candidate `killmail_id` / hash pairs
- write or refresh `discovered_killmail_refs`
- preserve optional zKill preview metadata as Discovery/provenance only

Output:

- Discovery refs / possible leads

Must not:

- claim complete report coverage
- create Evidence / EVEidence
- turn preview metadata into Observation facts

### ESI Evidence Expansion Lane

Purpose:

- take selected or policy-eligible `killmail_id` / hash pairs
- call ESI killmail expansion
- store provider-complete killmail payloads
- derive local activity/event rows from the expanded payload

Output:

- `killmails`
- `activity_events`
- `ingestion_audits`
- related warnings/provenance

Meaning:

- this lane creates Evidence / EVEidence

## Hydration Recovery Clock

The Hydration Recovery Clock handles the larger readability pressure created by local Evidence.

The main pressure is not usually the zKill request or the ESI killmail expansion request. One expanded killmail can expose many participant, corporation, alliance, ship/type, or location IDs. Making those IDs human-readable can require many metadata/name lookups if local records are incomplete.

Hydration repairs readability and metadata. It does not create Evidence / EVEidence and must not replace IDs as facts.

It has two conceptual lanes.

### Watch Hydration Lane

Purpose:

- repair labels and metadata produced by Watch/acquisition runs
- prioritize Watch targets, repeated entities, scoped report needs, Marked/interest context, or missing corporation/alliance labels
- run patiently without blocking Evidence creation

Expected state:

- backlog is normal
- waiting is normal
- completeness should be useful and scoped, not global

### View Hydration Lane

Purpose:

- repair labels needed for the local record, report, or Observation surface the operator is currently inspecting
- support point-of-need readability

Expected state:

- should stay responsive
- should not be starved behind large Evidence backlogs
- should still obey External API, storage, provider, and cadence gates

## Key Doctrine

```text
Acquisition Clock creates local facts.
Hydration Recovery Clock makes local facts readable.
```

Additional rules:

- Evidence / EVEidence is provider-complete ESI killmail data written locally.
- Discovery refs remain possible leads until ESI expansion succeeds.
- Hydration is readability repair for known IDs and local records.
- IDs are facts; names and labels are metadata.
- Watch/radius acquisition may be broad and patient, but must not imply complete evidence until ESI expansion has written local Evidence.
- Live search can remain immediate and narrow; any larger downstream acquisition or hydration must respect the relevant clock/lane.
- Hydration should not be blocked by an unrelated deep Evidence backlog unless a shared gate truly applies.

## External I/O Gate Direction

Future provider work should sit under an `external_io` family.

`external_io` is the operator trust boundary: whether Atlas may contact external providers. It is not the same as `watch.executor.arm`.

When external I/O is off / local mode:

- allowed: local reports, stored Evidence / EVEidence views, Observation from local records, Assessment notes, queue/readiness/storage/retention preflights
- blocked: zKill Discovery, ESI Evidence expansion, ESI metadata hydration, SDE download, Watch provider dispatch

Existing `watch.executor.arm` remains the session-level switch for scheduled Watch execution. It should consume `external_io` when provider movement is needed; it should not become the global provider gate.

`live.gate` remains per-action/provider/cadence control. Storage authority remains storage safety. A provider-backed action should pass all relevant gates: `external_io` enabled, `live.gate` allowed, storage safe, cadence safe, confirmation if needed, and Watch armed if Watch-driven.

This direction prevents the Hydration Recovery Clock from being collapsed into Watch arming. Hydration may be Watch-originated or view-originated, but provider-backed hydration still belongs under the external I/O trust boundary.

## External I/O Clock Hold Policy

When `external_io` is off, clocks should not die and should not secretly move provider work.

Accepted policy:

- clock schedules/readouts may continue calculating due, held, and next-eligible posture
- provider-backed release is blocked while external I/O is off
- due provider work should read as `held_by_external_io`, not failed
- missed slots remain recoverable state, not urgent errors
- local-only readout, reports, queue previews, Assessment work, and preflights remain available
- local-only lookup/hydration may remain available when it does not contact providers
- provider-backed hydration waits under the same external I/O trust boundary

Releasing external I/O must not mean catch-up flood.

When external I/O is turned back on, Atlas should resume under normal cadence/provider controls. It should not immediately fire every due, missed, or held acquisition/hydration action. Previously held work should be re-evaluated through the relevant clock, lane, provider/cadence gate, storage safety gate, and operator confirmation rules.

## Bottleneck

The bottleneck to design around is usually:

```text
expanded killmails
-> many unresolved IDs
-> metadata/name hydration pressure
```

Not merely:

```text
zKill request count
-> ESI killmail expansion count
```

Provider-control design should therefore protect hydration fanout carefully while keeping Evidence acquisition and readability repair separate.

## Implementation Posture

This is design direction, not current implementation authority for new behavior.

Current Atlas already has parts of this shape:

- `discovered_killmail_refs` for zKill Discovery lane output
- `killmails` and `activity_events` for ESI Evidence expansion output
- `fetch_runs`, `api_request_logs`, and `ingestion_audits` for acquisition provenance
- `metadata_runs`, `entities`, and label patches for hydration/readability provenance

Future implementation should prove the readout and boundaries before adding schema-backed queues, broad provider orchestration, or new persistence.

## Related Inputs

- `workspace/SystemsAuditHS103-sequencer-provider-cadence.md`
- `workspace/SystemsProposalHS104-two-clock-recovery-sequencer.md`
- `workspace/SystemsTraceHS105-search-watch-recovery-rewire-map.md`
- `workspace/SystemsAuditHS107-zkill-esi-trust-boundary.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
