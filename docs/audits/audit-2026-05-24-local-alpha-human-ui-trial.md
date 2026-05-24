# Audit: Local Alpha Human UI Trial Notes

Date: 2026-05-24
Source: Human operator trial
Scope: Offline local-alpha UI walkthrough after Local Alpha Trial Readiness closure

## Summary

The first Human UI pass confirms that Atlas is substantially improved and mechanically usable, but its presentation still reads too much like a network/backend configuration panel and not enough like a discovery and storytelling tool.

The next work should be a user-story and presentation-flow pass before Dev implementation. The goal is to shape the operator journey, not to add more backend capability.

## Positive Findings

- Window movement feels smooth.
- The app is much better than earlier presentation states.
- Input field alignment is mostly coherent.

## Operator Friction

- Text has odd edge handling in the Investigation screen, especially in the Live/API Context panel.
- Verbiage is abstract and technical.
- Readiness feels like diagnostics/settings, not a primary user-flow destination.
- Scopes presents too many options at once, making it feel as if every field should be selected or understood.
- Scope controls feel like an internal-data/end-state panel rather than the beginning of an investigation journey.
- `Refresh watches` and `Preview queue` buttons flicker strangely.
- The interface still has excessive information density.
- Live API / zKill / ESI state should feel like one clear operator-facing "Power on" control, with details behind it.
- The current surface reads more like network configuration than discovery/storytelling.

## Accepted Direction

The next pass should convert these notes into described user stories and presentation acceptance checks.

Primary direction:

```txt
Investigation should start as a human story:
Who/where is the lead?
What can Atlas safely know already?
What possible leads exist?
What becomes evidence only after explicit action?
What observations can be read from stored evidence?
What is worth remembering?
```

Secondary/internal direction:

```txt
Readiness, Scopes, Queue internals, service counts, IDs, caps, gates, and diagnostics remain available, but should not dominate the first operator path.
```

## Non-Decisions

- No code implementation is accepted from this trial note alone.
- No product doctrine is rewritten.
- No live/API behavior is changed.
- No new collection, enrichment, watch execution, or assessment behavior is authorized.
- No public packaging or release work is implied.

## Recommended Next Packet

Run a UI/UX or Planner story pass before Dev:

- define 4-6 operator stories from the Human trial
- distinguish primary story flow from secondary diagnostic/configuration surfaces
- recommend one bounded first Dev slice
- include acceptance checks that are visible in Electron smoke
- preserve all evidence/live/API/assessment boundaries
