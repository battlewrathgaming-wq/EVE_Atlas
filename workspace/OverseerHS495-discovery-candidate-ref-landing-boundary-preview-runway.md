# OverseerHS495 - Discovery Candidate Ref Landing Boundary Preview Runway

Status: open
Date: 2026-06-12
Role: Overseer
Executor: Dev

## Human Intent

Atlas has proven the local control path up to future lease candidacy.

The next seam should prove the landing boundary for candidate refs without opening live provider calls. This should answer: if a future zKill provider response eventually returns `killmail_id + hash` pairs for a leased route packet, how would Atlas classify the Discovery ref landing posture without creating Evidence/EVEidence or letting Watch own the result?

This is still machinery proof, not live acquisition.

## Current Accepted Basis

Read first:

```txt
workspace/current.md
workspace/overview.md
workspace/OverseerHS494-hs493-discovery-dispatcher-lease-boundary-preview-review.md
workspace/DevHS493-discovery-dispatcher-lease-boundary-preview.md
workspace/OverseerHS492-hs491-discovery-pickup-execution-boundary-preview-review.md
workspace/DevHS491-discovery-pickup-execution-boundary-preview.md
```

Relevant accepted chain:

- HS489/HS490: inert zKill provider-route packet previews.
- HS491/HS492: pre-provider pickup execution boundary preview.
- HS493/HS494: dispatcher/lease boundary preview.

## Task

Add a read-only Discovery candidate-ref landing boundary preview.

Suggested command name:

```txt
discovery.candidate_ref_landing_boundary.preview
```

The preview should start from HS493 lease candidates and fixture/supplied provider-result examples. It should classify how candidate refs would be deduped and prepared for future Discovery memory landing, without writing refs or calling providers.

Expected behavior:

- consume or internally call the HS493 dispatcher/lease boundary preview path
- use fixture provider-result examples only; no live zKill/ESI/provider calls
- preserve route packet identity, Watch/run/bucket/scope/window/cap/provenance/source-selection basis
- classify candidate refs by `killmail_id + hash`
- distinguish:
  - new candidate ref
  - duplicate within same provider result
  - duplicate against fixture existing Discovery memory
  - malformed / missing hash
  - capped result posture, if fixture says cap was hit
  - provider deferred / failed posture, if fixture says no refs are available because provider did not return usable data
- state that candidate refs are Discovery refs / possible leads only, not Evidence/EVEidence
- preserve overlapping Watch/run provenance without duplicating Evidence
- keep Watch completion semantics out of this preview
- make clear that this preview does not write `discovered_killmail_refs`

## Required Boundary

Do not add:

- live provider calls
- zKill calls
- ESI calls
- executable provider packets
- real Discovery pickup execution
- real dispatcher runtime
- durable queues
- durable leases
- lease claims
- candidate-ref writes
- Discovery ref writes
- Evidence/EVEidence writes
- Hydration
- Observation/reporting behavior
- Watch cadence mutation
- Watch bucket status mutation
- receipt mutation
- schema changes
- runtime enforcement
- command blocking
- UI
- actor Watch migration
- `collectActorWatch(...)` retirement
- system/radius collector redirect
- source-term rename
- protected-word JSON update

## Implementation Notes

Prefer a small service under:

```txt
src/main/services/
```

Register it through existing service registry and command authority patterns.

This is a landing boundary preview, not the landing implementation. It may use fixture existing-memory rows inside the verifier/input to prove dedupe posture, but it must not write product tables.

Useful field names may include:

```txt
candidate_ref_landing_status
candidate_ref_kind
killmail_id
killmail_hash
landing_action_preview
dedupe_basis
provenance_relationship_preview
not_evidence
not_hydration
not_observation
```

Names can be adjusted to fit existing code style.

## Verification

Add a focused verifier and package script.

Run:

```txt
node --check src\main\services\[new-service].js
node --check scripts\verify-discovery-candidate-ref-landing-boundary-preview.js
npm.cmd run verify:discovery-candidate-ref-landing-boundary-preview
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
git diff --check
git diff -- src\main\db\schema.sql
git status --short --branch
```

The verifier should assert:

- fixture provider refs can be classified without provider calls
- `killmail_id + hash` is the candidate-ref identity basis
- duplicate refs do not become duplicate landing actions
- existing-memory fixture duplicates are disclosed as already known
- malformed/missing-hash refs are rejected before landing
- capped fixture posture is disclosed without treating it as failure
- no `discovered_killmail_refs` rows are written
- no Evidence/EVEidence rows are written
- no Hydration or Observation rows are written
- no Watch bucket, cadence, or receipt rows mutate
- no schema changes occur

## Expected Handoff

Create:

```txt
workspace/DevHS495-discovery-candidate-ref-landing-boundary-preview.md
```

The handoff should include:

- files changed
- command name
- summary of preview output
- dedupe/malformed/capped examples
- side-effect boundary evidence
- verification commands and results
- any unexpected coupling or stale terminology discovered

## Stop Conditions

Stop and report if:

- implementation requires live zKill/ESI/provider calls
- implementation requires schema changes
- implementation writes `discovered_killmail_refs`
- implementation writes Evidence/EVEidence
- implementation mutates Watch cadence, bucket status, or receipts
- implementation needs real dispatcher/lease behavior
- implementation blurs Discovery candidate refs with Evidence/EVEidence
- implementation makes Watch inspect Discovery memory directly for completion
