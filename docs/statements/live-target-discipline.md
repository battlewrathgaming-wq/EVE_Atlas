# Live Target Discipline

Date: 2026-05-22

## Purpose

Live Atlas work should stay scoped, reviewable, and easy to stop.

The project is now capable enough that accidental broad collection is the main practical risk. Target selection is therefore part of API respect and evidence hygiene, not just operator preference.

## Guidance

Prefer known low or moderate activity targets for live smoke tests and first-pass operator checks.

Use disposable runtime databases under `.tmp` for smoke tests.

Set lookback windows and caps explicitly. Do not rely on defaults when proving a new live path.

Prefer discovery-only before expansion when exploring an unfamiliar target. zKill refs are possible evidence, not observations.

Keep ESI expansion caps global per run. Do not use per-system expansion caps by default for first-pass radius or area work.

Avoid trade hubs, high-volume chokepoints, and unusually active warzone systems for first-pass tests.

Preserve generated smoke artifacts, debug trace packs, run IDs, and DB paths in handoff notes.

## First-Pass Smoke Shape

For live smoke tests:

- explicit `AURA_ATLAS_LIVE_API=1`
- disposable DB under `F:\Projects\AURA-Atlas\.tmp`
- narrow target
- short lookback
- small ref cap
- zero or tiny global expansion cap depending on smoke purpose
- generated artifact or trace pack preserved

## Discovery Versus Expansion

Discovery-only smoke:

- calls zKill only
- queues refs only
- writes no `killmails`
- writes no `activity_events`
- makes no ESI killmail calls

Expansion smoke:

- starts from selected queued refs or a capped watch plan
- calls ESI only for selected uncached killmails
- writes expanded ESI killmails as evidence
- normalizes activity events from stored ESI evidence

Do not blur these two operations in operator language or UI wording.

## Boundary

Live target discipline does not weaken Atlas's evidence model.

The source of truth remains expanded ESI killmails. zKill is discovery. Queue refs are possible evidence. Observations are derived from stored killmail evidence.
