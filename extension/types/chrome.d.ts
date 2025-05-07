/**
 * Chrome扩展API类型声明
 */

/**
 * Chrome运行时
 */
interface Runtime {
  // 错误信息
  lastError?: {
    message: string;
  };
  // 发送消息
  sendMessage: (message: any, callback?: (response: any) => void) => void;
  // 接收消息
  onMessage: {
    addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => boolean | void) => void;
  };
  // 扩展安装事件
  onInstalled: {
    addListener: (callback: (details: { reason: string }) => void) => void;
  };
  // 获取URL
  getURL: (path: string) => string;
}

/**
 * Chrome存储区域
 */
interface StorageArea {
  get(keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void): void;
  set(items: object, callback?: () => void): void;
  remove(keys: string | string[], callback?: () => void): void;
  clear(callback?: () => void): void;
}

/**
 * Chrome存储
 */
interface Storage {
  local: StorageArea;
  sync: StorageArea;
}

/**
 * Chrome标签页
 */
interface Tabs {
  query: (queryInfo: Object, callback: (tabs: any[]) => void) => void;
  sendMessage: (tabId: number, message: any, callback?: (response: any) => void) => void;
  create: (createProperties: { url: string }) => void;
}

/**
 * Chrome命名空间
 */
declare namespace chrome {
  export const runtime: Runtime;
  export const storage: Storage;
  export const tabs: Tabs;
}

/**
 * Chrome全局变量
 */
interface Chrome {
  runtime: Runtime;
  storage: Storage;
  tabs: Tabs;
}

declare var chrome: Chrome; 