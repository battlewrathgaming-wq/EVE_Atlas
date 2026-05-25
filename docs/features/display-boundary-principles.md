# Display Boundary Principles

Date: 2026-05-25
Status: Current product guidance

## Purpose

Atlas display work must preserve source meaning while reducing interface overload.

This document records the product principles behind the user-facing display inventory and future Lab display requests. It is not a renderer implementation packet, Lab adoption record, bridge contract, payload schema, or terminology rename.

## Core Diagnosis

Atlas became visually heavy when programmatic evidence, runtime metadata, provenance, controls, and operator intention all appeared at the same display layer.

The issue is not that these facts are unimportant. Atlas is an evidence workstation, so many backend and provenance facts are valuable. The issue is that not every valuable fact belongs on the first face or at the same visual weight.

## Display Roles

Classify visible information by display role before deciding whether to declutter, collapse, move, hide, or send it to Lab.

| Display role | Meaning | Default stance |
| --- | --- | --- |
| `operator-intent` | What the operator is trying to do now. | First face / primary workflow. |
| `evidence-fact` | Stored Atlas Evidence: expanded ESI killmails and derived activity events. | Evidence/provenance surfaces; overview summaries only. |
| `discovery-candidate` | Possible leads before evidence creation. | Possible Leads / queue surfaces; never display as Evidence. |
| `provenance` | Why an item exists, where it came from, when, and from what run/action. | Drawer/detail surface; point-of-need in overview. |
| `runtime-state` | Task, API, SQLite, SDE, readiness, and service state. | Compact trust/status or diagnostics. |
| `action-control` | Explicit operator command, preflight, or confirmation. | Point-of-need, action-adjacent. |
| `assessment-judgment` | Deliberate saved operator judgment with citation context. | After evidence/report context; not evidence. |
| `diagnostic-support` | Debug, support, raw IDs, service counts, task IDs, traces. | Settings/Diagnostics or support surfaces. |

## Layering Rules

- Operator intent belongs in the first face.
- Evidence facts belong in evidence/provenance surfaces.
- Discovery candidates belong in possible-lead and queue surfaces.
- Runtime metadata belongs in compact status/trust readouts or diagnostics.
- Operational controls appear at point of need.
- Assessment judgment appears after evidence/report context.
- Diagnostics stay available but should not narrate the main investigation story.

## Meaning Boundaries

These Atlas boundaries are source-owned and must survive display work:

- `Evidence` is stored expanded ESI killmail data and Atlas-derived activity events.
- `Discovery` is possible leads before evidence creation.
- `Possible Leads` are Discovery output, not Evidence.
- `Observation` is report-layer meaning derived from stored Atlas Evidence.
- `Assessment Memory` is deliberate saved operator judgment, not evidence.
- `Watch` is active routine checking.
- `Marked` is attention or interest; Marked does not imply Watch.
- `Enrich selected` is explicit ESI expansion into stored evidence.
- `Refresh labels` is readability-only metadata hydration.
- `External API` represents provider availability/gate state unless Atlas later accepts a translation.

## Declutter Rule

Do not blindly remove information.

First classify each visible item:

1. What does it mean?
2. What data or runtime state does it come from?
3. What decision does it help the operator make?
4. Is it needed now, at point of need, in provenance/detail, or only in diagnostics?

Then choose whether to keep, collapse, move, hide, or ask Lab for display comparison.

## Point-Of-Need Rule

Show safety, evidence, provider, and provenance detail when it affects an operator decision.

Otherwise consolidate it into tidy status, badges, details, drawers, or diagnostic surfaces.

Examples:

- Live/API effect belongs beside an action that can call the provider.
- Evidence basis belongs near evidence interpretation.
- Raw IDs belong near disambiguation, provenance, export, or diagnostics.
- Task IDs belong in diagnostics unless a task is actively blocking the operator.

## Metadata Envelope Pattern

Atlas may use a subdued top-of-page metadata envelope to show the computational nature of the platform without turning the first face into a configuration panel.

The envelope is a presentation pattern, not a new backend concept or contract.

It should summarize machine/platform state such as:

- External API: disabled, enabled, checking, blocked, or unavailable.
- Local memory: loaded, partial, stale, or unavailable.
- Watch timing: idle, due, blocked, armed, running, last checked, or next eligible.
- Queue state: no possible leads, possible leads pending, needs review, or unavailable.
- Evidence basis: stored context available, stale, not loaded, or unavailable.
- Runtime confidence: ok, warning, degraded, or diagnostic detail available.

The envelope should answer:

```txt
What mode is Atlas in right now?
```

The main page should still answer:

```txt
Who or what are we investigating, and what can the operator do next?
```

Guardrails:

- Keep labels sparse and instrument-like.
- Use muted color state, not loud alert panels.
- Reveal fuller diagnostic detail only on hover, click, drawer, or route.
- Do not let the envelope become the workflow.
- Do not imply live/API collection unless existing External API gates and operator actions allow it.
- Do not blur Evidence, Discovery, Watch, Marked, or Assessment Memory.

## Relationship To Lab

Lab may compare Bridge -> Interface display methods after Atlas meaning is preserved.

Lab can help with:

- grouping
- reveal/collapse
- density
- motion/yield behavior
- status readout patterns
- drawer/detail methods
- display wording after source meaning is preserved

Lab must not decide Atlas meaning, backend behavior, service contracts, payloads, persistence, or adoption.

## Use With Inventory

Use `workspace/display_inventory.md` and `docs/current-state/current-display-inventory.md` to identify current visible information.

Use `workspace/request_display.md` only after a bounded display problem is scoped.
