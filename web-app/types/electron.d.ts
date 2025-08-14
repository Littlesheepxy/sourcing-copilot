// Electron API 类型定义
interface ElectronAPI {
  apiReady: () => Promise<boolean>;
  apiRequest: (options: any) => Promise<any>;
  getVersion: () => string;
  loginSuccess: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  retryBackend: () => Promise<void>;
  showLogs: () => Promise<void>;
  exitApp: () => Promise<void>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
}

interface SystemInfo {
  platform: string;
  osVersion: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    systemInfo?: SystemInfo;
  }
}

export {}; 