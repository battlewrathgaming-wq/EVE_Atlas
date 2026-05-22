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
