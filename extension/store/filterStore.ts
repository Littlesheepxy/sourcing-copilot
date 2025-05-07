/**
 * 规则引擎状态管理 - 使用Zustand
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { 
  AppState, 
  FilterConfig, 
  Rule, 
  RuleType, 
  FilterResult, 
  CalibrationRecord,
  Company,
  CompanyType
} from '../../shared/types';
import { ChromeStorageAdapter } from './chromeStorageAdapter';

// 创建Chrome存储适配器实例
const chromeStorageAdapter = new ChromeStorageAdapter<any>();

// 创建Zustand StateStorage适配器
const zustandChromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const data = await chromeStorageAdapter.load(name);
    return data !== null ? JSON.stringify(data) : null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const data = JSON.parse(value);
    await chromeStorageAdapter.save(name, data);
  },
  removeItem: async (name: string): Promise<void> => {
    await chromeStorageAdapter.remove(name);
  }
};

// 默认规则配置
const DEFAULT_RULES: Rule[] = [
  {
    id: uuidv4(),
    type: RuleType.POSITION,
    name: '岗位匹配',
    weight: 100,
    enabled: true,
    order: 0
  },
  {
    id: uuidv4(),
    type: RuleType.COMPANY,
    name: '公司背景',
    weight: 80,
    enabled: true,
    order: 1,
    items: []
  },
  {
    id: uuidv4(),
    type: RuleType.KEYWORD,
    name: '技能关键词',
    weight: 70,
    enabled: true,
    order: 2,
    items: []
  },
  {
    id: uuidv4(),
    type: RuleType.SCHOOL,
    name: '学校',
    weight: 50,
    enabled: true,
    order: 3,
    items: []
  },
  {
    id: uuidv4(),
    type: RuleType.EDUCATION,
    name: '学历',
    weight: 40,
    enabled: true,
    order: 4,
    items: ['本科', '硕士', '博士']
  }
];

// 默认配置
const DEFAULT_CONFIG: FilterConfig = {
  id: uuidv4(),
  name: '默认筛选配置',
  rules: DEFAULT_RULES,
  companies: [],
  keywords: [],
  positionKeywords: [],
  autoGreetThreshold: 70,
  mode: 'manual',
  lastUpdated: Date.now()
};

// 初始状态
const initialState: AppState = {
  currentFilterConfig: DEFAULT_CONFIG,
  filterConfigs: [DEFAULT_CONFIG],
  filterResults: [],
  calibrationRecords: [],
  isProcessing: false,
  activeTab: 'rules'
};

// 定义状态和动作类型
type FilterStore = AppState & {
  // 配置操作
  createConfig: (name: string) => void;
  updateConfig: (config: Partial<FilterConfig>) => void;
  deleteConfig: (id: string) => void;
  setCurrentConfig: (id: string) => void;
  
  // 规则操作
  updateRule: (ruleId: string, updates: Partial<Rule>) => void;
  reorderRules: (ruleIds: string[]) => void;
  
  // 公司操作
  addCompany: (name: string, type: CompanyType) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  
  // 关键词操作
  addKeyword: (keyword: string) => void;
  deleteKeyword: (keyword: string) => void;
  
  // 岗位关键词操作
  addPositionKeyword: (keyword: string) => void;
  deletePositionKeyword: (keyword: string) => void;
  
  // 结果操作
  addFilterResult: (result: FilterResult) => void;
  clearFilterResults: () => void;
  
  // 校准记录操作
  addCalibrationRecord: (record: CalibrationRecord) => void;
  clearCalibrationRecords: () => void;
  exportCalibrationRecords: () => string;
  importCalibrationRecords: (jsonStr: string) => void;
  
  // UI状态
  setActiveTab: (tab: string) => void;
  setProcessing: (isProcessing: boolean) => void;
};

// 创建状态存储
export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // 配置操作
      createConfig: (name: string) => set(state => {
        const newConfig: FilterConfig = {
          id: uuidv4(),
          name,
          rules: JSON.parse(JSON.stringify(DEFAULT_RULES)),
          companies: [],
          keywords: [],
          positionKeywords: [],
          autoGreetThreshold: 70,
          mode: 'manual',
          lastUpdated: Date.now()
        };
        
        return {
          filterConfigs: [...state.filterConfigs, newConfig],
          currentFilterConfig: newConfig
        };
      }),
      
      updateConfig: (updates: Partial<FilterConfig>) => set(state => {
        const { currentFilterConfig } = state;
        const updatedConfig = { 
          ...currentFilterConfig, 
          ...updates,
          lastUpdated: Date.now()
        };
        
        const updatedConfigs = state.filterConfigs.map(config => 
          config.id === currentFilterConfig.id ? updatedConfig : config
        );
        
        return {
          currentFilterConfig: updatedConfig,
          filterConfigs: updatedConfigs
        };
      }),
      
      deleteConfig: (id: string) => set(state => {
        const updatedConfigs = state.filterConfigs.filter(config => config.id !== id);
        
        // 如果删除的是当前配置，切换到第一个可用配置
        let { currentFilterConfig } = state;
        if (currentFilterConfig.id === id && updatedConfigs.length > 0) {
          currentFilterConfig = updatedConfigs[0];
        }
        
        return {
          filterConfigs: updatedConfigs,
          currentFilterConfig
        };
      }),
      
      setCurrentConfig: (id: string) => set(state => {
        const config = state.filterConfigs.find(config => config.id === id);
        if (config) {
          return { currentFilterConfig: config };
        }
        return {};
      }),
      
      // 规则操作
      updateRule: (ruleId: string, updates: Partial<Rule>) => set(state => {
        const { currentFilterConfig } = state;
        const updatedRules = currentFilterConfig.rules.map(rule => 
          rule.id === ruleId ? { ...rule, ...updates } : rule
        );
        
        const updatedConfig = {
          ...currentFilterConfig,
          rules: updatedRules,
          lastUpdated: Date.now()
        };
        
        const updatedConfigs = state.filterConfigs.map(config => 
          config.id === currentFilterConfig.id ? updatedConfig : config
        );
        
        return {
          currentFilterConfig: updatedConfig,
          filterConfigs: updatedConfigs
        };
      }),
      
      reorderRules: (ruleIds: string[]) => set(state => {
        const { currentFilterConfig } = state;
        
        // 创建规则映射
        const ruleMap = new Map(
          currentFilterConfig.rules.map(rule => [rule.id, rule])
        );
        
        // 重新排序规则
        const updatedRules = ruleIds.map((id, index) => {
          const rule = ruleMap.get(id);
          if (!rule) return null;
          return { ...rule, order: index };
        }).filter(Boolean) as Rule[];
        
        const updatedConfig = {
          ...currentFilterConfig,
          rules: updatedRules,
          lastUpdated: Date.now()
        };
        
        const updatedConfigs = state.filterConfigs.map(config => 
          config.id === currentFilterConfig.id ? updatedConfig : config
        );
        
        return {
          currentFilterConfig: updatedConfig,
          filterConfigs: updatedConfigs
        };
      }),
      
      // 公司操作
      addCompany: (name: string, type: CompanyType) => set(state => {
        const { currentFilterConfig } = state;
        
        // 检查是否已存在
        if (currentFilterConfig.companies.some(c => c.name === name)) {
          return {};
        }
        
        const newCompany: Company = {
          id: uuidv4(),
          name,
          type
        };
        
        const updatedConfig = {
          ...currentFilterConfig,
          companies: [...currentFilterConfig.companies, newCompany],
          lastUpdated: Date.now()
        };
        
        const updatedConfigs = state.filterConfigs.map(config => 
          config.id === currentFilterConfig.id ? updatedConfig : config
        );
        
        return {
          currentFilterConfig: updatedConfig,
          filterConfigs: updatedConfigs
        };
      }),
      
      updateCompany: (id: string, updates: Partial<Company>) => set(state => {
        const { currentFilterConfig } = state;
        
        const updatedCompanies = currentFilterConfig.companies.map(company => 
          company.id === id ? { ...company, ...updates } : company
        );
        
        const updatedConfig = {
          ...currentFilterConfig,
          companies: updatedCompanies,
          lastUpdated: Date.now()
        };
        
        const updatedConfigs = state.filterConfigs.map(config => 
          config.id === currentFilterConfig.id ? updatedConfig : config
        );
        
        return {
          currentFilterConfig: updatedConfig,
          filterConfigs: updatedConfigs
        };
      }),
      
      deleteCompany: (id: string) => set(state => {
        const { currentFilterConfig } = state;
        
        const updatedCompanies = currentFilterConfig.companies.filter(
          company => company.id !== id
        );
        
        const updatedConfig = {
          ...currentFilterConfig,
          companies: updatedCompanies,
          lastUpdated: Date.now()
        };
        
        const updatedConfigs = state.filterConfigs.map(config => 
          config.id === currentFilterConfig.id ? updatedConfig : config
        );
        
        return {
          currentFilterConfig: updatedConfig,
          filterConfigs: updatedConfigs
        };
      }),
      
      // 关键词操作
      addKeyword: (keyword: string) => set(state => {
        const { currentFilterConfig } = state;
        
        // 检查是否已存在
        if (currentFilterConfig.keywords.includes(keyword)) {
          return {};
        }
        
        const updatedConfig = {
          ...currentFilterConfig,
          keywords: [...currentFilterConfig.keywords, keyword],
          lastUpdated: Date.now()
        };
        
        const updatedConfigs = state.filterConfigs.map(config => 
          config.id === currentFilterConfig.id ? updatedConfig : config
        );
        
        return {
          currentFilterConfig: updatedConfig,
          filterConfigs: updatedConfigs
        };
      }),
      
      deleteKeyword: (keyword: string) => set(state => {
        const { currentFilterConfig } = state;
        
        const updatedKeywords = currentFilterConfig.keywords.filter(k => k !== keyword);
        
        const updatedConfig = {
          ...currentFilterConfig,
          keywords: updatedKeywords,
          lastUpdated: Date.now()
        };
        
        const updatedConfigs = state.filterConfigs.map(config => 
          config.id === currentFilterConfig.id ? updatedConfig : config
        );
        
        return {
          currentFilterConfig: updatedConfig,
          filterConfigs: updatedConfigs
        };
      }),
      
      // 岗位关键词操作
      addPositionKeyword: (keyword: string) => set(state => {
        const { currentFilterConfig } = state;
        
        // 检查是否已存在
        if (currentFilterConfig.positionKeywords.includes(keyword)) {
          return {};
        }
        
        const updatedConfig = {
          ...currentFilterConfig,
          positionKeywords: [...currentFilterConfig.positionKeywords, keyword],
          lastUpdated: Date.now()
        };
        
        const updatedConfigs = state.filterConfigs.map(config => 
          config.id === currentFilterConfig.id ? updatedConfig : config
        );
        
        return {
          currentFilterConfig: updatedConfig,
          filterConfigs: updatedConfigs
        };
      }),
      
      deletePositionKeyword: (keyword: string) => set(state => {
        const { currentFilterConfig } = state;
        
        const updatedKeywords = currentFilterConfig.positionKeywords.filter(k => k !== keyword);
        
        const updatedConfig = {
          ...currentFilterConfig,
          positionKeywords: updatedKeywords,
          lastUpdated: Date.now()
        };
        
        const updatedConfigs = state.filterConfigs.map(config => 
          config.id === currentFilterConfig.id ? updatedConfig : config
        );
        
        return {
          currentFilterConfig: updatedConfig,
          filterConfigs: updatedConfigs
        };
      }),
      
      // 结果操作
      addFilterResult: (result: FilterResult) => set(state => ({
        filterResults: [result, ...state.filterResults].slice(0, 1000)
      })),
      
      clearFilterResults: () => set({ filterResults: [] }),
      
      // 校准记录操作
      addCalibrationRecord: (record: CalibrationRecord) => set(state => ({
        calibrationRecords: [record, ...state.calibrationRecords].slice(0, 1000)
      })),
      
      clearCalibrationRecords: () => set({ calibrationRecords: [] }),
      
      exportCalibrationRecords: () => {
        return JSON.stringify(get().calibrationRecords);
      },
      
      importCalibrationRecords: (jsonStr: string) => {
        try {
          const records = JSON.parse(jsonStr);
          if (Array.isArray(records)) {
            set({ calibrationRecords: records });
          }
        } catch (error) {
          console.error('导入校准记录失败', error);
        }
      },
      
      // UI状态
      setActiveTab: (tab: string) => set({ activeTab: tab }),
      setProcessing: (isProcessing: boolean) => set({ isProcessing })
    }),
    {
      name: 'sourcing-filter-store',
      storage: createJSONStorage(() => zustandChromeStorage)
    }
  )
); 