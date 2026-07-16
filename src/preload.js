const { contextBridge, ipcRenderer } = require('electron');

function on(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('desktopPet', {
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  moveWindow: (delta) => ipcRenderer.send('move-window', delta),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (patch) => ipcRenderer.invoke('settings:update', patch),
  resetPosition: () => ipcRenderer.invoke('settings:reset-position'),
  notifyFocusComplete: (minutes) => ipcRenderer.invoke('focus:complete', minutes),
  cancelFocusFromMain: () => ipcRenderer.invoke('focus:cancel'),
  onAction: (callback) => on('pet-action', callback),
  onSettingsChanged: (callback) => on('settings-changed', callback),
  onToggleSettings: (callback) => on('toggle-settings', callback),
  onFocusStart: (callback) => on('focus-start', callback),
  onFocusCancel: (callback) => on('focus-cancel', callback),
  onSystemIdleChanged: (callback) => on('system-idle-changed', callback)
});
