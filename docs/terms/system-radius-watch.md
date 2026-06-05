# Term: System Radius Watch

## Plain Meaning

A system radius watch observes activity in and around a chosen system.

Instead of manually tracking many systems, the user chooses a center system and a jump radius.

Example:

```txt
Center: ZTS-4D
Radius: 1 jump
```

Atlas uses local SDE stargate topology to find the nearby systems.

Radius scopes include the center system. A radius of 1 jump means the center system plus its direct neighbors.

Simple presentation:

```txt
System ZTS-4D with a radius of 1 jump:

Included systems:
- ZTS-4D (center)
- Neighbor 1
- Neighbor 2
```

The center system should appear first and be marked as the center. If a count is shown, label it as included systems, not neighbors. Direct neighbor counts exclude the center system and should be reserved for diagnostic or detail wording.

## Question It Answers

> Who is operating in and around this place?

## Why It Matters

EVE activity is spatial. Direct neighbors, pipes, chokepoints, and pockets matter.

A radius watch can reveal multi-system presence that a single-system watch might miss.

## Active Check State

Watch is active routine check behavior.

User-facing state should distinguish:

```txt
No watch -> Watched
```

Watched means there is an active check configuration or routine check relationship for the system/radius scope.

Operational watch behavior includes:

- watch scope
- lookback
- cadence
- blast radius
- live/API gate
- last checked
- next eligible check

User-facing status can then explain whether the watch is:

- unblocked / ready
- blocked by live/API gate
- blocked by session not armed
- blocked by backoff
- blocked because it is not due yet
- inactive

Blocked and unblocked are operator-facing status labels. They describe whether the active check can run now; they are not evidence conclusions.

## Relationship To Marked

The relationship is asymmetric.

```txt
Watch -> Marked
```

But not:

```txt
Marked -> Watch
```

If a system or area has been watched, it should also be Marked because Atlas has shown active interest or gathered attention around it.

Marked alone does not mean Atlas is actively collecting or refreshing evidence.

## What It Does Not Prove

A radius watch does not prove:

- staging
- ownership
- residency
- affiliation

It provides evidence for further investigation.
