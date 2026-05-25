# OverseerHS65 - Deletion Scope And Backup Matrix

Date: 2026-05-25
Role: Atlas Overseer
Status: policy design / no implementation authorization

## Request Answered

The Human asked to continue from HS64 production deletion policy design.

This record defines candidate deletion scopes, backup/restore choices, footprint survival choices, and future Dev gates. It does not implement deletion, add schema, create storage, or accept placeholder terms as implementation fields.

## Files Reviewed

- `workspace/current.md`
- `workspace/OverseerHS64-production-deletion-policy-design.md`
- `workspace/OverseerHS63-deletion-policy-design-input.md`
- `workspace/DevHS58-retention-deletion-execution-boundary.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/current-state/current-terminology-and-retention.md`
- `src/main/db/schema.sql`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`

## Accepted Baseline

Production deletion execution does not exist.

Retention/deletion behavior is currently preflight-only.

The Evidence-confirmed anchor is an ESI-expanded `killmail_id` that Atlas has written as Evidence.

Footprint, if accepted later, must not preserve raw Evidence, full activity events, participant arrays, raw ESI payloads, or hidden deleted-record copies.

## Candidate Deletion Scopes

| Scope | Candidate Meaning | Records Affected In Principle | Main Risk | Current Recommendation |
| --- | --- | --- | --- | --- |
| Evidence-only killmail prune | Delete selected stored killmail Evidence by Evidence-confirmed `killmail_id`. | `killmails`; likely `activity_events`; likely `ingestion_audits`; related `data_quality_warnings`. | Orphaning report/provenance rows or keeping hidden Evidence through dependent records. | Preferred first production-deletion scope, but only after backup/restore and footprint storage decisions. |
| Evidence plus Discovery refs | Delete selected Evidence and related Discovery refs for the same anchor. | Above plus matching `discovered_killmail_refs`. | Removes useful queue/provenance trail; may hide why record entered Atlas. | Defer until queue stale/expiration policy is decided. |
| Evidence plus provider logs | Delete selected Evidence and related API/request logs. | Above plus scoped `api_request_logs` and possibly `fetch_runs`. | Reduces auditability; provider logs are provenance but can reveal deleted record context. | Needs Human decision. Do not default to deleting all provider logs. |
| Evidence plus Assessment Memory citations | Delete selected Evidence and remove or rewrite Assessment Memory citations. | Above plus `assessment_artifacts.sample_killmail_ids_json` and citation metadata. | Can damage human-authored memory or create misleading citations. | Do not silently mutate Assessment Memory. Require explicit operator choice. |
| Full entity interest purge | Delete all Evidence, Discovery, Watch/Marked, metadata, and assessment context for an entity. | Broad cross-table scope. | Too broad; risks deleting unrelated Evidence and product meaning. | Not suitable as first production-deletion scope. |

## Records To Protect From Hidden Retention

If a selected Evidence record is deleted, these must not preserve a reconstructable copy:

- `killmails.raw_esi_payload`
- full `activity_events`
- participant arrays or equivalent full attacker/victim detail
- report artifacts that copy the deleted Evidence
- trace packs containing raw deleted Evidence
- snapshots that are presented as active-state truth after deletion
- Assessment Memory rows that silently preserve raw Evidence details

## Records That May Need Separate Policy

These may be retained, pruned, redacted, or summarized depending on future Human decision:

- `discovered_killmail_refs`
- `fetch_runs`
- `api_request_logs`
- `ingestion_audits`
- `data_quality_warnings`
- `assessment_artifacts`
- runtime snapshots already created before deletion
- operator debug trace packs already created before deletion

## Backup / Restore Options

| Option | Meaning | Pros | Risks | Recommendation |
| --- | --- | --- | --- | --- |
| No automatic backup | Deletion executes without creating a backup. | Simple; respects deletion intent. | Mistakes are hard to recover; high trust burden. | Not recommended for first production deletion. |
| Required pre-delete snapshot | Atlas requires a local runtime DB snapshot before deletion. | Safer recovery path. | Snapshot contains the records being deleted; must be explained as historical support artifact. | Strong candidate default, but requires user-facing warning. |
| Optional pre-delete snapshot | Atlas offers but does not require a snapshot. | Operator choice; less friction. | Operators may skip recovery protection accidentally. | Candidate if deletion is clearly reversible only through chosen backup. |
| Export minimal footprint only | Atlas writes only the accepted footprint and no backup. | Strong deletion semantics; minimal retention. | No recovery if deletion was accidental. | Good long-term privacy posture, but risky first release. |
| No deletion until backup policy | Atlas blocks production deletion until backup/restore policy is accepted. | Safest governance. | Delays feature. | Current accepted posture. |

## Footprint Survival Options

| Option | Meaning | Risk | Recommendation |
| --- | --- | --- | --- |
| No footprint | Delete selected Evidence and leave no historical-interest trace. | Loses "was of interest" clue. | Allowed in principle if Human wants strict deletion. |
| Minimal anchor/value pair | Retain `[Evidence-confirmed killmail_id][Human-authored EVE_value]`. | Requires storage class and terminology acceptance. | Preferred design candidate. |
| Anchor/value plus timestamp | Retain anchor, value, and deletion/review timestamp. | Slightly more metadata; still compact. | Candidate if auditability is desired. |
| Assessment Memory survives | Existing Assessment Memory can survive with compact human-authored context. | Can become hidden retention if too detailed. | Must be explicit and validated against no raw Evidence retention. |
| Rich summary survives | Retain systems, ships, source runs, sample IDs, or appearance summaries. | May reconstruct too much deleted Evidence. | Not recommended as default deletion footprint. |

## Recommended Default Policy Shape

For the first production-deletion design, prefer:

1. Scope: selected Evidence-confirmed `killmail_id` only.
2. Delete: `killmails`, full related `activity_events`, and related ingestion/warning rows where accepted.
3. Preserve only if accepted: minimal footprint pair `[Evidence-confirmed killmail_id][Human-authored EVE_value]`.
4. Require explicit operator confirmation.
5. Require either an accepted backup policy or an explicit no-backup warning before Dev implementation.
6. Do not silently mutate or preserve Assessment Memory as a substitute for deletion.
7. Do not delete unrelated entity/watch/marked state in the first deletion scope.

## Unresolved Human Decisions

- Should first production deletion require a pre-delete runtime DB snapshot?
- If a snapshot exists, should Atlas warn that deletion from the active DB does not rewrite historical snapshots?
- Should footprint be optional per deletion action or configured globally?
- Is `EVE_value` accepted as the human-authored value label, or should it remain a placeholder?
- Should `EVE_Pilot_value`, `Spare_1A`, and `Spare_1B` remain parked or be removed before implementation?
- Should `api_request_logs` and `fetch_runs` survive as provenance, be redacted, or be deleted for selected Evidence?
- Should Assessment Memory citation references be retained, redacted, invalidated, or user-reviewed?

## Future Dev Gates

Before a Dev implementation packet may open, it must name:

- exact deletion scope
- exact affected tables
- transaction boundary and rollback behavior
- backup/snapshot requirement
- footprint storage class, if any
- accepted user-facing confirmation wording
- Assessment Memory behavior
- API/fetch/provenance behavior
- fixture cases for no-footprint, footprint, backup, and partial failure
- verification commands
- whether `verify:all` is required

## Non-Goals

- No code implementation.
- No schema design.
- No migration design.
- No renderer/UI design.
- No deletion command.
- No footprint table/file format.
- No protected-word JSON updates.
- No acceptance of placeholder terms as implementation names.

## Verification

Documentation-only verification:

```powershell
npm.cmd run verify:protected-terms
git status --short --branch
```

Result:

- `npm.cmd run verify:protected-terms` completed with exit code 0.
- Protected-term discovery ran in working-set mode against 3 files.
- Warning count: 79.
- Warning classes: cross-project borrowing 10, Lab quarantine borrowing 48, Atlas candidate 21.
- The scan confirmed warning-only behavior; no renames and no protected-word JSON updates were performed.
- No code, schema, deletion execution, footprint storage, live API, or real DB mutation occurred.

## Conclusion

Atlas can continue toward production deletion, but the next executable step is still gated.

The first safe implementation candidate is not broad deletion. It is a tightly scoped selected-Evidence deletion design with explicit backup/restore behavior and a minimal optional footprint policy.
