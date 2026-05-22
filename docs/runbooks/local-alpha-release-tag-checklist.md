# Local Alpha Release Tag Checklist

Date: 2026-05-22

## Purpose

Use this checklist before tagging a local alpha checkpoint.

This is not public packaging. It is a repeatable local safety checkpoint for a commit that may be handed to another chat, reviewed by the overseer, or used for a local trial.

## Pre-Tag Checks

1. Confirm git status is clean:

```powershell
git status
```

2. Run offline verification:

```powershell
npm.cmd run verify:all
```

3. Run Electron smoke:

```powershell
npm.cmd run smoke:electron
```

4. Optional demo DB seed check:

```powershell
npm run seed:demo-db
```

5. Confirm current-state docs were reviewed:

```text
docs/current-state/current-ipc-ui-preparation.md
```

6. Confirm gap/to-do was reviewed:

```text
docs/gap/to-do
```

7. Confirm known limits are current:

```text
docs/runbooks/local-alpha-known-limits-and-feedback.md
```

## Boundary Checks

Before tagging, confirm:

- no `.tmp` DB/cache/smoke files are staged
- no SDE zip/extracted data is staged
- no `node_modules` content is staged
- no live API secret or token is staged
- no raw ESI payload export has been added as a support artifact
- no evidence pruning action has been enabled
- no passive broad collection has been added
- no automatic queue expansion has been added
- live API instructions remain explicitly gated

## Evidence Boundary Check

Confirm README/runbook wording still distinguishes:

- zKill discovery refs
- expanded ESI killmail evidence
- observation reports
- assessment artifacts
- support/debug artifacts

## Tag Naming

Suggested local alpha tag shape:

```text
atlas-local-alpha-YYYYMMDD-N
```

Example:

```powershell
git tag atlas-local-alpha-20260522-1
git push origin atlas-local-alpha-20260522-1
```

Only push a tag after the checkpoint commit has already been pushed intentionally.

## Rollback

Use GitHub or local git history to return to a known checkpoint:

```powershell
git checkout atlas-local-alpha-YYYYMMDD-N
```

Do not run destructive reset commands unless explicitly requested.

## Handoff Note

Record:

- commit hash
- tag name
- verification results
- Electron smoke result
- known limits doc path
- any live smoke artifact path
- whether live APIs were used during checkpoint validation
