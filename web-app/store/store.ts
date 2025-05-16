"use client";

import { create } from 'zustand';

interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
}

interface AIChat {
  messages: any[];
  isTyping: boolean;
}

// 定义可用的模块类型
export type ModuleType = 'home' | 'candidates' | 'rules' | 'simple-rules' | 'logs' | 'settings' | 'ai-chat';

interface Store {
  // UI状态
  showAIChat: boolean;
  aiChatLoading: boolean;
  
  // 活动模块状态
  activeModule: ModuleType;
  
  // 主题配置
  themeConfig: ThemeConfig;
  
  // AI聊天
  aiChat: AIChat;
  
  // 设置函数
  setShowAIChat: (show: boolean) => void;
  setAIChatLoading: (loading: boolean) => void;
  setThemeConfig: (config: Partial<ThemeConfig>) => void;
  setActiveModule: (module: ModuleType) => void;
}

export const useStore = create<Store>((set) => ({
  // UI状态默认值
  showAIChat: false,
  aiChatLoading: false,
  
  // 活动模块默认值为首页
  activeModule: 'home',
  
  // 主题配置默认值
  themeConfig: {
    mode: 'system',
  },
  
  // AI聊天默认值
  aiChat: {
    messages: [],
    isTyping: false,
  },
  
  // 设置函数
  setShowAIChat: (show) => set({ showAIChat: show }),
  setAIChatLoading: (loading) => set({ aiChatLoading: loading }),
  setThemeConfig: (config) => set((state) => ({
    themeConfig: { ...state.themeConfig, ...config }
  })),
  setActiveModule: (module) => set({ activeModule: module }),
})); 