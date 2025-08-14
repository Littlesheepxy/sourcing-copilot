import { useState, useEffect } from 'react';
import { SystemConfig, getConfig, saveConfig } from '../lib/config';

export function useConfig() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 加载配置
  useEffect(() => {
    try {
      const loadedConfig = getConfig();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 监听配置更新事件
  useEffect(() => {
    const handleConfigUpdate = (event: CustomEvent) => {
      setConfig(event.detail);
    };

    window.addEventListener('configUpdated', handleConfigUpdate as EventListener);
    
    return () => {
      window.removeEventListener('configUpdated', handleConfigUpdate as EventListener);
    };
  }, []);

  // 更新配置
  const updateConfig = (newConfig: SystemConfig) => {
    try {
      saveConfig(newConfig);
      setConfig(newConfig);
      // 触发配置更新事件
      window.dispatchEvent(new CustomEvent('configUpdated', { detail: newConfig }));
    } catch (error) {
      console.error('更新配置失败:', error);
      throw error;
    }
  };

  return {
    config,
    isLoading,
    updateConfig
  };
}

// 专门用于获取AI配置的Hook
export function useAiConfig() {
  const { config, isLoading } = useConfig();
  
  return {
    apiKey: config?.apiKey || '',
    modelProvider: config?.modelProvider || 'openai',
    modelVersion: config?.modelVersion || 'gpt-4o',
    isConfigured: true, // 企业版总是已配置
    isLoading
  };
}

// 专门用于获取系统配置的Hook
export function useSystemConfig() {
  const { config, isLoading } = useConfig();
  
  return {
    autoMode: true, // 固定启用自动模式
    scanInterval: config?.scanInterval || 30, // 仅用于显示，实际使用随机值
    maxCandidates: config?.maxCandidates || 50,
    isLoading
  };
} 