"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/store';
import { MessageSquare } from 'lucide-react';

export default function AnimatedChatPanel() {
  const { activeModule, setActiveModule } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  
  // 检测模块变化并决定是否显示按钮
  useEffect(() => {
    // 确保初始加载和每次模块变化时都正确处理
    if (activeModule === 'ai-chat') {
      setIsVisible(false);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeModule]);
  
  // 处理点击事件 - 切换到AI对话模块
  const handleChatClick = () => {
    setIsVisible(false);
    setTimeout(() => {
      setActiveModule('ai-chat');
    }, 10);
  };

  // 如果在AI聊天模块，根本不渲染组件
  if (activeModule === 'ai-chat') {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (activeModule as string) !== 'ai-chat' && (
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
  );
} 