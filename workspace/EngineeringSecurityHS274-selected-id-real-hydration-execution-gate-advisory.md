# Engineering Security HS274 - Selected-ID Real Hydration Execution Gate Advisory

Status: advisory artifact
Role: Engineering / Security / Data Engineering advisory
Date: 2026-06-05
Request: `workspace/OverseerHS274-selected-id-real-hydration-execution-gate-advisory-request.md`

## 1. Executive Recommendation

Atlas is ready only for the smallest real provider-backed selected-ID Hydration execution proof.

Atlas is not ready for full product live behavior, renderer-triggered real Hydration, background Hydration, Bucket/Dispatcher machinery, or broad live testing.

HS268 proved the selected-ID execution/write lifecycle with injected fixture provider results. HS272 proved the read-only real execution preflight: local-first posture, pickup contract, External I/O, live/provider gate, storage write posture, supported selected-ID type, expected write path, and revalidation checklists. Together, these are enough to open a tightly bounded first real execution packet if Human/Overseer explicitly accepts provider contact.

Recommended classification:

```text
ready only for a smaller real-execution proof
```

That proof should be trusted/non-renderer only, one selected unresolved ID, `character` / `corporation` / `alliance` only, no Bucket, no Dispatcher, no schema, no UI, no background worker, and no generalized `metadata.hydration` reuse without selected-ID revalidation.

## 2. Ready / Not Ready / Smaller Proof

Ready:

- one trusted, non-renderer, real provider-backed selected-ID Hydration execution proof;
- one selected ID per invocation;
- provider contact only after execution-time revalidation;
- writes limited to Hydration/readability rows.

Not ready:

- renderer-triggerable real execution;
- full product live Hydration;
- report-wide or multi-ID selected-ID execution;
- background Hydration;
- Watch/background Hydration pickup;
- Bucket/Dispatcher/worker/lease/retry machinery;
- runtime enforcement or command blocking activation;
- UI behavior.

No additional no-contact proof is required before the smallest trusted real execution proof. HS272 already supplied the missing read-only preflight surface. The next confidence-changing proof is actual selected-ID provider contact under a tightly bounded command.

## 3. Smallest Safe Next Packet

Smallest safe execution packet:

```text
trusted selected-ID real Hydration execution proof
```

Suggested shape:

```text
explicit selected unresolved ID
-> rebuild local-first request posture
-> rebuild non-durable pickup contract
-> re-read External I/O
-> enter live provider gate with real attempt recording
-> create selected-ID metadata run
-> call ESI /universe/names for exactly one ID
-> validate provider response
-> write Hydration readability repair transaction
-> finalize metadata run
-> verify allowed rows only
```

The packet should be non-renderer eligible and require trusted context, such as an explicit `allowSelectedIdRealHydrationExecution` flag. This is not a Dev runway; Overseer would need to create one separately.

## 4. Trusted-State Revalidation Before Provider Contact

Future execution must rebuild from trusted local state immediately before external contact. It must not treat request posture, pickup contract, preflight output, renderer payload, request digest, or fixture proof as authority.

Required pre-contact revalidation:

- explicit operator/Human-accepted act for provider-backed selected-ID Hydration;
- exactly one selected ID;
- supported ID type: `character`, `corporation`, or `alliance`;
- positive safe integer ID;
- local Atlas basis exists;
- local label is still absent;
- local SDE/static lookup is not the correct path;
- request posture rebuilds as `provider_needed`;
- pickup contract rebuilds as non-durable candidate only;
- provider posture is `released_to_normal_gates_only`;
- External I/O persisted state is `on` / released to normal gates;
- live/provider gate allows `metadata.hydration`;
- storage/write posture allows Hydration readability writes;
- command authority and confirmation are satisfied in trusted context;
- active duplicate task/concurrency posture is clear enough for the narrow proof.

## 5. Required Local Short-Circuit

Execution must short-circuit before provider contact if any local label appears between request, pickup, preflight, and execution.

Local short-circuit sources include:

- `entities.entity_name`;
- matching `activity_events` readability label columns;
- existing local Watch/Marked label source where used as local readability basis;
- local SDE/static lookup tables for non-provider ID classes.

If a label is local, execution must not call the provider. It may return a local-readability result, but it should not write a provider-attempt `metadata_runs` / `api_request_logs` pair unless the future packet explicitly defines a local-only audit row. For the smallest proof, prefer no provider-attempt row on local short-circuit.

## 6. Gate Requirements

Provider/live gate:

- use the real attempt path, not only read-only `actionGate(...)`;
- prefer `enterLiveProviderAttempt('metadata.hydration', { idsToRequest: 1, targetType, targetId }, context)` or equivalent so accepted attempts record cooldown/cadence state;
- block if live API is disabled, User-Agent is missing, cooldown/lockout is active, or duplicate active task is detected;
- respect provider retry behavior from `HttpClient`.

External I/O:

- persisted state must be `on`;
- `off` / `held_by_external_io` is held, not failed;
- re-enable must not dispatch queued work or create catch-up flood.

Storage/write posture:

- Hydration readability repair writes must be allowed by storage setup/budget posture;
- budget hard-lock or storage write block must stop before provider contact if a successful provider response would require local write;
- the packet must not activate runtime enforcement.

Command authority:

- first proof should be trusted-context only and non-renderer eligible;
- require explicit Human/Overseer acceptance of provider contact before a Dev runway exists;
- require a command authority/confirmation equivalent to `confirm:metadata.hydration`;
- renderer confirmation/UI should remain parked.

## 7. Provider Response Validation

Before writing readability repair, the real provider response must be validated at least as strictly as HS268 fixture response validation.

Required checks:

- response is an array/object shape expected from ESI `/universe/names/`;
- exactly the selected ID is resolved, or unresolved is handled as partial/no-label;
- provider response ID equals selected ID;
- provider category maps to selected ID type;
- category is one of `character`, `corporation`, `alliance`;
- label/name is present;
- label/name is bounded and safe for persistence;
- control characters or unsafe empty labels are rejected;
- mismatched, missing, unsupported, or malformed response causes no `entities` upsert and no `activity_events` label patch;
- provider/network/HTTP errors finalize run as failed/partial without mutating Evidence/EVEidence or Discovery.

## 8. Allowed Write Rows And Forbidden Mutations

Allowed writes for successful real selected-ID Hydration:

- `metadata_runs`
  - one selected-ID real Hydration run;
  - target type/value tied to the selected ID;
  - status/counters finalized from actual outcome.
- `api_request_logs`
  - provider `esi`;
  - run type `metadata`;
  - sanitized endpoint/error fields;
  - only if a provider attempt occurred.
- `entities`
  - selected `character`, `corporation`, or `alliance` row only.
- `activity_events`
  - matching readability label columns only;
  - no numeric fact changes.

Forbidden writes/mutations:

- `killmails`;
- raw ESI killmail payloads;
- `activity_events` numeric IDs, roles, killmail IDs, ship IDs, system IDs, damage, final-blow, timing, or Evidence facts;
- `discovered_killmail_refs`;
- `fetch_runs`;
- `ingestion_audits`;
- Evidence-related `data_quality_warnings`;
- Watch rows;
- Marked / `watchlist_entities` mutation;
- Assessment Memory / `assessment_artifacts`;
- storage config;
- External I/O config;
- Bucket/request/pickup persistence;
- Dispatcher, worker, lease, retry, or queue dispatch state;
- schema;
- support artifacts;
- renderer UI state.

## 9. Renderer Eligibility Recommendation

First real execution should be non-renderer only.

Reason:

- HS272 preflight is renderer-eligible as read-only explanation.
- Real provider contact is a materially different trust boundary.
- UI/confirmation copy and renderer behavior remain parked.
- A trusted non-renderer proof can validate real provider contact and write boundaries without also accepting product UX behavior.

Renderer-triggerable selected-ID Hydration can be reconsidered only after the first trusted real execution proof is accepted and Human/Overseer explicitly opens UI/confirmation behavior.

## 10. Bucket / Dispatcher Recommendation

Real selected-ID Hydration does not need Bucket or Dispatcher machinery now.

The first real execution can remain a direct explicit selected-ID act:

```text
operator-selected unresolved ID
-> trusted execution command
-> execution-time revalidation
-> one provider lookup
-> readability write
```

Bucket/Dispatcher should remain parked until Atlas opens background Hydration, Watch/background pickup, multi-ID paced release, retry/lease persistence, or multi-lane dispatcher behavior.

## 11. Expected Verification For Smallest Safe Packet

Expected no-live fixture/registry verification:

```text
node --check src\main\services\serviceRegistry.js
node --check <new selected-ID real execution service>
node --check <new verifier script>
npm.cmd run verify:hydration-selected-id-real-execution
npm.cmd run verify:hydration-selected-id-real-execution-preflight
npm.cmd run verify:hydration-selected-id-execution-fixture
npm.cmd run verify:hydration-pickup-contract
npm.cmd run verify:hydration-request-posture
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:passive-side-effects
git diff --check
git status --short --branch
```

The focused verifier should use injected/fake fetch or a controlled test double first to prove:

- successful selected-ID provider response;
- unresolved response;
- provider ID mismatch;
- provider category mismatch;
- empty/unsafe label;
- local short-circuit before provider contact;
- External I/O held;
- live gate blocked;
- storage writes blocked;
- provider error;
- no forbidden table mutations.

Do not run broad live testing as part of the first packet.

## 12. Live/API Evidence Needed Later

For later product acceptance, Atlas will need a separately accepted live/API evidence step, likely one controlled real ESI `/universe/names/` lookup for a known locally based unresolved ID.

That later evidence should show:

- exact command invoked;
- External I/O was on;
- live gate allowed;
- provider attempt was recorded/cadenced;
- `api_request_logs` row is sanitized;
- one `metadata_runs` row was finalized;
- selected `entities` row was written or unresolved state was recorded;
- only matching `activity_events` readability label columns changed;
- no Evidence/EVEidence, Discovery, Watch, Marked, Assessment Memory, schema, support artifact, Bucket, Dispatcher, or UI mutation occurred.

This should be a bounded live proof, not broad live testing.

## 13. Risks And Tradeoffs

Risks:

- existing `metadata.hydration` is report-scoped and should not be reused directly as selected-ID execution without the HS260/HS264/HS272 revalidation chain;
- current `runMetadataHydrationService` uses `requestControl: false`, so a selected-ID real execution packet should explicitly prove real accepted-attempt recording/cooldown behavior;
- ESI `/universe/names/` may return unresolved or category-mismatched data; write must be strict;
- storage posture should stop before provider contact if Atlas cannot write the successful result;
- renderer-triggered execution would combine provider trust, confirmation, and UI semantics too early;
- older `fast_view_metadata_hydration` labels still exist historically and should not revive a fourth lane.

Tradeoff:

- A trusted non-renderer first proof delays product UX slightly, but sharply reduces the chance of turning fixture/preflight evidence into accidental product-live behavior.

## 14. Parked Items

Remain parked:

- renderer-triggered real selected-ID Hydration;
- broad/live product Hydration acceptance;
- Bucket persistence;
- Dispatcher / worker / lease / retry / queue dispatch;
- background Hydration;
- Watch/background Hydration pickup;
- report-wide selected-ID replacement;
- schema changes;
- runtime enforcement activation;
- command blocking;
- support artifacts;
- UI behavior;
- fourth lane / fast lane;
- provider-backed SDE behavior;
- pruning/deletion.

## 15. Human Or Overseer Decisions Needed

Human / Overseer decision needed before any Dev runway:

- accept or reject crossing the provider-contact boundary for the first real selected-ID Hydration proof;
- decide command posture: trusted non-renderer proof only is recommended;
- decide exact command name and confirmation authority wording;
- decide whether the first real proof may use a controlled injected fetch implementation before any actual live ESI call;
- decide whether the first actual live ESI call, if any, happens in the same packet or a later explicit live evidence packet.

Recommended Overseer disposition:

- safe to translate into a future bounded Dev packet only after explicit provider-contact acceptance;
- not ready for renderer/product live behavior;
- no Bucket/Dispatcher/schema/UI work needed now.

## 16. Files / Context Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS274-selected-id-real-hydration-execution-gate-advisory-request.md`
- `workspace/OverseerHS270-hydration-real-execution-decision-surface.md`
- `workspace/DataEngineering-provider-work-structure-readiness-advisory.md`
- `workspace/OverseerHS271-provider-work-structure-readiness-review.md`
- `workspace/OverseerHS272-selected-id-real-execution-preflight-runway.md`
- `workspace/DevHS272-selected-id-real-execution-preflight.md`
- `workspace/OverseerHS273-hs272-selected-id-real-execution-preflight-review.md`
- `workspace/OverseerHS266-selected-id-hydration-execution-readiness-advisory-request.md`
- `workspace/DataEngineeringHS266-selected-id-hydration-execution-readiness-advisory.md`
- `workspace/OverseerHS267-hs266-hydration-execution-readiness-review.md`
- `workspace/OverseerHS268-selected-id-hydration-execution-fixture-proof-runway.md`
- `workspace/DevHS268-selected-id-hydration-execution-fixture-proof.md`
- `workspace/OverseerHS269-hs268-hydration-execution-fixture-proof-review.md`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/hydrationPickupContractService.js`
- `src/main/services/hydrationSelectedIdExecutionFixtureProofService.js`
- `src/main/services/hydrationSelectedIdRealExecutionPreflightService.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `src/main/metadata/reportHydrator.js`
- `src/main/api/esiClient.js`
- `src/main/api/httpClient.js`
- `src/main/api/endpointPolicy.js`
- `src/main/db/evidenceRepository.js`
- `src/main/db/schema.sql`

## 17. Advisory Verification

No provider calls, live/API checks, Hydration writes, schema changes, Bucket/Dispatcher work, runtime enforcement, or UI work were performed for this advisory.

Local verification performed:

```text
git status --short --branch
```

Result at artifact creation time: branch `main...origin/main` with this advisory artifact newly added/untracked.

