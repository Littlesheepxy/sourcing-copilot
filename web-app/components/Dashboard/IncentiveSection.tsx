"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Award, Medal, Crown, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";

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

type RankingData = {
  industry: string;
  ranking: number;
  totalCompanies: number;
  change: number; // 正数表示上升，负数表示下降
};

type TrendItem = {
  name: string;
  value: number | string;
  change: number; // 百分比变化
};

type AchievementBadge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progress?: {
    current: number;
    total: number;
  };
};

type IncentiveSectionProps = {
  rankingData: RankingData;
  trendItems: TrendItem[];
  achievements: AchievementBadge[];
};

const IncentiveSection: React.FC<IncentiveSectionProps> = ({
  rankingData,
  trendItems,
  achievements
}) => {
  // 获取已解锁的成就数量
  const unlockedCount = achievements.filter(badge => badge.unlocked).length;
  
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">激励与数据</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 行业排名 */}
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Crown className="h-5 w-5 text-amber-500 mr-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">行业排名</h3>
            </div>
            
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{rankingData.industry} 行业</p>
              <div className="flex items-end justify-center">
                <span className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                  #{rankingData.ranking}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 mb-2">
                  / {rankingData.totalCompanies}
                </span>
              </div>
              
              <div className="flex items-center justify-center mt-2">
                {rankingData.change > 0 ? (
                  <>
                    <ChevronUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">上升 {rankingData.change} 位</span>
                  </>
                ) : rankingData.change < 0 ? (
                  <>
                    <ChevronDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-500">下降 {Math.abs(rankingData.change)} 位</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">位置不变</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-3">
            <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
              查看完整排名
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </motion.div>
        
        {/* 趋势榜单 */}
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">招聘效率趋势</h3>
            </div>
            
            <div className="space-y-3">
              {trendItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">{item.value}</span>
                    {item.change > 0 ? (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                        +{item.change}%
                      </span>
                    ) : item.change < 0 ? (
                      <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded">
                        {item.change}%
                      </span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
                        0%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-3">
            <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
              查看趋势详情
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </motion.div>
        
        {/* 成就徽章 */}
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Award className="h-5 w-5 text-purple-500 mr-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">成就徽章</h3>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              已解锁 {unlockedCount}/{achievements.length} 个徽章
            </p>
            
            <div className="grid grid-cols-3 gap-2">
              {achievements.slice(0, 6).map((badge) => (
                <div 
                  key={badge.id}
                  className={`relative p-2 rounded-lg flex flex-col items-center justify-center ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                  title={badge.name + (badge.unlocked ? '' : ` - ${badge.description}`)}
                >
                  <div className={`text-lg mb-1 ${badge.unlocked ? 'text-amber-500' : 'text-gray-400'}`}>
                    {badge.icon}
                  </div>
                  <span className={`text-xs truncate w-full text-center ${
                    badge.unlocked ? 'text-amber-800 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {badge.name}
                  </span>
                  
                  {!badge.unlocked && badge.progress && (
                    <div className="w-full mt-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                      <div 
                        className="bg-amber-400 h-1 rounded-full" 
                        style={{ width: `${(badge.progress.current / badge.progress.total) * 100}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-3">
            <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
              查看全部徽章
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IncentiveSection; 