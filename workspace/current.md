# Current Workspace Packet

Status: Active
Updated: 2026-05-23
Owner: Overseer planning, Human acceptance

## Coordination State

Active milestone: Operator Investigation Desk Planning
Roadmap source: `workspace/ProjectPlannerHS06-operator-investigation-ux.md`
Sequence: HS16
Previous accepted milestone: Aggressive Testing And Operator Bug Hunting
Latest closure record: `docs/audits/audit-2026-05-23-aggressive-testing-closure.md`
Current executor: Overseer / Human review
Current focus: convert accepted investigation UX direction into a bounded roadmap and first Dev runway
Expected output: OverseerHS16-operator-investigation-planning.md

## Purpose

This packet starts the next planning lane after closing the non-live aggressive-testing milestone.

Do not start product/UI implementation from this packet. First convert the accepted UX direction into durable milestone meaning, resolve remaining Human decisions, and then write a bounded Dev runway.

## Required Reading

- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/ProjectPlannerHS06-operator-investigation-ux.md`
- `docs/audits/audit-2026-05-23-aggressive-testing-closure.md`
- `docs/terms/marked.md`
- `docs/terms/watchlist.md`
- `docs/terms/actor-watch.md`
- `docs/terms/system-radius-watch.md`
- `docs/roadmap/operator-ui-workflow-polish.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\workspace-structure-authority.md`

## Accepted Product Requirement

Use this user-facing model:

```txt
Marked = operator interest / tag / record attention.
Watch = active routine check behavior.
Watch implies Marked.
Marked does not imply Watch.
```

Blocked/unblocked are user-facing watch status labels. They describe whether an active routine check can run now; they are not evidence conclusions.

## Ordered Overseer Runway

1. Review the Project Planner advisory and current terms.
2. Decide whether to create `docs/roadmap/operator-investigation-desk.md` or update `docs/roadmap/operator-ui-workflow-polish.md`.
3. Return Human decisions before Dev if needed:
   - whether the stored container is called Record
   - whether final reviewed output is Intelligence, Finding, Assessment, or Assessment Memory
   - whether Enrich selected is the user-facing label for ESI expansion
   - whether pasted zKill links / killmail IDs belong in the first pass
   - whether region is first-class now or deferred behind current system/radius machinery
   - whether battle timelines are chronological or grouped into fight clusters
   - whether relationship and footprint views are combined or adjacent
   - whether first polished workflow optimizes for local-alpha onboarding or expert speed
4. Write a bounded first Dev runway only after the durable milestone meaning is clear.

## Guardrails

- zKillboard is discovery only.
- Expanded ESI killmails are evidence.
- Discovery refs are possible evidence until expanded.
- Assessment artifacts are deliberate operator memory, not evidence.
- UI presents and scopes evidence; UI is not authority.
- Passive views must not collect evidence.
- Live APIs require explicit gates and narrow scopes.
- Marked is attention, not collection.
- Watch is active routine checking, not proof.

## Evidence

Milestone closure accepted:

```txt
npm.cmd run verify:all
Result: passed with 61 scripts.
```

## Dev Handoff

No Dev implementation runway is currently assigned.

## Overseer Review

- next packet: create durable Operator Investigation Desk roadmap/decision packet, then write first bounded Dev runway.
