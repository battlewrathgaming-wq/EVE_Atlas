const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function main() {
  const mainPath = path.join(ROOT, 'src', 'main', 'main.js');
  const preloadPath = path.join(ROOT, 'src', 'main', 'preload.js');
  const windowStatePath = path.join(ROOT, 'src', 'main', 'windowState.js');
  const htmlPath = path.join(ROOT, 'src', 'renderer', 'index.html');
  const rendererPath = path.join(ROOT, 'src', 'renderer', 'app.js');
  const stylePath = path.join(ROOT, 'src', 'renderer', 'styles.css');

  const mainText = read(mainPath);
  const preloadText = read(preloadPath);
  const windowStateText = read(windowStatePath);
  const htmlText = read(htmlPath);
  const rendererText = read(rendererPath);
  const styleText = read(stylePath);

  assert(mainText.includes('preload.js'), 'BrowserWindow should use preload.js');
  assert(mainText.includes('contextIsolation: true'), 'BrowserWindow should enable context isolation');
  assert(mainText.includes('nodeIntegration: false'), 'BrowserWindow should disable node integration');
  assert(mainText.includes('frame: false'), 'BrowserWindow should be frameless for widget shell');
  assert(mainText.includes('alwaysOnTop: windowState.alwaysOnTop'), 'BrowserWindow should restore always-on-top state');
  assert(mainText.includes("ipc.handle('atlas:window:get-state'"), 'main should expose window state IPC');
  assert(mainText.includes("ipc.handle('atlas:window:set-always-on-top'"), 'main should expose always-on-top IPC');

  assert(preloadText.includes('contextBridge.exposeInMainWorld'), 'preload should expose a controlled bridge');
  assert(preloadText.includes('atlasServices'), 'preload should expose atlasServices');
  assert(preloadText.includes('atlasWindow'), 'preload should expose atlasWindow controls');
  assert(preloadText.includes("ipcRenderer.invoke('atlas:service:list'"), 'preload should expose service list IPC');
  assert(preloadText.includes("ipcRenderer.invoke('atlas:service:invoke'"), 'preload should expose service invoke IPC');
  assert(preloadText.includes("ipcRenderer.invoke('atlas:window:set-always-on-top'"), 'preload should expose always-on-top IPC');

  assert(windowStateText.includes('AURA_ATLAS_SETTINGS_PATH'), 'window state should support explicit settings path');
  assert(windowStateText.includes('AURA_ATLAS_DB_PATH'), 'window state should colocate with dev DB when DB override is set');

  assert(htmlText.includes('./app.js'), 'renderer HTML should load app.js');
  assert(htmlText.includes('window-chrome'), 'renderer should include frameless window chrome');
  assert(htmlText.includes('pin-window'), 'renderer should include always-on-top control');
  assert(htmlText.includes('view-readiness'), 'renderer should include readiness view');
  assert(htmlText.includes('view-tasks'), 'renderer should include tasks view');
  assert(htmlText.includes('view-reports'), 'renderer should include reports view');

  assert(rendererText.includes("service.invoke('app.readiness'"), 'renderer should call app.readiness through service bridge');
  assert(rendererText.includes("service.invoke('app.prepare'"), 'renderer should call app.prepare through service bridge');
  assert(rendererText.includes("service.invoke('task.list'"), 'renderer should call task.list through service bridge');
  assert(rendererText.includes("service.invoke('report.queue'"), 'renderer should call a report through service bridge');
  assert(rendererText.includes('service.list()'), 'renderer should read service command availability');
  assert(rendererText.includes('atlasWindow.setAlwaysOnTop'), 'renderer should toggle always-on-top through preload bridge');
  assert(!/require\s*\(/.test(rendererText), 'renderer should not require backend modules');
  assert(!/electron|ipcRenderer|BrowserWindow/.test(rendererText), 'renderer should not import or reference Electron APIs directly');
  assert(!/from\s+['"].*\.\.\/main/.test(rendererText), 'renderer should not import main-process modules');
  assert(!/sqlite|EvidenceRepository|workers|db\/database/.test(rendererText), 'renderer should not reference SQLite, repositories, workers, or DB modules');

  assert(styleText.includes('.app-shell'), 'renderer styles should define app shell');
  assert(styleText.includes('-webkit-app-region: drag'), 'renderer styles should define draggable region');
  assert(styleText.includes('-webkit-app-region: no-drag'), 'renderer styles should protect controls from drag');
  assert(styleText.includes('.report-output'), 'renderer styles should define report output');

  console.log('renderer shell service boundary verified');
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
