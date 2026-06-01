# AURA Atlas Workspace Overview

Status: Active breadcrumb map
Last reviewed: 2026-06-01

## Vision Statement

AURA Atlas is a local-first EVE Online evidence workstation.

It stores expanded ESI killmails as Evidence/EVEidence, keeps zKillboard discovery as possible leads/provenance, supports scoped operator workflows, and preserves reviewable evidence/assessment boundaries without hidden live collection.

Current product compass:

- truth
- dignity
- patience
- local-first memory
- respectful provider use
- one hardening seam at a time

## Coordination Model

- `workspace/current.md` is the only active executable work packet.
- `workspace/critical/` protects Atlas-owned meanings and critical assets.
- `docs/` holds durable product truth.
- `workspace/complete/` holds completed milestone bundles.
- `workspace/archive/` holds inactive historical material.
- `workspace/to-be-sorted/` is an inactive sorting tray for material removed from the working desk.

Shared checkpoints, Shapespace, Orchestration shelves, and external advisory spaces are lookup/context only until Human/Overseer deliberately adopts material locally.

## Active Milestone

Milestone: Atlas Storage And Runtime Hardening

Current state:

- HS148 accepted
- HS150 accepted
- HS152 accepted
- HS154 accepted
- HS156 accepted
- HS158 accepted
- HS160 accepted
- HS162 accepted
- HS164 accepted
- HS166 accepted
- HS168 accepted
- current executor is Dev
- active Dev runway is HS170 inactive service-boundary hook
- current work is a non-blocking boundary plumbing proof; active command blocking, artifact creation, provider-backed Hydration, and runtime enforcement activation remain unopened

Current heading:

- system hardening next
- operational usefulness over architectural finality
- one hardening seam at a time
- Atlas project root remains the anchor

Likely next shaping candidates:

1. Review HS170 inactive service-boundary hook after Dev completes it.
2. Actual support artifact creation hardening if continuing the snapshot/trace-pack lane.
3. Real Hydration writer design or provider-backed Hydration gate, only after data-shape ambiguity is resolved.
4. Storage setup UI/renderer posture later, not now.

See `workspace/current.md` for current truth.

## Recent Provenance

Keep these as the near-memory breadcrumb trail:

- HS118 accepted `storage.setup_gate_readout` as read-only storage setup and disk-budget posture.
- HS119 captured restart state: no Dev runway open; storage setup remains conservative next lane.
- HS120 accepted surface discovery as advisory input only, not UI authority or Dev runway.
- Workspace desk clearing moved inactive UI/display/deletion/watch-recovery/shaping material to `workspace/to-be-sorted/`.
- HS121 accepted the Shapespace engineering model into Atlas as steering context: local DB inspection first, then provider lanes for zKill Discovery, ESI killmail expansion, fast/view metadata hydration, and background/patient metadata hydration.
- HS122 shaped the storage gate action matrix: local inspection first, provider movement only when needed and gated, writes only when storage trust is sufficient, and no enforcement before a bounded Dev proof.
- HS124 accepted HS123 after Overseer correction: `storage.setup_gate_readout.action_class_matrix` is read-only proof, and storage validity now takes precedence over budget hard-lock when classifying matrix state.
- HS126 accepted DevHS125 orientation: the next storage seam should be storage config / acknowledgement proof before enforcement.
- HS127 shaped the storage config / acknowledgement proof: Atlas must make selected storage, app-local fallback, fallback acknowledgement, invalidated acknowledgement, and budget config visible before enforcement.
- HS129 accepted HS128 after Overseer correction: `storage.setup_gate_readout.storage_authority` is read-only proof, renderer payloads cannot forge acknowledgement/path/budget facts, and trusted context budget now stays coherent in the authority readout.
- HS130 captured the storage config decision cluster that must be accepted before write-capable config: portable config home, config contents, fallback acknowledgement meaning, invalidation, budget requirement, and renderer authority.
- HS131 opened the storage config dry-run runway: Atlas is file-portable, target pattern is `<Atlas app/root>/config/storage-authority.json`, acknowledged fallback remains distinct, budget is mandatory before provider-backed acquisition/EVEidence writes, and the proof must not write config.
- HS132 accepted HS131: `storage.setup_gate_readout.storage_config_dry_run` now proves target path, would-write validation, simulated payload/readback, renderer safety, and no real config file creation.
- HS133 opened a bounded storage config write proof: fixture/offline write/readback behavior only, with no enforcement, no UI setup flow, no provider calls, and no operator-real config write outside fixture/test control.
- HS134 accepted HS133 after Overseer correction: `storage.authority_config.write_proof` now requires an explicit trusted allowed fixture root, proves atomic/staged write-readback behavior, remains non-renderer eligible, and does not create the real project-root config file.
- HS135 opened a bounded acknowledgement persistence proof: persist/read back app-local fallback acknowledgement as storage-authority memory, preserve fallback as distinct from selected storage, prove invalidation and missing-budget behavior, and avoid enforcement.
- HS136 accepted HS135 after Overseer correction: `storage.authority_config.acknowledgement_persistence_proof` now proves app-local fallback acknowledgement memory, rejects selected-storage input, proves invalidation/missing-budget behavior, remains non-renderer eligible, and does not create the real project-root config file.
- HS137 opened an enforcement dry-run command/effect map: read-only allow/block/conditional decisions before any runtime interception or command blocking.
- HS138 accepted HS137: `storage.enforcement_dry_run.command_effect_map` now proves representative command/effect allow, block, and conditional posture from storage gate state and service metadata while leaving runtime enforcement inactive.
- HS139/HS140 closed the HS138 coverage gap: every current `serviceRegistry` command now has enforcement classification metadata or explicit fixture/non-production posture, and the dry-run verifier exposes missing classifications as gaps.
- HS141 accepted Security audit input: enforcement classification is healthy inventory, not runtime policy; future enforcement needs composed gate state, and External I/O held-state is the preferred next safe seam.
- HS142 opened the External I/O held-state proof runway: provider-capable work should read as held when External I/O is off, local-only work should stay available, and re-enable must not imply catch-up flooding.
- HS143 accepted HS142: `support.gate_stack_readout` now proves External I/O held-state composition as read-only posture while keeping live.gate, Watch arming, storage safety, active task, and confirmation gates separate.
- HS144 opened a Hydration backlog preview runway: understand missing readability metadata from local records without provider calls, hydration writes, persisted queues, schema changes, or UI work.
- HS145 accepted HS144: `metadata.hydration_backlog.preview` now proves read-only local Hydration backlog shape, separates Evidence/EVEidence from readability metadata, separates local SDE gaps from provider-needed labels, and keeps External I/O held state as non-failure.
- HS146 opened a Support artifact path authority inventory runway: classify snapshots, trace packs, logs, temp/cache, SDE/import material, and related support artifacts by path authority, budget posture, External I/O relevance, cleanup stage, renderer safety, and sensitivity without creating or deleting files.
- HS147 accepted HS146: `support.artifact_path_authority.preview` now proves read-only support-artifact path authority, separates operational support from corpus-adjacent support, classifies cache by origin, splits rolling and retained snapshot posture, and ignores renderer-forged path claims.
- HS148 opened a Composed gate enforcement policy preview runway: define how storage, External I/O, live/provider cadence, Watch arming, active task, confirmation, destination/path authority, command classification, and trusted context would compose before any runtime command blocking exists.
- HS149 accepted HS148: `storage.composed_gate_policy.preview` now proves composed gate policy posture as a read-only preview, keeps `would_allow` as input only, marks unknown/unclassified future commands as inactive fail-closed policy intent, and leaves runtime enforcement unimplemented.
- HS150 opened a Hydration execution policy preview runway: define which Hydration work would be eligible, held, blocked, local-only, provider-needed, or deferred before any provider-backed Hydration writes or runtime enforcement exist.
- HS151 accepted HS150: `metadata.hydration_execution_policy.preview` now proves future Hydration execution posture as read-only policy, separates view/local-record, Watch/background, target/report-scoped, corpus hygiene, and local SDE lookup lanes, and keeps eligible states separate from authorization.
- HS152 opened an External I/O persisted state runway: prove fixture/offline persist-readback for the provider trust switch so external contact remains a conscious act before provider-backed writes or runtime enforcement exist.
- HS153 accepted HS152: `external_io.state_readout` and `external_io.state_persistence_proof` now prove fixture/offline External I/O state posture, renderer-forgery resistance, and no real config write while preserving External I/O on as release to normal gates rather than authorization.
- HS154 opened a Hydration writer fixture proof runway: prove the smallest trusted fixture/test Hydration write path for labels/readability metadata while preserving IDs as facts and avoiding provider calls, runtime enforcement, Evidence/EVEidence writes, Discovery mutation, and UI work.
- HS155 accepted HS154: `metadata.hydration_write_fixture_proof` now proves trusted fixture/test Hydration writes can patch activity-event readability labels from existing local `entities` while numeric IDs remain facts and Evidence/EVEidence, Discovery refs, Watch state, queues, providers, schema, and renderer UI remain untouched.
- HS156 opened a Real operator External I/O config runway: persist/read the provider trust switch from canonical app-local config while keeping External I/O separate from provider execution, runtime authorization, Watch arming, and catch-up behavior.
- HS157 accepted HS156: `external_io.state_config_readback` and `external_io.state_config_write` now make External I/O app-local operator config real while preserving `off` as held, `on` as release to normal gates, no runtime authorization, no catch-up flood, and no provider movement.
- HS158 opened a Real operator storage authority config runway: make storage setup and budget authority real at `<Atlas app/root>/config/storage-authority.json`, preserve app-local fallback storage as explicit operator posture, use `fallback_acknowledgement_needs_reconfirm`, and avoid enforcement, migration, provider movement, UI setup, and hidden device-invasive storage authority.
- HS159 accepted HS158 after Overseer cleanup: `storage.authority_config.readback` and `storage.authority_config.write` now make storage authority app-local operator config real while preserving 5GB as suggestion only, explicit operator budget persistence, renderer-forgery resistance, no runtime enforcement, no storage migration, and no real config file left by verification.
- HS160 opened a Support artifact creation policy preview runway: define read-only snapshot and trace-pack creation posture from accepted path authority, storage authority, budget, External I/O, command metadata, composed-gate, and enforcement dry-run state before any support artifacts are actually created.
- HS161 accepted HS160: `support.artifact_creation_policy.preview` now proves read-only snapshot/trace-pack creation policy posture, renderer-forgery resistance, External I/O local-only behavior, and budget/path/confirmation/trusted-context classification before artifact creation exists.
- HS162 opened a Runtime enforcement boundary preview runway: prove the service-command insertion point and representative composed decisions before any runtime command blocking or handler interception is activated.
- HS163 accepted HS162: `runtime.enforcement_boundary.preview` now proves the future service-command enforcement insertion point after renderer eligibility and confirmation checks, before task wrapping/handler dispatch, while keeping `would_allow`, External I/O on, and unknown/unclassified fail-closed as non-authorizing preview/policy posture.
- HS164 opened a Runtime enforcement evaluator runway: extract a small pure evaluator before any active command blocking exists.
- HS165 accepted HS164: `runtimeEnforcementEvaluator.evaluateRuntimeEnforcementDecision` now provides a reusable inactive decision shape with stable reason codes, while keeping dry-run `would_allow` and External I/O on non-authorizing.
- HS166 opened a dry runtime enforcement adapter runway: prove service-boundary fact assembly for the inactive evaluator without inserting enforcement into `invokeServiceCommand`.
- HS167 accepted HS166 after Overseer correction: `runtime.enforcement_adapter.dry_preview` now proves dry adapter fact assembly from command metadata/definition, payload, context, and explicit supplied gate facts; missing facts remain explicit; dry-run `would_allow` remains non-authorizing; and trusted/internal confirmation bypass is distinct from confirmation satisfaction.
- HS168 audited runtime enforcement activation readiness.
- HS169 accepted HS168: Atlas is not ready for active runtime blocking, but is ready for a narrower non-blocking service-boundary integration hook if Human/Overseer accepts touching `invokeServiceCommand` without behavior change.
- HS170 opened the first inactive service-boundary hook runway: Dev may touch `invokeServiceCommand` only to add a non-blocking preview hook after eligibility/confirmation and before task wrapping/dispatch, with no behavior change.

## Accepted Boundaries

- Discovery refs are possible leads / provenance, not Evidence.
- ESI-expanded killmail records are Evidence/EVEidence.
- Hydration repairs readability and labels; it does not create Evidence.
- Observation/reporting derives from local records and should disclose basis.
- Assessment Memory is human-authored judgment, not Evidence.
- Storage setup and disk-budget posture are trust boundaries.
- External I/O should hold provider-backed movement when off and must not cause catch-up flooding when re-enabled.
- Waiting is not failure.
- Atlas should inspect local records before provider movement.

## Durable Record Index

Current state:

- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-report-products.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/current-state/current-display-inventory.md`
- `docs/current-state/current-storage-runtime-hardening.md`

Features / contracts / decisions:

- `docs/features/`
- `docs/features/acquisition-and-hydration-clocks.md`
- `docs/features/observation-lookup-model.md`
- `docs/features/r-scanner-sequencer-presentation.md`
- `docs/features/display-boundary-principles.md`
- `docs/adr/`
- `docs/contracts/`
- `docs/statements/`
- `docs/terms/`
- `docs/schemas/`

Verification and audits:

- `package.json`
- `docs/audits/`
- `docs/runbooks/`
- `docs/roadmap/`

Workspace recovery:

- `workspace/current.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `workspace/to-be-sorted/README.md`
- `workspace/complete/`
- `workspace/archive/`

Shared coordination:

- `F:\Projects\Docs\Aura-Agent-Coordination\workspace-structure-authority.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\roles\README.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\roles\[role]\README.md`
- `F:\Projects\Docs\Aura-Agent-Coordination\roles\[role]\prompt.md`

## Recovery Rule

Use this file to regain orientation, then return to `workspace/current.md`.

If more provenance is needed, read narrowly:

1. recent handoffs still in `workspace/`
2. durable docs listed above
3. `workspace/to-be-sorted/` only when an older inactive artifact is explicitly relevant
4. shared/Shapespace/Orchestration material only when Human or the current question points there

Do not treat old workspace material, sorted material, or external shaping notes as active task queues.
