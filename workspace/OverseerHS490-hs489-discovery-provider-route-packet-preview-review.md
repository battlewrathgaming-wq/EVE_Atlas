# OverseerHS490 - HS489 Discovery Provider Route Packet Preview Review

Status: accepted
Date: 2026-06-12
Role: Overseer

Reviewed handoff:

```txt
workspace/DevHS489-discovery-provider-route-packet-preview.md
```

Runway:

```txt
workspace/OverseerHS489-discovery-provider-route-packet-preview-runway.md
```

## Review Result

HS489 is accepted after one small route-shape correction during review.

Atlas now has a read-only, inert zKill provider-route packet preview from selected Discovery pickup candidates.

Boundary held:

- one accepted included system ID yields one inert route packet preview
- Watch ID, `watch_run_id`, bucket item ID, accepted scope, system ID, window, caps, provenance, and source selection basis are preserved
- center/radius remains provenance/explanation only, while stored included system IDs remain execution authority
- held, rejected, not-input, actor, non-open, and malformed/missing-scope rows produce no route packets
- overlapping Watch scopes remain independent route packet previews
- renderer-supplied selected candidates are not authoritative
- no Discovery pickup execution, pickup units, leases, queues, dispatcher runtime, provider calls, zKill/ESI calls, executable provider packets, candidate refs, Discovery refs, Evidence/EVEidence, Hydration, Observation, Watch cadence mutation, bucket status mutation, receipt mutation, schema changes, enforcement, or UI

## Correction Made During Review

The route template placeholders and parameter object now match:

```txt
{system_id}
{past_seconds}
path_parameters.system_id
path_parameters.past_seconds
```

This keeps the preview self-consistent without changing its read-only/non-executing boundary.

## Verification

Passed:

```txt
node --check src\main\services\discoveryProviderRoutePacketPreviewService.js
node --check scripts\verify-discovery-provider-route-packet-preview.js
npm.cmd run verify:discovery-provider-route-packet-preview
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
npm.cmd run verify:service-registry
git diff --check
git diff -- src\main\db\schema.sql
```

Evidence:

- focused verifier produced `selected_candidate_count: 3`
- focused verifier produced `provider_route_packet_preview_count: 5`
- external I/O off produced zero selected route packets and held rows before route-packet preview
- focused verifier showed zero provider calls, zKill calls, ESI calls, pickup units, leases, queue items, candidate refs, Discovery refs, Evidence/EVEidence writes, Hydration writes, Observation creation, Watch cadence mutation, bucket status mutation, receipt mutation, and schema changes
- `git diff --check` returned exit code 0 with CRLF normalization warnings only
- `git diff -- src\main\db\schema.sql` returned no diff

## Accepted State

HS489 proves provider-route packet preview shape only.

It does not open live provider movement, Discovery pickup execution, dispatcher runtime, candidate-ref persistence, Discovery-ref persistence, Evidence/EVEidence writes, Watch cadence completion, receipt persistence, UI, actor Watch migration, or collector retirement.

## Recommended Landing

Rest at a stable boundary before the next seam.

Likely next choices, when motion resumes:

- no-provider pickup execution boundary proof
- dispatcher/lease boundary proof
- Discovery candidate-ref landing proof

Do not open live zKill/ESI movement until the provider-route packet shape, pickup execution boundary, and persistence/receipt boundaries are all explicit.
