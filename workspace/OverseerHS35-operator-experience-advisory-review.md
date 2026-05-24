# OverseerHS35: Operator Experience Advisory Review

Date: 2026-05-24
Role: Overseer
Reviewed artifacts:

- `workspace/UIUXHS34-operator-experience-story-pass.md`
- `workspace/archive/terminology-bridge-audit-2026-05-24-unaccepted.md`
- `workspace/current.md` specialist evidence update

## Decision

Accepted the UI/UX story pass as advisory input.

Correction:

The terminology bridge audit was initially treated as durable advisory evidence, but this was withdrawn by Human correction. It is now parked as unaccepted advisory material:

```txt
workspace/archive/terminology-bridge-audit-2026-05-24-unaccepted.md
```

Do not send Dev directly from these artifacts. The correct next step is a screen-level presentation specification that integrates the UI/UX stories with current backend/service boundaries while leaving terminology authority unsettled.

## Accepted Inputs

- Investigation should become the primary operator path, not Readiness or Scopes.
- Readiness should move toward diagnostics/settings framing.
- Scopes should become progressive refinement after a lead/action exists.
- Queue refs should present as possible leads until ESI expansion.
- `Enrich selected` must remain the explicit ESI expansion step that creates stored killmail evidence.
- Metadata hydration remains readability-only. Any user-facing label such as `Refresh labels` remains provisional unless separately accepted through terminology authority.
- `Power on live lookups` is acceptable as a provisional presentation affordance only; it must not trigger live/API calls or weaken per-action preflights.
- Raw IDs, queue keys, service counts, run/task IDs, API logs, backend defaults, and normalized payloads should remain available as detail/diagnostic surfaces, not first-path burdens.
- Marked/Watch asymmetry remains binding.
- Evidence deletion/pruning remains blocked.

## Deferred Or Rejected

- Rejected: direct broad Dev implementation from the UI/UX handoff.
- Deferred: final `Record`, `Intelligence`, `Finding`, or final Assessment naming.
- Deferred: zKill link / killmail ID entry as a first-class input.
- Deferred: relationship graph, map rendering, fight clustering, AI commentary, shared/Lab doctrine adoption, and public release work.
- Deferred: terminology audit authority, broad code/database/service renames, and bridge aliases from the parked terminology audit.
- Deferred: any deletion/retention implementation beyond read-only preview and explicit assessment artifact creation.

## Next Packet

`workspace/current.md` now requests:

```txt
UIUXHS36-operator-intel-console-presentation-spec.md
```

The packet is still non-code. It should produce a screen-level specification and future Dev acceptance checks, not implementation.
