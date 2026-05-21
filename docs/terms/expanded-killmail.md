# Term: Expanded Killmail

## Plain Meaning

An expanded killmail is the full killmail record retrieved from ESI after zKill provides the `killmail_id` and hash.

It is the main source of truth for AURA Atlas.

## Simple Flow

```txt
zKill says: this killmail exists
ESI provides: the full expanded killmail
Atlas stores: the expanded killmail as evidence
```

## Why It Matters

The expanded killmail contains the fields Atlas needs:

- killmail ID
- killmail time
- solar system ID
- victim
- attackers
- character IDs
- corporation IDs
- alliance IDs
- ship type IDs
- weapon type IDs

## What It Is Not

An expanded killmail is not a final report.

It is raw evidence that reports and activity events are built from.

## Product Rule

Store expanded ESI killmails once. Recompute everything else from them.

