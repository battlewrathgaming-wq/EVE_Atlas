# Term: Actor Watch

## Plain Meaning

An actor watch is a scoped lookback collection for a character, corporation, or alliance.

It asks:

> What killmail evidence do we have or choose to collect for this actor within this time window?

## Collection Shape

```txt
actor + lookback window + caps
-> zKill discovery refs
-> dedupe globally
-> skip cached killmails
-> expand selected ESI killmails
-> store evidence
-> derive reports
```

## Scope

Actor watches are bounded by explicit settings:

- actor type and ID
- lookback window
- max refs
- max expansions per run

The lookback window is the discovery scope.

The expanded killmail set is the stored evidence sample.

## What It Can Support

An actor watch can support reports about observed killmail behavior:

- attacker and victim appearances
- systems and regions observed
- ships used or lost
- activity cadence
- first and last observed in the sample
- repeated associated corps, alliances, or pilots

## What It Cannot Claim

An actor watch does not show current location.

It does not show online status.

It does not prove staging, ownership, affiliation, or intent.

It only describes stored killmail evidence within the selected scope.

## Relationship To Watchlist

An actor may be watchlisted before an actor watch is run.

That means the actor is interesting enough to remember.

Running an actor watch means Atlas is now gathering or refreshing scoped evidence for that actor.
