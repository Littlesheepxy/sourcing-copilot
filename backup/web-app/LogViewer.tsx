"use client";

import React, { useState, useEffect } from 'react';

// 临时声明Chrome类型
declare const chrome: {
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => void;
  }
};

// 日志项类型
interface LogItem {
  timestamp: string;
  action: string;
  details: string;
}

const LogViewer = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [filter, setFilter] = useState('');
  const [isClient, setIsClient] = useState(false);
  
  // 用于检测客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 从Chrome存储加载日志
  useEffect(() => {
    if (isClient && typeof chrome !== 'undefined' && chrome.runtime) {
      // 初始加载日志
      loadLogs();
      
      // 设置定时刷新（每5秒刷新一次）
      const intervalId = setInterval(loadLogs, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [isClient]);
  
  // 加载日志函数
  const loadLogs = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'getLogs' }, (response) => {
        if (response.logs) {
          setLogs(response.logs);
        }
      });
    }
  };
  
  // 格式化日期时间
  const formatDateTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date);
    } catch (error) {
      return timestamp;
    }
  };
  
  // 根据操作类型获取背景颜色样式
  const getActionColor = (action: string) => {
    switch (action) {
      case '自动打招呼':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case '人工标记':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'AI分析':
      case 'AI分析结果':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // 筛选日志
  const filteredLogs = logs.filter(log => {
    if (!filter) return true;
    
    const lowerFilter = filter.toLowerCase();
    return (
      log.action.toLowerCase().includes(lowerFilter) ||
      log.details.toLowerCase().includes(lowerFilter)
    );
  });
  
  // 清空日志
  const handleClearLogs = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'clearLogs' }, () => {
        setLogs([]);
      });
    }
  };
  
  if (!isClient) return null;
  
  return (
    <div className="space-y-4">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">操作日志</h2>
          <div className="flex space-x-2">
            <button
              onClick={loadLogs}
              className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 rounded"
            >
              刷新
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1 text-sm border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 rounded"
            >
              清空
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索日志..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          />
        </div>
        
        <div className="overflow-y-auto max-h-96">
          {filteredLogs.length > 0 ? (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs px-2 py-1 rounded ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{log.details}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500">
              {filter ? '没有匹配的日志记录' : '暂无日志记录'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer; 