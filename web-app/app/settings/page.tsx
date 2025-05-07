"use client";

import React, { useState } from 'react';
import { Save, RotateCw, Sliders, Bell, Lock, Database, CloudLightning, User } from 'lucide-react';

export default function SettingsPage() {
  // 基本设置
  const [autoMode, setAutoMode] = useState(false);
  const [scanInterval, setScanInterval] = useState(30);
  const [maxCandidates, setMaxCandidates] = useState(50);
  
  // AI设置
  const [apiKey, setApiKey] = useState('');
  const [modelProvider, setModelProvider] = useState('deepseek');
  const [modelVersion, setModelVersion] = useState('deepseek-chat');
  
  // 通知设置
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  
  // 账户设置
  const [username, setUsername] = useState('用户');
  const [language, setLanguage] = useState('zh-CN');
  
  // 其他状态
  const [saving, setSaving] = useState(false);
  
  const handleSave = () => {
    setSaving(true);
    // 模拟保存过程
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };
  
  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">系统设置</h1>
            <p className="text-gray-500 dark:text-gray-400">配置您的Sourcing Copilot助手</p>
          </div>
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
        
        {/* 系统配置卡片 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
              <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-medium">系统配置</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-200">启用自动模式</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">在Boss直聘网站自动化执行筛选和沟通</p>
              </div>
              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  className="opacity-0 w-0 h-0"
                  checked={autoMode}
                  onChange={() => setAutoMode(!autoMode)}
                  id="autoMode"
                />
                <label
                  htmlFor="autoMode"
                  className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-300 ${
                    autoMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute left-1 bottom-1 bg-white dark:bg-gray-200 w-4 h-4 rounded-full transition-all duration-300 ${
                      autoMode ? 'transform translate-x-6' : ''
                    }`}
                  ></span>
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  简历扫描间隔 (分钟)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={scanInterval}
                  onChange={(e) => setScanInterval(parseInt(e.target.value))}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  推荐设置为30分钟以上，避免频繁操作
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  每日最大候选人数量
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={maxCandidates}
                  onChange={(e) => setMaxCandidates(parseInt(e.target.value))}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  限制每日处理的最大候选人数量
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI服务配置卡片 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
              <CloudLightning className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-medium">AI服务配置</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                API密钥
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full font-mono"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                用于AI对话助手和智能简历分析的API密钥 (<a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">获取DeepSeek API密钥</a>)
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  模型提供商
                </label>
                <select
                  value={modelProvider}
                  onChange={(e) => setModelProvider(e.target.value)}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full"
                >
                  <option value="deepseek">DeepSeek AI</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  模型版本
                </label>
                <select
                  value={modelVersion}
                  onChange={(e) => setModelVersion(e.target.value)}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full"
                >
                  <option value="deepseek-chat">DeepSeek Chat</option>
                  <option value="deepseek-coder">DeepSeek Coder</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="claude-3">Claude 3</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* 通知设置卡片 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
              <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-medium">通知设置</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:space-x-6">
              <div className="flex items-center mb-4 md:mb-0">
                <input
                  id="emailNotif"
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotif" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                  邮件通知
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="smsNotif"
                  type="checkbox"
                  checked={smsNotifications}
                  onChange={() => setSmsNotifications(!smsNotifications)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="smsNotif" className="ml-2 block text-sm text-gray-700 dark:text-gray-200">
                  短信通知
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                通知邮箱
              </label>
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full"
              />
            </div>
          </div>
        </div>
        
        {/* 账户设置卡片 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-medium">账户设置</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                用户名称
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                语言偏好
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English (US)</option>
                <option value="zh-TW">繁體中文</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 