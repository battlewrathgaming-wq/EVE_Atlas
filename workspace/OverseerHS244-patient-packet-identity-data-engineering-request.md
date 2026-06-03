# Overseer HS244: Patient Packet Identity Data Engineering Request

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Executor: Data Engineering / Data Analyst
Expected artifact: `workspace/DataEngineeringHS244-patient-packet-identity-boundaries.md`

## Purpose

Review Atlas patient packet identity and durable unit-of-work boundaries before Dev implements any dispatcher, schema-backed provider queue, persisted sequencer, or provider-backed Hydration execution.

HS242 gave Atlas a useful read-only posture surface:

```txt
runtime.queue_clock_posture.preview
```

That surface shows local queue/clock state, but it must not become accidental architecture. This advisory should decide what the posture implies, what remains unresolved, and what future durable movement state would actually need to exist.

## Authority

This is advisory only.

Do not implement code. Do not write schema. Do not create Dev runways. Do not treat this request as authorization for provider calls, dispatch, persistence, runtime enforcement, command blocking, pruning/deletion, support artifacts, or UI work.

The source project keeps authority over Atlas terms and adoption. The advisory should ground findings in current Atlas docs/schema/code and recommend only bounded next steps.

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/features/persistent-discovery-ref-queue.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/expansion-selection-contract.md`
- `docs/contracts/metadata-hydration-contract.md`
- `docs/contracts/session-armed-watch-executor-contract.md`
- `workspace/DevHS242-queue-clock-runtime-posture-preview.md`
- `workspace/OverseerHS243-hs242-queue-clock-posture-review.md`
- `src/main/services/queueClockPostureService.js`
- `src/main/db/schema.sql`
- relevant queue, Watch, Hydration, fetch run, metadata run, and runtime preview code if needed

## Context

Accepted Atlas boundaries:

- Discovery refs are possible leads/provenance, not Evidence/EVEidence.
- ESI Evidence Expansion creates Evidence/EVEidence from selected `killmail_id` + hash refs.
- Hydration repairs readability labels for existing local IDs; it does not create Evidence/EVEidence.
- Watch is acquisition intent: target, scope, cadence, lookback, gates.
- Observation reconstructs local story; it is not Watch or provider movement.
- External I/O off holds provider-backed movement and must not create failure or catch-up flooding.
- Waiting is normal.

Accepted direction:

```txt
Acquisition Clock creates local facts.
Hydration Recovery Clock makes local facts readable.
```

HS242 now exposes:

- zKill Discovery lane posture
- ESI Evidence Expansion lane posture
- Watch/background Hydration lane posture
- view/local-record Hydration lane posture
- Discovery ref posture
- Watch/offline restart posture
- External I/O hold posture
- storage/setup posture
- read-only cadence/provider posture
- no-catch-up-flood posture

## Questions To Answer

1. What is the smallest durable unit of work, if any, for future patient provider packets?
2. Which state can remain derived from existing Watch, Discovery refs, fetch runs, metadata runs, API logs, and Hydration candidate previews?
3. Which state cannot be safely derived and would need future persistence?
4. Should Acquisition and Hydration share a generic work-item model, or should they remain separate data shapes?
5. What identifies a future Acquisition packet?
   - Watch config?
   - target/scope/lookback/cadence?
   - zKill request window?
   - ESI expansion ref?
   - provider/action/fingerprint?
6. What identifies a future Hydration packet?
   - entity ID?
   - label candidate key?
   - view/report scope?
   - Watch/background source?
   - provider/action/fingerprint?
7. How should Atlas avoid duplicate work after restart without over-persisting request-attempt logs?
8. How should Atlas avoid catch-up flooding after restart, storage unlock, or External I/O re-enable?
9. How should pending Discovery refs interact with fresh zKill Discovery?
10. How should selected ESI Evidence Expansion candidates be represented without making Discovery refs the sequencer?
11. How should Hydration backlog/readability demand be represented without making labels Evidence or starving view/local-record Hydration behind background work?
12. What current schema/code already supports this model?
13. What current schema/code makes this model risky or ambiguous?
14. What should be rejected or deferred?

## Expected Output

Return a concise but practical advisory artifact with:

1. Executive recommendation.
2. Current model summary from actual Atlas docs/schema/code.
3. Recommended future unit-of-work model.
4. What should stay derived/read-only for now.
5. What might need durable persistence later.
6. Acquisition packet identity recommendation.
7. Hydration packet identity recommendation.
8. Restart recovery and duplicate-work prevention model.
9. No-catch-up-flood model.
10. Relationship to `discovered_killmail_refs`.
11. Relationship to `metadata_runs` and Hydration candidates.
12. Risks, ambiguities, and false simplifications to avoid.
13. Smallest next Dev packet recommendation, if any.
14. Acceptance criteria for that future packet.
15. Verification evidence expected.
16. Human/Overseer decisions needed.

## Guardrails

- Do not propose a broad provider work queue unless clearly necessary.
- Do not make `discovered_killmail_refs` the sequencer.
- Do not blur Discovery refs with Evidence/EVEidence.
- Do not blur ESI Evidence Expansion with Hydration.
- Do not treat waiting, held, deferred, or missed slots as failure by default.
- Do not let External I/O re-enable imply catch-up flooding.
- Do not make view/local-record Hydration wait behind broad background Hydration unless a shared gate truly applies.
- Do not over-persist high-volume request-attempt logs unless there is a clear recovery reason.
- Prefer practical, low-data, recoverable models.
- Be willing to reject or narrow the concept if current Atlas structure does not justify it.

## Parked

- Dev implementation
- schema migration
- active dispatcher
- provider calls
- provider-backed Hydration execution
- ESI Evidence Expansion scheduling
- runtime enforcement activation
- command blocking
- support artifact creation
- pruning/deletion work
- renderer/UI work
