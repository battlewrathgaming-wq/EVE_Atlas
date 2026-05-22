const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { initializeRuntimeDatabase, closeDatabase } = require('./db/database');
const { registerIpcServiceHandlers } = require('./services/serviceRegistry');
const { loadWindowState, saveWindowState } = require('./windowState');

let runtimeDb = null;
let mainWindow = null;
let windowState = null;

function createWindow() {
  windowState = windowState || loadWindowState(app);
  const window = new BrowserWindow({
    width: 1100,
    height: 720,
    title: 'AURA Atlas',
    frame: false,
    alwaysOnTop: windowState.alwaysOnTop,
    backgroundColor: '#0f1417',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow = window;
  window.loadFile('src/renderer/index.html');
  runVisualSmokeIfRequested(window);
}

app.whenReady().then(() => {
  runtimeDb = initializeRuntimeDatabase(app);
  registerIpcServiceHandlers(ipcMain, () => runtimeDb);
  registerWindowHandlers(ipcMain);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (runtimeDb?.db) {
      closeDatabase(runtimeDb.db);
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function registerWindowHandlers(ipc) {
  ipc.handle('atlas:window:get-state', () => ({
    alwaysOnTop: Boolean(mainWindow?.isAlwaysOnTop())
  }));

  ipc.handle('atlas:window:set-always-on-top', (_event, enabled) => {
    const next = enabled === true;
    mainWindow?.setAlwaysOnTop(next);
    windowState = saveWindowState(app, {
      ...windowState,
      alwaysOnTop: next
    });
    return {
      alwaysOnTop: next
    };
  });

  ipc.handle('atlas:window:minimize', () => {
    mainWindow?.minimize();
    return { minimized: true };
  });

  ipc.handle('atlas:window:close', () => {
    mainWindow?.close();
    return { closed: true };
  });
}

function runVisualSmokeIfRequested(window) {
  if (process.env.AURA_ATLAS_ELECTRON_VISUAL_SMOKE !== '1') {
    return;
  }

  window.webContents.once('did-finish-load', async () => {
    const outputDir = process.env.AURA_ATLAS_VISUAL_SMOKE_DIR || path.join(app.getPath('userData'), 'visual-smoke');
    try {
      fs.mkdirSync(outputDir, { recursive: true });
      const result = await runVisualSmoke(window, outputDir);
      fs.writeFileSync(
        path.join(outputDir, 'visual-smoke-result.json'),
        JSON.stringify(result, null, 2)
      );
      console.log(`AURA Atlas visual smoke passed: ${outputDir}`);
      app.exit(0);
    } catch (error) {
      let diagnostics = {};
      try {
        diagnostics = await smokeDiagnostics(window);
        const image = await window.webContents.capturePage();
        fs.writeFileSync(path.join(outputDir, 'failure.png'), image.toPNG());
      } catch (diagnosticError) {
        diagnostics = {
          diagnostic_error: diagnosticError.message
        };
      }
      const failure = {
        status: 'failed',
        message: error.message,
        stack: error.stack,
        diagnostics
      };
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(
        path.join(outputDir, 'visual-smoke-result.json'),
        JSON.stringify(failure, null, 2)
      );
      console.error(error);
      app.exit(1);
    }
  });
}

async function runVisualSmoke(window, outputDir) {
  const views = [
    ['readiness', 'readiness.png'],
    ['scopes', 'scopes.png'],
    ['tasks', 'tasks.png'],
    ['queue-watch', 'queue-watch.png'],
    ['reports', 'reports.png']
  ];
  await waitForSmokeReady(window);
  const checks = await smokeChecks(window);
  assertSmoke(checks.hasServiceBridge, 'renderer should expose atlasServices');
  assertSmoke(checks.hasWindowBridge, 'renderer should expose atlasWindow');
  assertSmoke(checks.noNodeRequire, 'renderer should not expose Node require');
  assertSmoke(checks.noElectronGlobal, 'renderer should not expose Electron globals');
  assertSmoke(checks.hasViews, 'renderer should contain all initial shell views');
  assertSmoke(checks.fetchRuns === 0, 'visual smoke startup should not create fetch runs');
  assertSmoke(checks.killmails === 0, 'visual smoke startup should not create killmail evidence');
  assertSmoke(checks.activityEvents === 0, 'visual smoke startup should not create activity events');

  for (const [viewName, fileName] of views) {
    await selectSmokeView(window, viewName);
    const image = await window.webContents.capturePage();
    fs.writeFileSync(path.join(outputDir, fileName), image.toPNG());
  }

  return {
    status: 'passed',
    checked_at: new Date().toISOString(),
    output_dir: outputDir,
    views: views.map(([viewName, fileName]) => ({ view: viewName, screenshot: fileName })),
    checks
  };
}

function smokeChecks(window) {
  return window.webContents.executeJavaScript(`
    (async () => {
      const readiness = await window.atlasServices.invoke('app.readiness');
      return {
        hasServiceBridge: Boolean(window.atlasServices && window.atlasServices.invoke && window.atlasServices.list),
        hasWindowBridge: Boolean(window.atlasWindow && window.atlasWindow.getState),
        noNodeRequire: typeof window.require === 'undefined',
        noElectronGlobal: typeof window.ipcRenderer === 'undefined',
        hasViews: ['readiness', 'scopes', 'tasks', 'queue-watch', 'reports']
          .every((name) => Boolean(document.querySelector('#view-' + name))),
        status: readiness.status,
        fetchRuns: readiness.lookup_counts.fetch_runs,
        killmails: readiness.lookup_counts.killmails || 0,
        activityEvents: readiness.lookup_counts.activity_events || 0
      };
    })();
  `);
}

function smokeDiagnostics(window) {
  return window.webContents.executeJavaScript(`
    ({
      readyState: document.readyState,
      serviceState: document.querySelector('#service-state')?.textContent || null,
      viewTitle: document.querySelector('#view-title')?.textContent || null,
      hasServiceBridge: Boolean(window.atlasServices),
      hasServiceInvoke: Boolean(window.atlasServices?.invoke),
      hasWindowBridge: Boolean(window.atlasWindow),
      hasScriptTag: Boolean(document.querySelector('script[src="./app.js"]')),
      navCount: document.querySelectorAll('.nav-item').length,
      bodyTextSample: document.body.innerText.slice(0, 500)
    });
  `);
}

async function selectSmokeView(window, viewName) {
  await window.webContents.executeJavaScript(`
    document.querySelector('[data-view="${viewName}"]').click();
  `);
  await window.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        const view = document.querySelector('#view-${viewName}');
        const title = document.querySelector('#view-title');
        if (view?.classList.contains('active') && title?.textContent?.trim()) {
          resolve(true);
          return;
        }
        if (Date.now() - started > 5000) {
          reject(new Error('Timed out selecting smoke view: ${viewName}'));
          return;
        }
        setTimeout(check, 50);
      };
      check();
    });
  `);
  await new Promise((resolve) => setTimeout(resolve, 100));
}

function waitForSmokeReady(window) {
  return window.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        const serviceState = document.querySelector('#service-state')?.textContent || '';
        const navItems = document.querySelectorAll('.nav-item');
        const hasReadyText = serviceState && serviceState !== 'Connecting';
        if (hasReadyText && navItems.length >= 5) {
          resolve(true);
          return;
        }
        if (Date.now() - started > 10000) {
          reject(new Error('Timed out waiting for renderer initialization'));
          return;
        }
        setTimeout(check, 100);
      };
      check();
    });
  `);
}

function assertSmoke(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
