const { contextBridge, ipcRenderer } = require('electron');

// Expose secure APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Check if API service is ready
  apiReady: () => ipcRenderer.invoke('api-ready'),
  
  // API request proxy
  apiRequest: (options) => ipcRenderer.invoke('api-request', options),
  
  // Get version
  getVersion: () => process.env.npm_package_version || 'dev'
});

// Some system information
const platform = process.platform;
const osVersion = process.getSystemVersion();

contextBridge.exposeInMainWorld('systemInfo', {
  platform,
  osVersion
});