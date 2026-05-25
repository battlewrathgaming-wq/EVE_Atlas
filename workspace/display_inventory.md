# Atlas User-Facing Display Inventory

Status: Working inventory scaffold
Date: 2026-05-25
Owner: Atlas Overseer
First extraction audit:

- `workspace/DisplayInventoryAuditHS49-ingest-to-userdisplay.md`

## Purpose

Identify what Atlas currently exposes to the user before deciding what should be redesigned, collapsed, moved, hidden, or sent to Aura Lab for display-method comparison.

This inventory is an Atlas-owned product/workflow tool. It is not a Dev runway, Lab request batch, bridge contract, runtime schema, payload schema, or terminology rename.

## Short-Term Focus

Extract user-exposed data, labels, states, warnings, controls, and backend/runtime metadata from current renderer surfaces.

The first pass should answer:

```txt
What is currently visible to the user?
Where is it visible?
What data/source does it come from?
What role does it play?
Should it be operator-facing, point-of-need, diagnostic, provenance/detail, or hidden/internal?
```

Do not redesign yet. Do not send everything to Lab automatically.

## Core Insight

The first Atlas UI overload likely came from treating too much programmatic evidence and system metadata as if it were immediately useful operator intention context.

Atlas has several different information families competing for the same screen layer:

- Evidence facts: expanded ESI killmails, activity events, citations.
- Discovery candidates: queued zKill refs and possible leads.
- Provenance: where data came from, when, by what run/action.
- Runtime metadata: task IDs, service state, readiness, SQLite/SDE status.
- Operator intention: "I want to investigate this pilot, system, corp, or alliance."
- Operator judgment: Assessment Memory.
- Operational control: Watch, Enrich selected, Refresh labels, External API gate.

The overload happens when all of these appear at the same layer.

## Display Role Taxonomy

Classify each visible item by display role, not only by data source.

| Display role | Meaning | Default display stance |
| --- | --- | --- |
| `operator-intent` | What the operator is trying to do now. | First face / primary workflow. |
| `evidence-fact` | Stored Atlas Evidence: expanded ESI killmails and derived activity events. | Evidence/provenance surfaces; summarized in overview only. |
| `discovery-candidate` | Possible leads before evidence creation. | Possible Leads / queue surfaces; never display as Evidence. |
| `provenance` | Why an item exists, where it came from, when, and from what run/action. | Drawer/detail surface; point-of-need in overview. |
| `runtime-state` | Task, API, SQLite, SDE, readiness, and service state. | Compact trust/status or diagnostics. |
| `action-control` | Explicit operator command or preflight. | Point-of-need, action-adjacent. |
| `assessment-judgment` | Deliberate saved operator judgment with citation context. | After evidence/report context; not evidence. |
| `diagnostic-support` | Debug, support, trace, raw IDs, service counts, task IDs. | Settings/Diagnostics or support surfaces. |

## UI Rule

- Operator intent belongs in the first face.
- Evidence facts belong in evidence/provenance surfaces.
- Discovery candidates belong in possible-lead/queue surfaces.
- Runtime metadata belongs in compact trust/status or diagnostics.
- Operational controls appear at point of need.
- Assessment judgment appears after evidence/report context.
- Diagnostics stay available but do not narrate the main story.

## Inventory Workflow

```txt
Atlas display inventory
-> choose bounded display problem
-> optional request_display to Lab
-> Lab compares display methods
-> Atlas reviews/adopts/rejects
-> Atlas updates inventory
-> optional Atlas-local Dev runway
```

## Status Model

| Status | Meaning |
| --- | --- |
| `identified` | User-facing surface/field found. |
| `needs-scope` | Meaning is known, display problem not shaped yet. |
| `request-ready` | Can become a scoped `request_display` entry. |
| `submitted` | Sent to Lab. |
| `answered` | Lab response received and linked. |
| `accepted` | Atlas accepts a display method. |
| `adapted` | Atlas accepts with changes. |
| `parked` | Useful but not now. |
| `rejected` | Not suitable. |
| `implemented` | Atlas Dev has built it. |
| `deprecated` | Should be removed or replaced. |

## Visibility Decisions

Use these as the main classification outcomes:

- `operator-facing`
- `point-of-need`
- `diagnostic-only`
- `provenance-detail`
- `hidden-internal`
- `lab-display-candidate`

## Inventory Entry Shape

```yaml
display_inventory:
  id:
  status: identified | needs-scope | request-ready | submitted | answered | accepted | adapted | parked | rejected | implemented | deprecated
  product_area:
  surface:
  current_location:
  user_task:
  visible_information:
    -
  visible_terms:
    -
  visible_fields:
    -
  display_role: operator-intent | evidence-fact | discovery-candidate | provenance | runtime-state | action-control | assessment-judgment | diagnostic-support
  visibility_decision: operator-facing | point-of-need | diagnostic-only | provenance-detail | hidden-internal | lab-display-candidate
  source_owner: Atlas
  meaning_owner: Atlas
  data_origin:
  current_display:
  should_display:
  display_intent:
  display_scope:
  state_cases:
    -
  freshness_or_basis_shown:
  warnings_or_gaps_shown:
  interaction_type:
  implementation_owner:
  lab_advisory_status:
  request_display:
    status:
    id:
    submitted_to_lab:
    response_record:
    answered_date:
    candidate_methods:
      -
    source_project_disposition:
    adoption_notes:
  risks:
  next_decision:
```

## Initial Extraction Candidates

These are not active Lab requests. They are likely inventory targets for the first extraction pass.

| Candidate | Current likely location | Display role | Initial visibility decision |
| --- | --- | --- | --- |
| Current lead input and type | Atlas Overview | `operator-intent` | `operator-facing` |
| External API enabled/disabled/checking | Top bar / overview strip / readiness | `runtime-state` | `operator-facing` summary; detail point-of-need |
| Stored Evidence count/report summary | Overview right rail / reports | `evidence-fact` | `operator-facing` summary; provenance detail |
| Possible Leads / queued refs | Overview right rail / queue | `discovery-candidate` | `operator-facing` summary; detail in queue |
| Watch Status / due/blocked counts | Overview right rail / Watch surface | `runtime-state` and `action-control` | `operator-facing` summary; point-of-need detail |
| Assessment Memory count/detail | Overview right rail / reports | `assessment-judgment` | `operator-facing` summary after context; detail in assessment |
| Task IDs and task history | Task History | `diagnostic-support` | `diagnostic-only` unless action is running |
| Service count / service list | Header or diagnostics | `diagnostic-support` | `diagnostic-only` |
| Queue IDs / discovery keys | Queue and detail panes | `diagnostic-support` / `discovery-candidate` | point-of-need or diagnostic |
| Actor/system durable IDs | Lead, scope, reports | `provenance` / `operator-intent` | point-of-need; visible when disambiguation matters |
| Evidence window / report basis | Report detail | `provenance` | provenance-detail |
| Fetch runs / API request logs | readiness/debug/provenance | `provenance` / `diagnostic-support` | provenance-detail or diagnostic |
| SDE freshness / lookup status | readiness/settings | `runtime-state` | diagnostic-only unless lookup failure affects the task |
| Runtime snapshot state | readiness/support | `diagnostic-support` | diagnostic-only |
| Confirmation/effect requirements | action preflight | `action-control` | point-of-need |

## First Pass Scope

Recommended first inventory pass:

1. Atlas Overview.
2. Watch / Queue surface.
3. Reports / Assessment surface.
4. Settings / Diagnostics and Task History.

For each surface, extract visible text labels, fields, states, warnings, and controls. Classify role and visibility decision before recommending declutter.

HS49 completed the first advisory extraction pass and should be used as evidence for future scoping. It is not a Dev runway, Lab request batch, terminology rename, or implementation approval.

Accepted HS49 implications:

- Atlas Overview is the healthiest current operator-intent layer.
- The right rail is valuable but visually mixes Evidence, Discovery, Watch, and Assessment Memory with equal weight.
- Queue / Possible Leads needs a display method that keeps refs investigable without making them look like Evidence.
- Watch needs a compact operator state model before exposing scheduler/executor internals.
- Readiness and Task History should remain diagnostic/support surfaces, with only compact trust/status summaries promoted to primary UI.
- Reports are comparatively well structured, but provenance/raw IDs should remain secondary to Evidence Basis and Observation.

## Non-Goals

- Do not implement code.
- Do not change renderer copy.
- Do not send active Lab requests automatically.
- Do not rename Atlas terms.
- Do not treat backend metadata as automatically operator-facing.
- Do not treat this inventory as a hidden backlog.
- Do not use archived docs as active task queues.

## Relationship To Lab

This inventory identifies and scopes Atlas user-facing information. `request_display` asks Lab to compare display methods for one bounded display problem.

Lab may advise Bridge -> Interface display methods only after Atlas meaning is preserved.

Atlas owns final adoption.
