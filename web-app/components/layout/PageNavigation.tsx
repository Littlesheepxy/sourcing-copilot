"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeSwitcher } from '../theme/theme-switcher';

const PageNavigation = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 mr-8">
              Boss直聘 <span className="text-gray-900 dark:text-gray-100">Sourcing智能助手</span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/rules" 
                className={`text-sm font-medium ${isActive('/rules') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                规则管理
              </Link>
              <Link 
                href="/ai-chat" 
                className={`text-sm font-medium ${isActive('/ai-chat') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                AI对话助手
              </Link>
              <Link 
                href="/candidates" 
                className={`text-sm font-medium ${isActive('/candidates') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                候选人管理
              </Link>
              <Link 
                href="/logs" 
                className={`text-sm font-medium ${isActive('/logs') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                操作日志
              </Link>
              <Link 
                href="/settings" 
                className={`text-sm font-medium ${isActive('/settings') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                系统设置
              </Link>
            </nav>
          </div>
          
          <ThemeSwitcher />
        </div>
      </header>
      
      {/* 移动端导航菜单 */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex whitespace-nowrap px-4">
          <Link 
            href="/rules" 
            className={`px-4 py-3 text-sm font-medium border-b-2 ${isActive('/rules') ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`}
          >
            规则管理
          </Link>
          <Link 
            href="/ai-chat" 
            className={`px-4 py-3 text-sm font-medium border-b-2 ${isActive('/ai-chat') ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`}
          >
            AI对话
          </Link>
          <Link 
            href="/candidates" 
            className={`px-4 py-3 text-sm font-medium border-b-2 ${isActive('/candidates') ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`}
          >
            候选人
          </Link>
          <Link 
            href="/logs" 
            className={`px-4 py-3 text-sm font-medium border-b-2 ${isActive('/logs') ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`}
          >
            日志
          </Link>
          <Link 
            href="/settings" 
            className={`px-4 py-3 text-sm font-medium border-b-2 ${isActive('/settings') ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-300'}`}
          >
            设置
          </Link>
        </div>
      </div>
      
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
      
      <footer className="bg-white dark:bg-gray-800 py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-gray-600 dark:text-gray-400">
          <p>Boss直聘 Sourcing智能助手 &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default PageNavigation; 