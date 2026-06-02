# DevHS200 - Local SDE Readiness Gap Lens

Status: complete pending Overseer review
Date: 2026-06-02
Milestone: Atlas Storage And Runtime Hardening
Command surface: `metadata.local_sde_readiness.preview`

## Summary

Added a read-only local SDE readiness gap lens so Atlas can inspect static lookup readiness separately from ESI Hydration.

The preview reports lookup table counts, import provenance posture, representative inventory/type and topology/geography gaps from local Evidence/EVEidence-derived rows, and boundary statements. It does not download/import SDE, call providers, write lookup tables, write Hydration output, change schema, or touch UI.

## Files Changed

- `src/main/services/localSdeReadinessPreviewService.js`
- `src/main/services/serviceRegistry.js`
- `src/main/services/enforcementDryRunService.js`
- `scripts/verify-local-sde-readiness-preview.js`
- `scripts/verify-command-authority.js`
- `scripts/verify-service-registry.js`
- `scripts/verify-passive-side-effects.js`
- `scripts/verify-enforcement-dry-run.js`
- `package.json`
- `workspace/current.md`

Pre-existing packet/context files also remained in the tree:

- `workspace/overview.md`
- `workspace/OverseerHS200-local-sde-readiness-gap-lens-runway.md`

## Preview Shape

`metadata.local_sde_readiness.preview` returns:

- readiness summary for topology lookup, inventory/type lookup, import provenance, and overall readiness
- table counts for `type_metadata`, `solar_systems`, `regions`, `constellations`, `system_adjacency`, `sde_imports`, and `sde_inventory_imports`
- latest topology and inventory import provenance where present
- gap groups:
  - `inventory_type_lookup_gap`
  - `topology_lookup_gap`
  - `import_provenance_gap`
- representative gaps with lookup type/id, Evidence/EVEidence-derived killmail anchors, source basis, counts, recommended local source, provider-needed false, and boundary text
- explicit Hydration/Evidence boundary statements

## Sample Output Summary

Focused fixture sample from `npm.cmd run verify:local-sde-readiness`:

```txt
type_metadata: 1
solar_systems: 1
regions: 0
constellations: 0
system_adjacency: 0
sde_imports: 0
sde_inventory_imports: 0
topology lookup ready: false
inventory/type lookup ready: true
import provenance ready: false
overall ready: false
```

Representative inventory/type gap:

```txt
gap_group: inventory_type_lookup_gap
lookup_type: inventory_type
lookup_id: 999999
killmail_ids: 8301, 8302
source_basis: ship_type_id, weapon_type_id
provider_needed: false
```

Representative topology/geography gap:

```txt
gap_group: topology_lookup_gap
lookup_type: solar_system
lookup_id: 30099999
killmail_ids: 8302
source_basis: activity_events.solar_system_id, killmails.solar_system_id
provider_needed: false
```

Import provenance gaps:

- `sde_imports`
- `sde_inventory_imports`

## SDE / Hydration Separation

Local SDE readiness repairs static local labels and geometry, such as ship/type names and solar-system/topology labels.

ESI Hydration repairs entity readability labels.

Local SDE gaps are not provider-needed entity Hydration, do not create Evidence/EVEidence gaps, and do not authorize live ESI label work. Missing static labels degrade display/readiness only.

## Boundary Confirmation

No SDE download/import, provider calls, lookup writes, Hydration writes, persisted queue, schema changes, support artifacts, runtime enforcement, command blocking, UI work, Evidence/EVEidence creation, Discovery mutation, Watch mutation, Assessment Memory mutation, Marked mutation, pruning, or deletion behavior was added.

## Verification

Syntax checks:

```powershell
node --check src\main\services\localSdeReadinessPreviewService.js
node --check src\main\services\serviceRegistry.js
node --check src\main\services\enforcementDryRunService.js
node --check scripts\verify-local-sde-readiness-preview.js
node --check scripts\verify-command-authority.js
node --check scripts\verify-service-registry.js
node --check scripts\verify-passive-side-effects.js
node --check scripts\verify-enforcement-dry-run.js
```

All syntax checks passed.

Required and focused verification:

```powershell
npm.cmd run verify:local-sde-readiness
npm.cmd run verify:metadata-lookup
npm.cmd run verify:sde-build-lookups
npm.cmd run verify:hydration-candidate-preview
npm.cmd run verify:hydration-attention-lens
npm.cmd run verify:app-readiness
npm.cmd run verify:service-registry
npm.cmd run verify:command-authority
npm.cmd run verify:passive-side-effects
npm.cmd run verify:enforcement-dry-run
npm.cmd run verify:protected-terms
```

All listed npm verification commands passed.

`verify:protected-terms` completed with warning-only advisory output:

```txt
warning count: 422
files scanned: 11
confirmation: warning-only; no renames performed; no protected-word JSON updates performed
```

Final hygiene commands are recorded in `workspace/current.md` after completion.

Final hygiene:

```powershell
git diff --check
git status --short --branch
```

`git diff --check` passed with CRLF normalization warnings only.

`git status --short --branch` showed branch `main...origin/main` with HS200 working-tree changes.

## Risks / Notes

- The preview reports representative gaps, not a complete operator-facing cleanup/import plan.
- An event display label can be blank while local lookup metadata exists; this preview treats lookup coverage as the SDE readiness fact.
- SDE import/download controls remain unopened and require a separate runway.
