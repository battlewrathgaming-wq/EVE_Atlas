# DevHS20: Operator Investigation Lead Ergonomics

Status: Complete
Date: 2026-05-23
Role: Dev
Milestone: Operator Investigation Desk

## Scope

Executed the HS20 runway in `workspace/current.md`: investigation first-screen lead-input ergonomics, validation, routing, empty states, and operator-facing feedback over existing resolver/service paths.

This packet did not add live/API behavior, backend resolver services, passive collection, evidence mutation, metadata hydration, assessment creation, or watch execution.

## Changes

- Added Investigation lead feedback for empty, invalid, unresolved, and route-specific states.
- Added actor type selection to the first-screen lead input.
- Routed primary lead actions through existing `scope.validate` before filling Scopes or Actions.
- Used existing local-SDE system resolution semantics through `scope.validate` for system/radius names.
- Improved actor/system/radius handoff into Scopes, Actions, Queue / Enrich, and Reports.
- Kept numeric actor/system IDs as durable facts and names as labels or resolver inputs.
- Updated renderer static verification for lead feedback, boundaries, and deferred input types.
- Updated Electron smoke to exercise empty lead feedback plus actor and system/radius routing in the real renderer.
- Updated current-state docs and `workspace/current.md` evidence/handoff.

## Evidence Covered

- Empty lead state explains that startup remains passive while typing.
- Invalid/deferred zKill link or killmail-ID paste input is blocked with explicit deferred-scope language.
- Actor lead feedback distinguishes durable IDs from names used as labels/resolver input.
- Actor reports require a durable actor ID; name-only actor leads are steered toward scope checks or manual discovery resolver input.
- System/radius names route through existing local-SDE scope validation, not zKill or ESI.
- Queue / Enrich filters are only prefilled when a durable discovery-scope ID is available.
- Discovery remains possible leads, not evidence.
- Enrich selected remains explicit ESI expansion into stored killmail evidence.
- Metadata hydration remains readability-only in the existing Reports surface.
- Assessment remains deliberate memory.
- Marked remains operator attention; Watch remains active routine checking; Watch implies Marked, but Marked does not imply Watch.

## Verification

```txt
npm.cmd run verify:renderer-shell
Result: passed
```

```txt
npm.cmd run smoke:electron
Result: passed
Artifact: .tmp/electron-visual-smoke/visual-smoke-result.json
Notable checks: investigation_empty_feedback=true; investigation_scope_route=true; investigation_action_route=true.
```

```txt
npm.cmd run verify:all
Result: passed
All verification group passed with 61 scripts.
```

Initial Electron smoke failed once because route cleanup cleared unrelated Scopes inputs. I fixed cleanup to target only the surface being filled, then reran `verify:renderer-shell`, `smoke:electron`, and `verify:all` successfully.

## Files Changed

```txt
src/renderer/index.html
src/renderer/investigation.js
src/renderer/app.js
src/renderer/styles.css
src/main/main.js
scripts/verify-renderer-shell.js
docs/current-state/current-ipc-ui-preparation.md
workspace/current.md
workspace/DevHS20-operator-investigation-lead-ergonomics.md
```

## Deferred

- Record drawer semantics.
- Intelligence/Finding naming.
- Pasted zKill links / killmail IDs.
- First-class region investigation.
- Battle timeline implementation.
- Relationship graph or footprint story implementation.
- Live success smoke.
- Evidence pruning/deletion.

## Recommended Next Packet

Proceed with Overseer review. A useful next bounded slice would be a stored-evidence investigation detail view or a tighter queue/enrich preflight from a validated lead, provided Human/Overseer keeps the scope inside existing doctrine and service paths.
