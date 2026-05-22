$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$tmpRoot = Join-Path $projectRoot ".tmp"
$cacheRoot = Join-Path $tmpRoot "cache"
$sdeRoot = Join-Path $tmpRoot "sde"
$smokeRoot = Join-Path $tmpRoot "electron-visual-smoke"
$dbPath = Join-Path $smokeRoot "aura-atlas-electron-smoke.sqlite"

New-Item -ItemType Directory -Force -Path $tmpRoot, $cacheRoot, $sdeRoot, $smokeRoot | Out-Null

if (Test-Path -LiteralPath $dbPath) {
  Remove-Item -LiteralPath $dbPath -Force
}

$env:AURA_ATLAS_TEST_TMP = $tmpRoot
$env:AURA_ATLAS_DB_PATH = $dbPath
$env:AURA_ATLAS_CACHE_DIR = $cacheRoot
$env:AURA_ATLAS_SDE_CACHE_DIR = $sdeRoot
$env:AURA_ATLAS_SETTINGS_PATH = Join-Path $smokeRoot "window-state.json"
$env:AURA_ATLAS_ELECTRON_VISUAL_SMOKE = "1"
$env:AURA_ATLAS_VISUAL_SMOKE_DIR = $smokeRoot
$env:npm_config_cache = Join-Path $cacheRoot "npm"

npm.cmd run start
