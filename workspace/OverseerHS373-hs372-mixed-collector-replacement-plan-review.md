# OverseerHS373 - HS372 Mixed Collector Replacement Plan Review

Status: accepted
Date: 2026-06-07
Role: Overseer
Reviewed artifact: workspace/EngineeringTraceHS372-mixed-watch-collector-replacement-plan.md
Reviewed request: workspace/OverseerHS372-mixed-watch-collector-replacement-planning-request.md

## Decision

HS372 is accepted.

The advisory preserves the corrected ownership model:

```txt
Watch = intent source, scheduler, accepted scope/cadence authority.
Discovery = provider-facing acquisition utility with zKill candidate-lead acquisition and ESI-backed killmail/detail expansion lanes.
Evidence/EVEidence = final landed memory.
```

The source trace confirms the current mixed Watch collectors should not be treated as the future runtime boundary with light wording changes.

## Accepted Findings

Current mixed paths still bundle:

- Watch scheduling intent and cadence
- zKill candidate acquisition
- Discovery ref persistence
- ESI-backed killmail/detail expansion
- Evidence/EVEidence writes
- fetch/run posture
- warnings and API/support logging

Key source points accepted from the advisory:

- `watchExecutor.dispatchFor(...)` still dispatches actor Watch to `collectActorWatch(...)` and system/radius Watch to `collectSystemRadiusWatch(...)`.
- `runActorWatchService(...)` and `runSystemRadiusWatchService(...)` also enter the mixed collector path.
- `actorWatchCollector.js` and `systemRadiusCollector.js` bundle acquisition, ref persistence, expansion selection, ESI-backed expansion, Evidence writes, and run finalization.
- `killmailIngestionWorker.buildEvidencePackageFromRefs(...)` is the strongest current candidate for Discovery's ESI-backed expansion lane, but its name/placement risks blurring expansion, ingestion, and final Evidence landing.
- `EvidenceRepository` exposes useful primitives, but current callers decide too much boundary meaning.
- command metadata still preserves the mixed collector model for live-capable Watch commands.

## Accepted Direction

Proceed toward staged replacement, not long-term redirect.

- `replacement` remains the planning frame.
- `redirect` is temporary compatibility only.
- `retire` is the intended end-state.
- Do not retire or redirect collectors immediately.
- Prove a no-provider replacement route first.

## Accepted Next Step

Open a read-only/local-only replacement route preview.

Suggested command:

```txt
watch.mixed_collector_replacement_route.preview
```

This should prove the future route map from current Watch payload shapes to:

```txt
Watch accepted intent / cadence
-> Discovery zKill candidate-lead acquisition lane
-> Discovery ESI-backed killmail/detail expansion lane
-> Evidence/EVEidence writer / landed memory
-> Watch receipt / cadence posture
```

No provider movement, writes, collector invocation, redirect, retirement, schema, UI, or enforcement should occur.

## Parked

- live provider calls
- live Watch execution
- actual redirect or retirement of collectors
- schema changes
- durable Discovery task/packet/receipt schema
- dispatcher, leases, workers, runtime enforcement, command blocking
- Watch result relationship tags
- UI
- Hydration/readability repair
- Observation/report transformation
- Assessment language
- protected terminology JSON updates
- broad documentation replacement

