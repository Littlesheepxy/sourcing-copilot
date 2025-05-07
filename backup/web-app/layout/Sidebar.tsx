"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '../../store/store';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { ThemeSwitcher } from '../theme/theme-switcher';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  ClipboardList, 
  Settings, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

// 侧边栏导航项
const navItems = [
  { 
    name: '仪表盘', 
    path: '/', 
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  { 
    name: '规则设置', 
    path: '/rules', 
    icon: <ClipboardList className="w-5 h-5" />
  },
  { 
    name: 'AI 对话', 
    path: '/ai-chat', 
    icon: <MessageSquare className="w-5 h-5" />
  },
  { 
    name: '候选人管理', 
    path: '/candidates', 
    icon: <Users className="w-5 h-5" />
  },
  { 
    name: '操作日志', 
    path: '/logs', 
    icon: <ClipboardList className="w-5 h-5" />
  },
  { 
    name: '设置', 
    path: '/settings', 
    icon: <Settings className="w-5 h-5" />
  }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { setShowAIChat } = useStore();
  
  const handleAIChatClick = (e: React.MouseEvent) => {
    // 直接导航到AI对话页面，无需额外逻辑
    router.push('/ai-chat');
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
            <li key={item.path}>
              {item.path === '/ai-chat' ? (
                <a
                  href="#"
                  onClick={handleAIChatClick}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    pathname === item.path
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60"
                  )}
                >
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
                      className="ml-3"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </a>
              ) : (
                <Link
                  href={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    pathname === item.path
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60"
                  )}
                >
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
                      className="ml-3"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </Link>
              )}
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