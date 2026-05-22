# Term: Manual Discovery

## Plain Meaning

Manual discovery is a user-led zKill lookup that queues possible killmail evidence without expanding it through ESI.

It is the "look at the covers first" workflow.

## Expected Behavior

Manual discovery:

- calls zKill for scoped refs
- stores `killmail_id + hash` in the Discovery Queue
- may store at-a-glance preview metadata
- performs zero ESI expansion
- writes no killmails
- writes no activity events

The user later chooses what to expand through an explicit manual expansion step.

## What It Is Not

Manual discovery is not an actor watch.

Manual discovery is not a system watch.

Manual discovery is not evidence collection by itself.

It creates possible-evidence queue entries, not observations.

## Why It Matters

ESI expansion has a cost. Manual discovery lets a user inspect what exists before spending expansion calls.

This keeps Atlas respectful of APIs while preserving the evidence rule:

```txt
zKill can suggest what may be worth opening.
ESI expanded killmails remain the evidence.
```

## Related Terms

- `discovery-queue.md`
- `at-a-glance-preview.md`
- `collection-provenance.md`
- `expanded-killmail.md`
