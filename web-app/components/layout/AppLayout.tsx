"use client";

import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import AnimatedChatPanel from '../AIChat/AnimatedChatPanel';
import ContentPanel from './ContentPanel';
import { useStore } from '../../store/store';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function AppLayout() {
  const { themeConfig, showAIChat, setShowAIChat, setActiveModule } = useStore();
  const pathname = usePathname();
  
  // 初始加载时根据路径设置活动模块，但不会在侧边栏导航时干扰
  useEffect(() => {
    // 只在应用首次加载或从外部直接访问URL时设置活动模块
    if (typeof window !== 'undefined' && window.history.state?.idx === 0) {
      const pathToModule = {
        '/': 'home',
        '/candidates': 'candidates',
        '/rules': 'ai-rules', // 将 rules 路径映射到 ai-rules 模块
        '/simple-rules': 'ai-rules', // 将 simple-rules 也映射到 ai-rules 模块
        '/ai-rules': 'ai-rules', // AI智能筛选路径映射
        '/logs': 'logs',
        '/settings': 'settings',
        '/ai-chat': 'ai-chat'
      } as const;
      
      const module = pathToModule[pathname as keyof typeof pathToModule] || 'home';
      setActiveModule(module);
    }
  }, []);
  
  // 主题模式处理
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (themeConfig.mode === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(themeConfig.mode);
    }
  }, [themeConfig.mode]);
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={useStore.getState().aiChatLoading ? 'loading' : 'content'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3
              }}
            >
              <ContentPanel />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      
      {/* AI聊天面板遮罩层 - 只在非AI聊天页面显示 */}
      <AnimatePresence>
        {showAIChat && pathname !== '/ai-chat' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowAIChat(false)}
          />
        )}
      </AnimatePresence>
      
      {/* 底部聊天面板，组件内部处理显示/隐藏逻辑 */}
      <AnimatedChatPanel />
    </div>
  );
} 