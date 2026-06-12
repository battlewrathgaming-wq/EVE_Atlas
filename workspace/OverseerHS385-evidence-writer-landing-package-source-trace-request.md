# OverseerHS385 - Evidence/EVEidence Writer Landing Package Source Trace Request

Status: open
Date: 2026-06-07
Role: Overseer

## Purpose

Run an advisory/source-trace pass on the Evidence/EVEidence writer landing package before any runtime adapter, redirect, collector retirement, or live/provider movement.

HS383 proved an old caller-facing actor Watch result fixture can be constructed from boundary-owned fixture outputs. The next selected order is:

1. Posture the Evidence/EVEidence writer landing boundary end to end.
2. Then run boundary cleanup/audit across the Discovery replacement chain.

This request is the first step. It is not Dev implementation.

## Core Model To Preserve

- Watch is a scheduler and scope-authority source.
- Discovery is the provider-facing acquisition utility.
- Candidate refs are possible leads, not Evidence/EVEidence.
- ESI-backed killmail/detail expansion is Discovery-owned provider movement, not Hydration.
- Evidence/EVEidence is final landed memory.
- Hydration repairs readability only.
- Observation derives/frames local records later.
- Assessment Memory is human-authored judgment, not Evidence/EVEidence.

## Review Question

What exactly must an Evidence/EVEidence writer landing package preserve, write, disclose, and refuse before it can be safely used by a future Discovery-owned ESI-backed expansion lane?

## Read

Start from this project root.

Required:

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS384-hs383-actor-watch-compatibility-wrapper-adapter-fixture-review.md`
- `workspace/DevHS383-actor-watch-compatibility-wrapper-adapter-fixture.md`
- `workspace/OverseerHS380-hs379-discovery-esi-expansion-intake-posture-review.md`
- `workspace/DevHS379-discovery-esi-expansion-intake-posture.md`
- `workspace/OverseerHS371-hs370-discovery-acquisition-to-evidence-handoff-review.md`
- `workspace/DevHS370-discovery-acquisition-to-evidence-handoff-fixture.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/discovery-queue-contract.md`
- `src/main/db/schema.sql`
- `src/main/db/evidenceRepository.js`
- existing normalizer / ingestion / worker code that actually writes or normalizes killmail Evidence/EVEidence

Use source code trace over memory. If a file name differs, locate it with `rg`.

## Questions To Answer

1. What current functions actually land expanded ESI killmail data into durable Evidence/EVEidence?
2. What tables are written for a successful landing?
3. What tables may be written for provenance, audit, warnings, API logs, ingestion audits, quality checks, or relationship/context support?
4. What input shape does the current writer expect?
5. What input shape should a future Discovery-owned ESI-backed expansion lane supply?
6. What must be preserved from the original Discovery candidate ref?
7. What must be preserved from ESI expanded killmail payload?
8. What must be normalized into participant/activity rows?
9. What must not be inferred, renamed, hydrated, assessed, observed, or presented as complete during writer landing?
10. How does local Evidence/EVEidence cache/idempotency currently work?
11. How are duplicate killmail IDs / hashes handled?
12. How are partial or malformed ESI payloads handled?
13. How are retryable provider failures distinguished from terminal payload/writer failures, if at all?
14. What existing writer behavior is suitable for the replacement chain?
15. What existing writer behavior is still mixed with Watch/collector assumptions and should not be inherited blindly?
16. What should the smallest fixture proof of Evidence/EVEidence writer landing package include?
17. What should remain parked until runtime/live/provider work?

## Constraints

- Advisory/source trace only.
- Do not implement code.
- Do not run provider calls.
- Do not run live/API movement.
- Do not mutate the DB.
- Do not create or modify schema.
- Do not open a Dev runway.
- Do not treat zKill candidate refs as Evidence/EVEidence.
- Do not treat Hydration as Evidence/EVEidence creation.
- Do not treat Observation/report output as writer landing.
- Do not rename source-owned terms.
- Do not update protected-word JSON.

## Expected Output

Create:

```txt
workspace/EngineeringTraceHS385-evidence-writer-landing-package-source-trace.md
```

Include:

1. Executive finding.
2. Current write path trace.
3. Tables and fields touched by Evidence/EVEidence landing.
4. Current writer input shape.
5. Future Discovery-to-writer input shape recommendation.
6. Required provenance/basis fields.
7. Idempotency and cache behavior.
8. Malformed / partial / retryable / terminal behavior.
9. Boundary risks or mixed collector assumptions.
10. Smallest next fixture proof recommendation.
11. Acceptance criteria for that proof.
12. Verification evidence expected.
13. Parked items.

## Overseer Use

This artifact will decide whether the next packet should be:

- an Evidence/EVEidence writer landing package fixture proof, or
- another audit/design cleanup before Dev.

It will also feed the later Discovery replacement-chain cleanup/audit.
