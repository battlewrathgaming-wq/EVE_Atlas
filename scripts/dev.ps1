$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$tmpRoot = Join-Path $projectRoot ".tmp"
$cacheRoot = Join-Path $tmpRoot "cache"
$sdeRoot = Join-Path $tmpRoot "sde"

New-Item -ItemType Directory -Force -Path $tmpRoot, $cacheRoot, $sdeRoot | Out-Null

$env:AURA_ATLAS_TEST_TMP = $tmpRoot
$env:AURA_ATLAS_DB_PATH = Join-Path $tmpRoot "aura-atlas-dev.sqlite"
$env:AURA_ATLAS_CACHE_DIR = $cacheRoot
$env:AURA_ATLAS_SDE_CACHE_DIR = $sdeRoot
$env:npm_config_cache = Join-Path $cacheRoot "npm"

npm.cmd run start
