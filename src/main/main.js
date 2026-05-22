const path = require('node:path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { initializeRuntimeDatabase, closeDatabase } = require('./db/database');
const { registerIpcServiceHandlers } = require('./services/serviceRegistry');

let runtimeDb = null;

function createWindow() {
  const window = new BrowserWindow({
    width: 1100,
    height: 720,
    title: 'AURA Atlas',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.loadFile('src/renderer/index.html');
}

app.whenReady().then(() => {
  runtimeDb = initializeRuntimeDatabase(app);
  registerIpcServiceHandlers(ipcMain, () => runtimeDb);
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
