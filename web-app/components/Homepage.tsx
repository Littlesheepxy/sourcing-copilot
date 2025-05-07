"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Users, FilePlus, Settings, Bot } from "lucide-react";
import { useStore } from "../store/store";

// 卡片容器动画
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// 卡片项动画
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Homepage() {
  const { setActiveModule } = useStore();
  
  // 处理导航点击
  const handleNavClick = (module: 'candidates' | 'rules' | 'logs' | 'ai-chat' | 'settings') => {
    setActiveModule(module);
  };

  return (
    <div className="space-y-8 py-6 px-4">
      <section>
        <h1 className="text-3xl font-bold mb-4">仪表盘</h1>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          
          {/* 今日活动卡片 */}
          <motion.div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            variants={cardVariants}
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">今日活动</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">已扫描简历</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">已筛选候选人</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">已打招呼</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-3">
              <button 
                onClick={() => handleNavClick('logs')} 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
              >
                查看详细日志
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </motion.div>
          
          {/* 候选人统计卡片 */}
          <motion.div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            variants={cardVariants}
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">候选人统计</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">已收集</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">匹配规则</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">收藏人选</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-3">
              <button 
                onClick={() => handleNavClick('candidates')} 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
              >
                管理候选人
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </motion.div>
          
          {/* 规则状态卡片 */}
          <motion.div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            variants={cardVariants}
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">规则状态</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">有效规则</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">自动模式</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">已关闭</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">上次修改</span>
                  <span className="font-medium">-</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-3">
              <button 
                onClick={() => handleNavClick('rules')} 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
              >
                管理规则
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">快速导航</h2>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* 快速导航卡片 */}
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <button 
              onClick={() => handleNavClick('candidates')} 
              className="w-full flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-3">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">候选人管理</h3>
              </div>
            </button>
          </motion.div>
          
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <button 
              onClick={() => handleNavClick('rules')} 
              className="w-full flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3">
                <FilePlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">规则设置</h3>
              </div>
            </button>
          </motion.div>
          
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <button 
              onClick={() => handleNavClick('logs')} 
              className="w-full flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="rounded-full p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-3">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">操作日志</h3>
              </div>
            </button>
          </motion.div>
          
          <motion.div
            variants={cardVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <button 
              onClick={() => handleNavClick('ai-chat')} 
              className="w-full flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <div className="rounded-full p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mr-3">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">AI 对话</h3>
              </div>
            </button>
          </motion.div>
        </motion.div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">操作指南</h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <ol className="list-decimal pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>在<strong>规则设置</strong>页面创建筛选条件，支持复杂逻辑组合</li>
            <li>使用<strong>AI 对话</strong>智能助手获取招聘建议和自动生成规则</li>
            <li>在Boss直聘网站上安装并使用Chrome扩展程序进行自动化操作</li>
            <li>在<strong>操作日志</strong>页面查看系统执行记录和统计数据</li>
            <li>在<strong>候选人管理</strong>页面整理和跟踪感兴趣的候选人</li>
          </ol>
        </div>
      </section>
    </div>
  );
} 