/**
 * 简化规则适配器
 * 用于在简化规则引擎和统一规则引擎之间转换
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  SimpleRule, 
  SimpleRuleType, 
  ImportanceLevel, 
  SimpleRulesConfig 
} from './simple-rules-engine';
import {
  UnifiedRule,
  UnifiedRuleGroup,
  UnifiedRuleType,
  ConditionOperator,
  LogicalOperator,
  RuleGroup,
  Condition
} from './types';

/**
 * 简化规则适配器
 */
export class SimpleRulesAdapter {
  /**
   * 将统一规则转换为简化规则配置
   * @param unifiedRules 统一规则格式
   * @returns 简化规则配置
   */
  public convertToSimpleRules(unifiedRules: UnifiedRuleGroup): SimpleRulesConfig {
    const simpleRules: SimpleRule[] = [];
    
    // 递归处理规则组
    const processRuleGroup = (group: UnifiedRuleGroup) => {
      for (const item of group.rules) {
        if ('rules' in item && item.type === 'group') {
          // 是规则组，递归处理
          processRuleGroup(item);
        } else {
          // 是规则，转换为简化规则
          const unifiedRule = item as UnifiedRule;
          const simpleRule = this.convertUnifiedRuleToSimple(unifiedRule);
          if (simpleRule) {
            simpleRules.push(simpleRule);
          }
        }
      }
    };
    
    processRuleGroup(unifiedRules);
    
    // 创建简化规则配置
    return {
      rules: simpleRules,
      passScore: 60, // 默认通过分数
      autoMode: false // 默认手动模式
    };
  }
  
  /**
   * 将简化规则配置转换为统一规则
   * @param simpleConfig 简化规则配置
   * @returns 统一规则格式
   */
  public convertToUnifiedRules(simpleConfig: SimpleRulesConfig): UnifiedRuleGroup {
    // 创建根规则组
    const rootGroup: UnifiedRuleGroup = {
      id: 'root',
      operator: LogicalOperator.AND,
      rules: [],
      enabled: true,
      type: 'group'
    };
    
    // 转换所有简化规则
    for (const simpleRule of simpleConfig.rules) {
      const unifiedRule = this.convertSimpleRuleToUnified(simpleRule);
      rootGroup.rules.push(unifiedRule);
    }
    
    return rootGroup;
  }
  
  /**
   * 将单个统一规则转换为简化规则
   * @param unifiedRule 统一规则
   * @returns 简化规则或null（如果无法转换）
   */
  private convertUnifiedRuleToSimple(unifiedRule: UnifiedRule): SimpleRule | null {
    // 确定简化规则类型
    const simpleRuleType = this.mapUnifiedTypeToSimpleType(unifiedRule.type);
    if (!simpleRuleType) return null;
    
    // 提取关键词
    let keywords: string[] = [];
    if (Array.isArray(unifiedRule.value)) {
      keywords = unifiedRule.value;
    } else if (typeof unifiedRule.value === 'string') {
      keywords = unifiedRule.value.split(',').map(k => k.trim()).filter(Boolean);
    }
    
    // 创建简化规则
    return {
      id: unifiedRule.id || uuidv4(),
      type: simpleRuleType,
      keywords,
      importance: this.mapWeightToImportance(unifiedRule.weight),
      mustMatch: unifiedRule.isHardRule || false,
      enabled: unifiedRule.enabled
    };
  }
  
  /**
   * 将单个简化规则转换为统一规则
   * @param simpleRule 简化规则
   * @returns 统一规则
   */
  private convertSimpleRuleToUnified(simpleRule: SimpleRule): UnifiedRule {
    // 确定统一规则类型
    const unifiedRuleType = this.mapSimpleTypeToUnifiedType(simpleRule.type);
    
    // 确定字段名
    const fieldName = this.getFieldNameForType(simpleRule.type);
    
    // 创建统一规则
    return {
      id: simpleRule.id,
      type: unifiedRuleType,
      field: fieldName,
      operator: ConditionOperator.CONTAINS, // 使用包含操作符
      value: simpleRule.keywords,
      weight: simpleRule.importance,
      enabled: simpleRule.enabled,
      isHardRule: simpleRule.mustMatch,
      order: 0 // 默认顺序
    };
  }
  
  /**
   * 将统一规则类型映射到简化规则类型
   * @param unifiedType 统一规则类型
   * @returns 简化规则类型或null（如果不支持）
   */
  private mapUnifiedTypeToSimpleType(unifiedType: UnifiedRuleType): SimpleRuleType | null {
    switch (unifiedType) {
      case UnifiedRuleType.POSITION:
        return SimpleRuleType.岗位;
      case UnifiedRuleType.COMPANY:
        return SimpleRuleType.公司;
      case UnifiedRuleType.KEYWORD:
        return SimpleRuleType.技能;
      case UnifiedRuleType.SCHOOL:
        return SimpleRuleType.学校;
      case UnifiedRuleType.EDUCATION:
        return SimpleRuleType.学历;
      default:
        return null;
    }
  }
  
  /**
   * 将简化规则类型映射到统一规则类型
   * @param simpleType 简化规则类型
   * @returns 统一规则类型
   */
  private mapSimpleTypeToUnifiedType(simpleType: SimpleRuleType): UnifiedRuleType {
    switch (simpleType) {
      case SimpleRuleType.岗位:
        return UnifiedRuleType.POSITION;
      case SimpleRuleType.公司:
        return UnifiedRuleType.COMPANY;
      case SimpleRuleType.技能:
        return UnifiedRuleType.KEYWORD;
      case SimpleRuleType.学校:
        return UnifiedRuleType.SCHOOL;
      case SimpleRuleType.学历:
        return UnifiedRuleType.EDUCATION;
      default:
        return UnifiedRuleType.GENERIC;
    }
  }
  
  /**
   * 根据规则类型获取对应的字段名
   * @param simpleType 简化规则类型
   * @returns 字段名
   */
  private getFieldNameForType(simpleType: SimpleRuleType): string {
    switch (simpleType) {
      case SimpleRuleType.岗位:
        return 'position';
      case SimpleRuleType.公司:
        return 'company';
      case SimpleRuleType.技能:
        return 'skills';
      case SimpleRuleType.学校:
        return 'schools';
      case SimpleRuleType.学历:
        return 'education';
      default:
        return '';
    }
  }
  
  /**
   * 将权重映射到重要性级别
   * @param weight 权重值(0-100)
   * @returns 重要性级别
   */
  private mapWeightToImportance(weight: number): ImportanceLevel {
    if (weight <= 25) return ImportanceLevel.不重要;
    if (weight <= 50) return ImportanceLevel.一般;
    if (weight <= 75) return ImportanceLevel.重要;
    return ImportanceLevel.非常重要;
  }
  
  /**
   * 将简化规则转换为旧版逻辑条件规则
   * @param simpleConfig 简化规则配置
   * @returns 逻辑条件规则组
   */
  public convertToLogicRules(simpleConfig: SimpleRulesConfig): RuleGroup {
    // 创建根规则组
    const rootGroup: RuleGroup = {
      id: 'root',
      operator: LogicalOperator.AND,
      conditions: [],
      enabled: true
    };
    
    // 转换所有简化规则
    for (const simpleRule of simpleConfig.rules) {
      if (!simpleRule.enabled) continue;
      
      // 获取字段名
      const fieldName = this.getFieldNameForType(simpleRule.type);
      
      // 如果有多个关键词，创建一个OR子组
      if (simpleRule.keywords.length > 1) {
        const subGroup: RuleGroup = {
          id: `group_${simpleRule.id}`,
          operator: LogicalOperator.OR,
          conditions: [],
          enabled: true
        };
        
        // 为每个关键词创建一个条件
        for (const keyword of simpleRule.keywords) {
          const condition: Condition = {
            id: uuidv4(),
            field: fieldName,
            operator: ConditionOperator.CONTAINS,
            value: keyword,
            enabled: true
          };
          
          subGroup.conditions.push(condition);
        }
        
        rootGroup.conditions.push(subGroup);
      } 
      // 单个关键词，直接添加条件
      else if (simpleRule.keywords.length === 1) {
        const condition: Condition = {
          id: uuidv4(),
          field: fieldName,
          operator: ConditionOperator.CONTAINS,
          value: simpleRule.keywords[0],
          enabled: true
        };
        
        rootGroup.conditions.push(condition);
      }
    }
    
    return rootGroup;
  }
} 