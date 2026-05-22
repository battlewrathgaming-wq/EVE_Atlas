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
