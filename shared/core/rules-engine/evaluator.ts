/**
 * 规则评估器实现
 */
import { 
  Condition, 
  ConditionOperator, 
  EvaluationContext, 
  EvaluationResult, 
  LogicalOperator, 
  RuleGroup, 
  RulesEngineService 
} from './types';
import { get } from '../../utils/object';

export class RulesEvaluator implements RulesEngineService {
  /**
   * 评估规则组
   * @param context 评估上下文
   * @param rules 规则组
   * @returns 评估结果
   */
  evaluateRules(context: EvaluationContext, rules: RuleGroup): EvaluationResult {
    if (!rules.enabled) {
      return { matched: false, matchedConditions: [], unmatchedConditions: [] };
    }
    
    const matchedConditions: string[] = [];
    const unmatchedConditions: string[] = [];
    
    // 如果没有条件，默认为true
    if (!rules.conditions || rules.conditions.length === 0) {
      return { matched: true, matchedConditions, unmatchedConditions };
    }
    
    const results = rules.conditions.map(condition => {
      const matched = this.evaluateCondition(context, condition);
      
      if (matched) {
        if ('field' in condition) {
          matchedConditions.push(condition.id);
        }
      } else {
        if ('field' in condition) {
          unmatchedConditions.push(condition.id);
        }
      }
      
      return matched;
    });
    
    // 根据逻辑运算符计算最终结果
    const matched = rules.operator === LogicalOperator.AND
      ? results.every(Boolean)
      : results.some(Boolean);
    
    return { matched, matchedConditions, unmatchedConditions };
  }
  
  /**
   * 评估单个条件或规则组
   * @param context 评估上下文
   * @param condition 条件或规则组
   * @returns 是否匹配
   */
  evaluateCondition(context: EvaluationContext, condition: Condition | RuleGroup): boolean {
    // 如果条件已禁用，则返回false
    if (!condition.enabled) {
      return false;
    }
    
    // 如果是规则组，递归评估
    if ('conditions' in condition) {
      return this.evaluateRules(context, condition).matched;
    }
    
    // 根据字段路径获取值
    const fieldValue = get(context.data, condition.field);
    
    return this.evaluateSingleCondition(fieldValue, condition);
  }
  
  /**
   * 评估单个条件
   * @param fieldValue 字段值
   * @param condition 条件
   * @returns 是否匹配
   */
  private evaluateSingleCondition(fieldValue: any, condition: Condition): boolean {
    const { operator, value } = condition;
    
    // 处理字段不存在的情况
    if (fieldValue === undefined || fieldValue === null) {
      return operator === ConditionOperator.NOT_EXISTS;
    }
    
    // 存在性检查
    if (operator === ConditionOperator.EXISTS) {
      return true;
    }
    
    // 将字段值转换为字符串进行比较
    const stringFieldValue = String(fieldValue).toLowerCase();
    const stringConditionValue = value.toLowerCase();
    
    switch (operator) {
      case ConditionOperator.EQUALS:
        return stringFieldValue === stringConditionValue;
      
      case ConditionOperator.NOT_EQUALS:
        return stringFieldValue !== stringConditionValue;
      
      case ConditionOperator.CONTAINS:
        return stringFieldValue.includes(stringConditionValue);
      
      case ConditionOperator.NOT_CONTAINS:
        return !stringFieldValue.includes(stringConditionValue);
      
      case ConditionOperator.STARTS_WITH:
        return stringFieldValue.startsWith(stringConditionValue);
      
      case ConditionOperator.ENDS_WITH:
        return stringFieldValue.endsWith(stringConditionValue);
      
      case ConditionOperator.GREATER_THAN:
        return Number(fieldValue) > Number(value);
      
      case ConditionOperator.LESS_THAN:
        return Number(fieldValue) < Number(value);
      
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return Number(fieldValue) >= Number(value);
      
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return Number(fieldValue) <= Number(value);
      
      case ConditionOperator.REGEX:
        try {
          const regex = new RegExp(value);
          return regex.test(String(fieldValue));
        } catch (e) {
          console.error('Invalid regex pattern:', value, e);
          return false;
        }
      
      default:
        return false;
    }
  }
} 