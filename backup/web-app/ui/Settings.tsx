"use client";

import React, { useState } from 'react';
import { useStore } from '../../store/store';
import ThemeToggle from './ThemeToggle';
import ColorPicker from './ColorPicker';

const Settings = () => {
  const { deepseekConfig, updateDeepSeekConfig } = useStore();
  const [apiSettings, setApiSettings] = useState({
    apiKey: deepseekConfig.apiKey || '',
    apiBaseUrl: deepseekConfig.apiBaseUrl || 'https://api.deepseek.com/v1',
    modelName: deepseekConfig.modelName || 'deepseek-chat',
    maxTokens: deepseekConfig.maxTokens || 1000,
    temperature: deepseekConfig.temperature || 0.7
  });
  const [activeTab, setActiveTab] = useState<'theme' | 'api' | 'about'>('theme');
  
  // 更新API设置字段
  const handleApiSettingChange = (field: string, value: any) => {
    setApiSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // 保存API设置
  const saveApiSettings = () => {
    updateDeepSeekConfig(apiSettings);
    // 显示保存成功提示
    alert('API设置已保存');
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium">设置</h3>
          </div>
          <nav className="p-2">
            <button
              onClick={() => setActiveTab('theme')}
              className={`w-full text-left px-4 py-2 my-1 rounded-md transition-colors ${
                activeTab === 'theme' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 01-5.3-8.8 2 2 0 012.96-2.64 1 1 0 001.34-1.34 2 2 0 012.64-2.96A6 6 0 0110 16z" clipRule="evenodd" />
                </svg>
                <span>主题外观</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('api')}
              className={`w-full text-left px-4 py-2 my-1 rounded-md transition-colors ${
                activeTab === 'api' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.243 5.757a6 6 0 10-.986 9.284 1 1 0 111.087 1.678A8 8 0 1118 10a3 3 0 01-4.8 2.401A4 4 0 1114 10a1 1 0 102 0c0-1.537-.586-3.07-1.757-4.243zM12 10a2 2 0 10-4 0 2 2 0 004 0z" clipRule="evenodd" />
                </svg>
                <span>API 配置</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('about')}
              className={`w-full text-left px-4 py-2 my-1 rounded-md transition-colors ${
                activeTab === 'about' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>关于</span>
              </div>
            </button>
          </nav>
        </div>
      </div>
      
      <div className="md:col-span-2">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">主题设置</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  自定义应用的外观和主题颜色
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      主题模式
                    </label>
                    <ThemeToggle />
                  </div>
                  
                  <ColorPicker />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">DeepSeek API 配置</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  配置 DeepSeek API 连接参数
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
                      API 密钥
                    </label>
                    <input
                      type="password"
                      id="apiKey"
                      value={apiSettings.apiKey}
                      onChange={(e) => handleApiSettingChange('apiKey', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      placeholder="sk-xxxxxxxxxxxxxxxx"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        在DeepSeek平台获取API密钥
                      </a>
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="apiBaseUrl" className="block text-sm font-medium mb-1">
                      API 基础URL
                    </label>
                    <input
                      type="text"
                      id="apiBaseUrl"
                      value={apiSettings.apiBaseUrl}
                      onChange={(e) => handleApiSettingChange('apiBaseUrl', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="modelName" className="block text-sm font-medium mb-1">
                        模型名称
                      </label>
                      <select
                        id="modelName"
                        value={apiSettings.modelName}
                        onChange={(e) => handleApiSettingChange('modelName', e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      >
                        <option value="deepseek-chat">DeepSeek Chat</option>
                        <option value="deepseek-coder">DeepSeek Coder</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="temperature" className="block text-sm font-medium mb-1">
                        温度系数 ({apiSettings.temperature})
                      </label>
                      <input
                        type="range"
                        id="temperature"
                        min="0"
                        max="2"
                        step="0.1"
                        value={apiSettings.temperature}
                        onChange={(e) => handleApiSettingChange('temperature', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>精确</span>
                        <span>平衡</span>
                        <span>创意</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="maxTokens" className="block text-sm font-medium mb-1">
                      最大输出长度 ({apiSettings.maxTokens} tokens)
                    </label>
                    <input
                      type="range"
                      id="maxTokens"
                      min="100"
                      max="4000"
                      step="100"
                      value={apiSettings.maxTokens}
                      onChange={(e) => handleApiSettingChange('maxTokens', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <button 
                      onClick={saveApiSettings}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                      style={{ backgroundColor: 'var(--primary-color)' }}
                    >
                      保存设置
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">关于</h3>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-green-500 flex items-center justify-center shadow-md mr-4">
                    <span className="text-white font-bold text-xl">S</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Boss直聘 Sourcing 智能助手</h4>
                    <p className="text-sm text-gray-500">版本: 1.0.0</p>
                  </div>
                </div>
                
                <div className="prose dark:prose-invert max-w-none">
                  <p>
                    基于Chrome插件（Manifest V3）+ Next.js + Tailwind CSS + Zustand + DeepSeek API开发的智能招聘助手，
                    帮助招聘人员高效筛选Boss直聘上的候选人。
                  </p>
                  
                  <h4>主要功能</h4>
                  <ul>
                    <li>自动抓取候选人数据</li>
                    <li>自定义筛选规则</li>
                    <li>AI辅助筛选与打招呼</li>
                    <li>人机协作模式</li>
                  </ul>
                  
                  <p className="text-sm text-gray-500 mt-8">
                    &copy; {new Date().getFullYear()} Boss直聘 Sourcing 智能助手
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 