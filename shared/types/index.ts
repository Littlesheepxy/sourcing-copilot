/**
 * 共享类型定义
 */

// 筛选规则类型
export enum RuleType {
  POSITION = 'position', // 岗位（硬条件）
  COMPANY = 'company',   // 公司（包含竞对公司）
  KEYWORD = 'keyword',   // 关键词（技能关键词）
  SCHOOL = 'school',     // 学校（优先考虑）
  EDUCATION = 'education' // 学历
}

// 公司类型
export enum CompanyType {
  COMPETITOR = 'competitor', // 竞对公司
  TARGET = 'target',         // 目标公司
  NORMAL = 'normal'          // 普通公司
}

// 单个规则配置
export interface Rule {
  id: string;           // 规则ID
  type: RuleType;       // 规则类型
  name: string;         // 规则名称
  weight: number;       // 权重 (0-100)
  enabled: boolean;     // 是否启用
  order: number;        // 顺序
  items?: string[];     // 对于公司和关键词，可以有多个项目
  threshold?: number;   // 阈值 (对于某些规则)
}

// 公司信息
export interface Company {
  id: string;
  name: string;
  type: CompanyType;
}

// 筛选配置
export interface FilterConfig {
  id: string;
  name: string;
  rules: Rule[];
  companies: Company[];
  keywords: string[];
  positionKeywords: string[];
  autoGreetThreshold: number; // 自动打招呼阈值
  mode: 'manual' | 'auto';    // 模式：人工校准/自动筛选
  lastUpdated: number;        // 最后更新时间
}

// 筛选结果
export interface FilterResult {
  candidateId: string;
  candidateName: string;
  score: number;
  matchDetails: {
    ruleId: string;
    ruleName: string;
    matched: boolean;
    score: number;
    details?: string;
  }[];
  action: 'greet' | 'skip' | 'manual'; // 执行的动作
  timestamp: number;
}

// 人工校准记录
export interface CalibrationRecord {
  candidateId: string;
  candidateData: any;
  userDecision: 'accept' | 'reject';
  timestamp: number;
}

// AI建议
export interface AIRecommendation {
  rules: Partial<Rule>[];
  companies: string[];
  keywords: string[];
  explanation: string;
}

// 应用状态
export interface AppState {
  currentFilterConfig: FilterConfig;
  filterConfigs: FilterConfig[];
  filterResults: FilterResult[];
  calibrationRecords: CalibrationRecord[];
  isProcessing: boolean;
  activeTab: string;
} 