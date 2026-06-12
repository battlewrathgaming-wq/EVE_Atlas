# OverseerHS393 - Actor Watch Runtime Redirect Readiness Request

Status: open advisory request
Date: 2026-06-07
Role: Overseer
Expected reviewer: Engineering / source trace

## Purpose

Determine whether Atlas is ready for a first narrow `actor.watch` runtime redirect or compatibility-wrapper activation after the HS351-HS392 proof chain.

This is advisory/source-trace work only. Do not implement code.

## Current Accepted Model

- Watch is a scheduler and scope-authority source.
- Discovery is the provider-facing acquisition utility.
- A due Watch emits Discovery pickup intent; it does not acquire candidates itself.
- Discovery services zKill candidate-lead acquisition and ESI-backed killmail/detail expansion lanes.
- Evidence/EVEidence is final landed memory.
- Hydration is readability repair only.
- The old mixed Watch collectors still bundle too much and are intended to be replaced in stages, not preserved as the future model.

## Recent Accepted Proofs To Consider

- HS374 mixed collector replacement route preview
- HS377 actor Watch replacement parity proof
- HS379 Discovery ESI-backed expansion intake posture
- HS381 actor Watch compatibility-wrapper contract
- HS383 actor Watch compatibility-wrapper adapter fixture
- HS385 / HS386 Evidence writer landing source trace
- HS387 / HS388 Evidence writer landing package fixture proof
- HS389 / HS390 conflict dependent-row hardening
- HS391 / HS392 mixed clean/conflict package proof

## Questions To Answer

1. What exact current runtime entry points would be touched by a first `actor.watch` redirect or wrapper activation?
2. What current callers depend on the old actor Watch result shape?
3. Which boundary-owned route pieces are already proven strongly enough to reuse?
4. Which pieces remain fixture-only and must not be treated as live/provider ready?
5. What is the smallest safe first runtime redirect shape?
6. Should the first implementation route `actor.watch` through a compatibility wrapper while still using fixture/no-provider movement, or should it add a new explicit command first?
7. What must remain parked:
   - live zKill
   - live ESI
   - system/radius Watch
   - mixed collector retirement
   - schema
   - runtime enforcement
   - UI
8. What rollback or compatibility checks should Dev include?
9. What verification commands should prove the redirect did not call providers or widen boundaries?
10. Is Dev ready for a narrow runtime packet, or is one more proof needed first?

## Output

Create:

```txt
workspace/EngineeringTraceHS393-actor-watch-runtime-redirect-readiness.md
```

Return:

- recommendation: ready / not ready / ready with constraints
- source trace findings
- exact files and functions implicated
- old behavior to preserve
- new boundary-owned route to call
- gaps and risks
- smallest next Dev packet, if ready
- acceptance criteria and verification commands

## Boundaries

Do not:

- implement runtime redirect
- invoke mixed collectors
- call zKill
- call ESI
- write Discovery refs
- write Evidence/EVEidence
- perform Hydration
- mutate Watch cadence/state
- change schema
- activate runtime enforcement
- edit renderer UI
- rename source terms
- update protected-word JSON

