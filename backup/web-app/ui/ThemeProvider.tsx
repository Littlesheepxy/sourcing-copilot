"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useStore } from '../../store/store';

// 主题上下文类型
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setPrimaryColor: (color: string) => void;
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  primaryColor: '#3182ce',
  setTheme: () => {},
  setPrimaryColor: () => {}
});

// 主题提供者组件
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeConfig, setThemeMode, setPrimaryColor } = useStore();
  
  // 应用主题变化
  useEffect(() => {
    // 添加CSS变量到文档根元素
    document.documentElement.style.setProperty('--primary-color', themeConfig.primaryColor);
    document.documentElement.style.setProperty('--primary-light', `${themeConfig.primaryColor}33`);
    
    // 处理系统主题还是特定主题
    if (themeConfig.mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      
      // 监听系统主题变化
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      document.documentElement.classList.toggle('dark', themeConfig.mode === 'dark');
    }
  }, [themeConfig.mode, themeConfig.primaryColor]);
  
  // 向下传递主题上下文
  const contextValue = {
    theme: themeConfig.mode,
    primaryColor: themeConfig.primaryColor,
    setTheme: setThemeMode,
    setPrimaryColor
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// 自定义钩子用于访问主题
export const useTheme = () => useContext(ThemeContext); 