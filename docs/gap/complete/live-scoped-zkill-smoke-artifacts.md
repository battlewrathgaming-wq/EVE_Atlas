# Gap To-Do: Live Scoped zKill Smoke Artifacts

Status: Complete
Roadmap: `docs/roadmap/evidence-safe-assessment-and-discovery-ux.md`

Completed: 2026-05-22

## Task Requirement

Improve the live scoped zKill smoke harness so failures and successful discovery-only runs leave structured artifacts.

## Why It Matters

Live smoke is intentionally separate from offline verification. When it is run, it should produce enough context for Overseer review without needing to reconstruct terminal output.

## Actionables

- Write structured JSON output under `F:\Projects\AURA-Atlas\.tmp`.
- Include refusal behavior when `AURA_ATLAS_LIVE_API=1` is missing.
- Include DB path, SDE/topology readiness, resolved system, route, lookback, caps, API counts, queued refs, and evidence counts.
- Explicitly record that no ESI expansion occurred.
- Preserve the current local-SDE-only resolver requirement.

## Guardrails

- Do not import SDE zip during live runtime collection unless an explicit disposable smoke script is created for that purpose.
- Do not expand ESI killmails.
- Do not write activity events.
- Do not include raw zKill payload dumps in artifacts.

## Completion Signal

- Live smoke refusal and success paths both produce reviewable output.
- The output states discovery refs are possible evidence, not evidence.
- Live smoke remains excluded from `verify:all`.

## Completion Notes

`verify:live-scoped-zkill` now writes structured artifacts under:

```txt
F:\Projects\AURA-Atlas\.tmp\live-scoped-zkill-smoke
```

Files:

- `latest.json`
- `scoped-zkill-refused.json`
- `scoped-zkill-failed.json`, when a live/preflight failure occurs after DB open
- `scoped-zkill-scoped_zkill_live_discovery_verified.json`, when a live discovery succeeds

Artifacts include:

- DB path when available
- topology readiness
- evidence counts
- resolved system
- route
- lookback/caps
- live gate estimate
- zKill/ESI API counts
- queued ref count and a small ID/time sample
- explicit `no_esi_expansion_occurred`
- non-evidence boundary wording

Artifacts do not include raw zKill response bodies.

Verified locally:

- refusal path writes `latest.json`
- refusal artifact records missing `AURA_ATLAS_LIVE_API=1`
- boundary text states queued refs and zKill previews are not killmail evidence

Live success remains gated and was not run during this offline completion pass.

## Related Files

- `scripts/verify-scoped-zkill-live.js`
- `scripts/verify-live-group.js`
- `scripts/live-system-watch-runner.js`
