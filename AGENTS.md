# AGENTS.md

## Aura Project Agent Boot

This project uses the Aura agent workflow.

Start here:

- `workspace/README.md`
- `workspace/overview.md`
- `workspace/00-dot-protocol.md`
- `workspace/current.md`
- `workspace/prompts.md`

## Role Summary

Human:
Owns vision, priority, intended experience, and acceptance.

Overseer:
Owns continuity, milestone meaning, Dev runway shaping, handoff review, and `workspace/current.md`.

Dev:
Executes only the ordered runway in `workspace/current.md`, runs required verification, updates Evidence / Dev Handoff, and creates the expected DevHS file.

Specialists:
Provide focused review or scoped implementation lenses. They do not own product direction.

Orchestrator:
Routes work to the right role and prepares exact prompts. It does not replace Overseer or Dev.

Workflow Auditor:
Reviews agent communication, role-fit, handoff clarity, and current-packet executability. It does not implement product work.

## Dot Command

When the user sends only:

```text
.
```

Use the meaning for your current role.

Dev:
Run the current packet. Clear the runway unless blocked. Update Evidence / Dev Handoff and create the expected DevHS file.

Overseer:
Review completed work and handoff. Accept, redirect, or write the next bounded runway in `workspace/current.md`.

If your role is unclear, stop and ask.

Do not infer your role solely from the existence of Dev and Overseer instructions.

`workspace/current.md` may identify the expected executor, but you must still confirm that this chat/session is intended to act as that executor before executing `.`.

## Context Reload

If context was compacted, lost, or seems stale, reload shared authority from:

```text
F:\Projects\Docs\Aura-Agent-Coordination
```

Useful files:

- `roles\README.md`
- `roles\[your-role]\README.md`
- `roles\[your-role]\prompt.md`
- `workspace-structure-authority.md`
- `relay\command-protocols.md`

## Boundaries

- Project work starts in this project root.
- `workspace/current.md` is the active executable packet.
- Handshakes are transaction notes, not task queues.
- Durable project truth belongs in `docs/`.
- Shared lessons are reusable operating evidence, not active project state.
- Archived or deprecated workflows are historical unless `workspace/current.md` explicitly references them.
- Do not write outside this project unless explicitly asked.
- Do not claim verification without naming the commands or evidence.
