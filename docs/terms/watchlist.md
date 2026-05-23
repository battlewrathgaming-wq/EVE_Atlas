# Term: Watchlist

## Current Status

Watchlist is legacy/internal wording for what should be user-facing as Marked.

Use user-facing language:

```txt
Marked = operator interest / tag / record attention
Watch = active routine check behavior
```

## Plain Meaning

A watchlist row currently means:

> This actor is marked for attention.

In product language, this should be presented as Marked, not as proof that an active watch is running.

## What It Stores

A watchlist row stores the durable actor key:

- entity type: character, corporation, or alliance
- entity ID
- cached display name, if known
- optional operational preferences used when creating or running a watch, such as lookback days and caps
- notes

The ID is the fact. The name is a label.

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

If something has been watched, it should become Marked because Atlas has shown active interest or gathered attention around it.

Marked does not imply Watched.

## What It Does Not Do

A Marked/watchlist entry does not prove hostile intent.

It does not prove affiliation, staging, ownership, or residency.

It does not mutate killmail evidence or activity events.

It does not automatically collect, discover, enrich, expand, hydrate, or assess anything.

## Product Rule

In user-facing UI and docs, prefer Marked/Mark over Watchlisted/watchlist when the meaning is operator interest.

Reserve Watch/Watched for active routine checking.
