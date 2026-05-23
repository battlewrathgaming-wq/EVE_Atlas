# Term: Marked

## Plain Meaning

Marked means:

> The operator wants Atlas to keep attention on this thing.

A marked item can be a character, corporation, alliance, system, place, or future intelligence record.

## Interest State

Marked is an interest state.

```txt
Unmarked -> Marked
```

Sources of Marked:

- the operator manually marks it
- an active watch includes it
- a watched scan produces relevant discovery
- an assessment or intelligence record exists for it

## Relationship To Watch

The relationship is asymmetric.

```txt
Watch -> Marked
```

But not:

```txt
Marked -> Watch
```

If Atlas actively watches something, that thing should also be treated as marked because Atlas has active interest or gathered attention around it.

Marked does not mean Atlas is actively checking it.

## What Marked Does Not Do

Marked does not:

- call zKillboard
- call ESI
- discover refs
- enrich or expand killmails
- hydrate metadata
- create assessment artifacts
- create or run a watch

Marked is attention, not collection.

## User-Facing Rule

Use Marked for operator interest, tagging, and record attention.

Use Watch only for active routine check behavior.
