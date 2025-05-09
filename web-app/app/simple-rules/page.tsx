"use client";

import React from "react";
import PageNavigation from "../../components/layout/PageNavigation";
import SimpleRuleEditor from "../../components/RuleEditor/SimpleRuleEditor";
import { useState, useEffect } from 'react';
import { SimpleRulesConfig } from '../../../shared/core/rules-engine/simple-rules-engine';
import { SimpleRulesAdapter } from '../../../shared/core/rules-engine/simple-adapter';
import { UnifiedRuleGroup } from '../../../shared/core/rules-engine/types';

export default function SimpleRulesPage() {
  const [config, setConfig] = useState<SimpleRulesConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const adapter = new SimpleRulesAdapter();

  useEffect(() => {
    // 页面加载时从本地存储或API获取规则配置
    loadRulesConfig();
  }, []);

  const loadRulesConfig = async () => {
    try {
      // 尝试从本地存储获取简化规则
      const storedConfig = localStorage.getItem('simple_rules_config');
      if (storedConfig) {
        setConfig(JSON.parse(storedConfig));
        return;
      }

      // 如果没有简化规则，尝试从统一规则转换
      const unifiedRules = localStorage.getItem('unified_rules');
      if (unifiedRules) {
        const parsedUnifiedRules = JSON.parse(unifiedRules) as UnifiedRuleGroup;
        const simpleConfig = adapter.convertToSimpleRules(parsedUnifiedRules);
        setConfig(simpleConfig);
        return;
      }

      // 都没有则创建默认规则配置
      setConfig({
        rules: [],
        passScore: 60,
        autoMode: false
      });
    } catch (error) {
      console.error('加载规则配置失败:', error);
      // 发生错误时使用默认配置
      setConfig({
        rules: [],
        passScore: 60,
        autoMode: false
      });
    }
  };

  const handleSaveConfig = async (newConfig: SimpleRulesConfig) => {
    try {
      setIsSaving(true);
      
      // 保存到本地存储
      localStorage.setItem('simple_rules_config', JSON.stringify(newConfig));
      
      // 转换为统一规则格式并保存
      const unifiedRules = adapter.convertToUnifiedRules(newConfig);
      localStorage.setItem('unified_rules', JSON.stringify(unifiedRules));
      
      // 转换为逻辑条件规则并保存（兼容旧版）
      const logicRules = adapter.convertToLogicRules(newConfig);
      localStorage.setItem('logic_rules', JSON.stringify(logicRules));

      // 模拟API调用保存规则到服务器
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 保存成功反馈
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // 更新本地状态
      setConfig(newConfig);
    } catch (error) {
      console.error('保存规则配置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageNavigation>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">简化规则编辑器</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            使用简单直观的界面创建和管理候选人筛选规则
          </p>
        </header>

        <main>
          {!config ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">加载规则配置中...</p>
              </div>
            </div>
          ) : (
            <SimpleRuleEditor 
              initialConfig={config} 
              onSave={handleSaveConfig} 
            />
          )}
        </main>

        {/* 保存成功提示 */}
        {saveSuccess && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-pulse">
            规则保存成功！
          </div>
        )}

        {/* 保存中加载状态 */}
        {isSaving && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-center">保存中...</p>
            </div>
          </div>
        )}
      </div>
    </PageNavigation>
  );
} 