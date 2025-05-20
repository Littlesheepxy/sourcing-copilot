"use client";

import React from "react";
import { Clock, FileText, Brain } from "lucide-react";
import { motion } from "framer-motion";

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

type SummarySectionProps = {
  timeStats: {
    savedHours: number;
    efficiency: number;
  };
  resumeStats: {
    total: number;
    processed: number;
    greeted: number;
  };
  aiSuggestion: string;
};

const SummarySection: React.FC<SummarySectionProps> = ({
  timeStats,
  resumeStats,
  aiSuggestion
}) => {
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* 节省时间统计 */}
      <motion.div 
        className="bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 p-6 rounded-xl border border-red-200 dark:border-red-800 shadow-md hover:shadow-lg transition-shadow duration-200"
        variants={itemVariants}
      >
        <div className="flex items-start">
          <div className="rounded-full p-2 bg-red-200 dark:bg-red-800 text-red-600 dark:text-red-400 mr-3">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white">🧠 AI节省时间</h3>
            <div className="mt-2 space-y-1">
              <p className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400">
                {timeStats.savedHours}<span className="text-lg ml-1">小时</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                效率提升 <span className="font-medium text-red-600 dark:text-red-400">{timeStats.efficiency}%</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 简历获取数 */}
      <motion.div 
        className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 p-6 rounded-xl border border-green-200 dark:border-green-800 shadow-md hover:shadow-lg transition-shadow duration-200"
        variants={itemVariants}
      >
        <div className="flex items-start">
          <div className="rounded-full p-2 bg-green-200 dark:bg-green-800 text-green-600 dark:text-green-400 mr-3">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white">📄 简历获取</h3>
            <div className="mt-2 space-y-1">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {resumeStats.total}<span className="text-lg ml-1">份</span>
              </p>
              <div className="flex text-sm text-gray-600 dark:text-gray-300 space-x-2">
                <span>已处理: <span className="font-medium text-green-600 dark:text-green-400">{resumeStats.processed}</span></span>
                <span>·</span>
                <span>已打招呼: <span className="font-medium text-green-600 dark:text-green-400">{resumeStats.greeted}</span></span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI效率建议 */}
      <motion.div 
        className="bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 p-6 rounded-xl border border-purple-200 dark:border-purple-800 shadow-md hover:shadow-lg transition-shadow duration-200"
        variants={itemVariants}
      >
        <div className="flex items-start">
          <div className="rounded-full p-2 bg-purple-200 dark:bg-purple-800 text-purple-600 dark:text-purple-400 mr-3">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 dark:text-white">💡 AI效率建议</h3>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 font-medium">
              {aiSuggestion}
            </p>
            <button className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline">
              查看详情 →
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SummarySection; 