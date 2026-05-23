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
- cadence or next eligible check when scheduled
- live/API gate state

The lookback window is the discovery scope.

The expanded killmail set is the stored evidence sample.

## Active Check State

Watch is active routine check behavior.

User-facing state should distinguish:

```txt
No watch -> Watched
```

Watched means there is an active check configuration or routine check relationship.

User-facing status can then explain whether the watch is:

- unblocked / ready
- blocked by live/API gate
- blocked by session not armed
- blocked by backoff
- blocked because it is not due yet
- inactive

Blocked and unblocked are operator-facing status labels. They describe whether the active check can run now; they are not evidence conclusions.

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

## Relationship To Marked

The relationship is asymmetric.

```txt
Watch -> Marked
```

But not:

```txt
Marked -> Watch
```

If an actor is watched, it should also be Marked because Atlas has shown active interest or gathered attention around it.

Marked alone does not mean Atlas is actively collecting or refreshing evidence.
