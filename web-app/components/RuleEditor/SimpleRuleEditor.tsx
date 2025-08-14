"use client";

import React, { useState, useEffect } from 'react';
import { SimpleRule, SimpleRuleType, ImportanceLevel, SimpleRulesConfig } from '../../../shared/core/rules-engine/simple-rules-engine';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 规则类型配置
const ruleTypeConfig = [
  { type: SimpleRuleType.岗位, icon: '👨‍💻', color: '#4F46E5' },
  { type: SimpleRuleType.公司, icon: '🏢', color: '#0EA5E9' },
  { type: SimpleRuleType.岗位核心关键词, icon: '🔧', color: '#10B981' },
  { type: SimpleRuleType.学校, icon: '🎓', color: '#F59E0B' },
  { type: SimpleRuleType.学历, icon: '📜', color: '#EC4899' }
];

// 规则描述
const ruleDescs = {
  [SimpleRuleType.岗位]: '匹配候选人的期望岗位，此条件不满足将终止评估',
  [SimpleRuleType.公司]: '检查候选人是否来自竞争对手公司，如果是则直接通过',
  [SimpleRuleType.岗位核心关键词]: '评估候选人的技能是否满足岗位核心要求，设置通过分数',
  [SimpleRuleType.学校]: '筛选候选人的毕业院校',
  [SimpleRuleType.学历]: '筛选候选人的学历水平'
};

// 标签组件
const TagInput = ({ tags, onAdd, onRemove }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      onAdd(input.trim());
      setInput('');
      e.preventDefault();
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入关键词，回车添加"
        />
        <button
          onClick={() => {
            if (input.trim()) {
              onAdd(input.trim());
              setInput('');
            }
          }}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          添加
        </button>
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
            >
              {tag}
              <button
                type="button"
                className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                onClick={() => onRemove(index)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// 可拖拽的规则卡片组件
const SortableRuleCard = ({ rule, updateRule, deleteRule }) => {
  const typeInfo = ruleTypeConfig.find(r => r.type === rule.type) || ruleTypeConfig[0];
  
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rule.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid' as const,
    borderLeftColor: typeInfo.color
  };
  
  const handleTagAdd = (tag) => {
    const newKeywords = [...rule.keywords, tag];
    updateRule(rule.id, { ...rule, keywords: newKeywords });
  };
  
  const handleTagRemove = (index) => {
    const newKeywords = [...rule.keywords];
    newKeywords.splice(index, 1);
    updateRule(rule.id, { ...rule, keywords: newKeywords });
  };
  
  const handleEnabledChange = (e) => {
    updateRule(rule.id, { ...rule, enabled: e.target.checked });
  };
  
  const handleMustMatchChange = (e) => {
    updateRule(rule.id, { ...rule, mustMatch: e.target.checked });
  };
  
  const handlePassScoreChange = (e) => {
    updateRule(rule.id, { ...rule, passScore: parseInt(e.target.value, 10) });
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg mb-3 overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          {/* 拖拽手柄 */}
          <div {...attributes} {...listeners} className="cursor-move p-1 mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="12" r="1"></circle>
              <circle cx="9" cy="5" r="1"></circle>
              <circle cx="9" cy="19" r="1"></circle>
              <circle cx="15" cy="12" r="1"></circle>
              <circle cx="15" cy="5" r="1"></circle>
              <circle cx="15" cy="19" r="1"></circle>
            </svg>
          </div>
          
          <span className="text-xl mr-2">{typeInfo.icon}</span>
          <span className="font-medium">{rule.type}</span>
          
          {/* 显示序号 */}
          <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
            #{rule.order !== undefined ? rule.order + 1 : '?'}
          </span>
        </div>
        
        <div className="flex items-center">
          <label className="inline-flex items-center mr-4">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={rule.enabled}
              onChange={handleEnabledChange}
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">启用</span>
          </label>
          
          <button
            onClick={() => deleteRule(rule.id)}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            aria-label="删除规则"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {/* 规则说明 */}
        {ruleDescs[rule.type] && (
          <div className="mb-4 text-sm flex items-start text-gray-600 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>{ruleDescs[rule.type]}</span>
          </div>
        )}
      
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">关键词</label>
          <TagInput 
            tags={rule.keywords} 
            onAdd={handleTagAdd}
            onRemove={handleTagRemove}
          />
        </div>
        
        {/* 如果是岗位核心关键词规则，添加通过分数设置 */}
        {rule.type === SimpleRuleType.岗位核心关键词 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              通过分数: <span>{rule.passScore || 60}</span>
          </label>
          <input
            type="range"
              min="0"
            max="100"
              step="1"
              value={rule.passScore || 60}
              onChange={handlePassScoreChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">得分高于此值的候选人将被视为通过筛选</p>
          </div>
        )}
        
        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={rule.mustMatch}
              onChange={handleMustMatchChange}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">必须满足此条件（不满足直接拒绝）</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// 阶段评估提示组件
const StageHint = ({ rules }) => {
  // 获取排序后的已启用规则
  const sortedRules = [...rules]
    .filter(r => r.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  if (sortedRules.length === 0) return null;
  
  // 定义阶段
  let stages = [];
  let stageIndex = 1;
  
  // 查找岗位规则
  const positionRule = sortedRules.find(r => r.type === SimpleRuleType.岗位);
  if (positionRule) {
    stages.push({
      number: stageIndex++,
      title: "岗位匹配",
      desc: "先检查候选人岗位是否匹配，如不匹配则终止评估"
    });
  }
  
  // 查找公司规则
  const companyRule = sortedRules.find(r => r.type === SimpleRuleType.公司);
  if (companyRule) {
    stages.push({
      number: stageIndex++,
      title: "公司筛查",
      desc: "检查候选人是否来自竞争对手公司，如是则直接通过"
    });
  }
  
  // 查找关键词规则
  const keywordRule = sortedRules.find(r => r.type === SimpleRuleType.岗位核心关键词);
  if (keywordRule) {
    stages.push({
      number: stageIndex++,
      title: "关键词评估",
      desc: `评估候选人技能关键词匹配度，得分高于 ${keywordRule.passScore || 60} 分才能通过`
    });
  }
  
  if (stages.length === 0) return null;
  
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 border border-blue-100 dark:border-blue-800">
      <div className="font-medium text-blue-700 dark:text-blue-300 mb-2">评估流程:</div>
      
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.number} className="flex flex-col">
          <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">
                {stage.number}
              </div>
              <div className="font-medium">{stage.title}</div>
            </div>
            <div className="ml-7 text-sm text-gray-600 dark:text-gray-400">
              {stage.desc}
            </div>
          </div>
        ))}
        </div>
        
      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        通过拖拽调整规则顺序，规则将按照顺序依次评估
      </div>
    </div>
  );
};

// 主组件
const SimpleRuleEditor = ({ initialConfig = null, onSave }) => {
  // 初始化配置
  const defaultConfig: SimpleRulesConfig = {
    rules: [],
    passScore: 60,
    autoMode: false
  };
  
  const [config, setConfig] = useState<SimpleRulesConfig>(initialConfig || defaultConfig);
  
  // 如果initialConfig变化，更新config
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);
  
  // 自动保存功能 - 当配置变化时自动保存
  useEffect(() => {
    // 防抖保存，避免频繁保存
    const autoSaveTimer = setTimeout(async () => {
      // 检查是否有规则需要保存
      if (config.rules.length > 0 || config.autoMode !== false) {
        try {
          console.log('🔄 自动保存卡片规则配置...');
          
          // 调用父组件的保存函数
          if (onSave) {
            onSave(config);
          }
        } catch (error) {
          console.log('⚠️ 卡片规则自动保存失败:', error);
        }
      }
    }, 2000); // 2秒防抖

    return () => clearTimeout(autoSaveTimer);
  }, [config, onSave]);
  
  // 确保所有规则都有顺序属性
  useEffect(() => {
    const ensureRulesHaveOrder = () => {
      const updatedRules = config.rules.map((rule, index) => {
        if (rule.order === undefined) {
          return { ...rule, order: index };
        }
        return rule;
      });
      
      if (JSON.stringify(updatedRules) !== JSON.stringify(config.rules)) {
        setConfig(prev => ({ ...prev, rules: updatedRules }));
      }
    };
    
    ensureRulesHaveOrder();
  }, [config.rules]);
  
  // 配置传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );
  
  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // 找到拖拽项目和目标项目的索引
      const oldIndex = config.rules.findIndex(r => r.id === active.id);
      const newIndex = config.rules.findIndex(r => r.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // 移动规则
        const updatedRules = arrayMove([...config.rules], oldIndex, newIndex);
        
        // 更新顺序属性
        updatedRules.forEach((rule, index) => {
          rule.order = index;
        });
        
        // 更新配置
        setConfig(prev => ({
          ...prev,
          rules: updatedRules
        }));
      }
    }
  };
  
  // 添加新规则
  const handleAddRule = (type: SimpleRuleType) => {
    const newRule: SimpleRule = {
      id: uuidv4(),
      type,
      keywords: [],
      importance: ImportanceLevel.一般, // 保留此属性以兼容旧数据
      mustMatch: false,
      enabled: true,
      order: config.rules.length,
      passScore: type === SimpleRuleType.岗位核心关键词 ? 60 : undefined
    };
    
    setConfig(prev => ({
      ...prev,
      rules: [...prev.rules, newRule]
    }));
  };
  
  // 更新规则
  const handleUpdateRule = (id: string, updatedRule: SimpleRule) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === id ? { ...rule, ...updatedRule } : rule
      )
    }));
  };
  
  // 删除规则
  const handleDeleteRule = (id: string) => {
    setConfig(prev => {
      // 过滤掉要删除的规则
      const filteredRules = prev.rules.filter(r => r.id !== id);
      
      // 更新剩余规则的顺序
      const updatedRules = filteredRules.map((rule, index) => ({
        ...rule,
        order: index
      }));
      
      return {
        ...prev,
        rules: updatedRules
      };
    });
  };
  
  // 导入规则
  const handleImportRules = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result as string);
        
        // 简单验证导入的配置
        if (importedConfig && Array.isArray(importedConfig.rules)) {
          setConfig(importedConfig);
        } else {
          alert('导入的配置无效');
        }
      } catch (error) {
        console.error('导入规则失败:', error);
        alert('导入规则失败: ' + error.message);
      }
      
      // 重置文件输入
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };
  
  // 导出规则
  const handleExportRules = () => {
    const configStr = JSON.stringify(config, null, 2);
    const blob = new Blob([configStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sourcing_rules_config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 重置规则
  const handleResetRules = () => {
    if (window.confirm('确定要重置所有规则吗？这将删除所有已配置的规则。')) {
      setConfig({
        rules: [],
        passScore: 60,
        autoMode: false
      });
    }
  };
  
  // 自动模式切换
  const handleAutoModeChange = (e) => {
    setConfig(prev => ({
      ...prev,
      autoMode: e.target.checked
    }));
  };
  
  // 保存规则
  const handleSaveClick = () => {
    if (onSave) {
      onSave(config);
    }
  };
  
  // 规则ID列表（用于拖拽）
  const ruleIds = config.rules.map(rule => rule.id);
  
  // 导入文件输入引用
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  return (
    <div className="space-y-6">
      {/* 规则添加按钮 */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-3">添加规则</h3>
        <div className="flex flex-wrap gap-2">
          {ruleTypeConfig.map(({ type, icon, color }) => (
            <button
              key={type}
              className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
              style={{ borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: color }}
              onClick={() => handleAddRule(type as SimpleRuleType)}
            >
              <span className="text-xl mr-2">{icon}</span>
              <span>{type}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* 规则列表 */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">规则列表</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm border border-gray-300 dark:border-gray-600"
            >
              导入
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportRules}
              style={{ display: 'none' }}
              accept=".json"
            />
            <button 
              onClick={handleExportRules}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm border border-gray-300 dark:border-gray-600"
            >
              导出
            </button>
            <button 
              onClick={handleResetRules}
              className="px-3 py-1 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-sm border border-red-200 dark:border-red-800"
            >
              重置
            </button>
          </div>
        </div>
        
        {/* 阶段评估提示 */}
        {config.rules.length > 0 && <StageHint rules={config.rules} />}
        
        {/* 没有规则时的提示 */}
        {config.rules.length === 0 && (
          <div className="text-center p-6 text-gray-500 dark:text-gray-400">
            暂无规则，请点击"添加规则"按钮创建规则
          </div>
        )}
        
        {/* 可拖拽规则列表 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ruleIds}
            strategy={verticalListSortingStrategy}
          >
            {config.rules.map((rule) => (
              <SortableRuleCard
                key={rule.id}
                rule={rule}
                updateRule={handleUpdateRule}
                deleteRule={handleDeleteRule}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      
      {/* 自动模式设置 */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-3">其他设置</h3>
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600"
            checked={config.autoMode}
            onChange={handleAutoModeChange}
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">自动模式（自动打招呼/跳过）</span>
        </label>
      </div>
      
      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          保存规则
        </button>
      </div>
    </div>
  );
};

export default SimpleRuleEditor; 