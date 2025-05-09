"use client";

import React, { useState, useEffect } from 'react';
import { SimpleRule, SimpleRuleType, ImportanceLevel, SimpleRulesConfig } from '../../../shared/core/rules-engine/simple-rules-engine';
import { v4 as uuidv4 } from 'uuid';

// 规则类型配置
const ruleTypeConfig = [
  { type: SimpleRuleType.岗位, icon: '👨‍💻', color: '#4F46E5' },
  { type: SimpleRuleType.公司, icon: '🏢', color: '#0EA5E9' },
  { type: SimpleRuleType.技能, icon: '🔧', color: '#10B981' },
  { type: SimpleRuleType.学校, icon: '🎓', color: '#F59E0B' },
  { type: SimpleRuleType.学历, icon: '📜', color: '#EC4899' }
];

// 重要性级别配置
const importanceLevels = [
  { value: ImportanceLevel.不重要, label: '不重要' },
  { value: ImportanceLevel.一般, label: '一般' },
  { value: ImportanceLevel.重要, label: '重要' },
  { value: ImportanceLevel.非常重要, label: '非常重要' }
];

// 标签输入组件
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
    <div className="w-full">
      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
        <input
          type="text"
          className="flex-1 p-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入关键词，回车添加"
        />
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
            >
              {tag}
              <button
                type="button"
                className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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

// 规则卡片组件
const RuleCard = ({ rule, onChange, onDelete }) => {
  const typeInfo = ruleTypeConfig.find(r => r.type === rule.type) || ruleTypeConfig[0];
  
  const handleTagAdd = (tag) => {
    const newKeywords = [...rule.keywords, tag];
    onChange({ ...rule, keywords: newKeywords });
  };
  
  const handleTagRemove = (index) => {
    const newKeywords = [...rule.keywords];
    newKeywords.splice(index, 1);
    onChange({ ...rule, keywords: newKeywords });
  };
  
  const handleImportanceChange = (e) => {
    onChange({ ...rule, importance: parseInt(e.target.value) });
  };
  
  const handleMustMatchChange = (e) => {
    onChange({ ...rule, mustMatch: e.target.checked });
  };
  
  const handleEnabledChange = (e) => {
    onChange({ ...rule, enabled: e.target.checked });
  };
  
  const getImportanceLabel = (value) => {
    return importanceLevels.find(level => level.value === value)?.label || '一般';
  };

  return (
    <div 
      className="rule-card mb-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow"
      style={{ borderLeft: `4px solid ${typeInfo.color}` }}
    >
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center">
          <span className="text-xl mr-2">{typeInfo.icon}</span>
          <h3 className="font-medium text-gray-800 dark:text-gray-200">{rule.type}</h3>
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
            onClick={onDelete}
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
      </div>
      
      <div className="p-4 bg-white dark:bg-gray-900">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">关键词</label>
          <TagInput 
            tags={rule.keywords} 
            onAdd={handleTagAdd}
            onRemove={handleTagRemove}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            重要性：{getImportanceLabel(rule.importance)}
          </label>
          <input
            type="range"
            min="25"
            max="100"
            step="25"
            value={rule.importance}
            onChange={handleImportanceChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>不重要</span>
            <span>一般</span>
            <span>重要</span>
            <span>非常重要</span>
          </div>
        </div>
        
        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={rule.mustMatch}
              onChange={handleMustMatchChange}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">必须满足此条件</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// 全局设置组件
const SettingsPanel = ({ config, onChange }) => {
  const handlePassScoreChange = (e) => {
    onChange({ ...config, passScore: parseInt(e.target.value) });
  };
  
  const handleAutoModeChange = (e) => {
    onChange({ ...config, autoMode: e.target.checked });
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">筛选设置</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            通过分数: {config.passScore}
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              value={config.passScore}
              onChange={handlePassScoreChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <span className="w-12 text-center text-gray-700 dark:text-gray-300">{config.passScore}</span>
          </div>
        </div>
        
        <div>
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
      </div>
    </div>
  );
};

// 规则类型选择器
const RuleTypeSelector = ({ onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {ruleTypeConfig.map(({ type, icon, color }) => (
        <button
          key={type}
          className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          style={{ borderLeft: `4px solid ${color}` }}
          onClick={() => onSelect(type)}
        >
          <span className="text-xl mr-2">{icon}</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{type}</span>
        </button>
      ))}
    </div>
  );
};

// 简化规则编辑器组件
const SimpleRuleEditor = ({ initialConfig = null, onSave }) => {
  const [config, setConfig] = useState<SimpleRulesConfig>({
    rules: [],
    passScore: 60,
    autoMode: false
  });
  
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);
  
  const handleAddRule = (type: SimpleRuleType) => {
    const newRule: SimpleRule = {
      id: uuidv4(),
      type,
      keywords: [],
      importance: ImportanceLevel.一般,
      mustMatch: false,
      enabled: true
    };
    
    setConfig({
      ...config,
      rules: [...config.rules, newRule]
    });
  };
  
  const handleUpdateRule = (id: string, updatedRule: SimpleRule) => {
    setConfig({
      ...config,
      rules: config.rules.map(rule => 
        rule.id === id ? updatedRule : rule
      )
    });
  };
  
  const handleDeleteRule = (id: string) => {
    setConfig({
      ...config,
      rules: config.rules.filter(rule => rule.id !== id)
    });
  };
  
  const handleSettingsChange = (newSettings) => {
    setConfig(newSettings);
  };
  
  const handleSaveClick = () => {
    if (onSave) {
      onSave(config);
    }
  };
  
  return (
    <div className="p-4">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          简化规则编辑器
        </h2>
        
        <button
          onClick={handleSaveClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          保存规则
        </button>
      </div>
      
      <SettingsPanel config={config} onChange={handleSettingsChange} />
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">添加规则</h3>
        <RuleTypeSelector onSelect={handleAddRule} />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
          规则列表 ({config.rules.length})
        </h3>
        
        {config.rules.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            还没有创建规则，点击上方按钮添加规则
          </div>
        ) : (
          config.rules.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onChange={(updatedRule) => handleUpdateRule(rule.id, updatedRule)}
              onDelete={() => handleDeleteRule(rule.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SimpleRuleEditor; 