# Feature: UI Trigger And Scope Map

Status: Active
Date: 2026-05-22

## Purpose

This document lists current CLI capabilities that will likely need UI controls before or during the first read-only UI pass.

It does not define visual design. It identifies user intent, inputs, and expected backend trigger.

## User Value

The UI should let users define evidence scopes, run controlled collection actions, inspect queue state, and read observation products without turning UI state into authority.

## Likely UI Triggers

### System / Radius Scope

User inputs:

- center system name or ID
- radius jumps
- lookback window
- max systems
- max refs per system
- max expansions

Backend actions:

- dry-run radius plan
- routine system radius watch collection
- manual radius discovery
- radius report
- system report
- operator report

### Actor Scope

User inputs:

- actor type: character, corporation, or alliance
- actor name or ID
- lookback window
- max refs
- max expansions

Backend actions:

- typed actor resolution
- actor watch collection
- manual actor discovery
- actor report
- metadata readiness
- scoped hydration

### Corporation Observation

User inputs:

- corporation name or ID
- evidence window
- optional hydration action

Backend actions:

- corporation report
- corporation metadata readiness
- report-scoped hydration
- optional actor watch for the corporation

### Discovery Queue

User inputs:

- queue scope type
- queue scope ID
- status filter
- max rows
- selected killmail IDs or scope expansion cap

Backend actions:

- queue report
- queue preflight
- manual expansion

### Metadata Readiness

User inputs:

- report scope
- hydrate yes/no

Backend actions:

- metadata readiness report
- report-scoped hydration
- metadata status report

### Diagnostics / Audit

User inputs:

- run ID
- report scope

Backend actions:

- run report
- API request log review
- evidence/provenance footer display

## Scope Definition Rules

- System scope should resolve from local SDE first.
- Actor scope must require explicit actor type before resolving names.
- Manual discovery scope must be explicit: actor, system, or radius.
- Manual discovery should default to zero ESI expansion.
- Routine watches may expand automatically, but only under visible global caps.
- User-facing controls should expose lookback window, ref caps, expansion caps, and radius/system caps before live collection.
- Evidence reports should filter by evidence scope and time, not collection route.
- Collection provenance should remain visible but secondary.

## Must Not Do

- Do not let UI state create evidence.
- Do not use zKill previews as observations.
- Do not hide ingestion because an entity is friendly, ignored, or not watchlisted.
- Do not run live collection without an explicit user action and live gate.

## Related Documents

- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/scope-definition-contract.md`
- `docs/contracts/report-scope-contract.md`
- `docs/terms/manual-discovery.md`
- `docs/terms/at-a-glance-preview.md`
