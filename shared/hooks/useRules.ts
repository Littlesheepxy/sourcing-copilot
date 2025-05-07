/**
 * 规则相关钩子
 */
import { v4 as uuidv4 } from 'uuid';
import { StorageAdapter } from '../../packages/store-factory/types';
import { createPersistentStore } from '../../packages/store-factory/createStore';
import {
  Condition,
  ConditionOperator,
  LogicalOperator,
  RuleGroup
} from '../core/rules-engine/types';
import { RulesEvaluator } from '../core/rules-engine/evaluator';

/**
 * 规则状态
 */
interface RulesState {
  // 规则组
  rules: RuleGroup;
  // 最近评估结果
  lastEvaluation: {
    matched: boolean;
    matchedConditions: string[];
    unmatchedConditions: string[];
  } | null;
  // 是否正在评估
  evaluating: boolean;
  
  // 创建条件
  createCondition: (
    parentId: string,
    field: string,
    operator: ConditionOperator,
    value: string
  ) => void;
  
  // 创建规则组
  createGroup: (
    parentId: string,
    operator?: LogicalOperator
  ) => void;
  
  // 更新规则或条件
  updateRule: (
    id: string,
    updates: Partial<RuleGroup | Condition>
  ) => void;
  
  // 删除规则或条件
  deleteRule: (id: string) => void;
  
  // 切换规则或条件的启用状态
  toggleEnabled: (id: string) => void;
  
  // 评估简历
  evaluateResume: (resumeData: any) => Promise<boolean>;
  
  // 重置所有规则
  resetRules: () => void;
  
  // 初始化方法
  initialize: () => Promise<void>;
  
  // 导入规则
  importRules: (rules: RuleGroup) => void;
  
  // 导出规则
  exportRules: () => RuleGroup;
  
  // 同步规则（在web和扩展之间）
  syncRules: () => Promise<void>;
  
  // 从平台同步规则
  syncRulesFromPlatform: () => Promise<void>;
}

/**
 * 检测环境是否为浏览器扩展
 */
function isExtensionEnvironment(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.sendMessage;
}

/**
 * 创建规则存储
 * @param adapter 存储适配器
 * @returns 规则存储钩子
 */
export function createRulesStore(adapter: StorageAdapter<any>) {
  // 创建规则评估器
  const evaluator = new RulesEvaluator();
  
  // 创建规则存储
  return createPersistentStore<RulesState>(
    (set, get) => ({
      rules: createDefaultRuleGroup(),
      lastEvaluation: null,
      evaluating: false,
      
      // 创建条件
      createCondition: (parentId, field, operator, value) => {
        const rules = get().rules;
        const condition: Condition = {
          id: uuidv4(),
          field,
          operator,
          value,
          enabled: true
        };
        
        set({ rules: addConditionToRules(rules, parentId, condition) });
      },
      
      // 创建规则组
      createGroup: (parentId, operator = LogicalOperator.AND) => {
        const rules = get().rules;
        const group: RuleGroup = {
          id: uuidv4(),
          operator,
          conditions: [],
          enabled: true
        };
        
        set({ rules: addGroupToRules(rules, parentId, group) });
      },
      
      // 更新规则或条件
      updateRule: (id, updates) => {
        const rules = get().rules;
        set({ rules: updateRuleInRules(rules, id, updates) });
      },
      
      // 删除规则或条件
      deleteRule: (id) => {
        const rules = get().rules;
        set({ rules: deleteRuleFromRules(rules, id) });
      },
      
      // 切换规则或条件的启用状态
      toggleEnabled: (id) => {
        const rules = get().rules;
        const target = findRuleById(rules, id);
        
        if (target) {
          set({
            rules: updateRuleInRules(rules, id, { enabled: !target.enabled })
          });
        }
      },
      
      // 评估简历
      evaluateResume: async (resumeData) => {
        set({ evaluating: true });
        
        try {
          const rules = get().rules;
          const context = { data: resumeData };
          const result = evaluator.evaluateRules(context, rules);
          
          set({
            lastEvaluation: {
              matched: result.matched,
              matchedConditions: result.matchedConditions,
              unmatchedConditions: result.unmatchedConditions
            },
            evaluating: false
          });
          
          return result.matched;
        } catch (error) {
          console.error('评估简历失败:', error);
          set({ evaluating: false });
          return false;
        }
      },
      
      // 重置所有规则
      resetRules: () => {
        set({
          rules: createDefaultRuleGroup(),
          lastEvaluation: null
        });
      },
      
      // 导入规则
      importRules: (importedRules) => {
        set({ 
          rules: importedRules,
          lastEvaluation: null
        });
      },
      
      // 导出规则
      exportRules: () => {
        return get().rules;
      },
      
      // 同步规则（在web和扩展之间）
      syncRules: async () => {
        try {
          // 如果在扩展环境中，发送规则到web应用
          if (isExtensionEnvironment()) {
            const rules = get().rules;
            
            // 发送消息到web应用
            chrome.runtime.sendMessage({
              type: 'SYNC_RULES',
              payload: { rules }
            });
            
            console.log('规则已从扩展同步到web应用');
          } else {
            // 从本地存储获取规则，用于在不同标签页间同步
            const rulesJson = localStorage.getItem('sc_rules');
            if (rulesJson) {
              try {
                const parsedRules = JSON.parse(rulesJson);
                set({ rules: parsedRules });
                console.log('规则已从本地存储同步');
              } catch (error) {
                console.error('解析本地存储规则失败:', error);
              }
            }
          }
        } catch (error) {
          console.error('同步规则失败:', error);
        }
      },
      
      // 从平台同步规则
      syncRulesFromPlatform: async () => {
        try {
          // 这里可以添加从API同步规则的逻辑
          console.log('从平台同步规则功能尚未实现');
        } catch (error) {
          console.error('从平台同步规则失败:', error);
        }
      },
      
      // 初始化方法，由createPersistentStore添加但缺少类型定义
      initialize: async () => {}
    }),
    {
      adapter,
      keys: ['rules', 'lastEvaluation']
    }
  );
}

/**
 * 创建默认规则组
 * @returns 默认规则组
 */
function createDefaultRuleGroup(): RuleGroup {
  return {
    id: uuidv4(),
    operator: LogicalOperator.AND,
    conditions: [],
    enabled: true
  };
}

/**
 * 向规则组添加条件
 * @param rules 规则组
 * @param parentId 父级ID
 * @param condition 条件
 * @returns 更新后的规则组
 */
function addConditionToRules(rules: RuleGroup, parentId: string, condition: Condition): RuleGroup {
  if (rules.id === parentId) {
    return {
      ...rules,
      conditions: [...rules.conditions, condition]
    };
  }
  
  return {
    ...rules,
    conditions: rules.conditions.map(item => {
      if ('conditions' in item && item.id === parentId) {
        return {
          ...item,
          conditions: [...item.conditions, condition]
        };
      }
      
      if ('conditions' in item) {
        return addConditionToRules(item, parentId, condition);
      }
      
      return item;
    })
  };
}

/**
 * 向规则组添加子规则组
 * @param rules 规则组
 * @param parentId 父级ID
 * @param group 子规则组
 * @returns 更新后的规则组
 */
function addGroupToRules(rules: RuleGroup, parentId: string, group: RuleGroup): RuleGroup {
  if (rules.id === parentId) {
    return {
      ...rules,
      conditions: [...rules.conditions, group]
    };
  }
  
  return {
    ...rules,
    conditions: rules.conditions.map(item => {
      if ('conditions' in item && item.id === parentId) {
        return {
          ...item,
          conditions: [...item.conditions, group]
        };
      }
      
      if ('conditions' in item) {
        return addGroupToRules(item, parentId, group);
      }
      
      return item;
    })
  };
}

/**
 * 在规则组中更新规则或条件
 * @param rules 规则组
 * @param id 目标ID
 * @param updates 更新内容
 * @returns 更新后的规则组
 */
function updateRuleInRules(
  rules: RuleGroup,
  id: string,
  updates: Partial<RuleGroup | Condition>
): RuleGroup {
  if (rules.id === id) {
    return {
      ...rules,
      ...updates,
      operator: updates.operator as LogicalOperator || rules.operator
    } as RuleGroup;
  }
  
  return {
    ...rules,
    conditions: rules.conditions.map(item => {
      if (item.id === id) {
        if ('conditions' in item) {
          return {
            ...item,
            ...updates,
            operator: updates.operator as LogicalOperator || item.operator
          } as RuleGroup;
        } else {
          return {
            ...item,
            ...updates,
            operator: updates.operator as ConditionOperator || item.operator
          } as Condition;
        }
      }
      
      if ('conditions' in item) {
        return updateRuleInRules(item, id, updates);
      }
      
      return item;
    })
  };
}

/**
 * 从规则组中删除规则或条件
 * @param rules 规则组
 * @param id 目标ID
 * @returns 更新后的规则组
 */
function deleteRuleFromRules(rules: RuleGroup, id: string): RuleGroup {
  if (rules.id === id) {
    // 不能删除根节点
    return rules;
  }
  
  return {
    ...rules,
    conditions: rules.conditions
      .filter(item => item.id !== id)
      .map(item => {
        if ('conditions' in item) {
          return deleteRuleFromRules(item, id);
        }
        return item;
      })
  };
}

/**
 * 查找规则组中的特定规则或条件
 * @param rules 规则组
 * @param id 目标ID
 * @returns 找到的规则、条件或null
 */
function findRuleById(rules: RuleGroup, id: string): RuleGroup | Condition | null {
  if (rules.id === id) {
    return rules;
  }
  
  for (const item of rules.conditions) {
    if (item.id === id) {
      return item;
    }
    
    if ('conditions' in item) {
      const found = findRuleById(item, id);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
} 