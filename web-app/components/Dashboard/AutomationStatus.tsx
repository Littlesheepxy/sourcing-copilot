"use client";

import React, { useState } from "react";
import { Play, StopCircle, Bot, Zap } from "lucide-react";

type AutomationStatusProps = {
  status: {
    running: boolean;
    taskCount: number;
    completedTasks: number;
    nextScheduledTime?: string;
  };
  onStart: () => void;
  onStop: () => void;
  loading: boolean;
};

const AutomationStatus: React.FC<AutomationStatusProps> = ({
  status,
  onStart,
  onStop,
  loading
}) => {
  const [aiGreetingEnabled, setAiGreetingEnabled] = useState(false);
  
  // 计算进度百分比
  const progressPercent = status.taskCount > 0 
    ? Math.round((status.completedTasks / status.taskCount) * 100)
    : 0;

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
        <Zap className="h-5 w-5 text-amber-500 inline-block mr-2" />
        自动化执行状态
      </h3>
      
      {/* 状态指示器 */}
      <div className="flex items-center mb-5">
        <div className={`w-3 h-3 rounded-full mr-2 ${status.running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {status.running ? '运行中' : '已停止'}
        </span>
      </div>
      
      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">任务进度</span>
          <span className="font-medium">{status.completedTasks}/{status.taskCount}</span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
      
      {/* 下次执行时间 */}
      {status.nextScheduledTime && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          下次执行时间: {status.nextScheduledTime}
        </div>
      )}
      
      {/* 控制按钮 */}
      <div className="flex space-x-3 mb-6 max-w-md mx-auto w-full">
        <button
          onClick={onStart}
          disabled={status.running || loading}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center ${
            status.running || loading
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
          }`}
        >
          <Play className="h-4 w-4 mr-2" />
          启动
        </button>
        
        <button
          onClick={onStop}
          disabled={!status.running || loading}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center ${
            !status.running || loading
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200'
          }`}
        >
          <StopCircle className="h-4 w-4 mr-2" />
          停止
        </button>
      </div>
      
      {/* 填充空间 */}
      <div className="flex-grow"></div>
      
      {/* AI个性化打招呼功能开关 - 单独卡片 */}
      <div className="mt-auto border border-blue-100 dark:border-blue-800 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 px-4 py-3 border-b border-blue-100 dark:border-blue-800">
          <div className="flex items-center">
            <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">AI个性化打招呼</span>
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded">研发中</span>
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400 pr-4 mb-3 sm:mb-0">
              开启此功能可使用AI生成个性化打招呼话术，提高简历获取率
            </p>
            <div className="relative flex-shrink-0 self-end sm:self-auto">
              <input
                type="checkbox"
                id="aiGreetingToggle"
                checked={aiGreetingEnabled}
                onChange={() => setAiGreetingEnabled(!aiGreetingEnabled)}
                className="sr-only"
              />
              <label
                htmlFor="aiGreetingToggle"
                className={`flex h-6 w-12 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${
                  aiGreetingEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
                    aiGreetingEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationStatus; 