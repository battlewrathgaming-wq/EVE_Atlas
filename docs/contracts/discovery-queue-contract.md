# Contract: Discovery Queue

Status: Active
Date: 2026-05-22

## Purpose

The Discovery Queue stores possible killmail evidence discovered through zKill before, during, or after ESI expansion.

It is staging and collection provenance metadata. It is not killmail evidence.

## Boundary

Owned by:

- `discovered_killmail_refs`
- queue preflight/reporting
- collection workers that discover or drain refs

## Inputs

- `killmail_id`
- `zkb.hash`
- discovery scope such as `actor`, `system_radius`, `manual_actor`, `manual_system`, or `manual_radius`
- source actor/system fields where available
- optional at-a-glance preview for manual discovery

## Outputs

- queued refs with status
- queue reports
- provenance lines in observation reports
- selected refs for ESI expansion

## Invariants

- Queue refs are not evidence.
- Queue refs must not create `killmails`.
- Queue refs must not create `activity_events`.
- Queue entries may explain how evidence was found.
- Queue status must distinguish `pending`, `expanded`, `cached`, `failed`, and `superseded`.
- Manual discovery queue scopes must not be silently drained by routine actor/system watch runs.

## Must Not Do

- Do not derive actor/system/corporation observations from queue rows.
- Do not treat zKill preview data as evidence.
- Do not inflate report counts from pending refs.

## Verification

- `verify:queue-report`
- `verify:queue-preflight`
- `verify:manual-discovery`
- `verify:db-integrity`

