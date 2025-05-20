"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, LightbulbIcon, HelpCircle, ArrowRight, ExternalLink } from "lucide-react";

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

// 小技巧数据类型
type Tip = {
  id: string;
  title: string;
  content: string;
};

// FAQ数据类型
type FAQ = {
  id: string;
  question: string;
  answer: string;
};

type SupportSectionProps = {
  tips: Tip[];
  faqs: FAQ[];
  onContactSupport: () => void;
};

const SupportSection: React.FC<SupportSectionProps> = ({
  tips,
  faqs,
  onContactSupport
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  // 获取当前展示的小技巧
  const currentTip = tips[currentTipIndex];
  
  // 切换到下一个小技巧
  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };
  
  // 切换到上一个小技巧
  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };
  
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">辅助支持</h2>
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 一键联系客服 */}
        <motion.div 
          className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center mb-4">
            <MessageCircle className="h-5 w-5 text-indigo-500 mr-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">联系客服</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            遇到问题或需要帮助？我们的客服团队随时为您提供支持。
          </p>
          
          <button 
            onClick={onContactSupport}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            联系客服
          </button>
          
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
            <span>客服工作时间: 09:00-18:00</span>
            <span>平均响应时间: &lt; 10分钟</span>
          </div>
        </motion.div>
        
        {/* 使用小技巧 */}
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center mb-4">
            <LightbulbIcon className="h-5 w-5 text-amber-500 mr-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">使用小技巧</h3>
          </div>
          
          <div className="mb-4 relative">
            <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">{currentTip.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{currentTip.content}</p>
            </div>
            
            <div className="flex justify-between mt-2">
              <button 
                onClick={prevTip} 
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                上一条
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentTipIndex + 1}/{tips.length}
              </span>
              <button 
                onClick={nextTip} 
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                下一条
              </button>
            </div>
          </div>
          
          <a 
            href="#" 
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
          >
            查看全部技巧
            <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </motion.div>
        
        {/* 常见问题 */}
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          variants={itemVariants}
        >
          <div className="flex items-center mb-4">
            <HelpCircle className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">常见问题</h3>
          </div>
          
          <div className="space-y-3 mb-4">
            {faqs.slice(0, 3).map((faq) => (
              <details key={faq.id} className="text-sm">
                <summary className="font-medium text-gray-700 dark:text-gray-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                  {faq.question}
                </summary>
                <p className="mt-2 pl-4 text-gray-600 dark:text-gray-300 text-xs">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
          
          <a 
            href="#" 
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
          >
            查看全部问题
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default SupportSection; 