# Statement: Attention-Driven Intelligence

Status: Active
Date: 2026-05-21

## Perspective

AURA Atlas should prefer attention-driven intelligence over scrape-driven intelligence.

The system should collect evidence because a watched system, watched actor, explicit user action, or scoped investigation made that evidence relevant.

## Guidance

Broad discovery does not imply broad expansion, ingestion, or retention.

The preferred collection model is:

```txt
user/system interest
-> scoped discovery
-> bounded ESI expansion
-> stored evidence
-> rebuildable reports
```

Repeated small observations over time are more valuable than aggressive broad collection bursts.

## Preview Labels

Manual discovery previews may show lightweight zKill discovery metadata to help direct attention.

When a preview field has an ID but no local cached label, Atlas should not perform live metadata hydration just to make the preview prettier. Use:

```txt
[Resolve with ESI]
```

This phrase means the authoritative detail is available through the existing ESI killmail expansion pipeline. It is not a separate metadata lookup instruction and not a claim that the preview itself is evidence.

## Non-Goals

This statement does not mean Atlas should discard intentionally ingested evidence casually.

Once scoped evidence is expanded and stored, retention should be deliberate, auditable, and governed by policy.

## Related Tenets

- Evidence First
- Collection Is Incomplete By Default
- Respectful API Use
