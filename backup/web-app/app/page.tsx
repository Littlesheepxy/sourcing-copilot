"use client";

import React from "react";
import AppLayout from "../components/layout/AppLayout";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Users, FilePlus, Settings, Bot } from "lucide-react";

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

export default function Home() {
  return (
    <AppLayout>
      <div className="space-y-8">
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
                <Link 
                  href="/logs" 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                >
                  查看详细日志
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
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
                <Link 
                  href="/candidates" 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                >
                  管理候选人
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
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
                <Link 
                  href="/rules" 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                >
                  管理规则
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
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
              <Link href="/candidates" className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-3">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">候选人管理</h3>
                </div>
              </Link>
            </motion.div>
            
            <motion.div
              variants={cardVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/rules" className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3">
                  <FilePlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">规则设置</h3>
                </div>
              </Link>
            </motion.div>
            
            <motion.div
              variants={cardVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/logs" className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                <div className="rounded-full p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-3">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">操作日志</h3>
                </div>
              </Link>
            </motion.div>
            
            <motion.div
              variants={cardVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/ai-chat" className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                <div className="rounded-full p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mr-3">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">AI 对话</h3>
                </div>
              </Link>
            </motion.div>
          </motion.div>
        </section>
        
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 shadow-lg text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl md:text-2xl font-bold mb-2">准备好开始了吗？</h2>
                <p className="text-blue-100">设置您的筛选规则，自动化您的Boss直聘sourcing流程</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href="/settings" 
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-blue-700 hover:bg-blue-50 font-medium shadow"
                >
                  <Settings className="mr-2 h-5 w-5" />
                  系统设置
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </div>
    </AppLayout>
  );
} 