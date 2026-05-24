# AtlasLabAdoptionHS47: Overview Face Concept Adoption

Date: 2026-05-24
Role: Atlas Overseer
Status: Accepted as Atlas-local adoption guidance

## Lab Source Consulted

- `F:\Projects\AURA- Lab\workspace\LabRemoteConsumerConformanceHS66.md`
- `F:\Projects\AURA- Lab\workspace\archive\cross-project-relay\AtlasImportAdvisoryHS64-lab-presentation-adoption.md`

## Atlas Source Consulted

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/current-state/current-evidence-pipeline.md`
- `src/renderer/index.html`
- `src/renderer/app.js`
- `src/renderer/investigation.js`
- `src/renderer/shared.js`
- `src/renderer/styles.css`
- `scripts/verify-renderer-shell.js`
- `src/main/main.js`

## Adoption Decision

Accepted for a bounded Atlas Overview Face prototype.

The concept render is accepted as atmosphere, hierarchy, and interaction intent. It is not a pixel-perfect specification, terminology authority, source-project authority, or implementation instruction.

## Adopted As

Presentation pattern and interaction hierarchy only.

Atlas may adapt:

- dark instrument shell
- calm cyan highlights
- left navigation
- central current-lead/search area
- right-side evidence/status stack
- bottom local/security/status strip
- status cards that point toward Atlas-owned surfaces
- diagnostic demotion while preserving traceability

## Atlas Meanings Preserved

- `Evidence`: stored expanded ESI killmails and Atlas-derived activity events.
- `Discovery`: possible leads before accepted evidence creation.
- `Possible Leads`: Discovery output only, not Evidence.
- `Observation`: report-layer meaning derived from stored Atlas evidence.
- `Assessment Memory`: deliberate saved operator judgment, not evidence.
- `Watch`: active routine check configuration or behavior.
- `Marked`: operator attention or interest; Marked does not imply Watch.
- provenance: provider/source/run/citation basis for why an item exists.
- storage: Atlas-owned persisted local evidence and memory surfaces.
- renderer semantics: existing command/effect authority and service bridge behavior.

## Corrected / Bounded Wording

- Use `Watch`, not `Watcher`, unless the Human explicitly blesses `Watcher` as presentation-only.
- `Evidence` navigation is acceptable only if it opens stored evidence/provenance, not Discovery output.
- `Possible Leads` must remain Discovery output, not Evidence.
- `Assessment Memory` is acceptable only as deliberate operator memory.
- `API Gate` is acceptable as UI wording only if it maps to existing External API enabled/disabled state and does not imply new backend authority.

## Not Imported

- Lab source authority.
- Lab fixture family names.
- Lab state labels as Atlas enums.
- Lab-neutral sample meanings.
- Lab bridge assumptions.
- Full Lab presentation doctrine.
- Pixel-perfect render details.
- New backend, bridge, persistence, service, payload, or IPC terms.

## Smallest Safe Prototype

`Atlas Overview Face`, renderer-only.

Prototype intent:

- one overview screen built from the concept render's composition
- no full app redesign
- no backend/provider behavior changes
- no persistence changes
- no bridge/IPC/service/payload renames
- no CSS/test-id renames unless explicitly approved by Atlas Overseer
- no live/private/destructive actions

The center must honestly state whether search/discovery is using local stored context, External API, or both.

The right rail should contain:

- Stored Evidence
- Possible Leads
- Watch Status
- Assessment Memory

Each card should open or point toward an Atlas-owned surface using existing renderer/service paths.

## Verification Expectations

Use Atlas-local verification only:

```powershell
npm.cmd run verify:renderer-shell
npm.cmd run verify:command-authority
npm.cmd run smoke:electron
npm.cmd run verify:protected-terms -- --max-warnings 20
git status --short --branch
```

Run `npm.cmd run verify:all` if Dev touches broad evidence/report/live-gate copy or any shared service-facing assumption.

Do not run live smoke unless explicitly authorized by the Human.

## Stop Conditions

Stop and return to Overseer/Human if:

- Evidence and Discovery blur.
- Watch and Marked blur.
- API Gate implies new backend authority.
- the concept turns into a full redesign.
- implementation requires backend, bridge, persistence, service, payload, or contract changes.
- implementation requires live/private/destructive actions.
- renderer copy cannot honestly represent local stored context versus External API state.
