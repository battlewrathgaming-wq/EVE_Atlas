const { DatabaseSync } = require('node:sqlite');
const { app } = require('electron');

function main() {
  const versions = process.versions || {};
  assert(versions.electron, 'verify:electron-runtime must run inside Electron, not desktop Node');
  assert(versions.node, 'Electron runtime should expose bundled Node version');

  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE runtime_check (id INTEGER PRIMARY KEY, label TEXT NOT NULL);');
    db.prepare('INSERT INTO runtime_check (label) VALUES (?)').run('node:sqlite');
    const row = db.prepare('SELECT label FROM runtime_check WHERE id = ?').get(1);
    assert(row?.label === 'node:sqlite', 'Electron runtime node:sqlite check should round-trip data');
  } finally {
    db.close();
  }

  console.log(`electron runtime verified: electron ${versions.electron}; node ${versions.node}`);
  app.exit(0);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
