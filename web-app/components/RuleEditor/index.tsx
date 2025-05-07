"use client";

import React, { useState, useEffect } from 'react';
import { createRulesStore } from '../../../shared/hooks/useRules';
import { WebStorageAdapter } from '../../store/adapters/webStorageAdapter';
import { ConditionOperator, LogicalOperator, RuleGroup, Condition } from '../../../shared/core/rules-engine/types';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createAIChatStore } from '../../../shared/hooks/useAIChat';

// 创建规则存储
const useRules = createRulesStore(new WebStorageAdapter('sc_'));

// 字段选项
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
  { value: ConditionOperator.CONTAINS, label: '包含' },
  { value: ConditionOperator.EQUALS, label: '等于' },
  { value: ConditionOperator.NOT_EQUALS, label: '不等于' },
  { value: ConditionOperator.STARTS_WITH, label: '开头是' },
  { value: ConditionOperator.ENDS_WITH, label: '结尾是' },
  { value: ConditionOperator.GREATER_THAN, label: '大于' },
  { value: ConditionOperator.LESS_THAN, label: '小于' },
  { value: ConditionOperator.REGEX, label: '正则匹配' },
];

// 单个条件组件
const SortableCondition = ({ 
  condition, 
  updateRule, 
  deleteRule 
}: { 
  condition: Condition, 
  updateRule: (id: string, updates: Partial<Condition>) => void,
  deleteRule: (id: string) => void
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
        onChange={(e) => updateRule(condition.id, { field: e.target.value })}
        className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      >
        {fieldOptions.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      
      <select 
        value={condition.operator}
        onChange={(e) => updateRule(condition.id, { operator: e.target.value as ConditionOperator })}
        className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      >
        {operatorOptions.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      
      <input 
        type="text"
        value={condition.value}
        onChange={(e) => updateRule(condition.id, { value: e.target.value })}
        placeholder="值"
        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      />
      
      <button 
        onClick={() => deleteRule(condition.id)}
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
const RuleGroupComponent = ({ 
  group,
  isRoot = false,
  updateRule,
  deleteRule,
  createCondition,
  createGroup
}: { 
  group: RuleGroup,
  isRoot?: boolean,
  updateRule: (id: string, updates: Partial<RuleGroup | Condition>) => void,
  deleteRule: (id: string) => void,
  createCondition: (parentId: string, field: string, operator: ConditionOperator, value: string) => void,
  createGroup: (parentId: string, operator?: LogicalOperator) => void
}) => {
  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = group.conditions.findIndex(item => item.id === active.id);
      const newIndex = group.conditions.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newConditions = arrayMove([...group.conditions], oldIndex, newIndex);
        updateRule(group.id, { conditions: newConditions });
      }
    }
  };
  
  // 配置传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // 获取条件ID数组，确保每个条件都有ID
  const conditionIds = group.conditions.map(item => {
    // 明确断言 item 的类型
    const typedItem = item as (Condition | RuleGroup);
    return typedItem.id;
  });
  
  return (
    <div className={`p-4 ${!isRoot ? 'mb-3 border border-gray-200 dark:border-gray-700' : ''} rounded-lg ${!isRoot ? 'bg-gray-50 dark:bg-gray-900' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <select
            value={group.operator}
            onChange={(e) => updateRule(group.id, { operator: e.target.value as LogicalOperator })}
            className="p-1 mr-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-0 rounded font-medium"
          >
            <option value={LogicalOperator.AND}>AND (并且)</option>
            <option value={LogicalOperator.OR}>OR (或者)</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400">组合逻辑</span>
        </div>
        
        {!isRoot && (
          <button 
            onClick={() => deleteRule(group.id)}
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
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={conditionIds}
            strategy={verticalListSortingStrategy}
          >
            {group.conditions.map(item => {
              // 使用类型守卫确保类型安全
              const typedItem = item as (Condition | RuleGroup);
              
              if ('operator' in typedItem && 'conditions' in typedItem) {
                // 子规则组
                return (
                  <RuleGroupComponent
                    key={typedItem.id}
                    group={typedItem as RuleGroup}
                    updateRule={updateRule}
                    deleteRule={deleteRule}
                    createCondition={createCondition}
                    createGroup={createGroup}
                  />
                );
              } else {
                // 条件
                return (
                  <SortableCondition
                    key={typedItem.id}
                    condition={typedItem as Condition}
                    updateRule={updateRule}
                    deleteRule={deleteRule}
                  />
                );
              }
            })}
          </SortableContext>
        </DndContext>
      </div>
      
      <div className="mt-3 flex space-x-2">
        <button
          onClick={() => createCondition(group.id, 'education', ConditionOperator.CONTAINS, '')}
          className="px-3 py-1 text-sm bg-green-500 text-white hover:bg-green-600 rounded"
        >
          添加条件
        </button>
        <button
          onClick={() => createGroup(group.id)}
          className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded"
        >
          添加规则组
        </button>
      </div>
    </div>
  );
};

// AI生成规则组件
const AIRuleGenerator = ({ onGenerateRules }: { onGenerateRules: (rules: RuleGroup) => void }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { sendMessage: sendAIMessage } = createAIChatStore(new WebStorageAdapter('sc_'))();
  
  const generateRules = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    try {
      // 发送消息到AI服务
      const response = await sendAIMessage(`
        我需要根据以下描述生成候选人筛选规则：${prompt}
        
        请以JSON格式返回规则，格式如下：
        {
          "operator": "AND",
          "conditions": [
            {
              "field": "education",
              "operator": "CONTAINS",
              "value": "本科"
            },
            ...更多条件
          ]
        }
        
        仅返回JSON数据，不需要其他解释。支持的字段有：education（学历）, school（学校）, company（公司）, position（岗位）, experience（经验年限）, skills（技能标签）。
        支持的操作符有：CONTAINS（包含）, EQUALS（等于）, NOT_EQUALS（不等于）, STARTS_WITH（开头是）, ENDS_WITH（结尾是）, GREATER_THAN（大于）, LESS_THAN（小于）, REGEX（正则匹配）。
      `);
      
      // 尝试从响应中提取JSON
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/```\n([\s\S]*?)\n```/) || 
                        response.match(/\{[\s\S]*?\}/);
      
      if (jsonMatch) {
        try {
          const jsonText = jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1];
          const ruleData = JSON.parse(jsonText);
          
          // 处理生成的规则，添加ID
          const processedRules = processGeneratedRules(ruleData);
          onGenerateRules(processedRules);
          setPrompt('');
        } catch (error) {
          console.error('解析规则JSON失败:', error);
          alert('生成的规则格式有误，请重试或手动创建规则。');
        }
      } else {
        alert('AI未能生成有效的规则格式，请尝试修改描述后重试。');
      }
    } catch (error) {
      console.error('生成规则失败:', error);
      alert('生成规则时发生错误，请稍后再试。');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 处理生成的规则，添加ID
  const processGeneratedRules = (ruleData: any): RuleGroup => {
    const generateId = () => Math.random().toString(36).substr(2, 9);
    
    const processGroup = (group: any): RuleGroup => {
      return {
        id: generateId(),
        operator: group.operator as LogicalOperator,
        conditions: group.conditions.map((item: any) => {
          if (item.operator && (item.operator === 'AND' || item.operator === 'OR')) {
            return processGroup(item);
          }
          return {
            id: generateId(),
            field: item.field,
            operator: item.operator as ConditionOperator,
            value: item.value,
            enabled: true
          };
        }),
        enabled: true
      };
    };
    
    return processGroup(ruleData);
  };
  
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg mb-4">
      <h3 className="text-lg font-medium mb-2">自然语言生成规则</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        描述你想要筛选的候选人标准，AI将帮你生成规则。
      </p>
      
      <div className="flex space-x-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例如：本科及以上学历，3年以上Java开发经验，熟悉Spring框架"
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        />
        <button
          onClick={generateRules}
          disabled={isGenerating || !prompt.trim()}
          className={`px-4 py-2 rounded text-white ${
            isGenerating || !prompt.trim()
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isGenerating ? '生成中...' : '生成规则'}
        </button>
      </div>
    </div>
  );
};

const RuleEditor = () => {
  const {
    rules,
    createCondition,
    createGroup,
    updateRule,
    deleteRule,
    evaluateResume,
    resetRules,
    syncRules,
    exportRules,
    importRules
  } = useRules();
  
  const [resumeData, setResumeData] = useState({});
  const [evaluationResult, setEvaluationResult] = useState<{matched: boolean} | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 检测客户端渲染
  useEffect(() => {
    setIsClient(true);
    
    // 页面加载时尝试同步规则
    const handleInitialSync = async () => {
      try {
        await syncRules();
      } catch (error) {
        console.error('初始同步规则失败', error);
      }
    };
    
    if (isClient) {
      handleInitialSync();
    }
  }, [isClient, syncRules]);
  
  // 测试规则
  const handleTestRules = async () => {
    const result = await evaluateResume(resumeData);
    setEvaluationResult({ matched: result });
  };
  
  // 处理AI生成的规则
  const handleGeneratedRules = (generatedRules: RuleGroup) => {
    // 重置当前规则
    resetRules();
    
    // 使用生成的规则更新
    setTimeout(() => {
      updateRule('root', { 
        operator: generatedRules.operator,
        conditions: generatedRules.conditions 
      });
    }, 100);
  };
  
  // 处理规则同步
  const handleSyncRules = async () => {
    setIsSyncing(true);
    try {
      await syncRules();
      alert('规则同步成功');
    } catch (error) {
      console.error('同步规则失败', error);
      alert('规则同步失败，请稍后再试');
    } finally {
      setIsSyncing(false);
    }
  };
  
  // 导出规则为JSON
  const handleExportRules = () => {
    const rules = exportRules();
    const rulesJSON = JSON.stringify(rules, null, 2);
    
    // 创建Blob
    const blob = new Blob([rulesJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sourcing-rules.json';
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
  
  // 导入规则
  const handleImportRules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedRules = JSON.parse(content);
        importRules(importedRules);
        alert('规则导入成功');
      } catch (error) {
        console.error('导入规则失败', error);
        alert('规则导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    
    // 重置input
    event.target.value = '';
  };
  
  if (!isClient) return null;
  
  return (
    <div className="space-y-4">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">筛选规则编辑器</h2>
          <div className="flex space-x-2">
            <label className="cursor-pointer px-3 py-1 text-sm text-blue-500 border border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20 rounded">
              导入规则
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={handleImportRules} 
              />
            </label>
            <button
              onClick={handleExportRules}
              className="px-3 py-1 text-sm text-green-500 border border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20 rounded"
            >
              导出规则
            </button>
            <button
              onClick={handleSyncRules}
              disabled={isSyncing}
              className={`px-3 py-1 text-sm ${
                isSyncing
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'text-purple-500 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20'
              } border rounded`}
            >
              {isSyncing ? '同步中...' : '同步规则'}
            </button>
            <button
              onClick={() => resetRules()}
              className="px-3 py-1 text-sm text-red-500 border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 rounded"
            >
              清空规则
            </button>
          </div>
        </div>
        
        {/* AI生成规则部分 */}
        <AIRuleGenerator onGenerateRules={handleGeneratedRules} />
        
        {/* 拖拽规则编辑器 */}
        <RuleGroupComponent
          group={rules}
          isRoot={true}
          updateRule={updateRule}
          deleteRule={deleteRule}
          createCondition={createCondition}
          createGroup={createGroup}
        />
      </div>
      
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
        <h3 className="text-lg font-semibold mb-4">测试规则</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            简历数据 (JSON格式)
          </label>
          <textarea
            value={JSON.stringify(resumeData, null, 2)}
            onChange={(e) => {
              try {
                setResumeData(JSON.parse(e.target.value));
              } catch (error) {
                // 格式错误时忽略
              }
            }}
            className="w-full h-40 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono"
            placeholder='{"education": "本科", "company": "腾讯"}'
          />
        </div>
        
        <button
          onClick={handleTestRules}
          className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
        >
          测试规则
        </button>
        
        {evaluationResult !== null && (
          <div className={`mt-4 p-3 rounded-lg ${evaluationResult.matched ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
            <p>{evaluationResult.matched ? '✅ 匹配成功' : '❌ 匹配失败'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleEditor; 