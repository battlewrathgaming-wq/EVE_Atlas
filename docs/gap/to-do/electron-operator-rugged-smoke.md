# Electron Operator Rugged Smoke

## Mission

Move beyond shell startup smoke and exercise a realistic local operator path in Electron with a seeded/demo database.

The smoke should try to break presentation and workflow assumptions without making live calls by default.

## Task Requirements

- Seed or select a deterministic demo DB.
- Launch Electron through the normal project script.
- Exercise the renderer through the service bridge:
  - readiness refresh
  - corpus health
  - queue/watch preview
  - actor report load
  - radius report load
  - assessment artifact list/detail
  - debug trace pack preflight/create if appropriate
  - runtime snapshot preflight without create unless explicitly confirmed
- Include UI edge cases:
  - empty DB
  - seeded DB
  - unresolved IDs
  - long names/labels
  - warnings
  - partial sample reports
  - narrow viewport or compact window
- Capture screenshots and result JSON under `.tmp`.
- Confirm startup and passive navigation do not create evidence, fetch runs, or API logs.

## Suggested Verification

Add a script such as:

```txt
npm.cmd run smoke:electron-operator
```

## Acceptance Criteria

- The seeded operator path is reviewable from artifacts.
- UI text does not overlap or hide critical warnings in the tested surfaces.
- Renderer still uses service/preload boundaries only.
- Passive UI navigation remains non-collecting.

