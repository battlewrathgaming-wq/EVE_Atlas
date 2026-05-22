# Term: At-A-Glance Preview

## Plain Meaning

An at-a-glance preview is temporary zKill discovery context shown beside a queued killmail ref.

It helps a user decide whether a ref may merit ESI expansion.

## Examples

An at-a-glance preview may include lightweight fields such as:

- killmail time reported by zKill
- solar system ID, with local SDE label if available
- victim ship type ID
- victim character/corporation/alliance IDs, with local cached labels if available
- attacker count
- zKill value
- zKill points and simple flags when present

## Evidence Boundary

At-a-glance preview data is not evidence.

It must not create:

- killmails
- activity events
- actor observations
- system observations
- corporation observations

Only expanded ESI killmails can create evidence-backed observations.

## Why It Matters

The preview is like a picture on a book cover. It can help decide whether to open the book, but it is not the book.

In Atlas terms:

```txt
Preview helps select.
Expansion creates evidence.
Reports observe evidence.
```

## Missing Labels

Preview should use local labels when they are already available:

- SDE labels for systems and type IDs
- cached entity labels from local metadata

If a useful preview label is not available locally, do not perform live metadata hydration just to improve the preview.

Use the compact placeholder:

```txt
[Resolve with ESI]
```

This is not a button label and not a separate workflow. It means the authoritative information for that preview field becomes available by expanding the killmail through the existing ESI evidence pipeline.

The placeholder should be read as:

```txt
This preview cannot safely assert that label yet.
Full evidence comes from ESI killmail expansion.
```

Avoid preview wording such as:

- unresolved
- lookup failed
- hydrate
- resolve name

Those phrases either sound like errors or suggest a live metadata side path.

## Related Terms

- `manual-discovery.md`
- `discovery-queue.md`
- `evidence.md`
- `expanded-killmail.md`
