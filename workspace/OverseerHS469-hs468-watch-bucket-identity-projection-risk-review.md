# OverseerHS469 - HS468 Watch Bucket Identity Projection Risk Review

Status: accepted  
Date: 2026-06-12  
Reviewed artifact: `workspace/EngineeringRiskHS468-watch-bucket-identity-projection.md`  
Request: `workspace/OverseerHS468-watch-bucket-identity-projection-risk-check-request.md`

## Review Result

HS468 is accepted.

The advisory answered the requested practical risk check without widening into broad architecture design. It supports the next seam:

```txt
read-only Watch bucket identity projection
```

No ADR amendment is needed before that proof.

## Accepted Direction

Open a narrow Dev runway for a fixture/projection-only proof that answers:

- would a due Watch produce a projected bucket candidate?
- would an existing open stub for the same Watch suppress new emission?
- do missed intervals collapse into one current candidate?
- is overlapping system scope across different Watches allowed?
- are same-Watch mismatches and same-`watch_run_id` mismatches flagged?
- does External I/O remain a Discovery/provider pickup hold, not a Watch emission failure?

The proof must not imply schema acceptance.

## Guardrails To Carry Forward

- Existing-open bucket state is fixture input only.
- Output labels should use projected/candidate/fixture language.
- Do not use `fetch_runs` as a Watch bucket.
- Do not use `discovered_killmail_refs` as a pre-acquisition Watch bucket.
- Do not call Watch executor ticks, TaskRunner, collectors, Discovery pickup, zKill, ESI, or Evidence writers.
- Do not mutate Watch cadence, Watch rows, Discovery refs, Evidence/EVEidence, Hydration, Observation, dispatcher, queue, lease, enforcement, or UI.
- Keep `held_by_external_io` / External I/O as provider movement posture after Watch emission, not Watch-owned emission state.

## Required Fixture Cases

The next proof should include the HS468 fixture set, at minimum:

1. Due valid system/radius Watch, no existing open stub: emits one projected candidate.
2. Due valid system/radius Watch, existing open stub for same Watch: emits no candidate and reports duplicate-open suppression.
3. Stale Watch with multiple missed intervals: emits one current candidate only.
4. Two different Watches with overlapping included systems: both may emit independent candidates.
5. Same Watch with mismatched existing open scope/provenance: flags integrity conflict.
6. Same `watch_run_id` with mismatched Watch/scope/window/provenance: flags integrity error.
7. External I/O closed: candidate remains possible, provider packets remain zero, Discovery pickup is not started.
8. Invalid stored scope: emits no candidate before bucket/Discovery/provider/Evidence surfaces.
9. Not due/inactive/backoff Watch: emits no candidate.
10. Candidate ref / killmail overlap: demonstrates principle only, without writes or provenance-table claims.

## Next Packet

Open HS470 as a Dev fixture/projection proof.

Expected handoff:

```txt
workspace/DevHS470-watch-bucket-identity-projection.md
```

