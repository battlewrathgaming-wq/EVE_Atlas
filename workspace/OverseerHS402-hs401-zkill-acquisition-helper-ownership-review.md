# OverseerHS402 - HS401 zKill Acquisition Helper Ownership Review

Status: accepted
Date: 2026-06-07
Reviewed artifact: `workspace/EngineeringTraceHS401-zkill-acquisition-helper-ownership.md`

## Decision

HS401 is accepted as the current source-trace basis for zKill acquisition helper ownership.

The trace confirms that the low-level provider client is already reusable, but the actor/system acquisition loops still live in old collector modules:

- actor zKill acquisition loop: `src/main/workers/actorWatchCollector.js`
- system/radius zKill acquisition loop: `src/main/workers/systemRadiusCollector.js`
- manual discovery imports those helper surfaces from old collector modules

That is the same class of ownership smell HS399 cleaned for expansion queue selection helpers.

## Accepted Direction

Open a narrow Dev packet to move zKill candidate acquisition helper logic into a Discovery-owned module while preserving behavior exactly.

Preferred helper home:

```txt
src/main/discovery/zkillCandidateAcquisition.js
```

Preferred public exports for the first move:

- `discoverActorRefs(...)`
- `discoverSystemRefs(...)`

The system collector may keep a compatibility export name if needed, but ownership should move into Discovery.

## Accepted Boundary

This is not a runtime redirect and not collector retirement.

The next packet may move helper definitions and update imports only. It must not change:

- `actor.watch`
- `system.radius.watch`
- `runActorWatchService(...)`
- `watchExecutor.dispatchFor(...)`
- provider-call behavior
- `HttpClient` construction or API logging policy
- candidate-ref write/status policy
- Evidence/EVEidence writes
- Watch cadence/run state
- command metadata/authority
- schema
- dispatcher/queue/lease/sequencer behavior
- runtime enforcement
- UI

## Accepted Findings

- `ZKillDiscoveryClient.discoverRefs(...)` remains the low-level provider client primitive.
- Actor/system acquisition loops are Discovery-shaped in meaning because they turn planned zKill requests into candidate refs, duplicate/malformed counts, warnings, and acquisition result posture.
- Manual discovery already borrowing these loops from Watch collector files proves the helper ownership is muddy.
- Do not over-generalize yet. Preserve separate actor/system helper shapes first.
- `discoverRefs` is too generic for future doctrine; prefer `discoverSystemRefs(...)` for the Discovery-owned system helper.

## Next Runway

Opened:

```txt
workspace/OverseerHS403-discovery-zkill-candidate-acquisition-helper-extraction-runway.md
```

Expected Dev handoff:

```txt
workspace/DevHS403-discovery-zkill-candidate-acquisition-helper-extraction.md
```

## Verification

This review used:

```txt
Get-Content -Path workspace\EngineeringTraceHS401-zkill-acquisition-helper-ownership.md
rg -n "function discoverActorRefs|async function discoverActorRefs|function discoverRefs|async function discoverRefs|function expansionCandidate|ZKillDiscoveryClient|discoverRefs\(" src\main\workers\actorWatchCollector.js src\main\workers\systemRadiusCollector.js src\main\workers\manualDiscoveryWorker.js src\main\api\zkillClient.js
git status --short --branch
```

No implementation verification was run for HS401 because it was an advisory/source-trace artifact.
