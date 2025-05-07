"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/store';

// 临时声明Chrome类型
declare const chrome: {
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => void;
  }
};

const ModeSwitcher = () => {
  const { mode, toggleMode } = useStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化时从Chrome存储中获取模式
  useEffect(() => {
    if (isClient && typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'getMode' }, (response) => {
        if (response.mode) {
          useStore.setState({ mode: response.mode });
        }
      });
    }
  }, [isClient]);

  const handleToggle = () => {
    toggleMode();
    
    // 同步更新到Chrome存储
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'toggleMode' });
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex items-center">
      <span className={`mr-2 text-sm font-medium ${mode === 'calibration' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
        校准模式
      </span>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          mode === 'automatic' 
            ? 'bg-green-500 focus:ring-green-500' 
            : 'bg-blue-500 focus:ring-blue-500'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            mode === 'automatic' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`ml-2 text-sm font-medium ${mode === 'automatic' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        自动模式
      </span>
    </div>
  );
};

export default ModeSwitcher; 