# Lab Display Request Workflow

Date: 2026-05-25
Status: Current runbook

## Purpose

Define the durable Atlas workflow for asking Aura Lab to compare display methods without transferring Atlas meaning, implementation authority, or adoption authority.

This runbook summarizes the workspace process in:

- `workspace/request_display.md`
- `workspace/display-request-workflow-hardening-contract.md`
- `workspace/display_inventory.md`

## Directionality

```txt
Atlas display inventory
-> scoped display problem
-> request_display to Lab
-> Lab Bridge -> Interface comparison
-> Atlas review and adoption decision
-> optional Atlas-local Dev runway
```

## End-To-End Workflow

| Stage | Owner | Input | Output | Gate |
| --- | --- | --- | --- | --- |
| Display inventory | Atlas / UIUX | Current renderer surfaces, audits, Human notes | User-exposed data map with roles, states, and visibility decisions | No implementation; identify before declutter |
| Request shaping | Atlas Overseer | Inventory entry or bounded display problem | Scoped `request_display` entry with source terms, known fields, states, non-goals, and request strength | No more than five active requests unless explicitly approved |
| Lab intake | Aura Lab | Submitted `request_display` entry | Accepted, returned, split, parked, or active-review Lab record | Lab may form display methods, not source meaning |
| Lab comparison | Aura Lab | Accepted request plus Lab display/material vocabulary | Up to three Bridge -> Interface methods with risks and questions | No target-project implementation |
| Atlas review | Atlas Overseer / Human / UIUX | Lab response and Atlas source meaning | Accepted, adapted, rejected, parked, or narrowed adoption record | Preserve Atlas meanings and stop conditions |
| Dev runway | Atlas Overseer | Accepted adoption decision | Bounded `workspace/current.md` packet | Dev may implement only this packet |
| Verification | Atlas Dev / Overseer | Implemented renderer changes | DevHS, smoke/check results, git-clean handoff | No claimed verification without commands/evidence |

## Workflow Pointers

Atlas-local pointers:

- Live inventory tracker: `workspace/display_inventory.md`
- Initial extraction audit: `workspace/DisplayInventoryAuditHS49-ingest-to-userdisplay.md`
- Display request pointer: `workspace/request_display.md`
- Workflow hardening contract: `workspace/display-request-workflow-hardening-contract.md`
- Initial Lab request batch: `workspace/RequestDisplayHS50-atlas-initial-display-requests.md`

Durable Atlas pointers:

- Current state summary: `docs/current-state/current-display-inventory.md`
- Display principles: `docs/features/display-boundary-principles.md`
- This runbook: `docs/runbooks/lab-display-request-workflow.md`

Lab pointer:

- Intake file: `F:\Projects\AURA- Lab\workspace\request_display.md`

## Response Record Rule

When Lab answers a request, Atlas should create or update an Atlas-local response/adoption record before any implementation packet.

Record:

- Lab source artifact reviewed.
- Candidate methods received.
- Accepted, adapted, rejected, parked, or returned disposition.
- Atlas source meanings preserved.
- UIUX or Human decisions still needed.
- Whether the response is enough for Dev.
- Verification expectations if implementation follows.

Recommended response filename:

```txt
workspace/DisplayResponseHS##-[request-id-or-surface]-lab-response-review.md
```

`workspace/display_inventory.md` should then link the response record under the matching inventory/request entry.

## Authority

Atlas owns:

- internal -> Bridge meaning
- source terms
- data meaning
- lane/state semantics
- runtime behavior
- final adoption

Lab may:

- compare up to three Bridge -> Interface display methods
- map requests to Lab slots, display types, and material sets
- recommend split, merge, narrow, park, or return-to-project
- identify presentation risks and missing state/field needs

Lab may not:

- rename Atlas source terms
- redefine Atlas meaning
- create backend, bridge, IPC, payload, persistence, schema, service, or runtime requirements
- treat requests as implementation approval
- treat requests as a hidden backlog
- start Atlas implementation

## Request Strength

Use one of these request strengths:

| Strength | Use when | Expected Lab response |
| --- | --- | --- |
| `formative` | Atlas knows the display problem but not the shape. | Form up to three options; may recommend split, merge, or park. |
| `comparative` | Atlas has candidate shapes and wants comparison. | Compare proposed shapes and optionally add one alternative. |
| `pressure-test` | Atlas has an existing surface and wants critique. | Identify friction and propose bounded alternatives. |
| `parked/inventory` | Useful later but not active review. | May be referenced later; does not count as active request. |

## Active Request Cap

Keep no more than five active Atlas `request_display` entries in Lab review unless the Human or Atlas Overseer explicitly overrides the cap.

Active statuses:

- `submitted`
- `active-review`
- `accepted-input`

Non-active statuses:

- `draft`
- `queued`
- `returned-to-project`
- `parked`
- `superseded`

## Standard Preamble

Use this preamble for Atlas display requests:

```txt
Advisory-only display request.

Atlas owns the meaning of this surface, source terms, data, states, runtime behavior, and final adoption. Aura Lab may compare Bridge -> Interface display methods, but must preserve Atlas terms, Atlas semantics, and the scoped boundary below.

This request is limited to one bounded display problem. It does not authorize implementation, bridge/IPC/contract changes, backend changes, persistence changes, terminology renames, or Atlas adoption.
```

## Required Request Content

Each active request should include:

- product area
- surface or use case
- user task
- request strength
- priority
- decision needed
- scope boundary
- included items
- excluded items
- max candidate methods: 3
- source-project acceptance needed: true
- source terms to preserve
- terms to avoid or qualify
- known fields
- gaps or unknowns
- state cases
- freshness or age needs
- basis or source needs
- warning or gap needs
- density or layout constraints
- interaction needs
- verification or review needs
- non-goals

## Response Handling

When Lab returns a comparison, Atlas Overseer records:

- Lab artifact reviewed
- candidate methods accepted, adapted, rejected, or parked
- Atlas meanings preserved
- risks and stop conditions
- whether a Dev runway is warranted
- required verification if implementation follows

Only after this review may `workspace/current.md` become an implementation packet.

## Non-Goals

- Do not use requests as a hidden backlog.
- Do not let Lab auto-start implementation.
- Do not make Lab vocabulary Atlas authority.
- Do not define bridge payloads or runtime schemas.
- Do not require every request to become a Lab display asset.
- Do not use archived requests as active task queues.
