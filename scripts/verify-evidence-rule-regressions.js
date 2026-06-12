const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const REQUIRED_GUARDS = [
  {
    script: 'verify:idempotent',
    file: 'scripts/verify-idempotent-ingestion.js',
    phrase: 'rediscovery must not replace raw ESI payload',
    boundary: 'duplicate killmail persistence must not overwrite raw ESI payload'
  },
  {
    script: 'verify:manual-discovery',
    file: 'scripts/verify-manual-discovery.js',
    phrase: 'manual discovery must not write killmails',
    boundary: 'manual discovery queues possible evidence without creating evidence'
  },
  {
    script: 'verify:queue-report',
    file: 'scripts/verify-queue-report.js',
    phrase: 'Evidence Boundary',
    boundary: 'queue reports must label discovery refs as non-evidence'
  },
  {
    script: 'verify:assessment-artifacts',
    file: 'scripts/verify-assessment-artifacts.js',
    phrase: 'assessment artifact with missing cited killmail should be rejected',
    boundary: 'assessment artifacts must validate cited evidence'
  },
  {
    script: 'verify:hydration',
    file: 'scripts/verify-hydration.js',
    phrase: 'metadata hydration must not change evidence IDs or raw ESI payloads',
    boundary: 'metadata hydration must not mutate evidence IDs or raw payloads'
  },
  {
    script: 'verify:adversarial-fixtures',
    file: 'scripts/verify-adversarial-evidence-fixtures.js',
    phrase: 'rediscovery must not replace raw ESI payload',
    boundary: 'adversarial fixtures must preserve evidence doctrine under malformed, incomplete, duplicated, and unresolved inputs'
  },
  {
    script: 'verify:retention-preflight',
    file: 'scripts/verify-retention-preflight.js',
    phrase: 'compaction preflight must not delete killmails',
    boundary: 'retention and compaction preflight must remain non-destructive'
  }
];

const REQUIRED_LOCAL_GUARD_PHRASES = [
  {
    file: 'scripts/verify-evidence-writer-landing-package-fixture.js',
    phrase: 'conflict behavior should report hardened dependent-row suppression',
    boundary: 'duplicate conflicting killmail packages must suppress conflict-derived dependent rows'
  },
  {
    file: 'scripts/verify-evidence-writer-landing-package-fixture.js',
    phrase: 'mixed package should land clean rows and suppress conflict-derived rows',
    boundary: 'mixed clean/conflict killmail packages must land clean rows while suppressing conflict-derived rows'
  }
];

function main() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const verifyGroup = fs.readFileSync(path.join(ROOT, 'scripts', 'verify-group.js'), 'utf8');

  for (const guard of REQUIRED_GUARDS) {
    assert(packageJson.scripts[guard.script], `Evidence boundary missing npm script: ${guard.boundary}`);
    assert(verifyGroup.includes(`'${guard.script}'`), `Evidence boundary not included in verify:all group: ${guard.boundary}`);

    const guardFile = fs.readFileSync(path.join(ROOT, guard.file), 'utf8');
    assert(guardFile.includes(guard.phrase), `Evidence boundary guard assertion missing: ${guard.boundary}`);
  }

  for (const guard of REQUIRED_LOCAL_GUARD_PHRASES) {
    const guardFile = fs.readFileSync(path.join(ROOT, guard.file), 'utf8');
    assert(guardFile.includes(guard.phrase), `Evidence boundary guard assertion missing: ${guard.boundary}`);
  }

  assert(packageJson.scripts['verify:evidence-rules'], 'Evidence boundary manifest script must be registered');
  console.log('evidence rule regression guard verified');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
