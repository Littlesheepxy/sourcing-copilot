// 配置接口定义
export interface SystemConfig {
  autoMode: boolean;
  scanInterval: number;
  maxCandidates: number;
  apiKey: string;
  modelProvider: string;
  modelVersion: string;
}

// 使用提供的有效API密钥和端点
const INTERNAL_API_KEY = 'sk-hra-zp-2025052091';
const INTERNAL_API_BASE_URL = 'https://chat.inhyperloop.com/v1';

// 默认配置
export const defaultConfig: SystemConfig = {
  autoMode: true,  // 固定启用自动模式
  scanInterval: 30, // 后端使用随机值，此值仅用于显示
  maxCandidates: 50,
  apiKey: INTERNAL_API_KEY,
  modelProvider: 'openai',
  modelVersion: 'gpt-4o'
};

// 配置存储键
const CONFIG_STORAGE_KEY = 'sourcing-copilot-config';

// 获取配置
export function getConfig(): SystemConfig {
  if (typeof window === 'undefined') {
    return defaultConfig;
  }
  
  try {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      return { ...defaultConfig, ...parsedConfig };
    }
  } catch (error) {
    console.error('获取配置失败:', error);
  }
  
  return defaultConfig;
}

// 保存配置
export function saveConfig(config: SystemConfig): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('保存配置失败:', error);
    throw error;
  }
}

// 获取特定配置项
export function getConfigValue<K extends keyof SystemConfig>(key: K): SystemConfig[K] {
  const config = getConfig();
  return config[key];
}

// 更新特定配置项
export function updateConfigValue<K extends keyof SystemConfig>(key: K, value: SystemConfig[K]): void {
  const config = getConfig();
  config[key] = value;
  saveConfig(config);
}

// 检查是否允许编辑AI配置（商业化功能）
export function isAiConfigEditable(): boolean {
  // 目前为公司内部使用，不允许编辑AI配置
  // 后续商业化时可以通过以下方式启用：
  // 1. 设置环境变量：ENABLE_AI_CONFIG_EDIT=true
  // 2. 或者根据用户订阅状态判断
  // return process.env.NEXT_PUBLIC_ENABLE_AI_CONFIG_EDIT === 'true' || userSubscription?.plan === 'premium';
  return false;
}

// 检查API是否已配置
export function isApiConfigured(): boolean {
  const apiKey = getConfigValue('apiKey');
  return Boolean(apiKey && apiKey.trim().length > 0 && !apiKey.includes('your-api-key-here'));
}

// 检查自动模式是否启用
export function isAutoModeEnabled(): boolean {
  return getConfigValue('autoMode');
}

// 获取AI配置
export function getAiConfig() {
  const config = getConfig();
  return {
    apiKey: config.apiKey,
    apiBaseUrl: INTERNAL_API_BASE_URL,
    modelProvider: config.modelProvider,
    modelVersion: config.modelVersion
  };
}

// 获取系统配置
export function getSystemConfig() {
  const config = getConfig();
  return {
    autoMode: config.autoMode,
    scanInterval: config.scanInterval,
    maxCandidates: config.maxCandidates
  };
} 