# Term: Watchlist

## Plain Meaning

A watchlist record means:

> This actor is interesting enough to remember.

It is a user or analyst assessment layered over stored evidence.

## What It Stores

A watchlist record stores the durable actor key:

- entity type: character, corporation, or alliance
- entity ID
- cached display name, if known
- collection preferences such as lookback days and caps
- notes

The ID is the fact. The name is a label.

## What It Does

The watchlist helps Atlas remember actors that deserve future attention.

It can affect presentation:

- show a `Watchlisted` marker in reports
- sort or highlight remembered actors
- provide candidates for later actor-watch collection

## What It Does Not Do

A watchlist entry does not prove hostile intent.

It does not prove affiliation, staging, ownership, or residency.

It does not mutate killmail evidence or activity events.

It does not automatically mean Atlas is actively collecting new evidence for that actor.

## Relationship To Actor Watch

```txt
watchlist = interesting, remember this actor
actor watch = scope and run evidence collection for this actor
```

The watchlist is the assessment record.

The actor watch is the collection operation.
