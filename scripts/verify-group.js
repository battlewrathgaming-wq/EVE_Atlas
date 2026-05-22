const { spawnSync } = require('node:child_process');

const GROUPS = {
  core: [
    'verify:migrations',
    'verify:fixture',
    'verify:idempotent',
    'verify:db-integrity'
  ],
  sde: [
    'verify:sde-fixture',
    'verify:radius',
    'verify:planner',
    'verify:metadata-lookup'
  ],
  'sde-heavy': [
    'verify:sde-inventory'
  ],
  collection: [
    'verify:collector',
    'verify:queue-preflight',
    'verify:queue-report'
  ],
  reports: [
    'verify:report-scope',
    'verify:operators',
    'verify:radius-report',
    'verify:metadata-status'
  ],
  manual: [
    'verify:manual-discovery'
  ],
  actor: [
    'verify:actor-resolution',
    'verify:actor-watch',
    'verify:actor-report',
    'verify:actor-metadata'
  ],
  corporation: [
    'verify:corporation-report',
    'verify:corporation-metadata'
  ],
  bulk: [
    'verify:bulk-synthetic',
    'verify:actor-bulk'
  ]
};

GROUPS.all = [
  ...GROUPS.core,
  ...GROUPS.sde,
  ...GROUPS.collection,
  ...GROUPS.reports,
  ...GROUPS.manual,
  ...GROUPS.actor,
  ...GROUPS.corporation,
  ...GROUPS.bulk
];

function main() {
  const groupName = process.argv[2];
  if (!groupName || !GROUPS[groupName]) {
    throw new Error(`Usage: node scripts/verify-group.js <${Object.keys(GROUPS).sort().join('|')}>`);
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const scripts = [...new Set(GROUPS[groupName])];
  console.log(`Running ${groupName} verification group (${scripts.length} scripts)`);

  for (const script of scripts) {
    console.log(`\n> npm run ${script}`);
    const result = runNpmScript(npmCommand, script);
    if (result.error) {
      throw new Error(`${script} could not start: ${result.error.message}`);
    }
    if (result.status !== 0) {
      throw new Error(`${script} failed with exit code ${result.status}`);
    }
  }

  console.log(`\n${groupName} verification group passed`);
}

function runNpmScript(npmCommand, script) {
  if (process.platform === 'win32') {
    return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `${npmCommand} run ${script}`], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  }

  return spawnSync(npmCommand, ['run', script], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
