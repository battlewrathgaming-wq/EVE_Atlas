const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { auraTempRoot } = require('../src/main/util/tempPaths');

const dbPath = process.env.AURA_ATLAS_DEMO_DB_PATH ||
  path.join(auraTempRoot(), 'aura-atlas-demo-fixture.sqlite');

const result = spawnSync(process.execPath, [
  path.join(__dirname, 'verify-operator-workflow-scenario.js')
], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    AURA_ATLAS_OPERATOR_WORKFLOW_DB_PATH: dbPath
  }
});

if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  process.exitCode = result.status;
} else {
  console.log(JSON.stringify({
    status: 'demo fixture DB seeded',
    db_path: dbPath,
    classification: 'offline synthetic/fixture data for local alpha trial; not live evidence'
  }, null, 2));
}
