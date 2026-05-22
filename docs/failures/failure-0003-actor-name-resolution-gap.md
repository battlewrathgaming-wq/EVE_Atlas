# Failure 0003: Actor Name Resolution Workflow Gap

Date: 2026-05-22
Status: Guarded

## Observed Behavior

Actor workflows initially assumed that users would provide durable numeric IDs directly.

That matched the evidence model, but it did not match the human workflow. Users naturally enter names such as `Mr Jesterman` when creating actor watches, queue reports, actor reports, or watchlist entries.

## Root Cause

The project correctly treated IDs as the durable anchors for evidence and records, but over-applied that principle at the user input boundary.

Atlas had not fully modeled the stage where a human-facing label is resolved into the raw actor ID used for collection, reporting, queue inspection, and watchlist promotion.

## Architectural Lesson

ID anchoring and human name resolution are complementary principles.

Numeric IDs remain the evidence facts. Names are user inputs and cached display labels. AURA Atlas needs an explicit resolution stage that turns a typed actor name into a single durable ID before evidence workflows proceed.

## Resulting Invariant

Actor workflows that accept names must require an explicit actor type:

- `character`
- `corporation`
- `alliance`

Typed actor resolution must:

- resolve only within the requested actor type
- fail clearly when there are no matches for that type
- fail clearly when there are multiple matches for that type
- avoid untyped guessing between actors and systems
- return a durable numeric ID before collection or reporting continues
- cache resolved names as metadata labels only
- never replace, reinterpret, or remove evidence IDs

Once an actor is resolved, downstream workflows operate on IDs. Names remain presentation metadata.

## Detection / Test Coverage

The resolution gap is guarded by:

- `verify:actor-resolution`
- `verify:watchlist`
- actor report name-input verification
- queue report actor-name input behavior
- live actor runner support for `AURA_ATLAS_LIVE_ACTOR_NAME`

These checks should confirm that ID-based actor workflows still work and that typed names resolve to IDs before watch, report, queue, or watchlist behavior proceeds.

## Related Changes

- `src/main/resolution/actorResolver.js`
- `scripts/live-actor-watch-runner.js`
- `scripts/report-actor.js`
- `scripts/report-queue.js`
- `scripts/watch-add-entity.js`
- `docs/tenets/tenets.md`
- `docs/terms/actor-watch.md`
