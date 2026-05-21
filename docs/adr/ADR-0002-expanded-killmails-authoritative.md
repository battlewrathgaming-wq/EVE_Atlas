# ADR-0002: Expanded ESI Killmails Are Authoritative Evidence

Status: Accepted
Date: 2026-05-21

## Context

AURA Atlas needs durable, auditable, rebuildable intelligence records. UI summaries, zKill payloads, and AI commentary cannot serve as evidence.

## Decision

Expanded ESI killmail payloads are the authoritative killmail evidence for Atlas.

The full expanded payload is stored once, and normalized activity events are derived from it.

## Consequences

Reports can be rebuilt from stored evidence.

Hydration, labels, dispositions, AI commentary, and derived analytics remain layered on top of evidence.

Collection must dedupe and cache killmails by `killmail_id` before expansion.

## Alternatives Considered

- Persist only normalized events: rejected because raw evidence would be unavailable for audit or re-normalization.
- Persist only report summaries: rejected because summaries cannot be reliably rebuilt or inspected.

## Related Documents

- `docs/tenets/tenets.md`
- `docs/schemas/killmail-evidence.md`
- `docs/schemas/activity-event.md`

