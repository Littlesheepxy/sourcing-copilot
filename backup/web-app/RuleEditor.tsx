"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 临时声明Chrome类型，解决TypeScript错误
declare const chrome: {
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => void;
  }
};

// 规则条件类型
interface Condition {
  id: string;
  field: string; // 字段名
  operator: string; // 操作符
  value: string; // 值
}

// 规则组类型
interface RuleGroup {
  id: string;
  operator: 'AND' | 'OR'; // 组合操作符
  conditions: (Condition | RuleGroup)[]; // 条件或规则组
}

// 可用字段选项
const fieldOptions = [
  { value: 'education', label: '学历' },
  { value: 'school', label: '学校' },
  { value: 'company', label: '公司' },
  { value: 'position', label: '岗位' },
  { value: 'experience', label: '经验年限' },
  { value: 'skills', label: '技能标签' },
];

// 操作符选项
const operatorOptions = [
  { value: 'contains', label: '包含' },
  { value: 'equals', label: '等于' },
  { value: 'startsWith', label: '开头是' },
  { value: 'endsWith', label: '结尾是' },
  { value: 'greaterThan', label: '大于' },
  { value: 'lessThan', label: '小于' },
  { value: 'regex', label: '正则匹配' },
];

// 单个条件组件
const ConditionItem = ({ 
  condition, 
  onUpdate, 
  onDelete 
}: { 
  condition: Condition, 
  onUpdate: (id: string, field: string, value: any) => void,
  onDelete: (id: string) => void
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: condition.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-2"
    >
      <div {...attributes} {...listeners} className="cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </div>
      
      <select 
        value={condition.field}
        onChange={(e) => onUpdate(condition.id, 'field', e.target.value)}
        className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      >
        {fieldOptions.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      
      <select 
        value={condition.operator}
        onChange={(e) => onUpdate(condition.id, 'operator', e.target.value)}
        className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      >
        {operatorOptions.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      
      <input 
        type="text"
        value={condition.value}
        onChange={(e) => onUpdate(condition.id, 'value', e.target.value)}
        placeholder="值"
        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      />
      
      <button 
        onClick={() => onDelete(condition.id)}
        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    </div>
  );
};

// 规则组组件
const RuleGroupItem = ({ 
  group, 
  onUpdate, 
  onDelete, 
  onAddCondition,
  onAddGroup
}: { 
  group: RuleGroup, 
  onUpdate: (id: string, field: string, value: any) => void,
  onDelete: (id: string) => void,
  onAddCondition: (parentId: string) => void,
  onAddGroup: (parentId: string) => void
}) => {
  // 处理嵌套条件更新
  const handleNestedUpdate = (id: string, field: string, value: any) => {
    // 找到并更新嵌套的条件
    const updatedConditions = group.conditions.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    
    onUpdate(group.id, 'conditions', updatedConditions);
  };
  
  // 处理嵌套条件删除
  const handleNestedDelete = (id: string) => {
    const updatedConditions = group.conditions.filter(item => item.id !== id);
    onUpdate(group.id, 'conditions', updatedConditions);
  };
  
  return (
    <div className="p-4 mb-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <select
            value={group.operator}
            onChange={(e) => onUpdate(group.id, 'operator', e.target.value)}
            className="p-1 mr-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-0 rounded font-medium"
          >
            <option value="AND">AND (并且)</option>
            <option value="OR">OR (或者)</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400">组合逻辑</span>
        </div>
        
        {group.id !== 'root' && (
          <button 
            onClick={() => onDelete(group.id)}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        )}
      </div>
      
      <div className="pl-3 border-l-2 border-blue-200 dark:border-blue-800">
        <DndContext 
          sensors={useSensors(
            useSensor(PointerSensor),
            useSensor(KeyboardSensor, {
              coordinateGetter: sortableKeyboardCoordinates,
            })
          )}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            // 这里处理拖拽排序，暂时省略
          }}
        >
          <SortableContext 
            items={group.conditions.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {group.conditions.map(item => {
              if ('operator' in item && (item.operator === 'AND' || item.operator === 'OR')) {
                return (
                  <RuleGroupItem 
                    key={item.id} 
                    group={item as RuleGroup} 
                    onUpdate={handleNestedUpdate}
                    onDelete={handleNestedDelete}
                    onAddCondition={onAddCondition}
                    onAddGroup={onAddGroup}
                  />
                );
              } else {
                return (
                  <ConditionItem 
                    key={(item as Condition).id} 
                    condition={item as Condition} 
                    onUpdate={handleNestedUpdate}
                    onDelete={handleNestedDelete}
                  />
                );
              }
            })}
          </SortableContext>
        </DndContext>
      </div>
      
      <div className="mt-3 flex space-x-2">
        <button
          onClick={() => onAddCondition(group.id)}
          className="px-3 py-1 text-sm bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 rounded"
        >
          + 添加条件
        </button>
        <button
          onClick={() => onAddGroup(group.id)}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded"
        >
          + 添加子组
        </button>
      </div>
    </div>
  );
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// 主规则编辑器组件
const RuleEditor = () => {
  const [rootGroup, setRootGroup] = useState<RuleGroup>({
    id: 'root',
    operator: 'AND',
    conditions: []
  });
  const [isClient, setIsClient] = useState(false);
  
  // 用于检测客户端渲染
  useEffect(() => {
    setIsClient(true);
    
    // 从Chrome存储加载规则
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'getRules' }, (response) => {
        if (response.rules) {
          // 将存储的规则转换为带有ID的内部格式
          const convertedRules = convertStoredRulesToInternal(response.rules);
          setRootGroup(convertedRules);
        }
      });
    }
  }, []);
  
  // 将存储格式的规则转换为内部格式（添加ID）
  const convertStoredRulesToInternal = (storedRules: any): RuleGroup => {
    const processGroup = (group: any): RuleGroup => {
      return {
        id: group.id || generateId(),
        operator: group.operator || 'AND',
        conditions: (group.conditions || []).map((item: any) => {
          if (item.operator === 'AND' || item.operator === 'OR') {
            return processGroup(item);
          } else {
            return {
              id: item.id || generateId(),
              field: item.field || 'education',
              operator: item.operator || 'contains',
              value: item.value || ''
            };
          }
        })
      };
    };
    
    return processGroup(storedRules);
  };
  
  // 将内部格式转换为存储格式（移除ID）
  const convertInternalToStoredRules = (internalRules: RuleGroup): any => {
    const processGroup = (group: RuleGroup): any => {
      const result: any = {
        operator: group.operator,
        conditions: group.conditions.map((item: any) => {
          if (item.operator === 'AND' || item.operator === 'OR') {
            return processGroup(item as RuleGroup);
          } else {
            const { id, ...rest } = item;
            return rest;
          }
        })
      };
      
      // 如果是根组，添加checkDetail标志
      if (group.id === 'root') {
        result.checkDetail = true; // 默认启用详情页检查
      }
      
      return result;
    };
    
    return processGroup(internalRules);
  };
  
  // 添加条件
  const handleAddCondition = (parentId: string) => {
    const newCondition: Condition = {
      id: generateId(),
      field: 'education',
      operator: 'contains',
      value: ''
    };
    
    const addToGroup = (group: RuleGroup): RuleGroup => {
      if (group.id === parentId) {
        return {
          ...group,
          conditions: [...group.conditions, newCondition]
        };
      }
      
      return {
        ...group,
        conditions: group.conditions.map(item => {
          if ('operator' in item && (item.operator === 'AND' || item.operator === 'OR')) {
            return addToGroup(item as RuleGroup);
          }
          return item;
        })
      };
    };
    
    const updatedRootGroup = addToGroup(rootGroup);
    setRootGroup(updatedRootGroup);
    saveRules(updatedRootGroup);
  };
  
  // 添加子组
  const handleAddGroup = (parentId: string) => {
    const newGroup: RuleGroup = {
      id: generateId(),
      operator: 'AND',
      conditions: []
    };
    
    const addToGroup = (group: RuleGroup): RuleGroup => {
      if (group.id === parentId) {
        return {
          ...group,
          conditions: [...group.conditions, newGroup]
        };
      }
      
      return {
        ...group,
        conditions: group.conditions.map(item => {
          if ('operator' in item && (item.operator === 'AND' || item.operator === 'OR')) {
            return addToGroup(item as RuleGroup);
          }
          return item;
        })
      };
    };
    
    const updatedRootGroup = addToGroup(rootGroup);
    setRootGroup(updatedRootGroup);
    saveRules(updatedRootGroup);
  };
  
  // 更新组或条件
  const handleUpdateItem = (id: string, field: string, value: any) => {
    const updateInGroup = (group: RuleGroup): RuleGroup => {
      if (group.id === id) {
        return {
          ...group,
          [field]: value
        };
      }
      
      return {
        ...group,
        conditions: group.conditions.map(item => {
          if (item.id === id) {
            return {
              ...item,
              [field]: value
            };
          }
          
          if ('operator' in item && (item.operator === 'AND' || item.operator === 'OR')) {
            return updateInGroup(item as RuleGroup);
          }
          
          return item;
        })
      };
    };
    
    const updatedRootGroup = updateInGroup(rootGroup);
    setRootGroup(updatedRootGroup);
    saveRules(updatedRootGroup);
  };
  
  // 删除组或条件
  const handleDeleteItem = (id: string) => {
    const deleteFromGroup = (group: RuleGroup): RuleGroup => {
      return {
        ...group,
        conditions: group.conditions
          .filter(item => item.id !== id)
          .map(item => {
            if ('operator' in item && (item.operator === 'AND' || item.operator === 'OR')) {
              return deleteFromGroup(item as RuleGroup);
            }
            return item;
          })
      };
    };
    
    const updatedRootGroup = deleteFromGroup(rootGroup);
    setRootGroup(updatedRootGroup);
    saveRules(updatedRootGroup);
  };
  
  // 保存规则到Chrome存储
  const saveRules = (rules: RuleGroup) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const storedRules = convertInternalToStoredRules(rules);
      chrome.runtime.sendMessage({ 
        type: 'updateRules', 
        rules: storedRules 
      });
    }
  };
  
  // 清空所有规则
  const handleClearRules = () => {
    const emptyRootGroup: RuleGroup = {
      id: 'root',
      operator: 'AND',
      conditions: []
    };
    setRootGroup(emptyRootGroup);
    saveRules(emptyRootGroup);
  };
  
  if (!isClient) return null;
  
  return (
    <div className="space-y-4">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">筛选规则编辑器</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleClearRules}
              className="px-3 py-1 text-sm border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 rounded"
            >
              清空规则
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              拖动条件调整顺序，组合逻辑支持嵌套的AND/OR规则。筛选引擎会按照这些规则自动处理简历数据。
            </p>
          </div>
        </div>
        
        <RuleGroupItem 
          group={rootGroup} 
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
          onAddCondition={handleAddCondition}
          onAddGroup={handleAddGroup}
        />
        
        {rootGroup.conditions.length === 0 && (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500">
            <p>暂无筛选规则，点击"添加条件"开始创建</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleEditor; 