const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('localTodo', {
  saveBackup: (content) => ipcRenderer.invoke('backup:save', content),
  openBackup: () => ipcRenderer.invoke('backup:open'),
});
