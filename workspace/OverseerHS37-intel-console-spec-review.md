# OverseerHS37: Intel Console Spec Review

Date: 2026-05-24
Role: Overseer
Reviewed artifact: `workspace/UIUXHS36-operator-intel-console-presentation-spec.md`

## Decision

Accepted HS36 as a screen-level presentation specification and advisory basis.

Do not send Dev yet. The spec is strong enough to shape a future renderer-only packet, but it intentionally leaves terminology authority and several presentation decisions unresolved. Those need Human/Overseer acceptance before implementation.

## Accepted

- The primary product path should become an Investigation-first guided console.
- The presentation model may use the existing staged flow:

```txt
Lead
-> Discovery / possible leads
-> Queue review
-> Enrich selected
-> Evidence
-> Observation
-> Assessment Memory
```

- This is presentation over existing services, not a backend pipeline change.
- Readiness belongs under diagnostics/settings framing.
- Scopes should become point-of-need refinement rather than a first-screen wall.
- Queue refs must remain possible leads until ESI expansion.
- `Enrich selected` remains the explicit ESI expansion step that creates stored killmail evidence and derived activity events.
- Metadata hydration remains readability-only.
- Live lookup/power affordance must be permission/status only and must not start work.
- Marked/Watch asymmetry remains binding.
- Evidence deletion/pruning remains blocked.

## Not Yet Accepted

- Exact global live/API control label.
- `Watch / Radar` as a top-level navigation label.
- `Reports / Observations` as a top-level navigation label.
- `View evidence story` as final story-surface wording.
- zKill link / killmail ID paste as next accepted lead type.
- Any terminology bridge table as authority.
- Any Dev implementation packet.

## Risks

- If Dev starts before authority decisions, the renderer may hard-code labels the Human later rejects.
- A "Power on" phrase can imply background collection unless every action gate stays explicit.
- Red/yellow/green visual language can imply threat/safety if not tied to operational state.
- Moving Scopes out of the primary view must still keep caps/radius/provider effect visible before live/API work.

## Next State

`workspace/current.md` is refreshed to a Human/Overseer decision checkpoint. After those decisions, Overseer can write a bounded Dev runway for renderer-only progressive disclosure.
