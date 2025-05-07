/**
 * 规则引擎类型定义
 */

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