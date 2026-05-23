# OverseerHS17: Operator Investigation Roadmap

Date: 2026-05-23
Role: Overseer
Milestone: Operator Investigation Desk Planning

## Decision

Created a dedicated roadmap milestone:

```txt
docs/roadmap/operator-investigation-desk.md
```

This is a better fit than extending `docs/roadmap/operator-ui-workflow-polish.md` because the accepted direction changes the opening product posture, information hierarchy, and operator journey rather than merely polishing existing service surfaces.

## Accepted Direction

The next milestone should build toward an operator-facing investigation desk.

Accepted user-facing model:

```txt
Marked = operator interest / tag / record attention.
Watch = active routine check behavior.
Watch implies Marked.
Marked does not imply Watch.
```

## First Dev Runway Shape

The first Dev runway should be a bounded first-screen shell:

- investigation-oriented opening view
- primary actor/system lead input
- visible live/API state
- Marked/Watch language separation
- discovery/evidence/observation/assessment boundary language
- technical detail moved into secondary areas
- existing service surfaces preserved

It should not implement Record/Intelligence/Finding terms yet.

## Human Decisions Deferred

Open decisions are captured in the roadmap and should return before broad UI build-out:

- Record term
- Intelligence/Finding/Assessment term
- pasted zKill links / killmail IDs
- region as first-class
- fight clusters versus chronological timeline
- combined relationship/footprint view
- local-alpha clarity versus expert-speed optimization

## Next Packet

Dev may proceed with the first bounded Investigation Desk shell slice from `workspace/current.md`.
