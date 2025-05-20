"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { KanbanSquare, Zap, Settings, Play, StopCircle, CheckCircle, Circle, Users, Book, MessageSquare, Bot } from "lucide-react";

// 动画配置
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

type TaskCenterSectionProps = {
  positionProgress: {
    total: number;
    matched: number;
    contacted: number;
    replied: number;
  };
  automationStatus: {
    running: boolean;
    taskCount: number;
    completedTasks: number;
    nextScheduledTime?: string;
  };
  onStartAutomation: () => void;
  onStopAutomation: () => void;
  onNavigate: (route: string) => void;
};

const TaskCenterSection: React.FC<TaskCenterSectionProps> = ({
  positionProgress,
  automationStatus,
  onStartAutomation,
  onStopAutomation,
  onNavigate
}) => {
  const [aiGreetingEnabled, setAiGreetingEnabled] = useState(false);
  
  // 计算进度百分比
  const matchedPercent = (positionProgress.matched / positionProgress.total) * 100 || 0;
  const contactedPercent = (positionProgress.contacted / positionProgress.total) * 100 || 0;
  const repliedPercent = (positionProgress.replied / positionProgress.total) * 100 || 0;
  
  // 计算自动化进度百分比
  const automationProgress = automationStatus.taskCount > 0 
    ? Math.round((automationStatus.completedTasks / automationStatus.taskCount) * 100) 
    : 0;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">任务中心</h2>
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 职位进度看板 */}
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center mb-4">
            <KanbanSquare className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">职位进度看板</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">匹配简历</span>
                <span className="font-medium">{positionProgress.matched}/{positionProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${matchedPercent}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">已联系</span>
                <span className="font-medium">{positionProgress.contacted}/{positionProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${contactedPercent}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">有回应</span>
                <span className="font-medium">{positionProgress.replied}/{positionProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${repliedPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => onNavigate('candidates')}
            className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
          >
            查看全部候选人
            <Zap className="ml-1 h-4 w-4" />
          </button>
        </motion.div>
        
        {/* 自动化执行状态 */}
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center mb-4">
            <Zap className="h-5 w-5 text-amber-500 mr-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">自动化执行状态</h3>
          </div>
          
          <div className="flex items-center mb-4">
            <div className={`w-3 h-3 rounded-full mr-2 ${automationStatus.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {automationStatus.running ? '运行中' : '已停止'}
            </span>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">任务进度</span>
              <span className="font-medium">{automationStatus.completedTasks}/{automationStatus.taskCount}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-amber-500 h-2 rounded-full" 
                style={{ width: `${automationProgress}%` }}
              ></div>
            </div>
          </div>
          
          {/* AI个性化打招呼功能开关 */}
          <div className="mb-4 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center">
              <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium text-gray-800 dark:text-white">AI个性化打招呼</span>
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded">研发中</span>
            </div>
            <div className="relative">
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
          
          {automationStatus.nextScheduledTime && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              下次执行时间: {automationStatus.nextScheduledTime}
            </div>
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={onStartAutomation}
              disabled={automationStatus.running}
              className={`flex-1 text-sm py-2 rounded-lg flex items-center justify-center ${
                automationStatus.running 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
              }`}
            >
              <Play className="h-4 w-4 mr-1" />
              启动
            </button>
            
            <button
              onClick={onStopAutomation}
              disabled={!automationStatus.running}
              className={`flex-1 text-sm py-2 rounded-lg flex items-center justify-center ${
                !automationStatus.running 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
              }`}
            >
              <StopCircle className="h-4 w-4 mr-1" />
              停止
            </button>
          </div>
        </motion.div>
        
        {/* 快捷入口 */}
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center mb-4">
            <Zap className="h-5 w-5 text-indigo-500 mr-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">快捷入口</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('candidates')}
              className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm flex flex-col items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
            >
              <Users className="h-5 w-5 mb-1" />
              <span>候选人</span>
            </button>
            
            <button
              onClick={() => onNavigate('rules')}
              className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-sm flex flex-col items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <Settings className="h-5 w-5 mb-1" />
              <span>规则设置</span>
            </button>
            
            <button
              onClick={() => onNavigate('logs')}
              className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex flex-col items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <Book className="h-5 w-5 mb-1" />
              <span>操作日志</span>
            </button>
            
            <button
              onClick={() => onNavigate('ai-chat')}
              className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm flex flex-col items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-900/30"
            >
              <MessageSquare className="h-5 w-5 mb-1" />
              <span>AI对话</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default TaskCenterSection; 