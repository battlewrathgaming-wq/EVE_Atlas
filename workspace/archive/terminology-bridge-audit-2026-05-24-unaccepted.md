# Terminology Bridge Audit

Date: 2026-05-24
Role: Aura terminology/state auditor
Status: Advisory artifact

## 1. Files Reviewed

- `AGENTS.md`
- `workspace/README.md`
- `workspace/overview.md`
- `workspace/current.md`
- `docs/current-state/seed-current-state.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-ipc-ui-preparation.md`
- `docs/current-state/current-report-products.md`
- `docs/current-state/current-manual-discovery-lane.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/features/presentation-layer-information-index.md`
- `docs/contracts/discovery-queue-contract.md`
- `docs/contracts/assessment-compaction-contract.md`
- `docs/terms/marked.md`
- `docs/terms/watchlist.md`
- `docs/terms/actor-watch.md`
- `docs/terms/system-radius-watch.md`
- `docs/terms/work-products.md`
- `src/main/db/schema.sql`
- `src/main/services/serviceRegistry.js`
- `src/main/services/mutatingActionService.js`
- `src/main/services/scopeService.js`
- `src/main/services/queueSelectionService.js`
- `src/main/services/retentionActionService.js`
- `src/main/services/runtimeSnapshotService.js`
- `src/main/support/operatorDebugTracePack.js`
- `src/main/assessment/assessmentArtifactRepository.js`
- `src/main/watchlist/watchlistRepository.js`
- `src/main/reports/actorReport.js`
- `src/main/reports/radiusReport.js`
- `src/main/reports/queueReport.js`
- `src/main/reports/corpusHealthReport.js`
- `src/renderer/index.html`
- `src/renderer/investigation.js`
- `src/renderer/queueWatch.js`
- `src/renderer/readiness.js`
- `src/renderer/reports.js`
- `src/renderer/actions.js`
- `src/renderer/scopes.js`
- `src/renderer/app.js`
- `src/renderer/shared.js`

Verification/status check:

```powershell
git status --short --branch
```

Observed output:

```txt
## main...origin/main
```

## 2. Short Current-State Understanding

Atlas has the right backend safety model for local alpha:

```txt
Discovery -> Evidence -> Observation -> Assessment
```

The expanded ESI killmail is the durable evidence record. zKill is discovery only. Reports render observations from stored evidence. Assessment memory is deliberate operator judgment with citation context and does not replace raw evidence.

The current risk is not mainly missing backend capability. The current risk is terminology drift across database names, service commands, and renderer copy. Several accurate backend terms are too abstract or implementation-shaped for the primary operator path.

The attention model must stay asymmetric:

```txt
Watch implies Marked.
Marked does not imply Watch.
```

Retention and deletion must remain blocked:

```txt
Deletion/evidence pruning is not an active product capability.
```

## 3. Terminology Bridge Table

| backend/db term | service/bridge term | frontend/user term | meaning | user-facing? | allowed use | avoid/conflicts | recommended disposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `discovered_killmail_refs` | `manual.discovery`, `report.queue`, `queue.selection` | Discovery / possible leads | zKill refs before ESI expansion | Yes, translated | Possible leads, discovery queue | Evidence, observation, activity | Preserve backend; bridge to "possible leads" |
| `killmails` | `manual.expansion`, reports | Stored evidence / expanded killmails | durable raw ESI killmail payloads | Yes | Evidence basis, citations | Intelligence, proof of intent | Preserve |
| `activity_events` | reports | observed appearances / activity events | normalized rows derived from killmails | Detail | Observation rows, timelines | conclusions, motive | Preserve; translate in primary UI |
| `assessment_artifacts` | `assessment.create/list/get` | Assessment Memory | deliberate saved judgment with citations | Yes, translated | Saved assessment cards/detail | raw evidence, automatic intelligence | Keep db internal; user term Assessment Memory |
| `assessment_artifact` | same | saved assessment detail | persistence object | No/detail | diagnostics/raw detail | primary copy | Keep internal |
| queue rows/status | `queue.selection` | Queue / Enrich, selected leads | refs selected for possible ESI expansion | Yes, translated | review before calls/writes | already evidence, automatic expansion | Bridge to "possible leads selected for Enrich" |
| `queue.selection` | `queue.selection` | queue preview | read-only expansion preview | Detail | service/debug/service map | primary label by itself | Keep bridge/internal |
| `fetch_runs` | task/report provenance | collection provenance | how refs/evidence arrived | Detail | report provenance | intelligence scope | Translate to provenance |
| `api_request_logs` | debug trace/report provenance | provider call history | zKill/ESI audit trail | Detail/support | diagnostics, live smoke | evidence | Keep internal/detail |
| `metadata_runs` | `metadata.hydration` | Refresh labels | readability-only label refresh | Yes, translated | report label refresh | evidence enrichment | Prefer "Refresh labels"; keep hydration in detail |
| `entities`, `type_metadata`, SDE tables | metadata services | labels / local lookup data | readable names and static lookup | Detail | labels beside IDs | facts replacing durable IDs | Preserve; user copy must say labels |
| `watchlist_entities` | `watch.create/list` | Marked | operator attention/interest | Yes | attention, tag, remember | active checking | Rename presentation to Marked |
| `actor_watch` / actor watch scope | `actor.watch`, `watch.schedule` | Watch | active routine actor check | Yes | configured check with gates/cadence | Marked, online/current presence | Preserve Watch only for active checks |
| `system_watches` | `system.radius.watch` | System / Radius Watch | active routine area check | Yes | area/radius routine check | ownership/staging | Preserve |
| blocked/unblocked | `watch.schedule`, live gate | blocked / ready | whether a watch/action can run now | Yes | operational run state | evidence conclusion | Use "ready" more than "unblocked" |
| `scope`, `scope.validate` | `scope.defaults/validate` | lead/action bounds | normalized action limits | Detail | validation/settings | primary journey burden | Keep secondary; translate to "lead/action bounds" |
| readiness data | `app.readiness` | Readiness / diagnostics | local dependency and gate state | Yes, secondary | settings/support | main product flow | Keep but move out of primary path |
| corpus counts | `report.corpus_health` | Corpus health | local DB health/readiness | Yes, secondary | support/readiness | observation/assessment | Preserve as diagnostics |
| runtime db path/counts | `runtime.db_snapshot.*` | Runtime snapshot | explicit local DB copy | Yes, support | support/safety action | restore, pruning, backup policy | Preserve; keep wording explicit |
| trace pack tables | `support.debug_trace_pack` | Debug trace pack | bounded support artifact | Yes, support | failure review | evidence export | Preserve |
| `retention.preflight` | retention actions | retention preview | read-only impact preview | Detail/support | future policy review | executable deletion | Keep blocked/deferred in UI |
| `evidence.prune_scope` | retention action definition | none yet | future destructive evidence pruning | No | design/audit only | available action | Keep internal/blocked |
| `queue.expire_refs` | retention action definition | expire possible leads | future queue cleanup | No/detail | future policy only | deleting evidence | Deferred |
| Discovery | discovery services | Discovery | lead finding before evidence | Yes | first layer | evidence/observation | Preserve |
| Evidence | expansion/reports | Evidence | stored ESI killmails plus derived events | Yes | second layer | queue refs/assessments | Preserve tightly |
| Observation | reports | Observation | rendered pattern from evidence | Yes | report/story layer | proof/assessment | Preserve |
| Assessment | assessment services | Assessment Memory | deliberate judgment | Yes | saved memory | automatic intelligence | Prefer Assessment Memory |
| Record | none accepted | Record | possible future container | Deferred | open question only | durable term now | Do not adopt yet |
| Intelligence | none accepted | intelligence work | broad product category | Mostly no | generic project context | stored output label | Avoid as work-product term |
| Finding | none accepted | Finding | possible final reviewed output | Deferred | open question only | observation/assessment blur | Do not adopt yet |

## 4. Overloaded Or Risky Terms

- `enrich` / `enrichment`: risky because ESI expansion creates evidence, while metadata hydration only refreshes labels.
- `scope`: overloaded across user lead bounds, backend validation payloads, evidence report scope, discovery queue key, and watch radius.
- `queue`: can sound like execution or tasking rather than staging possible refs.
- `readiness`: accurate but currently too prominent for a discovery/story product.
- `watchlist`: conflicts with Watch. Current doctrine says watchlist rows should present as Marked when meaning is attention.
- `blocked` / `unblocked`: useful for action/watch run state, but must not sound like a target or tactical condition.
- `Record`: not accepted as a durable container term.
- `Intelligence`: product category, but unsafe as a stored work-product label because it can imply more certainty than evidence/observation supports.
- `Finding`: not accepted and can blur observation with assessment.
- `retention`, `prune`, `delete`, `expire`, `compact`: dangerous if they appear as available capabilities rather than read-only/deferred design language.

## 5. Terms That Should Remain Internal

- `assessment_artifact`
- `discovered_killmail_refs`
- `activity_events` in primary copy
- `fetch_runs`
- `api_request_logs`
- `metadata_runs`
- `scope.validate`
- `queue.selection`
- `discovered_by_type`
- `discovered_by_id`
- `raw_esi_payload`
- task classifications
- exact run/task IDs except in detail/support views
- `evidence.prune_scope`
- `queue.expire_refs`
- `runtime.delete_disposable_db`

## 6. Terms That Should Be User-Facing

- Discovery
- possible lead
- Enrich selected
- stored evidence
- expanded killmail evidence
- observed / observation
- evidence basis
- collection provenance
- Assessment Memory
- Marked
- Watch
- blocked / ready
- Refresh labels
- Readiness
- Corpus health
- Runtime snapshot
- Debug trace pack

## 7. Deletion / Retention Wording Review

### What Exists Now

- Read-only retention preflight.
- Read-only evidence compaction preview.
- Explicit assessment artifact creation from validated context.
- Explicit runtime DB snapshot creation.
- Verification that evidence counts and raw killmail payloads are preserved.

### What Is Blocked / Deferred

- Executable evidence pruning.
- Destructive retention actions.
- Automatic compaction.
- Deleting evidence because assessment memory exists.
- Runtime DB deletion as product capability.
- Queue or diagnostic pruning as active operator capability.

### What Must Not Be Implied

- Do not imply that `retention.actions` are available product actions.
- Do not imply that a preflight confirmation token authorizes deletion.
- Do not imply that compaction replaces evidence.
- Do not imply that assessment memory is enough reason to delete evidence.
- Do not imply that snapshots restore, prune, compact, or define backup policy.
- Do not imply that queue expiry affects killmails or activity events.

### Specific Risk

`src/main/services/retentionActionService.js` currently defines destructive action names such as `evidence.prune_scope`, `queue.expire_refs`, and `runtime.delete_disposable_db`, and `buildRetentionPreflight` can return `allowed: true` when the confirmation token matches.

That is acceptable only if every bridge/UI surface treats this as read-only preview/design support. Primary UI copy should not expose these as executable actions until a future accepted deletion policy and Dev packet exist.

## 8. Recommended Rewrites Or Bridge Aliases

| current/internal wording | preferred bridge/user wording | note |
| --- | --- | --- |
| `discovered_killmail_refs` | possible leads | Primary path should not show table name. |
| Discovery Queue | Possible leads / Discovery queue | Use "queue" only where staging/review is clear. |
| `queue.selection` | Queue preview / selected leads | Read-only preview; no ESI call. |
| selected refs | selected possible leads | Keeps evidence boundary visible. |
| `manual.expansion` | Enrich selected | Pair with "calls ESI and creates stored evidence." |
| enrichment | Enrich selected / Refresh labels | Split evidence creation from readability. |
| metadata hydration | Refresh labels | Keep hydration in detail/status only. |
| watchlist entity | Marked actor/entity | Watchlist is legacy/internal for attention. |
| unblocked | ready | Safer primary copy for action readiness. |
| scope | lead bounds / action bounds | Use scope in diagnostics/detail. |
| readiness | diagnostics / readiness | Keep as secondary support surface. |
| corpus health | local corpus health | Avoid sounding like tactical observation. |
| assessment artifact | Assessment Memory | User-facing saved judgment. |
| intelligence report | evidence report / observation report / assessment memory | Use lowest precise layer. |
| retention action | retention preview | Until deletion policy is accepted. |
| prune/delete evidence | blocked future evidence pruning | Do not present as current action. |

## 9. Risks / Blockers

- Final naming for `Record`, `Intelligence`, `Finding`, and Assessment variants is unresolved and should block broad UI copy adoption in those areas.
- `scope` and `queue` internals still appear early in the renderer, especially Scopes and Queue / Watches.
- `Readiness` remains mechanically useful but product-dominant for a first experience.
- `manual.discovery` is classified as `evidence-creating` in the service registry even though manual discovery queues refs only and writes no `killmails` or `activity_events`. That may be defensible for task locking/live mutation, but it is unsafe as user-facing wording.
- Retention service definitions include destructive action names even though current-state docs say deletion is blocked. This needs careful bridge wording before any UI exposure.
- Broad rename work would be risky now. Most terms should be bridged/translated at presentation boundaries first.

## 10. Suggested Next Bounded Packet

Create a small presentation terminology bridge packet that updates primary renderer copy only, with no database, service, IPC, or file renames.

Acceptance checks:

- First operator path does not expose `watchlist`, `assessment artifact`, `discovered_by_*`, `scope normalized`, `metadata hydration`, or destructive retention wording.
- Discovery, Evidence, Observation, and Assessment boundaries remain visible.
- Queue refs are consistently possible leads until ESI expansion.
- `Enrich selected` always says it calls ESI and creates stored expanded killmail evidence.
- `Refresh labels` is visibly readability-only.
- Marked and Watch remain asymmetric:

```txt
Watch implies Marked.
Marked does not imply Watch.
```

- Retention/deletion remains blocked unless a future accepted policy says otherwise.
