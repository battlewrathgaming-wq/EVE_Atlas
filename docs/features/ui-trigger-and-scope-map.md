# Feature: UI Trigger And Scope Map

Status: Implemented foundation; rugged testing remains active
Updated: 2026-05-23

## Purpose

This document maps user-visible UI actions to backend-owned scopes and services.

The UI may initiate explicit actions, but it must not become evidence authority.

## Current UI Action Categories

### Readiness And Support

User intent:

- inspect runtime readiness
- inspect corpus health
- create debug trace pack
- preflight or create runtime DB snapshot

Rules:

- readiness and corpus health are read-only
- snapshot create is explicit
- trace pack is support data, not evidence
- no live API calls

### Manual Discovery

User intent:

- discover possible killmail refs for a scoped actor/system/radius

Backend behavior:

- validate scope
- check live gate
- call zKill only
- write `discovered_killmail_refs`
- write no `killmails`
- write no `activity_events`

### Manual Expansion

User intent:

- expand selected queued refs into evidence

Backend behavior:

- validate queue selection
- check live gate
- call ESI for selected refs under cap
- store expanded killmails once
- normalize activity events
- update queue state

### Watch Authoring

User intent:

- define actor or system/radius watch intent

Backend behavior:

- metadata-only watch creation/update
- no collection during authoring
- collection only through explicit manual action or session-armed executor

### Session-Armed Watch Execution

User intent:

- allow due watches to run for the current session

Backend behavior:

- volatile arm/disarm state
- live gate required
- task-backed execution
- at most controlled due-watch dispatch
- no arming on page load

### Reports And Hydration

User intent:

- load observation reports
- hydrate report-scoped labels for readability
- create deliberate assessment artifacts

Backend behavior:

- reports read stored evidence
- hydration is metadata-only and live-gated where needed
- assessments require explicit save/reason/citation path

## Scope Rules

- System names resolve through local SDE lookup first.
- Actor resolution requires explicit actor type where ambiguity matters.
- Reports scope by evidence subject and time window, not collection route.
- Lookback, radius, ref caps, system caps, and expansion caps must be visible before live work.

## Must Not Do

- Run collection from passive view load.
- Expand queue refs automatically.
- Call zKill or ESI directly from renderer.
- Hide live gates behind UI convenience.
- Use zKill previews as observations.
- Treat assessment artifacts as evidence input to reports.

Related docs:

- `docs/contracts/scope-definition-contract.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `docs/terms/manual-discovery.md`
- `docs/terms/work-products.md`
