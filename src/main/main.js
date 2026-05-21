const { app, BrowserWindow } = require('electron');
const { initializeRuntimeDatabase, closeDatabase } = require('./db/database');

let runtimeDb = null;

function createWindow() {
  const window = new BrowserWindow({
    width: 1100,
    height: 720,
    title: 'AURA Atlas'
  });

  window.loadFile('src/renderer/index.html');
}

app.whenReady().then(() => {
  runtimeDb = initializeRuntimeDatabase(app);
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
