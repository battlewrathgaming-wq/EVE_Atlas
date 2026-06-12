# OverseerHS386 - HS385 Evidence/EVEidence Writer Landing Source Trace Review

Status: accepted
Date: 2026-06-07
Role: Overseer

## Reviewed

- `workspace/OverseerHS385-evidence-writer-landing-package-source-trace-request.md`
- `workspace/EngineeringTraceHS385-evidence-writer-landing-package-source-trace.md`
- `src/main/db/evidenceRepository.js`
- `src/main/workers/killmailIngestionWorker.js`
- `src/main/normalization/killmailNormalizer.js`
- `src/main/db/schema.sql`

## Result

HS385 is accepted.

The trace answers the request and gives Atlas enough basis to open the next narrow proof: a fixture-only Evidence/EVEidence writer landing package proof against a disposable DB.

Accepted source-trace findings:

- the current durable writer landing point is `EvidenceRepository.persistEvidencePackage(...)`
- the current no-provider package builder is `evidencePackageFromExpandedKillmails(...)`
- the normalizer remains the source of `killmails`, `activity_events`, `entity_updates`, `ingestion_audits`, and `data_quality_warnings`
- candidate refs remain Discovery possible leads and are not Evidence/EVEidence
- ESI-backed killmail/detail expansion belongs to Discovery provider movement, not Hydration
- Evidence/EVEidence begins at durable landed memory
- Hydration, Observation/reporting, Assessment Memory, Watch cadence, collector retirement, runtime redirect, dispatcher work, and schema remain outside this writer proof

## Source Check

Overseer spot-checked the key caution from the trace.

`persistEvidencePackage(...)` checks killmail conflict posture during the killmail loop, then separately loops all `activity_events`. That means current code can preserve an existing `killmails` raw row while still attempting to insert incoming activity rows from the new normalized package if their event keys differ.

That is not a blocker for HS385. It is exactly the behavior the next fixture proof must expose before Atlas builds runtime replacement work on top of the writer.

## Boundary Decision

Open the next packet as proof, not production hardening.

The next Dev packet should:

- use controlled fixture inputs and a disposable DB
- adapt selected-ready Discovery intake plus injected expanded ESI payloads into the current writer package path
- prove normal, rerun, local-cache, partial, malformed, and conflict behavior
- report whether conflict behavior is clean, risky, or requires a follow-up hardening packet

It should not change production writer semantics in the same packet unless the runway explicitly permits it. We want evidence first, then correction if needed.

## Verification

Overseer source inspection used:

```txt
rg -n "persistEvidencePackage|insertKillmailConflictWarnings|upsertKillmail|activity_events|INSERT.*activity|event_key" src\main\db\evidenceRepository.js
rg -n "evidencePackageFromExpandedKillmails|buildEvidencePackageFromRefs|normalizeKillmail|expandKillmail|provider_capacity_deferred" src\main\workers src\main\normalization src\main\db
rg -n "CREATE TABLE IF NOT EXISTS (killmails|activity_events|ingestion_audits|data_quality_warnings|discovered_killmail_refs|api_request_logs|metadata_runs|assessments)|CREATE TABLE (killmails|activity_events|ingestion_audits|data_quality_warnings|discovered_killmail_refs|api_request_logs|metadata_runs|assessments)" src\main\db\schema.sql
git status --short --branch
```

No runtime verification commands were run because HS385 was advisory/source trace only.

## Resting State

HS385 is accepted.

Recommended next action:

Open a narrow Dev runway for an Evidence/EVEidence writer landing package fixture proof. This should happen before runtime adapter work, actor Watch redirect, mixed collector retirement, live provider movement, schema work, or dispatcher/enforcement work.

