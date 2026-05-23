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
  const ruggedSmoke = process.env.AURA_ATLAS_ELECTRON_RUGGED_SMOKE === '1';
  const views = [
    ['investigation', 'investigation.png'],
    ['readiness', 'readiness.png'],
    ['scopes', 'scopes.png'],
    ['tasks', 'tasks.png'],
    ['queue-watch', 'queue-watch.png'],
    ['actions', 'actions.png'],
    ['reports', 'reports.png']
  ];
  await waitForSmokeReady(window);
  const checks = await smokeChecks(window);
  assertSmoke(checks.hasServiceBridge, 'renderer should expose atlasServices');
  assertSmoke(checks.hasWindowBridge, 'renderer should expose atlasWindow');
  assertSmoke(checks.noNodeRequire, 'renderer should not expose Node require');
  assertSmoke(checks.noElectronGlobal, 'renderer should not expose Electron globals');
  assertSmoke(checks.hasViews, 'renderer should contain all initial shell views');
  assertSmoke(checks.opensInvestigation, 'renderer should open on the investigation desk');
  assertSmoke(checks.investigationPassiveText, 'investigation desk should state passive startup boundaries');
  if (ruggedSmoke) {
    assertSmoke(checks.fetchRuns >= 1, 'rugged smoke should start with synthetic demo fetch run data');
    assertSmoke(checks.killmails >= 1, 'rugged smoke should start with synthetic demo killmail evidence');
    assertSmoke(checks.activityEvents >= 1, 'rugged smoke should start with synthetic demo activity observations');
  } else {
    assertSmoke(checks.fetchRuns === 0, 'visual smoke startup should not create fetch runs');
    assertSmoke(checks.killmails === 0, 'visual smoke startup should not create killmail evidence');
    assertSmoke(checks.activityEvents === 0, 'visual smoke startup should not create activity events');
  }

  const ruggedChecks = ruggedSmoke ? await runRuggedOperatorSmoke(window, outputDir) : null;

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
    checks,
    rugged_checks: ruggedChecks
  };
}

async function runRuggedOperatorSmoke(window, outputDir) {
  await window.setSize(760, 620);
  const checks = await window.webContents.executeJavaScript(`
    (async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const text = (selector) => document.querySelector(selector)?.textContent || '';
      const lowerText = (selector) => text(selector).toLowerCase();
      const setValue = (selector, value) => {
        const input = document.querySelector(selector);
        if (!input) {
          throw new Error('Missing rugged smoke input: ' + selector);
        }
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const click = async (selector) => {
        const button = document.querySelector(selector);
        if (!button) {
          throw new Error('Missing rugged smoke button: ' + selector);
        }
        button.click();
        await sleep(250);
      };
      const waitFor = async (label, predicate) => {
        const started = Date.now();
        while (Date.now() - started < 6000) {
          if (predicate()) {
            return true;
          }
          await sleep(100);
        }
        throw new Error('Timed out during rugged smoke: ' + label);
      };

      const longLabel = 'Atlas Scout With An Intentionally Long Operator Label For Rugged Smoke Review';
      let investigationRadiusDetailLoaded = false;
      let investigationActorDetailLoaded = false;

      if (!lowerText('#investigation-lead-feedback').includes('no lead yet')) {
        throw new Error('Investigation lead empty state was not visible');
      }
      setValue('#investigation-lead-type', 'radius');
      setValue('#investigation-lead-value', '30000001');
      setValue('#investigation-radius', '1');
      await click('#investigation-check-scope');
      await waitFor('investigation scope route', () => text('#view-title').trim() === 'Scopes' && document.querySelector('#scope-system-id')?.value === '30000001');
      document.querySelector('[data-view="investigation"]').click();
      await waitFor('back to investigation', () => text('#view-title').trim() === 'Investigation');
      await click('#investigation-load-detail');
      await waitFor('investigation radius detail', () => lowerText('#investigation-detail-status').includes('stored evidence') && lowerText('#investigation-evidence-summary').includes('killmails'));
      investigationRadiusDetailLoaded = lowerText('#investigation-evidence-summary').includes('radius') || lowerText('#investigation-evidence-summary').includes('solar');
      setValue('#investigation-lead-type', 'actor');
      setValue('#investigation-lead-value', '90000002');
      await click('#investigation-load-detail');
      await waitFor('investigation actor detail', () => lowerText('#investigation-detail-status').includes('stored evidence') && lowerText('#investigation-evidence-summary').includes('killmails'));
      investigationActorDetailLoaded = lowerText('#investigation-evidence-summary').includes('character') || lowerText('#investigation-evidence-summary').includes('90000002');
      await click('#investigation-discover-leads');
      await waitFor('investigation action route', () => text('#view-title').trim() === 'Actions' && document.querySelector('#action-actor-id')?.value === '90000002');

      await click('#load-corpus-health');
      await waitFor('corpus health', () => lowerText('#corpus-health-counts').includes('killmails'));

      await click('#preflight-runtime-snapshot');
      await waitFor('snapshot preflight', () => text('#runtime-snapshot-preflight').includes('Destination'));

      await click('#create-debug-trace-pack');
      await waitFor('debug trace pack', () => text('#debug-trace-pack-result').includes('.tmp'));

      setValue('#scope-actor-id', '90000002');
      setValue('#scope-actor-name', longLabel);
      await click('#validate-scope');
      await waitFor('scope validation', () => lowerText('#scope-validation').includes('valid'));

      setValue('#queue-discovered-by-id', 'character:90000002');
      setValue('#queue-killmail-ids', '9301, 999999999');
      await click('#preview-queue-selection');
      await waitFor('queue selection', () => lowerText('#queue-selection-summary').includes('selected'));
      await click('#preflight-manual-expansion');
      await waitFor('manual expansion refusal', () => lowerText('#manual-expansion-preflight').includes('allowedno') || lowerText('#manual-expansion-normalized').includes('blocked'));

      setValue('#action-actor-id', '90000002');
      setValue('#action-actor-name', longLabel);
      await click('#preflight-manual-discovery');
      await waitFor('manual discovery refusal', () => lowerText('#manual-discovery-preflight').includes('allowedno') || lowerText('#manual-discovery-normalized').includes('blocked'));

      setValue('#watch-author-actor-id', '90000002');
      setValue('#watch-author-actor-name', longLabel);
      await click('#save-actor-watch');
      await waitFor('watch authoring', () => lowerText('#watch-authoring-status').includes('saved') || text('#watch-list').includes('90000002'));
      await click('#refresh-watch-status');
      await waitFor('watch status', () => lowerText('#watch-summary').includes('live api') || lowerText('#watch-summary').includes('blocked'));

      setValue('#actor-report-id', '90000002');
      setValue('#actor-report-name', longLabel);
      await click('#load-actor-report');
      await waitFor('actor report', () => lowerText('#report-status').includes('killmail') && text('#actor-raw-ids').includes('9301'));

      await click('#preflight-metadata-hydration');
      await waitFor('hydration refusal', () => lowerText('#metadata-hydration-status').includes('allowedno') || lowerText('#metadata-hydration-normalized').includes('blocked'));

      setValue('#assessment-reason', 'Rugged smoke assessment over fixture evidence with a deliberately long label.');
      setValue('#assessment-summary', 'Fixture memory created by Electron rugged smoke.');
      document.querySelector('#assessment-confirm').checked = true;
      await click('#save-assessment-artifact');
      await waitFor('assessment saved', () => lowerText('#assessment-status').includes('saved') || text('#assessment-artifact-list').includes('entity_interest'));

      setValue('#radius-report-center', '30000001');
      await click('#load-radius-report');
      await waitFor('radius report', () => lowerText('#report-status').includes('radius') || text('#report-output').includes('Atlas Prime'));

      return {
        window_size: { width: window.innerWidth, height: window.innerHeight },
        investigation_empty_feedback: true,
        investigation_scope_route: document.querySelector('#scope-system-id')?.value === '30000001',
        investigation_action_route: document.querySelector('#action-actor-id')?.value === '90000002',
        investigation_radius_detail_loaded: investigationRadiusDetailLoaded,
        investigation_actor_detail_loaded: investigationActorDetailLoaded,
        corpus_health_loaded: lowerText('#corpus-health-counts').includes('killmails'),
        snapshot_preflight_read_only: lowerText('#runtime-snapshot-preflight').includes('read-only'),
        trace_pack_written: text('#debug-trace-pack-result').includes('.tmp'),
        manual_discovery_refused: lowerText('#manual-discovery-preflight').includes('allowedno') || lowerText('#manual-discovery-normalized').includes('blocked'),
        manual_expansion_refused: lowerText('#manual-expansion-preflight').includes('allowedno') || lowerText('#manual-expansion-normalized').includes('blocked'),
        hydration_refused: lowerText('#metadata-hydration-status').includes('allowedno') || lowerText('#metadata-hydration-normalized').includes('blocked'),
        actor_report_loaded: text('#actor-raw-ids').includes('9301'),
        assessment_saved: lowerText('#assessment-status').includes('saved') || text('#assessment-artifact-list').includes('entity_interest'),
        long_label_length: longLabel.length
      };
    })();
  `);
  assertSmoke(checks.corpus_health_loaded, 'rugged smoke should load corpus health');
  assertSmoke(checks.investigation_empty_feedback, 'rugged smoke should show investigation empty lead feedback');
  assertSmoke(checks.investigation_scope_route, 'rugged smoke should route investigation system/radius leads into scope controls');
  assertSmoke(checks.investigation_action_route, 'rugged smoke should route investigation actor leads into action preflight controls');
  assertSmoke(checks.investigation_radius_detail_loaded, 'rugged smoke should load investigation radius stored-evidence detail');
  assertSmoke(checks.investigation_actor_detail_loaded, 'rugged smoke should load investigation actor stored-evidence detail');
  assertSmoke(checks.snapshot_preflight_read_only, 'rugged smoke should show read-only snapshot preflight');
  assertSmoke(checks.trace_pack_written, 'rugged smoke should create a bounded trace pack artifact');
  assertSmoke(checks.manual_discovery_refused, 'rugged smoke should refuse manual discovery when live gate is closed');
  assertSmoke(checks.manual_expansion_refused, 'rugged smoke should refuse manual expansion when live gate is closed');
  assertSmoke(checks.hydration_refused, 'rugged smoke should refuse hydration when live gate is closed');
  assertSmoke(checks.actor_report_loaded, 'rugged smoke should load fixture actor report evidence');
  assertSmoke(checks.assessment_saved, 'rugged smoke should save deliberate assessment memory');

  const image = await window.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, 'rugged-operator-narrow.png'), image.toPNG());
  return checks;
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
        hasViews: ['investigation', 'readiness', 'scopes', 'tasks', 'queue-watch', 'actions', 'reports']
          .every((name) => Boolean(document.querySelector('#view-' + name))),
        opensInvestigation: document.querySelector('#view-investigation')?.classList.contains('active') &&
          document.querySelector('#view-title')?.textContent?.trim() === 'Investigation',
        investigationPassiveText: (document.querySelector('#view-investigation')?.textContent || '')
          .includes('Opening this desk is passive'),
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
