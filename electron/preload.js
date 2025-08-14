const { contextBridge, ipcRenderer } = require('electron');

// Expose secure APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Check if API service is ready
  apiReady: () => ipcRenderer.invoke('api-ready'),
  
  // API request proxy
  apiRequest: (options) => ipcRenderer.invoke('api-request', options),
  
  // Get version
  getVersion: () => process.env.npm_package_version || 'dev',
  
  // 新增登录API
  loginSuccess: (username) => ipcRenderer.invoke('login-success', username),
  logout: () => ipcRenderer.invoke('logout'),
  
  // 错误处理API
  retryBackend: () => ipcRenderer.invoke('retry-backend'),
  showLogs: () => ipcRenderer.invoke('show-logs'),
  exitApp: () => ipcRenderer.invoke('exit-app'),
  
  // 新增外部链接处理API
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // 新增提醒页面API
  continueToApp: () => ipcRenderer.invoke('continue-to-app'),
  openSystemSettings: () => ipcRenderer.invoke('open-system-settings'),
  closeReminder: () => ipcRenderer.invoke('close-reminder')
});

// Some system information
const platform = process.platform;
const osVersion = process.getSystemVersion();

contextBridge.exposeInMainWorld('systemInfo', {
  platform,
  osVersion
});