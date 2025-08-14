"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import AIChat from './index';

export default function AnimatedChatPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 检测路由变化并决定是否显示按钮
  useEffect(() => {
    // 确保初始加载和每次路由变化时都正确处理
    if (pathname === '/ai-rules') {
      setIsVisible(false);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [pathname]);
  
  // 处理点击事件 - 打开全屏AI助手
  const handleChatClick = () => {
    setIsModalOpen(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 如果在AI智能筛选页面，根本不渲染组件
  if (pathname === '/ai-rules') {
    return null;
  }

  return (
    <>
      {/* 浮动按钮 */}
      <AnimatePresence mode="wait">
        {isVisible && pathname !== '/ai-rules' && (
          <motion.div 
            className="fixed bottom-8 z-50 left-1/2 -translate-x-1/2 md:left-[calc(50%+8rem/2)]" 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* 渐变背景按钮 */}
            <motion.div
              className="gradient-border px-5 py-3 rounded-full cursor-pointer flex items-center justify-between shadow-lg"
              onClick={handleChatClick}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-2">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-white">AI智能助手</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 全屏AI助手模态框 */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* 背景遮罩 */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            />
            
            {/* 模态框内容 */}
            <motion.div
              className="relative w-full h-full max-w-6xl max-h-[90vh] mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* 模态框头部 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI智能助手</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCloseModal}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* AI助手内容区域 */}
              <div className="flex-1 p-6 h-[calc(100%-80px)]">
                <AIChat />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 