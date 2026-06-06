# OverseerHS340 Watch Task To Discovery Bus Input Envelope Runway

Status: open
Date: 2026-06-06
Role: Overseer
Executor: Dev

## Human Intent

Atlas is narrowing the path for:

```txt
How does Evidence get generated from user intent?
```

HS338 proved the accepted Watch task envelope can cross into fixture-only task machinery without executing Watch or touching providers. The next seam is not live execution. The next seam is the reusable intake handoff:

```txt
Watch task envelope -> Discovery bus input envelope
```

Discovery should behave like a candidate-ref intake bus that Watch, Manual Discovery, Live Search, and future bounded sources can feed. This packet should prove the Watch-side input envelope only.

## Milestone

Atlas Storage And Runtime Hardening

## Current Packet

Add a read-only/local-only proof that converts accepted Watch task shape into a Discovery bus input envelope.

Suggested verifier / proof name:

```txt
verify:watch-discovery-bus-input-envelope
```

Suggested helper/service names are flexible, but the proof must not imply provider execution, Discovery ref persistence, or Evidence creation.

## Product Requirement

Atlas should prove that Watch task intent can be expressed as a shared Discovery intake request without becoming Discovery refs or Evidence.

The proof should answer:

- can actor Watch task shape produce a Discovery bus input envelope?
- can system/radius Watch task shape produce a Discovery bus input envelope?
- does system/radius input preserve stored accepted `included_system_ids`?
- do center/radius remain provenance and management only after acceptance?
- does the envelope carry source lane, source kind, scope key, lookback, caps, and task/run context?
- does the envelope state candidate-only posture?
- does invalid stored scope block before Discovery bus input?
- do blocked/idle states emit no Discovery bus input?

## Core Rule

```txt
Discovery bus input is acquisition intent
Discovery bus input is not Discovery refs
Discovery bus input is not Evidence
```

## Technical Requirement

Implement the smallest read-only/local-only proof that composes current Watch pre-live proof sources where possible:

- `watch.task_creation_boundary.preview`
- HS338 fixture task shape / `buildWatchTaskCreationFixtureProof(...)`
- existing Watch packet/dry-run/parity data if needed

The produced envelope should be plain data only and should include, where applicable:

```txt
source_lane: watch
source_kind: actor | system_radius
scope_key
watch_id
task_type
task_classification
candidate_only: true
discovery_refs_written: false
evidence_created: false
provider_movement: false
lookback_seconds
caps
task_context
provenance
```

Actor envelope should carry:

```txt
entity_type
entity_id
entity_name if available
```

System/radius envelope should carry:

```txt
accepted_system_ids
accepted_scope_source: stored_watch_scope
center_system_id as provenance/management
radius_jumps as provenance/management
center_radius_used_as_authority: false
```

## Required Cases

Verifier fixtures should prove at least:

- due actor Watch:
  - emits one Discovery bus input envelope;
  - `source_lane` is `watch`;
  - `source_kind` is `actor`;
  - task type is `watch.executor.actor.watch`;
  - candidate-only posture is true;
  - no Discovery refs or Evidence are created.
- due system/radius Watch:
  - emits one Discovery bus input envelope;
  - `source_lane` is `watch`;
  - `source_kind` is `system_radius`;
  - task type is `watch.executor.system.radius.watch`;
  - accepted system IDs match stored `included_system_ids`;
  - center/radius remain provenance/management and are not authority.
- invalid stored system/radius Watch:
  - emits no Discovery bus input envelope;
  - reports `watch_scope_authority_invalid`.
- blocked/idle states:
  - disarmed, active-task, live/provider-gated, no-due, inactive, not-due, and backoff states emit no Discovery bus input envelope.
- mutation boundary:
  - no provider calls;
  - no dispatch runner or collector invocation;
  - no Discovery ref writes;
  - no Evidence/EVEidence writes;
  - no Hydration/metadata writes;
  - no API log/warning writes;
  - unchanged durable Atlas table counts.

## Boundaries

Do not:

- execute a Watch
- invoke Watch dispatch runners
- call collectors
- call zKillboard, ESI, or any provider
- perform live/API calls
- write Discovery refs
- write Evidence/EVEidence
- write Hydration/metadata labels
- write API logs or warnings
- mutate real/operator Watch rows
- persist real runtime packet rows
- create real/product tasks beyond existing fixture-only proof use
- create a broad provider queue
- change schema
- implement renderer UI
- add popup/modal behavior
- redesign R-Scanner
- activate runtime enforcement or command blocking
- create support artifacts
- add durable Watch result identity
- add relationship tags
- rename source-owned terms
- update protected-word JSON
- open fourth-lane behavior

## Verification

Run focused checks:

```txt
node --check <changed Discovery bus input proof files>
npm.cmd run verify:watch-discovery-bus-input-envelope
npm.cmd run verify:watch-task-creation-fixture-proof
npm.cmd run verify:watch-task-creation-boundary
npm.cmd run verify:watch-packet-dry-run-dispatch-parity
npm.cmd run verify:watch-executor-tick-dry-run
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:protected-terms
git diff --check
git status --short --branch
```

If actual names differ, explain the actual commands in the handoff.

## Expected Handoff

Create:

```txt
workspace/DevHS340-watch-discovery-bus-input-envelope.md
```

The handoff should include:

- files changed;
- helper/proof names added;
- sample actor Discovery bus input envelope;
- sample system/radius Discovery bus input envelope;
- invalid stored scope result;
- blocked/idle state treatment;
- no-provider/no-ref/no-Evidence proof;
- mutation boundary proof;
- verification commands and results;
- explicit statement that Discovery refs, Evidence/EVEidence, provider movement, Watch execution, schema, UI, enforcement, support artifacts, durable Watch results, relationship tags, and fourth-lane behavior remain unopened.

## Stop Conditions

Stop and report if:

- proof requires provider/live calls;
- proof requires Discovery ref writes;
- proof requires Evidence/EVEidence writes;
- proof requires invoking real dispatch runners or collectors;
- proof requires schema changes;
- the Discovery bus input shape needs a product/authority decision rather than a mechanical proof;
- implementation would make Discovery bus input a Watch-only concept instead of a shared candidate intake shape.
