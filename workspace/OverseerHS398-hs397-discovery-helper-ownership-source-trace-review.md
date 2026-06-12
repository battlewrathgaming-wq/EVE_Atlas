# OverseerHS398 - HS397 Discovery Helper Ownership Source Trace Review

Status: accepted
Date: 2026-06-07
Reviewed artifact: `workspace/EngineeringTraceHS397-discovery-helper-ownership-source-trace.md`

## Decision

HS397 is accepted as the current source-trace basis for Discovery helper ownership.

The trace confirms the expected boundary pressure:

- low-level provider and Evidence/EVEidence primitives are reusable when called from the right owner
- `collectActorWatch(...)` is not a future route because it remains the mixed legacy collector path
- `selectExpansionCandidates(...)`, `markFailedExpansionCandidates(...)`, and `summarizeExpansionQueue(...)` are useful shared helper logic, but their current home in `systemRadiusCollector.js` preserves old collector ownership smell

## Accepted Direction

Open a narrow Dev packet to extract the expansion queue selection helpers into a Discovery-owned module.

This is not a runtime redirect and not collector retirement. It is code ownership cleanup so future Discovery work can stop importing shared expansion-selection behavior from the system/radius collector.

## Accepted Helper Ownership

Reusable as existing low-level primitives:

- `normalizeKillmail(...)` remains Evidence/EVEidence normalization.
- `EvidenceRepository.persistEvidencePackage(...)` remains final Evidence/EVEidence landing.
- `EsiClient.expandKillmail(...)` may be used later by Discovery ESI-backed killmail/detail expansion as provider client, but not from Watch.
- `ZKillDiscoveryClient.discoverRefs(...)` may be used later by Discovery zKill candidate-lead acquisition as provider client, but not from Watch.

Needs ownership cleanup now:

- `selectExpansionCandidates(...)`
- `markFailedExpansionCandidates(...)`
- `summarizeExpansionQueue(...)`

Preserve as legacy/current compatibility until explicitly replaced:

- `collectActorWatch(...)`
- `collectSystemRadiusWatch(...)`
- `runActorWatchService(...)`
- `actor.watch`
- scheduled actor Watch dispatch runner binding

## Guardrails For Next Packet

Do not redirect `actor.watch`, change `runActorWatchService(...)`, change `watchExecutor.dispatchFor(...)`, invoke or retire collectors, call zKill, call ESI, write Discovery refs, write Evidence/EVEidence, write Hydration/metadata, add schema, add dispatcher/queue/lease behavior, change command authority, activate enforcement, change UI, create support artifacts, rename source-owned terms, or update protected-word JSON.

## Next Runway

Opened:

```txt
workspace/OverseerHS399-discovery-expansion-queue-helper-extraction-runway.md
```

Expected Dev handoff:

```txt
workspace/DevHS399-discovery-expansion-queue-helper-extraction.md
```

## Verification

This review used:

```txt
Get-Content -Path workspace\EngineeringTraceHS397-discovery-helper-ownership-source-trace.md
rg -n "selectExpansionCandidates|markFailedExpansionCandidates|summarizeExpansionQueue" src\main\workers
git status --short --branch
```

No implementation verification was run by Overseer for HS397 because it was an advisory/source-trace artifact.
