# Dot Protocol

Signal: `.`

If the user sends only `.` in a Dev chat, Dev should treat it as an execution signal:

1. Read `workspace/README.md`.
2. Read this file.
3. Read `workspace/current.md` from top to bottom.
4. Read linked source-of-truth docs from the packet.
5. Check `git status --short` and account for existing changes before edits.
6. Execute the task queue from top to bottom.
7. Ask the user only when blocked by real ambiguity, unsafe/destructive action, live network requirements, missing artifacts, or permission escalation.
8. Update the Evidence and Dev Handoff sections in `workspace/current.md`.
9. Update durable docs only when the packet requires it or product truth changes.
10. Run the required verification.
11. Return a concise handover.

## Must Do

- Preserve existing user/Dev changes.
- Treat `workspace/current.md` as the active milestone/task packet.
- Use gap packets and roadmap docs for implementation detail.
- Move completed gap packets only when completion evidence exists.
- Record failures in `docs/failures` when a reusable bug class is found.
- Leave evidence of what was done, what was verified, and what remains.

## Must Not Do

- Do not treat this folder as product doctrine.
- Do not ignore current-state docs.
- Do not run live APIs unless the packet and operator explicitly allow the live gate.
- Do not stage generated SDE, runtime DB, cache, or smoke artifacts by default.
- Do not broaden scope beyond the queued work.
- Do not ask the user to relay information that is already in this folder.
- Do not silently skip dirty-tree health. If unrelated changes exist, preserve them and state how you worked around them.

## Return Conditions

Return to chat immediately if:

- the task would require destructive action
- live network work is needed but not explicitly gated
- the working tree contains overlapping unknown changes
- required source artifacts are missing
- a test failure reveals a doctrine or architecture decision

Otherwise continue until the queued slice is complete.

## Completion

When a packet is done:

1. Dev fills in `workspace/current.md` Evidence and Dev Handoff.
2. Overseer reviews against project doctrine and tree health.
3. Overseer either accepts, redirects, or rewrites `workspace/current.md`.
4. If accepted, copy the completed packet to `workspace/archive/YYYY-MM-DD-short-name.md`.
5. Update current-state/audits/gaps only when project truth changed.
