"use client";

import React, { useEffect } from 'react';
import { useStore } from '../../store/store';

// 主题切换组件
const ThemeToggle: React.FC = () => {
  const { themeConfig, setThemeMode } = useStore();
  
  // 监听系统主题变化
  useEffect(() => {
    if (themeConfig.mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      };
      
      // 初始设置
      handleChange();
      
      // 监听变化
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      document.documentElement.classList.toggle('dark', themeConfig.mode === 'dark');
    }
  }, [themeConfig.mode]);
  
  return (
    <div className="relative inline-flex rounded-full p-1 bg-slate-200 dark:bg-slate-700 shadow-inner transition-colors">
      {/* 亮色主题按钮 */}
      <button
        onClick={() => setThemeMode('light')}
        className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all ${
          themeConfig.mode === 'light' 
            ? 'text-amber-600 bg-white shadow-sm' 
            : 'text-slate-500 hover:text-amber-500'
        }`}
        aria-label="亮色主题"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.844a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06 1.06l1.59-1.591a.75.75 0 00-1.06-1.06l-1.59 1.59z" />
        </svg>
      </button>
      
      {/* 系统主题按钮 */}
      <button
        onClick={() => setThemeMode('system')}
        className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all ${
          themeConfig.mode === 'system' 
            ? 'text-blue-600 bg-white shadow-sm dark:bg-slate-800 dark:text-blue-400' 
            : 'text-slate-500 hover:text-blue-500'
        }`}
        aria-label="系统主题"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 01-.53 1.28h-9a.75.75 0 01-.53-1.28l.621-.622a2.25 2.25 0 00.659-1.59V18h-3a3 3 0 01-3-3V5.25zm1.5 0v9.75c0 .83.67 1.5 1.5 1.5h13.5c.83 0 1.5-.67 1.5-1.5V5.25c0-.83-.67-1.5-1.5-1.5H5.25c-.83 0-1.5.67-1.5 1.5z" clipRule="evenodd" />
        </svg>
      </button>
      
      {/* 暗色主题按钮 */}
      <button
        onClick={() => setThemeMode('dark')}
        className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all ${
          themeConfig.mode === 'dark' 
            ? 'text-indigo-400 bg-slate-800 shadow-sm' 
            : 'text-slate-500 hover:text-indigo-500'
        }`}
        aria-label="暗色主题"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default ThemeToggle; 