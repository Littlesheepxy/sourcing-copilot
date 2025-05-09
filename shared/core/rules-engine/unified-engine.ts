/**
 * 统一规则引擎
 * 整合权重评分引擎和逻辑条件引擎
 */

import { v4 as uuidv4 } from 'uuid';
import { RulesAdapter } from './adapter';
import {
  UnifiedRule,
  UnifiedRuleGroup,
  UnifiedRuleType,
  UnifiedEvaluationResult,
  UnifiedEngineConfig,
  RuleEvaluationDetail,
} from './types';

/**
 * 候选人数据结构
 */
export interface CandidateData {
  id: string;
  name?: string;
  position?: string;
  company?: string[];
  skills?: string[];
  schools?: string[];
  education?: string;
  experience?: number;
  [key: string]: any;
}

/**
 * 默认引擎配置
 */
const DEFAULT_CONFIG: UnifiedEngineConfig = {
  mode: 'manual',
  autoGreetThreshold: 70,
  enableHardRules: true,
  explanation: true,
  defaultWeights: {
    [UnifiedRuleType.POSITION]: 100,
    [UnifiedRuleType.COMPANY]: 80,
    [UnifiedRuleType.KEYWORD]: 70,
    [UnifiedRuleType.SCHOOL]: 60,
    [UnifiedRuleType.EDUCATION]: 50,
    [UnifiedRuleType.GENERIC]: 40,
  }
};

/**
 * 统一规则引擎
 * 整合不同类型的规则引擎，提供统一的评估接口
 */
export class UnifiedRulesEngine {
  private adapter: RulesAdapter;
  private config: UnifiedEngineConfig;

  /**
   * 构造函数
   * @param config 引擎配置
   */
  constructor(config?: Partial<UnifiedEngineConfig>) {
    this.adapter = new RulesAdapter();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 评估候选人是否符合规则
   * @param candidate 候选人数据
   * @param rules 评估规则
   * @returns 评估结果
   */
  public evaluateCandidate(candidate: CandidateData, rules: UnifiedRuleGroup): UnifiedEvaluationResult {
    // 标准化规则组
    const normalizedRules = this.adapter.normalizeUnifiedRules(rules);

    // 初始化评估结果
    const result: UnifiedEvaluationResult = {
      candidateId: candidate.id,
      candidateName: candidate.name,
      overallScore: 0,
      passed: false,
      details: [],
      byType: this.initializeByTypeScores(),
      timestamp: Date.now(),
      action: 'manual',
      hardRuleViolations: [],
    };

    // 首先检查硬规则
    if (this.config.enableHardRules) {
      const hardRuleViolations = this.evaluateHardRules(candidate, normalizedRules);
      
      if (hardRuleViolations.length > 0) {
        result.hardRuleViolations = hardRuleViolations;
        result.passed = false;
        result.action = 'skip';
        result.overallScore = 0;
        return result;
      }
    }

    // 评估一般规则
    const evaluationResults = this.evaluateRules(candidate, normalizedRules);
    result.details = evaluationResults;

    // 计算各类型规则得分
    this.calculateTypeScores(result, evaluationResults);

    // 计算总分
    result.overallScore = this.calculateOverallScore(evaluationResults);

    // 确定是否通过筛选
    result.passed = result.overallScore >= this.config.autoGreetThreshold;

    // 设置建议操作
    result.action = this.determineAction(result.passed);

    return result;
  }

  /**
   * 初始化按类型得分记录
   * @returns 初始化的得分记录
   */
  private initializeByTypeScores(): Record<UnifiedRuleType, number> {
    return {
      [UnifiedRuleType.POSITION]: 0,
      [UnifiedRuleType.COMPANY]: 0,
      [UnifiedRuleType.KEYWORD]: 0,
      [UnifiedRuleType.SCHOOL]: 0,
      [UnifiedRuleType.EDUCATION]: 0,
      [UnifiedRuleType.GENERIC]: 0,
    };
  }

  /**
   * 评估硬性规则
   * @param candidate 候选人数据
   * @param rules 规则组
   * @returns 违反的硬性规则列表
   */
  private evaluateHardRules(candidate: CandidateData, rules: UnifiedRuleGroup): RuleEvaluationDetail[] {
    const violations: RuleEvaluationDetail[] = [];
    
    // 递归评估规则
    const evaluateHardRulesRecursive = (rules: (UnifiedRule | UnifiedRuleGroup)[]) => {
      for (const rule of rules) {
        if ('rules' in rule && rule.type === 'group') {
          // 规则组，递归评估
          evaluateHardRulesRecursive(rule.rules);
        } else if ((rule as UnifiedRule).isHardRule && (rule as UnifiedRule).enabled) {
          // 硬性规则，评估是否满足
          const ruleResult = this.evaluateRule(candidate, rule as UnifiedRule);
          if (!ruleResult.matched) {
            violations.push(ruleResult);
          }
        }
      }
    };

    evaluateHardRulesRecursive(rules.rules);
    return violations;
  }

  /**
   * 评估规则组
   * @param candidate 候选人数据
   * @param rules 规则组
   * @returns 规则评估结果列表
   */
  private evaluateRules(candidate: CandidateData, rules: UnifiedRuleGroup): RuleEvaluationDetail[] {
    const results: RuleEvaluationDetail[] = [];
    
    // 递归评估规则
    const evaluateRulesRecursive = (rules: (UnifiedRule | UnifiedRuleGroup)[]) => {
      for (const rule of rules) {
        if ('rules' in rule && rule.type === 'group') {
          // 规则组，递归评估
          evaluateRulesRecursive(rule.rules);
        } else if ((rule as UnifiedRule).enabled) {
          // 规则，评估并记录结果
          const ruleResult = this.evaluateRule(candidate, rule as UnifiedRule);
          results.push(ruleResult);
        }
      }
    };

    evaluateRulesRecursive(rules.rules);
    return results;
  }

  /**
   * 评估单条规则
   * @param candidate 候选人数据
   * @param rule 规则
   * @returns 规则评估结果
   */
  private evaluateRule(candidate: CandidateData, rule: UnifiedRule): RuleEvaluationDetail {
    // 获取候选人对应字段的值
    const candidateValue = this.getFieldValue(candidate, rule.field);
    
    // 计算匹配度
    const matched = this.matchValue(candidateValue, rule.value, rule.operator);
    
    // 计算得分
    const score = matched ? 100 : 0;
    
    // 生成解释
    const explanation = this.generateExplanation(rule, candidateValue, matched);
    
    // 构建评估结果
    return {
      ruleId: rule.id,
      ruleName: rule.field,
      type: rule.type,
      matched,
      score,
      weight: rule.weight,
      field: rule.field,
      value: rule.value,
      candidateValue,
      explanation: this.config.explanation ? explanation : undefined,
    };
  }

  /**
   * 获取候选人字段值
   * @param candidate 候选人数据
   * @param fieldPath 字段路径
   * @returns 字段值
   */
  private getFieldValue(candidate: CandidateData, fieldPath: string): any {
    // 支持嵌套字段路径，如 "experience.years"
    const parts = fieldPath.split('.');
    let value: any = candidate;

    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * 匹配值
   * @param candidateValue 候选人字段值
   * @param ruleValue 规则值
   * @param operator 操作符
   * @returns 是否匹配
   */
  private matchValue(candidateValue: any, ruleValue: string | string[], operator: string): boolean {
    // 处理候选人值为数组的情况
    if (Array.isArray(candidateValue)) {
      // 对于数组，任何一个元素匹配就返回true
      return candidateValue.some(val => this.matchSingleValue(val, ruleValue, operator));
    }

    // 处理普通值
    return this.matchSingleValue(candidateValue, ruleValue, operator);
  }

  /**
   * 匹配单个值
   * @param candidateValue 候选人单个值
   * @param ruleValue 规则值
   * @param operator 操作符
   * @returns 是否匹配
   */
  private matchSingleValue(candidateValue: any, ruleValue: string | string[], operator: string): boolean {
    // 处理null或undefined
    if (candidateValue === null || candidateValue === undefined) {
      return operator === 'notExists';
    }

    // 处理规则值为数组的情况
    if (Array.isArray(ruleValue)) {
      // 转换为字符串进行比较
      const candidateStr = String(candidateValue).toLowerCase();
      const ruleValues = ruleValue.map(val => String(val).toLowerCase());

      switch (operator) {
        case 'equals':
          return ruleValues.includes(candidateStr);
        case 'notEquals':
          return !ruleValues.includes(candidateStr);
        case 'contains':
          return ruleValues.some(val => candidateStr.includes(val));
        case 'notContains':
          return !ruleValues.some(val => candidateStr.includes(val));
        default:
          // 其他操作符不支持数组规则值
          return false;
      }
    }

    // 转换为字符串进行比较
    const candidateStr = String(candidateValue).toLowerCase();
    const ruleStr = String(ruleValue).toLowerCase();

    switch (operator) {
      case 'equals':
        return candidateStr === ruleStr;
      case 'notEquals':
        return candidateStr !== ruleStr;
      case 'contains':
        return candidateStr.includes(ruleStr);
      case 'notContains':
        return !candidateStr.includes(ruleStr);
      case 'startsWith':
        return candidateStr.startsWith(ruleStr);
      case 'endsWith':
        return candidateStr.endsWith(ruleStr);
      case 'greaterThan':
        return parseFloat(candidateStr) > parseFloat(ruleStr);
      case 'lessThan':
        return parseFloat(candidateStr) < parseFloat(ruleStr);
      case 'regex':
        try {
          const regex = new RegExp(ruleStr, 'i');
          return regex.test(candidateStr);
        } catch (e) {
          console.error(`Invalid regex: ${ruleStr}`, e);
          return false;
        }
      case 'exists':
        return true;
      case 'notExists':
        return false;
      default:
        return false;
    }
  }

  /**
   * 生成规则评估解释
   * @param rule 规则
   * @param candidateValue 候选人值
   * @param matched 是否匹配
   * @returns 解释文本
   */
  private generateExplanation(rule: UnifiedRule, candidateValue: any, matched: boolean): string {
    const fieldName = rule.field;
    const operator = this.getOperatorText(rule.operator);
    const ruleValue = Array.isArray(rule.value) ? rule.value.join(', ') : rule.value;
    const candidateValueText = this.formatValueForDisplay(candidateValue);

    if (matched) {
      return `候选人的${fieldName}(${candidateValueText})${operator}${ruleValue}，满足条件。`;
    } else {
      return `候选人的${fieldName}(${candidateValueText})不${operator}${ruleValue}，不满足条件。`;
    }
  }

  /**
   * 获取操作符文本描述
   * @param operator 操作符
   * @returns 文本描述
   */
  private getOperatorText(operator: string): string {
    switch (operator) {
      case 'equals': return '等于';
      case 'notEquals': return '不等于';
      case 'contains': return '包含';
      case 'notContains': return '不包含';
      case 'startsWith': return '以...开头';
      case 'endsWith': return '以...结尾';
      case 'greaterThan': return '大于';
      case 'lessThan': return '小于';
      case 'regex': return '匹配正则';
      case 'exists': return '存在';
      case 'notExists': return '不存在';
      default: return operator;
    }
  }

  /**
   * 格式化值用于显示
   * @param value 待格式化的值
   * @returns 格式化后的文本
   */
  private formatValueForDisplay(value: any): string {
    if (value === undefined || value === null) {
      return '无';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return String(value);
  }

  /**
   * 计算各类型规则得分
   * @param result 评估结果
   * @param evaluationResults 规则评估详情列表
   */
  private calculateTypeScores(result: UnifiedEvaluationResult, evaluationResults: RuleEvaluationDetail[]): void {
    // 按类型分组规则
    const rulesByType: Record<UnifiedRuleType, RuleEvaluationDetail[]> = {
      [UnifiedRuleType.POSITION]: [],
      [UnifiedRuleType.COMPANY]: [],
      [UnifiedRuleType.KEYWORD]: [],
      [UnifiedRuleType.SCHOOL]: [],
      [UnifiedRuleType.EDUCATION]: [],
      [UnifiedRuleType.GENERIC]: [],
    };

    // 分组
    for (const detail of evaluationResults) {
      rulesByType[detail.type].push(detail);
    }

    // 计算每个类型的得分
    for (const type of Object.keys(rulesByType) as UnifiedRuleType[]) {
      const rules = rulesByType[type];
      if (rules.length === 0) {
        result.byType[type] = 0;
        continue;
      }

      // 计算总分和总权重
      let totalScore = 0;
      let totalWeight = 0;

      for (const rule of rules) {
        totalScore += rule.score * rule.weight;
        totalWeight += rule.weight;
      }

      // 计算加权平均分
      result.byType[type] = totalWeight > 0 ? totalScore / totalWeight : 0;
    }
  }

  /**
   * 计算总体得分
   * @param evaluationResults 规则评估详情列表
   * @returns 总体得分
   */
  private calculateOverallScore(evaluationResults: RuleEvaluationDetail[]): number {
    if (evaluationResults.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let totalWeight = 0;

    for (const result of evaluationResults) {
      totalScore += result.score * result.weight;
      totalWeight += result.weight;
    }

    return totalWeight > 0 ? (totalScore / totalWeight) : 0;
  }

  /**
   * 确定建议操作
   * @param passed 是否通过筛选
   * @returns 建议操作
   */
  private determineAction(passed: boolean): 'greet' | 'skip' | 'manual' {
    if (this.config.mode === 'auto') {
      return passed ? 'greet' : 'skip';
    }
    return 'manual';
  }

  /**
   * 设置引擎配置
   * @param config 新配置
   */
  public setConfig(config: Partial<UnifiedEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前引擎配置
   * @returns 当前配置
   */
  public getConfig(): UnifiedEngineConfig {
    return { ...this.config };
  }
} 