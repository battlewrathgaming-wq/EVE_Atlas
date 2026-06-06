# OverseerHS342 Discovery Intake Consumer Stub Candidate Proof Runway

Status: open
Date: 2026-06-06
Role: Overseer
Executor: Dev

## Human Intent

Atlas is narrowing the Watch path toward the live boundary one seam at a time:

```txt
How does Evidence get generated from user intent?
```

HS340 proved:

```txt
Watch task envelope -> Discovery bus input envelope
```

The next seam should prove how the shared Discovery intake bus can consume that input and produce candidate refs as plain stub output, without provider calls and without durable Discovery ref writes.

This keeps Discovery shaped as a reusable candidate intake bus for Watch now and User-driven Discovery later.

## Milestone

Atlas Storage And Runtime Hardening

## Current Packet

Add a read-only/local-only Discovery intake consumer proof that converts Watch Discovery bus input envelopes into stubbed candidate ref outputs.

Suggested verifier / proof name:

```txt
verify:discovery-intake-consumer-stub-candidates
```

Suggested helper/service names are flexible, but the proof must remain pre-persistence and no-provider.

## Product Requirement

Atlas should prove that Discovery bus input can become candidate refs without becoming durable Discovery refs or Evidence.

The proof should answer:

- can an actor Watch Discovery bus input produce stub candidate refs?
- can a system/radius Watch Discovery bus input produce stub candidate refs?
- does each stub candidate preserve source lane, source kind, scope key, Watch ID, task context, lookback/caps, and provenance?
- does each stub candidate carry candidate-only posture?
- are `killmail_id` and `killmail_hash` present as stubbed provider-return-like candidate fields?
- does system/radius preserve the accepted system context without treating center/radius as execution authority?
- do invalid/blocked/idle bus input states produce no candidate refs?
- does the proof stop before durable `discovered_killmail_refs` writes?

## Core Rule

```txt
Discovery intake consumer may produce stub candidate refs
stub candidate refs are not durable Discovery refs
stub candidate refs are not Evidence
```

## Technical Requirement

Implement the smallest read-only/local-only proof that composes:

- `buildWatchDiscoveryBusInputEnvelopeProof(...)`
- local fixture/stub candidate data only

The produced output should be plain data only and should include, where applicable:

```txt
source_lane: watch
source_kind: actor | system_radius
scope_key
watch_id
task_context
candidate_only: true
stub_only: true
provider_movement: false
discovery_refs_written: false
evidence_created: false
candidate_refs: [
  {
    killmail_id
    killmail_hash
    provider: zkill_stub
    candidate_only: true
    durable_ref_written: false
    evidence_created: false
    provenance
  }
]
```

Actor candidates should preserve actor source context.

System/radius candidates should preserve accepted system context:

```txt
accepted_system_ids
candidate_system_id
accepted_scope_source: stored_watch_scope
center_radius_role: provenance_and_management
center_radius_used_as_authority: false
```

## Required Cases

Verifier fixtures should prove at least:

- due actor Watch bus input:
  - emits one or more stub candidate refs;
  - candidate refs preserve Watch actor source context;
  - candidate refs include stub `killmail_id` and `killmail_hash`;
  - no durable Discovery refs are written.
- due system/radius Watch bus input:
  - emits one or more stub candidate refs;
  - candidate refs preserve stored accepted system context;
  - candidate refs include stub `killmail_id` and `killmail_hash`;
  - center/radius remain provenance/management only;
  - no durable Discovery refs are written.
- invalid stored scope:
  - emits no candidate refs;
  - reports `watch_scope_authority_invalid`.
- blocked/idle states:
  - disarmed, active-task, live/provider-gated, no-due, inactive, not-due, and backoff states emit no candidate refs.
- mutation boundary:
  - no provider calls;
  - no dispatch runner or collector invocation;
  - no durable Discovery ref writes;
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
- write `discovered_killmail_refs`
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
node --check <changed Discovery intake proof files>
npm.cmd run verify:discovery-intake-consumer-stub-candidates
npm.cmd run verify:watch-discovery-bus-input-envelope
npm.cmd run verify:watch-task-creation-fixture-proof
npm.cmd run verify:watch-task-creation-boundary
npm.cmd run verify:watch-packet-dry-run-dispatch-parity
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
workspace/DevHS342-discovery-intake-consumer-stub-candidates.md
```

The handoff should include:

- files changed;
- helper/proof names added;
- sample actor stub candidate output;
- sample system/radius stub candidate output;
- invalid stored scope result;
- blocked/idle state treatment;
- no-provider/no-durable-ref/no-Evidence proof;
- mutation boundary proof;
- verification commands and results;
- explicit statement that durable Discovery refs, Evidence/EVEidence, provider movement, Watch execution, schema, UI, enforcement, support artifacts, durable Watch results, relationship tags, and fourth-lane behavior remain unopened.

## Stop Conditions

Stop and report if:

- proof requires provider/live calls;
- proof requires writing `discovered_killmail_refs`;
- proof requires Evidence/EVEidence writes;
- proof requires invoking real dispatch runners or collectors;
- proof requires schema changes;
- stub candidate identity needs a product/authority decision rather than a mechanical proof;
- implementation makes the Discovery intake consumer Watch-only instead of shared candidate-intake machinery.
