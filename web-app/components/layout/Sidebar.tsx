"use client";

import React, { useState } from 'react';
import { useStore } from '../../store/store';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { ThemeSwitcher } from '../theme/theme-switcher';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Bot,
  Clock,
  Brain
} from 'lucide-react';

// 侧边栏导航项
const navItems = [
  { 
    name: '仪表盘', 
    module: 'home', 
    path: '/',
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  { 
    name: 'AI智能筛选', 
    module: 'ai-rules', 
    path: '/ai-rules',
    icon: <Brain className="w-5 h-5" />,
    highlight: true // 标记为重点功能
  },
  // 暂时移除AI对话选项
  // { 
  //   name: 'AI 对话', 
  //   module: 'ai-chat', 
  //   path: '/ai-chat',
  //   icon: <MessageSquare className="w-5 h-5" />
  // },
  { 
    name: 'AI 助手沟通记录', 
    module: 'ai-assistant-chat', 
    path: '/ai-assistant-chat',
    icon: <Bot className="w-5 h-5" />,
    beta: true
  },
  { 
    name: '已读未回自动回访', 
    module: 'auto-followup', 
    path: '/auto-followup',
    icon: <Clock className="w-5 h-5" />,
    beta: true
  },
  { 
    name: '候选人管理', 
    module: 'candidates', 
    path: '/candidates',
    icon: <Users className="w-5 h-5" />
  },
  { 
    name: '操作日志', 
    module: 'logs', 
    path: '/logs',
    icon: <ClipboardList className="w-5 h-5" />
  },
  { 
    name: '设置', 
    module: 'settings', 
    path: '/settings',
    icon: <Settings className="w-5 h-5" />
  }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { activeModule, setActiveModule } = useStore();
  
  // 只更新活动模块状态，不进行页面导航
  const handleNavClick = (module: string) => {
    setActiveModule(module as any);
  };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? '4rem' : '16rem' }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800"
    >
      {/* 侧边栏头部 */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'Arial, sans-serif', fontStyle: 'italic' }}>SC</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Sourcing Copilot</h1>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm" style={{ fontFamily: 'Arial, sans-serif', fontStyle: 'italic' }}>SC</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.module}>
              <button
                onClick={() => handleNavClick(item.module)}
                className={cn(
                  "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 relative",
                  activeModule === item.module
                    ? item.highlight 
                      ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-300"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                    : item.highlight
                      ? "text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:text-purple-400 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60"
                )}
              >
                {/* AI筛选的特殊标识 */}
                {item.highlight && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                )}
                
                <motion.span 
                  className="flex-shrink-0"
                  whileHover={{ rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.icon}
                </motion.span>
                {!collapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-3 flex items-center"
                  >
                    {item.name}
                    {item.highlight && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                        AI
                      </span>
                    )}
                    {item.beta && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded">研发中</span>
                    )}
                  </motion.span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* 侧边栏底部 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && <span className="text-xs text-gray-500 dark:text-gray-400">版本 1.0.0</span>}
          <ThemeSwitcher />
        </div>
      </div>
    </motion.aside>
  );
} 