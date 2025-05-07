/**
 * 规则生成器实现
 */
import { v4 as uuidv4 } from 'uuid';
import {
  Condition,
  ConditionOperator,
  LogicalOperator,
  RuleGroup
} from './types';

/**
 * 规则生成器
 * 用于构建规则和条件
 */
export class RulesBuilder {
  /**
   * 创建一个条件
   * @param field 字段路径
   * @param operator 操作符
   * @param value 比较值
   * @returns 条件对象
   */
  createCondition(
    field: string,
    operator: ConditionOperator | string,
    value: string = ''
  ): Condition {
    return {
      id: uuidv4(),
      field,
      operator: operator as ConditionOperator,
      value,
      enabled: true
    };
  }
  
  /**
   * 创建一个规则组
   * @param operator 逻辑操作符
   * @param conditions 初始条件列表
   * @returns 规则组对象
   */
  createGroup(
    operator: LogicalOperator | string = LogicalOperator.AND,
    conditions: (Condition | RuleGroup)[] = []
  ): RuleGroup {
    return {
      id: uuidv4(),
      operator: operator as LogicalOperator,
      conditions,
      enabled: true
    };
  }
  
  /**
   * 添加条件到规则组
   * @param group 目标规则组
   * @param condition 要添加的条件
   * @returns 更新后的规则组
   */
  addCondition(group: RuleGroup, condition: Condition): RuleGroup {
    return {
      ...group,
      conditions: [...group.conditions, condition]
    };
  }
  
  /**
   * 添加子规则组到规则组
   * @param parentGroup 父规则组
   * @param childGroup 子规则组
   * @returns 更新后的父规则组
   */
  addGroup(parentGroup: RuleGroup, childGroup: RuleGroup): RuleGroup {
    return {
      ...parentGroup,
      conditions: [...parentGroup.conditions, childGroup]
    };
  }
  
  /**
   * 查找规则组中的特定规则或条件
   * @param group 规则组
   * @param id 目标ID
   * @returns 找到的条件、规则组或null
   */
  findById(group: RuleGroup, id: string): Condition | RuleGroup | null {
    if (group.id === id) {
      return group;
    }
    
    for (const item of group.conditions) {
      if (item.id === id) {
        return item;
      }
      
      if ('conditions' in item) {
        const found = this.findById(item, id);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  }
  
  /**
   * 更新规则组中的规则或条件
   * @param group 规则组
   * @param id 目标ID
   * @param updates 更新内容
   * @returns 更新后的规则组
   */
  updateRule(group: RuleGroup, id: string, updates: Partial<Condition | RuleGroup>): RuleGroup {
    if (group.id === id) {
      return {
        ...group,
        ...updates,
        operator: updates.operator as LogicalOperator || group.operator
      } as RuleGroup;
    }
    
    return {
      ...group,
      conditions: group.conditions.map(item => {
        if (item.id === id) {
          if ('conditions' in item) {
            // 更新规则组
            return {
              ...item,
              ...updates,
              operator: updates.operator as LogicalOperator || item.operator
            } as RuleGroup;
          } else {
            // 更新条件
            return {
              ...item,
              ...updates,
              operator: updates.operator as ConditionOperator || item.operator
            } as Condition;
          }
        }
        
        if ('conditions' in item) {
          return this.updateRule(item, id, updates);
        }
        
        return item;
      })
    };
  }
  
  /**
   * 删除规则组中的规则或条件
   * @param group 规则组
   * @param id 目标ID
   * @returns 更新后的规则组
   */
  deleteRule(group: RuleGroup, id: string): RuleGroup {
    if (group.id === id) {
      // 不能删除根节点
      return group;
    }
    
    return {
      ...group,
      conditions: group.conditions
        .filter(item => item.id !== id)
        .map(item => {
          if ('conditions' in item) {
            return this.deleteRule(item, id);
          }
          return item;
        })
    };
  }
  
  /**
   * 切换规则或条件的启用状态
   * @param group 规则组
   * @param id 目标ID
   * @param enabled 是否启用
   * @returns 更新后的规则组
   */
  toggleEnabled(group: RuleGroup, id: string, enabled?: boolean): RuleGroup {
    const target = this.findById(group, id);
    if (!target) {
      return group;
    }
    
    const newEnabled = enabled !== undefined ? enabled : !target.enabled;
    
    return this.updateRule(group, id, { enabled: newEnabled });
  }
  
  /**
   * 序列化规则组为JSON字符串
   * @param group 规则组
   * @returns JSON字符串
   */
  serialize(group: RuleGroup): string {
    return JSON.stringify(group);
  }
  
  /**
   * 从JSON字符串反序列化规则组
   * @param json JSON字符串
   * @returns 规则组对象
   */
  deserialize(json: string): RuleGroup {
    try {
      return JSON.parse(json);
    } catch (e) {
      console.error('Failed to deserialize rules:', e);
      return this.createGroup();
    }
  }
} 