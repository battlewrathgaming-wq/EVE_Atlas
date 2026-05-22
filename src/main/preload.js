const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('atlasServices', {
  list() {
    return ipcRenderer.invoke('atlas:service:list');
  },
  invoke(command, payload = {}, options = {}) {
    return ipcRenderer.invoke('atlas:service:invoke', {
      command,
      payload,
      asTask: options.asTask === true,
      detachedTask: options.detachedTask === true,
      background: options.background === true
    });
  }
});

contextBridge.exposeInMainWorld('atlasWindow', {
  getState() {
    return ipcRenderer.invoke('atlas:window:get-state');
  },
  setAlwaysOnTop(enabled) {
    return ipcRenderer.invoke('atlas:window:set-always-on-top', enabled === true);
  },
  minimize() {
    return ipcRenderer.invoke('atlas:window:minimize');
  },
  close() {
    return ipcRenderer.invoke('atlas:window:close');
  }
});
