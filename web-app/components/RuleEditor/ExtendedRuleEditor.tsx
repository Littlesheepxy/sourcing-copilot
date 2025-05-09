"use client";

import React, { useState, useEffect } from 'react';
import { WebStorageAdapter } from '../../store/adapters/webStorageAdapter';
import { createRulesStore } from '../../../shared/hooks/useRules';
import { BasicFilters, RulePriority, RuleType } from '../../../shared/types';
import BasicFiltersPanel from './BasicFiltersPanel';
import RulePriorityPanel from './RulePriorityPanel';
import RuleEditor from './index';

// 创建规则存储
const useRules = createRulesStore(new WebStorageAdapter('sc_'));

// 默认基本筛选条件
const defaultBasicFilters: BasicFilters = {
  position: '',
  companies: [],
  keywords: []
};

// 默认规则优先级
const defaultRulePriorities: RulePriority[] = [
  { id: "education", name: "学历要求", weight: 5 },
  { id: "experience", name: "工作经验", weight: 4 },
  { id: "skills", name: "技能标签", weight: 3 },
  { id: "school", name: "学校背景", weight: 2 }
];

const ExtendedRuleEditor: React.FC = () => {
  // 状态
  const [basicFilters, setBasicFilters] = useState<BasicFilters>(defaultBasicFilters);
  const [rulePriorities, setRulePriorities] = useState<RulePriority[]>(defaultRulePriorities);
  const [status, setStatus] = useState<{ loading: boolean, message: string }>({ loading: false, message: '' });
  
  // 加载存储的设置
  useEffect(() => {
    const loadSettings = async () => {
      setStatus({ loading: true, message: '加载设置...' });
      try {
        // 尝试从localStorage或Chrome存储获取设置
        const storedSettings = await useRules.loadRules();
        
        // 如果有基本筛选条件，加载它
        if (storedSettings.basicFilters) {
          setBasicFilters(storedSettings.basicFilters);
        }
        
        // 如果有规则优先级，加载它
        if (storedSettings.rulePriorities) {
          setRulePriorities(storedSettings.rulePriorities);
        }
        
        setStatus({ loading: false, message: '' });
      } catch (error) {
        console.error('加载设置失败:', error);
        setStatus({ loading: false, message: '加载设置失败' });
      }
    };
    
    loadSettings();
  }, []);
  
  // 更新基本筛选条件
  const handleUpdateBasicFilters = (newFilters: BasicFilters) => {
    setBasicFilters(newFilters);
  };
  
  // 更新规则优先级
  const handleUpdateRulePriorities = (newPriorities: RulePriority[]) => {
    setRulePriorities(newPriorities);
  };
  
  // 保存所有设置
  const handleSaveSettings = async () => {
    setStatus({ loading: true, message: '保存设置...' });
    try {
      // 获取当前规则
      const rules = await useRules.getRules();
      
      // 保存所有设置
      await useRules.saveRules({
        ...rules,
        basicFilters,
        rulePriorities
      });
      
      // 同步到Chrome存储
      chrome.runtime.sendMessage({
        type: "updateRules",
        rules: rules,
        basicFilters: basicFilters,
        rulePriorities: rulePriorities
      }, (response) => {
        console.log('Settings synced with extension:', response);
      });
      
      setStatus({ loading: false, message: '设置已保存' });
      
      // 2秒后清除消息
      setTimeout(() => {
        setStatus({ loading: false, message: '' });
      }, 2000);
    } catch (error) {
      console.error('保存设置失败:', error);
      setStatus({ loading: false, message: '保存设置失败' });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 状态信息 */}
      {status.message && (
        <div className={`p-3 rounded-lg text-center ${status.loading ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
          {status.message}
        </div>
      )}
      
      {/* 基本筛选条件 */}
      <BasicFiltersPanel 
        basicFilters={basicFilters}
        updateBasicFilters={handleUpdateBasicFilters}
      />
      
      {/* 规则优先级 */}
      <RulePriorityPanel 
        rulePriorities={rulePriorities}
        updateRulePriorities={handleUpdateRulePriorities}
      />
      
      {/* 原有的规则编辑器 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">高级筛选规则</h2>
        <RuleEditor />
      </div>
      
      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={status.loading}
          className={`px-4 py-2 rounded-lg font-medium ${
            status.loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {status.loading ? '保存中...' : '保存所有设置'}
        </button>
      </div>
    </div>
  );
};

export default ExtendedRuleEditor; 