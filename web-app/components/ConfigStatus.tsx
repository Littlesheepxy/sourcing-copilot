import React from 'react';
import { CheckCircle, XCircle, Settings, Clock, Users, Bot } from 'lucide-react';
import { useAiConfig, useSystemConfig } from '../hooks/useConfig';

export default function ConfigStatus() {
  const aiConfig = useAiConfig();
  const systemConfig = useSystemConfig();

  if (aiConfig.isLoading || systemConfig.isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700" data-guide="config-status">
      <div className="flex items-center mb-3">
        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">系统状态</h3>
      </div>
      
      <div className="space-y-3">
        {/* AI配置状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="w-4 h-4 text-purple-500 mr-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">AI服务</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">企业版已配置</span>
          </div>
        </div>

        {/* 自动模式状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="w-4 h-4 text-blue-500 mr-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">自动模式</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">已启用</span>
          </div>
        </div>

        {/* 扫描策略 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-orange-500 mr-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">扫描策略</span>
          </div>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            智能随机间隔
          </span>
        </div>

        {/* 最大候选人数 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">每日上限</span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {systemConfig.maxCandidates} 人
          </span>
        </div>

        {/* AI模型信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="w-4 h-4 text-purple-500 mr-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">AI模型</span>
          </div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            GPT-4o (企业版)
          </span>
        </div>
      </div>


    </div>
  );
} 