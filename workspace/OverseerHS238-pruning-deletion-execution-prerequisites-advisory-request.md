# Overseer HS238: Pruning / Deletion Execution Prerequisites Advisory Request

Date: 2026-06-03
Role: Atlas Overseer
Milestone: Atlas Storage And Runtime Hardening
Executor: Engineering / Security / Data advisory
Expected artifact: `workspace/EngineeringSecurityDataHS238-pruning-deletion-execution-prerequisites.md`

## Purpose

Define what must be true before Atlas can safely consider any destructive pruning/deletion execution packet.

This is advisory only. It does not authorize implementation, schema changes, deletion execution, support artifact cleanup, runtime enforcement, provider calls, or UI work.

## Context

HS236/HS237 accepted a richer read-only pruning intelligence preview. Atlas can now see affected Evidence/EVEidence, activity rows, ingestion audits, warnings, Discovery refs, Assessment Memory, Watch/Marked-adjacent context, provenance/log summaries, support-artifact disclosure, and no-footprint posture before deletion exists.

The next question is not "delete now." The question is: what exact prerequisites must be satisfied before any future deletion execution runway would be safe, bounded, and honest?

## Read

- `AGENTS.md`
- `workspace/current.md`
- `workspace/overview.md`
- `workspace/critical/README.md`
- `workspace/critical/critical-terms.md`
- `workspace/critical/critical-assets.md`
- `docs/current-state/current-storage-runtime-hardening.md`
- `docs/current-state/current-terminology-and-retention.md`
- `docs/current-state/current-evidence-pipeline.md`
- `docs/features/data-layer-boundaries.md`
- `workspace/SystemsAuditHS102-pruning-readiness.md`
- `workspace/DevHS236-pruning-intelligence-preview.md`
- `workspace/OverseerHS237-hs236-pruning-intelligence-preview-review.md`
- `src/main/services/retentionActionService.js`
- `src/main/db/schema.sql`
- relevant assessment, evidence, queue, provenance, and support-artifact code/docs as needed

## Questions To Answer

1. What minimum prerequisites must be true before destructive Evidence/EVEidence pruning execution can be considered?
2. Which dependency rows must be deleted, retained, warned, or left alone if a future Evidence prune executes?
3. What delete ordering and transaction model would be required to avoid orphan rows or partial deletion?
4. How should Atlas guarantee preview-to-execution consistency?
5. What should happen to Assessment Memory that references pruned Evidence/EVEidence: warn only, mark stale, leave untouched, or require separate policy?
6. Which Discovery refs, if any, should be touched by Evidence pruning execution?
7. Which provenance/log rows should remain, be pruned, be redacted, or be marked stale?
8. What support artifact disclosure or cleanup prerequisite is needed before active-record deletion, given snapshots/trace packs/logs may retain historical material?
9. Is a destructive deletion packet blocked until no-interest/Marked policy exists, or can Evidence-scoped deletion proceed independently?
10. What fixture-only proof should happen before any real active-record deletion execution?
11. What should remain parked?

## Constraints

- Do not implement code.
- Do not edit schema.
- Do not create or run deletion execution.
- Do not create support artifacts.
- Do not delete, prune, move, compact, or mutate records.
- Do not call providers.
- Do not change runtime enforcement or command blocking.
- Do not design renderer UI.
- Do not create a retained deletion footprint.
- Do not treat Discovery refs as Evidence.
- Do not treat Assessment Memory as a deletion blocker unless the advisory explicitly argues for a Human decision.
- Ground recommendations in current Atlas docs/schema/code.

## Expected Output

Return a concise but complete advisory artifact with:

1. Executive recommendation.
2. Minimum prerequisites for any future destructive deletion execution.
3. Required data classes and dependency handling.
4. Required delete ordering / transaction model.
5. Preview-to-execution consistency model.
6. Assessment Memory policy recommendation.
7. Discovery ref policy recommendation.
8. Provenance/log policy recommendation.
9. Support artifact/snapshot disclosure or cleanup prerequisite.
10. Fixture-only proof recommendation.
11. Risks and tradeoffs.
12. Smallest next Dev packet, if any.
13. Acceptance criteria for that packet.
14. Verification evidence expected.
15. Human/Overseer decisions needed.
16. Parked items.

## Hard Stop

If the advisory concludes that deletion execution remains too ambiguous, say so plainly and recommend the smallest non-destructive policy/design packet instead.
