# OverseerHS397 - Discovery Helper Ownership Source Trace Request

Status: open
Date: 2026-06-07
Role: Overseer
Executor: Engineering / source-trace specialist

## Purpose

Trace helper surfaces around the old mixed actor Watch runtime and the emerging Discovery/Evidence boundary before any default `actor.watch` redirect, scheduled Watch redirect, collector retirement, live/provider movement, schema work, or dispatcher work.

Atlas has accepted the direction:

- Watch is a scheduler and scope-authority source.
- Discovery is the provider-facing acquisition utility.
- Discovery owns zKill candidate-lead acquisition and ESI-backed killmail/detail expansion movement.
- Candidate refs are possible leads/intermediate receipts, not Evidence/EVEidence.
- Evidence/EVEidence begins at final landed memory.
- Hydration is readability repair only.

HS395 proved an explicit no-provider compatibility-wrapper preview command, but it did not prove which existing helpers can safely move under Discovery/Evidence ownership or which old helper names would carry mixed Watch assumptions forward.

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS396-hs395-actor-watch-compatibility-wrapper-command-review.md`
- `workspace/EngineeringTraceHS393-actor-watch-runtime-redirect-readiness.md`
- `workspace/EngineeringTraceHS372-mixed-watch-collector-replacement-plan.md`
- `workspace/OverseerHS373-hs372-mixed-collector-replacement-plan-review.md`
- `workspace/OverseerHS394-hs393-actor-watch-redirect-readiness-review.md`
- relevant source files discovered by trace

## Trace Targets

Inspect at least:

- `normalizeKillmail`
- `persistEvidencePackage`
- `selectExpansionCandidates`
- `pendingDiscoveryRefs`
- `upsertDiscoveredKillmailRefs`
- `expandKillmail`
- `collectActorWatch`
- `runActorWatchService`
- current actor Watch service registry entry
- current scheduled actor Watch dispatch path

Include any adjacent helper if it is necessary to explain the runtime boundary.

## Questions To Answer

1. What does each helper do today?
2. Which boundary should own it in the accepted model: Watch, Discovery zKill acquisition, Discovery ESI-backed expansion, Evidence/EVEidence writer, Hydration, Observation, support logging, or legacy compatibility?
3. Which helpers are safe to reuse mostly as-is with ownership clarified?
4. Which helpers carry mixed Watch/Discovery/Evidence assumptions and should be replaced or renamed before reuse?
5. Which helpers are tied to live/manual paths, if any?
6. Which helpers are tied to pending Discovery refs or durable ref status mutation?
7. Which helpers would be risky to route through a compatibility wrapper before another proof?
8. What is the smallest next Dev packet after this trace, if any?

## Constraints

- Advisory/source trace only.
- Do not implement code.
- Do not edit source files.
- Do not run live/API/provider calls.
- Do not mutate the database except ordinary read-only inspection if a local fixture is already used by a verifier.
- Do not change schema.
- Do not rename terms.
- Do not authorize `actor.watch` redirect, scheduled Watch redirect, collector retirement, dispatcher work, queue work, Evidence/EVEidence writes, Hydration writes, Observation work, or UI work.

## Expected Output

Create:

```txt
workspace/EngineeringTraceHS397-discovery-helper-ownership-source-trace.md
```

Return a concise advisory with:

1. Executive recommendation.
2. Helper-by-helper ownership table.
3. Current callers and current side effects.
4. Reuse / replace / rename / park recommendation for each helper.
5. Boundary risks.
6. Gaps before `actor.watch` redirect.
7. Smallest next Dev packet recommendation.
8. Verification or proof evidence expected for that packet.

