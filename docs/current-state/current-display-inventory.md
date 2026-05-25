# Current State: User-Facing Display Inventory

Date: 2026-05-25
Status: Current state summary

## Summary

Atlas now tracks user-facing information through a display inventory workflow.

The live working tracker remains:

- `workspace/display_inventory.md`

The first extraction audit is:

- `workspace/DisplayInventoryAuditHS49-ingest-to-userdisplay.md`

This current-state document summarizes the accepted state without replacing the working inventory.

## Current Principle

Atlas should identify what is user-facing before deciding what should be redesigned, collapsed, moved, hidden, or sent to Lab for display-method comparison.

Do not start with "declutter." Start with:

```txt
What is visible?
Where is it visible?
What does it mean?
What data/source does it come from?
What operator decision does it support?
```

## Current Display Roles

Atlas currently uses these display roles for inventory and display-request scoping:

- `operator-intent`
- `evidence-fact`
- `discovery-candidate`
- `provenance`
- `runtime-state`
- `action-control`
- `assessment-judgment`
- `diagnostic-support`

## Current Visibility Decisions

Atlas uses these visibility decisions:

- `operator-facing`
- `point-of-need`
- `diagnostic-only`
- `provenance-detail`
- `hidden-internal`
- `lab-display-candidate`

## HS49 Extraction Findings

HS49 found that Atlas has a strong underlying boundary model, but visible UI often repeats boundary, provenance, runtime, and diagnostic facts at the same level as operator intent.

Accepted implications:

- Atlas Overview is the healthiest current operator-intent layer.
- The right rail is valuable but mixes Evidence, Discovery, Watch, and Assessment Memory with equal visual weight.
- Queue / Possible Leads needs a display method that keeps refs investigable without making them look like Evidence.
- Watch needs a compact operator state model before exposing scheduler/executor internals.
- Readiness and Task History should remain diagnostic/support surfaces, with only compact trust/status summaries promoted to primary UI.
- Reports are comparatively well structured, but provenance/raw IDs should remain secondary to Evidence Basis and Observation.

## Safest Lab Display Candidates

HS49 identified these as the safest Lab display-method comparison candidates:

1. Atlas Overview right-rail summary stack.
2. Possible Leads / Queue Review display.
3. External API / local-first trust affordance.
4. Watch state display: Marked versus Watch, armed/due/blocked.
5. Evidence report layering: basis, observation, provenance, raw IDs.

These are candidates only. They are not active Lab tasks until converted into scoped `request_display` entries.

## Atlas-Owned Boundaries

The following remain Atlas-owned and must not be rewritten by display work:

- Evidence, Discovery, Observation, Assessment Memory, Marked, Watch, Enrich selected, Refresh labels.
- Bridge/service command names, effect classifications, and confirmation authority.
- IPC contract and renderer eligibility.
- Report model semantics and structured response meanings.
- Queue selection meaning and evidence-boundary status.
- Live/API gate meaning and refusal behavior.
- Task authority and cancellation behavior.
- Persistence/schema terms and internal table names.
- Runtime snapshot and support/debug trace pack semantics.

## Relationship To Workspace

Use:

- `workspace/display_inventory.md` for live inventory tracking.
- `workspace/request_display.md` for scoped Lab display requests.
- `workspace/display-request-workflow-hardening-contract.md` for request directionality.
- `docs/features/display-boundary-principles.md` for display principles.
- `docs/runbooks/lab-display-request-workflow.md` for durable workflow.

## Non-Goals

- This is not a Dev runway.
- This is not Lab adoption.
- This is not UI implementation approval.
- This is not a rename mandate.
- This is not a bridge contract, runtime schema, or payload schema.
