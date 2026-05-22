# Gap To-Do: Native Structured Report Responses

Status: Open
Priority: P2

## Actionables

- Replace text-parsed report responses with native structured report data.
- Keep text report output as a rendering/export layer, not the source of structured UI data.
- Define stable section shapes for evidence basis, observations, provenance, warnings, labels, and raw IDs.
- Migrate report response verification away from fragile text parsing where practical.

## Task Requirements

Current service report responses call the CLI/text report builders, then parse headings and labels back out of text.

That is acceptable as a bridge, but the renderer should eventually consume structured rows and sections directly from backend report modules.

## Guardrails

- UI components must not re-derive evidence meaning.
- Text wording changes should not break structured response contracts.
- Reports must preserve evidence window, sample size, provenance, warnings, and ID-first labels.
- Evidence/observation/assessment terminology must remain explicit.

## Completion Signal

At least one major report type returns native structured sections without parsing its own text output. Existing CLI text output still works as a renderer/export of the same structured result.

## Related Files

- `src/main/services/reportResponseService.js`
- `src/main/reports/*`
- `docs/contracts/report-scope-contract.md`
- `docs/gap/complete/report-response-contract.md`
- `docs/gap/to-do/ui-language-contract.md`
