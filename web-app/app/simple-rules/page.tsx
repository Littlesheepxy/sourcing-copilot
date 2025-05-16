"use client";

import React from "react";
import SimpleRuleEditor from "../../components/RuleEditor/SimpleRuleEditor";
import { useState, useEffect } from 'react';
import { SimpleRulesConfig } from '../../../shared/core/rules-engine/simple-rules-engine';
import { AlertCircle } from "lucide-react";

export default function SimpleRulesPage() {
  const [config, setConfig] = useState<SimpleRulesConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // 页面加载时从API或本地存储获取规则配置
    loadRulesConfig();
  }, []);

  const loadRulesConfig = async () => {
    try {
      setApiError(null);
      
      // 尝试从API获取配置
      try {
        const response = await fetch('http://localhost:8000/api/config');
        if (response.ok) {
          const data = await response.json();
          
          // 将API返回的配置转换为SimpleRulesConfig格式
          const convertedConfig: SimpleRulesConfig = {
            rules: data.rules || [],
            passScore: 60,
            autoMode: data.autoMode || false
          };
          
          setConfig(convertedConfig);
          return;
        }
      } catch (error) {
        console.error('从API加载配置失败:', error);
        setApiError('无法从服务器加载配置，将使用本地存储的配置');
      }
      
      // 如果API加载失败，尝试从本地存储获取
      const storedConfig = localStorage.getItem('simple_rules_config');
      if (storedConfig) {
        setConfig(JSON.parse(storedConfig));
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
      setApiError(null);
      
      // 保存到本地存储
      localStorage.setItem('simple_rules_config', JSON.stringify(newConfig));
      
      // 将配置转换为API期望的格式
      const apiConfig = {
        autoMode: newConfig.autoMode,
        rules: newConfig.rules
      };
      
      // 尝试保存到API
      try {
        const response = await fetch('http://localhost:8000/api/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(apiConfig)
        });
        
        if (!response.ok) {
          throw new Error('API响应错误');
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || '保存失败');
        }
      } catch (error) {
        console.error('保存到API失败:', error);
        setApiError('无法保存到服务器，但已保存到本地存储');
      }
      
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
  
  const handleReset = async () => {
    if (window.confirm('确定要重置为默认配置吗？所有自定义规则将丢失！')) {
      try {
        setIsSaving(true);
        
        // 从API获取默认配置
        try {
          const response = await fetch('http://localhost:8000/api/config');
          if (response.ok) {
            const data = await response.json();
            
            // 将API返回的配置转换为SimpleRulesConfig格式
            const convertedConfig: SimpleRulesConfig = {
              rules: data.rules || [],
              passScore: 60,
              autoMode: data.autoMode || false
            };
            
            setConfig(convertedConfig);
            
            // 保存成功反馈
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            return;
          }
        } catch (error) {
          console.error('从API重置配置失败:', error);
          setApiError('无法从服务器重置配置');
        }
        
        // 如果API重置失败，使用默认配置
        const defaultConfig: SimpleRulesConfig = {
          rules: [],
          passScore: 60,
          autoMode: false
        };
        
        setConfig(defaultConfig);
        localStorage.setItem('simple_rules_config', JSON.stringify(defaultConfig));
        
        // 保存成功反馈
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        console.error('重置配置失败:', error);
        alert('重置失败，请重试');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">规则设置</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          设置候选人筛选规则，系统将按照这些规则自动评估候选人简历并进行分类处理
        </p>
      </header>
      
      {/* API错误提示 */}
      {apiError && (
        <div className="mb-6 flex items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p>{apiError}</p>
          </div>
        </div>
      )}

      <main>
        {!config ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">加载规则配置中...</p>
            </div>
          </div>
        ) : (
          <>
            <SimpleRuleEditor 
              initialConfig={config} 
              onSave={handleSaveConfig} 
            />
            
            {/* 额外的操作按钮 */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium"
              >
                返回首页
              </button>
              
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium border border-red-200 dark:border-red-800"
              >
                重置为默认
              </button>
            </div>
          </>
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
  );
} 