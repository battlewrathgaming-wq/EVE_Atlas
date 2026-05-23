# Complete: Scope Controls Contract

Status: Complete For IPC Shell Preparation

## Actionables

- Define scope controls that map directly to evidence filters.
- Support time windows as first-class controls.
- Define system, radius, actor, region/constellation, role, disposition, and ship/type filters.
- Ensure combined filters narrow evidence scope predictably.
- Show selected scope in report headers/footers.

## Task Requirements

UI controls should behave like slicers over stored evidence.

Potential controls:

- system
- radius
- actor
- corporation/alliance
- region
- constellation
- time window
- attacker/victim role
- ship group/category
- disposition
- watchlist membership

## Guardrails

- Controls must not silently change analytical meaning.
- UI filters must not mutate evidence.
- Collection provenance should not be used as evidence scope except in run reports.

## Completion Signal

Each UI scope control has a clear mapping to backend query/report parameters.

## Current Implementation

- Shared backend scope defaults and validation exist.
- `scope.defaults` service command exposes defaults through the IPC service shell.
- `scope.validate` service command normalizes and validates user-defined scopes without running collection.
- Verified through `verify:scope-controls` and `verify:service-registry`.

## Remaining Follow-On Work

- Renderer controls still need to map to the service command payloads.
- Region, constellation, role, disposition, and ship/type report filters remain future UI/report scope work.
