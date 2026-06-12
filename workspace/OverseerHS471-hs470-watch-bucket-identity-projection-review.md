# OverseerHS471 - HS470 Watch Bucket Identity Projection Review

Status: accepted  
Date: 2026-06-12  
Reviewed handoff: `workspace/DevHS470-watch-bucket-identity-projection.md`  
Expected runway: HS470 Watch bucket identity projection fixture proof

## Review Result

HS470 is accepted.

The implementation matches the requested fixture/projection-only posture. It proves Watch bucket identity rules without opening durable bucket schema, runtime writes, Discovery pickup, provider calls, Evidence/EVEidence movement, Hydration, Observation, dispatcher, queue, lease, enforcement, or UI.

## Accepted Evidence

New command:

```txt
watch.bucket_identity_projection.preview
```

Accepted behavior:

- due valid system/radius Watch with no existing open stub projects one candidate
- existing open stub for the same Watch suppresses a new candidate
- stale missed intervals collapse into one current candidate
- overlapping included systems across different Watches are allowed
- same Watch with mismatched existing open scope/provenance flags integrity conflict
- same `watch_run_id` with mismatched Watch/scope/window/provenance flags integrity error
- External I/O closed does not block Watch candidate projection
- invalid/not-due/inactive/backoff stubs emit no candidate
- candidate-ref / killmail overlap remains principle-only with no writes or provenance-table claim

## Verification

Commands run by Overseer:

```txt
npm.cmd run verify:watch-bucket-identity-projection
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
```

Result:

All passed.

Note:

`verify:service-registry` exceeded a 120s first attempt but passed when rerun alone with a longer timeout. Treat as verification duration/noisy stack concern, not an HS470 correctness blocker.

## Boundary Confirmation

Accepted with these boundaries:

- existing-open state is fixture input only
- projected candidates are not schema rows
- no `fetch_runs` as Watch bucket state
- no `discovered_killmail_refs` as pre-acquisition Watch bucket state
- no Watch cadence mutation
- no Discovery pickup or provider movement
- no Evidence/EVEidence writes
- no durable many-Watch provenance claim yet

## Next Seam

The next safest seam is a read-only bridge from projected Watch bucket candidates toward Discovery pickup hold/eligibility posture.

Purpose:

```txt
show how projected Watch bucket candidates would become eligible for Discovery pickup or be held by External I/O, without persisting bucket rows or starting Discovery/provider movement
```

This should remain read-only and fixture/projection-only. It should not become the durable bucket write fixture yet.

