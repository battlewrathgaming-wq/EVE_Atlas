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
  assert(mainText.includes('AURA_ATLAS_ELECTRON_VISUAL_SMOKE'), 'main should support explicit Electron visual smoke mode');
  assert(mainText.includes('capturePage()'), 'visual smoke should capture Electron window screenshots');
  assert(mainText.includes('fetchRuns === 0'), 'visual smoke should verify startup does not create fetch runs');

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
  assert(htmlText.includes('view-scopes'), 'renderer should include scope controls view');
  assert(htmlText.includes('scope-kind'), 'scope view should include scope kind selector');
  assert(htmlText.includes('scope-actor-id'), 'scope view should include actor ID control');
  assert(htmlText.includes('scope-system-id'), 'scope view should include system ID control');
  assert(htmlText.includes('scope-max-expansions'), 'scope view should expose expansion cap');
  assert(htmlText.includes('scope-normalized'), 'scope view should show normalized backend payload');
  assert(htmlText.includes('next-action'), 'readiness screen should include next local action');
  assert(htmlText.includes('api-state'), 'readiness screen should include API and identity state');
  assert(htmlText.includes('path-state'), 'readiness screen should include runtime path state');
  assert(htmlText.includes('topology-state'), 'readiness screen should include SDE topology state');
  assert(htmlText.includes('inventory-state'), 'readiness screen should include SDE inventory state');
  assert(htmlText.includes('view-tasks'), 'renderer should include tasks view');
  assert(htmlText.includes('task-detail'), 'task view should include task detail panel');
  assert(htmlText.includes('task-progress'), 'task view should include progress timeline');
  assert(htmlText.includes('cancel-task'), 'task view should include cancellation control');
  assert(htmlText.includes('view-queue-watch'), 'renderer should include queue/watch status view');
  assert(htmlText.includes('preview-queue-selection'), 'queue view should include selection preview action');
  assert(htmlText.includes('queue-selection-summary'), 'queue view should include selection summary');
  assert(htmlText.includes('queue-ref-list'), 'queue view should include queued ref list');
  assert(htmlText.includes('refresh-watch-status'), 'watch view should include refresh action');
  assert(htmlText.includes('watch-session-armed'), 'watch view should include session gate preview');
  assert(htmlText.includes('watch-live-api-enabled'), 'watch view should include live API gate preview');
  assert(htmlText.includes('watch-list'), 'watch view should include watch list');
  assert(htmlText.includes('view-reports'), 'renderer should include reports view');
  assert(htmlText.includes('load-actor-report'), 'report view should include actor report action');
  assert(htmlText.includes('actor-report-type'), 'report view should include actor type control');
  assert(htmlText.includes('actor-report-id'), 'report view should include actor ID control');
  assert(htmlText.includes('actor-evidence'), 'report view should include actor evidence section');
  assert(htmlText.includes('actor-provenance'), 'report view should include actor provenance section');
  assert(htmlText.includes('actor-observations'), 'report view should include actor observations section');
  assert(htmlText.includes('actor-raw-ids'), 'report view should include actor raw IDs section');

  assert(rendererText.includes("service.invoke('app.readiness'"), 'renderer should call app.readiness through service bridge');
  assert(rendererText.includes("service.invoke('app.prepare'"), 'renderer should call app.prepare through service bridge');
  assert(rendererText.includes("service.invoke('scope.defaults'"), 'renderer should load scope defaults through service bridge');
  assert(rendererText.includes("service.invoke('scope.validate'"), 'renderer should validate scope through service bridge');
  assert(rendererText.includes('scopeInputPayload'), 'renderer should build scope payload before backend validation');
  assert(rendererText.includes('renderNextAction'), 'renderer should render readiness next action from backend state');
  assert(rendererText.includes('RUNTIME_PATHS_MISSING'), 'renderer should expose app.prepare only for missing runtime paths');
  assert(rendererText.includes('topology_lookup_ready'), 'renderer should show topology readiness');
  assert(rendererText.includes('type_metadata_ready'), 'renderer should show inventory/type readiness');
  assert(rendererText.includes("service.invoke('task.list'"), 'renderer should call task.list through service bridge');
  assert(rendererText.includes("service.invoke('task.get'"), 'renderer should call task.get through service bridge');
  assert(rendererText.includes("service.invoke('task.cancel'"), 'renderer should call task.cancel through service bridge');
  assert(rendererText.includes('isCancellable'), 'renderer should gate cancellation by task state');
  assert(rendererText.includes('renderProgress'), 'renderer should render task progress events');
  assert(rendererText.includes('renderTaskOutput'), 'renderer should render task warnings/errors/results');
  assert(rendererText.includes("service.invoke('queue.selection'"), 'renderer should call queue.selection through service bridge');
  assert(rendererText.includes('renderQueueSelection'), 'renderer should render queue selection preview');
  assert(rendererText.includes("service.invoke('watch.schedule'"), 'renderer should call watch.schedule through service bridge');
  assert(rendererText.includes('renderWatchSchedule'), 'renderer should render watch schedule status');
  assert(rendererText.includes("service.invoke('report.actor'"), 'renderer should call report.actor through service bridge');
  assert(rendererText.includes('renderActorReport'), 'renderer should render native actor report response');
  assert(rendererText.includes('renderObservationSections'), 'renderer should render backend observation sections');
  assert(rendererText.includes('renderRawIds'), 'renderer should show raw IDs from backend response');
  assert(rendererText.includes("service.invoke('report.queue'"), 'renderer should call a report through service bridge');
  assert(rendererText.includes('service.list()'), 'renderer should read service command availability');
  assert(rendererText.includes('windowBridge.setAlwaysOnTop'), 'renderer should toggle always-on-top through preload bridge');
  assert(!rendererText.includes('const atlasWindow = window.atlasWindow'), 'renderer should avoid redeclaring exposed atlasWindow global');
  assert(!rendererText.includes("service.invoke('manual.expansion'"), 'renderer should not trigger manual expansion from passive views');
  assert(!rendererText.includes("service.invoke('actor.watch'"), 'renderer should not trigger actor collection from passive views');
  assert(!rendererText.includes("service.invoke('system.radius.watch'"), 'renderer should not trigger system/radius collection from passive views');
  assert(!/require\s*\(/.test(rendererText), 'renderer should not require backend modules');
  assert(!/electron|ipcRenderer|BrowserWindow/.test(rendererText), 'renderer should not import or reference Electron APIs directly');
  assert(!/from\s+['"].*\.\.\/main/.test(rendererText), 'renderer should not import main-process modules');
  assert(!/sqlite|EvidenceRepository|workers|db\/database/.test(rendererText), 'renderer should not reference SQLite, repositories, workers, or DB modules');

  assert(styleText.includes('.app-shell'), 'renderer styles should define app shell');
  assert(styleText.includes('-webkit-app-region: drag'), 'renderer styles should define draggable region');
  assert(styleText.includes('-webkit-app-region: no-drag'), 'renderer styles should protect controls from drag');
  assert(styleText.includes('.task-layout'), 'renderer styles should define task layout');
  assert(styleText.includes('.timeline-row'), 'renderer styles should define progress timeline rows');
  assert(styleText.includes('.queue-ref-list'), 'renderer styles should define queue ref list');
  assert(styleText.includes('.watch-list'), 'renderer styles should define watch list');
  assert(styleText.includes('.status-badge'), 'renderer styles should define queue/watch status badges');
  assert(styleText.includes('.observation-table'), 'renderer styles should define actor observation tables');
  assert(styleText.includes('.form-grid'), 'renderer styles should define actor report controls');
  assert(styleText.includes('.report-output'), 'renderer styles should define report output');

  const packageText = read(path.join(ROOT, 'package.json'));
  const smokeScriptText = read(path.join(ROOT, 'scripts', 'electron-visual-smoke.ps1'));
  assert(packageText.includes('"smoke:electron"'), 'package should expose Electron visual smoke script');
  assert(smokeScriptText.includes('F:') === false, 'visual smoke script should derive project paths instead of hardcoding a drive');
  assert(smokeScriptText.includes('AURA_ATLAS_DB_PATH'), 'visual smoke should set explicit DB path');
  assert(smokeScriptText.includes('.tmp'), 'visual smoke should keep artifacts under project .tmp');
  assert(smokeScriptText.includes('AURA_ATLAS_ELECTRON_VISUAL_SMOKE'), 'visual smoke should enable explicit smoke mode');

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
