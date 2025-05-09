/**
 * 规则引擎适配器
 * 用于在不同规则引擎格式之间进行转换
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Condition,
  ConditionOperator,
  LogicalOperator,
  RuleGroup,
  UnifiedRule,
  UnifiedRuleGroup,
  UnifiedRuleType,
} from './types';

/**
 * 规则引擎适配器
 * 负责在统一规则格式和特定引擎格式之间进行转换
 */
export class RulesAdapter {
  /**
   * 将统一规则格式转换为逻辑条件规则引擎格式
   * @param unifiedRules 统一规则格式
   * @returns 逻辑条件规则引擎格式
   */
  public convertToLogicRules(unifiedRules: UnifiedRuleGroup): RuleGroup {
    const ruleGroup: RuleGroup = {
      id: unifiedRules.id || uuidv4(),
      operator: unifiedRules.operator,
      conditions: [],
      enabled: unifiedRules.enabled,
    };

    // 递归转换规则和规则组
    for (const item of unifiedRules.rules) {
      if ('rules' in item && item.type === 'group') {
        // 是规则组
        ruleGroup.conditions.push(this.convertToLogicRules(item));
      } else {
        // 是规则
        const rule = item as UnifiedRule;
        const condition: Condition = {
          id: rule.id,
          field: rule.field,
          operator: rule.operator,
          value: Array.isArray(rule.value) ? rule.value.join(',') : rule.value,
          enabled: rule.enabled,
        };
        ruleGroup.conditions.push(condition);
      }
    }

    return ruleGroup;
  }

  /**
   * 将逻辑条件规则引擎格式转换为统一规则格式
   * @param logicRules 逻辑条件规则引擎格式
   * @returns 统一规则格式
   */
  public convertFromLogicRules(logicRules: RuleGroup): UnifiedRuleGroup {
    const unifiedRuleGroup: UnifiedRuleGroup = {
      id: logicRules.id || uuidv4(),
      operator: logicRules.operator,
      rules: [],
      enabled: logicRules.enabled,
      type: 'group',
    };

    // 递归转换条件和条件组
    for (const item of logicRules.conditions) {
      if ('conditions' in item) {
        // 是条件组
        unifiedRuleGroup.rules.push(this.convertFromLogicRules(item as RuleGroup));
      } else {
        // 是条件
        const condition = item as Condition;
        const unifiedRule: UnifiedRule = {
          id: condition.id,
          type: UnifiedRuleType.GENERIC, // 默认为通用规则类型
          field: condition.field,
          operator: condition.operator,
          value: condition.value,
          weight: 50, // 默认权重
          enabled: condition.enabled,
        };
        unifiedRuleGroup.rules.push(unifiedRule);
      }
    }

    return unifiedRuleGroup;
  }

  /**
   * 自动识别规则类型
   * 基于字段名和操作符推断合适的规则类型
   * @param field 字段名
   * @param operator 操作符
   * @returns 推断的规则类型
   */
  private inferRuleType(field: string, operator: ConditionOperator): UnifiedRuleType {
    // 基于字段名推断规则类型
    const fieldLower = field.toLowerCase();
    
    if (fieldLower.includes('position') || fieldLower.includes('title') || fieldLower.includes('job')) {
      return UnifiedRuleType.POSITION;
    }
    
    if (fieldLower.includes('company') || fieldLower.includes('employer')) {
      return UnifiedRuleType.COMPANY;
    }
    
    if (fieldLower.includes('skill') || fieldLower.includes('technology') || fieldLower.includes('keyword')) {
      return UnifiedRuleType.KEYWORD;
    }
    
    if (fieldLower.includes('school') || fieldLower.includes('university') || fieldLower.includes('college')) {
      return UnifiedRuleType.SCHOOL;
    }
    
    if (fieldLower.includes('education') || fieldLower.includes('degree')) {
      return UnifiedRuleType.EDUCATION;
    }

    // 默认为通用规则类型
    return UnifiedRuleType.GENERIC;
  }

  /**
   * 推断合适的默认权重
   * 基于规则类型设置默认权重
   * @param ruleType 规则类型
   * @returns 默认权重值
   */
  private getDefaultWeight(ruleType: UnifiedRuleType): number {
    switch (ruleType) {
      case UnifiedRuleType.POSITION:
        return 100; // 岗位是硬性条件，权重最高
      case UnifiedRuleType.COMPANY:
        return 80;  // 公司背景很重要
      case UnifiedRuleType.KEYWORD:
        return 70;  // 技能关键词
      case UnifiedRuleType.SCHOOL:
        return 60;  // 学校背景
      case UnifiedRuleType.EDUCATION:
        return 50;  // 学历要求
      case UnifiedRuleType.GENERIC:
      default:
        return 40;  // 通用规则
    }
  }

  /**
   * 判断是否为硬性规则
   * 目前只有岗位规则被视为硬性条件
   * @param ruleType 规则类型
   * @returns 是否为硬性规则
   */
  private isHardRule(ruleType: UnifiedRuleType): boolean {
    return ruleType === UnifiedRuleType.POSITION;
  }

  /**
   * 规则批量处理
   * 给定一组统一规则，应用特定处理函数
   * @param rules 待处理的规则或规则组
   * @param processor 处理函数
   * @returns 处理后的规则或规则组
   */
  public processRules<T extends UnifiedRule | UnifiedRuleGroup>(
    rules: T[],
    processor: (rule: UnifiedRule) => void
  ): T[] {
    return rules.map(item => {
      if ('rules' in item && item.type === 'group') {
        // 是规则组，递归处理
        const group = { ...item } as UnifiedRuleGroup;
        group.rules = this.processRules(group.rules, processor);
        return group as unknown as T;
      } else {
        // 是规则，直接处理
        const rule = { ...item } as UnifiedRule;
        processor(rule);
        return rule as unknown as T;
      }
    });
  }

  /**
   * 统一规则格式标准化
   * 补充缺失字段，统一格式
   * @param ruleGroup 待标准化的规则组
   * @returns 标准化后的规则组
   */
  public normalizeUnifiedRules(ruleGroup: UnifiedRuleGroup): UnifiedRuleGroup {
    // 确保规则组有ID
    if (!ruleGroup.id) {
      ruleGroup.id = uuidv4();
    }

    // 确保规则组有类型标记
    ruleGroup.type = 'group';

    // 处理规则组中的所有规则
    ruleGroup.rules = this.processRules(ruleGroup.rules, (rule) => {
      // 确保规则有ID
      if (!rule.id) {
        rule.id = uuidv4();
      }

      // 如果没有指定规则类型，推断它
      if (!rule.type) {
        rule.type = this.inferRuleType(rule.field, rule.operator);
      }

      // 如果没有指定权重，设置默认权重
      if (rule.weight === undefined) {
        rule.weight = this.getDefaultWeight(rule.type);
      }

      // 设置硬规则标志
      if (rule.isHardRule === undefined) {
        rule.isHardRule = this.isHardRule(rule.type);
      }
    });

    return ruleGroup;
  }
} 