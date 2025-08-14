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
export type ModuleType = 'home' | 'candidates' | 'rules' | 'simple-rules' | 'ai-rules' | 'logs' | 'settings' | 'ai-chat';

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
  
  // 时间记录状态
  timeTracking: {
    totalSavedTime: number; // 总节省时间（秒）
    currentSessionStart: number | null; // 当前会话开始时间戳
    isTracking: boolean; // 是否正在记录时间
  };
  
  // 打招呼统计
  greetingStats: {
    totalGreetings: number; // 总打招呼数量
  };
  
  // 设置函数
  setShowAIChat: (show: boolean) => void;
  setAIChatLoading: (loading: boolean) => void;
  setThemeConfig: (config: Partial<ThemeConfig>) => void;
  setActiveModule: (module: ModuleType) => void;
  
  // 时间记录相关函数
  startTimeTracking: () => void;
  stopTimeTracking: () => void;
  resetTimeTracking: () => void;
  
  // 打招呼统计相关函数
  incrementGreetings: () => void;
  resetGreetings: () => void;
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
  
  // 时间记录状态默认值
  timeTracking: {
    totalSavedTime: 0,
    currentSessionStart: null,
    isTracking: false,
  },
  
  // 打招呼统计默认值
  greetingStats: {
    totalGreetings: 0,
  },
  
  // 设置函数
  setShowAIChat: (show) => set({ showAIChat: show }),
  setAIChatLoading: (loading) => set({ aiChatLoading: loading }),
  setThemeConfig: (config) => set((state) => ({
    themeConfig: { ...state.themeConfig, ...config }
  })),
  setActiveModule: (module) => set({ activeModule: module }),
  
  // 时间记录相关函数
  startTimeTracking: () => set((state) => ({
    timeTracking: { 
      ...state.timeTracking, 
      currentSessionStart: Date.now(),
      isTracking: true 
    }
  })),
  stopTimeTracking: () => set((state) => {
    const now = Date.now();
    const sessionTime = state.timeTracking.currentSessionStart 
      ? Math.floor((now - state.timeTracking.currentSessionStart) / 1000)
      : 0;
    
    return {
      timeTracking: { 
        ...state.timeTracking, 
        totalSavedTime: state.timeTracking.totalSavedTime + sessionTime,
        currentSessionStart: null,
        isTracking: false 
      }
    };
  }),
  resetTimeTracking: () => set((state) => ({
    timeTracking: { ...state.timeTracking, totalSavedTime: 0, currentSessionStart: null }
  })),
  
  // 打招呼统计相关函数
  incrementGreetings: () => set((state) => ({
    greetingStats: { ...state.greetingStats, totalGreetings: state.greetingStats.totalGreetings + 1 }
  })),
  resetGreetings: () => set((state) => ({
    greetingStats: { ...state.greetingStats, totalGreetings: 0 }
  })),
})); 