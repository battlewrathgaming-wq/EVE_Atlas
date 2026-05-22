# Discovery Queue

The Discovery Queue is AURA Atlas's local staging area for killmail references found through zKill discovery.

It stores:

```txt
killmail_id + hash
```

plus local provenance such as the scope that found the ref, when it was found, and whether Atlas has expanded it through ESI yet.

## Why It Exists

zKill is used to discover that a killmail exists.

ESI is used to retrieve the expanded killmail evidence.

The Discovery Queue lets Atlas remember refs that were already discovered, so later runs can continue expanding them through ESI without asking zKill for the same refs again.

This supports the project rule:

```txt
API at the point of need.
```

## Expected Behavior

A normal collection flow is:

```txt
zKill discovery finds refs
-> Atlas stores refs in the Discovery Queue
-> Atlas expands a capped number through ESI
-> remaining refs stay pending
-> later runs drain pending refs through ESI
-> zKill is not called again while useful pending refs exist for that scope
```

Example:

```txt
20 refs discovered
11 already cached
2 expanded now
7 pending

next run:
0 zKill calls
2 ESI expansions from pending refs
```

## Status Meanings

- `pending`: discovered but not expanded yet
- `expanded`: expanded ESI killmail is now stored as evidence
- `cached`: the expanded killmail was already stored when the ref was discovered
- `failed`: the last ESI expansion attempt failed
- `superseded`: retained for audit, but no longer active for expansion

## What It Is Not

The Discovery Queue is not killmail evidence.

It is not activity evidence.

It is not an intelligence report.

It must not inflate activity counts, actor counts, system counts, or ship counts.

Only expanded ESI killmails and normalized activity events can support evidence reports.

## Why It Matters

The Discovery Queue makes collection more respectful and explainable:

- fewer repeated zKill calls
- clear pending work before spending ESI calls
- better run diagnostics
- resumable capped collection
- visible separation between discovery and evidence

The queue helps Atlas remember what it has discovered, while preserving the rule that tactical and historical claims come only from expanded ESI evidence.

## Related Terms

- `collection-provenance.md`
- `expanded-killmail.md`
- `evidence.md`
- `actor-watch.md`
- `system-radius-watch.md`
