# Dot Protocol

Status: Active
Signal: `.`

## Meaning

If the user sends only `.` in a Dev chat, Dev should treat it as an execution signal.

## Required Steps

1. Confirm cwd, repo root, branch, tree health, and workspace files.
2. Read `workspace/overview.md`.
3. Read this file.
4. Read `workspace/current.md` from top to bottom.
5. Read source documents named in `current.md`.
6. Execute the ordered runway in `current.md`.
7. Update Evidence and Dev Handoff in `current.md`.
8. Create the expected `DevHS##-[focus].md` handshake named in `current.md`.
9. Run required verification.
10. Return a concise handoff.

## Must Do

- Preserve existing user/Dev changes.
- Treat `workspace/current.md` as the only active execution packet.
- Use roadmap/audit/current-state docs for milestone meaning, not as a separate task queue.
- Leave evidence of what was done, verified, deferred, and risked.

## Must Not Do

- Do not infer tasks from handshakes.
- Do not create hidden task queues.
- Do not recreate deprecated `docs/gap` workflow.
- Do not run live/private/destructive operations unless authorized.
- Do not broaden scope beyond the current runway.

## Return Conditions

Return to chat immediately if:

- cwd is not the project root
- sequence state conflicts with visible handshakes
- instructions conflict
- live network/API action is needed without authorization
- destructive or external mutation is required
- required input/artifact is missing
- a test failure reveals a doctrine or architecture decision
