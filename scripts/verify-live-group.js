const { spawnSync } = require('node:child_process');

const GROUPS = {
  'scoped-zkill': ['verify:live-scoped-zkill'],
  'actor-smoke': ['verify:actor-watch-live'],
  'radius-smoke': ['verify:system-watch-live'],
  smoke: ['verify:live-scoped-zkill', 'verify:actor-watch-live', 'verify:system-watch-live']
};

function main() {
  assertLiveEnabled();
  const groupName = process.argv[2];
  if (!groupName || !GROUPS[groupName]) {
    throw new Error(`Usage: node scripts/verify-live-group.js <${Object.keys(GROUPS).sort().join('|')}>`);
  }

  for (const script of GROUPS[groupName]) {
    console.log(`\n> npm run ${script}`);
    const result = runNpmScript(script);
    if (result.error) {
      throw new Error(`${script} could not start: ${result.error.message}`);
    }
    if (result.status !== 0) {
      throw new Error(`${script} failed with exit code ${result.status}`);
    }
  }

  console.log(`${groupName} live verification group passed`);
}

function assertLiveEnabled() {
  if (process.env.AURA_ATLAS_LIVE_API !== '1') {
    throw new Error('Refusing live verification group: set AURA_ATLAS_LIVE_API=1 to allow live zKill/ESI calls');
  }
}

function runNpmScript(script) {
  if (process.platform === 'win32') {
    return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npm.cmd run ${script}`], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  }
  return spawnSync('npm', ['run', script], {
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
