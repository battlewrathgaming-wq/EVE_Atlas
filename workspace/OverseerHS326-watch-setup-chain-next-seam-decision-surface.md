# OverseerHS326 Watch Setup Chain Next Seam Decision Surface

Status: resting decision surface
Date: 2026-06-05
Role: Overseer

## Context

HS310 through HS324 hardened the System / Radius Watch setup chain:

- `watch.create_mutation_safety_map.preview`
- accepted-scope `watch.create` mutation contract
- authored Watch execution readiness preview
- operator confirmation/listen-hook contract
- renderer confirmation path
- post-create setup readout
- setup/readiness bridge
- invalid stored scope normalization

Current accepted spine:

```txt
topology preflight -> explicit operator confirmation -> stored included_system_ids -> readout -> future execution readiness
```

Accepted Watch scope authority remains the stored included system ID set. Center/radius are provenance and management after acceptance.

## Stable Landing

The setup chain is coherent enough to rest.

Invalid stored scope no longer leaks partial IDs as accepted or usable scope. Partial parseable IDs are diagnostic only.

No Watch execution, provider movement, dispatch, runtime arm/disarm, schema, support artifact, active enforcement, Watch result identity, relationship tags, or final UI design has been opened.

## Candidate Next Seams

### 1. Watch Runtime Packet Plan Preview

Purpose:

Prove how an accepted stored Watch scope would become a future runtime/acquisition packet plan without dispatching it.

Why it fits:

- follows directly from accepted stored scope authority
- moves toward the machinery without provider movement
- keeps execution separate from readiness
- can disclose cadence/held/deferred posture before any live behavior

Likely boundary:

- read-only/local-only
- no Watch execution
- no task creation
- no provider/API calls
- no Discovery refs
- no Evidence/EVEidence
- no Hydration
- no schema
- no UI

### 2. Watch Result / Outcome Shape Advisory

Purpose:

Define what future Watch/task results should preserve after a run: scope, window, completeness, related killmails, provider path, and basis without mutating Evidence meaning.

Why it fits:

- addresses the parked “what did this Watch find?” layer
- prevents Watch meaning from accumulating inside `activity_events` or killmail rows
- useful before real execution writes results

Likely boundary:

- advisory only
- no code
- no schema commitment unless explicitly promoted later
- no Evidence-field tagging
- no relationship tags as durable truth

### 3. Local Scope Health / Repair Readout

Purpose:

Provide a read-only operator/system readout for existing Watch rows that are missing, malformed, empty, invalid, inactive, or missing local display names.

Why it fits:

- follows from HS324 invalid-scope normalization
- helps support future UI guidance without designing UI now
- can keep bad rows at rest while making review posture clear

Likely boundary:

- read-only/local-only
- no row repair
- no renderer work
- no execution
- no provider movement

## Recommended Next Motion

Recommended next seam: **Watch Runtime Packet Plan Preview**.

Reason:

Atlas has now proven accepted Watch setup and readiness. The next uncertainty is not UI and not live execution; it is whether the stored accepted scope can be shaped into a future runtime packet plan while preserving the same boundaries.

This is the smallest step toward Watch machinery that still keeps Atlas safe, local, inspectable, and non-live.

## Human Decision Needed

Human/Overseer should choose whether to:

1. open a Dev runway for Watch Runtime Packet Plan Preview
2. ask Engineering/Data for advisory input first
3. choose Watch Result / Outcome Shape Advisory instead
4. rest the Watch chain and return to another storage/runtime seam
