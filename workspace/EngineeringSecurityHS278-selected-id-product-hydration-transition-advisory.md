# Engineering Security HS278 - Selected-ID Product Hydration Transition Advisory

Status: advisory artifact
Role: Engineering / Security / Data Engineering / Product Architecture advisory
Date: 2026-06-05
Request: `workspace/OverseerHS278-selected-id-product-hydration-transition-advisory-request.md`

## 1. Executive Recommendation

Selected-ID Hydration should not move directly from HS276 proof/test machinery into product behavior.

HS276 is strong evidence that Atlas can perform one tightly bounded ESI `/universe/names` lookup and write only Hydration/readability rows when the environment is controlled. It is not product authority. The product transition needs one more authority-shaping step before any product execution command exists.

Recommended disposition:

- keep HS276 as proof evidence only;
- shape product selected-ID Hydration as an explicit operator act, not background work;
- keep product execution non-renderer/trusted first if opened later;
- allow renderer-readable preflight/explanation to continue, but do not allow renderer-triggered provider contact yet;
- do not add Bucket/Dispatcher machinery for selected-ID Hydration now;
- open only a smallest next packet that proves product command authority and product preflight/revalidation without provider calls or writes.

Product selected-ID Hydration is not ready for implementation as live product behavior today. It is ready for a bounded product-transition contract/preflight packet if Overseer chooses to continue this seam.

## 2. Proof Scaffolding That Must Not Become Product Behavior

These HS276 elements are verification scaffolding and must not become product authority:

- `metadata.hydration_selected_id_real_execution_proof`;
- `allowHydrationSelectedIdRealExecutionProof`;
- `controlledTempAtlasStore`;
- fixed target `character:92418041`;
- Human-owned test ID as a default or hidden fixture;
- seeded unresolved `activity_events` basis in a disposable store;
- verifier-created rows and table-count expectations as product shape;
- `.tmp/hydration-selected-id-real-execution/...` as DB/storage authority;
- proof-only run type `selected_id_real_hydration_execution_proof`;
- proof trigger `trusted_proof`;
- proof-only service assumptions that support `character` only;
- proof command non-renderer status as a substitute for product command authority;
- opt-in live proof environment and verifier path as product permission.

The evidence Atlas may inherit from HS276 is narrower: the local-first posture chain can be rebuilt, the live provider attempt path can be entered, the ESI response can be validated, and the write boundary can be limited to readability repair rows.

## 3. Product Authority Model Needed Before Productization

Product selected-ID Hydration needs authority from current Atlas state, not from test handles.

The product authority model should require:

- one explicit operator request for one unresolved local ID;
- an Atlas-local basis proving the ID already exists in local records;
- local label lookup immediately before provider contact;
- External I/O readback from persisted operator config;
- live/provider gate attempt through `enterLiveProviderAttempt('metadata.hydration', ...)`;
- storage/write posture from the actual Atlas storage authority readout;
- command authority equivalent to `confirm:metadata.hydration`;
- response validation before any write;
- write finalization only after the Hydration readability transaction succeeds or fails under policy.

Request posture and pickup contract can remain useful, but only as rebuilt execution-time facts. They are not authorization. Renderer payloads, preflight output, pickup digests, and prior proof output must remain hints/explanations only.

## 4. Product Command / Run Type Recommendation

A later product command, if opened, should be separate from the proof command. Safer temporary wording:

```txt
metadata.hydration_selected_id.execute
```

or:

```txt
metadata.selected_id_readability_repair.execute
```

The second name is technically clearer because the product outcome is readability repair, not Evidence/EVEidence creation. Overseer should choose the exact command name before Dev.

The product run type should not include `real`, `proof`, or `execution_proof`. Safer run type:

```txt
selected_id_readability_repair
```

Alternative:

```txt
selected_id_hydration
```

`selected_id_readability_repair` is recommended because it keeps the durable row aligned with Atlas language: IDs are facts, labels are readability.

## 5. DB / Storage Authority Requirements

Product behavior must derive DB/storage authority from the actual Atlas runtime/store context.

Required before product provider contact:

- the DB handle is the current operator Atlas corpus, not a verifier-created temp store;
- storage authority readback is valid for write-capable Hydration;
- selected storage or acknowledged fallback is accepted under current storage rules;
- budget posture does not hard-block writes;
- storage write posture allows metadata/readability repair;
- renderer-supplied path, storage, budget, or acknowledgement claims are ignored;
- no support artifact, config write, schema write, or storage mutation is bundled into the Hydration command.

`controlledTempAtlasStore` should be treated as a positive proof blocker for product behavior: if a future product command sees that flag, it should not treat it as proof that product storage is safe.

## 6. Local Basis Requirements

Product selected-ID Hydration should qualify only IDs that already have Atlas-local basis.

Strong qualifying basis:

- `activity_events` rows derived from ESI-expanded Evidence/EVEidence;
- an existing `entities` row where the ID is already local but missing a label;
- report/Observation-local unresolved IDs backed by stored Evidence/EVEidence appearances.

Conditional basis that needs Overseer policy:

- `watchlist_entities`, because Watch is acquisition intent, not Observation;
- `assessment_artifacts`, because Assessment Memory is human-authored judgment, not provider truth;
- Discovery refs, because Discovery remains possible leads/provenance, not Evidence/EVEidence.

Recommendation: first product selected-ID Hydration should require Evidence/EVEidence-derived appearance basis or an existing local `entities` row. Watch and Assessment basis may be disclosed as attention context, but should not by themselves authorize first product provider contact unless Overseer deliberately accepts that policy.

Static IDs remain outside ESI Hydration: `inventory_type` and `solar_system` should use local SDE/topology lookup posture, not ESI `/universe/names`.

## 7. Confirmation / Renderer Eligibility Recommendation

Product selected-ID Hydration should be non-renderer/trusted first, renderer-triggerable later.

Reasoning:

- renderer-readable preflight is already useful and safe because it is read-only;
- provider contact and corpus writes are a materially different trust boundary;
- the UI confirmation model has not been accepted;
- current proof command rejects renderer invocation, which is appropriate for proof but not a full product UX design;
- command authority should be accepted before any renderer button or report action can trigger provider contact.

Required authority for later execution:

- explicit operator act;
- one selected unresolved ID;
- clear confirmation authority such as `confirm:metadata.hydration`;
- no implicit execution from focus, hover, report load, pickup eligibility, or External I/O re-enable.

## 8. Runtime Gate And Revalidation Requirements

Product execution must rebuild trusted facts immediately before provider contact:

- normalize selected ID type/value;
- confirm supported provider-backed Hydration type: `character`, `corporation`, or `alliance`;
- reject malformed, unsupported, missing, zero, negative, or unsafe integer IDs;
- confirm the operator act is explicit;
- rebuild Hydration request posture from local DB state;
- rebuild pickup contract as non-durable candidate only;
- verify Atlas-local basis still exists;
- short-circuit if a local label now exists;
- verify this is not a local SDE/static lookup case;
- re-read External I/O state;
- re-read storage/write posture;
- enter the live provider attempt path, not read-only gate posture only;
- check cooldown, lockout, User-Agent, live API enablement, and duplicate active work;
- validate provider response ID, category, and label safety before writing;
- recheck local state before write to avoid stale duplicate repair;
- finalize metadata run from actual outcome.

These facts should be rebuilt from trusted main-process state. Preflight payload, renderer payload, request digest, pickup digest, and prior proof result must remain explanation only.

## 9. Allowed Writes And Forbidden Mutations

Allowed product writes, if later accepted:

- `metadata_runs` for the selected-ID readability repair attempt;
- `api_request_logs` with provider `esi`, run type `metadata`, sanitized endpoint/error fields, only if provider contact occurs;
- selected `entities` row for `character`, `corporation`, or `alliance` label cache;
- matching `activity_events` readability label columns only.

Forbidden mutations:

- `killmails`;
- raw ESI killmail payloads;
- numeric `activity_events` facts, including IDs, roles, killmail IDs, ship IDs, system IDs, damage, final blow, timing, or provenance facts;
- `discovered_killmail_refs`;
- `fetch_runs`;
- `ingestion_audits`;
- Evidence-related `data_quality_warnings`;
- Watch rows;
- Marked / `watchlist_entities`;
- Assessment Memory / `assessment_artifacts`;
- storage config;
- External I/O config;
- schema;
- Bucket, Dispatcher, worker, lease, retry, or persisted queue state;
- support artifacts;
- renderer UI state;
- runtime enforcement / command blocking state.

The existing `applyResolvedNames(...)` shape matches the allowed write class: `entities` plus null-only readability patches on `activity_events`. Product verification should keep proving that numeric facts do not change.

## 10. Provider Error / Unresolved / Partial-State Handling

Product behavior should distinguish no-contact states from contacted-provider outcomes.

Before provider contact:

- local short-circuit: return local readability result; no provider call; preferably no provider-attempt `metadata_runs` or `api_request_logs` row;
- External I/O off: held, not failure; no provider call or write;
- cooldown/lockout active: held, not failure; no provider call or write;
- storage write blocked: blocked before contact; no provider call or write;
- malformed/unsupported ID or insufficient basis: rejected before contact; no provider call or write.

After provider contact:

- resolved valid response: finalize as success and write allowed readability rows;
- unresolved selected ID: finalize as partial or failed under a named policy, with `requested_from_esi=1`, `resolved=0`, `unresolved=1`, no entity upsert, no activity label patch;
- category mismatch: finalize as failed/rejected provider response; no label write;
- unsafe/empty label: finalize as failed/rejected provider response; no label write;
- provider/network/HTTP error: finalize as failed with sanitized error; no label write;
- retry-after/rate limit: persist sanitized API log if a request was made, respect the live/provider cadence state, and avoid automatic retry loops unless a later retry policy is explicitly opened.

Current schema can represent basic success/failed/unresolved counts in `metadata_runs` and request details in `api_request_logs`. It cannot richly model durable retry policy or per-ID unresolved history without overloading summaries. That is acceptable for direct explicit selected-ID Hydration, but it should remain a known limitation.

## 11. Bucket / Dispatcher Recommendation

Product selected-ID Hydration does not need Bucket or Dispatcher machinery now.

The correct near-term shape remains:

```txt
explicit operator-selected unresolved ID
-> product authority/preflight
-> execution-time revalidation
-> one ESI names lookup if still needed
-> readability repair write
```

Bucket/Dispatcher should remain parked until Atlas opens background Hydration, multi-ID report hydration, Watch/background Hydration pickup, retry/lease persistence, or broad provider work smoothing.

The fourth lane remains parked. Do not reopen it for selected-ID Hydration.

## 12. Smallest Safe Next Packet

Smallest safe next packet, if Overseer wants to continue:

```txt
selected-ID product Hydration authority/preflight contract
```

Scope:

- read-only;
- product command contract shape only;
- no provider calls;
- no Hydration writes;
- no corpus mutation;
- no schema;
- no Bucket/Dispatcher;
- no UI;
- no runtime enforcement.

It should prove that Atlas can derive product-selected-ID facts without HS276 scaffolding:

- product command name candidate and run type candidate are disclosed;
- proof flags are rejected or marked non-authority;
- fixed ID is not required;
- real local basis can be classified;
- local label short-circuit can be detected;
- storage authority comes from current storage readback;
- External I/O and live gate posture are rebuilt;
- command authority requirements are named;
- expected allowed writes and forbidden mutations are disclosed.

Do not open product provider-backed execution until that authority/preflight contract is accepted.

## 13. Verification Evidence Expected

Before any product command implementation, verification should cover:

- proof flags do not authorize product behavior;
- fixed HS276 ID is not special;
- temp-store context is not product storage authority;
- renderer-supplied storage, External I/O, label, gate, or local-basis claims are ignored;
- explicit operator act is required;
- focus, hover, navigation, and report load are not requests;
- supported entity ID types pass shape checks;
- static/local lookup IDs do not use ESI names;
- malformed/unsupported IDs are rejected before provider contact;
- missing Atlas-local basis is rejected before provider contact;
- local label short-circuits before provider contact;
- External I/O held state produces held, not failure;
- cooldown/lockout is held, not catch-up dispatch;
- storage write block stops before provider contact;
- allowed writes are limited to `metadata_runs`, sanitized `api_request_logs`, selected `entities`, and `activity_events` label columns;
- forbidden tables remain unchanged;
- no Bucket/Dispatcher/worker/lease/retry/schema/enforcement/UI side effects appear.

For a later execution packet, verification should include fixture provider responses for success, unresolved, category mismatch, unsafe label, provider error, local short-circuit, External I/O held, storage blocked, live gate blocked, untrusted context, and renderer rejection. A live/API proof would require a separate explicit Overseer runway.

## 14. Parked Items

Remain parked:

- product live selected-ID Hydration execution;
- renderer-triggered provider-backed Hydration;
- UI confirmation behavior;
- background Hydration;
- report-wide or multi-ID Hydration execution;
- Watch/background Hydration pickup;
- Bucket persistence;
- Dispatcher / worker / lease / retry / queue dispatch;
- runtime enforcement activation;
- command blocking;
- schema changes;
- support artifacts;
- corpus pruning/deletion;
- fourth lane / fast lane;
- treating Watch, Assessment Memory, or Discovery refs as standalone authority for provider Hydration.

## 15. Human Or Overseer Decisions Needed

Human / Overseer decisions needed before Dev:

- whether selected-ID Hydration should become a product command now or remain parked after HS276;
- exact product command name;
- exact product run type, with `selected_id_readability_repair` recommended;
- whether first product behavior is trusted non-renderer only, with renderer trigger parked;
- what local basis policy qualifies an unresolved ID;
- whether Watch/Assessment basis can ever authorize provider Hydration without Evidence/EVEidence appearance basis;
- whether unresolved provider responses should be `partial` or `failed` in `metadata_runs`;
- whether local short-circuit should create any audit row or remain no-write;
- whether a read-only product authority/preflight contract should be the next packet.

Recommended Overseer disposition:

- safe to keep as conceptual/product-transition artifact;
- needs Overseer decision before Dev;
- needs a bounded read-only contract/preflight packet before product execution;
- not ready for Dev implementation of provider-backed product behavior;
- not ready for renderer/UI;
- safe to translate into a future bounded Dev packet only for authority/preflight, not live execution.

## Files / Context Reviewed

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/OverseerHS278-selected-id-product-hydration-transition-advisory-request.md`
- `docs/adr/ADR-0006-selected-id-hydration-proof-is-not-product-flow.md`
- `workspace/OverseerHS276-selected-id-real-hydration-execution-proof-runway.md`
- `workspace/DevHS276-selected-id-real-hydration-execution-proof.md`
- `workspace/OverseerHS277-hs276-selected-id-real-hydration-execution-proof-review.md`
- `workspace/EngineeringSecurityHS274-selected-id-real-hydration-execution-gate-advisory.md`
- `docs/features/data-layer-boundaries.md`
- `docs/contracts/metadata-hydration-contract.md`
- `src/main/services/hydrationSelectedIdRealExecutionProofService.js`
- `src/main/services/hydrationSelectedIdRealExecutionPreflightService.js`
- `src/main/services/hydrationRequestPostureService.js`
- `src/main/services/hydrationPickupContractService.js`
- `src/main/services/liveApiGateService.js`
- `src/main/services/externalIoStateService.js`
- `src/main/services/storageSetupGateReadoutService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/db/evidenceRepository.js`
- `src/main/db/schema.sql`
- `src/main/metadata/reportHydrator.js`

Note: the HS278 request listed `src/main/services/liveGateService.js`; the current code path reviewed is `src/main/services/liveApiGateService.js`.

## Advisory Verification

No code implementation, provider calls, live/API checks, Hydration writes, corpus mutation, schema work, Bucket/Dispatcher work, runtime enforcement, support artifact creation, or UI work were performed.

Local checks performed for this advisory:

```txt
Test-Path workspace\EngineeringSecurityHS278-selected-id-product-hydration-transition-advisory.md
```

Result before artifact creation: `False`.
