# OverseerHS406 - HS405 Candidate Ref Memory / Status Helper Ownership Review

Status: accepted with clarification
Date: 2026-06-07
Reviewer: Overseer

## Reviewed

- `workspace/EngineeringTraceHS405-candidate-ref-memory-status-helper-ownership.md`
- `workspace/OverseerHS405-candidate-ref-memory-status-helper-ownership-trace-request.md`
- `workspace/current.md`

## Decision

HS405 is accepted as an advisory/source trace.

The artifact correctly identifies `discovered_killmail_refs` as candidate-ref memory, not Evidence/EVEidence and not Discovery task/packet memory. It also correctly recommends a small first helper-home packet for pending-ref rehydration helpers.

## Required Clarification

The Watch completion boundary needs a tighter statement:

```txt
Watch completion can mean that the scheduled accepted scope/window was handed to Discovery and Discovery returned a bounded zKill acquisition receipt/outcome for that scope/window.

Watch completion does not mean all candidate refs became Evidence/EVEidence.
```

Clean model:

- Watch owns the cadence decision: when a Watch is currently due, missed, or otherwise ready, Watch emits/populates a Discovery acquisition task for the accepted scope/window.
- Discovery does not monitor Watch cadence.
- The Discovery basket is empty until Watch, Manual, or another accepted intent source populates it.
- Discovery zKill lane answers: candidate acquisition for this scope/window is complete/no refs/capped/deferred/failed.
- Watch can rest or schedule the next run from that Discovery acquisition receipt.
- Discovery ESI-backed expansion continues downstream recovery/work from landed refs.
- Evidence/EVEidence begins only when ESI-expanded killmails land.

Therefore:

- `discovered_killmail_refs` is Discovery working memory.
- Candidate refs may be evidence behind the receipt.
- The receipt is the completion surface Watch consumes.
- ESI expansion is downstream Discovery work, not Watch completion.

## Accepted Recommendations

Accepted as the smallest next Dev packet candidate:

```txt
Discovery candidate-ref pending rehydration helper extraction
```

Likely helper home:

```txt
src/main/discovery/candidateRefMemory.js
```

Initial helpers:

```txt
pendingActorDiscovery(...)
pendingSystemRadiusDiscovery(...)
```

Keep the next Dev packet narrow:

- move only the pure pending-ref rehydration helpers out of old collector files
- preserve output shapes exactly
- do not move repository methods yet
- do not change status mutation behavior
- do not change manual expansion
- do not add schema, dispatcher, receipt, task/packet memory, provider movement, runtime redirect, or collector retirement

## Parked

Do not open a broad candidate-ref status service yet.

Reason: selected/expanded/cached/failed transitions still cross Discovery ESI-backed expansion intake, Evidence/EVEidence writer landing, manual compatibility, and old mixed collector orchestration. Moving that choreography too early would make the module name cleaner without proving the boundary.

## Verification Expectation For Next Dev Packet

If opened, the next packet should at least verify:

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

## Remaining Pressure

After pending-ref rehydration helper extraction, the next larger boundary is still the ESI-backed expansion/package helper trace. That is where selected/expanded/cached/failed mutation policy should be shaped before any actor Watch redirect or collector retirement.
