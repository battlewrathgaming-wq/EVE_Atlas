# Gap To-Do: Scoped Discovery UI Path Decision

Status: Complete
Roadmap: `docs/roadmap/evidence-safe-assessment-and-discovery-ux.md`

Completed: 2026-05-22

## Task Requirement

Decide how the renderer exposes discover-refs-only system/radius work now that local system resolution and scoped zKill route construction are hardened.

## Why It Matters

The backend contract is now clear:

```txt
system name or ID
-> local SDE topology
-> scoped zKill pastSeconds route
-> queued refs only
-> zero ESI expansion
```

The UI should make that path available without making queued refs look like evidence.

## Actionables

- Decide whether to expose this through the existing Actions pane or a more focused System/Radius discovery control.
- Reuse `manual.discovery` rather than adding a new renderer-owned path.
- Require visible live confirmation.
- Show queued refs, cap/window, live gate, and preview metadata as discovery/provenance only.
- Keep expansion as a separate explicit action.

## Guardrails

- Do not auto-expand queued refs.
- Do not call zKill from renderer.
- Do not call ESI during discovery-only action.
- Do not render preview values as observations.

## Completion Signal

- Operator can run system/radius discovery-only work from the renderer or the decision to defer is documented.
- Queue preview language remains non-evidence.
- `npm.cmd run verify:renderer-shell` and `npm.cmd run verify:all` pass.

## Decision

Expose scoped system/radius discover-refs-only work through the existing Actions pane.

Rationale:

- `manual.discovery` already owns the correct backend behavior
- the Actions pane already has live gate preflight, confirmation, and detached task execution
- adding a separate renderer-owned path would duplicate control flow and risk hidden collection behavior

## Completion Notes

Implemented:

- Actions pane now includes Center System Name for manual discovery
- renderer passes `centerSystemName` to backend validation/resolution
- `scope.validate` resolves system names locally when DB context is available
- `manual.discovery` service resolves system names locally before queue-only discovery
- preflight copy explicitly says queued refs and preview values are not observations until ESI expansion succeeds

Still true:

- renderer does not call zKill
- renderer does not call ESI
- manual discovery queues refs only
- manual expansion remains a separate explicit Queue / Watches action
- zKill preview fields remain discovery/provenance metadata, not evidence or observation

Verified:

- `npm.cmd run verify:service-registry`
- `npm.cmd run verify:renderer-shell`
- `npm.cmd run verify:scope-controls`

## Related Files

- `src/renderer/actions.js`
- `src/renderer/queueWatch.js`
- `src/main/workers/manualDiscoveryWorker.js`
- `src/main/api/zkillClient.js`
- `docs/features/ui-trigger-and-scope-map.md`
