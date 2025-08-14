"use client";

import React, { useState, useEffect } from 'react';
import { Save, RotateCw, Sliders, CloudLightning, CheckCircle } from 'lucide-react';
import { SystemConfig, defaultConfig, getConfig, saveConfig, isAiConfigEditable } from '../../lib/config';

export default function SettingsPage() {
  // 配置状态
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 从localStorage加载配置
  useEffect(() => {
    try {
      const loadedConfig = getConfig();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 更新配置的通用函数
  const updateConfig = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setSaved(false);
  };

  // 保存配置
  const handleSave = async () => {
    setSaving(true);
    try {
      // 保存配置
      saveConfig(config);
      
      // 这里可以添加API调用来保存到后端
      // await fetch('/api/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config)
      // });
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaved(true);
      
      // 3秒后隐藏保存成功提示
      setTimeout(() => setSaved(false), 3000);
      
      // 触发自定义事件，通知其他组件配置已更新
      window.dispatchEvent(new CustomEvent('configUpdated', { detail: config }));
      
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败，请重试');
    } finally {
      setSaving(false);
    }
  };



  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RotateCw className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }
  
  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">系统设置</h1>
            <p className="text-gray-500 dark:text-gray-400">配置您的Sourcing Copilot助手</p>
          </div>
          <div className="flex items-center space-x-3">
            {saved && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span className="text-sm">已保存</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="gradient-border inline-flex items-center px-5 py-2.5 border-0 shadow-sm text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {saving ? (
                <>
                  <RotateCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="-ml-1 mr-2 h-4 w-4" />
                  保存设置
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* 系统配置卡片 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-medium">系统配置</h2>
            </div>
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">自动模式已启用</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* 自动模式状态显示 */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-900 dark:text-green-100">自动化模式</h3>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    系统已启用自动模式，将在Boss直聘网站自动执行筛选和沟通任务。扫描间隔采用智能随机策略，确保操作自然性。
                  </p>
                </div>
              </div>
            </div>
            
            {/* 每日最大候选人数量配置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                每日最大候选人数量
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={config.maxCandidates}
                  onChange={(e) => updateConfig('maxCandidates', parseInt(e.target.value) || 50)}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">人/天</span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                限制每日处理的最大候选人数量，建议设置在50-100之间以保持合理的工作量
              </p>
            </div>

            {/* 系统特性说明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                智能特性
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  智能随机扫描间隔
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  自动筛选和沟通
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  每日处理量控制
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  反检测机制
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI服务配置卡片 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                <CloudLightning className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-medium">AI服务配置</h2>
            </div>
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">企业版已配置</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* 企业版说明 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CloudLightning className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">企业版AI服务</h3>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    当前使用企业级AI服务，由公司统一配置和管理，确保服务稳定性和数据安全。
                  </p>
                </div>
              </div>
            </div>
            
            {/* 当前配置显示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  AI服务提供商
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 flex items-center">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">AI</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">OpenAI</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  AI模型版本
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 flex items-center">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">4o</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">GPT-4o</span>
                </div>
              </div>
            </div>

            {/* API状态显示 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                API连接状态
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-gray-900 dark:text-gray-100">已连接</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">企业级API密钥</span>
              </div>
            </div>

            {/* 功能特性 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                可用功能
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  智能简历分析
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  AI对话助手
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  自动化筛选
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  智能推荐
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 配置预览卡片 */}
        <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-200">当前配置预览</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">自动模式:</span>
              <span className="ml-2 font-medium text-green-600 dark:text-green-400">已启用</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">扫描策略:</span>
              <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">智能随机间隔</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">每日上限:</span>
              <span className="ml-2 font-medium text-gray-700 dark:text-gray-200">{config.maxCandidates} 人</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">AI服务:</span>
              <span className="ml-2 font-medium text-green-600 dark:text-green-400">OpenAI GPT-4o (企业版)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 