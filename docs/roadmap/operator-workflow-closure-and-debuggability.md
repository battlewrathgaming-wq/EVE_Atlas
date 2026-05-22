# Roadmap: Operator Workflow Closure And Debuggability

Date: 2026-05-22

## Purpose

Atlas now has the main rigging needed for cautious local operation:

- controlled discovery and expansion lanes
- structured reports
- assessment artifacts
- corpus health
- runtime snapshot safety
- renderer surfaces for readiness/support state

The next milestone should prove these parts work as a coherent operator loop and leave enough trace output that failures can be reviewed without guesswork.

This milestone is not about adding more ingestion breadth. It is about closing the loop.

## Mission

Prove that an operator can move through a realistic offline workflow:

```txt
scope validation
-> manual discovery
-> queue review
-> selected expansion
-> report
-> assessment memory
-> support trace if something fails
```

The workflow must preserve Atlas terminology:

- queued refs are possible evidence
- expanded ESI killmails are evidence
- activity events are observations derived from evidence
- reports are scoped presentation
- assessments are deliberate memory
- corpus health, snapshots, and trace packs are support products

## Non-Goals

- Do not add broad passive ingestion.
- Do not add automatic live work.
- Do not add evidence pruning.
- Do not add restore UI.
- Do not treat trace packs as raw evidence exports.
- Do not treat assessment artifacts as evidence.

## Completion Criteria

The milestone is complete when:

- an offline operator workflow scenario is verified through service/task paths
- assessment artifact review is explicitly verified in renderer/static checks
- a bounded trace pack exists for handoff/debug review
- the positive-ref scoped discovery smoke is either run respectfully or explicitly deferred
- `verify:all` and Electron smoke still pass
- the audit trail records any remaining concerns

## Recommended Order

1. Operator workflow scenario smoke.
2. Assessment artifact review closure.
3. Operator debug trace pack.
4. Positive-ref scoped discovery smoke decision.

## Boundary Reminder

This milestone should make Atlas easier to operate and review. It should not expand what Atlas collects by default.
