# OverseerHS329 Watch Runtime Next-Seam Decision Surface

Status: resting decision surface
Date: 2026-06-06
Role: Overseer

## Context

HS327 is accepted. Atlas now has a read-only/local-only Watch runtime packet plan preview:

```txt
watch.runtime_packet_plan.preview
```

It proves accepted Watch state can become future runtime/acquisition packet plans without dispatch, task creation, provider calls, writes, schema, UI, active enforcement, support artifacts, durable Watch results, relationship tags, or fourth-lane work.

The nearby candidate seams from HS328 were checked against current workspace evidence:

- Watch/task outcome map already exists and was refreshed through HS300 / HS301.
- System/radius setup health/readout already exists through HS320 / HS321.
- Setup/readiness bridge and invalid stored-scope normalization already exist through HS322 / HS324.

So the next seam should not duplicate those readouts.

## Stable Landing

Accepted Watch setup and pre-runtime chain:

```txt
topology preflight
-> explicit operator confirmation
-> stored included_system_ids
-> post-create readout
-> authored execution readiness
-> readout/readiness bridge
-> runtime packet plan preview
```

Accepted boundaries:

- stored included system IDs are accepted Watch scope authority;
- center/radius are provenance and management after acceptance;
- invalid stored scope creates no accepted/usable runtime systems;
- waiting is not failure;
- runtime packet plan preview is not dispatch;
- Watch/task outcome map is read-only posture, not durable result semantics;
- no provider movement or live testing is open.

## Candidate Next Seams

### 1. Watch Runtime Movement Readiness Advisory

Purpose:

Ask Engineering/Data/Security whether the current read-only chain is enough to shape the next execution-adjacent proof, and what the smallest safe proof should be.

Likely focus:

- whether a no-dispatch executor/tick dry-run is useful or premature;
- whether packet plan preview already covers enough;
- what facts must be present before any task creation proof;
- how External I/O, storage setup, provider gates, Watch cadence, and no-catch-up-flood posture should constrain the next movement proof;
- what must remain parked until live/provider testing.

Boundary:

- advisory only;
- no code;
- no provider calls;
- no dispatch;
- no schema;
- no active enforcement;
- no Dev runway unless accepted after review.

Recommendation:

This is the safest next step if Atlas wants to keep moving toward runtime execution without guessing.

### 2. Watch Runtime Packet Plan To Outcome Map Conformance Preview

Purpose:

Add a read-only proof that `watch.runtime_packet_plan.preview` and `runtime.watch_task_outcome_map.preview` agree on origin, lane, scope authority, center-only Discovery ref identity limitation, and lack of durable Watch result semantics.

Boundary:

- read-only/local-only;
- no provider calls;
- no dispatch;
- no task creation;
- no Watch row, Discovery, Evidence/EVEidence, Hydration, Assessment, schema, support artifact, UI, enforcement, or result write.

Recommendation:

Useful if Atlas wants another boring mechanical proof before advisory review, but it may be less valuable than asking whether this proof is actually needed.

### 3. Rest Watch Runtime And Return To Another Storage/Runtime Seam

Purpose:

Pause Watch runtime hardening now that setup-to-plan posture is coherent, and choose another storage/runtime boundary.

Possible seams:

- support artifact posture after data-intent review;
- local readability / Hydration request pickup refinement;
- storage setup authority or budget posture;
- runtime enforcement remains parked until execution facts are stronger.

Recommendation:

Reasonable if Human wants a breath from Watch mechanics.

## Recommended Next Motion

Recommended next seam:

```txt
Watch Runtime Movement Readiness Advisory
```

Reason:

Atlas has reached the edge between read-only runtime planning and execution-adjacent proof. That is exactly where a small advisory check is cheaper than a wrong Dev packet.

The advisory should answer:

- Is a no-dispatch executor/tick dry-run the right next proof?
- If yes, what would it prove that HS327 does not?
- If no, what should be proven first?
- What facts must be present before any task creation, dispatch, or provider movement is considered?

## Human Decision Needed

Human/Overseer should choose whether to:

1. open the Watch Runtime Movement Readiness Advisory;
2. open the packet-plan/outcome-map conformance preview directly;
3. rest Watch runtime and choose another storage/runtime seam.

No Dev runway is opened by this decision surface.
