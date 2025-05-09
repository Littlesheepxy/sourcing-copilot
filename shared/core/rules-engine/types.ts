/**
 * 规则引擎类型定义
 */
import { RuleType } from '../../types/index';

// 条件操作符枚举
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
  REGEX = 'regex',
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists'
}

// 逻辑操作符枚举
export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR'
}

// 条件定义
export interface Condition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
  enabled: boolean;
  type?: RuleType; // 规则类型
  weight?: number; // 规则权重
}

// 规则组定义
export interface RuleGroup {
  id: string;
  operator: LogicalOperator;
  conditions: (Condition | RuleGroup)[];
  enabled: boolean;
}

// 规则评估结果
export interface EvaluationResult {
  matched: boolean;
  matchedConditions: string[];
  unmatchedConditions: string[];
}

// 规则评估上下文
export interface EvaluationContext {
  data: any;
  path?: string[];
}

// 规则引擎服务接口
export interface RulesEngineService {
  evaluateRules(context: EvaluationContext, rules: RuleGroup): EvaluationResult;
  evaluateCondition(context: EvaluationContext, condition: Condition | RuleGroup): boolean;
}

// ==== 统一规则引擎类型定义 ====

/**
 * 统一规则类型枚举
 * 对应不同类型的筛选规则
 */
export enum UnifiedRuleType {
  POSITION = 'position',   // 岗位规则（硬条件）
  COMPANY = 'company',     // 公司规则（包含竞对公司）
  KEYWORD = 'keyword',     // 关键词规则（技能关键词）
  SCHOOL = 'school',       // 学校规则（优先考虑）
  EDUCATION = 'education', // 学历规则
  GENERIC = 'generic'      // 通用规则（用于逻辑条件规则引擎）
}

/**
 * 统一规则接口
 * 用于创建和评估规则的标准结构
 */
export interface UnifiedRule {
  id: string;                                  // 规则唯一标识
  type: UnifiedRuleType;                       // 规则类型
  field: string;                               // 应用的字段
  operator: ConditionOperator;                 // 条件操作符
  value: string | string[];                    // 规则值（单个或多个）
  weight: number;                              // 权重（0-100）
  enabled: boolean;                            // 是否启用
  order?: number;                              // 规则顺序（可选）
  isHardRule?: boolean;                        // 是否为硬性条件（可选）
  metadata?: Record<string, any>;              // 额外元数据（可选）
}

/**
 * 统一规则组接口
 * 用于组织规则的层级结构
 */
export interface UnifiedRuleGroup {
  id: string;                                  // 规则组唯一标识
  operator: LogicalOperator;                   // 逻辑操作符（AND/OR）
  rules: (UnifiedRule | UnifiedRuleGroup)[];   // 规则或子规则组
  enabled: boolean;                            // 是否启用
  type?: 'group';                              // 类型标识（区分规则和规则组）
  name?: string;                               // 规则组名称（可选）
}

/**
 * 规则评估结果详情
 * 记录单条规则的评估结果
 */
export interface RuleEvaluationDetail {
  ruleId: string;                              // 规则ID
  ruleName?: string;                           // 规则名称
  type: UnifiedRuleType;                       // 规则类型
  matched: boolean;                            // 是否匹配
  score: number;                               // 得分（0-100）
  weight: number;                              // 权重
  field: string;                               // 评估的字段
  value: string | string[];                    // 规则值
  candidateValue: any;                         // 候选人对应字段值
  explanation?: string;                        // 解释信息
}

/**
 * 统一评估结果
 * 规则引擎评估的最终结果
 */
export interface UnifiedEvaluationResult {
  candidateId: string;                         // 候选人ID
  candidateName?: string;                      // 候选人姓名
  overallScore: number;                        // 总体得分（0-100）
  passed: boolean;                             // 是否通过筛选
  details: RuleEvaluationDetail[];             // 评估详情
  byType: Record<UnifiedRuleType, number>;     // 各类型规则得分
  timestamp: number;                           // 评估时间戳
  action: 'greet' | 'skip' | 'manual';         // 建议操作
  hardRuleViolations?: RuleEvaluationDetail[]; // 违反的硬性规则
}

/**
 * 统一规则引擎配置
 * 用于配置规则引擎行为
 */
export interface UnifiedEngineConfig {
  mode: 'auto' | 'manual';                     // 运行模式
  autoGreetThreshold: number;                  // 自动打招呼阈值（0-100）
  enableHardRules: boolean;                    // 是否启用硬性规则
  defaultWeights: Record<UnifiedRuleType, number>; // 各类型规则默认权重
  explanation: boolean;                        // 是否生成解释
}

/**
 * 评估上下文
 * 用于规则评估时的上下文信息
 */
export interface UnifiedEvaluationContext {
  data: any;                                   // 评估数据
  path?: string[];                             // 当前路径（用于嵌套评估）
  metadata?: Record<string, any>;              // 额外上下文数据
} 