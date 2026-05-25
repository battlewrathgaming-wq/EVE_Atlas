# Atlas Display Request Workflow Hardening Contract

Status: Atlas-local advisory workflow contract
Date: 2026-05-25
Owner: Atlas Overseer
Lab source reviewed:

- `F:\Projects\AURA- Lab\workspace\request_display.md`
- `F:\Projects\AURA- Lab\workspace\display-request-cooperation-contract.md`
- `F:\Projects\AURA- Lab\workspace\current.md`

## Purpose

Define how Atlas may send scoped `request_display` entries to Aura Lab for display-method comparison while giving Lab enough agency to form useful options.

This contract hardens workflow directionality. It does not authorize implementation, adoption, backend changes, bridge changes, IPC changes, payload changes, persistence changes, schema changes, or Atlas terminology renames.

## Directionality

```txt
Atlas-owned meaning
-> scoped display problem
-> Lab Bridge -> Interface comparison
-> Atlas review and adoption decision
-> optional Atlas-local Dev runway
```

Atlas starts the request by defining:

- the surface or use case
- the user task
- the source-owned terms and meanings
- the known fields and state cases
- the non-goals and stop conditions
- the proof or review needs

Lab responds by forming:

- up to three candidate display methods
- slot/type/material mapping from Lab's accepted display vocabulary
- presentation risks and portability notes
- clarifying questions where the request is underspecified
- a recommended disposition

Atlas then decides whether to:

- accept a candidate
- adapt a candidate
- reject the comparison
- ask for a narrower comparison
- park the request
- write an Atlas-local implementation packet

## Agency Boundary

Lab has agency to form display options, not source meaning.

Allowed Lab agency:

- choose candidate display methods from the scoped request
- propose alternate grouping, reveal, collapse, status, motion, or density treatments
- identify where the request lacks fields, states, or user-task clarity
- recommend whether a display should exist, be merged, be split, or be parked
- compare methods against Lab slots, display types, and material sets
- describe risks in human-facing presentation

Not allowed by default:

- rename Atlas source terms
- redefine Evidence, Discovery, Watch, Marked, provenance, storage, or Assessment Memory
- decide Atlas product doctrine
- create backend, bridge, IPC, payload, persistence, schema, or service requirements
- treat `request_display` as an implementation backlog
- treat Lab display vocabulary as Atlas authority
- start target-project implementation

## Request Strength Levels

Atlas may submit requests with different levels of direction:

### Formative

Use when Atlas knows the problem but not the display shape.

Lab should form up to three options and may recommend split/merge/park.

### Comparative

Use when Atlas has candidate shapes and wants method comparison.

Lab should compare the proposed shapes and may add one alternative.

### Pressure-Test

Use when Atlas has an existing surface and wants risks, compression, motion, or point-of-need display critique.

Lab should identify friction and propose bounded alternatives.

### Parked / Inventory

Use when the request is useful but should not count as active Lab review.

Lab may reference it later, but it is not an active task.

## Atlas Request Preamble

Use this preamble for Atlas `request_display` batches or individual requests:

```txt
Advisory-only display request.

Atlas owns the meaning of this surface, source terms, data, states, runtime behavior, and final adoption. Aura Lab may compare Bridge -> Interface display methods, but must preserve Atlas terms, Atlas semantics, and the scoped boundary below.

This request is limited to one bounded display problem. It does not authorize implementation, bridge/IPC/contract changes, backend changes, persistence changes, terminology renames, or Atlas adoption.
```

## Required Atlas Fields

Every active Atlas request should include:

- product area
- surface or use case
- user task
- request strength: formative, comparative, pressure-test, or parked/inventory
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

## Atlas File Convention

Atlas separates the workflow pointer from scoped request artifacts.

Pointer/workflow:

```txt
F:\Projects\AURA-Atlas\workspace\request_display.md
```

Scoped Atlas request artifact:

```txt
F:\Projects\AURA-Atlas\workspace\RequestDisplayHS##-[topic].md
```

Lab intake copy:

```txt
F:\Projects\AURA- Lab\workspace\request_display.md
```

Rules:

- Do not append scoped request bodies to Atlas `workspace/request_display.md`.
- Do create an Atlas-owned `RequestDisplayHS##-[topic].md` artifact before or alongside Lab submission.
- Do submit/copy the accepted request body to Lab intake only when Human/Overseer has opened that advisory request.
- Do record Lab answers in an Atlas-local response/adoption record before any Dev runway.

## Active Request Cap

Atlas keeps no more than five active `request_display` entries in Lab review unless Human or Atlas Overseer explicitly overrides the cap.

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

## Workflow Hardening Rules

1. Atlas requests should describe a bounded problem, not a solution mandate.
2. Lab may form options inside the request boundary.
3. Lab should return options with risks, not implementation instructions.
4. Atlas must review any Lab response before adoption.
5. Atlas implementation requires a separate Atlas-local Dev runway.
6. Archived requests and Lab responses are evidence, not task queues.
7. If a request would require source meaning decisions, Lab should return it to Atlas instead of guessing.
8. If a request would require backend, bridge, IPC, payload, persistence, schema, service, or live/API changes, Lab should mark that as out of display scope.

## Good Atlas Display Requests

A strong request asks:

```txt
Given this Atlas-owned meaning and these known states, compare up to three ways to display the surface so an operator can understand or decide X.
```

A weak request asks:

```txt
Make this UI better.
```

or:

```txt
Build this exact thing.
```

## Review / Adoption Path

When Lab returns a comparison, Atlas Overseer should record:

- Lab artifact reviewed
- candidate methods accepted, adapted, rejected, or parked
- Atlas meanings preserved
- risks and stop conditions
- whether a Dev runway is warranted
- required verification if implementation follows

Only after that review may `workspace/current.md` become an implementation packet.

## Current Use

This contract supports Atlas display requests for post-HS47 review, especially:

- Atlas Overview current lead/search center
- Atlas Overview right rail status stack
- point-of-need copy collapse
- Stored Evidence / provenance drawer
- runtime / IO timing state readouts

These are advisory display problems. They are not automatic Lab tasks and not Atlas implementation approval.
