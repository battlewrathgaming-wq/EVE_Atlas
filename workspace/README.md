# Workspace

This folder is the repo-local attention bridge between Overseer, Dev, and the user.

The workflow uses one overwriteable active packet:

```txt
workspace/current.md
```

`current.md` is disposable current attention. It can be overwritten whenever the active milestone or task queue changes.

Durable memory still lives in:

- `docs/current-state/`
- `docs/audits/`
- `docs/gap/to-do/`
- `docs/gap/complete/`
- `docs/failures/`
- `workspace/archive/`

## Dot Signal

When the user sends this exact signal in a Dev chat:

```txt
.
```

it means:

```txt
Read workspace/README.md.
Read workspace/00-dot-protocol.md.
Read workspace/current.md.
Execute the task queue top to bottom.
Return only for blockers, unsafe ambiguity, permission/live-network needs, or final handover.
```

## Roles

Overseer:

- audits repo and docs against project intent
- checks tree health before directing work
- overwrites `workspace/current.md` with the next milestone/task packet
- updates state/docs when truth changes
- archives completed packets when accepted

Dev:

- treats `.` as the execution signal
- works only the scoped tasks in `workspace/current.md`
- leaves evidence in `workspace/current.md`
- updates docs/gaps only where the packet requires it
- runs verification and hands back concise results

## Read Order

1. `README.md`
2. `00-dot-protocol.md`
3. `current.md`
4. `prompts.md` only when writing or refreshing workflow prompts

Then cross-check linked docs from `current.md`.

## Rule

This folder focuses current work. It does not override current-state, contracts, live IO policy, evidence/renderer boundary doctrine, or newer user instructions in the active chat.
