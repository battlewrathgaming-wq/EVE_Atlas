# Gap To-Do: Assessment Citation Validation

Status: Complete
Roadmap: `docs/roadmap/evidence-safe-assessment-and-discovery-ux.md`

Completed: 2026-05-22

## Task Requirement

Validate assessment artifact citations before writing assessment memory.

## Why It Matters

Assessment artifacts are not evidence, but they cite evidence context. If an artifact can cite killmail IDs or scopes that do not exist locally, Atlas can preserve confident-looking memory over an unverified basis.

## Actionables

- Validate `sampleKillmailIds` against `killmails`.
- Validate cited activity/event counts against the stated evidence scope where practical.
- Validate actor-scoped assessment artifacts against known local actor IDs when an entity scope is provided.
- Return a clear validation error or explicit citation status for missing evidence.
- Add fixture tests for valid citations and invalid/missing killmail IDs.

## Guardrails

- Do not mutate killmail evidence.
- Do not require every assessment artifact to cite killmails; analyst notes may be broader, but their citation status must be clear.
- Do not create evidence from assessment inputs.
- Do not block reports because an assessment citation is missing.

## Completion Signal

- `assessment.create` refuses or marks invalid cited killmail IDs.
- Existing score/reason requirements still pass.
- `npm.cmd run verify:assessment-artifacts` and `npm.cmd run verify:all` pass.

## Completion Notes

Assessment artifact creation now validates cited sample killmail IDs before writing assessment memory.

Rules implemented:

- if `sampleKillmailIds` are supplied, every cited killmail ID must exist in local `killmails`
- entity-focused assessment citations must match local `activity_events` for the cited killmail sample
- missing cited killmail IDs fail with `ASSESSMENT_CITATION_MISSING_KILLMAILS`
- actor/scope mismatch fails with `ASSESSMENT_CITATION_ACTOR_SCOPE_MISMATCH`
- analyst notes without cited killmail IDs remain allowed
- validation does not mutate evidence and does not create evidence

Verified:

- `npm.cmd run verify:assessment-artifacts`
- `npm.cmd run verify:migrations`
- `npm.cmd run verify:renderer-shell`

## Related Files

- `src/main/assessment/assessmentArtifactRepository.js`
- `src/main/services/mutatingActionService.js`
- `scripts/verify-assessment-artifacts.js`
- `docs/contracts/assessment-compaction-contract.md`
