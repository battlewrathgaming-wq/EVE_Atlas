# OverseerHS405 - Candidate Ref Memory / Status Helper Ownership Trace Request

Status: open
Date: 2026-06-07
Role: Overseer
Executor: Engineering / source-trace specialist

## Purpose

Trace current candidate-ref memory and status helper behavior before any default `actor.watch` redirect, scheduled Watch redirect, collector retirement, live/provider movement, dispatcher work, schema work, or durable Discovery task/packet persistence.

Atlas has accepted:

- Watch is a scheduler and scope-authority source.
- Discovery is the provider-facing acquisition utility.
- Discovery refs are possible leads / provenance, not Evidence.
- `discovered_killmail_refs` should remain candidate-ref memory, not Discovery task/packet memory.
- Evidence/EVEidence is final landed memory from expanded ESI killmails and normalized rows.
- Hydration repairs readability and labels; it does not create Evidence.

HS399 moved expansion queue selection helpers into Discovery ownership.
HS403 moved zKill candidate acquisition helpers into Discovery ownership.

The next unclear joint is candidate-ref memory/status: where pending refs are read, where zKill candidate refs are persisted, how selected/expanded/cached/failed states are represented, and which helpers should belong to Discovery versus Evidence/EVEidence writer, Watch compatibility, or legacy collector orchestration.

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS404-hs403-discovery-zkill-candidate-acquisition-helper-extraction-review.md`
- `workspace/DevHS403-discovery-zkill-candidate-acquisition-helper-extraction.md`
- `workspace/OverseerHS400-hs399-discovery-expansion-queue-helper-extraction-review.md`
- `workspace/EngineeringTraceHS397-discovery-helper-ownership-source-trace.md`
- `workspace/EngineeringTraceHS401-zkill-acquisition-helper-ownership.md`
- relevant source files discovered by trace

## Trace Targets

Inspect at least:

- `pendingDiscoveryRefs`
- `pendingActorDiscovery`
- `pendingSystemRadiusDiscovery`
- `upsertDiscoveredKillmailRefs`
- candidate-ref selected / expanded / cached / failed status mutation helpers or repository methods
- `selected_for_expansion_at`
- `expanded_at`
- `failed_at`
- `failure_count`
- `last_error`
- any repository method touching `discovered_killmail_refs.status`
- current callers in actor Watch, system/radius Watch, manual discovery, and manual expansion

Include adjacent helpers if needed to explain current behavior.

## Questions To Answer

1. What candidate-ref memory/status helpers exist today, and where are they defined?
2. Which helpers read pending local Discovery refs versus write new candidate refs?
3. Which helpers mutate selected/expanded/cached/failed state, timestamps, failure counts, or errors?
4. Which boundary should own each helper in the accepted model: Discovery candidate-ref memory, Discovery ESI-backed expansion intake, Evidence/EVEidence writer, Watch compatibility, Manual compatibility, support logging, or legacy collector orchestration?
5. Which helpers are safe to reuse mostly as-is with ownership clarified?
6. Which helpers carry mixed Watch/Discovery/Evidence assumptions and should be replaced, renamed, or parked before reuse?
7. Does current status behavior risk treating `discovered_killmail_refs` as Discovery task/packet memory rather than candidate-ref memory?
8. Which current status behaviors are required for manual discovery/manual expansion compatibility?
9. What is the smallest next Dev packet after this trace, if any?

## Constraints

- Advisory/source trace only.
- Do not implement code.
- Do not edit source files.
- Do not run live/API/provider calls.
- Do not mutate the database except ordinary read-only inspection if a local fixture is already used by a verifier.
- Do not change schema.
- Do not rename terms.
- Do not authorize `actor.watch` redirect, scheduled Watch redirect, collector retirement, dispatcher work, queue work, Evidence/EVEidence writes, Hydration writes, Observation work, support artifact work, runtime enforcement, command blocking, or UI work.

## Expected Output

Create:

```txt
workspace/EngineeringTraceHS405-candidate-ref-memory-status-helper-ownership.md
```

Return a concise advisory with:

1. Executive recommendation.
2. Helper-by-helper ownership table.
3. Current callers and current side effects.
4. Candidate-ref memory/status lifecycle as implemented today.
5. Reuse / replace / rename / park recommendation for each helper.
6. Boundary risks, especially task-memory drift.
7. Gaps before `actor.watch` redirect or collector retirement.
8. Smallest next Dev packet recommendation.
9. Verification or proof evidence expected for that packet.
