import { create } from 'zustand';

// 日志项
interface LogItem {
  timestamp: string;
  action: string;
  details: string;
}

// 简历数据
interface ResumeData {
  name: string;
  education: string;
  experience: string;
  school: string;
  company: string;
  position: string;
  skills: string[];
  rawData: {
    baseInfo: string;
    school: string;
    company: string;
    position: string;
  };
  detail?: {
    workExperience: string;
    educationExperience: string;
    projectExperience: string;
    expectation: string;
  };
}

// 条件
interface Condition {
  field: string;
  operator: string;
  value: string;
}

// 规则组
interface RuleGroup {
  operator: 'AND' | 'OR';
  conditions: (Condition | RuleGroup)[];
  checkDetail?: boolean;
}

// 标记数据
interface MarkedData {
  positive: ResumeData[];
  negative: ResumeData[];
}

// 选择器配置
interface Selectors {
  name: string;
  education: string;
  experience: string;
  school: string;
  company: string;
  position: string;
  skills: string;
  greetButton: string;
  detailPage: {
    container: string;
    workExperience: string;
    educationExperience: string;
    projectExperience: string;
    expectation: string;
  };
}

// DeepSeek API 配置
interface DeepSeekConfig {
  apiKey: string;
  apiBaseUrl: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
}

// 主题设置
interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
}

// 状态类型
interface StoreState {
  // 模式
  mode: 'calibration' | 'automatic';
  // 筛选规则
  filterRules: RuleGroup;
  // 日志
  logs: LogItem[];
  // 标记数据
  markedData: MarkedData;
  // 选择器配置
  selectors: Selectors;
  // DeepSeek API 配置
  deepseekConfig: DeepSeekConfig;
  // 主题设置
  themeConfig: ThemeConfig;
  // AI聊天设置
  aiChatLoading: boolean;
  // 显示AI聊天面板
  showAIChat: boolean;
  
  // 操作方法
  toggleMode: () => void;
  updateRules: (rules: RuleGroup) => void;
  addLog: (action: string, details: string) => void;
  clearLogs: () => void;
  addMarkedData: (resumeData: ResumeData, isPositive: boolean) => void;
  updateSelectors: (selectors: Selectors) => void;
  updateDeepSeekConfig: (config: Partial<DeepSeekConfig>) => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  setPrimaryColor: (color: string) => void;
  setAIChatLoading: (loading: boolean) => void;
  setShowAIChat: (show: boolean) => void;
}

// 创建状态存储
export const useStore = create<StoreState>((set) => ({
  // 默认值
  mode: 'calibration',
  filterRules: {
    operator: 'AND',
    conditions: [],
    checkDetail: true
  },
  logs: [],
  markedData: {
    positive: [],
    negative: []
  },
  selectors: {
    name: ".name",
    education: "div.base-info.join-text-wrap",
    experience: "div.base-info.join-text-wrap",
    school: "div.timeline-wrap.edu-exps div.join-text-wrap",
    company: "div.timeline-wrap.work-exps div.join-text-wrap",
    position: "div.row.row-flex.geek-desc",
    skills: "div.tags",
    greetButton: "button.btn.btn-greet",
    detailPage: {
      container: "div.resume-detail-wrap",
      workExperience: "div.geek-work-experience-wrap",
      educationExperience: "div.geek-education-experience-wrap",
      projectExperience: "div.geek-project-experience-wrap",
      expectation: "div.geek-expect-wrap"
    }
  },
  
  // DeepSeek API 默认配置
  deepseekConfig: {
    apiKey: "",
    apiBaseUrl: "https://api.deepseek.com/v1",
    modelName: "deepseek-chat",
    maxTokens: 1000,
    temperature: 0.7
  },
  
  // 主题设置默认值
  themeConfig: {
    mode: 'system',
    primaryColor: '#3182ce' // 默认蓝色
  },
  
  // AI聊天加载状态
  aiChatLoading: false,
  
  // 显示AI聊天面板
  showAIChat: false,
  
  // 操作方法
  toggleMode: () => set((state) => ({
    mode: state.mode === 'calibration' ? 'automatic' : 'calibration'
  })),
  
  updateRules: (rules) => set(() => ({
    filterRules: rules
  })),
  
  addLog: (action, details) => set((state) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      action,
      details
    };
    
    // 限制日志数量
    const maxLogs = 1000;
    const updatedLogs = [newLog, ...state.logs];
    if (updatedLogs.length > maxLogs) {
      updatedLogs.length = maxLogs;
    }
    
    return { logs: updatedLogs };
  }),
  
  clearLogs: () => set(() => ({
    logs: []
  })),
  
  addMarkedData: (resumeData, isPositive) => set((state) => {
    if (isPositive) {
      return {
        markedData: {
          ...state.markedData,
          positive: [...state.markedData.positive, resumeData]
        }
      };
    } else {
      return {
        markedData: {
          ...state.markedData,
          negative: [...state.markedData.negative, resumeData]
        }
      };
    }
  }),
  
  updateSelectors: (selectors) => set(() => ({
    selectors
  })),
  
  // 更新DeepSeek配置
  updateDeepSeekConfig: (config) => set((state) => ({
    deepseekConfig: { ...state.deepseekConfig, ...config }
  })),
  
  // 设置主题模式
  setThemeMode: (mode) => set((state) => ({
    themeConfig: { ...state.themeConfig, mode }
  })),
  
  // 设置主要颜色
  setPrimaryColor: (color) => set((state) => ({
    themeConfig: { ...state.themeConfig, primaryColor: color }
  })),
  
  // 设置AI聊天加载状态
  setAIChatLoading: (loading) => set(() => ({
    aiChatLoading: loading
  })),
  
  // 设置显示AI聊天面板
  setShowAIChat: (show) => set(() => ({
    showAIChat: show
  }))
})); 