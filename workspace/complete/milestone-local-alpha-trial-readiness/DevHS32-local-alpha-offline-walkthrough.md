# DevHS32 - Local Alpha Offline Walkthrough

Date: 2026-05-24
Role: Dev
Milestone: Local Alpha Trial Readiness
Packet: HS32

## Scope

Executed the offline local-alpha walkthrough rehearsal from `workspace/current.md`. This stayed fixture-first and did not run live API smoke, real SDE network download, destructive retention/pruning, renderer feature work, public packaging, or terminology/region/relationship/fight-timeline scope.

## Rehearsal

The documented `npm run seed:demo-db` command failed in this PowerShell environment because `npm.ps1` is blocked by execution policy. The rehearsal continued with `npm.cmd run ...`, which matches the existing verification commands and works on this machine.

Commands exercised against the demo fixture DB:

```powershell
npm.cmd run seed:demo-db
$env:AURA_ATLAS_DB_PATH='F:\Projects\AURA-Atlas\.tmp\aura-atlas-demo-fixture.sqlite'; npm.cmd run report:corpus-health
$env:AURA_ATLAS_DB_PATH='F:\Projects\AURA-Atlas\.tmp\aura-atlas-demo-fixture.sqlite'; npm.cmd run report:actor -- --type character --id 90000002
$env:AURA_ATLAS_DB_PATH='F:\Projects\AURA-Atlas\.tmp\aura-atlas-demo-fixture.sqlite'; npm.cmd run report:radius -- --center "Atlas Prime" --radius 0
$env:AURA_ATLAS_DB_PATH='F:\Projects\AURA-Atlas\.tmp\aura-atlas-demo-fixture.sqlite'; npm.cmd run snapshot:runtime-db -- --preflight --destination "F:\Projects\AURA-Atlas\.tmp\local-alpha-walkthrough\aura-atlas-demo-fixture.snapshot.sqlite"
$env:AURA_ATLAS_DB_PATH='F:\Projects\AURA-Atlas\.tmp\aura-atlas-demo-fixture.sqlite'; npm.cmd run snapshot:runtime-db -- --destination "F:\Projects\AURA-Atlas\.tmp\local-alpha-walkthrough\aura-atlas-demo-fixture.snapshot.sqlite" --overwrite
$env:AURA_ATLAS_DB_PATH='F:\Projects\AURA-Atlas\.tmp\aura-atlas-demo-fixture.sqlite'; npm.cmd run report:debug-trace
```

## Artifacts

- Demo DB: `F:\Projects\AURA-Atlas\.tmp\aura-atlas-demo-fixture.sqlite`
- Runtime snapshot: `F:\Projects\AURA-Atlas\.tmp\local-alpha-walkthrough\aura-atlas-demo-fixture.snapshot.sqlite`
- Debug trace pack: `F:\Projects\AURA-Atlas\.tmp\operator-debug-trace-packs\operator-debug-trace-pack-2026-05-24T06-09-40-452Z.json`
- Electron smoke artifacts: `F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke`
- Electron smoke DB: `F:\Projects\AURA-Atlas\.tmp\electron-visual-smoke\aura-atlas-electron-smoke.sqlite`

## Evidence

The fixture DB reported:

- 1 expanded killmail
- 7 activity events
- 2 discovery refs
- 1 deliberate assessment artifact
- 0 API request logs

The actor report loaded for `Atlas Scout [characterID: 90000002]`.

The radius report loaded for `Atlas Prime [solarSystemID: 30000001]` with radius `0`.

Snapshot preflight was read-only, then snapshot creation wrote a local SQLite copy only.

The debug trace pack stated no zKill/ESI calls, no evidence/observation/assessment creation, and raw expanded ESI payload exclusion.

## Docs Updated

- `README.md`
- `docs/runbooks/local-alpha-trial.md`
- `docs/runbooks/local-alpha-release-tag-checklist.md`

All updates were limited to replacing brittle `npm run ...` PowerShell examples with `npm.cmd run ...`.

## Verification

```powershell
npm.cmd run verify:all
npm.cmd run smoke:electron
git status --short --branch
```

Result:

```txt
PASS - npm.cmd run verify:all
PASS - npm.cmd run smoke:electron
PASS - git status --short --branch executed
```

## Tree Note

Final status also showed an `AGENTS.md` advisory/protocol edit that was not made by this Dev packet. It was preserved untouched.

## Remaining Risk

This rehearsal proves the offline CLI/report/smoke-supported path and catches one command friction point. A human UI walkthrough is still needed to catch operator sequencing, visual affordance, and expectation friction that automated smoke cannot fully evaluate.

## Recommended Next Action

Overseer should review HS32, decide whether the PowerShell command wording correction is accepted, and then choose either a manual UI alpha rehearsal packet or a local-alpha checkpoint/tag readiness packet.
